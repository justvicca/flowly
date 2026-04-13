# Language Config Fix — Bugfix Design

## Overview

The Flowly app has a language switching feature backed by `PreferencesContext.tsx`, which provides a `useTranslation()` hook and translation tables for 6 languages (pt, en, de, es, fr, it). The navigation components (`Sidebar.tsx`, `BottomTabs.tsx`) already consume this hook correctly. However, `SettingsScreen.tsx` and `App.tsx` bypass the translation system entirely — their visible strings are hardcoded in Portuguese.

The fix has two parts:
1. Add the missing `TranslationKey` entries to `PreferencesContext.tsx` and populate all 6 language tables.
2. Replace every hardcoded Portuguese string in `SettingsScreen.tsx` and `App.tsx` with `tr('key')` calls via `useTranslation()`.

No architectural changes are required. The fix is purely additive (new keys) plus mechanical substitution (swap literals for `tr()` calls).

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the selected language is not Portuguese (`idioma ≠ 'pt'`) AND the rendered component is `SettingsScreen` or `App`.
- **Property (P)**: The desired behavior when the bug condition holds — every visible string in the affected components must come from the translation table for the active language.
- **Preservation**: Existing behavior that must remain unchanged — Portuguese rendering, navigation labels, localStorage persistence, and all functional operations (save name, change password, delete account, save transaction).
- **TranslationKey**: The union type in `PreferencesContext.tsx` that enumerates every key accepted by `useTranslation()`.
- **useTranslation()**: The hook exported from `PreferencesContext.tsx` that returns a `tr(key)` function resolving to the active language's string.
- **isBugCondition**: Pseudocode predicate that identifies inputs triggering the bug.
- **hardcoded string**: A string literal embedded directly in JSX/TSX instead of being retrieved via `tr()`.

---

## Bug Details

### Bug Condition

The bug manifests when a user selects any language other than Portuguese. `SettingsScreen.tsx` does not import or call `useTranslation()`, so all its strings are static Portuguese literals. `App.tsx` imports `useTranslation()` and uses it for the add-transaction button, but the modal titles, modal aria-labels, and success toast remain hardcoded.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type { component: 'SettingsScreen' | 'App', idioma: Idioma }
  OUTPUT: boolean

  RETURN X.idioma ≠ 'pt'
    AND X.component IN { 'SettingsScreen', 'App' }
END FUNCTION
```

### Examples

- User switches to English → `SettingsScreen` still shows "Conta", "Segurança", "Aparência", "Sessão", "Zona de perigo" instead of "Account", "Security", "Appearance", "Session", "Danger zone".
- User switches to German → `SettingsScreen` row labels still show "Nome", "Alterar senha", "Tema", "Moeda", "Idioma" instead of "Name", "Passwort ändern", "Design", "Währung", "Sprache".
- User switches to Spanish → `App.tsx` modal title still shows "Nova Transação" instead of "Nueva transacción".
- User switches to French → success toast still shows "Pronto! A transação foi salva." instead of "Transaction enregistrée !".
- User stays on Portuguese → all strings display correctly (not a bug condition).

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When the selected language is Portuguese, all UI strings in `SettingsScreen` and `App` must display exactly as they do today.
- Sidebar and bottom tab navigation labels already translate correctly and must not regress.
- Language preference persistence to `localStorage` and restoration on reload must continue to work.
- All functional operations in `SettingsScreen` (save name, change password, delete account) must continue to work regardless of language.
- Transaction saving in `App.tsx` must continue to work regardless of language.

**Scope:**
All inputs where `idioma = 'pt'` are outside the bug condition and must be completely unaffected. This includes:
- All `SettingsScreen` interactions when the language is Portuguese.
- All `App.tsx` modal and toast interactions when the language is Portuguese.
- All navigation interactions in `Sidebar` and `BottomTabs` (already correct, must not regress).

---

## Hypothesized Root Cause

Based on code inspection, the causes are confirmed (not merely hypothesized):

1. **`SettingsScreen.tsx` never calls `useTranslation()`**: The component imports `usePreferences` but not `useTranslation`. Every string is a JSX literal. Fix: add `const tr = useTranslation()` and replace literals.

2. **Missing `TranslationKey` entries**: The keys needed by `SettingsScreen` and `App` (`nome`, `escolherTema`, `escolherMoeda`, `escolherIdioma`, `salvar`, `excluirMinhaConta`, `excluirContaDesc`, `excluirContaConfirmacao`, `novaTransacao`, `copiarTransacao`, `transacaoSalva`) are absent from the `TranslationKey` type and all 6 translation objects. Fix: add them.

3. **`App.tsx` partially uses `useTranslation()`**: The hook is already imported and called, but three specific strings (modal titles, modal aria-labels, success toast) were not wired up. Fix: replace those three literals with `tr()` calls.

4. **No fallback gap**: The `useTranslation()` hook already falls back to `'pt'` when a key is missing (`t[idioma][key] ?? t['pt'][key]`), so adding keys to all 6 tables is the correct and complete fix.

---

## Correctness Properties

Property 1: Bug Condition — Translated Strings for Non-Portuguese Languages

_For any_ component render where `isBugCondition` returns true (language is not Portuguese and component is `SettingsScreen` or `App`), the fixed components SHALL display every visible UI string using the translation for the active language, with no hardcoded Portuguese literals remaining in the output.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation — Portuguese Rendering Unchanged

_For any_ component render where `isBugCondition` returns false (language is Portuguese), the fixed components SHALL produce output identical to the original components, preserving all Portuguese strings exactly as they appeared before the fix.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

## Fix Implementation

### Changes Required

#### File: `src/contexts/PreferencesContext.tsx`

**Change 1 — Extend `TranslationKey` type**

Add the following keys to the union type:
```
'nome' | 'escolherTema' | 'escolherMoeda' | 'escolherIdioma'
| 'salvar' | 'excluirMinhaConta' | 'excluirContaDesc' | 'excluirContaConfirmacao'
| 'novaTransacao' | 'copiarTransacao' | 'transacaoSalva'
```

**Change 2 — Populate all 6 translation tables**

Add the new keys to every language object (`pt`, `en`, `de`, `es`, `fr`, `it`):

| Key | pt | en | de | es | fr | it |
|-----|----|----|----|----|----|----|
| `nome` | Nome | Name | Name | Nombre | Nom | Nome |
| `escolherTema` | Escolher tema | Choose theme | Design wählen | Elegir tema | Choisir le thème | Scegli tema |
| `escolherMoeda` | Escolher moeda | Choose currency | Währung wählen | Elegir moneda | Choisir la devise | Scegli valuta |
| `escolherIdioma` | Escolher idioma | Choose language | Sprache wählen | Elegir idioma | Choisir la langue | Scegli lingua |
| `salvar` | Salvar | Save | Speichern | Guardar | Enregistrer | Salva |
| `excluirMinhaConta` | Excluir minha conta | Delete my account | Mein Konto löschen | Eliminar mi cuenta | Supprimer mon compte | Elimina il mio account |
| `excluirContaDesc` | Remove todos os seus dados permanentemente | Permanently removes all your data | Löscht alle Ihre Daten dauerhaft | Elimina todos tus datos permanentemente | Supprime définitivement toutes vos données | Rimuove tutti i tuoi dati permanentemente |
| `excluirContaConfirmacao` | Esta ação é irreversível. Todos os seus dados serão apagados permanentemente. Digite sua senha para confirmar. | This action is irreversible. All your data will be permanently deleted. Enter your password to confirm. | Diese Aktion ist unwiderruflich. Alle Ihre Daten werden dauerhaft gelöscht. Geben Sie Ihr Passwort zur Bestätigung ein. | Esta acción es irreversible. Todos tus datos serán eliminados permanentemente. Ingresa tu contraseña para confirmar. | Cette action est irréversible. Toutes vos données seront supprimées définitivement. Entrez votre mot de passe pour confirmer. | Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati definitivamente. Inserisci la tua password per confermare. |
| `novaTransacao` | Nova Transação | New Transaction | Neue Transaktion | Nueva Transacción | Nouvelle Transaction | Nuova Transazione |
| `copiarTransacao` | Copiar Transação | Copy Transaction | Transaktion kopieren | Copiar Transacción | Copier la Transaction | Copia Transazione |
| `transacaoSalva` | Pronto! A transação foi salva. | Done! Transaction saved. | Fertig! Transaktion gespeichert. | ¡Listo! Transacción guardada. | Fait ! Transaction enregistrée. | Fatto! Transazione salvata. |

---

#### File: `src/screens/SettingsScreen.tsx`

**Change 3 — Import and call `useTranslation()`**

Add `useTranslation` to the import from `PreferencesContext` and call it at the top of `SettingsScreen`:
```tsx
const tr = useTranslation();
```

**Change 4 — Replace hardcoded strings with `tr()` calls**

| Location | Hardcoded string | Replacement |
|----------|-----------------|-------------|
| `<h1>` | `"Configurações"` | `tr('configuracoes')` |
| `<Section title=...>` (Conta) | `"Conta"` | `tr('conta')` |
| `<Section title=...>` (Segurança) | `"Segurança"` | `tr('seguranca')` |
| `<Section title=...>` (Aparência) | `"Aparência"` | `tr('aparencia')` |
| `<Section title=...>` (Sessão) | `"Sessão"` | `tr('sessao')` |
| `<Section title=...>` (Zona de perigo) | `"Zona de perigo"` | `tr('zonaDaPerigo')` |
| `<Row label=...>` (Nome) | `"Nome"` | `tr('nome')` |
| `<Row label=...>` (Email) | `"Email"` | `tr('email')` |
| `<Row label=...>` (Alterar senha) | `"Alterar senha"` | `tr('alterarSenha')` |
| `<Row label=...>` (Tema) | `"Tema"` | `tr('tema')` |
| `<Row label=...>` (Moeda) | `"Moeda"` | `tr('moeda')` |
| `<Row label=...>` (Idioma) | `"Idioma"` | `tr('idioma')` |
| `<Row label=...>` (Sair da conta) | `"Sair da conta"` | `tr('sairDaConta')` |
| `<Row label=...>` (Excluir conta) | `"Excluir conta"` | `tr('excluirConta')` |
| `<Row sublabel=...>` (excluir desc) | `"Remove todos os seus dados permanentemente"` | `tr('excluirContaDesc')` |
| `<Modal title=...>` (Alterar nome) | `"Alterar nome"` | `tr('alterarNome')` |
| `<Modal title=...>` (Alterar senha) | `"Alterar senha"` | `tr('alterarSenha')` |
| `<Modal title=...>` (Escolher tema) | `"Escolher tema"` | `tr('escolherTema')` |
| `<Modal title=...>` (Escolher moeda) | `"Escolher moeda"` | `tr('escolherMoeda')` |
| `<Modal title=...>` (Escolher idioma) | `"Escolher idioma"` | `tr('escolherIdioma')` |
| `<Modal title=...>` (Excluir conta) | `"Excluir conta"` | `tr('excluirConta')` |
| `<p>` (excluir confirmação) | `"Esta ação é irreversível..."` | `tr('excluirContaConfirmacao')` |
| `<PrimaryBtn>` (Salvar — nome modal) | `"Salvar"` | `tr('salvar')` |
| `<PrimaryBtn>` (Salvar — senha modal) | `"Salvar"` | `tr('salvar')` |
| `<PrimaryBtn>` (Excluir minha conta) | `"Excluir minha conta"` | `tr('excluirMinhaConta')` |

**Note on `temas` array**: The `label` and `desc` fields in the `temas` array (`'☀️ Claro'`, `'🌙 Escuro'`, `'🍂 Creme'`) are theme names and decorative descriptions, not functional UI labels. They are intentionally left as Portuguese literals and are out of scope for this fix.

---

#### File: `src/App.tsx`

**Change 5 — Replace hardcoded modal titles**

| Location | Hardcoded string | Replacement |
|----------|-----------------|-------------|
| `<h2>` modal title | `dadosCopia ? 'Copiar Transação' : 'Nova Transação'` | `dadosCopia ? tr('copiarTransacao') : tr('novaTransacao')` |
| `aria-label` on modal div | `dadosCopia ? 'Copiar transação' : 'Nova transação'` | `dadosCopia ? tr('copiarTransacao') : tr('novaTransacao')` |
| `setToastSucesso(...)` | `'Pronto! A transação foi salva.'` | `tr('transacaoSalva')` |

**Note**: `tr` is already declared in `FlowlyAppContent` via `const tr = useTranslation()`. No new hook call is needed.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis (missing `useTranslation()` call and missing keys).

**Test Plan**: Render `SettingsScreen` and `FlowlyAppContent` with a non-Portuguese language preference and assert that translated strings appear. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **SettingsScreen section titles in English** — render with `idioma = 'en'`, assert section title is "Account" not "Conta" (will fail on unfixed code)
2. **SettingsScreen row labels in German** — render with `idioma = 'de'`, assert "Nome" row shows "Name" (will fail on unfixed code)
3. **App modal title in Spanish** — render `FlowlyAppContent` with `idioma = 'es'`, open new transaction modal, assert title is "Nueva Transacción" (will fail on unfixed code)
4. **App toast in French** — render with `idioma = 'fr'`, submit a transaction, assert toast shows "Fait ! Transaction enregistrée." (will fail on unfixed code)

**Expected Counterexamples**:
- Rendered text contains Portuguese literals even when a non-Portuguese language is active.
- Root cause confirmed: `SettingsScreen` has no `tr()` calls; `App` has three unhook literals.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed components produce translated output.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  rendered ← render(X.component, idioma = X.idioma)
  ASSERT rendered does NOT contain hardcoded Portuguese strings
  ASSERT rendered CONTAINS expectedTranslation(X.idioma, key) for each key
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (Portuguese), the fixed components produce output identical to the original.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT render_fixed(X.component, idioma = 'pt') = render_original(X.component, idioma = 'pt')
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (all possible preference combinations with `idioma = 'pt'`).
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that Portuguese rendering is unchanged for all non-buggy inputs.

**Test Plan**: Observe Portuguese rendering on UNFIXED code first, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Portuguese section titles preserved** — verify `SettingsScreen` with `idioma = 'pt'` still shows "Conta", "Segurança", etc.
2. **Portuguese modal titles preserved** — verify `App` with `idioma = 'pt'` still shows "Nova Transação", "Copiar Transação".
3. **Portuguese toast preserved** — verify success toast with `idioma = 'pt'` still shows "Pronto! A transação foi salva."
4. **Navigation labels unaffected** — verify `Sidebar` and `BottomTabs` continue to translate correctly for all languages.

### Unit Tests

- Test each new `TranslationKey` resolves to a non-empty string for all 6 languages.
- Test `SettingsScreen` renders translated section titles for each supported language.
- Test `SettingsScreen` renders translated row labels for each supported language.
- Test `SettingsScreen` renders translated modal titles when modals are opened.
- Test `App` renders translated modal title and aria-label for new and copy transaction flows.
- Test `App` shows translated success toast after transaction submission.

### Property-Based Tests

- For any `idioma ≠ 'pt'`, rendered `SettingsScreen` output contains no string from the Portuguese hardcoded set.
- For any `idioma = 'pt'`, rendered `SettingsScreen` output is identical to the pre-fix baseline.
- For any `idioma`, every `TranslationKey` resolves to a non-empty string (no missing translations).

### Integration Tests

- Full language switch flow: user opens Settings → changes language to English → navigates back → all visible strings are in English.
- Functional operations unaffected: user changes language to German → opens "Alterar nome" modal → saves name → name is updated correctly.
- Toast localization: user changes language to Italian → adds a transaction → success toast appears in Italian.
