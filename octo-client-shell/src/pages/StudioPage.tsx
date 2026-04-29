import { useState, useCallback } from 'react';
import { MessageSquarePlus, Settings, X } from 'lucide-react';
import { OctoBuild, type OctoBuildState } from './OctoBuild';
import unionIcon from '../assets/icons/union.svg';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StudioSession {
  id: string;
  title: string;
  updatedAt: number;
  isDraft: boolean;
  state: OctoBuildState;
}

function makeId(p = 'id') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyState(): OctoBuildState {
  return { deliverables: [], activeWorkflow: null, readyWorkflows: [], msgs: [], canvaState: null };
}

function createSession(title = '新建创作'): StudioSession {
  return { id: makeId('studio'), title, updatedAt: Date.now(), isDraft: true, state: createEmptyState() };
}

// ─── Studio Sidebar ────────────────────────────────────────────────────────────
function StudioSidebar({
  isCollapsed,
  onCollapse,
  sessions,
  activeId,
  onSelect,
  onNewSession,
  onDelete,
}: {
  isCollapsed: boolean;
  onCollapse: () => void;
  sessions: StudioSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  onDelete: (id: string) => void;
}) {
  const history = [...sessions]
    .filter(s => !s.isDraft)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside
      className="shrink-0 flex flex-col h-full transition-[width] duration-200 overflow-hidden"
      style={{
        width: isCollapsed ? 56 : 240,
        background: 'rgba(248,249,252,0.8)',
        borderRight: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Title */}
      <div className={`h-[54px] shrink-0 flex items-center ${isCollapsed ? 'justify-center px-[8px]' : 'px-[16px]'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-[8px] flex-1 min-w-0">
            <img src={unionIcon} alt="" aria-hidden className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[16px] font-semibold text-[#191919] leading-none select-none">Studio</span>
          </div>
        )}
      </div>

      {/* New session button */}
      <div className={`shrink-0 ${isCollapsed ? 'px-[8px] pb-[4px]' : 'px-[12px] pb-[4px]'}`}>
        <button
          onClick={onNewSession}
          title="新建创作"
          className={`w-full flex items-center rounded-[8px] px-[10px] py-[8px] text-[14px] text-[#191919] hover:bg-[rgba(0,0,0,0.05)] transition-colors ${isCollapsed ? 'justify-center' : 'gap-[10px]'}`}
        >
          <MessageSquarePlus size={16} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">新建创作</span>}
        </button>
      </div>

      {/* History list */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-[12px] py-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-[11px] font-medium text-[rgba(25,25,25,0.42)] tracking-wide px-[10px] py-[4px] select-none">
            历史记录
          </div>
          {history.length === 0 ? (
            <div className="px-[10px] py-[4px] text-[12px] text-[rgba(25,25,25,0.38)]">暂无创作记录</div>
          ) : (
            <div className="flex flex-col gap-[2px]">
              {history.map(session => {
                const isActive = session.id === activeId;
                return (
                  <div key={session.id} className="group relative">
                    <button
                      onClick={() => onSelect(session.id)}
                      className={`w-full text-left px-[10px] py-[7px] pr-[28px] rounded-[7px] text-[13px] leading-[18px] transition-colors ${
                        isActive
                          ? 'bg-[rgba(20,118,255,0.10)] text-[#1476ff]'
                          : 'text-[#333] hover:bg-[rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <span className="block truncate">{session.title}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                      className="absolute right-[6px] top-1/2 -translate-y-1/2 hidden group-hover:flex w-[18px] h-[18px] items-center justify-center rounded text-[#aaa] hover:text-[#e11d48] hover:bg-[#fef2f2]"
                      title="删除"
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {isCollapsed && <div className="flex-1" />}

      {/* Bottom: Settings + collapse */}
      <div className={`shrink-0 ${isCollapsed ? 'px-[8px] py-[8px]' : 'px-[12px] py-[8px]'}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button type="button" title="设置" className="w-8 h-8 rounded-[8px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center justify-center">
              <Settings size={16} />
            </button>
            <button type="button" onClick={onCollapse} title="展开" className="w-8 h-8 rounded-[8px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center justify-center">
              <svg className="scale-x-[-1]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 4h11M2.5 8h11M2.5 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" title="设置" className="flex-1 h-9 rounded-[10px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center gap-2 px-[10px]">
              <Settings size={16} />
              <span className="text-[14px] leading-none">设置</span>
            </button>
            <button type="button" onClick={onCollapse} title="收起" className="w-9 h-9 rounded-[10px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 4h11M2.5 8h11M2.5 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── StudioPage ────────────────────────────────────────────────────────────────
const initialSession = createSession();

export function StudioPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sessions, setSessions] = useState<StudioSession[]>([initialSession]);
  const [activeId, setActiveId] = useState<string>(initialSession.id);

  const handleNewSession = useCallback(() => {
    setSessions(prev => {
      const current = prev.find(s => s.id === activeId);
      // 当前已是空草稿，无需新建
      if (current?.isDraft && current.state.msgs.length === 0) return prev;
      // 清除其他空草稿，再创建新草稿
      const cleaned = prev.filter(s => !(s.isDraft && s.state.msgs.length === 0));
      const next = createSession();
      setActiveId(next.id);
      return [next, ...cleaned];
    });
  }, [activeId]);

  const handleSelectSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => !(s.isDraft && s.state.msgs.length === 0 && s.id !== id)));
    setActiveId(id);
  }, []);

  const handleStateChange = useCallback((id: string, state: OctoBuildState) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const firstUserMsg = state.msgs.find(m => m.role === 'user');
      const title = firstUserMsg
        ? firstUserMsg.text.slice(0, 28) + (firstUserMsg.text.length > 28 ? '…' : '')
        : s.title;
      return { ...s, state, title, updatedAt: Date.now(), isDraft: firstUserMsg ? false : s.isDraft };
    }));
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fallback = createSession();
        setActiveId(fallback.id);
        return [fallback];
      }
      setActiveId(cur => cur === id ? next[0].id : cur);
      return next;
    });
  }, []);

  return (
    <div className="h-full flex overflow-hidden">
      <StudioSidebar
        isCollapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(v => !v)}
        sessions={sessions}
        activeId={activeId}
        onSelect={handleSelectSession}
        onNewSession={handleNewSession}
        onDelete={handleDeleteSession}
      />

      {/* OctoBuild panels — keep all mounted, show active via visibility */}
      <div className="flex-1 min-w-0 h-full relative overflow-hidden" style={{ background: 'rgba(251,252,255,0.80)' }}>
        {sessions.map(session => (
          <div
            key={session.id}
            className={`absolute inset-0 ${session.id === activeId ? '' : 'hidden'}`}
          >
            <OctoBuild
              embedded
              studioMode
              workspaceId={session.id}
              initialState={session.state}
              onStateChange={(state) => handleStateChange(session.id, state)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
