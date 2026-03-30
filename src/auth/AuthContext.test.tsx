import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthService } from './AuthService';
import { MockAuthRepository } from './MockAuthRepository';
import type { Sessao } from './IAuthRepository';

// Helper component to expose context values in tests
function AuthConsumer({ onValue }: { onValue: (v: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onValue(auth);
  return null;
}

function renderWithProvider(authService: AuthService) {
  let capturedValue: ReturnType<typeof useAuth> | null = null;

  render(
    <AuthProvider authService={authService}>
      <AuthConsumer onValue={(v) => { capturedValue = v; }} />
    </AuthProvider>
  );

  return { getValue: () => capturedValue! };
}

describe('AuthProvider', () => {
  it('carregando: true durante verificação inicial de sessão', async () => {
    // Delay obterSessaoAtual so we can observe carregando: true
    let resolveSession!: (s: Sessao | null) => void;
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);
    vi.spyOn(authService, 'obterSessaoAtual').mockReturnValue(
      new Promise<Sessao | null>((res) => { resolveSession = res; })
    );

    let capturedValue: ReturnType<typeof useAuth> | null = null;
    render(
      <AuthProvider authService={authService}>
        <AuthConsumer onValue={(v) => { capturedValue = v; }} />
      </AuthProvider>
    );

    // Before the promise resolves, carregando should be true
    expect(capturedValue!.carregando).toBe(true);
    expect(capturedValue!.sessao).toBeNull();

    // Resolve the session
    await act(async () => { resolveSession(null); });

    expect(capturedValue!.carregando).toBe(false);
  });

  it('estado atualizado corretamente após login bem-sucedido', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    const { getValue } = renderWithProvider(authService);

    // Wait for initial session check to complete
    await waitFor(() => expect(getValue().carregando).toBe(false));

    await act(async () => {
      // Register first so login works
      await repo.registrarComEmail('Test User', 'test@example.com', 'password123');
      await getValue().loginComEmail('test@example.com', 'password123');
    });

    const value = getValue();
    expect(value.sessao).not.toBeNull();
    expect(value.usuario).not.toBeNull();
    expect(value.usuario?.email).toBe('test@example.com');
    expect(value.erro).toBeNull();
  });

  it('estado limpo após logout', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    // Pre-register a user
    await repo.registrarComEmail('Test User', 'test@example.com', 'password123');

    const { getValue } = renderWithProvider(authService);

    // Wait for initial session check (should restore the session)
    await waitFor(() => expect(getValue().carregando).toBe(false));

    // Ensure we have a session
    await act(async () => {
      await getValue().loginComEmail('test@example.com', 'password123');
    });
    expect(getValue().sessao).not.toBeNull();

    // Now logout
    await act(async () => {
      await getValue().logout();
    });

    const value = getValue();
    expect(value.sessao).toBeNull();
    expect(value.usuario).toBeNull();
    expect(value.carregando).toBe(false);
  });

  it('restaura sessão existente ao montar', async () => {
    const repo = new MockAuthRepository();
    // Pre-login so there's an active session
    await repo.registrarComEmail('Existing User', 'existing@example.com', 'password123');

    const authService = new AuthService(repo);
    const { getValue } = renderWithProvider(authService);

    await waitFor(() => expect(getValue().carregando).toBe(false));

    expect(getValue().sessao).not.toBeNull();
    expect(getValue().usuario?.email).toBe('existing@example.com');
  });

  it('useAuth lança erro quando usado fora do AuthProvider', () => {
    function BadConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useAuth deve ser usado dentro de um AuthProvider'
    );
  });

  it('expõe erro após login com credenciais inválidas', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    const { getValue } = renderWithProvider(authService);
    await waitFor(() => expect(getValue().carregando).toBe(false));

    await act(async () => {
      await getValue().loginComEmail('naoexiste@example.com', 'password123');
    });

    expect(getValue().sessao).toBeNull();
    expect(getValue().erro).toBeTruthy();
  });
});

describe('AuthProvider — login social', () => {
  it('estado atualizado após loginComGoogle bem-sucedido', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    const { getValue } = renderWithProvider(authService);
    await waitFor(() => expect(getValue().carregando).toBe(false));

    await act(async () => {
      await getValue().loginComGoogle();
    });

    expect(getValue().sessao).not.toBeNull();
    expect(getValue().usuario?.email).toBe('usuario.google@gmail.com');
  });

  it('estado atualizado após loginComApple bem-sucedido', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    const { getValue } = renderWithProvider(authService);
    await waitFor(() => expect(getValue().carregando).toBe(false));

    await act(async () => {
      await getValue().loginComApple();
    });

    expect(getValue().sessao).not.toBeNull();
    expect(getValue().usuario?.email).toBe('usuario.apple@icloud.com');
  });
});

describe('AuthProvider — registrarComEmail', () => {
  it('cria sessão após registro bem-sucedido', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    const { getValue } = renderWithProvider(authService);
    await waitFor(() => expect(getValue().carregando).toBe(false));

    await act(async () => {
      await getValue().registrarComEmail('Novo Usuário', 'novo@example.com', 'senha1234');
    });

    expect(getValue().sessao).not.toBeNull();
    expect(getValue().usuario?.email).toBe('novo@example.com');
    expect(getValue().usuario?.nome).toBe('Novo Usuário');
  });
});

describe('AuthProvider — recuperarSenha', () => {
  it('não lança erro ao chamar recuperarSenha', async () => {
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);

    const { getValue } = renderWithProvider(authService);
    await waitFor(() => expect(getValue().carregando).toBe(false));

    await expect(
      act(async () => { await getValue().recuperarSenha('qualquer@example.com'); })
    ).resolves.not.toThrow();
  });
});

describe('AuthProvider — exibe tela de carregamento', () => {
  it('renderiza children enquanto carregando', async () => {
    let resolveSession!: (s: null) => void;
    const repo = new MockAuthRepository();
    const authService = new AuthService(repo);
    vi.spyOn(authService, 'obterSessaoAtual').mockReturnValue(
      new Promise<null>((res) => { resolveSession = res; })
    );

    render(
      <AuthProvider authService={authService}>
        <span data-testid="child">conteúdo</span>
      </AuthProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();

    await act(async () => { resolveSession(null); });
  });
});
