import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

function mockAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    usuario: null,
    sessao: null,
    carregando: false,
    erro: null,
    loginComEmail: vi.fn().mockResolvedValue(undefined),
    registrarComEmail: vi.fn().mockResolvedValue(undefined),
    loginComGoogle: vi.fn().mockResolvedValue(undefined),
    loginComApple: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    recuperarSenha: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderWithAuth(ui: React.ReactElement, authOverrides: Partial<AuthContextValue> = {}) {
  const auth = mockAuthValue(authOverrides);
  render(
    <AuthContext.Provider value={auth}>
      {ui}
    </AuthContext.Provider>
  );
  return { auth };
}

// ---------------------------------------------------------------------------
// LoginScreen
// ---------------------------------------------------------------------------

describe('LoginScreen', () => {
  it('renderiza campos com labels visíveis (email e senha)', () => {
    renderWithAuth(<LoginScreen />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('botão de alternar visibilidade da senha funciona', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginScreen />);

    const senhaInput = screen.getByLabelText('Senha');
    expect(senhaInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /mostrar senha/i });
    await user.click(toggleBtn);

    expect(senhaInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /ocultar senha/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ocultar senha/i }));
    expect(senhaInput).toHaveAttribute('type', 'password');
  });

  it('link "Esqueci minha senha" está presente', () => {
    renderWithAuth(<LoginScreen />);
    expect(screen.getByRole('button', { name: /esqueci minha senha/i })).toBeInTheDocument();
  });

  it('exibe estado de carregamento: botão desabilitado durante processamento', () => {
    renderWithAuth(<LoginScreen />, { carregando: true });

    const submitBtn = screen.getByRole('button', { name: /entrando/i });
    expect(submitBtn).toBeDisabled();
  });

  it('chama loginComEmail ao submeter formulário com dados válidos', async () => {
    const user = userEvent.setup();
    const loginComEmail = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<LoginScreen />, { loginComEmail });

    await user.type(screen.getByLabelText('Email'), 'teste@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha1234');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(loginComEmail).toHaveBeenCalledWith('teste@email.com', 'senha1234');
  });

  it('exibe erro de email inválido abaixo do campo', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginScreen />);

    await user.type(screen.getByLabelText('Email'), 'emailinvalido');
    await user.type(screen.getByLabelText('Senha'), 'senha1234');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(screen.getByText(/email válido/i)).toBeInTheDocument();
  });

  it('navega para ForgotPasswordScreen ao clicar em "Esqueci minha senha"', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginScreen />);

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));

    expect(screen.getByTestId('forgot-password-screen')).toBeInTheDocument();
  });

  it('navega para RegisterScreen ao clicar em "Criar conta"', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginScreen />);

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(screen.getByTestId('register-screen')).toBeInTheDocument();
  });

  it('botões de login social estão presentes', () => {
    renderWithAuth(<LoginScreen />);

    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com apple/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// RegisterScreen
// ---------------------------------------------------------------------------

describe('RegisterScreen', () => {
  it('renderiza campos com labels visíveis (nome, email, senha)', () => {
    renderWithAuth(<RegisterScreen onVoltar={() => {}} />);

    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('botão de alternar visibilidade da senha funciona', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterScreen onVoltar={() => {}} />);

    const senhaInput = screen.getByLabelText('Senha');
    expect(senhaInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /mostrar senha/i }));
    expect(senhaInput).toHaveAttribute('type', 'text');
  });

  it('exibe erros sem fechar o formulário nem apagar os dados', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterScreen onVoltar={() => {}} />);

    await user.type(screen.getByLabelText('Nome completo'), 'João Silva');
    await user.type(screen.getByLabelText('Email'), 'emailinvalido');
    await user.type(screen.getByLabelText('Senha'), 'curta');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    // Form still visible
    expect(screen.getByTestId('register-screen')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();

    // Data preserved
    expect(screen.getByLabelText('Nome completo')).toHaveValue('João Silva');
    expect(screen.getByLabelText('Email')).toHaveValue('emailinvalido');

    // Errors shown
    expect(screen.getByText(/email válido/i)).toBeInTheDocument();
    expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
  });

  it('chama registrarComEmail ao submeter com dados válidos', async () => {
    const user = userEvent.setup();
    const registrarComEmail = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<RegisterScreen onVoltar={() => {}} />, { registrarComEmail });

    await user.type(screen.getByLabelText('Nome completo'), 'Maria Souza');
    await user.type(screen.getByLabelText('Email'), 'maria@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha5678');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(registrarComEmail).toHaveBeenCalledWith('Maria Souza', 'maria@email.com', 'senha5678');
  });

  it('link de voltar para login está presente', () => {
    renderWithAuth(<RegisterScreen onVoltar={() => {}} />);
    expect(screen.getByRole('button', { name: /voltar para login/i })).toBeInTheDocument();
  });

  it('chama onVoltar ao clicar em "Voltar para login"', async () => {
    const user = userEvent.setup();
    const onVoltar = vi.fn();
    renderWithAuth(<RegisterScreen onVoltar={onVoltar} />);

    await user.click(screen.getByRole('button', { name: /voltar para login/i }));
    expect(onVoltar).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ForgotPasswordScreen
// ---------------------------------------------------------------------------

describe('ForgotPasswordScreen', () => {
  it('renderiza campo de email com label visível', () => {
    renderWithAuth(<ForgotPasswordScreen onVoltar={() => {}} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('exibe mensagem de sucesso uniforme após envio', async () => {
    const user = userEvent.setup();
    const recuperarSenha = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<ForgotPasswordScreen onVoltar={() => {}} />, { recuperarSenha });

    await user.type(screen.getByLabelText('Email'), 'usuario@email.com');
    await user.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/enviamos um link para usuario@email\.com/i)).toBeInTheDocument();
      expect(screen.getByText(/verifique sua caixa de entrada/i)).toBeInTheDocument();
    });
  });

  it('exibe a mesma mensagem de sucesso para email não cadastrado', async () => {
    const user = userEvent.setup();
    // recuperarSenha always resolves (uniform response per req 7.4)
    const recuperarSenha = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<ForgotPasswordScreen onVoltar={() => {}} />, { recuperarSenha });

    await user.type(screen.getByLabelText('Email'), 'naoexiste@email.com');
    await user.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/enviamos um link para naoexiste@email\.com/i)).toBeInTheDocument();
    });
  });

  it('chama onVoltar ao clicar em "Voltar para login"', async () => {
    const user = userEvent.setup();
    const onVoltar = vi.fn();
    renderWithAuth(<ForgotPasswordScreen onVoltar={onVoltar} />);

    await user.click(screen.getByRole('button', { name: /voltar para login/i }));
    expect(onVoltar).toHaveBeenCalled();
  });
});
