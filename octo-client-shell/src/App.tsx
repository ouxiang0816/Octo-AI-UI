import { useState } from 'react';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ClientShell, type PendingNav } from './layout/ClientShell';

const NAV_COLLAPSED_KEY = 'octo.client.navCollapsed';

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function loadNavCollapsed(): boolean {
  return safeStorageGet(NAV_COLLAPSED_KEY) === '1';
}

export default function App() {
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(loadNavCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f3f6fb]">
      <ClientShell
        isNavCollapsed={isNavCollapsed}
        setIsNavCollapsed={setIsNavCollapsed}
        pendingNav={pendingNav}
        onNavHandled={() => setPendingNav(null)}
        onOpenSearch={() => setSearchOpen(true)}
        showWindowControls={false}
      />

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(target) => {
          setPendingNav(target);
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
