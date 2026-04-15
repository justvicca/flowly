import { useState, useEffect } from 'react';
import type { TransactionInput } from './types/flowly';
import { AuthRepositoryProvider } from './auth/AuthRepositoryContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RepositoryProvider } from './repository/RepositoryContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AppLayout } from './components/layout/AppLayout';
import type { Tab } from './components/layout/Sidebar';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionForm } from './components/transactions/TransactionForm';
import { WalletList } from './components/wallets/WalletList';
import { Toast } from './components/shared/Toast';
import { SyncIndicator } from './components/shared/SyncIndicator';
import { SettingsScreen } from './screens/SettingsScreen';
import { BankConnectionScreen } from './screens/BankConnectionScreen';
import { useFlowly } from './hooks/useFlowly';
import { useTranslation } from './contexts/PreferencesContext';

// Mapeia hash da URL para tab
function hashToTab(hash: string): Tab {
  if (hash === '#carteiras') return 'carteiras';
  if (hash === '#bancos') return 'bancos';
  if (hash === '#configuracoes') return 'configuracoes';
  return 'transacoes';
}

function tabToHash(tab: Tab): string {
  if (tab === 'transacoes') return '';
  return `#${tab}`;
}

function useTabNav(): [Tab, (t: Tab) => void] {
  const [activeTab, setActiveTabState] = useState<Tab>(() => hashToTab(window.location.hash));

  function setActiveTab(tab: Tab) {
    const hash = tabToHash(tab);
    history.pushState(null, '', hash ? hash : window.location.pathname);
    setActiveTabState(tab);
  }

  useEffect(() => {
    function onPop() {
      setActiveTabState(hashToTab(window.location.hash));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return [activeTab, setActiveTab];
}

export function FlowlyAppContent() {
  const tr = useTranslation();
  const {
    transacoes, carteiras, carregando: sincronizando, erro,
    adicionarTransacao, copiarTransacao, duplicarTransacao,
    moverTransacao, removerTransacao, adicionarCarteira,
  } = useFlowly();

  const [activeTab, setActiveTab] = useTabNav();
  const [formAberto, setFormAberto] = useState(false);
  const [dadosCopia, setDadosCopia] = useState<TransactionInput | undefined>(undefined);
  const [toastErro, setToastErro] = useState<string | null>(null);
  const [toastSucesso, setToastSucesso] = useState<string | null>(null);

  const erroVisivel = toastErro ?? erro;

  function handleCopiar(id: string) {
    try {
      setDadosCopia(copiarTransacao(id));
      setFormAberto(true);
    } catch (e) {
      setToastErro(e instanceof Error ? e.message : 'Erro ao copiar transação.');
    }
  }

  function handleAbrirForm() { setDadosCopia(undefined); setFormAberto(true); }
  function handleFecharForm() { setFormAberto(false); setDadosCopia(undefined); }

  async function handleSubmitTransacao(dados: TransactionInput) {
    await adicionarTransacao(dados);
    if (!erro) { setToastSucesso(tr('transacaoSalva')); handleFecharForm(); }
  }

  const nomeCarteiras = carteiras.map((c) => c.nome);

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px', boxSizing: 'border-box',
  };

  const modalPanel: React.CSSProperties = {
    background: 'var(--surface, #fff)', borderRadius: '12px', padding: '24px',
    width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)', boxSizing: 'border-box',
  };

  const addBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 20px', background: 'var(--primary, #1976d2)',
    color: 'var(--primary-text, #fff)', border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px',
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {sincronizando && (
        <div style={{ marginBottom: '12px' }}>
          <SyncIndicator sincronizando={sincronizando} />
        </div>
      )}

      {activeTab === 'transacoes' && (
        <div>
          <button type="button" onClick={handleAbrirForm} style={addBtnStyle} aria-label={tr('adicionarTransacao')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {tr('adicionarTransacao')}
          </button>
          <TransactionList
            transacoes={transacoes} carteiras={nomeCarteiras}
            onCopiar={handleCopiar} onDuplicar={duplicarTransacao}
            onMover={moverTransacao} onRemover={removerTransacao}
          />
        </div>
      )}

      {activeTab === 'carteiras' && (
        <WalletList carteiras={carteiras} onAdicionarCarteira={(nome, moeda) => adicionarCarteira(nome, moeda)} />
      )}

      {activeTab === 'configuracoes' && <SettingsScreen />}
      {activeTab === 'bancos' && <BankConnectionScreen />}

      {formAberto && (
        <div role="presentation" style={modalOverlay} onClick={handleFecharForm}>
          <div role="dialog" aria-modal="true" aria-label={dadosCopia ? tr('copiarTransacao') : tr('novaTransacao')} style={modalPanel} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: 'var(--text, #212121)' }}>
              {dadosCopia ? tr('copiarTransacao') : tr('novaTransacao')}
            </h2>
            <TransactionForm carteiras={nomeCarteiras} initialData={dadosCopia} onSubmit={handleSubmitTransacao} onCancel={handleFecharForm} erro={erro} />
          </div>
        </div>
      )}

      <Toast message={erroVisivel} type="error" onDismiss={() => setToastErro(null)} />
      <Toast message={toastSucesso} type="success" onDismiss={() => setToastSucesso(null)} />
    </AppLayout>
  );
}

function App() {
  return (
    <PreferencesProvider>
      <AuthRepositoryProvider>
        <RepositoryProvider>
          <ProtectedRoute>
            <FlowlyAppContent />
          </ProtectedRoute>
        </RepositoryProvider>
      </AuthRepositoryProvider>
    </PreferencesProvider>
  );
}

export default App;
