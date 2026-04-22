import { useEffect, useState } from 'react';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SHARED_ARTIFACT_HASH_PREFIX, loadSharedArtifact } from './data/shared-artifacts';
import { SharedArtifactView } from './features/shared/SharedArtifactView';
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
  const [sharedArtifactId, setSharedArtifactId] = useState<string | null>(() => {
    const hash = window.location.hash;
    return hash.startsWith(SHARED_ARTIFACT_HASH_PREFIX) ? hash.slice(SHARED_ARTIFACT_HASH_PREFIX.length) : null;
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      setSharedArtifactId(hash.startsWith(SHARED_ARTIFACT_HASH_PREFIX) ? hash.slice(SHARED_ARTIFACT_HASH_PREFIX.length) : null);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (sharedArtifactId) {
    return (
      <SharedArtifactView
        payload={loadSharedArtifact(sharedArtifactId)}
        onClose={() => { window.location.hash = ''; }}
      />
    );
  }

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
