interface RecurrenceToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function RecurrenceToggle({ value, onChange }: RecurrenceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={value ? 'Transação fixa — clique para desmarcar' : 'Transação não fixa — clique para marcar como fixa'}
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        border: '2px solid',
        borderColor: value ? '#1565c0' : '#bdbdbd',
        borderRadius: '24px',
        background: value ? '#1976d2' : '#ffffff',
        color: value ? '#ffffff' : '#757575',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: value ? '0 2px 8px rgba(25, 118, 210, 0.35)' : '0 1px 3px rgba(0,0,0,0.08)',
        outline: 'none',
        userSelect: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid #1976d2';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {/* Repeat / recurrence icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>

      <span>{value ? 'Fixa' : 'Não fixa'}</span>

      {/* Active indicator dot */}
      {value && (
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#ffffff',
            opacity: 0.8,
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}
