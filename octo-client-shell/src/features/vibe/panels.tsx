/**
 * Vibe Design — left-panel sub-components and reference drawer.
 * Kept separate from VibeDesign.tsx to reduce file size.
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, X, AtSign, FlaskConical, ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Skill, ResearchDoc, RefDrawerItem, MentionTab } from './types';
import {
  ASSET_SECTIONS, RESEARCH_DOCS, DOC_TYPE_META,
  DOC_DETAILS, COMPONENT_DETAILS, SKILL_CATEGORIES,
  VIBE_REQUIREMENTS, type VibeRequirement,
} from './mock-data';

// ─── AnimatedDots ─────────────────────────────────────────────────────────────
export const AnimatedDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    {[0, 1, 2].map(i => (
      <motion.span key={i} className="w-1 h-1 rounded-full bg-current inline-block"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
    ))}
  </span>
);

// ─── MentionPanel ─────────────────────────────────────────────────────────────
interface MentionPanelProps {
  mentionQuery: string;
  skills: Skill[];
  onToggleSkill: (id: string) => void;
  onInsertAsset: (text: string) => void;
  onInsertMention: (name: string) => void;
  onSelectDoc: (doc: ResearchDoc) => void;
  onSelectRequirement?: (req: { id: string; name: string; description: string }) => void;
  onClose: () => void;
}

export const MentionPanel: React.FC<MentionPanelProps> = ({
  mentionQuery, skills, onInsertMention, onSelectRequirement, onClose,
}) => {
  const [tab, setTab] = useState<MentionTab>('research');

  const filteredDocs = RESEARCH_DOCS.filter(d =>
    d.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredReqs = VIBE_REQUIREMENTS.filter(r =>
    r.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const MENTION_TABS: { id: MentionTab; label: string }[] = [
    { id: 'research', label: '用研文档' },
    { id: 'requirements', label: '需求' },
    { id: 'assets', label: '资产库' },
    { id: 'skills', label: '技能社区' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.14 }}
      className="absolute bottom-full left-3 right-3 mb-1.5 bg-white rounded-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.14)] border border-[rgba(25,25,25,0.08)] overflow-hidden z-10"
      style={{ maxHeight: 340 }}
    >
      <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AtSign size={10} className="text-[#1476ff]" />
          <span className="text-[10px] font-medium text-[#555]">引用内容</span>
          {mentionQuery && <span className="text-[10px] text-[#bbb]">· {mentionQuery}</span>}
        </div>
        <button onClick={onClose} className="text-[#ccc] hover:text-[#555] transition-colors"><X size={12} /></button>
      </div>

      <div className="flex px-3 pt-2 gap-1">
        {MENTION_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${tab === t.id ? 'bg-[#f0f5ff] text-[#1476ff] font-medium' : 'text-[#777] hover:bg-[#f5f6f7]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
        {tab === 'research' && (
          <div className="px-2 py-2 space-y-0.5">
            {filteredDocs.length === 0 && <p className="text-[10px] text-[#bbb] text-center py-4">无匹配文档</p>}
            {filteredDocs.map(doc => {
              const meta = DOC_TYPE_META[doc.type];
              return (
                <button key={doc.id} onClick={() => onInsertMention(doc.title)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#f8fafc] rounded-xl transition-colors text-left">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                  <span className="text-xs text-[#333] truncate flex-1">{doc.title}</span>
                  <span className="text-[10px] text-[#bbb] shrink-0">{doc.author}</span>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'requirements' && (
          <div className="px-2 py-2 space-y-0.5">
            {filteredReqs.length === 0 && <p className="text-[10px] text-[#bbb] text-center py-4">无匹配需求</p>}
            {filteredReqs.map(req => {
              const priorityDot = req.priority === 'high' ? 'bg-red-500' : req.priority === 'medium' ? 'bg-amber-400' : 'bg-green-500';
              return (
                <button key={req.id}
                  onClick={() => onSelectRequirement?.({ id: req.id, name: req.name, description: req.description })}
                  className="w-full flex items-start gap-2.5 px-2.5 py-2 hover:bg-[#f8fafc] rounded-xl transition-colors text-left">
                  <div className={`w-1.5 h-1.5 rounded-full ${priorityDot} mt-1.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#333] truncate">{req.name}</p>
                    <p className="text-[10px] text-[#aaa] line-clamp-1 mt-0.5">{req.description}</p>
                    <p className="text-[10px] text-[#bbb] mt-0.5">{req.owner}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'assets' && (
          <div className="px-3 py-2 space-y-3">
            {ASSET_SECTIONS.map(section => (
              <div key={section.id}>
                <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5">{section.label}</p>
                {section.id === 'icons' && (
                  <div className="grid grid-cols-6 gap-1">
                    {(section.items as { name: string; icon: string }[]).map(item => (
                      <button key={item.name} onClick={() => onInsertMention(`[图标:${item.name}]`)} title={item.name}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-[#f0f5ff] transition-colors group">
                        <div className="w-7 h-7 bg-[#f5f6f7] rounded-lg flex items-center justify-center text-[#555] text-sm group-hover:bg-white group-hover:text-[#1476ff] transition-colors">{item.icon}</div>
                        <span className="text-[10px] text-[#bbb] truncate w-full text-center">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {section.id === 'illustrations' && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {(section.items as { name: string; color: string }[]).map(item => (
                      <button key={item.name} onClick={() => onInsertMention(`[插画:${item.name}]`)} className="flex flex-col items-center gap-1 group">
                        <div className={`w-full aspect-[4/3] rounded-lg bg-gradient-to-br ${item.color} group-hover:scale-[1.04] transition-transform`} />
                        <span className="text-[10px] text-[#777]">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {section.id === 'components' && (
                  <div className="grid grid-cols-6 gap-1">
                    {(section.items as { name: string; preview: string }[]).map(item => (
                      <button key={item.name} onClick={() => onInsertMention(`[组件:${item.name}]`)} title={item.name}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-[#f0f5ff] transition-colors group">
                        <div className="w-7 h-7 bg-[#f5f6f7] border border-[rgba(25,25,25,0.06)] rounded-lg flex items-center justify-center text-[10px] font-bold text-[#999] group-hover:bg-white group-hover:text-[#1476ff] transition-colors">
                          {item.name.slice(0, 2)}
                        </div>
                        <span className="text-[10px] text-[#bbb] truncate w-full text-center">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'skills' && (
          <div className="px-2 py-2 space-y-0.5">
            <p className="text-[10px] text-[#bbb] px-2.5 pb-1">点击技能即可在对话中引用</p>
            {skills.map(skill => {
              const Icon = skill.icon;
              return (
                <button key={skill.id} onClick={() => onInsertMention(skill.name)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#f0f5ff] transition-colors text-left group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${skill.enabled ? 'bg-[#f0f5ff] group-hover:bg-white' : 'bg-[#f5f6f7] group-hover:bg-white'}`}>
                    <Icon size={12} className={skill.enabled ? 'text-[#1476ff]' : 'text-[#bbb]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-[#191919]">{skill.name}</p>
                      {skill.enabled && <span className="text-[10px] bg-[#f0fdf4] text-[#10b981] px-1 py-0.5 rounded font-medium">已启用</span>}
                    </div>
                    <p className="text-[10px] text-[#aaa]">{skill.desc}</p>
                  </div>
                  <span className="text-[10px] text-[#1476ff] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">引用</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── AssetsTab ────────────────────────────────────────────────────────────────
export const AssetsTab = ({ onInsert, onOpenItem }: { onInsert: (text: string) => void; onOpenItem: (item: RefDrawerItem) => void }) => {
  const [search, setSearch] = useState('');
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索资产..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f5f6f7] rounded-lg text-[#191919] placeholder:text-[#bbb] outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {ASSET_SECTIONS.map(section => (
          <div key={section.id}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wide">{section.label}</span>
              <span className="text-[10px] text-[#bbb]">{section.count} 项</span>
            </div>
            {section.id === 'icons' && (
              <div className="grid grid-cols-4 gap-1.5">
                {(section.items as { name: string; icon: string }[]).map(item => (
                  <button key={item.name} onClick={() => onInsert(`[图标:${item.name}]`)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#f0f5ff] transition-colors group">
                    <div className="w-8 h-8 bg-[#f5f6f7] rounded-lg flex items-center justify-center text-[#555] text-sm group-hover:bg-white group-hover:text-[#1476ff] group-hover:shadow-sm transition-colors">{item.icon}</div>
                    <span className="text-[10px] text-[#999] truncate w-full text-center">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
            {section.id === 'illustrations' && (
              <div className="grid grid-cols-3 gap-2">
                {(section.items as { name: string; color: string }[]).map(item => (
                  <button key={item.name} onClick={() => onOpenItem({ kind: 'illustration', name: item.name, color: item.color })}
                    className="flex flex-col items-center gap-1.5 group">
                    <div className={`w-full aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} group-hover:scale-[1.03] transition-transform`} />
                    <span className="text-[10px] text-[#777]">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
            {section.id === 'components' && (
              <div className="grid grid-cols-4 gap-1.5">
                {(section.items as { name: string; preview: string }[]).map(item => (
                  <button key={item.name} onClick={() => onOpenItem({ kind: 'component', name: item.name })}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#f0f5ff] transition-colors group">
                    <div className="w-8 h-8 bg-[#f5f6f7] border border-[rgba(25,25,25,0.06)] rounded-lg flex items-center justify-center text-[10px] font-bold text-[#999] group-hover:bg-white group-hover:text-[#1476ff] group-hover:border-[#d4e0ff] transition-colors">
                      {item.name.slice(0, 2)}
                    </div>
                    <span className="text-[10px] text-[#999] truncate w-full text-center">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ResearchTab ──────────────────────────────────────────────────────────────
export const ResearchTab = ({ onInsert, onOpenDoc }: { onInsert: (text: string) => void; onOpenDoc: (doc: ResearchDoc) => void }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0">
      <p className="text-[10px] text-[#999]">点击文档预览详情 · 输入 <span className="font-mono bg-[#f5f6f7] px-1 rounded text-[#555]">@</span> 快速引用</p>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {RESEARCH_DOCS.map(doc => {
        const meta = DOC_TYPE_META[doc.type];
        return (
          <div key={doc.id} onClick={() => onOpenDoc(doc)}
            className="bg-white border border-[rgba(25,25,25,0.08)] rounded-xl p-3 hover:border-[#d4e0ff] hover:bg-[#f8faff] hover:shadow-[0_2px_8px_rgba(20,118,255,0.08)] transition-colors group cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                </div>
                <p className="text-xs font-medium text-[#191919] leading-snug mb-1">{doc.title}</p>
                <p className="text-[10px] text-[#aaa]">{doc.author} · {doc.updatedAt}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onInsert(`@${doc.title} `); }}
                className="shrink-0 text-[10px] text-[#1476ff] bg-[#f0f5ff] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                引用
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── SkillToggle ──────────────────────────────────────────────────────────────
export const SkillToggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="shrink-0">
    <div className={`w-[26px] h-[14px] rounded-full flex items-center transition-colors duration-200 px-[2px] ${enabled ? 'bg-[#1476ff]' : 'bg-[#d0d3d9]'}`}>
      <div className={`w-[10px] h-[10px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ${enabled ? 'translate-x-[12px]' : 'translate-x-0'}`} />
    </div>
  </button>
);

// ─── SkillsTab ────────────────────────────────────────────────────────────────
export const SkillsTab = ({ skills, onToggle, onOpenMarket }: {
  skills: Skill[];
  onToggle: (id: string) => void;
  onOpenMarket: () => void;
}) => {
  const enabled = skills.filter(s => s.enabled);
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0">
        <p className="text-[10px] text-[#999]">已装载 {enabled.length} 个技能</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {enabled.length === 0 && <p className="text-[10px] text-[#bbb] text-center pt-8">暂无已装载的技能</p>}
        {enabled.map(skill => {
          const Icon = skill.icon;
          return (
            <div key={skill.id} className="flex items-center gap-3 bg-white border border-[rgba(25,25,25,0.08)] rounded-xl px-3 py-3 hover:border-[#d4e0ff] hover:bg-[#f8faff] transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-[#f0f5ff] flex items-center justify-center shrink-0">
                <Icon size={14} className="text-[#1476ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#191919]">{skill.name}</p>
                <p className="text-[10px] text-[#aaa] mt-0.5">{skill.desc}</p>
              </div>
              <SkillToggle enabled={true} onToggle={() => onToggle(skill.id)} />
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-[rgba(25,25,25,0.06)] shrink-0">
        <button onClick={onOpenMarket}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[rgba(25,25,25,0.1)] text-[12px] text-[#374151] hover:bg-[#f0f5ff] hover:border-[#1476ff] hover:text-[#1476ff] transition-colors">
          <FlaskConical size={12} />查看更多技能
        </button>
      </div>
    </div>
  );
};

// ─── SkillMarketModal ─────────────────────────────────────────────────────────
export const SkillMarketModal = ({ skills, onToggle, onClose }: {
  skills: Skill[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) => {
  const [cat, setCat] = useState('全部');
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const visible = skills.filter(s => {
    const matchCat = cat === '全部' || s.category === cat;
    const matchQ = !search.trim() || s.name.includes(search) || s.desc.includes(search);
    return matchCat && matchQ;
  });

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div key="skill-market-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-[2px] flex items-center justify-center"
        onClick={() => {
          setSelectedSkill(null);
          onClose();
        }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-[820px] max-w-[95vw] h-[580px] max-h-[90vh] flex overflow-hidden"
          onClick={e => e.stopPropagation()}>
          {/* Left sidebar */}
          <div className="w-[200px] shrink-0 bg-[#f8fafc] border-r border-[rgba(25,25,25,0.07)] flex flex-col">
            <div className="px-4 pt-5 pb-4 border-b border-[rgba(25,25,25,0.07)]">
              <p className="text-[14px] font-semibold text-[#191919]">技能列表</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">已选 {skills.filter(s => s.enabled).length}/{skills.length}</p>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-2">
              {SKILL_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-[12px] transition-colors mb-0.5 ${cat === c ? 'bg-white text-[#1476ff] font-medium shadow-sm border border-[rgba(25,25,25,0.07)]' : 'text-[#555] hover:bg-white/70'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {/* Right content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(25,25,25,0.07)] shrink-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] border border-[rgba(25,25,25,0.08)] rounded-xl text-[12px] text-[#9ca3af] w-[200px]">
                  <Search size={12} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索技能..."
                    className="bg-transparent outline-none flex-1 text-[#374151] placeholder:text-[#9ca3af]" />
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af] hover:text-[#374151] transition-colors ml-3">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {visible.length === 0 && <p className="text-[12px] text-[#bbb] text-center pt-12">未找到相关技能</p>}
              {visible.map(skill => {
                const Icon = skill.icon;
                return (
                  <div key={skill.id} className="flex items-center gap-3 bg-white border border-[rgba(25,25,25,0.08)] rounded-xl px-4 py-3 hover:border-[#d4e0ff] hover:bg-[#f8faff] transition-colors group">
                    <button
                      type="button"
                      onClick={() => setSelectedSkill(skill)}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${skill.enabled ? 'bg-[#f0f5ff]' : 'bg-[#f5f6f7]'}`}>
                        <Icon size={16} className={skill.enabled ? 'text-[#1476ff]' : 'text-[#bbb]'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-medium text-[#191919]">{skill.name}</p>
                          {!skill.official && <span className="text-[10px] px-1.5 py-0.5 bg-[#f5f5f5] text-[#888] rounded-md">社区</span>}
                        </div>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">{skill.desc}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-[#9ca3af] group-hover:text-[#1476ff] transition-colors">
                        <span className="text-[10px]">查看详情</span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                    <button onClick={() => onToggle(skill.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${skill.enabled ? 'bg-[#f0f5ff] text-[#1476ff] border-[#dbeafe] hover:bg-[#dbeafe]' : 'bg-white text-[#374151] border-[rgba(25,25,25,0.12)] hover:border-[#1476ff] hover:text-[#1476ff]'}`}>
                      {skill.enabled ? '已添加' : '添加'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {selectedSkill && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[10] bg-[rgba(255,255,255,0.7)] backdrop-blur-[2px] flex items-center justify-center p-6"
                onClick={() => setSelectedSkill(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.985 }}
                  transition={{ duration: 0.16 }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-[720px] max-w-full max-h-full bg-white rounded-[26px] border border-[rgba(25,25,25,0.08)] shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
                >
                  <div className="px-7 pt-6 pb-5 border-b border-[rgba(25,25,25,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center shrink-0 ${selectedSkill.enabled ? 'bg-[#f0f5ff]' : 'bg-[#f5f6f7]'}`}>
                          <selectedSkill.icon size={28} className={selectedSkill.enabled ? 'text-[#1476ff]' : 'text-[#9ca3af]'} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[28px] leading-[1.1] font-semibold text-[#191919]">{selectedSkill.name}</h3>
                            <span className="text-[14px] text-[#888]">Skill</span>
                            {!selectedSkill.official && <span className="text-[10px] px-1.5 py-0.5 bg-[#f5f5f5] text-[#888] rounded-md">社区</span>}
                          </div>
                          <p className="mt-3 text-[14px] text-[#555] leading-[1.75] max-w-[500px]">{selectedSkill.detail?.tagline ?? selectedSkill.desc}</p>
                          <div className="mt-4 flex items-center gap-3 flex-wrap text-[12px] text-[#888]">
                            <span className="px-2.5 py-1 rounded-full bg-[#f8fafc] text-[#555] border border-[rgba(25,25,25,0.08)]">{selectedSkill.category}</span>
                            {selectedSkill.detail && <span>版本 {selectedSkill.detail.version}</span>}
                            {selectedSkill.detail && <span>更新于 {selectedSkill.detail.updatedAt}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedSkill(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af] hover:text-[#374151] transition-colors shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                    <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-[#fcfcfc] px-5 py-4">
                      <p className="text-[14px] text-[#444] leading-[1.9]">{selectedSkill.detail?.overview ?? selectedSkill.desc}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                        <div className="text-[15px] font-semibold text-[#191919]">适用场景</div>
                        <div className="mt-3 space-y-2">
                          {(selectedSkill.detail?.useCases ?? ['适合在当前主题下快速补充该技能能力。']).map((item) => (
                            <div key={item} className="flex gap-2 text-[13px] text-[#555] leading-[1.7]">
                              <span className="text-[#1476ff]">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                        <div className="text-[15px] font-semibold text-[#191919]">输出内容</div>
                        <div className="mt-3 space-y-2">
                          {(selectedSkill.detail?.outputs ?? ['技能说明与输出结果摘要']).map((item) => (
                            <div key={item} className="flex gap-2 text-[13px] text-[#555] leading-[1.7]">
                              <span className="text-[#1476ff]">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                      <div className="text-[15px] font-semibold text-[#191919]">推荐工作流</div>
                      <div className="mt-4 space-y-3">
                        {(selectedSkill.detail?.workflow ?? ['将技能添加到当前会话中，并结合你的提示词一起使用。']).map((item, index) => (
                          <div key={item} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-[#eff6ff] text-[#1476ff] text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                            <span className="text-[13px] text-[#444] leading-[1.7]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                      <div className="text-[15px] font-semibold text-[#191919]">使用规则</div>
                      <div className="mt-3 space-y-2">
                        {(selectedSkill.detail?.rules ?? ['可在聊天中添加后结合具体场景继续细化。']).map((item) => (
                          <div key={item} className="flex gap-2 text-[13px] text-[#555] leading-[1.7]">
                            <span className="text-[#7c3aed]">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-7 py-5 border-t border-[rgba(25,25,25,0.06)] flex items-center justify-between gap-4">
                    <button
                      onClick={() => onToggle(selectedSkill.id)}
                      className={`text-[14px] transition-colors ${selectedSkill.enabled ? 'text-[#ef4444] hover:text-[#dc2626]' : 'text-[#1476ff] hover:text-[#1060d0]'}`}
                    >
                      {selectedSkill.enabled ? '卸载' : '添加技能'}
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedSkill.enabled) onToggle(selectedSkill.id);
                        setSelectedSkill(null);
                      }}
                      className="h-11 px-5 rounded-[16px] bg-[#191919] text-white text-[14px] font-medium hover:bg-[#111] transition-colors inline-flex items-center justify-center"
                    >
                      在聊天中试用
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// ─── ReferenceDrawer ──────────────────────────────────────────────────────────
interface ReferenceDrawerProps {
  item: RefDrawerItem;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export const ReferenceDrawer: React.FC<ReferenceDrawerProps> = ({ item, onClose, onInsert }) => {
  const renderContent = () => {
    if (item.kind === 'doc') {
      const { doc } = item;
      const meta = DOC_TYPE_META[doc.type];
      const detail = DOC_DETAILS[doc.id];
      return (
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-[rgba(25,25,25,0.07)] shrink-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
              <button onClick={onClose} className="text-[#bbb] hover:text-[#555] transition-colors -mt-0.5"><X size={14} /></button>
            </div>
            <h3 className="text-sm font-semibold text-[#191919] leading-snug mb-1">{doc.title}</h3>
            <p className="text-[10px] text-[#aaa]">{doc.author} · {doc.updatedAt}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-[#777] uppercase tracking-wide mb-2">摘要</p>
              <p className="text-xs text-[#444] leading-relaxed">{detail?.summary ?? '暂无摘要内容。'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#777] uppercase tracking-wide mb-2">关键洞察</p>
              <div className="space-y-2">
                {(detail?.insights ?? []).map((ins, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: meta.color }} />
                    <p className="text-xs text-[#444] leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.06)] rounded-xl p-3">
              <p className="text-[10px] text-[#aaa] mb-1.5">文档元信息</p>
              {[{ label: '类型', value: meta.label }, { label: '作者', value: doc.author }, { label: '更新', value: doc.updatedAt }].map(row => (
                <div key={row.label} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-[#999]">{row.label}</span>
                  <span className="text-[10px] font-medium text-[#333]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-[rgba(25,25,25,0.06)] shrink-0 flex gap-2">
            <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-xs py-2 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">关闭</button>
            <button onClick={() => { onInsert(`@${doc.title} `); onClose(); }}
              className="flex-1 bg-[#1476ff] text-white text-xs py-2 rounded-xl font-medium hover:bg-[#1060d0] transition-colors flex items-center justify-center gap-1">
              <AtSign size={10} /> 引用到对话
            </button>
          </div>
        </div>
      );
    }

    if (item.kind === 'component') {
      const detail = COMPONENT_DETAILS[item.name] ?? { desc: '通用 UI 组件。', props: [] };
      return (
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-[rgba(25,25,25,0.07)] shrink-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] bg-[#f0f5ff] text-[#1476ff] px-1.5 py-0.5 rounded-md font-medium">组件</span>
              <button onClick={onClose} className="text-[#bbb] hover:text-[#555] transition-colors -mt-0.5"><X size={14} /></button>
            </div>
            <h3 className="text-sm font-semibold text-[#191919] mb-1">{item.name}</h3>
            <p className="text-[10px] text-[#aaa]">{detail.desc}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.06)] rounded-xl p-4 flex items-center justify-center min-h-[72px]">
              <div className="bg-[#1476ff] text-white text-xs px-4 py-2 rounded-lg font-medium shadow-[0_2px_6px_rgba(20,118,255,0.3)]">{item.name}</div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#777] uppercase tracking-wide mb-2">Props</p>
              <div className="border border-[rgba(25,25,25,0.08)] rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 bg-[#f8fafc] border-b border-[rgba(25,25,25,0.06)] px-3 py-1.5">
                  {['属性', '类型', '默认值'].map(h => <span key={h} className="text-[10px] font-semibold text-[#aaa] uppercase">{h}</span>)}
                </div>
                {detail.props.map((p, i) => (
                  <div key={i} className="grid grid-cols-3 px-3 py-2 border-b border-[rgba(25,25,25,0.04)] last:border-0 hover:bg-[#fafafa]">
                    <span className="text-[10px] font-medium text-[#191919]">{p.name}</span>
                    <span className="text-[10px] text-[#1476ff] font-mono truncate">{p.type}</span>
                    <span className="text-[10px] text-[#777] font-mono">{p.default}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-[rgba(25,25,25,0.06)] shrink-0 flex gap-2">
            <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-xs py-2 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">关闭</button>
            <button onClick={() => { onInsert(`[组件:${item.name}]`); onClose(); }}
              className="flex-1 bg-[#1476ff] text-white text-xs py-2 rounded-xl font-medium hover:bg-[#1060d0] transition-colors">
              引用到对话
            </button>
          </div>
        </div>
      );
    }

    if (item.kind === 'illustration') {
      return (
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-[rgba(25,25,25,0.07)] shrink-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] bg-[#f5f3ff] text-[#7c3aed] px-1.5 py-0.5 rounded-md font-medium">插画</span>
              <button onClick={onClose} className="text-[#bbb] hover:text-[#555] transition-colors -mt-0.5"><X size={14} /></button>
            </div>
            <h3 className="text-sm font-semibold text-[#191919]">{item.name}</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className={`w-full aspect-video rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
              <span className="text-white/70 text-xs">{item.name}</span>
            </div>
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.06)] rounded-xl p-3 space-y-1.5">
              {[{ label: '格式', value: 'SVG / PNG' }, { label: '授权', value: '企业内部使用' }, { label: '尺寸', value: '1x / 2x / 3x' }].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#999]">{row.label}</span>
                  <span className="text-[10px] font-medium text-[#333]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-[rgba(25,25,25,0.06)] shrink-0 flex gap-2">
            <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-xs py-2 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">关闭</button>
            <button onClick={() => { onInsert(`[插画:${item.name}]`); onClose(); }}
              className="flex-1 bg-[#1476ff] text-white text-xs py-2 rounded-xl font-medium hover:bg-[#1060d0] transition-colors">
              引用到对话
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
      className="absolute right-0 top-0 bottom-0 w-[320px] bg-white border-l border-[rgba(25,25,25,0.08)] shadow-[-8px_0_24px_rgba(0,0,0,0.08)] z-20 flex flex-col"
    >
      {renderContent()}
    </motion.div>
  );
};
