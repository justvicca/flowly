import { useState } from 'react';
import type { TransactionInput } from '../../types/flowly';
import { RecurrenceToggle } from './RecurrenceToggle';

interface TransactionFormProps {
  carteiras: string[];
  initialData?: TransactionInput;
  onSubmit: (dados: TransactionInput) => Promise<void>;
  onCancel?: () => void;
  erro?: string | null;
}

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultForm(carteiras: string[], initial?: TransactionInput): TransactionInput {
  return {
    descricao: initial?.descricao ?? '',
    valor: initial?.valor ?? 0,
    data: initial?.data ?? hoje(),
    tipo: initial?.tipo ?? 'saida',
    carteira_origem: initial?.carteira_origem ?? carteiras[0] ?? '',
    fixo: initial?.fixo ?? false,
  };
}

export function TransactionForm({ carteiras, initialData, onSubmit, onCancel, erro }: TransactionFormProps) {
  const [form, setForm] = useState<TransactionInput>(() => defaultForm(carteiras, initialData));
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function set<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSucesso(false);
    setEnviando(true);
    try {
      await onSubmit(form);
      // Only show success if parent didn't set an error (erro prop will be null/undefined)
      setSucesso(true);
    } finally {
      setEnviando(false);
    }
  }

  // When erro prop is set, keep form data (don't reset) — Requisito 3.8
  // When submit succeeds (sucesso), show confirmation — Requisito 3.2

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '15px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 600,
    fontSize: '14px',
    color: '#333',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: '480px' }}>
      {/* Success message — Requisito 3.2 */}
      {sucesso && !erro && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            background: '#e8f5e9',
            border: '1px solid #a5d6a7',
            borderRadius: '4px',
            color: '#2e7d32',
            fontSize: '14px',
          }}
        >
          ✓ Pronto! A transação foi salva.
        </div>
      )}

      {/* Error message from repository — Requisito 3.8 */}
      {erro && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            background: '#ffebee',
            border: '1px solid #ef9a9a',
            borderRadius: '4px',
            color: '#c62828',
            fontSize: '14px',
          }}
        >
          {erro}
        </div>
      )}

      {/* Descrição */}
      <div style={fieldStyle}>
        <label htmlFor="tf-descricao" style={labelStyle}>Descrição</label>
        <input
          id="tf-descricao"
          type="text"
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Ex: Aluguel, Salário..."
          required
          style={inputStyle}
        />
      </div>

      {/* Valor */}
      <div style={fieldStyle}>
        <label htmlFor="tf-valor" style={labelStyle}>Valor (R$)</label>
        <input
          id="tf-valor"
          type="number"
          min="0.01"
          step="0.01"
          value={form.valor === 0 ? '' : form.valor}
          onChange={(e) => set('valor', parseFloat(e.target.value) || 0)}
          placeholder="0,00"
          required
          style={inputStyle}
        />
      </div>

      {/* Data */}
      <div style={fieldStyle}>
        <label htmlFor="tf-data" style={labelStyle}>Data</label>
        <input
          id="tf-data"
          type="date"
          value={form.data}
          onChange={(e) => set('data', e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      {/* Tipo */}
      <div style={fieldStyle}>
        <label htmlFor="tf-tipo" style={labelStyle}>Tipo</label>
        <select
          id="tf-tipo"
          value={form.tipo}
          onChange={(e) => set('tipo', e.target.value as 'entrada' | 'saida')}
          style={inputStyle}
        >
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
      </div>

      {/* Carteira */}
      <div style={fieldStyle}>
        <label htmlFor="tf-carteira" style={labelStyle}>Carteira</label>
        <select
          id="tf-carteira"
          value={form.carteira_origem}
          onChange={(e) => set('carteira_origem', e.target.value)}
          style={inputStyle}
        >
          {carteiras.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Fixo — via RecurrenceToggle */}
      <div style={fieldStyle}>
        <span style={labelStyle}>Recorrência</span>
        <RecurrenceToggle value={form.fixo} onChange={(v) => set('fixo', v)} />
      </div>

      {/* Actions — Requisito 7.1: icon + text */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          type="submit"
          disabled={enviando}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '15px',
            cursor: enviando ? 'not-allowed' : 'pointer',
            opacity: enviando ? 0.7 : 1,
          }}
        >
          {/* Save icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {enviando ? 'Salvando...' : 'Salvar'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: 'none',
              color: '#555',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            {/* Cancel icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
