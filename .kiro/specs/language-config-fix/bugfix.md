# Bugfix Requirements Document

## Introduction

After implementing language switching in the Flowly app, changing the language only partially updates the UI. The navigation components (`Sidebar.tsx` and `BottomTabs.tsx`) correctly use `useTranslation()` and respond to language changes, but the majority of the application's visible text remains hardcoded in Portuguese. This affects `SettingsScreen.tsx` (section titles, row labels, modal titles, button labels, feedback messages) and `App.tsx` (modal titles, toast messages, aria-labels). The bug breaks the language switching feature for all users who select a language other than Portuguese.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user changes the language to any non-Portuguese option THEN the system displays all `SettingsScreen` section titles ("Conta", "Segurança", "Aparência", "Sessão", "Zona de perigo") in Portuguese

1.2 WHEN the user changes the language to any non-Portuguese option THEN the system displays all `SettingsScreen` row labels ("Nome", "Email", "Alterar senha", "Tema", "Moeda", "Idioma", "Sair da conta", "Excluir conta") in Portuguese

1.3 WHEN the user changes the language to any non-Portuguese option THEN the system displays all `SettingsScreen` modal titles ("Alterar nome", "Alterar senha", "Escolher tema", "Escolher moeda", "Escolher idioma", "Excluir conta") in Portuguese

1.4 WHEN the user changes the language to any non-Portuguese option THEN the system displays the `SettingsScreen` button label "Salvar" and "Excluir minha conta" in Portuguese

1.5 WHEN the user changes the language to any non-Portuguese option THEN the system displays the `App.tsx` transaction modal titles ("Copiar Transação", "Nova Transação") in Portuguese

1.6 WHEN the user changes the language to any non-Portuguese option THEN the system displays the `App.tsx` success toast message ("Pronto! A transação foi salva.") in Portuguese

1.7 WHEN the user changes the language to any non-Portuguese option THEN the system sets the `App.tsx` modal aria-labels ("Copiar transação", "Nova transação") in Portuguese

### Expected Behavior (Correct)

2.1 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL display all `SettingsScreen` section titles in the selected language using `useTranslation()`

2.2 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL display all `SettingsScreen` row labels in the selected language using `useTranslation()`

2.3 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL display all `SettingsScreen` modal titles in the selected language using `useTranslation()`

2.4 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL display `SettingsScreen` button labels in the selected language using `useTranslation()`

2.5 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL display the `App.tsx` transaction modal titles in the selected language using `useTranslation()`

2.6 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL display the `App.tsx` success toast message in the selected language using `useTranslation()`

2.7 WHEN the user changes the language to any non-Portuguese option THEN the system SHALL set the `App.tsx` modal aria-labels in the selected language using `useTranslation()`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the selected language is Portuguese THEN the system SHALL CONTINUE TO display all UI strings in Portuguese exactly as before

3.2 WHEN the user navigates between tabs THEN the system SHALL CONTINUE TO display sidebar and bottom tab navigation labels in the selected language (this already works and must not regress)

3.3 WHEN the user changes the language THEN the system SHALL CONTINUE TO persist the language preference to localStorage and restore it on reload

3.4 WHEN the user opens a modal in `SettingsScreen` (e.g., change name, change password) THEN the system SHALL CONTINUE TO perform the same functional operations (save name, change password, delete account) regardless of the selected language

3.5 WHEN the user submits a transaction form THEN the system SHALL CONTINUE TO save the transaction correctly regardless of the selected language

---

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type { component: string, idioma: Idioma }
  OUTPUT: boolean

  RETURN X.idioma ≠ 'pt'
    AND X.component IN { 'SettingsScreen', 'App' }
END FUNCTION
```

### Property: Fix Checking

```pascal
// Property: Fix Checking — UI strings reflect selected language
FOR ALL X WHERE isBugCondition(X) DO
  renderedText ← render(X.component, idioma = X.idioma)
  ASSERT renderedText does NOT contain hardcoded Portuguese strings
  ASSERT renderedText CONTAINS translated strings for X.idioma
END FOR
```

### Property: Preservation Checking

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT render(X.component, idioma = 'pt') = render_original(X.component, idioma = 'pt')
END FOR
```
