import { useTranslation } from '../contexts/PreferencesContext';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const tr = useTranslation();
  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label="Confirmação"
        style={{ background: 'var(--surface, #fff)', borderRadius: '8px', padding: '24px', maxWidth: '400px', width: '90%', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
        onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
        <p style={{ margin: '0 0 24px', fontSize: '16px', color: 'var(--text, #333)' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', cursor: 'pointer', background: 'none', border: '1px solid var(--border, #ccc)', borderRadius: '4px', color: 'var(--text, #333)' }}>
            {tr('cancelar')}
          </button>
          <button onClick={onConfirm} style={{ padding: '8px 20px', cursor: 'pointer', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {tr('confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
