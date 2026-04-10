// Requisito 7.2 — barra lateral fixa para telas largas (desktop/tablet)
import { useTranslation } from '../../contexts/PreferencesContext';

export type Tab = 'transacoes' | 'carteiras' | 'bancos' | 'configuracoes';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
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
  {
    id: 'bancos',
    label: 'Bancos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="3" y1="22" x2="21" y2="22" />
        <line x1="6" y1="18" x2="6" y2="11" />
        <line x1="10" y1="18" x2="10" y2="11" />
        <line x1="14" y1="18" x2="14" y2="11" />
        <line x1="18" y1="18" x2="18" y2="11" />
        <polygon points="12 2 20 7 4 7" />
      </svg>
    ),
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tr = useTranslation();
  const labels: Record<Tab, string> = {
    transacoes: tr('transacoes'),
    carteiras: tr('carteiras'),
    bancos: tr('bancos'),
    configuracoes: tr('configuracoes'),
  };
  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '220px',
        height: '100vh',
        background: 'var(--nav-bg, #1565c0)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '32px',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        zIndex: 100,
      }}
    >
      <div style={{
        padding: '0 24px 28px',
        color: 'var(--nav-text, #fff)',
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        marginBottom: '12px',
      }}>
        Flowly
      </div>

      {navItems.map(({ id, icon }) => {
        const isActive = activeTab === id;
        const label = labels[id];
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
              borderLeft: isActive ? '4px solid rgba(255,255,255,0.9)' : '4px solid transparent',
              color: isActive ? 'var(--nav-text, #fff)' : 'rgba(255,255,255,0.7)',
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
