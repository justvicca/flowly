import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from '../../contexts/PreferencesContext';
import { RegisterScreen } from './RegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

type Tela = 'login' | 'register' | 'forgot';

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}



function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#eef1f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,
  card: { background: '#eef1f5', width: '100%', maxWidth: '400px' } as React.CSSProperties,
  title: { fontSize: '15px', fontWeight: 600, color: '#1a1a2e', marginBottom: '24px' } as React.CSSProperties,
  inputWrap: {
    background: '#fff', borderRadius: '14px', padding: '16px 18px',
    marginBottom: '12px', display: 'flex', alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#333', background: 'transparent' } as React.CSSProperties,
  forgotRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' } as React.CSSProperties,
  forgotBtn: { background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', padding: 0 } as React.CSSProperties,
  signInBtn: {
    width: '100%', padding: '17px', background: '#8b5e6d', color: '#fff',
    border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600,
    cursor: 'pointer', marginBottom: '28px', boxShadow: '0 4px 14px rgba(139,94,109,0.35)',
  } as React.CSSProperties,
  divider: { textAlign: 'center' as const, color: '#aaa', fontSize: '13px', marginBottom: '24px' },
  socialRow: { display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' } as React.CSSProperties,
  socialBtn: {
    width: '64px', height: '64px', background: '#fff', border: 'none',
    borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  registerRow: { textAlign: 'center' as const, fontSize: '14px', color: '#888' },
  registerLink: { background: 'none', border: 'none', color: '#8b5e6d', fontWeight: 600, cursor: 'pointer', fontSize: '14px', padding: 0 } as React.CSSProperties,
  errorText: { color: '#c0392b', fontSize: '12px', marginTop: '-8px', marginBottom: '8px', paddingLeft: '4px' } as React.CSSProperties,
};

// Usa History API para que o botão voltar do navegador funcione
function useTela(inicial: Tela) {
  const [tela, setTelaState] = useState<Tela>(() => {
    const hash = window.location.hash;
    if (hash === '#register') return 'register';
    if (hash === '#forgot') return 'forgot';
    return inicial;
  });

  function setTela(nova: Tela) {
    if (nova === 'login') {
      history.pushState(null, '', window.location.pathname);
    } else {
      history.pushState(null, '', `#${nova}`);
    }
    setTelaState(nova);
  }

  useEffect(() => {
    function onPop() {
      const hash = window.location.hash;
      if (hash === '#register') setTelaState('register');
      else if (hash === '#forgot') setTelaState('forgot');
      else setTelaState('login');
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return [tela, setTela] as const;
}

export function LoginScreen(): JSX.Element {
  const { loginComEmail, loginComGoogle, carregando, erro } = useAuth();
  const tr = useTranslation();
  const [tela, setTela] = useTela('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  if (tela === 'register') return <RegisterScreen onVoltar={() => setTela('login')} />;
  if (tela === 'forgot') return <ForgotPasswordScreen onVoltar={() => setTela('login')} />;

  function validar(): boolean {
    let ok = true;
    setErroEmail(''); setErroSenha('');
    if (!email.includes('@') || !email.slice(email.indexOf('@')).includes('.')) {
      setErroEmail(tr('erroEmailInvalido')); ok = false;
    }
    if (senha.length < 8) {
      setErroSenha(tr('erroSenhaCurta')); ok = false;
    }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    await loginComEmail(email, senha);
  }

  // Mostra erro de social apenas se não for silencioso
  const erroVisivel = erro && erro !== '' ? erro : null;

  return (
    <div data-testid="login-screen" style={s.page}>
      <div style={s.card}>
        <p style={s.title}>{tr('bemVindoFlowly')}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={s.inputWrap}>
            <input id="login-email" type="email" placeholder={tr('placeholder_email')} value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              disabled={carregando} style={s.input} aria-label={tr('email')} />
          </div>
          {erroEmail && <p style={s.errorText} role="alert">{erroEmail}</p>}

          <div style={s.inputWrap}>
            <input id="login-senha" type={mostrarSenha ? 'text' : 'password'} placeholder={tr('placeholder_senha')}
              value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password"
              disabled={carregando} style={s.input} aria-label={tr('senha')} />
            <button type="button" aria-label={mostrarSenha ? tr('ocultarSenha') : tr('mostrarSenha')}
              onClick={() => setMostrarSenha((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex' }}>
              {mostrarSenha ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
          {erroSenha && <p style={s.errorText} role="alert">{erroSenha}</p>}

          <div style={s.forgotRow}>
            <button type="button" style={s.forgotBtn} onClick={() => setTela('forgot')}>
              {tr('esqueceuSenha')}
            </button>
          </div>

          {erroVisivel && <p style={{ ...s.errorText, marginBottom: '12px' }} role="alert">{erroVisivel}</p>}

          <button type="submit" disabled={carregando}
            style={{ ...s.signInBtn, opacity: carregando ? 0.7 : 1 }}>
            {carregando ? tr('entrando') : tr('entrar')}
          </button>
        </form>

        <div style={s.divider}>{tr('ouContinueCom')}</div>

        <div style={s.socialRow}>
          <button type="button" aria-label={`${tr('entrar')} com Google`} onClick={() => loginComGoogle()}
            disabled={carregando} style={s.socialBtn}>
            <GoogleIcon />
          </button>
        </div>

        <div style={s.registerRow}>
          {tr('naoTemConta')}{' '}
          <button type="button" style={s.registerLink} onClick={() => setTela('register')}>
            {tr('criarConta')}
          </button>
        </div>
      </div>
    </div>
  );
}
