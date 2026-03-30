import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { RegisterScreen } from './RegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

type Tela = 'login' | 'register' | 'forgot';

export function LoginScreen(): JSX.Element {
  const { loginComEmail, loginComGoogle, loginComApple, carregando, erro } = useAuth();
  const [tela, setTela] = useState<Tela>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  if (tela === 'register') {
    return <RegisterScreen onVoltar={() => setTela('login')} />;
  }

  if (tela === 'forgot') {
    return <ForgotPasswordScreen onVoltar={() => setTela('login')} />;
  }

  function validar(): boolean {
    let valido = true;
    setErroEmail('');
    setErroSenha('');

    if (!email.includes('@') || !email.includes('.')) {
      setErroEmail('Digite um email válido, como exemplo@email.com.');
      valido = false;
    }
    if (senha.length < 8) {
      setErroSenha('A senha precisa ter pelo menos 8 caracteres.');
      valido = false;
    }
    return valido;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    await loginComEmail(email, senha);
  }

  return (
    <div data-testid="login-screen">
      <h1>Entrar no Flowly</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={carregando}
          />
          {erroEmail && <span role="alert">{erroEmail}</span>}
        </div>

        <div>
          <label htmlFor="login-senha">Senha</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              id="login-senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              disabled={carregando}
            />
            <button
              type="button"
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setMostrarSenha((v) => !v)}
              disabled={carregando}
            >
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {erroSenha && <span role="alert">{erroSenha}</span>}
        </div>

        {erro && <span role="alert">{erro}</span>}

        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <button type="button" onClick={() => loginComGoogle()} disabled={carregando}>
        Entrar com Google
      </button>

      <button type="button" onClick={() => loginComApple()} disabled={carregando}>
        Entrar com Apple
      </button>

      <button type="button" onClick={() => setTela('forgot')} disabled={carregando}>
        Esqueci minha senha
      </button>

      <button type="button" onClick={() => setTela('register')} disabled={carregando}>
        Criar conta
      </button>
    </div>
  );
}
