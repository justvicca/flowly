import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';

// Requisitos: 7.2, 7.3

interface AppLayoutProps {
  children: ReactNode;
  activeTab: 'transacoes' | 'carteiras';
  onTabChange: (tab: 'transacoes' | 'carteiras') => void;
}

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Requisito 7.3 — mobile: conteúdo + abas inferiores
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main
          style={{
            flex: 1,
            padding: '16px',
            paddingBottom: '72px', // space for BottomTabs
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
        <BottomTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    );
  }

  // Requisito 7.2 — desktop/tablet: sidebar fixa + área de conteúdo
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <main
        style={{
          marginLeft: '220px',
          flex: 1,
          padding: '32px',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}
