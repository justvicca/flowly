import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePreferences, MOEDAS, type Tema } from '../contexts/PreferencesContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text2)',
        marginBottom: '8px', paddingLeft: '4px',
      }}>
        {title}
      </p>
      <div style={{
        background: 'var(--surface)', borderRadius: '14px',
        overflow: 'hidden', border: '1px solid var(--border)',
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label, sublabel, right, onClick, danger = false, border = true,
}: {
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  border?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 18px',
        background: 'transparent', border: 'none',
        borderBottom: border ? '1px solid var(--border)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: '15px', color: danger ? '#e53935' : 'var(--text)', fontWeight: 500 }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text2)' }}>{sublabel}</p>
        )}
      </div>
      {right && <div style={{ color: 'var(--text2)', fontSize: '14px' }}>{right}</div>}
    </button>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Modal genérico ─────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: '10px',
          border: '1px solid var(--border)', background: 'var(--surface2)',
          color: 'var(--text)', fontSize: '15px', boxSizing: 'border-box', outline: 'none',
        }}
      />
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, danger }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
        background: danger ? '#e53935' : 'var(--primary)', color: danger ? '#fff' : 'var(--primary-text)',
        fontSize: '15px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, marginTop: '8px',
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { usuario, logout } = useAuth();
  const { tema, moeda, setTema, setMoeda } = usePreferences();

  const [modal, setModal] = useState<
    'nome' | 'senha' | 'moeda' | 'tema' | 'excluir' | null
  >(null);

  // Form states
  const [novoNome, setNovoNome] = useState(usuario?.nome ?? '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [feedback, setFeedback] = useState('');
  const [senhaExcluir, setSenhaExcluir] = useState('');

  function fechar() {
    setModal(null);
    setFeedback('');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setSenhaExcluir('');
  }

  // ── Alterar nome ──────────────────────────────────────────────────────────

  function salvarNome() {
    if (!novoNome.trim()) { setFeedback('O nome não pode estar vazio.'); return; }
    // Atualiza no localStorage
    const KEY_USERS = 'flowly:auth:users';
    try {
      const raw = localStorage.getItem(KEY_USERS);
      if (raw) {
        const users = JSON.parse(raw) as { userId: string; nome: string; email: string; senhaHash: string }[];
        const idx = users.findIndex((u) => u.userId === usuario?.id);
        if (idx !== -1) {
          users[idx].nome = novoNome.trim();
          localStorage.setItem(KEY_USERS, JSON.stringify(users));
        }
      }
      // Atualiza sessão
      const KEY_SESSAO = 'flowly:auth:sessao';
      const rawS = localStorage.getItem(KEY_SESSAO);
      if (rawS) {
        const sessao = JSON.parse(rawS);
        sessao.usuario.nome = novoNome.trim();
        localStorage.setItem(KEY_SESSAO, JSON.stringify(sessao));
      }
    } catch { /* ignore */ }
    setFeedback('Nome atualizado! Recarregue para ver a mudança.');
  }

  // ── Alterar senha ─────────────────────────────────────────────────────────

  function salvarSenha() {
    if (!senhaAtual) { setFeedback('Digite a senha atual.'); return; }
    if (novaSenha.length < 8) { setFeedback('A nova senha precisa ter pelo menos 8 caracteres.'); return; }
    if (novaSenha !== confirmarSenha) { setFeedback('As senhas não coincidem.'); return; }

    const KEY_USERS = 'flowly:auth:users';
    try {
      const raw = localStorage.getItem(KEY_USERS);
      if (!raw) { setFeedback('Usuário não encontrado.'); return; }
      const users = JSON.parse(raw) as { userId: string; nome: string; email: string; senhaHash: string }[];
      const idx = users.findIndex((u) => u.userId === usuario?.id);
      if (idx === -1) { setFeedback('Usuário não encontrado.'); return; }
      if (users[idx].senhaHash !== senhaAtual) { setFeedback('Senha atual incorreta.'); return; }
      users[idx].senhaHash = novaSenha;
      localStorage.setItem(KEY_USERS, JSON.stringify(users));
      setFeedback('Senha alterada com sucesso!');
    } catch { setFeedback('Erro ao alterar senha.'); }
  }

  // ── Excluir conta ─────────────────────────────────────────────────────────

  function excluirConta() {
    const KEY_USERS = 'flowly:auth:users';
    try {
      const raw = localStorage.getItem(KEY_USERS);
      if (raw) {
        const users = JSON.parse(raw) as { userId: string; senhaHash: string }[];
        const user = users.find((u) => u.userId === usuario?.id);
        if (!user) { setFeedback('Usuário não encontrado.'); return; }
        if (user.senhaHash !== senhaExcluir) { setFeedback('Senha incorreta.'); return; }
        const novos = users.filter((u) => u.userId !== usuario?.id);
        localStorage.setItem(KEY_USERS, JSON.stringify(novos));
      }
      // Remove dados do usuário
      if (usuario?.id) {
        localStorage.removeItem(`flowly:transacoes:${usuario.id}`);
        localStorage.removeItem(`flowly:carteiras:${usuario.id}`);
      }
      logout();
    } catch { setFeedback('Erro ao excluir conta.'); }
  }

  const temas: { id: Tema; label: string; desc: string }[] = [
    { id: 'claro', label: '☀️ Claro', desc: 'Fundo branco, visual limpo' },
    { id: 'escuro', label: '🌙 Escuro', desc: 'Fundo escuro, menos cansativo à noite' },
    { id: 'creme', label: '🍂 Creme', desc: 'Tom quente e aconchegante' },
  ];

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '8px 0 40px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>
        Configurações
      </h1>

      {/* Conta */}
      <Section title="Conta">
        <Row
          label="Nome"
          sublabel={usuario?.nome}
          right={<ChevronRight />}
          onClick={() => { setNovoNome(usuario?.nome ?? ''); setModal('nome'); }}
        />
        <Row
          label="Email"
          sublabel={usuario?.email}
          border={false}
        />
      </Section>

      {/* Segurança */}
      <Section title="Segurança">
        <Row
          label="Alterar senha"
          right={<ChevronRight />}
          onClick={() => setModal('senha')}
          border={false}
        />
      </Section>

      {/* Aparência */}
      <Section title="Aparência">
        <Row
          label="Tema"
          sublabel={temas.find((t) => t.id === tema)?.label}
          right={<ChevronRight />}
          onClick={() => setModal('tema')}
        />
        <Row
          label="Moeda"
          sublabel={`${moeda.simbolo} — ${moeda.nome}`}
          right={<ChevronRight />}
          onClick={() => setModal('moeda')}
          border={false}
        />
      </Section>

      {/* Sessão */}
      <Section title="Sessão">
        <Row
          label="Sair da conta"
          right={<ChevronRight />}
          onClick={() => logout()}
          border={false}
        />
      </Section>

      {/* Zona de perigo */}
      <Section title="Zona de perigo">
        <Row
          label="Excluir conta"
          sublabel="Remove todos os seus dados permanentemente"
          danger
          right={<ChevronRight />}
          onClick={() => setModal('excluir')}
          border={false}
        />
      </Section>

      {/* ── Modais ── */}

      {modal === 'nome' && (
        <Modal title="Alterar nome" onClose={fechar}>
          <Input label="Novo nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
          {feedback && <p style={{ color: feedback.includes('!') ? 'green' : '#e53935', fontSize: '13px', margin: '4px 0' }}>{feedback}</p>}
          <PrimaryBtn onClick={salvarNome}>Salvar</PrimaryBtn>
        </Modal>
      )}

      {modal === 'senha' && (
        <Modal title="Alterar senha" onClose={fechar}>
          <Input label="Senha atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          <Input label="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
          <Input label="Confirmar nova senha" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
          {feedback && <p style={{ color: feedback.includes('!') ? 'green' : '#e53935', fontSize: '13px', margin: '4px 0' }}>{feedback}</p>}
          <PrimaryBtn onClick={salvarSenha}>Salvar</PrimaryBtn>
        </Modal>
      )}

      {modal === 'tema' && (
        <Modal title="Escolher tema" onClose={fechar}>
          {temas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTema(t.id); fechar(); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '14px 16px', marginBottom: '8px',
                background: tema === t.id ? 'var(--surface2)' : 'transparent',
                border: `2px solid ${tema === t.id ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>{t.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text2)' }}>{t.desc}</p>
              </div>
              {tema === t.id && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </Modal>
      )}

      {modal === 'moeda' && (
        <Modal title="Escolher moeda" onClose={fechar}>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {MOEDAS.map((m) => (
              <button
                key={m.codigo}
                type="button"
                onClick={() => { setMoeda(m); fechar(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '12px 16px', marginBottom: '6px',
                  background: moeda.codigo === m.codigo ? 'var(--surface2)' : 'transparent',
                  border: `2px solid ${moeda.codigo === m.codigo ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>
                  {m.simbolo} <span style={{ fontWeight: 400, color: 'var(--text2)' }}>{m.nome}</span>
                </span>
                {moeda.codigo === m.codigo && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'excluir' && (
        <Modal title="Excluir conta" onClose={fechar}>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '16px' }}>
            Esta ação é irreversível. Todos os seus dados serão apagados permanentemente.
            Digite sua senha para confirmar.
          </p>
          <Input label="Senha" type="password" value={senhaExcluir} onChange={(e) => setSenhaExcluir(e.target.value)} />
          {feedback && <p style={{ color: '#e53935', fontSize: '13px', margin: '4px 0' }}>{feedback}</p>}
          <PrimaryBtn danger onClick={excluirConta}>Excluir minha conta</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}
