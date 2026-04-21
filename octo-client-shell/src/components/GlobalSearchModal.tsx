import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { Search, X, MessageSquare, Bookmark, FolderOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { loadSkillMarketItems } from '../data/skill-market-data';
import { DEFAULT_KNOWLEDGE, type NavKey, type PendingNav } from '../layout/ClientShell';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: number;
}

function loadConversations(): ConversationItem[] {
  try {
    const raw = window.localStorage.getItem('octo.client.conversations');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ConversationItem[];
  } catch {
    return [];
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const day = 86400000;
  if (diff < 7 * day) return '最近一周';
  if (diff < 30 * day) return '最近一月';
  if (diff < 365 * day) return '最近一年';
  return '更早';
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  nav: NavKey;
  conversationId?: string;
  knowledgeId?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: PendingNav) => void;
}

export function GlobalSearchModal({ open, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset while closed so opening does not trigger an extra re-render.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Focus before paint for smoother open.
  useLayoutEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();

  // ── Data ─────────────────────────────────────────────────────────────────

  const conversationResults = useMemo<SearchResultItem[]>(() => {
    const items = loadConversations();
    const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
    const filtered = q
      ? sorted.filter((c) => c.title.toLowerCase().includes(q))
      : sorted;
    return filtered.slice(0, 8).map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: relativeTime(c.updatedAt),
      nav: 'chat' as NavKey,
      conversationId: c.id,
    }));
  }, [q]);

  const skillResults = useMemo<SearchResultItem[]>(() => {
    const items = loadSkillMarketItems();
    const filtered = q
      ? items.filter((s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q),
        )
      : items;
    return filtered.slice(0, 5).map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.category,
      nav: 'skill_market' as NavKey,
    }));
  }, [q]);

  const knowledgeResults = useMemo<SearchResultItem[]>(() => {
    const filtered = q
      ? DEFAULT_KNOWLEDGE.filter((k) =>
          k.title.toLowerCase().includes(q) ||
          k.snippet.toLowerCase().includes(q) ||
          (k.tags ?? []).some((t) => t.toLowerCase().includes(q)),
        )
      : DEFAULT_KNOWLEDGE;
    return filtered.slice(0, 5).map((k) => ({
      id: k.id,
      title: k.title,
      subtitle: k.group,
      nav: 'knowledge_base' as NavKey,
      knowledgeId: k.id,
    }));
  }, [q]);

  const hasResults =
    conversationResults.length > 0 ||
    skillResults.length > 0 ||
    knowledgeResults.length > 0;

  function handleSelect(item: SearchResultItem) {
    onNavigate({
      nav: item.nav,
      conversationId: item.conversationId,
      knowledgeId: item.knowledgeId,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[9999] flex items-center justify-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Card — centered in window, capped height */}
          <motion.div
            className="relative w-[520px] flex flex-col bg-white rounded-[14px] overflow-hidden"
            style={{
              height: 550,
              maxHeight: 'calc(100% - 80px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {/* Search input row */}
            <div
              className="flex items-center gap-[10px] px-[16px] shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', height: 48 }}
            >
              <Search size={14} className="shrink-0 text-[rgba(25,25,25,0.35)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索对话和文件"
                className="flex-1 bg-transparent text-[14px] text-[#191919] placeholder:text-[rgba(25,25,25,0.35)] outline-none leading-normal"
              />
              <button
                onClick={onClose}
                className="shrink-0 w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.07)] text-[#555] hover:bg-[rgba(0,0,0,0.12)] transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {!hasResults && (
                <div className="flex items-center justify-center py-12 text-[12px] text-[rgba(25,25,25,0.4)]">
                  无匹配结果
                </div>
              )}

              {conversationResults.length > 0 && (
                <Section
                  icon={<MessageSquare size={12} />}
                  label="历史对话"
                  items={conversationResults}
                  onSelect={handleSelect}
                />
              )}

              {skillResults.length > 0 && (
                <Section
                  icon={<Bookmark size={12} />}
                  label="技能社区"
                  items={skillResults}
                  onSelect={handleSelect}
                />
              )}

              {knowledgeResults.length > 0 && (
                <Section
                  icon={<FolderOpen size={12} />}
                  label="项目知识库"
                  items={knowledgeResults}
                  onSelect={handleSelect}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  label: string;
  items: SearchResultItem[];
  onSelect: (item: SearchResultItem) => void;
}

function Section({ icon, label, items, onSelect }: SectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-[6px] px-[16px] pt-[12px] pb-[4px]">
        <span className="text-[rgba(25,25,25,0.4)]">{icon}</span>
        <span className="text-[10px] font-medium text-[rgba(25,25,25,0.45)] tracking-wide uppercase">
          {label}
        </span>
      </div>

      {/* Items */}
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full flex items-center gap-[12px] px-[16px] py-[10px] hover:bg-[#f5f5f5] transition-colors text-left"
        >
          <ItemIcon nav={item.nav} />
          <span className="flex-1 min-w-0 text-[14px] text-[#191919] truncate leading-normal">
            {item.title}
          </span>
          <span className="shrink-0 text-[12px] text-[rgba(25,25,25,0.4)] whitespace-nowrap">
            {item.subtitle}
          </span>
        </button>
      ))}

      {/* Divider */}
      <div className="h-px bg-[rgba(0,0,0,0.05)] mx-[16px] mt-[4px]" />
    </div>
  );
}

function ItemIcon({ nav }: { nav: NavKey }) {
  if (nav === 'chat') {
    return (
      <span className="shrink-0 w-[28px] h-[28px] rounded-[7px] bg-[rgba(20,118,255,0.08)] flex items-center justify-center">
        <MessageSquare size={12} className="text-[#1476ff]" />
      </span>
    );
  }
  if (nav === 'skill_market') {
    return (
      <span className="shrink-0 w-[28px] h-[28px] rounded-[7px] bg-[rgba(109,40,217,0.08)] flex items-center justify-center">
        <Bookmark size={12} className="text-[#6d28d9]" />
      </span>
    );
  }
  return (
    <span className="shrink-0 w-[28px] h-[28px] rounded-[7px] bg-[rgba(5,150,105,0.08)] flex items-center justify-center">
      <FolderOpen size={12} className="text-[#059669]" />
    </span>
  );
}
