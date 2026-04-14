import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from '../../contexts/PreferencesContext';

interface ForgotPasswordScreenProps {
  onVoltar: () => void;
}

export function ForgotPasswordScreen({ onVoltar }: ForgotPasswordScreenProps): JSX.Element {
  const { recuperarSenha, carregando } = useAuth();
  const tr = useTranslation();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [erroEmail, setErroEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroEmail('');
    if (!email.includes('@') || !email.includes('.')) {
      setErroEmail(tr('erroEmailInvalido'));
      return;
    }
    await recuperarSenha(email);
    setEmailEnviado(email);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div data-testid="forgot-password-screen">
        <p role="status">
          {tr('linkEnviado')} {emailEnviado}. {tr('verificarCaixa')}
        </p>
        <button type="button" onClick={onVoltar}>
          {tr('voltarLogin')}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="forgot-password-screen">
      <h1>{tr('recuperarSenha')}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="forgot-email">{tr('email')}</label>
          <input id="forgot-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={carregando} />
          {erroEmail && <span role="alert">{erroEmail}</span>}
        </div>
        <button type="submit" disabled={carregando}>
          {carregando ? tr('enviando') : tr('enviarLink')}
        </button>
      </form>
      <button type="button" onClick={onVoltar} disabled={carregando}>
        {tr('voltarLogin')}
      </button>
    </div>
  );
}
