import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext, type AuthContextValue } from './AuthContext';
import type { Sessao } from './IAuthRepository';

// Requisitos: 1.1, 5.5

function mockAuthValue(overrides: Partial<AuthContextValue>): AuthContextValue {
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

const mockSessao: Sessao = {
  usuario: { id: 'user-1', nome: 'Test User', email: 'test@example.com' },
  token: 'token-abc',
  expiresAt: Date.now() + 3600_000,
};

describe('ProtectedRoute', () => {
  it('renderiza SplashScreen quando carregando === true', () => {
    render(
      <AuthContext.Provider value={mockAuthValue({ carregando: true })}>
        <ProtectedRoute>
          <div data-testid="protected-content">Conteúdo protegido</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
  });

  it('renderiza LoginScreen quando sessao === null e carregando === false', () => {
    render(
      <AuthContext.Provider value={mockAuthValue({ sessao: null, carregando: false })}>
        <ProtectedRoute>
          <div data-testid="protected-content">Conteúdo protegido</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('renderiza children quando há sessão ativa', () => {
    render(
      <AuthContext.Provider value={mockAuthValue({ sessao: mockSessao, usuario: mockSessao.usuario, carregando: false })}>
        <ProtectedRoute>
          <div data-testid="protected-content">Conteúdo protegido</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });
});
