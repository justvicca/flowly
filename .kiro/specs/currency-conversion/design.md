# Design Document: Currency Conversion

## Overview

This feature extends Flowly's wallet system to support per-wallet currencies and real-time conversion. Currently, all wallets are implicitly treated as being in the user's display currency, which produces incorrect totals when a user holds accounts in different currencies.

The solution introduces:
1. An optional `moeda` field on the `Wallet` type (defaults to `'BRL'` for backward compatibility).
2. A client-side `exchangeRateService` that fetches and caches rates from the [Frankfurter API](https://api.frankfurter.app).
3. A `useExchangeRates` React hook that drives data fetching and exposes loading/error state.
4. Updated `WalletCard` and `WalletList` components that display per-wallet currencies and a converted total.
5. A currency selector in the Add Wallet form.

No backend changes are required. All exchange rate data is fetched client-side from the public, CORS-enabled Frankfurter API (no API key needed, rates updated daily by the ECB).

---

## Architecture

```mermaid
graph TD
    subgraph UI Layer
        WL[WalletList]
        WC[WalletCard]
        AWF[Add Wallet Form]
    end

    subgraph Hook Layer
        UER[useExchangeRates]
    end

    subgraph Service Layer
        ERS[exchangeRateService\nfetchRates / convertAmount]
        RC[(Rate Cache\nMap<string, Record<string,number>>)]
    end

    subgraph External
        FA[Frankfurter API\nhttps://api.frankfurter.app]
    end

    subgraph Data Layer
        PC[PreferencesContext\nmoeda.codigo = Display_Currency]
        REPO[IFlowlyRepository\nadicionarCarteira(userId, nome, moeda?)]
        WT[Wallet type\n{ nome, saldo, moeda? }]
    end

    WL --> UER
    WL --> WC
    WL --> AWF
    UER --> ERS
    ERS --> RC
    ERS --> FA
    WL --> PC
    AWF --> REPO
    REPO --> WT
```

Data flows in one direction: `PreferencesContext` provides the display currency → `WalletList` passes it to `useExchangeRates` → the hook calls `exchangeRateService` → the service hits the Frankfurter API (or returns from cache) → rates flow back up to `WalletList` and down to each `WalletCard`.

---

## Components and Interfaces

### `src/types/flowly.ts` — Wallet type

```typescript
export interface Wallet {
  nome: string;
  saldo: number;
  moeda?: string; // ISO 4217 code, defaults to 'BRL' when absent
}
```

The field is optional to preserve backward compatibility with persisted data that has no `moeda` key.

---

### `src/services/exchangeRateService.ts`

Module-level cache keyed by display currency. The cache is session-scoped (lives as long as the module is loaded).

```typescript
// Module-level cache: displayCurrency → { walletCurrency: rateToDisplay }
const rateCache = new Map<string, Record<string, number>>();

/**
 * Fetches exchange rates from Frankfurter API.
 * `from` is the Display_Currency; `to` is the list of distinct Wallet_Currencies.
 * Returns rates where rate[walletCurrency] converts 1 unit of walletCurrency → displayCurrency.
 *
 * Example: displayCurrency='EUR', walletCurrencies=['BRL','USD']
 *   GET /latest?from=EUR&to=BRL,USD → { rates: { BRL: 6.2, USD: 1.08 } }
 *   Meaning: 1 EUR = 6.2 BRL, so to convert BRL→EUR: amount / 6.2
 *
 * The service stores rates as-is from the API (base = displayCurrency).
 * Callers use convertAmount() which handles the inversion.
 */
async function fetchRates(
  displayCurrency: string,
  walletCurrencies: string[]
): Promise<Record<string, number>>

/**
 * Converts `amount` from `fromCurrency` to `toCurrency` using the provided rates.
 * `rates` must have been fetched with `from=toCurrency` (i.e., base = toCurrency).
 *
 * If fromCurrency === toCurrency, returns amount unchanged.
 * Otherwise: convertedAmount = amount / rates[fromCurrency]
 */
function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number
```

**Rate interpretation note:** The Frankfurter API always returns rates relative to the `from` parameter. When we call `?from=EUR&to=BRL`, the response is `{ base: 'EUR', rates: { BRL: 6.2 } }`, meaning 1 EUR = 6.2 BRL. To convert a BRL amount to EUR: `brlAmount / 6.2`. The `convertAmount` function encapsulates this inversion.

**Cache invalidation:** The cache is keyed by `displayCurrency`. When the display currency changes, `fetchRates` is called with a new key, so a fresh request is made automatically. The old entry remains in the cache (harmless, small memory footprint).

---

### `src/hooks/useExchangeRates.ts`

```typescript
interface UseExchangeRatesResult {
  rates: Record<string, number> | null;
  loading: boolean;
  error: string | null;
}

function useExchangeRates(
  displayCurrency: string,
  walletCurrencies: string[]
): UseExchangeRatesResult
```

**Behavior:**
- On mount and whenever `displayCurrency` changes, determines the set of wallet currencies that differ from `displayCurrency`.
- If all wallets share the display currency (empty diff set), skips the fetch entirely and returns `{ rates: null, loading: false, error: null }`.
- Otherwise calls `fetchRates(displayCurrency, diffCurrencies)` and updates state accordingly.
- Uses `useEffect` with `[displayCurrency]` as the dependency (wallet currencies are derived from the wallet list which is stable within a render).

---

### `src/components/wallets/WalletCard.tsx`

New props:

```typescript
interface WalletCardProps {
  wallet: Wallet;
  rates?: Record<string, number> | null;      // rates from useExchangeRates
  displayCurrency?: string;                    // moeda.codigo from PreferencesContext
}
```

**Rendering logic:**
- Primary balance: always formatted in `wallet.moeda ?? 'BRL'`.
- Secondary line: shown only when `wallet.moeda !== displayCurrency` AND `rates` is non-null AND `rates[wallet.moeda]` exists.
- Secondary value: `convertAmount(wallet.saldo, walletMoeda, displayCurrency, rates)` formatted in `displayCurrency`.

---

### `src/components/wallets/WalletList.tsx`

Updated props:

```typescript
interface WalletListProps {
  carteiras: Wallet[];
  onAdicionarCarteira: (nome: string, moeda: string) => Promise<void>;
  // saldoTotal prop removed — WalletList now computes the converted total internally
}
```

**Responsibilities:**
- Reads `moeda.codigo` from `PreferencesContext` as `displayCurrency`.
- Derives `walletCurrencies` from `carteiras.map(w => w.moeda ?? 'BRL')`.
- Calls `useExchangeRates(displayCurrency, walletCurrencies)`.
- Computes `convertedTotal`: sum of `convertAmount(w.saldo, w.moeda ?? 'BRL', displayCurrency, rates)` for each wallet.
- Shows loading spinner while `loading === true`.
- Shows error message while `error !== null`.
- Passes `rates` and `displayCurrency` down to each `WalletCard`.

---

### Add Wallet Form (inside `WalletList`)

New state: `const [moedaNova, setMoedaNova] = useState('BRL')`.

The form gains a `<select>` element populated from `MOEDAS` (imported from `PreferencesContext`). On submit, calls `onAdicionarCarteira(nome, moedaNova)`.

---

### `src/repository/IFlowlyRepository.ts`

```typescript
adicionarCarteira(userId: string, nome: string, moeda?: string): Promise<Wallet>;
```

All three implementations (`FirebaseFlowlyRepository`, `LocalStorageFlowlyRepository`, `MockFlowlyRepository`) are updated to accept and persist the optional `moeda` parameter, defaulting to `'BRL'` when absent.

---

## Data Models

### Wallet (updated)

| Field  | Type     | Required | Default | Description                        |
|--------|----------|----------|---------|------------------------------------|
| `nome` | `string` | Yes      | —       | Wallet display name                |
| `saldo`| `number` | Yes      | —       | Current balance in wallet currency |
| `moeda`| `string` | No       | `'BRL'` | ISO 4217 currency code             |

### Exchange Rate Cache Entry

```
Map<displayCurrency: string, rates: Record<walletCurrency: string, number>>
```

Where `rates[walletCurrency]` is the number of `walletCurrency` units equal to 1 `displayCurrency` unit (i.e., the Frankfurter API response with `from=displayCurrency`).

### Frankfurter API Response Shape

```typescript
interface FrankfurterResponse {
  base: string;           // the `from` currency
  date: string;           // rate date (YYYY-MM-DD)
  rates: Record<string, number>; // { [toCurrency]: rate }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Wallet currency default

*For any* wallet object that has no `moeda` field (or `moeda` is `undefined`), the effective currency used for display and conversion SHALL be `'BRL'`.

**Validates: Requirements 1.2, 6.1**

---

### Property 2: Repository default currency on creation

*For any* wallet name, calling `adicionarCarteira(userId, nome)` without a `moeda` argument SHALL result in a persisted wallet where `moeda === 'BRL'`.

**Validates: Requirements 1.4, 6.3**

---

### Property 3: Form submits selected currency

*For any* currency code selected from `MOEDAS`, submitting the Add Wallet Form SHALL invoke `onAdicionarCarteira` with that exact currency code as the second argument.

**Validates: Requirements 2.3**

---

### Property 4: WalletCard primary balance uses wallet currency

*For any* wallet with any `moeda` value, the primary balance rendered by `WalletCard` SHALL be formatted using the wallet's own currency code, not the display currency.

**Validates: Requirements 3.1**

---

### Property 5: Secondary line presence is determined by currency match

*For any* wallet and display currency combination:
- If `wallet.moeda !== displayCurrency` AND rates are available, a secondary converted line SHALL be present.
- If `wallet.moeda === displayCurrency`, no secondary converted line SHALL be present.

**Validates: Requirements 3.2, 3.3**

---

### Property 6: Exchange rate cache idempotence

*For any* display currency, calling `fetchRates` a second time with the same display currency SHALL return the cached result without making a new network request (i.e., the underlying `fetch` is called exactly once per display currency per session).

**Validates: Requirements 4.2, 5.6**

---

### Property 7: Conversion round-trip

*For any* positive amount and any two distinct currency codes `A` and `B` where `rates[A]` is defined (with base `B`), converting the amount from `A` to `B` and then back from `B` to `A` SHALL produce a value within `0.01` of the original amount.

Formally: `|convertAmount(convertAmount(x, A, B, rates), B, A, rates) - x| < 0.01`

**Validates: Requirements 4.6**

---

### Property 8: No fetch when all wallets share display currency

*For any* list of wallets where every wallet's effective currency equals the display currency, `useExchangeRates` SHALL NOT trigger a network request and SHALL return `{ rates: null, loading: false, error: null }`.

**Validates: Requirements 6.2**

---

### Property 9: Converted total correctness

*For any* list of wallets all sharing the display currency, the total displayed by `WalletList` SHALL equal the arithmetic sum of all `wallet.saldo` values.

**Validates: Requirements 5.1**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Frankfurter API network failure | `fetchRates` rejects; `useExchangeRates` sets `error` string; `WalletList` shows error message; each `WalletCard` shows primary balance only |
| Frankfurter API returns unexpected shape | `fetchRates` rejects with parse error; same error path as above |
| `wallet.moeda` is an unrecognized currency code | `convertAmount` receives `undefined` rate; returns `NaN`; `WalletCard` omits secondary line when converted value is not finite |
| Display currency not supported by Frankfurter | API returns 422; treated as fetch failure |
| All wallets same currency as display | No fetch attempted; no error possible from this path |

---

## Testing Strategy

### Unit Tests (example-based)

- `exchangeRateService.convertAmount`: same-currency passthrough, known rate conversion, undefined rate handling.
- `exchangeRateService.fetchRates`: successful parse, API failure propagation, cache hit (no second fetch).
- `WalletCard`: loading state hides secondary line, same-currency hides secondary line, different-currency shows secondary line.
- `WalletList`: loading spinner shown, error message shown, no fetch when all wallets share display currency.
- Add Wallet Form: default currency is 'BRL', all MOEDAS options present, submit passes selected currency.

### Property-Based Tests (using [fast-check](https://github.com/dubzzz/fast-check), minimum 100 iterations each)

Each test is tagged with the corresponding design property.

- **Feature: currency-conversion, Property 1**: Generate arbitrary wallet objects without `moeda`; verify effective currency is always `'BRL'`.
- **Feature: currency-conversion, Property 2**: Generate arbitrary wallet names; call mock `adicionarCarteira` without `moeda`; verify persisted wallet has `moeda === 'BRL'`.
- **Feature: currency-conversion, Property 3**: Generate arbitrary currency codes from `MOEDAS`; simulate form selection and submit; verify callback receives the selected code.
- **Feature: currency-conversion, Property 4**: Generate arbitrary wallets with arbitrary `moeda` values; render `WalletCard`; verify formatted output contains the wallet's own currency symbol/code.
- **Feature: currency-conversion, Property 5**: Generate arbitrary wallet/display currency pairs; render `WalletCard` with and without rates; verify secondary line presence matches the currency-match condition.
- **Feature: currency-conversion, Property 6**: Mock `fetch`; call `fetchRates` twice with the same currency; assert `fetch` was called exactly once.
- **Feature: currency-conversion, Property 7**: Generate arbitrary positive amounts and rate values; verify `|convertAmount(convertAmount(x, A, B, rates), B, A, rates) - x| < 0.01`.
- **Feature: currency-conversion, Property 8**: Generate arbitrary lists of wallets all with the same currency as display; render `useExchangeRates`; verify no fetch is triggered.
- **Feature: currency-conversion, Property 9**: Generate arbitrary lists of wallets all sharing the display currency; verify displayed total equals `wallets.reduce((sum, w) => sum + w.saldo, 0)`.

### Integration Tests

- Render `WalletList` with mixed-currency wallets and a mocked Frankfurter API response; verify the converted total is displayed correctly end-to-end.
- Verify `WalletList` re-fetches when `PreferencesContext` display currency changes.
