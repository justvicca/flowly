import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface ForgotPasswordScreenProps {
  onVoltar: () => void;
}

export function ForgotPasswordScreen({ onVoltar }: ForgotPasswordScreenProps): JSX.Element {
  const { recuperarSenha, carregando } = useAuth();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [erroEmail, setErroEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroEmail('');

    if (!email.includes('@') || !email.includes('.')) {
      setErroEmail('Digite um email válido, como exemplo@email.com.');
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
          Enviamos um link para {emailEnviado}. Verifique sua caixa de entrada.
        </p>
        <button type="button" onClick={onVoltar}>
          Voltar para login
        </button>
      </div>
    );
  }

  return (
    <div data-testid="forgot-password-screen">
      <h1>Recuperar senha</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={carregando}
          />
          {erroEmail && <span role="alert">{erroEmail}</span>}
        </div>

        <button type="submit" disabled={carregando}>
          {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>

      <button type="button" onClick={onVoltar} disabled={carregando}>
        Voltar para login
      </button>
    </div>
  );
}
