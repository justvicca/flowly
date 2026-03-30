// Requisito 7.2 — barra lateral fixa para telas largas (desktop/tablet)

interface SidebarProps {
  activeTab: 'transacoes' | 'carteiras';
  onTabChange: (tab: 'transacoes' | 'carteiras') => void;
}

const navItems: { id: 'transacoes' | 'carteiras'; label: string; icon: React.ReactNode }[] = [
  {
    id: 'transacoes',
    label: 'Transações',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'carteiras',
    label: 'Carteiras',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '220px',
        height: '100vh',
        background: '#1565c0',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '32px',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        zIndex: 100,
      }}
    >
      {/* App title */}
      <div
        style={{
          padding: '0 24px 28px',
          color: '#fff',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          marginBottom: '12px',
        }}
      >
        Flowly
      </div>

      {/* Nav items — Requisito 7.1: ícone + texto */}
      {navItems.map(({ id, label, icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 24px',
              background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
              border: 'none',
              borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
              fontSize: '15px',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s, color 0.15s',
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
