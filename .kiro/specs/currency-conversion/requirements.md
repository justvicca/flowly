# Requirements Document

## Introduction

Currently, the Flowly app displays all wallet balances using the single display currency selected in Settings. This is incorrect when a user holds wallets in different currencies (e.g., R$100 in a Brazilian wallet and €34 in a European wallet), because the total balance is summed without conversion.

This feature adds per-wallet currency support and real-time currency conversion so that:
- Each wallet stores its own ISO 4217 currency code.
- Individual wallet balances are displayed in the wallet's own currency.
- The total balance is converted to the user's preferred display currency using live exchange rates from the Frankfurter API.

## Glossary

- **Wallet**: A named account (`carteira`) with a balance (`saldo`) and an associated currency code.
- **Display_Currency**: The ISO 4217 currency code selected by the user in Settings (`moeda.codigo` from `PreferencesContext`).
- **Wallet_Currency**: The ISO 4217 currency code associated with a specific wallet (e.g., `'BRL'`, `'EUR'`, `'USD'`).
- **Exchange_Rate_Service**: The client-side module responsible for fetching and caching exchange rates from the Frankfurter API.
- **Frankfurter_API**: The public REST API at `https://api.frankfurter.app` that provides ECB exchange rate data, updated daily, with CORS enabled and no API key required.
- **Rate_Cache**: An in-memory, session-scoped store that holds fetched exchange rates to avoid redundant network requests.
- **Converted_Total**: The sum of all wallet balances after each balance has been converted to the Display_Currency.
- **WalletCard**: The UI component that renders a single wallet's name and balance.
- **WalletList**: The UI component that renders all wallets and the Converted_Total.
- **Add_Wallet_Form**: The inline form inside WalletList used to create a new wallet.
- **Repository**: The `IFlowlyRepository` interface and its implementations that persist wallet data.

## Requirements

### Requirement 1: Per-Wallet Currency Field

**User Story:** As a user, I want each wallet to have its own currency, so that my multi-currency accounts are represented accurately.

#### Acceptance Criteria

1. THE Wallet SHALL include an optional `moeda` field containing an ISO 4217 currency code string.
2. WHEN a Wallet has no `moeda` field set, THE Wallet SHALL default to `'BRL'` for backward compatibility with existing data.
3. THE Repository SHALL accept an optional `moeda` parameter when creating a new wallet via `adicionarCarteira`.
4. WHEN `adicionarCarteira` is called without a `moeda` parameter, THE Repository SHALL persist the wallet with `moeda` set to `'BRL'`.

---

### Requirement 2: Currency Selector in Add Wallet Form

**User Story:** As a user, I want to choose a currency when creating a new wallet, so that the wallet correctly represents the currency I hold.

#### Acceptance Criteria

1. THE Add_Wallet_Form SHALL display a currency selector field alongside the wallet name input.
2. WHEN the Add_Wallet_Form is rendered, THE Add_Wallet_Form SHALL pre-select `'BRL'` as the default currency in the selector.
3. WHEN the user submits the Add_Wallet_Form, THE Add_Wallet_Form SHALL pass the selected currency code to `onAdicionarCarteira`.
4. THE Add_Wallet_Form SHALL list all currencies available in `MOEDAS` from `PreferencesContext` as selectable options.

---

### Requirement 3: WalletCard Displays Wallet's Own Currency

**User Story:** As a user, I want each wallet card to show the balance in the wallet's own currency, so that I can see the actual amount without confusion.

#### Acceptance Criteria

1. WHEN a WalletCard is rendered, THE WalletCard SHALL display the wallet balance formatted using the Wallet_Currency (not the Display_Currency).
2. WHEN the Wallet_Currency differs from the Display_Currency, THE WalletCard SHALL display a secondary line showing the approximate converted value in the Display_Currency.
3. WHEN the Wallet_Currency equals the Display_Currency, THE WalletCard SHALL display only the primary balance without a secondary converted line.
4. WHILE exchange rates are being fetched, THE WalletCard SHALL display the primary balance in the Wallet_Currency and omit the secondary converted line.

---

### Requirement 4: Exchange Rate Service

**User Story:** As a developer, I want a dedicated service to fetch and cache exchange rates, so that the app retrieves rates efficiently without redundant network calls.

#### Acceptance Criteria

1. THE Exchange_Rate_Service SHALL fetch rates from `https://api.frankfurter.app/latest?from={baseCurrency}&to={targetCurrencies}` where `baseCurrency` is the Display_Currency and `targetCurrencies` is a comma-separated list of all distinct Wallet_Currencies that differ from the Display_Currency.
2. WHEN rates for a given Display_Currency have already been fetched during the current session, THE Exchange_Rate_Service SHALL return the cached rates without making a new network request.
3. WHEN the Frankfurter API returns a successful response, THE Exchange_Rate_Service SHALL parse the `rates` object of the form `{ [currencyCode: string]: number }` and store it in the Rate_Cache.
4. IF the Frankfurter API request fails, THEN THE Exchange_Rate_Service SHALL return an error result so that the caller can handle the failure gracefully.
5. WHEN the Display_Currency changes, THE Exchange_Rate_Service SHALL invalidate the Rate_Cache and fetch new rates for the updated Display_Currency.
6. FOR ALL valid currency pairs, fetching rates and then converting a value and converting back SHALL produce a value within 0.01 of the original (round-trip property).

---

### Requirement 5: Converted Total Balance in WalletList

**User Story:** As a user, I want the total balance to reflect the real combined value of all my wallets in my preferred currency, so that I have an accurate picture of my net worth.

#### Acceptance Criteria

1. WHEN WalletList is rendered and all wallets share the Display_Currency, THE WalletList SHALL display the sum of all wallet balances formatted in the Display_Currency.
2. WHEN WalletList is rendered and at least one wallet has a Wallet_Currency different from the Display_Currency, THE WalletList SHALL fetch exchange rates and display the Converted_Total in the Display_Currency.
3. WHILE exchange rates are being fetched, THE WalletList SHALL display a loading indicator in place of the total balance value.
4. IF the exchange rate fetch fails, THEN THE WalletList SHALL display an error message indicating that the total could not be calculated, and SHALL show each wallet's individual balance in its own currency.
5. WHEN the Display_Currency changes, THE WalletList SHALL recalculate and display the Converted_Total using the new Display_Currency.
6. THE WalletList SHALL NOT make more than one concurrent network request to the Frankfurter API for the same Display_Currency within a single session.

---

### Requirement 6: Backward Compatibility

**User Story:** As a user with existing wallets, I want the app to continue working correctly after the update, so that my data is not lost or broken.

#### Acceptance Criteria

1. WHEN a Wallet loaded from storage has no `moeda` field, THE Wallet SHALL be treated as having `moeda` equal to `'BRL'`.
2. WHEN all existing wallets default to `'BRL'` and the Display_Currency is also `'BRL'`, THE WalletList SHALL display the total balance without making any exchange rate requests.
3. THE Repository implementations (`FirebaseFlowlyRepository`, `LocalStorageFlowlyRepository`, `MockFlowlyRepository`) SHALL handle wallets without a `moeda` field by defaulting to `'BRL'`.
