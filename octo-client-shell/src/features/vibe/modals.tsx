/**
 * Vibe Design — modal components: PixImportModal, PublishModal, SharePanel, ExportToDesignerModal
 */
import React, { useState } from 'react';
import { X, Check, Link, Copy, Globe, UserPlus, Download, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { savePublished, saveCollab, pushLiveUpdate, generateId } from './storage';
import type { GeneratedPage } from './types';

// ─── ExportToDesignerModal ────────────────────────────────────────────────────
interface ExportToDesignerModalProps {
  onClose: () => void;
  pages: GeneratedPage[];
  onToast?: (msg: string) => void;
}

export const ExportToDesignerModal: React.FC<ExportToDesignerModalProps> = ({ onClose, pages, onToast }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(pages.map(p => p.id)));
  const [step, setStep] = useState<'select' | 'code'>('select');
  const [transferCode] = useState(() => {
    const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${seg()}-${seg()}-${seg()}`;
  });
  const [copied, setCopied] = useState(false);

  const togglePage = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleCopy = () => {
    navigator.clipboard.writeText(transferCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPages = pages.filter(p => selected.has(p.id));

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] w-[440px] overflow-hidden"
      >
        {step === 'select' ? (
          <div className="px-6 pt-6 pb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#191919]">导出到 Octo Designer</h3>
                <p className="text-[10px] text-[#aaa] mt-0.5">选择要导出的页面，生成传送码后在设计工具中导入</p>
              </div>
              <button onClick={onClose} className="text-[#bbb] hover:text-[#555]"><X size={16} /></button>
            </div>

            {/* Page list */}
            <div className="space-y-2 mb-5 max-h-[200px] overflow-y-auto">
              {pages.length === 0 ? (
                <p className="text-xs text-[#aaa] text-center py-6">暂无生成的页面，请先在左侧生成原型</p>
              ) : pages.map(page => (
                <label key={page.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected.has(page.id) ? 'border-[#1476ff] bg-[#f0f5ff]' : 'border-[rgba(25,25,25,0.08)] hover:border-[rgba(25,25,25,0.18)]'}`}>
                  <input type="checkbox" checked={selected.has(page.id)} onChange={() => togglePage(page.id)} className="accent-[#1476ff] w-3.5 h-3.5 shrink-0" />
                  <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-[#f0f5ff] to-[#e0ecff] shrink-0 flex items-center justify-center">
                    <div className="w-6 h-4 bg-[#1476ff]/20 rounded-sm" />
                  </div>
                  <span className="text-xs font-medium text-[#333]">{page.name}</span>
                </label>
              ))}
            </div>

            {/* Format notes */}
            <div className="bg-[#fafafa] border border-[rgba(25,25,25,0.07)] rounded-xl p-3.5 mb-5 space-y-1.5">
              <p className="text-[10px] font-semibold text-[#555] mb-2">导出格式说明</p>
              {[
                ['✓', '布局结构和组件位置完整保留'],
                ['✓', '文本内容保留，字体规范待精修'],
                ['—', '交互行为不随导出（设计工具不支持）'],
              ].map(([icon, text]) => (
                <p key={text} className="text-[10px] text-[#777] flex gap-2">
                  <span className={icon === '✓' ? 'text-[#10b981]' : 'text-[#bbb]'}>{icon}</span>{text}
                </p>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-sm py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">取消</button>
              <button
                disabled={selected.size === 0}
                onClick={() => setStep('code')}
                className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${selected.size > 0 ? 'bg-[#1476ff] text-white hover:bg-[#1060d0]' : 'bg-[#f0f0f0] text-[#bbb] cursor-not-allowed'}`}>
                <Download size={12} /> 生成传送码
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
                <Check size={24} className="text-[#10b981]" />
              </div>
              <button onClick={onClose} className="text-[#bbb] hover:text-[#555]"><X size={16} /></button>
            </div>
            <h3 className="text-sm font-bold text-[#191919] mb-1">传送码已生成</h3>
            <p className="text-[10px] text-[#aaa] mb-1">已导出 {selectedPages.length} 个页面：{selectedPages.map(p => p.name).join('、')}</p>
            <p className="text-[10px] text-[#ccc] mb-5">有效期 24 小时</p>

            {/* Transfer code */}
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.07)] rounded-xl px-4 py-3 flex items-center gap-2 mb-5">
              <span className="text-base font-mono font-bold text-[#191919] flex-1 tracking-widest">{transferCode}</span>
              <button onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-[#f0fdf4] text-[#10b981]' : 'bg-[#1476ff] text-white hover:bg-[#1060d0]'}`}>
                {copied ? <><Check size={10} />已复制</> : <><Copy size={10} />复制</>}
              </button>
            </div>

            {/* Usage instructions */}
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.07)] rounded-xl p-3.5 mb-5">
              <p className="text-[10px] font-semibold text-[#555] mb-2">在 Octo Designer 中导入：</p>
              <p className="text-[10px] text-[#777] leading-relaxed">文件 → 导入 → 粘贴传送码 → 确认</p>
            </div>

            <div className="flex gap-2.5">
              <button onClick={onClose}
                className="flex-1 border border-[rgba(25,25,25,0.12)] text-sm py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">
                完成
              </button>
              <button
                onClick={() => { setStep('select'); }}
                className="flex items-center gap-1.5 border border-[rgba(25,25,25,0.12)] text-sm px-4 py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors whitespace-nowrap">
                <RefreshCw size={12} /> 重新选择
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── PixImportModal ───────────────────────────────────────────────────────────
interface PixImportModalProps {
  onClose: () => void;
  onImport: (name: string) => void;
}

export const PixImportModal: React.FC<PixImportModalProps> = ({ onClose, onImport }) => {
  const [tab, setTab] = useState<'code' | 'url'>('code');
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');

  const handleConfirm = () => {
    const value = tab === 'code' ? code.trim() : url.trim();
    if (!value) return;
    onImport(tab === 'code' ? `传送码:${value}.pix` : `导入设计.pix`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] w-[400px] overflow-hidden"
      >
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#191919]">导入 .pix 设计</h3>
              <p className="text-[10px] text-[#aaa] mt-0.5">选择导入方式</p>
            </div>
            <button onClick={onClose} className="text-[#bbb] hover:text-[#555] transition-colors"><X size={16} /></button>
          </div>

          <div className="flex bg-[#f5f6f7] rounded-xl p-1 mb-4">
            {([['code', '传送码导入'], ['url', 'URL 粘贴']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${tab === t ? 'bg-white text-[#191919] font-medium shadow-sm' : 'text-[#777]'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'code' ? (
            <div className="space-y-3">
              <p className="text-[10px] text-[#aaa]">在 Pix 编辑器中生成传送码，粘贴到下方即可导入</p>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="例如：ABCD-1234-EFGH" autoFocus
                className="w-full border border-[rgba(25,25,25,0.12)] rounded-xl px-3 py-2.5 text-sm text-[#191919] placeholder:text-[#ccc] outline-none focus:border-[#1476ff] font-mono tracking-wider" />
              <p className="text-[10px] text-[#ccc]">传送码有效期 24 小时，每次生成唯一</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-[#aaa]">粘贴 Pix 设计文件的共享链接</p>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://pix.design/share/..." autoFocus
                className="w-full border border-[rgba(25,25,25,0.12)] rounded-xl px-3 py-2.5 text-sm text-[#191919] placeholder:text-[#ccc] outline-none focus:border-[#1476ff]" />
              <p className="text-[10px] text-[#ccc]">仅支持 pix.design 共享链接</p>
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-sm py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">取消</button>
            <button onClick={handleConfirm} disabled={tab === 'code' ? !code.trim() : !url.trim()}
              className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-colors ${(tab === 'code' ? code.trim() : url.trim()) ? 'bg-[#1476ff] text-white hover:bg-[#1060d0]' : 'bg-[#f0f0f0] text-[#bbb] cursor-not-allowed'}`}>
              导入
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── PublishModal ─────────────────────────────────────────────────────────────
interface PublishModalProps {
  onClose: () => void;
  pages: GeneratedPage[];
  spec: string;
  title: string;
  onPublished?: (url: string, at: number) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ onClose, pages, spec, title, onPublished }) => {
  const [step, setStep] = useState<'confirm' | 'done'>('confirm');
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleConfirm = () => {
    const id = generateId();
    savePublished(id, {
      id, title, spec, pages,
      activePageId: pages[0]?.id ?? null,
      publishedAt: Date.now(),
      owner: 'Vivian Chen',
      collaborators: [],
    });
    const url = `${window.location.origin}${window.location.pathname}#/preview/${id}`;
    setPreviewUrl(url);
    setStep('done');
    onPublished?.(url, Date.now());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] w-[440px] overflow-hidden"
      >
        {step === 'confirm' ? (
          <>
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#191919]">发布 Demo</h3>
                <button onClick={onClose} className="text-[#aaa] hover:text-[#555]"><X size={16} /></button>
              </div>
              <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.07)] rounded-xl p-4 mb-4 space-y-2">
                {[
                  { label: '项目名称', value: title },
                  { label: '包含页面', value: pages.length > 0 ? `${pages.length} 个页面` : '暂无页面（发布空画布）' },
                  { label: '设计规范', value: spec },
                  { label: '访问权限', value: '链接可访问（只读）' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-[#777]">{item.label}</span>
                    <span className="text-xs font-medium text-[#191919]">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#aaa]">发布后，下游开发可通过链接查看 Demo 效果及设计参数标注，无法编辑。</p>
            </div>
            <div className="px-6 pb-6 flex gap-2.5">
              <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-sm py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">取消</button>
              <button onClick={handleConfirm} className="flex-1 bg-[#1476ff] text-white text-sm py-2.5 rounded-xl font-medium hover:bg-[#1060d0] transition-colors">确认发布</button>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-[#10b981]" />
            </div>
            <h3 className="text-sm font-bold text-[#191919] mb-1.5">发布成功！</h3>
            <p className="text-xs text-[#777] mb-5">开发可通过以下链接查看完整 Demo 及设计参数</p>
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.07)] rounded-xl px-4 py-3 flex items-center gap-2 text-left mb-3">
              <Link size={12} className="text-[#aaa] shrink-0" />
              <span className="text-[10px] text-[#555] flex-1 truncate font-mono">{previewUrl}</span>
              <button onClick={handleCopy} className={`shrink-0 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-[#f0fdf4] text-[#10b981]' : 'bg-[#1476ff] text-white'}`}>
                {copied ? <><Check size={10} />已复制</> : <><Copy size={10} />复制</>}
              </button>
            </div>
            <button onClick={() => window.open(previewUrl, '_blank')}
              className="w-full bg-[#f0f5ff] text-[#1476ff] text-xs py-2 rounded-xl mb-3 hover:bg-[#e0ecff] transition-colors flex items-center justify-center gap-1.5">
              <Globe size={12} /> 在新标签页预览
            </button>
            <button onClick={onClose} className="w-full border border-[rgba(25,25,25,0.12)] text-sm py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">关闭</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── SharePanel ───────────────────────────────────────────────────────────────
interface SharePanelProps {
  onClose: () => void;
  pages: GeneratedPage[];
  spec: string;
  title: string;
  existingCollabId?: string;
  onCollabIdCreated?: (id: string) => void;
}

export const SharePanel: React.FC<SharePanelProps> = ({ onClose, pages, spec, title, existingCollabId, onCollabIdCreated }) => {
  const [copied, setCopied] = useState(false);
  const [copiedOpen, setCopiedOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const [collabSessionId] = useState(() => {
    const id = existingCollabId ?? generateId();
    saveCollab(id, { id, title, spec, pages, activePageId: pages[0]?.id ?? null, publishedAt: Date.now(), owner: 'Vivian Chen', collaborators: [] });
    pushLiveUpdate(id, { title, spec, pages, activePageId: pages[0]?.id ?? null, owner: 'Vivian Chen', collaborators: [] });
    onCollabIdCreated?.(id);
    return id;
  });

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/collab/${collabSessionId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopiedOpen(true);
    setTimeout(() => setCopiedOpen(false), 2000);
    window.open(inviteUrl, '_blank');
  };

  const handleInvite = () => {
    const trimmed = email.trim();
    if (trimmed && !invitedEmails.includes(trimmed)) setInvitedEmails(prev => [...prev, trimmed]);
    setEmail('');
  };

  const collaborators = [
    { name: 'Vivian Chen', role: '所有者', initial: 'V', color: '#1476ff' },
    ...invitedEmails.map((e, i) => ({ name: e, role: '编辑者', initial: e.charAt(0).toUpperCase(), color: ['#7c3aed', '#059669', '#d97706', '#db2777'][i % 4] })),
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] w-[460px] overflow-hidden"
      >
        <div className="px-6 pt-6 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#191919]">共享协作</h3>
              <p className="text-[10px] text-[#aaa] mt-0.5">获得链接的协作者可进入并共同编辑，画布实时同步</p>
            </div>
            <button onClick={onClose} className="text-[#aaa] hover:text-[#555]"><X size={16} /></button>
          </div>

          <div className="flex gap-2 mb-5">
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()}
              placeholder="输入邮箱邀请协作者..."
              className="flex-1 border border-[rgba(25,25,25,0.12)] rounded-xl px-3 py-2 text-xs text-[#191919] placeholder:text-[#bbb] outline-none focus:border-[#1476ff]" />
            <button onClick={handleInvite} className="bg-[#1476ff] text-white text-xs px-4 py-2 rounded-xl hover:bg-[#1060d0] transition-colors whitespace-nowrap flex items-center gap-1.5">
              <UserPlus size={12} /> 邀请
            </button>
          </div>

          <div className="mb-5">
            <p className="text-[10px] text-[#aaa] mb-2.5">当前协作者 · {collaborators.length} 人</p>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {collaborators.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: c.color }}>{c.initial}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#191919]">{c.name}</p>
                    <p className="text-[10px] text-[#aaa]">{c.role}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${c.role === '所有者' ? 'border-[#d4e0ff] text-[#1476ff] bg-[#f0f5ff]' : 'border-[rgba(25,25,25,0.1)] text-[#777]'}`}>{c.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[rgba(25,25,25,0.06)] pt-4 space-y-2">
            <p className="text-[10px] text-[#aaa]">协作链接（粘贴到浏览器即可加入）</p>
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.07)] rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Link size={12} className="text-[#aaa] shrink-0" />
              <span className="text-[10px] text-[#555] flex-1 truncate font-mono">{inviteUrl}</span>
              <button onClick={handleCopy} className={`shrink-0 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-[#f0fdf4] text-[#10b981]' : 'bg-[#f5f6f7] text-[#555] hover:bg-[#eee]'}`}>
                {copied ? <><Check size={10} />已复制</> : <><Copy size={10} />复制</>}
              </button>
            </div>
            <button onClick={handleOpenInNewTab}
              className={`w-full text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${copiedOpen ? 'bg-[#f0fdf4] text-[#10b981] border border-[#d1fae5]' : 'bg-[#1476ff] text-white hover:bg-[#1060d0]'}`}>
              <Globe size={12} /> {copiedOpen ? '已在新标签页打开' : '以协作者身份打开（测试）'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
