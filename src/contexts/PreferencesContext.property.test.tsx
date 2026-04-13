/**
 * Bug Condition & Preservation Property Tests
 *
 * Property 1: Hardcoded Portuguese Strings in Non-Portuguese Languages
 * Property 2: Preservation — Portuguese Rendering Unchanged
 *
 * Validates: Requirements 1.1–1.7, 2.1–2.7, 3.1–3.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AuthContext } from '../auth/AuthContext';
import type { AuthContextValue } from '../auth/AuthContext';
import type { Idioma } from '../contexts/PreferencesContext';

// ── Mock AuthContext ────────────────────────────────────────────────────────

const mockAuthValue: AuthContextValue = {
  usuario: { id: 'user-1', nome: 'Test User', email: 'test@example.com' },
  sessao: null,
  carregando: false,
  erro: null,
  loginComEmail: vi.fn(),
  registrarComEmail: vi.fn(),
  loginComGoogle: vi.fn(),
  loginComApple: vi.fn(),
  logout: vi.fn(),
  recuperarSenha: vi.fn(),
};

// ── Helper ──────────────────────────────────────────────────────────────────

function renderSettingsWithLanguage(idioma: Idioma) {
  localStorage.setItem(
    'flowly:preferences',
    JSON.stringify({ tema: 'claro', moeda: { codigo: 'BRL', simbolo: 'R$', nome: 'Real Brasileiro' }, idioma })
  );
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <PreferencesProvider>
        <SettingsScreen />
      </PreferencesProvider>
    </AuthContext.Provider>
  );
}

// Expected translated section titles per language (strings that should appear)
const expectedSectionTitles: Record<Idioma, { conta: string; seguranca: string }> = {
  pt: { conta: 'Conta',   seguranca: 'Segurança' },
  en: { conta: 'Account', seguranca: 'Security' },
  de: { conta: 'Konto',   seguranca: 'Sicherheit' },
  es: { conta: 'Cuenta',  seguranca: 'Seguridad' },
  fr: { conta: 'Compte',  seguranca: 'Sécurité' },
  it: { conta: 'Account', seguranca: 'Sicurezza' },
};

// ── Property 1: Bug Condition ───────────────────────────────────────────────

describe('Property 1: Bug Condition — Translated strings appear for non-Portuguese languages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const nonPortugueseLanguages: Idioma[] = ['en', 'de', 'es', 'fr', 'it'];

  for (const lang of nonPortugueseLanguages) {
    it(`[${lang}] section title "Conta" (PT) should NOT be present`, () => {
      renderSettingsWithLanguage(lang);
      expect(screen.queryByText('Conta')).toBeNull();
    });

    it(`[${lang}] section title "Segurança" (PT) should NOT be present`, () => {
      renderSettingsWithLanguage(lang);
      expect(screen.queryByText('Segurança')).toBeNull();
    });

    it(`[${lang}] translated section title should appear`, () => {
      renderSettingsWithLanguage(lang);
      expect(screen.getByText(expectedSectionTitles[lang].conta)).toBeTruthy();
      expect(screen.getByText(expectedSectionTitles[lang].seguranca)).toBeTruthy();
    });
  }
});

// ── Property 2: Preservation ────────────────────────────────────────────────

describe('Property 2: Preservation — Portuguese Rendering Unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('[pt] SettingsScreen contains all Portuguese section titles', () => {
    renderSettingsWithLanguage('pt');
    expect(screen.getByText('Conta')).toBeTruthy();
    expect(screen.getByText('Segurança')).toBeTruthy();
    expect(screen.getByText('Aparência')).toBeTruthy();
    expect(screen.getByText('Sessão')).toBeTruthy();
    expect(screen.getByText('Zona de perigo')).toBeTruthy();
  });

  it('[pt] SettingsScreen contains all Portuguese row labels', () => {
    renderSettingsWithLanguage('pt');
    expect(screen.getByText('Nome')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Alterar senha')).toBeTruthy();
    expect(screen.getByText('Tema')).toBeTruthy();
    expect(screen.getByText('Moeda')).toBeTruthy();
    expect(screen.getByText('Idioma')).toBeTruthy();
    expect(screen.getByText('Sair da conta')).toBeTruthy();
    expect(screen.getByText('Excluir conta')).toBeTruthy();
  });
});
