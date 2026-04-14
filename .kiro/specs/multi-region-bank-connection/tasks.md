# Implementation Plan: Multi-Region Bank Connection

## Overview

Replace the Pluggy integration with Belvo (Brazil) and GoCardless (Europe). This involves creating 8 new Vercel serverless functions, rewriting `BankConnectionScreen.tsx`, deleting the 3 Pluggy files, and writing property-based tests for the pure logic functions.

## Tasks

- [x] 1. Create pure utility functions and types
  - Create `src/screens/bankConnection/utils.ts` with `detectRegion(idioma: Idioma): Region` and `getDateRange(): { from: string; to: string }`
  - Define shared TypeScript types: `Region`, `BelvoAccount`, `BelvoTransaction`, `GoCardlessInstitution`, `GoCardlessRequisition`, `GoCardlessTransaction`
  - _Requirements: 1.1, 1.2, 10.3_

  - [ ]* 1.1 Write property test for `detectRegion` (Property 1)
    - **Property 1: Region detection is a total function over all Idioma values**
    - Generate all 6 `Idioma` values; assert `'brazil'` iff `idioma === 'pt'`, `'europe'` otherwise
    - Tag: `// Feature: multi-region-bank-connection, Property 1`
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.2 Write property test for `getDateRange` (Property 6)
    - **Property 6: Date range always starts on the first of the previous month**
    - Generate random `Date` values; assert `from` equals the first calendar day of the prior month
    - Tag: `// Feature: multi-region-bank-connection, Property 6`
    - **Validates: Requirements 10.3**

- [x] 2. Create Belvo serverless functions
  - [x] 2.1 Create `api/belvo/token.ts`
    - Accept POST; authenticate with `https://sandbox.belvo.com/api/v2/token/` using `BELVO_SECRET_ID` / `BELVO_SECRET_KEY`
    - Return `{ access }` on success; 500 if env vars missing; propagate provider status on auth failure
    - Handle OPTIONS preflight; set `Access-Control-Allow-Origin: *`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Create `api/belvo/accounts.ts`
    - Accept GET with required `link` query param; return 400 if absent
    - Fetch from `https://sandbox.belvo.com/api/v2/accounts/?link={link}` with fresh access token
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.3 Create `api/belvo/transactions.ts`
    - Accept GET with required `link`, `date_from`, `date_to` query params; return 400 if any absent
    - Fetch from Belvo transactions endpoint and return results
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 2.4 Write property test for Belvo handlers missing params (Property 3)
    - **Property 3: API handlers return 400 for any missing required parameter**
    - Generate requests with random subsets of required params omitted; assert HTTP 400 with non-empty error
    - Tag: `// Feature: multi-region-bank-connection, Property 3`
    - **Validates: Requirements 4.3, 4.6**

  - [ ]* 2.5 Write property test for Belvo token proxy error passthrough (Property 4)
    - **Property 4: Token proxy returns provider error status unchanged**
    - Mock Belvo auth to return non-2xx statuses (400–599); assert handler echoes same status
    - Tag: `// Feature: multi-region-bank-connection, Property 4`
    - **Validates: Requirements 2.5**

- [x] 3. Create GoCardless serverless functions
  - [x] 3.1 Create `api/gocardless/token.ts`
    - Accept POST; authenticate with `https://bankaccountdata.gocardless.com/api/v2/token/new/` using `GOCARDLESS_SECRET_ID` / `GOCARDLESS_SECRET_KEY`
    - Return `{ access }` on success; 500 if env vars missing; propagate provider status on auth failure
    - Handle OPTIONS preflight; set `Access-Control-Allow-Origin: *`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.2 Create `api/gocardless/institutions.ts`
    - Accept GET with required `country` query param; return 400 if absent
    - Fetch from `https://bankaccountdata.gocardless.com/api/v2/institutions/?country={country}` with fresh access token
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.3 Create `api/gocardless/requisition.ts`
    - Accept POST with JSON body `{ institutionId, redirectUrl }`; return 400 if either field absent
    - POST to `https://bankaccountdata.gocardless.com/api/v2/requisitions/`; return requisition object with status 201
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.4 Create `api/gocardless/accounts.ts`
    - Accept GET with required `requisitionId` query param; return 400 if absent
    - Fetch requisition from GoCardless, extract and return account IDs array
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.5 Create `api/gocardless/transactions.ts`
    - Accept GET with required `accountId`, `date_from`, `date_to` query params; return 400 if any absent
    - Fetch from `https://bankaccountdata.gocardless.com/api/v2/accounts/{accountId}/transactions/`
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ]* 3.6 Write property test for GoCardless handlers missing params (Property 3)
    - **Property 3: API handlers return 400 for any missing required parameter**
    - Generate requests with random subsets of required params omitted for all 4 GoCardless GET/POST handlers; assert HTTP 400
    - Tag: `// Feature: multi-region-bank-connection, Property 3`
    - **Validates: Requirements 6.3, 7.3, 8.3, 8.6**

  - [ ]* 3.7 Write property test for GoCardless token proxy error passthrough (Property 4)
    - **Property 4: Token proxy returns provider error status unchanged**
    - Mock GoCardless auth to return non-2xx statuses (400–599); assert handler echoes same status
    - Tag: `// Feature: multi-region-bank-connection, Property 4`
    - **Validates: Requirements 5.5**

- [x] 4. Checkpoint — Ensure all serverless function tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Rewrite `BankConnectionScreen.tsx`
  - [x] 5.1 Implement region detection and manual override UI
    - Import `detectRegion` from utils; read `idioma` from `usePreferences()`
    - Add `region` state initialized from `detectRegion(idioma)`; render a region selector (brazil / europe) that overrides the auto-detected value
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 5.2 Write property test for manual region override (Property 2)
    - **Property 2: Manual region override takes precedence**
    - Generate arbitrary `(autoRegion, manualRegion)` pairs; assert active region equals `manualRegion` after manual selection
    - Tag: `// Feature: multi-region-bank-connection, Property 2`
    - **Validates: Requirements 1.4**

  - [x] 5.3 Implement Belvo widget flow
    - On connect (region = `brazil`): fetch token from `/api/belvo/token`, dynamically load Belvo widget script, initialize widget
    - Handle `onSuccess` (receive `link`), `onError`, and `onClose` widget events
    - Transition state machine: `inicio` → `conectando` → `importando` / `erro`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.4 Implement GoCardless institution picker and redirect
    - On connect (region = `europe`): fetch institutions from `/api/gocardless/institutions?country={countryCode}`, display searchable list
    - On institution select: POST to `/api/gocardless/requisition`, redirect browser to `requisition.link`
    - Transition state machine: `inicio` → `selecionandoInstituicao` → `conectando`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 5.5 Implement GoCardless return handling and URL cleanup
    - On mount: check `window.location.search` for `?ref=` param
    - If present: extract `requisitionId`, call `history.replaceState` to remove the param without reload, transition to `aguardandoRetorno`
    - _Requirements: 9.4, 9.5_

  - [ ]* 5.6 Write property test for URL cleanup (Property 7)
    - **Property 7: URL is cleaned after GoCardless return**
    - Generate random `requisitionId` strings; assert `ref` param is absent from URL after processing, without page reload
    - Tag: `// Feature: multi-region-bank-connection, Property 7`
    - **Validates: Requirements 9.5**

  - [x] 5.7 Implement transaction import for both providers
    - After accounts are fetched (Belvo: via `/api/belvo/accounts?link=`; GoCardless: via `/api/gocardless/accounts?requisitionId=`), iterate accounts
    - For each account: call `repo.adicionarCarteira`, then fetch transactions, map type using `detectTransactionType`, call `repo.adicionarTransacao`
    - Use `getDateRange()` for `date_from` / `date_to` on all transaction requests
    - Display total imported count on completion; show error with retry on failure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 5.8 Write property test for transaction type mapping (Property 5)
    - **Property 5: Transaction type mapping is total and correct**
    - Generate random `BelvoTransaction` objects; assert `tipo === 'entrada'` iff `type === 'INFLOW'`
    - Generate random `GoCardlessTransaction` objects; assert `tipo === 'entrada'` iff `amount >= 0`
    - Tag: `// Feature: multi-region-bank-connection, Property 5`
    - **Validates: Requirements 10.2**

- [x] 6. Delete Pluggy files
  - Delete `api/pluggy/connect-token.ts`, `api/pluggy/accounts.ts`, `api/pluggy/transactions.ts`
  - _Requirements: 12.1, 12.2, 12.3_

- [-] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `detectTransactionType` should be a pure function extracted to `utils.ts` alongside `detectRegion` and `getDateRange` — this makes all three property-testable
- The Belvo widget script URL and GoCardless API base URL should be constants in `utils.ts`
- `history.replaceState` is the correct API for URL cleanup without reload (Requirement 9.5)
- Wallet-already-exists errors from `repo.adicionarCarteira` should be caught and silently ignored (existing behavior)
- Property tests live in `src/screens/bankConnection/utils.property.test.ts` and handler test files alongside each `api/` function
