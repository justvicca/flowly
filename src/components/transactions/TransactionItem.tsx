import { useState } from 'react';
import type { Transaction } from '../../types/flowly';
import { usePreferences } from '../../contexts/PreferencesContext';

interface TransactionItemProps {
  transaction: Transaction;
  carteiras: string[];
  onCopiar: (id: string) => void;
  onDuplicar: (id: string) => Promise<void>;
  onMover: (id: string, novaCarteira: string) => Promise<void>;
  onApagar: (id: string) => void;
}

function formatarValor(valor: number, codigoMoeda: string): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: codigoMoeda });
}

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  border: '1px solid var(--border, #ccc)',
  borderRadius: '4px',
  background: 'var(--surface, #fff)',
  color: 'var(--text, #333)',
  fontSize: '13px',
  cursor: 'pointer',
  fontWeight: 500,
};

export function TransactionItem({
  transaction,
  carteiras,
  onCopiar,
  onDuplicar,
  onMover,
  onApagar,
}: TransactionItemProps) {
  const [movendoPara, setMovendoPara] = useState('');
  const [mostrarMover, setMostrarMover] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
  const [movendo, setMovendo] = useState(false);

  const { id, descricao, valor, tipo, data, fixo, carteira_origem } = transaction;
  const { moeda } = usePreferences();
  const isEntrada = tipo === 'entrada';
  const valorCor = isEntrada ? '#2e7d32' : '#c62828';

  async function handleDuplicar() {
    setDuplicando(true);
    try {
      await onDuplicar(id);
    } finally {
      setDuplicando(false);
    }
  }

  async function handleMoverConfirmar() {
    if (!movendoPara || movendoPara === carteira_origem) {
      setMostrarMover(false);
      return;
    }
    setMovendo(true);
    try {
      await onMover(id, movendoPara);
      setMostrarMover(false);
      setMovendoPara('');
    } finally {
      setMovendo(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px 16px',
    border: fixo ? '2px solid var(--primary, #1565c0)' : '1px solid var(--border, #e0e0e0)',
    borderRadius: '6px',
    background: fixo ? 'color-mix(in srgb, var(--primary, #1565c0) 10%, var(--surface, #fff))' : 'var(--surface, #fff)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  };

  return (
    <article style={cardStyle} aria-label={`Transação: ${descricao}`}>
      {/* Fixed badge — Requisito 4.1 */}
      {fixo && (
        <span
          aria-label="Transação fixa"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            background: '#1976d2',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {/* Repeat icon */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          FIXA
        </span>
      )}

      {/* Main info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text, #212121)' }}>{descricao}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2, #757575)', marginTop: '2px' }}>
            {formatarData(data)} · {carteira_origem} · {isEntrada ? 'Entrada' : 'Saída'}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: '17px', color: valorCor }}>
          {isEntrada ? '+' : '-'}{formatarValor(valor, moeda.codigo)}
        </div>
      </div>

      {/* Action buttons — Requisito 7.1: icon + text */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
        {/* Copiar — Requisito 3.3 */}
        <button
          type="button"
          onClick={() => onCopiar(id)}
          style={btnBase}
          aria-label="Copiar transação"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copiar
        </button>

        {/* Duplicar — Requisito 3.4 */}
        <button
          type="button"
          onClick={handleDuplicar}
          disabled={duplicando}
          style={{ ...btnBase, opacity: duplicando ? 0.6 : 1, cursor: duplicando ? 'not-allowed' : 'pointer' }}
          aria-label="Duplicar transação"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
            <rect x="11" y="11" width="10" height="10" rx="1" />
          </svg>
          {duplicando ? 'Duplicando...' : 'Duplicar'}
        </button>

        {/* Mover — Requisito 3.5 */}
        <button
          type="button"
          onClick={() => { setMostrarMover((v) => !v); setMovendoPara(carteira_origem); }}
          style={{ ...btnBase, background: mostrarMover ? 'color-mix(in srgb, var(--primary,#1565c0) 15%, var(--surface,#fff))' : 'var(--surface,#fff)', borderColor: mostrarMover ? 'var(--primary,#1976d2)' : 'var(--border,#ccc)', color: mostrarMover ? 'var(--primary,#1565c0)' : 'var(--text,#333)' }}
          aria-label="Mover transação para outra carteira"
          aria-expanded={mostrarMover}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
          Mover
        </button>

        {/* Apagar — Requisito 3.6 */}
        <button
          type="button"
          onClick={() => onApagar(id)}
          style={{ ...btnBase, color: '#e53935', borderColor: '#ef9a9a' }}
          aria-label="Apagar transação"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Apagar
        </button>
      </div>

      {/* Mover dropdown — Requisito 3.5 */}
      {mostrarMover && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'var(--surface2, #f5f5f5)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: '4px',
            flexWrap: 'wrap',
          }}
          role="group"
          aria-label="Selecionar carteira de destino"
        >
          <label htmlFor={`mover-select-${id}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text, #333)' }}>
            Mover para:
          </label>
          <select
            id={`mover-select-${id}`}
            value={movendoPara}
            onChange={(e) => setMovendoPara(e.target.value)}
            style={{ padding: '5px 8px', border: '1px solid var(--border,#ccc)', borderRadius: '4px', fontSize: '13px', background: 'var(--surface,#fff)', color: 'var(--text,#333)' }}
          >
            {carteiras.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleMoverConfirmar}
            disabled={movendo || movendoPara === carteira_origem}
            style={{
              ...btnBase,
              background: '#1976d2',
              color: '#fff',
              borderColor: '#1565c0',
              opacity: movendo || movendoPara === carteira_origem ? 0.6 : 1,
              cursor: movendo || movendoPara === carteira_origem ? 'not-allowed' : 'pointer',
            }}
          >
            {movendo ? 'Movendo...' : 'Confirmar'}
          </button>
          <button
            type="button"
            onClick={() => setMostrarMover(false)}
            style={{ ...btnBase, color: '#555' }}
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}
