/**
 * Vibe Design — left-panel sub-components and reference drawer.
 * Kept separate from VibeDesign.tsx to reduce file size.
 */
import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, X, AtSign, FlaskConical, ChevronRight, Upload, Shield, Lock, AlertTriangle, Filter, ArrowUpDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { AssetRecord, Skill, ResearchDoc, RefDrawerItem, MentionTab } from './types';
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
          <div className="px-3 py-3">
            <div className="rounded-2xl border border-[rgba(25,25,25,0.08)] bg-[#f8fafc] p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-[rgba(20,118,255,0.12)] flex items-center justify-center text-[#1476ff] shrink-0">
                  <Search size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#191919]">资产引用已升级为显式选择</p>
                  <p className="text-[10px] text-[#8b95a7] leading-relaxed mt-1">
                    平台资产和个人资产需要在左侧「资产库」中先查看详情，再显式加入当前会话，系统会保留来源与风险提示。
                  </p>
                </div>
              </div>
            </div>
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
interface AssetsTabProps {
  platformAssets: AssetRecord[];
  personalAssets: AssetRecord[];
  referencedAssetIds: string[];
  onOpenItem: (item: RefDrawerItem) => void;
  onReferenceAsset: (asset: AssetRecord) => void;
  onUploadAsset: (fileName: string) => void;
}

const AssetSourceBadge = ({ source }: { source: AssetRecord['source_type'] }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${source === 'platform' ? 'bg-[#eff6ff] text-[#1476ff]' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
    {source === 'platform' ? <Shield size={10} /> : <Lock size={10} />}
    {source === 'platform' ? '平台资产' : '个人资产'}
  </span>
);

const AssetPreview = ({ asset }: { asset: AssetRecord }) => {
  if (asset.preview.kind === 'palette') {
    return (
      <div className="w-full h-full rounded-2xl p-3 flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${asset.preview.accent} 0%, ${asset.preview.secondary} 100%)` }}>
        <div className="flex gap-1.5">
          {[asset.preview.accent, asset.preview.secondary, '#ffffffcc'].map(color => (
            <span key={color} className="w-4 h-4 rounded-full border border-white/70" style={{ background: color }} />
          ))}
        </div>
        <span className="text-[11px] font-semibold text-white/90">{asset.preview.label}</span>
      </div>
    );
  }

  if (asset.preview.kind === 'grid') {
    return (
      <div className="w-full h-full rounded-2xl p-3 grid grid-cols-3 gap-1.5" style={{ background: asset.preview.accent }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-white/60" style={{ background: index % 2 === 0 ? '#ffffffcc' : asset.preview.secondary }} />
        ))}
      </div>
    );
  }

  if (asset.preview.kind === 'canvas') {
    return (
      <div className="w-full h-full rounded-2xl p-3 flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${asset.preview.accent} 0%, ${asset.preview.secondary} 100%)` }}>
        <div className="space-y-1.5">
          <div className="h-3 w-2/3 rounded-full bg-white/60" />
          <div className="h-2.5 w-1/2 rounded-full bg-white/35" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-10 rounded-xl bg-white/75" />
          <div className="h-10 rounded-xl bg-white/35" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl p-3 flex flex-col justify-between" style={{ background: '#f8fafc' }}>
      <div className="space-y-1.5">
        <div className="h-3 w-3/5 rounded-full bg-[#dbeafe]" />
        <div className="h-2.5 w-4/5 rounded-full bg-[#e5e7eb]" />
        <div className="h-2.5 w-1/2 rounded-full bg-[#e5e7eb]" />
      </div>
      <span className="text-[10px] font-medium text-[#64748b]">{asset.preview.label}</span>
    </div>
  );
};

export const AssetsTab = ({
  platformAssets,
  personalAssets,
  referencedAssetIds,
  onOpenItem,
  onReferenceAsset,
  onUploadAsset,
}: AssetsTabProps) => {
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState<'platform' | 'personal'>('platform');
  const [searchSource, setSearchSource] = useState<'all' | 'platform' | 'personal'>('all');
  const [tagFilter, setTagFilter] = useState('全部');
  const [sortBy, setSortBy] = useState<'recent' | 'updated'>('recent');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const allAssets = [...platformAssets, ...personalAssets];
  const displayPool = search.trim()
    ? allAssets.filter(asset => {
        const matchSource = searchSource === 'all' || asset.source_type === searchSource;
        const query = search.trim().toLowerCase();
        const matchSearch = asset.title.toLowerCase().includes(query)
          || asset.tags.some(tag => tag.toLowerCase().includes(query))
          || asset.owner.toLowerCase().includes(query);
        return matchSource && matchSearch;
      })
    : activeSource === 'platform' ? platformAssets : personalAssets;

  const tagOptions = ['全部', ...Array.from(new Set(displayPool.flatMap(asset => asset.tags))).slice(0, 6)];
  const visibleAssets = displayPool
    .filter(asset => tagFilter === '全部' || asset.tags.includes(tagFilter))
    .sort((a, b) => {
      if (sortBy === 'recent') return Number(Boolean(b.recent)) - Number(Boolean(a.recent));
      return b.updated_at.localeCompare(a.updated_at);
    });

  const recentAssets = !search.trim() ? visibleAssets.filter(asset => asset.recent).slice(0, 2) : [];
  const platformResults = search.trim() ? visibleAssets.filter(asset => asset.source_type === 'platform') : [];
  const personalResults = search.trim() ? visibleAssets.filter(asset => asset.source_type === 'personal') : [];

  const renderAssetCard = (asset: AssetRecord) => {
    const referenced = referencedAssetIds.includes(asset.asset_id);

    return (
      <div
        key={asset.asset_id}
        className="bg-white border border-[rgba(25,25,25,0.08)] rounded-[18px] p-3 hover:border-[#d4e0ff] hover:bg-[#f8faff] transition-colors cursor-pointer"
        onClick={() => onOpenItem({ kind: 'asset', asset })}
      >
        <div className="flex gap-3">
          <div className="w-[88px] h-[72px] shrink-0">
            <AssetPreview asset={asset} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <AssetSourceBadge source={asset.source_type} />
                  {asset.source_type === 'platform' && asset.authority_level && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#f8fafc] text-[#475569]">{asset.authority_level}</span>
                  )}
                  {asset.source_type === 'personal' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#faf5ff] text-[#8b5cf6]">仅本人可见</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#191919] leading-snug truncate">{asset.title}</p>
                <p className="text-[10px] text-[#8b95a7] mt-1 line-clamp-2">{asset.summary_for_ai}</p>
              </div>
              {referenced && <span className="text-[10px] bg-[#f0fdf4] text-[#10b981] px-1.5 py-0.5 rounded-md font-medium shrink-0">已引用</span>}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {asset.applicable_scenarios.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#f5f6f7] text-[#667085]">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="text-[10px] text-[#98a2b3] truncate">
                {asset.owner} · {asset.updated_at} · {asset.format}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenItem({ kind: 'asset', asset });
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg border border-[rgba(25,25,25,0.1)] text-[#555] hover:bg-[#f8fafc] transition-colors"
                >
                  详情
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReferenceAsset(asset);
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-[#1476ff] text-white hover:bg-[#1060d0] transition-colors"
                >
                  引用到会话
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfd]">
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0 bg-white">
        <div className="flex items-center gap-[10px] mb-3">
          <button
            onClick={() => setActiveSource('platform')}
            className={`rounded-[18px] px-[12px] py-[4px] text-[14px] leading-[20px] transition-colors ${activeSource === 'platform' ? 'bg-[rgba(10,89,247,0.10)] text-[#0a59f7] font-medium' : 'text-[#191919] hover:text-[#0a59f7]'}`}
          >
            平台资产
          </button>
          <button
            onClick={() => setActiveSource('personal')}
            className={`rounded-[18px] px-[12px] py-[4px] text-[14px] leading-[20px] transition-colors ${activeSource === 'personal' ? 'bg-[rgba(10,89,247,0.10)] text-[#0a59f7] font-medium' : 'text-[#191919] hover:text-[#0a59f7]'}`}
          >
            个人资产
          </button>
        </div>

        <div className="relative mb-2.5">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索资产名称、标签、负责人..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#f5f6f7] rounded-xl text-[#191919] placeholder:text-[#bbb] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {search.trim() && (
            <>
              {[
                { id: 'all', label: '全部结果' },
                { id: 'platform', label: '平台资产' },
                { id: 'personal', label: '个人资产' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSearchSource(item.id as 'all' | 'platform' | 'personal')}
                  className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${searchSource === item.id ? 'bg-[#191919] text-white' : 'bg-[#f5f6f7] text-[#667085]'}`}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#f5f6f7] text-[#667085]">
            <Filter size={10} />
            {tagFilter}
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {tagOptions.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${tagFilter === tag ? 'bg-[#eff6ff] text-[#1476ff]' : 'bg-[#f5f6f7] text-[#667085]'}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortBy(sortBy === 'recent' ? 'updated' : 'recent')}
            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#f5f6f7] text-[#667085] ml-auto"
          >
            <ArrowUpDown size={10} />
            {sortBy === 'recent' ? '最近优先' : '更新时间'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {activeSource === 'personal' && !search.trim() && (
          <div className="rounded-[18px] border border-dashed border-[#d8b4fe] bg-[#faf5ff] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#5b21b6]">上传本地交付件</p>
                <p className="text-[10px] text-[#8b5cf6] mt-1">支持从本地导入交付稿，自动生成摘要、标签建议，并立即引用到当前会话。</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="shrink-0 inline-flex items-center gap-1.5 text-[10px] px-3 py-2 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
              >
                <Upload size={12} />
                上传
              </button>
            </div>
          </div>
        )}

        {recentAssets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wide">最近使用</span>
              <span className="text-[10px] text-[#98a2b3]">{recentAssets.length} 项</span>
            </div>
            <div className="space-y-2.5">{recentAssets.map(renderAssetCard)}</div>
          </div>
        )}

        {search.trim() ? (
          <div className="space-y-4">
            {searchSource !== 'personal' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wide">平台资产结果</span>
                  <span className="text-[10px] text-[#98a2b3]">{platformResults.length} 项</span>
                </div>
                <div className="space-y-2.5">
                  {platformResults.length > 0 ? platformResults.map(renderAssetCard) : <p className="text-[10px] text-[#bbb] px-1">暂无匹配的平台资产</p>}
                </div>
              </div>
            )}

            {searchSource !== 'platform' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wide">个人资产结果</span>
                  <span className="text-[10px] text-[#98a2b3]">{personalResults.length} 项</span>
                </div>
                <div className="space-y-2.5">
                  {personalResults.length > 0 ? personalResults.map(renderAssetCard) : <p className="text-[10px] text-[#bbb] px-1">暂无匹配的个人资产</p>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wide">{activeSource === 'platform' ? '平台资产列表' : '个人资产列表'}</span>
              <span className="text-[10px] text-[#98a2b3]">{visibleAssets.length} 项</span>
            </div>
            <div className="space-y-2.5">
              {visibleAssets.map(renderAssetCard)}
              {visibleAssets.length === 0 && <p className="text-[10px] text-[#bbb] px-1 pt-2">暂无符合条件的资产</p>}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4"
            onClick={() => {
              setShowUploadModal(false);
              setPendingUpload('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="w-[380px] max-w-full rounded-[24px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[rgba(25,25,25,0.08)] overflow-hidden"
              onClick={event => event.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[rgba(25,25,25,0.06)] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#191919]">上传个人资产</p>
                  <p className="text-[10px] text-[#98a2b3] mt-0.5">本地文件会进入你的个人资产区，可立即引用到当前会话。</p>
                </div>
                <button onClick={() => { setShowUploadModal(false); setPendingUpload(''); }} className="text-[#bbb] hover:text-[#555] transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="px-5 py-5 space-y-4">
                <input
                  ref={uploadRef}
                  type="file"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) setPendingUpload(file.name);
                    event.target.value = '';
                  }}
                />

                {!pendingUpload ? (
                  <button
                    onClick={() => uploadRef.current?.click()}
                    className="w-full rounded-[20px] border border-dashed border-[#c4b5fd] bg-[#faf5ff] py-8 px-4 text-center hover:bg-[#f5f3ff] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#e9d5ff] flex items-center justify-center mx-auto mb-3 text-[#7c3aed]">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-medium text-[#5b21b6]">选择本地文件</p>
                    <p className="text-[10px] text-[#8b5cf6] mt-1">支持 FIG / PNG / PDF / PPTX / DOCX / ZIP</p>
                  </button>
                ) : (
                  <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-[#fcfcfd] p-4">
                    <p className="text-[11px] font-medium text-[#191919]">{pendingUpload}</p>
                    <div className="mt-3 rounded-2xl bg-[#f8fafc] border border-[rgba(25,25,25,0.06)] p-3">
                      <p className="text-[10px] font-semibold text-[#667085] uppercase tracking-wide mb-2">AI 摘要</p>
                      <p className="text-xs text-[#475467] leading-relaxed">
                        该资产已识别为当前项目的交付件或参考物料，适合继续作为页面结构、视觉表达和交互细节的上下文输入。
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {['交付稿', '个人', '可立即引用'].map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-[#f5f3ff] text-[#7c3aed]">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => { setShowUploadModal(false); setPendingUpload(''); }}
                  className="flex-1 border border-[rgba(25,25,25,0.12)] text-xs py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (!pendingUpload) return;
                    onUploadAsset(pendingUpload);
                    setShowUploadModal(false);
                    setPendingUpload('');
                  }}
                  disabled={!pendingUpload}
                  className={`flex-1 text-xs py-2.5 rounded-xl font-medium transition-colors ${pendingUpload ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]' : 'bg-[#f3f4f6] text-[#bbb] cursor-not-allowed'}`}
                >
                  引用到会话
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  onInsertText: (text: string) => void;
  onReferenceAsset: (asset: AssetRecord) => void;
}

export const ReferenceDrawer: React.FC<ReferenceDrawerProps> = ({ item, onClose, onInsertText, onReferenceAsset }) => {
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
            <button onClick={() => { onInsertText(`@${doc.title} `); onClose(); }}
              className="flex-1 bg-[#1476ff] text-white text-xs py-2 rounded-xl font-medium hover:bg-[#1060d0] transition-colors flex items-center justify-center gap-1">
              <AtSign size={10} /> 引用到对话
            </button>
          </div>
        </div>
      );
    }

    if (item.kind === 'asset') {
      const { asset } = item;
      return (
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-[rgba(25,25,25,0.07)] shrink-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <AssetSourceBadge source={asset.source_type} />
                {asset.source_type === 'platform' && asset.authority_level && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#f8fafc] text-[#475569]">{asset.authority_level}</span>
                )}
                {asset.source_type === 'platform' && asset.review_status && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#f0fdf4] text-[#10b981]">{asset.review_status}</span>
                )}
                {asset.source_type === 'personal' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#faf5ff] text-[#7c3aed]">仅本人可见</span>
                )}
              </div>
              <button onClick={onClose} className="text-[#bbb] hover:text-[#555] transition-colors -mt-0.5"><X size={14} /></button>
            </div>
            <h3 className="text-sm font-semibold text-[#191919] leading-snug mb-1">{asset.title}</h3>
            <p className="text-[10px] text-[#8b95a7]">{asset.owner} · {asset.updated_at} · {asset.format}{asset.version ? ` · ${asset.version}` : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="w-full h-[160px]">
              <AssetPreview asset={asset} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#777] uppercase tracking-wide mb-2">AI 摘要</p>
              <p className="text-xs text-[#444] leading-relaxed">{asset.summary_for_ai}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#777] uppercase tracking-wide mb-2">适用场景</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {asset.applicable_scenarios.map(scene => (
                  <span key={scene} className="text-[10px] px-2 py-1 rounded-full bg-[#f5f6f7] text-[#667085]">{scene}</span>
                ))}
              </div>
            </div>
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.06)] rounded-xl p-3">
              <p className="text-[10px] text-[#aaa] mb-1.5">AI 可消费上下文</p>
              <p className="text-xs text-[#444] leading-relaxed">{asset.structured_payload}</p>
            </div>
            {asset.risk_note && (
              <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-[#ea580c] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-[#c2410c] uppercase tracking-wide mb-1">风险提示</p>
                    <p className="text-xs text-[#9a3412] leading-relaxed">{asset.risk_note}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.06)] rounded-xl p-3">
              <p className="text-[10px] text-[#aaa] mb-1.5">资产元信息</p>
              {[
                { label: '来源', value: asset.source_type === 'platform' ? '平台资产' : '个人资产' },
                { label: '标签', value: asset.tags.join(' / ') },
                { label: '引用标识', value: asset.citation_label },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-0.5 gap-3">
                  <span className="text-[10px] text-[#999]">{row.label}</span>
                  <span className="text-[10px] font-medium text-[#333] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-[rgba(25,25,25,0.06)] shrink-0 flex gap-2">
            <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-xs py-2 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">关闭</button>
            <button onClick={() => { onReferenceAsset(asset); onClose(); }}
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
            <button onClick={() => { onInsertText(`[组件:${item.name}]`); onClose(); }}
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
            <button onClick={() => { onInsertText(`[插画:${item.name}]`); onClose(); }}
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
