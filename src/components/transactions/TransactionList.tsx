import { useState } from 'react';
import type { Transaction } from '../../types/flowly';
import { ConfirmDialog } from '../ConfirmDialog';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transacoes: Transaction[];
  carteiras: string[];
  onCopiar: (id: string) => void;
  onDuplicar: (id: string) => Promise<void>;
  onMover: (id: string, novaCarteira: string) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}

export function TransactionList({
  transacoes,
  carteiras,
  onCopiar,
  onDuplicar,
  onMover,
  onRemover,
}: TransactionListProps) {
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  function handleApagar(id: string) {
    setConfirmandoId(id);
  }

  async function handleConfirmarRemocao() {
    if (!confirmandoId) return;
    const id = confirmandoId;
    setConfirmandoId(null);
    await onRemover(id);
    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 3000);
  }

  function handleCancelarRemocao() {
    setConfirmandoId(null);
  }

  if (transacoes.length === 0) {
    return (
      <p style={{ color: '#757575', textAlign: 'center', padding: '24px 0' }}>
        Nenhuma transação encontrada.
      </p>
    );
  }

  return (
    <div>
      {/* Requisito 3.7 — mensagem de sucesso após remoção */}
      {mensagemSucesso && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '10px 16px',
            marginBottom: '16px',
            background: '#e8f5e9',
            border: '1px solid #a5d6a7',
            borderRadius: '4px',
            color: '#2e7d32',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Pronto! A transação foi removida.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {transacoes.map((t) => (
          <TransactionItem
            key={t.id}
            transaction={t}
            carteiras={carteiras}
            onCopiar={onCopiar}
            onDuplicar={onDuplicar}
            onMover={onMover}
            onApagar={handleApagar}
          />
        ))}
      </div>

      {/* Requisito 3.6 — confirmação antes de remover */}
      {confirmandoId && (
        <ConfirmDialog
          message="Tem certeza que deseja apagar esta transação? Esta ação não pode ser desfeita."
          onConfirm={handleConfirmarRemocao}
          onCancel={handleCancelarRemocao}
        />
      )}
    </div>
  );
}
