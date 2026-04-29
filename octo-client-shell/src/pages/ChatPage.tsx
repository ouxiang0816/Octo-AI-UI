import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquarePlus, Settings, Plus, Send, ChevronDown, X,
} from 'lucide-react';
import unionIcon from '../assets/icons/union.svg';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  thinkingLines?: string[];
  thinkingDone?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  msgs: ChatMsg[];
}

// ─── ID helper ─────────────────────────────────────────────────────────────────
let _seq = 0;
function makeId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${++_seq}`;
}

// ─── Mock reply generator ──────────────────────────────────────────────────────
const THINKING_POOLS: string[] = [
  'thought|2|分析用户提问的意图与核心诉求',
  'tool|知识检索|搜索相关领域资料 → 找到 12 条参考',
  'thought|3|梳理回答框架，确定重点内容',
  'tool|推理引擎|综合分析输入信息 → 生成结构化答案',
  'thought|1|优化语言表达，提升易读性',
];

const REPLY_TEMPLATES = [
  (q: string) => `关于「${q.slice(0, 20)}${q.length > 20 ? '…' : ''}」，我来为您详细解答。

这是一个很有深度的问题。从核心原理来看，需要从以下几个维度理解：

**关键要点**
- 首先，要理解问题的本质是什么，以及它在实际场景中的意义
- 其次，结合相关背景知识，可以看出几种典型的解决思路
- 最后，在实践层面，建议优先考虑最适合当前情境的方案

如果您希望深入了解某个具体方面，欢迎继续提问。`,

  (q: string) => `收到您的问题「${q.slice(0, 18)}${q.length > 18 ? '…' : ''}」。

根据我的分析，这里有几点值得关注：

1. **背景认知** — 当前领域的主流观点认为，问题的核心在于如何平衡各方因素
2. **实践建议** — 可以从小范围验证开始，逐步迭代优化
3. **注意事项** — 过程中需要重点关注数据质量与反馈机制

希望这些信息对您有所帮助！`,

  (q: string) => `您好！我已理解您提出的问题。

针对「${q.slice(0, 15)}${q.length > 15 ? '…' : ''}」，我从以下角度进行分析：

从宏观视角来看，这类问题通常涉及多个子系统的协同配合。具体到您的场景，建议重点关注流程的连贯性和数据的一致性。

在技术层面，目前主流的方法包括模块化拆解和迭代验证两种路径，各有优劣，需要根据实际约束条件灵活选择。

如需进一步探讨，请告诉我您最关心的方向。`,
];

function generateMockReply(question: string): { thinking: string[]; text: string } {
  const thinkingCount = 3 + Math.floor(Math.random() * 2);
  const thinking = THINKING_POOLS.slice(0, thinkingCount);
  const template = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];
  return { thinking, text: template(question) };
}

// ─── AnimatedDots ───────────────────────────────────────────────────────────────
function AnimatedDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -1.5, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

// ─── StreamedText ───────────────────────────────────────────────────────────────
const _streamedIds = new Set<string>();
function StreamedText({ text, msgId }: { text: string; msgId: string }) {
  const skip = _streamedIds.has(msgId);
  const [displayed, setDisplayed] = useState(skip ? text : '');
  useEffect(() => {
    if (skip) { setDisplayed(text); return; }
    _streamedIds.add(msgId);
    setDisplayed('');
    let i = 0;
    let timer: number;
    const tick = () => {
      i += 2;
      setDisplayed(text.slice(0, i));
      if (i < text.length) timer = window.setTimeout(tick, 16);
    };
    timer = window.setTimeout(tick, 16);
    return () => clearTimeout(timer);
  }, [text, msgId, skip]);
  return <>{displayed}</>;
}

// ─── ThinkingRow (simplified) ───────────────────────────────────────────────────
function ThinkingRow({ line, isLast }: { line: string; isLast: boolean }) {
  const parts = line.split('|');
  if (parts[0] === 'thought') {
    return (
      <p className="pl-[22px] text-[12px] leading-[18px] text-[#8b93a0] italic">{parts.slice(2).join('|')}</p>
    );
  }
  if (parts[0] === 'tool') {
    const detail = parts.slice(2).join('|');
    const arrowIdx = detail.indexOf('→');
    const action = arrowIdx !== -1 ? detail.slice(0, arrowIdx).trim() : detail;
    const result = arrowIdx !== -1 ? detail.slice(arrowIdx + 1).trim() : '';
    return (
      <div className="pl-[22px] flex items-baseline gap-[8px]">
        <span className={`shrink-0 w-[5px] h-[5px] rounded-full mt-[5px] ${isLast ? 'bg-[#d1d5db]' : 'bg-[#10b981]'}`} />
        <span className="text-[12px] font-medium text-[#374151] shrink-0">{parts[1]}</span>
        {action && <span className="text-[12px] text-[#6b7280] truncate">{action}</span>}
        {result && <span className="text-[12px] text-[#adb3bc] shrink-0">→ {result}</span>}
      </div>
    );
  }
  return (
    <div className="pl-[22px] flex items-baseline gap-[8px]">
      <span className={`shrink-0 w-[5px] h-[5px] rounded-full mt-[5px] ${isLast ? 'bg-[#d1d5db]' : 'bg-[#10b981]'}`} />
      <span className="text-[12px] text-[#6b7280]">{line}</span>
    </div>
  );
}

// ─── ThinkingBlock (collapsible) ─────────────────────────────────────────────────
function ThinkingBlock({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onMouseDown={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[12px] leading-[16px] text-[#9ca3af] hover:text-[#6a7282] transition-colors"
      >
        思考完毕
        <ChevronDown size={10} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-[8px] flex flex-col gap-[10px]">
          {lines.map((l, i) => (
            <ThinkingRow key={i} line={l} isLast={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Animated Diamond (reused from CanvasEmptyState) ───────────────────────────
function AnimatedDiamond() {
  return (
    <>
      <style>{`
        @keyframes chat-diamond {
          0%    { left: 0;    top: 0;    }
          10.5% { left: 0;    top: 0;    }
          12.5% { left: 32px; top: 0;    }
          23%   { left: 32px; top: 0;    }
          25%   { left: 64px; top: 0;    }
          35.5% { left: 64px; top: 0;    }
          37.5% { left: 64px; top: 32px; }
          48%   { left: 64px; top: 32px; }
          50%   { left: 32px; top: 32px; }
          60.5% { left: 32px; top: 32px; }
          62.5% { left: 32px; top: 64px; }
          73%   { left: 32px; top: 64px; }
          75%   { left: 0;    top: 64px; }
          85.5% { left: 0;    top: 64px; }
          87.5% { left: 0;    top: 32px; }
          98%   { left: 0;    top: 32px; }
          100%  { left: 0;    top: 0;    }
        }
      `}</style>
      <div className="relative w-24 h-24 rotate-45">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-0 w-7 h-7 m-0.5 rounded-sm"
            style={{
              background: `rgba(20, 118, 255, ${0.55 - i * 0.05})`,
              animation: 'chat-diamond 10s ease-in-out infinite both',
              animationDelay: `${-1.4285714286 * i}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── DefaultWelcome ─────────────────────────────────────────────────────────────
function DefaultWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center pointer-events-none select-none">
      <AnimatedDiamond />
      <div>
        <p className="text-[22px] font-semibold text-[#191919] mb-[6px]">Octo AI</p>
        <p className="text-[14px] text-[rgba(25,25,25,0.55)]">向 Octo AI 提问，AI 将回答您的问题</p>
      </div>
    </div>
  );
}

// ─── ChatComposer (simplified) ──────────────────────────────────────────────────
function SimpleChatComposer({
  draft,
  setDraft,
  onSend,
  disabled,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim() && !disabled) onSend();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  return (
    <div className="shrink-0 px-[20px] pb-[20px] pt-[8px]">
      <div
        className="flex flex-col rounded-[16px] border transition-shadow"
        style={{
          background: 'rgba(255,255,255,0.9)',
          borderColor: 'rgba(0,0,0,0.1)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Textarea row */}
        <div className="flex items-end gap-[8px] px-[14px] pt-[12px] pb-[4px]">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="向 Octo AI 提问"
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-[#191919] outline-none resize-none leading-[1.6] placeholder:text-[rgba(25,25,25,0.38)] min-h-[28px] max-h-[160px] overflow-auto"
            style={{ wordBreak: 'break-word' }}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-[10px] pb-[8px] pt-[2px]">
          {/* Plus button */}
          <button
            type="button"
            className="w-[30px] h-[30px] flex items-center justify-center rounded-[8px] text-[rgba(0,0,0,0.45)] hover:bg-[rgba(0,0,0,0.06)] transition-colors"
            title="添加附件"
          >
            <Plus size={16} strokeWidth={2} />
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={onSend}
            disabled={!draft.trim() || disabled}
            className={`w-[30px] h-[30px] flex items-center justify-center rounded-[8px] transition-colors ${
              draft.trim() && !disabled
                ? 'bg-[#1476ff] text-white hover:bg-[#0f65e0]'
                : 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.25)]'
            }`}
            title="发送"
          >
            <Send size={13} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Left Sidebar ───────────────────────────────────────────────────────────────
function ChatSidebar({
  isCollapsed,
  onCollapse,
  conversations,
  currentId,
  onSelect,
  onNewChat,
  onDelete,
}: {
  isCollapsed: boolean;
  onCollapse: () => void;
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside
      className={`shrink-0 flex flex-col h-full transition-[width] duration-200 overflow-hidden`}
      style={{
        width: isCollapsed ? 56 : 240,
        background: 'rgba(248,249,252,0.8)',
        borderRight: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Title area */}
      <div className={`h-[54px] shrink-0 flex items-center ${isCollapsed ? 'justify-center px-[8px]' : 'px-[16px]'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-[8px] flex-1 min-w-0">
            <img src={unionIcon} alt="" aria-hidden className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[16px] font-semibold text-[#191919] leading-none select-none">Chat</span>
          </div>
        )}
      </div>

      {/* New conversation button */}
      <div className={`shrink-0 ${isCollapsed ? 'px-[8px] pb-[4px]' : 'px-[12px] pb-[4px]'}`}>
        <button
          onClick={onNewChat}
          title="新建对话"
          className={`w-full flex items-center rounded-[8px] px-[10px] py-[8px] text-[14px] text-[#191919] hover:bg-[rgba(0,0,0,0.05)] transition-colors ${isCollapsed ? 'justify-center' : 'gap-[10px]'}`}
        >
          <MessageSquarePlus size={16} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">新建对话</span>}
        </button>
      </div>

      {/* History list */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-[12px] py-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-[11px] font-medium text-[rgba(25,25,25,0.42)] tracking-wide px-[10px] py-[4px] select-none">
            历史记录
          </div>
          {sorted.length === 0 ? (
            <div className="px-[10px] py-[4px] text-[12px] text-[rgba(25,25,25,0.38)]">暂无对话记录</div>
          ) : (
            <div className="flex flex-col gap-[2px]">
              {sorted.map(conv => {
                const isActive = conv.id === currentId;
                return (
                  <div key={conv.id} className="group relative">
                    <button
                      onClick={() => onSelect(conv.id)}
                      className={`w-full text-left px-[10px] py-[7px] pr-[28px] rounded-[7px] text-[13px] leading-[18px] transition-colors ${
                        isActive
                          ? 'bg-[rgba(20,118,255,0.10)] text-[#1476ff]'
                          : 'text-[#333] hover:bg-[rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <span className="block truncate">{conv.title}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
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
            <button
              type="button"
              title="设置"
              className="w-8 h-8 rounded-[8px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center justify-center"
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              onClick={onCollapse}
              title="展开"
              className="w-8 h-8 rounded-[8px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center justify-center"
            >
              <svg className="scale-x-[-1]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 4h11M2.5 8h11M2.5 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="设置"
              className="flex-1 h-9 rounded-[10px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center gap-2 px-[10px]"
            >
              <Settings size={16} />
              <span className="text-[14px] leading-none">设置</span>
            </button>
            <button
              type="button"
              onClick={onCollapse}
              title="收起"
              className="w-9 h-9 rounded-[10px] text-[#555] hover:bg-[rgba(0,0,0,0.06)] transition-colors flex items-center justify-center"
            >
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

// ─── ChatPage ───────────────────────────────────────────────────────────────────
export function ChatPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  const currentConversation = conversations.find(c => c.id === currentId) ?? null;
  const msgs = currentConversation?.msgs ?? [];

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [msgs.length, scrollToBottom]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const updateMsgs = useCallback((id: string, updater: (prev: ChatMsg[]) => ChatMsg[]) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, msgs: updater(c.msgs), updatedAt: Date.now() } : c
    ));
  }, []);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || isGenerating) return;
    setDraft('');

    // Create conversation if none
    let convId = currentId;
    if (!convId) {
      const newId = makeId('conv');
      const newConv: Conversation = {
        id: newId,
        title: text.slice(0, 28) + (text.length > 28 ? '…' : ''),
        updatedAt: Date.now(),
        msgs: [],
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentId(newId);
      convId = newId;
    }

    const userId = makeId('u');
    const aiId = makeId('ai');

    setConversations(prev => prev.map(c =>
      c.id === convId ? {
        ...c,
        updatedAt: Date.now(),
        msgs: [
          ...c.msgs,
          { id: userId, role: 'user', text },
          { id: aiId, role: 'ai', text: '', thinkingLines: [], thinkingDone: false },
        ],
      } : c
    ));
    setIsGenerating(true);

    clearTimeouts();
    const { thinking, text: replyText } = generateMockReply(text);

    thinking.forEach((line, i) => {
      const tid = window.setTimeout(() => {
        setConversations(prev => prev.map(c =>
          c.id === convId ? {
            ...c,
            msgs: c.msgs.map(m =>
              m.id === aiId ? { ...m, thinkingLines: thinking.slice(0, i + 1) } : m
            ),
          } : c
        ));
      }, 600 * (i + 1));
      timeoutsRef.current.push(tid);
    });

    const doneAt = 600 * (thinking.length + 1);
    const doneTid = window.setTimeout(() => {
      setConversations(prev => prev.map(c =>
        c.id === convId ? {
          ...c,
          updatedAt: Date.now(),
          msgs: c.msgs.map(m =>
            m.id === aiId ? { ...m, text: replyText, thinkingDone: true } : m
          ),
        } : c
      ));
      setIsGenerating(false);
    }, doneAt);
    timeoutsRef.current.push(doneTid);
  }, [draft, isGenerating, currentId]);

  const handleNewChat = useCallback(() => {
    clearTimeouts();
    setIsGenerating(false);
    setCurrentId(null);
    setDraft('');
  }, []);

  const handleDeleteConv = useCallback((id: string) => {
    clearTimeouts();
    setIsGenerating(false);
    setConversations(prev => prev.filter(c => c.id !== id));
    setCurrentId(prev => prev === id ? null : prev);
  }, []);

  const handleSelectConv = useCallback((id: string) => {
    clearTimeouts();
    setIsGenerating(false);
    setCurrentId(id);
    setDraft('');
  }, []);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left sidebar */}
      <ChatSidebar
        isCollapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(v => !v)}
        conversations={conversations}
        currentId={currentId}
        onSelect={handleSelectConv}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConv}
      />

      {/* Right: main chat area */}
      <div
        className="flex-1 min-w-0 flex flex-col h-full"
        style={{ background: 'rgba(251,252,255,0.80)' }}
      >
        {msgs.length === 0 ? (
          /* Default welcome state */
          <>
            <DefaultWelcome />
            <SimpleChatComposer draft={draft} setDraft={setDraft} onSend={handleSend} disabled={isGenerating} />
          </>
        ) : (
          /* Conversation view */
          <>
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-[60px] py-[32px] space-y-[24px]"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.scrollbarColor = '#D9D9D9 transparent'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.scrollbarColor = 'transparent transparent'; }}
            >
              <AnimatePresence initial={false}>
                {msgs.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' ? (
                      <div className="w-full max-w-[720px]">
                        {msg.thinkingDone ? (
                          <>
                            {(msg.thinkingLines?.length ?? 0) > 0 && (
                              <ThinkingBlock lines={msg.thinkingLines!} />
                            )}
                            <div>
                              <p className="text-[14px] text-[#333] leading-[24px] whitespace-pre-wrap">
                                <StreamedText text={msg.text} msgId={msg.id} />
                              </p>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <div className="max-w-[72%]">
                        <div
                          className="bg-[rgba(0,0,0,0.04)] px-[14px] py-[10px] text-[14px] text-[#333] leading-[22px] whitespace-pre-wrap break-words"
                          style={{ borderRadius: '16px 16px 2px 16px', wordBreak: 'break-word' }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking in progress */}
              {(() => {
                const lastAi = [...msgs].reverse().find(m => m.role === 'ai');
                if (!lastAi || lastAi.thinkingDone) return null;
                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="w-full max-w-[720px]">
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-[8px] text-[12px] leading-[16px] text-[#9ca3af]">
                          <motion.span
                            className="w-[5px] h-[5px] rounded-full bg-[#9ca3af] shrink-0"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                          />
                          <span>思考中</span>
                        </div>
                        <div className="flex flex-col gap-[10px]">
                          {(lastAi.thinkingLines ?? []).map((line, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                              <ThinkingRow line={line} isLast={i === (lastAi.thinkingLines?.length ?? 1) - 1} />
                            </motion.div>
                          ))}
                          <div className="flex items-center gap-[6px] pl-[22px]">
                            <motion.span
                              className="w-[5px] h-[5px] rounded-full bg-[#d1d5db] shrink-0"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                            />
                            <span className="text-[12px] text-[#c8cdd5]"><AnimatedDots /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              <div ref={endRef} />
            </div>

            <SimpleChatComposer draft={draft} setDraft={setDraft} onSend={handleSend} disabled={isGenerating} />
          </>
        )}
      </div>
    </div>
  );
}
