import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface RegisterScreenProps {
  onVoltar: () => void;
}

export function RegisterScreen({ onVoltar }: RegisterScreenProps): JSX.Element {
  const { registrarComEmail, carregando } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroNome, setErroNome] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroGeral, setErroGeral] = useState('');

  function validar(): boolean {
    let valido = true;
    setErroNome('');
    setErroEmail('');
    setErroSenha('');
    setErroGeral('');

    if (!nome.trim()) {
      setErroNome('Digite seu nome completo.');
      valido = false;
    }
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
    const result = await registrarComEmail(nome, email, senha);
    // registrarComEmail updates AuthContext state; errors surface via AuthContext.erro
    // but we also handle inline via the returned result if needed
    if (result !== undefined && typeof result === 'object' && 'erro' in (result as object)) {
      setErroGeral((result as { erro: string }).erro);
    }
  }

  return (
    <div data-testid="register-screen">
      <h1>Criar conta</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="register-nome">Nome completo</label>
          <input
            id="register-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            disabled={carregando}
          />
          {erroNome && <span role="alert">{erroNome}</span>}
        </div>

        <div>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={carregando}
          />
          {erroEmail && <span role="alert">{erroEmail}</span>}
        </div>

        <div>
          <label htmlFor="register-senha">Senha</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              id="register-senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
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

        {erroGeral && <span role="alert">{erroGeral}</span>}

        <button type="submit" disabled={carregando}>
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <button type="button" onClick={onVoltar} disabled={carregando}>
        Voltar para login
      </button>
    </div>
  );
}
