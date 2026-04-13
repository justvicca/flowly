# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hardcoded Portuguese Strings in Non-Portuguese Languages
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — render `SettingsScreen` with `idioma = 'en'` and assert section title is "Account" not "Conta"; render `FlowlyAppContent` with `idioma = 'es'` and assert modal title is "Nueva Transacción" not "Nova Transação"
  - Create `src/contexts/PreferencesContext.property.test.ts` (or `.tsx` if JSX needed)
  - For each non-Portuguese language in `['en', 'de', 'es', 'fr', 'it']`, render `SettingsScreen` wrapped in `PreferencesProvider` with that language set and assert:
    - Section title "Conta" is NOT present in the rendered output
    - Section title "Segurança" is NOT present in the rendered output
    - Row label "Nome" is NOT present in the rendered output (for `idioma = 'de'`, expect "Name")
  - For `FlowlyAppContent` with `idioma = 'es'`, open the new transaction modal and assert title is NOT "Nova Transação"
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "SettingsScreen with idioma='en' still renders 'Conta' instead of 'Account'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Portuguese Rendering Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `SettingsScreen` with `idioma = 'pt'` renders "Conta", "Segurança", "Aparência", "Sessão", "Zona de perigo" on unfixed code
  - Observe: `SettingsScreen` with `idioma = 'pt'` renders row labels "Nome", "Email", "Alterar senha", "Tema", "Moeda", "Idioma", "Sair da conta", "Excluir conta" on unfixed code
  - Observe: `App.tsx` with `idioma = 'pt'` renders modal title "Nova Transação" and toast "Pronto! A transação foi salva." on unfixed code
  - Write property-based tests in the same test file:
    - For `idioma = 'pt'`, rendered `SettingsScreen` contains all Portuguese section titles exactly as observed
    - For `idioma = 'pt'`, rendered `SettingsScreen` contains all Portuguese row labels exactly as observed
    - For `idioma = 'pt'`, `FlowlyAppContent` modal title is "Nova Transação" and toast is "Pronto! A transação foi salva."
    - For all 6 languages, every new `TranslationKey` (`nome`, `escolherTema`, `escolherMoeda`, `escolherIdioma`, `salvar`, `excluirMinhaConta`, `excluirContaDesc`, `excluirContaConfirmacao`, `novaTransacao`, `copiarTransacao`, `transacaoSalva`) resolves to a non-empty string
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix hardcoded strings in SettingsScreen and App

  - [x] 3.1 Add 11 new TranslationKeys to `PreferencesContext.tsx`
    - Extend the `TranslationKey` union type with: `'nome' | 'escolherTema' | 'escolherMoeda' | 'escolherIdioma' | 'salvar' | 'excluirMinhaConta' | 'excluirContaDesc' | 'excluirContaConfirmacao' | 'novaTransacao' | 'copiarTransacao' | 'transacaoSalva'`
    - Add all 11 keys to the `pt` translation table
    - Add all 11 keys to the `en` translation table
    - Add all 11 keys to the `de` translation table
    - Add all 11 keys to the `es` translation table
    - Add all 11 keys to the `fr` translation table
    - Add all 11 keys to the `it` translation table
    - Use the translation values from the design document table
    - _Bug_Condition: isBugCondition(X) where X.idioma ≠ 'pt' AND X.component IN { 'SettingsScreen', 'App' }_
    - _Expected_Behavior: every tr(key) call resolves to a non-empty translated string for the active language_
    - _Preservation: pt translations must remain identical to current hardcoded Portuguese literals_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.2 Update `SettingsScreen.tsx` to use `useTranslation()`
    - Add `useTranslation` to the import from `../contexts/PreferencesContext`
    - Add `const tr = useTranslation();` at the top of the `SettingsScreen` component body
    - Replace `<h1>` text `"Configurações"` with `{tr('configuracoes')}`
    - Replace all 5 `<Section title=...>` hardcoded strings: `"Conta"` → `tr('conta')`, `"Segurança"` → `tr('seguranca')`, `"Aparência"` → `tr('aparencia')`, `"Sessão"` → `tr('sessao')`, `"Zona de perigo"` → `tr('zonaDaPerigo')`
    - Replace all `<Row label=...>` hardcoded strings: `"Nome"` → `tr('nome')`, `"Email"` → `tr('email')`, `"Alterar senha"` → `tr('alterarSenha')`, `"Tema"` → `tr('tema')`, `"Moeda"` → `tr('moeda')`, `"Idioma"` → `tr('idioma')`, `"Sair da conta"` → `tr('sairDaConta')`, `"Excluir conta"` → `tr('excluirConta')`
    - Replace `<Row sublabel=...>` for delete account: `"Remove todos os seus dados permanentemente"` → `tr('excluirContaDesc')`
    - Replace all 6 `<Modal title=...>` strings: `"Alterar nome"` → `tr('alterarNome')`, `"Alterar senha"` → `tr('alterarSenha')`, `"Escolher tema"` → `tr('escolherTema')`, `"Escolher moeda"` → `tr('escolherMoeda')`, `"Escolher idioma"` → `tr('escolherIdioma')`, `"Excluir conta"` → `tr('excluirConta')`
    - Replace delete confirmation `<p>` text with `{tr('excluirContaConfirmacao')}`
    - Replace both `<PrimaryBtn>Salvar</PrimaryBtn>` with `{tr('salvar')}`
    - Replace `<PrimaryBtn>Excluir minha conta</PrimaryBtn>` with `{tr('excluirMinhaConta')}`
    - _Bug_Condition: isBugCondition(X) where X.component = 'SettingsScreen' AND X.idioma ≠ 'pt'_
    - _Expected_Behavior: all visible strings in SettingsScreen come from tr() for the active language_
    - _Preservation: Portuguese output must be identical to pre-fix baseline_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Update `App.tsx` to replace 3 remaining hardcoded strings
    - Replace modal `<h2>` title: `dadosCopia ? 'Copiar Transação' : 'Nova Transação'` → `dadosCopia ? tr('copiarTransacao') : tr('novaTransacao')`
    - Replace modal `aria-label`: `dadosCopia ? 'Copiar transação' : 'Nova transação'` → `dadosCopia ? tr('copiarTransacao') : tr('novaTransacao')`
    - Replace success toast: `'Pronto! A transação foi salva.'` → `tr('transacaoSalva')`
    - Note: `tr` is already declared via `const tr = useTranslation()` in `FlowlyAppContent` — no new hook call needed
    - _Bug_Condition: isBugCondition(X) where X.component = 'App' AND X.idioma ≠ 'pt'_
    - _Expected_Behavior: modal titles, aria-labels, and success toast reflect the active language_
    - _Preservation: Portuguese output must be identical to pre-fix baseline_
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Translated Strings for Non-Portuguese Languages
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms translated strings are rendered for all non-Portuguese languages
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Portuguese Rendering Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm Portuguese strings are identical to pre-fix baseline
    - Confirm all 6 languages resolve every new TranslationKey to a non-empty string

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npx vitest --run`
  - Ensure all tests pass, ask the user if questions arise
  - Verify no TypeScript errors in `PreferencesContext.tsx`, `SettingsScreen.tsx`, and `App.tsx`
