// Requisito 7.3 — abas de navegação inferiores com largura total para mobile

interface BottomTabsProps {
  activeTab: 'transacoes' | 'carteiras';
  onTabChange: (tab: 'transacoes' | 'carteiras') => void;
}

const tabs: { id: 'transacoes' | 'carteiras'; label: string; icon: React.ReactNode }[] = [
  {
    id: 'transacoes',
    label: 'Transações',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'carteiras',
    label: 'Carteiras',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
];

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        display: 'flex',
        background: '#fff',
        borderTop: '1px solid #e0e0e0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        zIndex: 100,
      }}
    >
      {/* Tabs — Requisito 7.1: ícone + texto, Requisito 7.3: largura total */}
      {tabs.map(({ id, label, icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              borderTop: isActive ? '3px solid #1565c0' : '3px solid transparent',
              color: isActive ? '#1565c0' : '#757575',
              fontSize: '12px',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </nav>
  );
}
