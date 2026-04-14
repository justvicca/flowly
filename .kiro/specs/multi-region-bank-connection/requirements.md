# Requirements Document

## Introduction

The Flowly app currently uses Pluggy (R$2,500/month) for Brazilian bank connections. This feature replaces Pluggy with two free providers: **Belvo** (free up to 25 connections) for Brazilian banks via Open Finance Brasil, and **GoCardless Bank Account Data** (free) for European banks via PSD2. The system must detect or allow the user to select their region and route them to the appropriate provider, replacing all existing Pluggy serverless API functions with new Belvo and GoCardless equivalents.

## Glossary

- **BankConnectionScreen**: The React screen component that handles the bank connection UI flow.
- **BelvoProvider**: The Belvo API integration responsible for Brazilian bank connections via Open Finance Brasil.
- **GoCardlessProvider**: The GoCardless Bank Account Data API integration responsible for European bank connections via PSD2.
- **Region**: A geographic classification used to determine which bank connection provider to use. Valid values are `brazil` and `europe`.
- **RegionDetector**: The logic module that infers a user's Region from their selected app language.
- **BelvoWidget**: The hosted JavaScript widget provided by Belvo, embedded via a script tag, used to authenticate the user with their Brazilian bank.
- **GoCardlessRequisition**: A GoCardless object representing a user's bank authorization request, containing a redirect URL and a requisition ID.
- **Institution**: A bank or financial institution object returned by the GoCardless API, identified by an institution ID and country code.
- **AccessToken**: A short-lived credential returned by the Belvo or GoCardless authentication API, used to authorize subsequent API calls.
- **VercelFunction**: A serverless function deployed on Vercel that proxies requests to third-party bank APIs, keeping credentials server-side.
- **PreferencesContext**: The existing React context that stores the user's language (`Idioma`), theme, and currency preferences.
- **Idioma**: The user's selected language code. Valid values: `pt`, `en`, `de`, `es`, `fr`, `it`.

---

## Requirements

### Requirement 1: Region Detection

**User Story:** As a Flowly user, I want the app to automatically determine my banking region based on my language setting, so that I am shown the correct bank connection provider without manual configuration.

#### Acceptance Criteria

1. WHEN the user's `Idioma` is `pt`, THE `RegionDetector` SHALL resolve the Region to `brazil`.
2. WHEN the user's `Idioma` is `de`, `en`, `es`, `fr`, or `it`, THE `RegionDetector` SHALL resolve the Region to `europe`.
3. THE `BankConnectionScreen` SHALL allow the user to manually override the auto-detected Region by selecting `brazil` or `europe` from a region selector.
4. WHEN the user manually selects a Region, THE `BankConnectionScreen` SHALL use the manually selected Region for the remainder of the session, ignoring the auto-detected value.

---

### Requirement 2: Belvo Token Generation (Server-Side)

**User Story:** As a developer, I want a secure server-side endpoint that generates a Belvo access token, so that Belvo credentials are never exposed to the client.

#### Acceptance Criteria

1. THE `VercelFunction` at `api/belvo/token.ts` SHALL accept HTTP POST requests.
2. WHEN a POST request is received, THE `VercelFunction` SHALL authenticate with the Belvo API at `https://sandbox.belvo.com/api/v2/token/` using the `BELVO_SECRET_ID` and `BELVO_SECRET_KEY` environment variables.
3. WHEN authentication succeeds, THE `VercelFunction` SHALL return a JSON response containing the Belvo `access` token with HTTP status 200.
4. IF `BELVO_SECRET_ID` or `BELVO_SECRET_KEY` are not set, THEN THE `VercelFunction` SHALL return HTTP status 500 with a descriptive error message.
5. IF the Belvo authentication API returns a non-2xx response, THEN THE `VercelFunction` SHALL return the same HTTP status code and a descriptive error message.

---

### Requirement 3: Belvo Widget Integration

**User Story:** As a Brazilian Flowly user, I want to connect my bank account using the Belvo widget, so that I can securely authorize access to my Nubank, Itaú, Bradesco, or other Open Finance Brasil bank.

#### Acceptance Criteria

1. WHEN the user's Region is `brazil` and the user initiates a bank connection, THE `BankConnectionScreen` SHALL fetch an `AccessToken` from `api/belvo/token`.
2. WHEN the `AccessToken` is received, THE `BankConnectionScreen` SHALL load the Belvo widget script dynamically and initialize the widget with the `AccessToken`.
3. WHEN the Belvo widget emits a success event containing a `link` identifier, THE `BankConnectionScreen` SHALL proceed to fetch accounts using the `link` identifier.
4. WHEN the Belvo widget emits an error event, THE `BankConnectionScreen` SHALL display the error message and return to the initial state.
5. WHEN the Belvo widget is closed by the user before completion, THE `BankConnectionScreen` SHALL return to the initial state.

---

### Requirement 4: Belvo Account and Transaction Fetching (Server-Side)

**User Story:** As a developer, I want server-side endpoints to fetch accounts and transactions from Belvo, so that API credentials remain secure and the client receives normalized data.

#### Acceptance Criteria

1. THE `VercelFunction` at `api/belvo/accounts.ts` SHALL accept HTTP GET requests with a `link` query parameter.
2. WHEN a GET request is received with a valid `link`, THE `VercelFunction` SHALL fetch accounts from the Belvo API at `https://sandbox.belvo.com/api/v2/accounts/?link={link}` and return the results as JSON with HTTP status 200.
3. IF the `link` query parameter is absent, THEN THE `VercelFunction` at `api/belvo/accounts.ts` SHALL return HTTP status 400 with a descriptive error message.
4. THE `VercelFunction` at `api/belvo/transactions.ts` SHALL accept HTTP GET requests with `link`, `date_from`, and `date_to` query parameters.
5. WHEN a GET request is received with valid parameters, THE `VercelFunction` at `api/belvo/transactions.ts` SHALL fetch transactions from the Belvo API and return the results as JSON with HTTP status 200.
6. IF any required query parameter is absent from a request to `api/belvo/transactions.ts`, THEN THE `VercelFunction` SHALL return HTTP status 400 with a descriptive error message.

---

### Requirement 5: GoCardless Token Generation (Server-Side)

**User Story:** As a developer, I want a secure server-side endpoint that generates a GoCardless access token, so that GoCardless credentials are never exposed to the client.

#### Acceptance Criteria

1. THE `VercelFunction` at `api/gocardless/token.ts` SHALL accept HTTP POST requests.
2. WHEN a POST request is received, THE `VercelFunction` SHALL authenticate with the GoCardless API at `https://bankaccountdata.gocardless.com/api/v2/token/new/` using the `GOCARDLESS_SECRET_ID` and `GOCARDLESS_SECRET_KEY` environment variables.
3. WHEN authentication succeeds, THE `VercelFunction` SHALL return a JSON response containing the GoCardless `access` token with HTTP status 200.
4. IF `GOCARDLESS_SECRET_ID` or `GOCARDLESS_SECRET_KEY` are not set, THEN THE `VercelFunction` SHALL return HTTP status 500 with a descriptive error message.
5. IF the GoCardless authentication API returns a non-2xx response, THEN THE `VercelFunction` SHALL return the same HTTP status code and a descriptive error message.

---

### Requirement 6: GoCardless Institution Listing (Server-Side)

**User Story:** As a developer, I want a server-side endpoint that lists available banks for a given country, so that the client can display a bank selection UI for European users.

#### Acceptance Criteria

1. THE `VercelFunction` at `api/gocardless/institutions.ts` SHALL accept HTTP GET requests with a `country` query parameter (ISO 3166-1 alpha-2 code, e.g., `DE`).
2. WHEN a GET request is received with a valid `country`, THE `VercelFunction` SHALL fetch institutions from `https://bankaccountdata.gocardless.com/api/v2/institutions/?country={country}` using a valid `AccessToken` and return the list as JSON with HTTP status 200.
3. IF the `country` query parameter is absent, THEN THE `VercelFunction` SHALL return HTTP status 400 with a descriptive error message.

---

### Requirement 7: GoCardless Requisition Creation (Server-Side)

**User Story:** As a developer, I want a server-side endpoint that creates a GoCardless requisition, so that the client can redirect the user to their bank's authorization page.

#### Acceptance Criteria

1. THE `VercelFunction` at `api/gocardless/requisition.ts` SHALL accept HTTP POST requests with a JSON body containing `institutionId` and `redirectUrl`.
2. WHEN a valid POST request is received, THE `VercelFunction` SHALL create a requisition via the GoCardless API at `https://bankaccountdata.gocardless.com/api/v2/requisitions/` and return the `GoCardlessRequisition` object (including `id`, `link`, and `status`) as JSON with HTTP status 201.
3. IF `institutionId` or `redirectUrl` are absent from the request body, THEN THE `VercelFunction` SHALL return HTTP status 400 with a descriptive error message.

---

### Requirement 8: GoCardless Account and Transaction Fetching (Server-Side)

**User Story:** As a developer, I want server-side endpoints to fetch accounts and transactions from GoCardless after a user completes bank authorization, so that the client receives normalized data.

#### Acceptance Criteria

1. THE `VercelFunction` at `api/gocardless/accounts.ts` SHALL accept HTTP GET requests with a `requisitionId` query parameter.
2. WHEN a GET request is received with a valid `requisitionId`, THE `VercelFunction` SHALL fetch the requisition from GoCardless, extract the list of account IDs, and return them as JSON with HTTP status 200.
3. IF the `requisitionId` query parameter is absent, THEN THE `VercelFunction` at `api/gocardless/accounts.ts` SHALL return HTTP status 400 with a descriptive error message.
4. THE `VercelFunction` at `api/gocardless/transactions.ts` SHALL accept HTTP GET requests with `accountId`, `date_from`, and `date_to` query parameters.
5. WHEN a GET request is received with valid parameters, THE `VercelFunction` at `api/gocardless/transactions.ts` SHALL fetch transactions from `https://bankaccountdata.gocardless.com/api/v2/accounts/{accountId}/transactions/` and return the results as JSON with HTTP status 200.
6. IF any required query parameter is absent from a request to `api/gocardless/transactions.ts`, THEN THE `VercelFunction` SHALL return HTTP status 400 with a descriptive error message.

---

### Requirement 9: GoCardless Redirect Flow (Client-Side)

**User Story:** As a European Flowly user, I want to connect my bank account using the GoCardless redirect flow, so that I can securely authorize access to my Deutsche Bank, Commerzbank, N26, or other PSD2-compliant bank.

#### Acceptance Criteria

1. WHEN the user's Region is `europe` and the user initiates a bank connection, THE `BankConnectionScreen` SHALL fetch the list of available institutions for the detected country from `api/gocardless/institutions`.
2. WHEN the institution list is received, THE `BankConnectionScreen` SHALL display a searchable list of institutions for the user to select from.
3. WHEN the user selects an `Institution`, THE `BankConnectionScreen` SHALL call `api/gocardless/requisition` to create a `GoCardlessRequisition` and redirect the user's browser to the `GoCardlessRequisition.link` URL.
4. WHEN the user returns to the app after completing bank authorization (identified by a `requisitionId` query parameter in the URL), THE `BankConnectionScreen` SHALL automatically proceed to fetch accounts and transactions using the `requisitionId`.
5. WHEN the user returns to the app after completing bank authorization, THE `BankConnectionScreen` SHALL remove the `requisitionId` query parameter from the URL without triggering a page reload.

---

### Requirement 10: Transaction Import

**User Story:** As a Flowly user, I want my bank transactions from the last 2 months to be automatically imported into Flowly after connecting my bank, so that I can see my financial history without manual entry.

#### Acceptance Criteria

1. WHEN bank accounts are successfully retrieved (from either Belvo or GoCardless), THE `BankConnectionScreen` SHALL create a Flowly wallet for each account using the bank name and account name as the wallet name, via the existing `repo.adicionarCarteira` method.
2. WHEN transactions are successfully retrieved for an account, THE `BankConnectionScreen` SHALL import each transaction into Flowly via the existing `repo.adicionarTransacao` method, mapping `CREDIT` type transactions to `entrada` and all other types to `saida`.
3. THE `BankConnectionScreen` SHALL fetch transactions covering the date range from the first day of the previous calendar month to the current date.
4. WHEN all transactions have been imported, THE `BankConnectionScreen` SHALL display the total count of imported transactions.
5. IF an error occurs during account or transaction fetching, THEN THE `BankConnectionScreen` SHALL display a descriptive error message and allow the user to retry.

---

### Requirement 11: Environment Variable Configuration

**User Story:** As a developer deploying Flowly, I want the app to use clearly named environment variables for each provider, so that credentials are easy to configure and rotate independently.

#### Acceptance Criteria

1. THE `BelvoProvider` SHALL read credentials exclusively from the `BELVO_SECRET_ID` and `BELVO_SECRET_KEY` environment variables.
2. THE `GoCardlessProvider` SHALL read credentials exclusively from the `GOCARDLESS_SECRET_ID` and `GOCARDLESS_SECRET_KEY` environment variables.
3. THE Flowly deployment configuration SHALL NOT reference `PLUGGY_CLIENT_ID` or `PLUGGY_CLIENT_SECRET` after this feature is implemented.

---

### Requirement 12: Pluggy Removal

**User Story:** As a developer, I want all Pluggy-related code and dependencies removed from the codebase, so that the app no longer incurs the R$2,500/month Pluggy cost.

#### Acceptance Criteria

1. THE Flowly codebase SHALL NOT contain any references to the Pluggy API endpoints (`api.pluggy.ai`) after this feature is implemented.
2. THE Flowly codebase SHALL NOT contain the files `api/pluggy/connect-token.ts`, `api/pluggy/accounts.ts`, or `api/pluggy/transactions.ts` after this feature is implemented.
3. THE `BankConnectionScreen` SHALL NOT load or reference the Pluggy Connect widget script after this feature is implemented.
