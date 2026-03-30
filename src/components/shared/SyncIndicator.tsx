interface SyncIndicatorProps {
  sincronizando: boolean;
}

export function SyncIndicator({ sincronizando }: SyncIndicatorProps) {
  if (!sincronizando) return null;

  return (
    <div
      aria-label="Sincronizando dados"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '12px',
        background: '#e3f2fd',
        color: '#1565c0',
        fontSize: '12px',
        fontWeight: 500,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ animation: 'flowly-spin 1s linear infinite' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Sincronizando...
      <style>{`
        @keyframes flowly-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
