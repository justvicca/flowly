// Feature: flowly-auth, Property 1: roteamento sem sessão redireciona para login
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';

// Validates: Requirements 1.1

function makeAuthValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    usuario: null,
    sessao: null,
    carregando: false,
    erro: null,
    loginComEmail: async () => {},
    registrarComEmail: async () => {},
    loginComGoogle: async () => {},
    loginComApple: async () => {},
    logout: async () => {},
    recuperarSenha: async () => {},
    ...overrides,
  };
}

describe('ProtectedRoute — testes de propriedade', () => {
  it('P1: para qualquer estado sem sessão e sem carregamento, renderiza LoginScreen e não renderiza children', () => {
    // Feature: flowly-auth, Property 1: roteamento sem sessão redireciona para login
    fc.assert(
      fc.property(
        fc.constant(null),
        (sessao) => {
          const { unmount } = render(
            <PreferencesProvider>
              <AuthContext.Provider value={makeAuthValue({ sessao, carregando: false })}>
                <ProtectedRoute>
                  <div data-testid="children-content">Conteúdo protegido</div>
                </ProtectedRoute>
              </AuthContext.Provider>
            </PreferencesProvider>
          );

          const loginScreen = screen.queryByTestId('login-screen');
          const childrenContent = screen.queryByTestId('children-content');

          unmount();

          return loginScreen !== null && childrenContent === null;
        }
      ),
      { numRuns: 100 }
    );

    expect(true).toBe(true);
  });
});
