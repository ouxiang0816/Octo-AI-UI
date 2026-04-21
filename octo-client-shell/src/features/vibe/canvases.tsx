/**
 * Shared canvas mock components — used by both VibeDesign editor and PublishedView.
 */
import React, { useState } from 'react';
import { Sparkles, Layers, Search, Eye, EyeOff, Check, Loader2, Plus, Trash2, ChevronDown } from 'lucide-react';
import type { CanvasType } from './types';

// ─── Interactive Login Demo (used for all Vibe Design generations) ─────────────
export const InteractiveLoginDemo: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email) e.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '邮箱格式不正确';
    if (!password) e.password = '请输入密码';
    else if (password.length < 3) e.password = '密码至少 3 位';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1400);
  };

  if (success) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto">
            <Check size={32} className="text-[#10b981]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#191919]">登录成功</h2>
            <p className="text-sm text-[#777] mt-1">欢迎回来，{email.split('@')[0] || '用户'} 👋</p>
          </div>
          <button
            onClick={() => { setSuccess(false); setEmail(''); setPassword(''); setErrors({}); }}
            className="text-xs text-[#1476ff] hover:underline"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex items-center justify-center">
      <div data-layer-id="card" className="w-[340px] space-y-4">
        {/* Logo */}
        <div className="text-center space-y-1 mb-2">
          <div data-layer-id="logo" className="w-11 h-11 rounded-xl bg-[#1476ff] flex items-center justify-center mx-auto mb-3 shadow-[0_4px_12px_rgba(20,118,255,0.35)]">
            <Sparkles size={24} className="text-white" />
          </div>
          <h2 data-layer-id="title" className="text-[18px] font-bold text-[#191919]">欢迎回来</h2>
          <p data-layer-id="subtitle" className="text-xs text-[#aaa]">登录你的设计工作台</p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label data-layer-id="email-label" className="block text-xs font-medium text-[#444]">邮箱</label>
          <input
            data-layer-id="email-input"
            type="email" value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="your@email.com"
            className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#191919] placeholder:text-[#ccc] outline-none transition-colors ${errors.email ? 'border-[#ef4444] bg-[#fff5f5] focus:border-[#ef4444]' : 'border-[#e5e7eb] bg-[#fafafa] focus:border-[#1476ff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(20,118,255,0.1)]'}`}
          />
          {errors.email && <p className="text-[10px] text-[#ef4444] flex items-center gap-1">⚠ {errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label data-layer-id="password-label" className="block text-xs font-medium text-[#444]">密码</label>
            <button data-layer-id="forgot-pwd-btn" className="text-[10px] text-[#1476ff] hover:underline">忘记密码？</button>
          </div>
          <div data-layer-id="password-input" className="relative">
            <input
              type={showPwd ? 'text' : 'password'} value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="输入密码"
              className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#191919] placeholder:text-[#ccc] outline-none transition-colors ${errors.password ? 'border-[#ef4444] bg-[#fff5f5]' : 'border-[#e5e7eb] bg-[#fafafa] focus:border-[#1476ff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(20,118,255,0.1)]'}`}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#555] transition-colors">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-[#ef4444] flex items-center gap-1">⚠ {errors.password}</p>}
        </div>

        {/* Submit */}
        <button data-layer-id="login-btn" onClick={handleLogin} disabled={loading}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors mt-1 ${loading ? 'bg-[#6aabff] text-white cursor-wait' : 'bg-[#1476ff] text-white hover:bg-[#1060d0] shadow-[0_2px_8px_rgba(20,118,255,0.3)] hover:shadow-[0_4px_14px_rgba(20,118,255,0.4)] active:scale-[0.98]'}`}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> 登录中...
            </span>
          ) : '登 录'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#f0f0f0]" />
          <span className="text-[10px] text-[#ccc]">或</span>
          <div className="flex-1 h-px bg-[#f0f0f0]" />
        </div>

        {/* SSO */}
        <button data-layer-id="google-btn" className="w-full border border-[#e5e7eb] py-2.5 rounded-xl text-sm text-[#333] flex items-center justify-center gap-2 hover:bg-[#fafafa] active:scale-[0.98] transition-colors">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#ea4335] to-[#fbbc04] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">G</span>
          </div>
          使用 Google 账号登录
        </button>

        <p className="text-center text-[10px] text-[#ccc] pt-1">随意输入内容即可体验完整交互</p>
      </div>
    </div>
  );
};

export const LoginCanvas = () => (
  <div className="w-full h-full bg-white flex items-center justify-center">
    <div data-layer-id="login-card" className="w-[320px] space-y-5">
      <div className="text-center space-y-1">
        <div data-layer-id="logo" className="w-10 h-10 rounded-xl bg-[#1476ff] flex items-center justify-center mx-auto mb-3">
          <Sparkles size={20} className="text-white" />
        </div>
        <h2 data-layer-id="title" className="text-lg font-semibold text-[#191919]">欢迎回来</h2>
        <p data-layer-id="subtitle" className="text-xs text-[#777]">请登录您的账号</p>
      </div>
      <div className="space-y-3">
        <div>
          <label data-layer-id="email-label" className="block text-xs text-[#555] mb-1">邮箱</label>
          <div data-layer-id="email-input" className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#191919] bg-[#fafafa]">design@company.com</div>
        </div>
        <div>
          <label data-layer-id="password-label" className="block text-xs text-[#555] mb-1">密码</label>
          <div data-layer-id="password-input" className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#999] bg-[#fafafa]">••••••••</div>
        </div>
      </div>
      <button data-layer-id="login-btn" className="w-full bg-[#1476ff] text-white text-sm py-2.5 rounded-lg font-medium shadow-[0_2px_8px_rgba(20,118,255,0.3)]">登录</button>
      <div data-layer-id="divider" className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#f0f0f0]" />
        <span data-layer-id="divider-text" className="text-xs text-[#aaa]">或</span>
        <div className="flex-1 h-px bg-[#f0f0f0]" />
      </div>
      <button data-layer-id="google-btn" className="w-full border border-[#e5e7eb] text-sm py-2.5 rounded-lg text-[#191919] flex items-center justify-center gap-2">
        <div data-layer-id="google-icon" className="w-4 h-4 rounded-full bg-[#ea4335]" />
        <span data-layer-id="google-btn-text">Google 账号登录</span>
      </button>
    </div>
  </div>
);

export const DashboardCanvas = () => {
  const NAV_ITEMS = ['概览', '项目', '团队', '资产库', '设置'];
  const INIT_PROJECTS = [
    { name: '登录体验优化', status: 0 },
    { name: '首页改版 v3', status: 1 },
    { name: '设计规范 2.0', status: 2 },
  ];
  const STATUS_LABELS = ['进行中', '评审中', '已完成'];
  const STATUS_STYLES = ['bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-green-50 text-green-600'];

  const [activeNav, setActiveNav] = useState(0);
  const [projects, setProjects] = useState(INIT_PROJECTS);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const stats = [
    { label: '进行中', value: projects.filter(p => p.status === 0).length, color: '#1476ff' },
    { label: '评审中', value: projects.filter(p => p.status === 1).length, color: '#f59e0b' },
    { label: '已完成', value: projects.filter(p => p.status === 2).length, color: '#10b981' },
  ];

  const cycleStatus = (i: number) => {
    setProjects(prev => prev.map((p, idx) => idx === i ? { ...p, status: (p.status + 1) % 3 } : p));
  };

  const addProject = () => {
    const name = newName.trim();
    if (!name) return;
    setProjects(prev => [...prev, { name, status: 0 }]);
    setNewName('');
    setAdding(false);
  };

  const removeProject = (i: number) => setProjects(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="w-full h-full bg-[#f8fafc] flex">
      {/* Sidebar */}
      <div data-layer-id="sidebar" className="w-[150px] bg-white border-r border-[#f0f0f0] flex flex-col py-4 shrink-0">
        <div className="px-4 mb-5">
          <div data-layer-id="brand-logo" className="w-7 h-7 rounded-lg bg-[#1476ff] flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
        </div>
        {NAV_ITEMS.map((item, i) => (
          <button key={item} data-layer-id={`nav-item-${i}`} onClick={() => setActiveNav(i)}
            className={`px-4 py-2 text-xs flex items-center gap-2 text-left transition-colors w-full ${i === activeNav ? 'text-[#1476ff] bg-[#f0f5ff] font-medium' : 'text-[#555] hover:bg-[#f8fafc]'}`}>
            <div data-layer-id={`nav-dot-${i}`} className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === activeNav ? 'bg-[#1476ff]' : 'bg-[#ddd]'}`} />
            <span data-layer-id={`nav-label-${i}`}>{item}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-5 overflow-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 data-layer-id="page-title" className="text-sm font-bold text-[#191919]">{NAV_ITEMS[activeNav]}</h1>
          <span data-layer-id="page-date" className="text-xs text-[#777]">2026 / 03</span>
        </div>

        {/* Stats */}
        <div data-layer-id="stats-grid" className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} data-layer-id={`stat-card-${s.label}`} className="bg-white rounded-xl p-3 border border-[#f0f0f0]">
              <div data-layer-id={`stat-label-${s.label}`} className="text-[10px] text-[#777] mb-1">{s.label}</div>
              <div data-layer-id={`stat-value-${s.label}`} className="text-xl font-bold transition-colors" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div data-layer-id="projects-section" className="bg-white rounded-xl border border-[#f0f0f0] overflow-hidden flex-1">
          <div className="px-4 py-2.5 border-b border-[#f5f5f5] flex items-center justify-between">
            <span data-layer-id="projects-title" className="text-xs font-medium text-[#191919]">最近项目</span>
            <button data-layer-id="add-project-btn" onClick={() => setAdding(v => !v)}
              className="flex items-center gap-1 text-[10px] text-[#1476ff] hover:text-[#1060d0] transition-colors">
              <Plus size={10} /> 新增
            </button>
          </div>

          {adding && (
            <div className="px-4 py-2 flex items-center gap-2 border-b border-[#f5f5f5] bg-[#f8faff]">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') setAdding(false); }}
                placeholder="项目名称，回车确认"
                className="flex-1 text-xs border border-[#d4e0ff] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#1476ff] bg-white text-[#191919] placeholder:text-[#ccc]" />
              <button onClick={addProject} className="text-[10px] bg-[#1476ff] text-white px-2.5 py-1.5 rounded-lg">确认</button>
              <button onClick={() => setAdding(false)} className="text-[10px] text-[#999] hover:text-[#555]">取消</button>
            </div>
          )}

          {projects.map((p, i) => (
            <div key={i} data-layer-id={`project-item-${i}`} className="px-4 py-2.5 flex items-center gap-3 border-b border-[#f9f9f9] last:border-0 group hover:bg-[#fafbff] transition-colors">
              <div data-layer-id={`project-icon-${i}`} className="w-5 h-5 rounded bg-[#e8f0fe] flex items-center justify-center shrink-0">
                <Layers size={10} className="text-[#1476ff]" />
              </div>
              <span data-layer-id={`project-name-${i}`} className="text-xs text-[#191919] flex-1 truncate">{p.name}</span>
              <button data-layer-id={`project-status-${i}`} onClick={() => cycleStatus(i)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors cursor-pointer ${STATUS_STYLES[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </button>
              <button onClick={() => removeProject(i)}
                className="opacity-0 group-hover:opacity-100 text-[#ddd] hover:text-[#ef4444] transition-colors">
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-[#bbb]">暂无项目，点击新增</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DetailCanvas = () => {
  const ALL_TAGS = ['登录', 'UI优化', '表单设计', '移动端', '深色模式'];
  const [title, setTitle] = useState('登录体验优化 v2.1');
  const [editingTitle, setEditingTitle] = useState(false);
  const [desc, setDesc] = useState('优化了登录流程，简化了表单步骤，提升了视觉一致性。');
  const [tags, setTags] = useState(['登录', 'UI优化', '表单设计']);
  const [published, setPublished] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#f0f0f0] px-5 py-3 flex items-center gap-3">
        {editingTitle ? (
          <input data-layer-id="detail-title" autoFocus value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
            className="flex-1 text-xs font-medium text-[#191919] border-b border-[#1476ff] outline-none bg-transparent" />
        ) : (
          <span data-layer-id="detail-title" className="text-xs font-medium text-[#191919] flex-1 cursor-text hover:text-[#1476ff] transition-colors"
            onClick={() => setEditingTitle(true)}>{title}</span>
        )}
        <button data-layer-id="publish-btn" onClick={() => setPublished(v => !v)}
          className={`text-[10px] px-3 py-1 rounded-full transition-colors ${published ? 'bg-[#f0fdf4] text-[#10b981] border border-[#d1fae5]' : 'bg-[#1476ff] text-white hover:bg-[#1060d0]'}`}>
          {published ? '✓ 已发布' : '发布'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: preview + meta */}
        <div className="flex-1 p-5 overflow-auto">
          <div data-layer-id="preview-image" className="rounded-xl bg-gradient-to-br from-[#1476ff] to-[#6366f1] aspect-[16/9] w-full mb-4 flex items-center justify-center">
            <span className="text-white text-sm opacity-70">设计预览</span>
          </div>

          <textarea data-layer-id="description" value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            className="w-full text-xs text-[#777] leading-relaxed mb-3 border border-transparent rounded-lg px-2 py-1.5 resize-none outline-none hover:border-[#e5e7eb] focus:border-[#1476ff] focus:bg-[#fafeff] transition-colors bg-transparent" />

          {/* Tags */}
          <div data-layer-id="tags" className="flex flex-wrap gap-1.5 items-center">
            {tags.map(tag => (
              <span key={tag} onClick={() => toggleTag(tag)}
                className="text-[10px] bg-[#f0f5ff] text-[#1476ff] px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#fde8e8] hover:text-[#ef4444] transition-colors">
                {tag} ×
              </span>
            ))}
            <button onClick={() => setShowTagPicker(v => !v)}
              className="text-[10px] text-[#aaa] border border-dashed border-[#ddd] px-2 py-0.5 rounded-full hover:border-[#1476ff] hover:text-[#1476ff] transition-colors">
              + 标签
            </button>
          </div>

          {showTagPicker && (
            <div className="mt-2 flex flex-wrap gap-1.5 p-2.5 bg-[#f8fafc] rounded-xl border border-[#f0f0f0]">
              {ALL_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${tags.includes(tag) ? 'bg-[#1476ff] text-white border-[#1476ff]' : 'border-[#e5e7eb] text-[#555] hover:border-[#1476ff] hover:text-[#1476ff]'}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: params */}
        <div data-layer-id="params-panel" className="w-[160px] border-l border-[#f5f5f5] p-4 shrink-0 overflow-auto">
          <div className="text-[10px] text-[#777] mb-3 font-medium uppercase tracking-wide">设计参数</div>
          {[
            { label: '主色', value: '#1476FF', editable: true },
            { label: '字体', value: 'PingFang SC', editable: false },
            { label: '圆角', value: '8px / 16px', editable: false },
          ].map(p => (
            <div key={p.label} className="mb-3">
              <div className="text-[10px] text-[#aaa] mb-0.5">{p.label}</div>
              {p.label === '主色' ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: '#1476ff' }} />
                  <span className="text-[10px] text-[#191919] font-medium font-mono">{p.value}</span>
                </div>
              ) : (
                <div className="text-[10px] text-[#191919] font-medium">{p.value}</div>
              )}
            </div>
          ))}
          <div className="mt-4 pt-3 border-t border-[#f5f5f5]">
            <div className="text-[10px] text-[#aaa] mb-1.5">状态</div>
            {(['草稿', '评审中', '已完成'] as const).map(s => (
              <button key={s} onClick={() => setPublished(s === '已完成')}
                className={`block w-full text-left text-[10px] px-2 py-1 rounded-lg mb-0.5 transition-colors ${(s === '已完成') === published ? 'bg-[#f0fdf4] text-[#10b981] font-medium' : 'text-[#777] hover:bg-[#f5f5f5]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FormCanvas = () => {
  const MEMBERS = ['Vivian Chen', 'Tom Lee', 'Alex Wang', 'Jackson Liu'];
  const PRIORITIES = ['低', '中', '高', '紧急'];
  const PRIORITY_STYLES = ['bg-gray-50 text-gray-500', 'bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-red-50 text-red-600'];

  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState(1);
  const [desc, setDesc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showOwnerDrop, setShowOwnerDrop] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '请输入需求名称';
    if (!owner) e.owner = '请选择负责人';
    if (!date) e.date = '请选择交付时间';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setName(''); setOwner(''); setDate(''); setDesc('');
    setPriority(1); setErrors({}); setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="w-full h-full bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto">
            <Check size={28} className="text-[#10b981]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#191919]">需求已提交</h2>
            <p className="text-xs text-[#777] mt-1">「{name}」已分配给 {owner}</p>
          </div>
          <button onClick={handleReset} className="text-xs text-[#1476ff] hover:underline">继续新增</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#f8fafc] flex items-center justify-center">
      <div data-layer-id="form-card" className="w-[380px] bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#191919]">新增需求</h2>

        {/* 需求名称 */}
        <div>
          <label className="block text-xs text-[#555] mb-1">需求名称</label>
          <input data-layer-id="name-input" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            placeholder="请输入需求名称"
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors text-[#191919] placeholder:text-[#ccc] ${errors.name ? 'border-[#ef4444] bg-[#fff5f5]' : 'border-[#e5e7eb] bg-[#fafafa] focus:border-[#1476ff] focus:bg-white'}`} />
          {errors.name && <p className="text-[10px] text-[#ef4444] mt-0.5">⚠ {errors.name}</p>}
        </div>

        {/* 负责人 */}
        <div data-layer-id="owner-select" className="relative">
          <label className="block text-xs text-[#555] mb-1">负责人</label>
          <button onClick={() => setShowOwnerDrop(v => !v)}
            className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition-colors ${errors.owner ? 'border-[#ef4444] bg-[#fff5f5]' : 'border-[#e5e7eb] bg-[#fafafa] hover:border-[#1476ff]'} ${owner ? 'text-[#191919]' : 'text-[#ccc]'}`}>
            {owner || '请选择负责人'}
            <ChevronDown size={12} className={`text-[#aaa] transition-transform ${showOwnerDrop ? 'rotate-180' : ''}`} />
          </button>
          {showOwnerDrop && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden">
              {MEMBERS.map(m => (
                <button key={m} onClick={() => { setOwner(m); setShowOwnerDrop(false); setErrors(p => ({ ...p, owner: '' })); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#f0f5ff] transition-colors ${owner === m ? 'text-[#1476ff] font-medium bg-[#f0f5ff]' : 'text-[#333]'}`}>
                  {m}
                </button>
              ))}
            </div>
          )}
          {errors.owner && <p className="text-[10px] text-[#ef4444] mt-0.5">⚠ {errors.owner}</p>}
        </div>

        {/* 优先级 */}
        <div>
          <label className="block text-xs text-[#555] mb-1.5">优先级</label>
          <div data-layer-id="priority-selector" className="flex gap-2">
            {PRIORITIES.map((p, i) => (
              <button key={p} onClick={() => setPriority(i)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${priority === i ? PRIORITY_STYLES[i] + ' border-current font-medium' : 'border-[#e5e7eb] text-[#999] hover:border-[#aaa]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 交付时间 */}
        <div>
          <label className="block text-xs text-[#555] mb-1">交付时间</label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); }}
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${errors.date ? 'border-[#ef4444] bg-[#fff5f5]' : 'border-[#e5e7eb] bg-[#fafafa] focus:border-[#1476ff] focus:bg-white'} ${date ? 'text-[#191919]' : 'text-[#ccc]'}`} />
          {errors.date && <p className="text-[10px] text-[#ef4444] mt-0.5">⚠ {errors.date}</p>}
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-xs text-[#555] mb-1">备注（可选）</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="补充说明..."
            className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#191919] placeholder:text-[#ccc] bg-[#fafafa] outline-none resize-none focus:border-[#1476ff] focus:bg-white transition-colors" />
        </div>

        <div className="flex gap-2 pt-1">
          <button data-layer-id="submit-btn" onClick={handleSubmit} className="flex-1 bg-[#1476ff] text-white text-sm py-2 rounded-lg font-medium hover:bg-[#1060d0] active:scale-[0.98] transition-colors shadow-[0_2px_8px_rgba(20,118,255,0.3)]">提交</button>
          <button data-layer-id="reset-btn" onClick={handleReset} className="flex-1 border border-[#e5e7eb] text-sm py-2 rounded-lg text-[#555] hover:bg-[#f5f5f5] transition-colors">重置</button>
        </div>
      </div>
    </div>
  );
};

export const ListCanvas = () => {
  const INIT_ITEMS = [
    { id: 1, name: 'AI功能 Toolbar', category: '组件库', owner: 'Vivian', starred: false },
    { id: 2, name: 'Dashboard 图表', category: '图表', owner: 'Tom', starred: true },
    { id: 3, name: '天气卡片', category: '组件库', owner: 'Alex', starred: false },
    { id: 4, name: '官网首页', category: '页面', owner: 'Jackson', starred: false },
    { id: 5, name: '渐变按钮', category: '组件库', owner: 'Lisa', starred: true },
  ];
  const CATEGORIES = ['全部', '组件库', '图表', '页面'];
  const GRAD_COLORS = [
    'from-[#e8f0fe] to-[#f0f5ff]',
    'from-[#fef3c7] to-[#fde68a]',
    'from-[#d1fae5] to-[#a7f3d0]',
    'from-[#fce7f3] to-[#fbcfe8]',
    'from-[#ede9fe] to-[#ddd6fe]',
  ];

  const [items, setItems] = useState(INIT_ITEMS);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [selected, setSelected] = useState<number | null>(null);

  const toggleStar = (id: number) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, starred: !it.starred } : it));

  const filtered = items.filter(it => {
    const matchCat = activeCategory === '全部' || it.category === activeCategory;
    const matchQ = !query || it.name.toLowerCase().includes(query.toLowerCase()) || it.owner.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-[#f0f0f0] px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex-1 relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input data-layer-id="search-input" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索资产名称、作者..."
            className="w-full border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-2 text-xs text-[#191919] placeholder:text-[#aaa] bg-[#fafafa] outline-none focus:border-[#1476ff] focus:bg-white transition-colors" />
        </div>
        {query && (
          <button onClick={() => setQuery('')} className="text-[10px] text-[#999] hover:text-[#555] transition-colors">清除</button>
        )}
      </div>

      {/* Category tabs */}
      <div data-layer-id="category-tabs" className="bg-white border-b border-[#f0f0f0] px-4 flex items-center gap-1 shrink-0">
        {CATEGORIES.map((cat, ci) => (
          <button key={cat} data-layer-id={`category-tab-${ci}`} onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-2 border-b-2 transition-colors ${activeCategory === cat ? 'border-[#1476ff] text-[#1476ff] font-medium' : 'border-transparent text-[#777] hover:text-[#333]'}`}>
            {cat}
          </button>
        ))}
        <span data-layer-id="items-count" className="ml-auto text-[10px] text-[#aaa]">{filtered.length} 个资产</span>
      </div>

      {/* List */}
      <div data-layer-id="items-list" className="flex-1 overflow-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-xs text-[#bbb]">未找到匹配的资产</div>
        )}
        {filtered.map((item, i) => (
          <div key={item.id} data-layer-id={`list-item-${item.id}`}
            onClick={() => setSelected(selected === item.id ? null : item.id)}
            className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${selected === item.id ? 'border-[#1476ff] shadow-[0_0_0_3px_rgba(20,118,255,0.08)]' : 'border-[#f0f0f0] hover:border-[#d4e0ff] hover:shadow-sm'}`}>
            <div data-layer-id={`list-item-thumb-${item.id}`} className={`w-10 h-8 rounded-lg bg-gradient-to-br ${GRAD_COLORS[i % GRAD_COLORS.length]} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div data-layer-id={`list-item-name-${item.id}`} className="text-xs font-medium text-[#191919] truncate">{item.name}</div>
              <div data-layer-id={`list-item-meta-${item.id}`} className="text-[10px] text-[#999] mt-0.5">{item.category} · {item.owner}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); toggleStar(item.id); }}
              className="text-[#ddd] hover:text-[#f59e0b] transition-colors shrink-0">
              {item.starred
                ? <svg viewBox="0 0 24 24" fill="#f59e0b" width="13" height="13"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              }
            </button>
            <div className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${selected === item.id ? 'bg-[#1476ff] text-white' : 'bg-[#f0f5ff] text-[#1476ff]'}`}>
              {selected === item.id ? '已选' : '查看'}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar when selected */}
      {selected !== null && (
        <div className="bg-white border-t border-[#f0f0f0] px-4 py-2.5 flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#555] flex-1">已选：{items.find(it => it.id === selected)?.name}</span>
          <button onClick={() => setSelected(null)} className="text-[10px] text-[#999] hover:text-[#555] px-2 py-1 rounded-lg border border-[#e5e7eb] transition-colors">取消</button>
          <button className="text-[10px] text-white bg-[#1476ff] hover:bg-[#1060d0] px-3 py-1 rounded-lg transition-colors">引用到需求</button>
        </div>
      )}
    </div>
  );
};

export const ProfileCanvas = () => (
  <div className="w-full h-full bg-[#f8fafc] flex">
    <div className="w-[180px] bg-white border-r border-[#f0f0f0] h-full p-5 flex flex-col items-center gap-3">
      <div data-layer-id="avatar" className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1476ff] to-[#6366f1] flex items-center justify-center">
        <span className="text-white text-xl font-bold">V</span>
      </div>
      <div data-layer-id="user-info" className="text-center">
        <div data-layer-id="user-name" className="text-sm font-semibold text-[#191919]">Vivian Chen</div>
        <div data-layer-id="user-role" className="text-[10px] text-[#777]">UI Designer</div>
      </div>
      <div data-layer-id="profile-nav" className="w-full flex flex-col gap-0.5">
        {['个人信息', '我的项目', '团队', '收藏', '设置'].map((item, i) => (
          <div key={item} data-layer-id={`profile-nav-${i}`} className={`w-full text-xs py-2 px-3 rounded-lg ${i === 0 ? 'bg-[#f0f5ff] text-[#1476ff] font-medium' : 'text-[#555]'}`}>{item}</div>
        ))}
      </div>
    </div>
    <div className="flex-1 p-5">
      <h2 data-layer-id="profile-section-title" className="text-sm font-bold text-[#191919] mb-4">个人信息</h2>
      <div data-layer-id="profile-fields" className="space-y-3">
        {[{ label: '姓名', value: 'Vivian Chen' }, { label: '邮箱', value: 'vivian@company.com' }, { label: '部门', value: '设计中心' }].map(f => (
          <div key={f.label} data-layer-id={`field-${f.label}`} className="flex items-center gap-3">
            <span data-layer-id={`field-label-${f.label}`} className="text-[10px] text-[#aaa] w-16 shrink-0">{f.label}</span>
            <div data-layer-id={`field-value-${f.label}`} className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#191919] bg-white">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CarHomeCanvas = () => {
  const [activeNav, setActiveNav] = useState<string>('首页');
  const [activeModel, setActiveModel] = useState<number>(0);

  const navItems = ['首页', '车型', '技术', '体验', '关于我们'];
  const models = [
    { name: 'AURA S9', tag: '旗舰轿车', range: '820km', power: '580马力', price: '36.98', color: 'from-[#1a1a2e] to-[#16213e]', accent: '#4f9cf9' },
    { name: 'AURA X7', tag: '豪华SUV', range: '710km', power: '450马力', price: '28.98', color: 'from-[#0f2027] to-[#203a43]', accent: '#34d399' },
    { name: 'AURA E5', tag: '智能轿跑', range: '650km', power: '380马力', price: '21.98', color: 'from-[#1a0533] to-[#2d1b69]', accent: '#a78bfa' },
  ];
  const current = models[activeModel];

  const specs = [
    { label: '续航里程', value: current.range },
    { label: '综合功率', value: current.power },
    { label: '百公里加速', value: '2.9s' },
    { label: '最高时速', value: '250km/h' },
  ];

  return (
    <div className="w-full h-full bg-[#0a0a0f] flex flex-col overflow-hidden text-white">
      {/* Nav */}
      <div data-layer-id="nav" className="flex items-center px-6 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-1.5 mr-8">
          <div data-layer-id="brand-icon" className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4f9cf9] to-[#a78bfa] flex items-center justify-center">
            <span className="text-white text-[10px] font-black">A</span>
          </div>
          <span data-layer-id="brand-name" className="text-sm font-bold tracking-widest text-white">AURA</span>
        </div>
        <div className="flex items-center gap-5 flex-1">
          {navItems.map((item, ni) => (
            <button
              key={item}
              data-layer-id={`nav-item-${ni}`}
              onClick={() => setActiveNav(item)}
              className={`text-[10px] transition-colors ${activeNav === item ? 'text-white font-medium' : 'text-white/40 hover:text-white/70'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button data-layer-id="test-drive-btn" className="text-[10px] text-white/50 hover:text-white/80 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors">预约试驾</button>
          <button data-layer-id="buy-btn" className="text-[10px] text-white bg-gradient-to-r from-[#4f9cf9] to-[#a78bfa] px-3 py-1.5 rounded-full font-medium">立即购车</button>
        </div>
      </div>

      {/* Hero */}
      <div data-layer-id="hero" className={`relative flex-1 flex flex-col overflow-hidden bg-gradient-to-br ${current.color} transition-colors duration-700`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full blur-[80px] opacity-20" style={{ background: current.accent }} />
        </div>

        {/* Car silhouette area */}
        <div className="flex-1 flex items-center justify-center relative px-6 pt-4">
          <div className="relative w-full max-w-[420px]">
            {/* Car mock shape */}
            <div className="relative mx-auto w-[320px] h-[120px]">
              {/* Body */}
              <div className="absolute bottom-0 left-0 right-0 h-[55px] rounded-[40px_40px_8px_8px] opacity-90" style={{ background: `linear-gradient(135deg, ${current.accent}33, ${current.accent}11)`, border: `1px solid ${current.accent}40` }} />
              {/* Roof */}
              <div className="absolute bottom-[50px] left-[60px] right-[60px] h-[55px] rounded-t-[50px] opacity-80" style={{ background: `linear-gradient(135deg, ${current.accent}22, ${current.accent}08)`, border: `1px solid ${current.accent}30`, borderBottom: 'none' }} />
              {/* Windshield shine */}
              <div className="absolute bottom-[60px] left-[90px] w-[80px] h-[35px] rounded-t-[30px] opacity-40" style={{ background: `linear-gradient(160deg, white, transparent)` }} />
              {/* Wheels */}
              <div className="absolute bottom-[-8px] left-[50px] w-[44px] h-[44px] rounded-full border-[3px]" style={{ borderColor: current.accent + '60', background: '#0a0a0f' }}>
                <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${current.accent}40 0deg, transparent 60deg, ${current.accent}40 120deg, transparent 180deg, ${current.accent}40 240deg, transparent 300deg, ${current.accent}40 360deg)` }} />
              </div>
              <div className="absolute bottom-[-8px] right-[50px] w-[44px] h-[44px] rounded-full border-[3px]" style={{ borderColor: current.accent + '60', background: '#0a0a0f' }}>
                <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${current.accent}40 0deg, transparent 60deg, ${current.accent}40 120deg, transparent 180deg, ${current.accent}40 240deg, transparent 300deg, ${current.accent}40 360deg)` }} />
              </div>
              {/* Ground reflection */}
              <div className="absolute bottom-[-18px] left-[10%] right-[10%] h-[8px] rounded-full blur-sm opacity-30" style={{ background: current.accent }} />
            </div>

            {/* Model name */}
            <div className="text-center mt-6">
              <div className="text-[10px] tracking-[0.3em] text-white/40 mb-1">{current.tag}</div>
              <h1 data-layer-id="model-name" className="text-3xl font-black tracking-widest" style={{ color: 'white', textShadow: `0 0 40px ${current.accent}80` }}>{current.name}</h1>
              <p className="text-[10px] text-white/30 mt-1">重新定义驾驶体验</p>
            </div>
          </div>
        </div>

        {/* Specs bar */}
        <div className="px-6 pb-3 shrink-0">
          <div data-layer-id="specs-grid" className="grid grid-cols-4 gap-2 mb-3">
            {specs.map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: `${current.accent}10`, border: `1px solid ${current.accent}20` }}>
                <div className="text-sm font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA + Price */}
          <div data-layer-id="cta-area" className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] text-white/30">起售价</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[10px] text-white/60">¥</span>
                <span className="text-lg font-black text-white">{current.price}</span>
                <span className="text-[10px] text-white/40">万</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-[10px] px-4 py-2 rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors">了解详情</button>
              <button className="text-[10px] px-4 py-2 rounded-full font-semibold text-white transition-colors" style={{ background: `linear-gradient(135deg, ${current.accent}, ${current.accent}aa)`, boxShadow: `0 4px 16px ${current.accent}40` }}>预约试驾</button>
            </div>
          </div>
        </div>

        {/* Model switcher */}
        <div data-layer-id="model-switcher" className="flex items-center justify-center gap-3 pb-3 shrink-0">
          {models.map((m, i) => (
            <button
              key={m.name}
              onClick={() => setActiveModel(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-[10px] ${activeModel === i ? 'text-white font-medium' : 'text-white/30 hover:text-white/60'}`}
              style={activeModel === i ? { background: `${m.accent}20`, border: `1px solid ${m.accent}40` } : { border: '1px solid transparent' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeModel === i ? m.accent : '#444' }} />
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CANVAS_MAP: Record<CanvasType, React.FC> = {
  login: InteractiveLoginDemo,
  dashboard: DashboardCanvas,
  detail: DetailCanvas,
  form: FormCanvas,
  list: ListCanvas,
  profile: ProfileCanvas,
  'car-home': CarHomeCanvas,
};
