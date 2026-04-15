# Implementation Plan: Currency Conversion

## Overview

Extend the wallet system with per-wallet currency support and real-time conversion via the Frankfurter API. Changes flow from the data layer upward: type → repository → service → hook → UI components.

## Tasks

- [x] 1. Extend `Wallet` type and update `IFlowlyRepository` signature
  - Add optional `moeda?: string` field to the `Wallet` interface in `src/types/flowly.ts`
  - Update `adicionarCarteira(userId, nome, moeda?: string)` signature in `src/repository/IFlowlyRepository.ts`
  - _Requirements: 1.1, 1.3_

- [x] 2. Update repository implementations to persist `moeda`
  - [x] 2.1 Update `MockFlowlyRepository.adicionarCarteira` to accept and store `moeda`, defaulting to `'BRL'`
    - Update `listarCarteiras` to preserve `moeda` field when computing saldo
    - _Requirements: 1.4, 6.3_

  - [ ]* 2.2 Write property test for `MockFlowlyRepository` default currency (Property 2)
    - **Property 2: Repository default currency on creation**
    - Generate arbitrary wallet names; call `adicionarCarteira` without `moeda`; assert persisted wallet has `moeda === 'BRL'`
    - **Validates: Requirements 1.4, 6.3**

  - [x] 2.3 Update `LocalStorageFlowlyRepository.adicionarCarteira` to accept and persist `moeda`, defaulting to `'BRL'`
    - Ensure `listarCarteiras` reads and forwards `moeda` from stored JSON
    - _Requirements: 1.4, 6.3_

  - [x] 2.4 Update `FirebaseFlowlyRepository.adicionarCarteira` to accept and persist `moeda`, defaulting to `'BRL'`
    - Store `moeda` in the Firestore document; read it back in `listarCarteiras`
    - _Requirements: 1.4, 6.3_

- [x] 3. Checkpoint — Ensure all existing tests pass after type and repository changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create `exchangeRateService`
  - [x] 4.1 Create `src/services/exchangeRateService.ts` with module-level `rateCache: Map<string, Record<string, number>>`
    - Implement `fetchRates(displayCurrency, walletCurrencies)`: builds URL `https://api.frankfurter.app/latest?from={displayCurrency}&to={csv}`, checks cache first, fetches if miss, stores result, returns `rates` object
    - Implement `convertAmount(amount, fromCurrency, toCurrency, rates)`: returns `amount` unchanged when currencies match; otherwise `amount / rates[fromCurrency]`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.2 Write unit tests for `exchangeRateService` in `src/services/exchangeRateService.test.ts`
    - Same-currency passthrough, known-rate conversion, undefined rate returns `NaN`, API failure propagation, cache hit (fetch called exactly once)
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 4.3 Write property test for cache idempotence (Property 6)
    - **Property 6: Exchange rate cache idempotence**
    - Mock `fetch`; call `fetchRates` twice with the same display currency; assert `fetch` was called exactly once
    - **Validates: Requirements 4.2, 5.6**

  - [ ]* 4.4 Write property test for conversion round-trip (Property 7)
    - **Property 7: Conversion round-trip**
    - Generate arbitrary positive amounts and rate values; verify `|convertAmount(convertAmount(x, A, B, rates), B, A, rates) - x| < 0.01`
    - **Validates: Requirements 4.6**

- [x] 5. Create `useExchangeRates` hook
  - [x] 5.1 Create `src/hooks/useExchangeRates.ts`
    - Accept `(displayCurrency: string, walletCurrencies: string[])` and return `{ rates, loading, error }`
    - Derive the set of currencies that differ from `displayCurrency`; skip fetch entirely when the set is empty (return `{ rates: null, loading: false, error: null }`)
    - Call `fetchRates` in a `useEffect` with `[displayCurrency]` dependency; set `loading`/`error` state accordingly
    - _Requirements: 4.1, 4.2, 5.2, 5.3, 5.4, 6.2_

  - [ ]* 5.2 Write unit tests for `useExchangeRates` in `src/hooks/useExchangeRates.test.ts`
    - Loading spinner shown, error state set on failure, no fetch when all wallets share display currency
    - _Requirements: 5.3, 5.4, 6.2_

  - [ ]* 5.3 Write property test for no-fetch when currencies match (Property 8)
    - **Property 8: No fetch when all wallets share display currency**
    - Generate arbitrary lists of wallets all with the same currency as display; render hook; verify `fetch` is not called and result is `{ rates: null, loading: false, error: null }`
    - **Validates: Requirements 6.2**

- [x] 6. Update `WalletCard` to display per-wallet currency and secondary converted line
  - Extend `WalletCardProps` with `rates?: Record<string, number> | null` and `displayCurrency?: string`
  - Primary balance: format using `wallet.moeda ?? 'BRL'` instead of `moeda.codigo` from context
  - Secondary line: render only when `wallet.moeda !== displayCurrency` AND `rates` is non-null AND `rates[wallet.moeda ?? 'BRL']` is defined AND the converted value is finite
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.1 Write unit tests for `WalletCard` in `src/components/wallets/WalletCard.test.tsx`
    - Same-currency hides secondary line, different-currency shows secondary line, loading (no rates) hides secondary line
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write property test for primary balance currency (Property 4)
    - **Property 4: WalletCard primary balance uses wallet currency**
    - Generate arbitrary wallets with arbitrary `moeda` values; render `WalletCard`; verify formatted output contains the wallet's own currency code
    - **Validates: Requirements 3.1**

  - [ ]* 6.3 Write property test for secondary line presence (Property 5)
    - **Property 5: Secondary line presence is determined by currency match**
    - Generate arbitrary wallet/display currency pairs with and without rates; verify secondary line presence matches the currency-match condition
    - **Validates: Requirements 3.2, 3.3**

- [x] 7. Update `WalletList` to use `useExchangeRates`, compute converted total, and add currency selector to form
  - Remove `saldoTotal` from `WalletListProps`; compute `convertedTotal` internally by summing `convertAmount(w.saldo, w.moeda ?? 'BRL', displayCurrency, rates)` for each wallet
  - Call `useExchangeRates(displayCurrency, walletCurrencies)` where `walletCurrencies = carteiras.map(w => w.moeda ?? 'BRL')`
  - Show loading indicator in the total area while `loading === true`
  - Show error message while `error !== null`
  - Pass `rates` and `displayCurrency` down to each `WalletCard`
  - Add `moedaNova` state (default `'BRL'`) and a `<select>` populated from `MOEDAS` to the Add Wallet form
  - Update `onAdicionarCarteira` call to pass `(nomeNovo, moedaNova)`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.1 Write unit tests for `WalletList` in `src/components/wallets/WalletList.test.tsx`
    - Loading spinner shown, error message shown, currency selector present with BRL default, all MOEDAS options present, submit passes selected currency
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.3, 5.4_

  - [ ]* 7.2 Write property test for form currency submission (Property 3)
    - **Property 3: Form submits selected currency**
    - Generate arbitrary currency codes from `MOEDAS`; simulate form selection and submit; verify `onAdicionarCarteira` receives the selected code as second argument
    - **Validates: Requirements 2.3**

  - [ ]* 7.3 Write property test for converted total correctness (Property 9)
    - **Property 9: Converted total correctness**
    - Generate arbitrary lists of wallets all sharing the display currency; verify displayed total equals `wallets.reduce((sum, w) => sum + w.saldo, 0)`
    - **Validates: Requirements 5.1**

- [x] 8. Update `App.tsx` — remove `saldoTotal` prop from `WalletList`
  - Remove `obterSaldoTotal()` call and `saldoTotal` prop from the `<WalletList>` usage in `FlowlyAppContent`
  - Update `onAdicionarCarteira` handler to forward the `moeda` argument: `(nome, moeda) => adicionarCarteira(nome, moeda)`
  - Update `useFlowly` / `adicionarCarteira` call site to pass `moeda` through to the repository
  - _Requirements: 1.3, 5.1_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
