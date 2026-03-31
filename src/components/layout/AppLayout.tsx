import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar, type Tab } from './Sidebar';
import { BottomTabs } from './BottomTabs';

interface AppLayoutProps {
  children: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg, #f5f7fa)' }}>
        <main style={{ flex: 1, padding: '16px', paddingBottom: '72px', overflowY: 'auto' }}>
          {children}
        </main>
        <BottomTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg, #f5f7fa)' }}>
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
