import { useState } from 'react';
import type { TransactionInput } from './types/flowly';
import { RepositoryProvider } from './repository/RepositoryContext';
import { AppLayout } from './components/layout/AppLayout';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionForm } from './components/transactions/TransactionForm';
import { WalletList } from './components/wallets/WalletList';
import { Toast } from './components/shared/Toast';
import { SyncIndicator } from './components/shared/SyncIndicator';
import { useFlowly } from './hooks/useFlowly';

// ---------------------------------------------------------------------------
// Inner app — must be inside RepositoryProvider to use useFlowly
// ---------------------------------------------------------------------------

function FlowlyApp() {
  const {
    transacoes,
    carteiras,
    carregando: sincronizando,
    erro,
    adicionarTransacao,
    copiarTransacao,
    duplicarTransacao,
    moverTransacao,
    removerTransacao,
    adicionarCarteira,
    obterSaldoTotal,
  } = useFlowly();

  const [activeTab, setActiveTab] = useState<'transacoes' | 'carteiras'>('transacoes');
  const [formAberto, setFormAberto] = useState(false);
  const [dadosCopia, setDadosCopia] = useState<TransactionInput | undefined>(undefined);
  const [toastErro, setToastErro] = useState<string | null>(null);
  const [toastSucesso, setToastSucesso] = useState<string | null>(null);

  // Sync erro from useFlowly into toast — Requisito 3.8
  // We use a local toastErro that mirrors `erro` but can be dismissed
  const erroVisivel = toastErro ?? erro;

  function handleCopiar(id: string) {
    try {
      const dados = copiarTransacao(id);
      setDadosCopia(dados);
      setFormAberto(true);
    } catch (e) {
      setToastErro(e instanceof Error ? e.message : 'Erro ao copiar transação.');
    }
  }

  function handleAbrirForm() {
    setDadosCopia(undefined);
    setFormAberto(true);
  }

  function handleFecharForm() {
    setFormAberto(false);
    setDadosCopia(undefined);
  }

  async function handleSubmitTransacao(dados: TransactionInput) {
    await adicionarTransacao(dados);
    // If no error was set, show success toast
    if (!erro) {
      setToastSucesso('Pronto! A transação foi salva.');
      handleFecharForm();
    }
  }

  const nomeCarteiras = carteiras.map((c) => c.nome);

  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
    boxSizing: 'border-box',
  };

  const modalPanel: React.CSSProperties = {
    background: '#fff',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    boxSizing: 'border-box',
  };

  const addBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '20px',
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* SyncIndicator — Requisito 6.4 */}
      {sincronizando && (
        <div style={{ marginBottom: '12px' }}>
          <SyncIndicator sincronizando={sincronizando} />
        </div>
      )}

      {/* Transações tab */}
      {activeTab === 'transacoes' && (
        <div>
          <button
            type="button"
            onClick={handleAbrirForm}
            style={addBtnStyle}
            aria-label="Adicionar transação"
          >
            {/* Plus icon — Requisito 7.1 */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar Transação
          </button>

          <TransactionList
            transacoes={transacoes}
            carteiras={nomeCarteiras}
            onCopiar={handleCopiar}
            onDuplicar={duplicarTransacao}
            onMover={moverTransacao}
            onRemover={removerTransacao}
          />
        </div>
      )}

      {/* Carteiras tab — Requisito 5.1, 5.2, 5.5 */}
      {activeTab === 'carteiras' && (
        <WalletList
          carteiras={carteiras}
          saldoTotal={obterSaldoTotal()}
          onAdicionarCarteira={adicionarCarteira}
        />
      )}

      {/* TransactionForm modal — Requisito 3.1, 3.3 */}
      {formAberto && (
        <div
          role="presentation"
          style={modalOverlay}
          onClick={handleFecharForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dadosCopia ? 'Copiar transação' : 'Nova transação'}
            style={modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#212121' }}>
              {dadosCopia ? 'Copiar Transação' : 'Nova Transação'}
            </h2>
            <TransactionForm
              carteiras={nomeCarteiras}
              initialData={dadosCopia}
              onSubmit={handleSubmitTransacao}
              onCancel={handleFecharForm}
              erro={erro}
            />
          </div>
        </div>
      )}

      {/* Toast — erro do useFlowly — Requisito 3.8, 7.5 */}
      <Toast
        message={erroVisivel}
        type="error"
        onDismiss={() => setToastErro(null)}
      />

      {/* Toast — sucesso — Requisito 3.2, 7.4 */}
      <Toast
        message={toastSucesso}
        type="success"
        onDismiss={() => setToastSucesso(null)}
      />
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Root — wraps with RepositoryProvider — Requisito 2.5
// ---------------------------------------------------------------------------

function App() {
  return (
    <RepositoryProvider>
      <FlowlyApp />
    </RepositoryProvider>
  );
}

export default App;
