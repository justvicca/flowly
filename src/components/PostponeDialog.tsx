import { useState } from 'react';
import { validatePostponeDate } from '../utils/validation';

interface PostponeDialogProps {
  onConfirm: (newScheduledAt: Date) => void;
  onCancel: () => void;
}

export function PostponeDialog({ onConfirm, onCancel }: PostponeDialogProps) {
  const [dateValue, setDateValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!dateValue) {
      setError('Informe uma data e horário.');
      return;
    }

    const date = new Date(dateValue);
    const result = validatePostponeDate(date);

    if (!result.ok) {
      setError(result.error[0].message);
      return;
    }

    setError(null);
    onConfirm(date);
  }

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adiar tarefa"
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 500 }}>
          Adiar tarefa
        </p>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          Nova data e horário
        </label>
        <input
          type="datetime-local"
          value={dateValue}
          onChange={(e) => {
            setDateValue(e.target.value);
            setError(null);
          }}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: error ? '1px solid #d32f2f' : '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p
            role="alert"
            style={{ margin: '6px 0 0', fontSize: '13px', color: '#d32f2f' }}
          >
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
