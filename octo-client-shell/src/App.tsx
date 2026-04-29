import { useEffect, useState } from 'react';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SHARED_ARTIFACT_HASH_PREFIX, loadSharedArtifact } from './data/shared-artifacts';
import { SharedArtifactView } from './features/shared/SharedArtifactView';
import { ClientShell, type PendingNav } from './layout/ClientShell';
import { TopNavBar, type AppTab } from './layout/TopNavBar';
import { ChatPage } from './pages/ChatPage';
import { StudioPage } from './pages/StudioPage';

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
  const [activeTab, setActiveTab] = useState<AppTab>('Cowork');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(loadNavCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
  const [chatMounted, setChatMounted] = useState(false);
  const [studioMounted, setStudioMounted] = useState(false);
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

  // Mount Chat lazily on first visit, then keep it alive
  const handleTabChange = (tab: AppTab) => {
    if (tab === 'Chat') setChatMounted(true);
    if (tab === 'Studio') setStudioMounted(true);
    setActiveTab(tab);
  };

  if (sharedArtifactId) {
    return (
      <SharedArtifactView
        payload={loadSharedArtifact(sharedArtifactId)}
        onClose={() => { window.location.hash = ''; }}
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f3f6fb] flex flex-col">
      <TopNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="flex-1 min-h-0 relative">
        {/* Cowork: always mounted, hidden when not active */}
        <div className={`absolute inset-0 ${activeTab === 'Cowork' ? '' : 'hidden'}`}>
          <ClientShell
            isNavCollapsed={isNavCollapsed}
            setIsNavCollapsed={setIsNavCollapsed}
            pendingNav={pendingNav}
            onNavHandled={() => setPendingNav(null)}
            onOpenSearch={() => setSearchOpen(true)}
            showWindowControls={false}
            hideSidebarHeader
          />
        </div>

        {/* Chat: lazily mounted, kept alive after first visit */}
        {chatMounted && (
          <div className={`absolute inset-0 ${activeTab === 'Chat' ? '' : 'hidden'}`}>
            <ChatPage />
          </div>
        )}

        {/* Studio: lazily mounted, kept alive after first visit */}
        {studioMounted && (
          <div className={`absolute inset-0 ${activeTab === 'Studio' ? '' : 'hidden'}`}>
            <StudioPage />
          </div>
        )}
      </div>

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
