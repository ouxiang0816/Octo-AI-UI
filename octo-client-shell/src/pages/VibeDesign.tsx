/**
 * Vibe Design — AI 对话式 Demo 生成工具
 * 左侧：4 页签（主对话 / 资产库 / 用研文档 / 技能社区）
 * 右侧：画布预览区（含规范选择器）
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  ArrowLeft, Send, Sparkles, Share2, Upload,
  Minus, Plus, Maximize2, Layers, Package, Image as ImageIcon,
  FileText, Smile, Zap, Check, Paperclip,
  X, ChevronDown, Monitor, Tablet, Smartphone, RotateCcw,
  Search, BookOpen, Cpu, FolderOpen, Link, Copy,
  MessageSquare, LayoutGrid, FlaskConical, Palette,
  BarChart2, Moon, Code, Hash, AtSign,
  Globe, MoreHorizontal, UserPlus, History, AlertTriangle, Shield, Lock,
  Wand2, Scissors, Paintbrush, Expand, Pencil,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { savePublished, saveCollab, pushLiveUpdate, getLiveKey, generateId } from '../features/vibe/storage';
import { CANVAS_MAP as CANVAS_MAP_SHARED, InteractiveLoginDemo } from '../features/vibe/canvases';
import { BeamsBackground } from '../features/vibe/BeamsBackground';
import { INITIAL_SKILLS as INITIAL_SKILLS_DATA, DESIGN_SPECS as DESIGN_SPECS_DATA, PERSONAL_ASSETS, PLATFORM_ASSETS } from '../features/vibe/mock-data';
import {
  MentionPanel as MentionPanelV2,
  AssetsTab as AssetsTabV2,
  ResearchTab as ResearchTabV2,
  SkillsTab as SkillsTabV2,
  SkillMarketModal,
  ReferenceDrawer,
} from '../features/vibe/panels';
import {
  PixImportModal as PixImportModalV2,
  PublishModal as PublishModalV2,
  SharePanel as SharePanelV2,
} from '../features/vibe/modals';
import {
  inferCanvasType as inferCanvasTypeV2,
  inferPageName as inferPageNameV2,
  VIEWPORT_SIZES as VIEWPORT_SIZES_V2,
} from '../features/vibe/utils';
import type { AssetRecord } from '../features/vibe/types';
import aiCardImg from '../assets/previews/AI卡片.jpg';
import controlImg from '../assets/previews/控制台.jpg';
import home3Img from '../assets/previews/官网首页3.jpg';
import homeWebpImg from '../assets/previews/官网首页.webp';
import home2Img from '../assets/previews/官网首页2.webp';
import gradientBtnImg from '../assets/previews/渐变按钮.jpg';

// ─── Types ────────────────────────────────────────────────────────────────────
type MsgRole = 'ai' | 'user';
type LeftTab = 'chat' | 'assets' | 'research' | 'skills';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type CanvasType = 'login' | 'dashboard' | 'detail' | 'form' | 'list' | 'profile' | 'car-home';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'pix' | 'mention';
}

interface Msg {
  id: string;
  role: MsgRole;
  text: string;
  attachments?: Attachment[];
  referencedAssets?: AssetRecord[];
  pages?: GeneratedPage[];
  thinking?: boolean;
  thinkingLines?: string[];
  thinkingDone?: boolean;
  prdCard?: { title: string; content: string };
}

interface GeneratedPage {
  id: string;
  name: string;
  canvasType: CanvasType;
}

interface CanvasVersion {
  id: string;
  page: GeneratedPage;
  prompt: string;
  spec: string;
  createdAt: number;
}

interface ResearchDoc {
  id: string;
  type: 'journey' | 'cj' | 'report' | 'competitor' | 'interview' | 'persona';
  title: string;
  author: string;
  updatedAt: string;
}

interface Skill {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  icon: React.FC<{ size?: number; className?: string }>;
  category?: string;
  official?: boolean;
}

type RefDrawerItem =
  | { kind: 'doc'; doc: ResearchDoc }
  | { kind: 'component'; name: string }
  | { kind: 'illustration'; name: string; color: string }
  | { kind: 'asset'; asset: AssetRecord };

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ASSET_SECTIONS = [
  {
    id: 'icons', label: '图标库', count: 1240,
    items: [
      { name: 'Home', icon: '⊞' }, { name: 'Search', icon: '⌕' },
      { name: 'User', icon: '◯' }, { name: 'Bell', icon: '◻' },
      { name: 'Star', icon: '☆' }, { name: 'Heart', icon: '♡' },
      { name: 'Share', icon: '↗' }, { name: 'Edit', icon: '✎' },
      { name: 'Delete', icon: '⌫' }, { name: 'Add', icon: '+' },
      { name: 'Filter', icon: '≡' }, { name: 'Sort', icon: '↕' },
    ],
  },
  {
    id: 'illustrations', label: '插画库', count: 86,
    items: [
      { name: '空状态', color: 'from-[#e8f0fe] to-[#c7d7fb]' },
      { name: '成功提示', color: 'from-[#d1fae5] to-[#a7f3d0]' },
      { name: '错误页面', color: 'from-[#fee2e2] to-[#fca5a5]' },
      { name: '欢迎引导', color: 'from-[#fef3c7] to-[#fde68a]' },
      { name: '加载中', color: 'from-[#f3e8ff] to-[#d8b4fe]' },
      { name: '权限限制', color: 'from-[#f1f5f9] to-[#e2e8f0]' },
    ],
  },
  {
    id: 'components', label: '组件库', count: 320,
    items: [
      { name: 'Button', preview: 'bg' }, { name: 'Input', preview: 'in' },
      { name: 'Modal', preview: 'md' }, { name: 'Card', preview: 'cd' },
      { name: 'Table', preview: 'tb' }, { name: 'Badge', preview: 'bg' },
      { name: 'Tabs', preview: 'ts' }, { name: 'Toast', preview: 'tt' },
    ],
  },
];

const RESEARCH_DOCS: ResearchDoc[] = [
  { id: 'r1', type: 'journey', title: '电商购物用户旅程图', author: 'Vivian', updatedAt: '3天前' },
  { id: 'r2', type: 'cj', title: '新用户 CJ 图（注册→首购）', author: 'Tom', updatedAt: '1周前' },
  { id: 'r3', type: 'report', title: '结账流程可用性测试报告', author: 'Alex', updatedAt: '2周前' },
  { id: 'r4', type: 'competitor', title: '竞品功能横向对比分析', author: 'Jackson', updatedAt: '1月前' },
  { id: 'r5', type: 'interview', title: '用户深度访谈摘要 Q1', author: 'Lisa', updatedAt: '1月前' },
  { id: 'r6', type: 'persona', title: '核心用户画像（3 类）', author: 'Vivian', updatedAt: '2月前' },
];

const INITIAL_SKILLS: Skill[] = [
  { id: 's1', name: '数据可视化', desc: '自动生成图表、数据看板组件', enabled: true, icon: BarChart2 },
  { id: 's2', name: '表单生成', desc: '根据字段描述生成完整表单布局', enabled: true, icon: FileText },
  { id: 's3', name: '导航生成', desc: '自动生成侧边栏与顶部导航结构', enabled: true, icon: Layers },
  { id: 's4', name: '响应式布局', desc: '自动适配桌面端、平板、移动端', enabled: true, icon: Monitor },
  { id: 's5', name: '代码同步输出', desc: '生成 Demo 同步输出 React/Vue 代码', enabled: false, icon: Code },
  { id: 's6', name: '暗色主题', desc: '支持生成对应的暗色模式版本', enabled: false, icon: Moon },
  { id: 's7', name: '动效设计', desc: '为界面关键节点添加过渡动效', enabled: false, icon: Zap },
  { id: 's8', name: 'A11y 检查', desc: '可访问性自动检查并给出改进建议', enabled: false, icon: Globe },
];

const DESIGN_SPECS = [
  '企业设计规范 v2.0',
  'Material Design 3',
  'iOS HIG',
  'Ant Design 5',
  '无规范约束',
];

const DOC_TYPE_META: Record<ResearchDoc['type'], { label: string; color: string; bg: string }> = {
  journey: { label: '旅程图', color: '#1476ff', bg: '#f0f5ff' },
  cj: { label: 'CJ 图', color: '#7c3aed', bg: '#f5f3ff' },
  report: { label: '可用性报告', color: '#d97706', bg: '#fffbeb' },
  competitor: { label: '竞品分析', color: '#059669', bg: '#f0fdf4' },
  interview: { label: '用户访谈', color: '#db2777', bg: '#fdf2f8' },
  persona: { label: '用户画像', color: '#0891b2', bg: '#f0fdfa' },
};

// Use shared canvas map from ./vibe/canvases
const CANVAS_MAP: typeof CANVAS_MAP_SHARED = CANVAS_MAP_SHARED;

// ─── Canvas inference ──────────────────────────────────────────────────────────
function inferCanvasType(text: string): CanvasType {
  const t = text.toLowerCase();
  if (/登录|注册|login|sign\s*in|密码/.test(t)) return 'login';
  if (/首页|仪表盘|dashboard|概览|数据|统计/.test(t)) return 'dashboard';
  if (/详情|信息|资产|设计参数|规范/.test(t)) return 'detail';
  if (/表单|填写|提交|申请|form/.test(t)) return 'form';
  if (/列表|搜索|查询|list|search/.test(t)) return 'list';
  if (/个人|用户|头像|profile/.test(t)) return 'profile';
  return 'dashboard';
}

function inferPageName(text: string): string {
  const t = text.toLowerCase();
  if (/登录/.test(t)) return '登录页';
  if (/注册/.test(t)) return '注册页';
  if (/首页|概览/.test(t)) return '首页';
  if (/仪表盘|dashboard/.test(t)) return '仪表盘';
  if (/详情/.test(t)) return '详情页';
  if (/列表/.test(t)) return '列表页';
  if (/搜索/.test(t)) return '搜索页';
  if (/个人|profile/.test(t)) return '个人中心';
  if (/表单|填写/.test(t)) return '表单页';
  return 'Demo 页面';
}

// ─── Canvas mock components (inlined for fallback; CANVAS_MAP uses shared versions) ────
const LoginCanvas = () => (
  <div className="w-full h-full bg-white flex items-center justify-center">
    <div className="w-[320px] space-y-5">
      <div className="text-center space-y-1">
        <div className="w-10 h-10 rounded-xl bg-[#1476ff] flex items-center justify-center mx-auto mb-3">
          <Sparkles size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-semibold text-[#191919]">欢迎回来</h2>
        <p className="text-xs text-[#777]">请登录您的账号</p>
      </div>
      <div className="space-y-3">
        <div><label className="block text-xs text-[#555] mb-1">邮箱</label>
          <div className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#191919] bg-[#fafafa]">design@company.com</div></div>
        <div><label className="block text-xs text-[#555] mb-1">密码</label>
          <div className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#999] bg-[#fafafa]">••••••••</div></div>
      </div>
      <button className="w-full bg-[#1476ff] text-white text-sm py-2.5 rounded-lg font-medium shadow-[0_2px_8px_rgba(20,118,255,0.3)]">登录</button>
      <div className="flex items-center gap-3"><div className="flex-1 h-px bg-[#f0f0f0]" /><span className="text-xs text-[#aaa]">或</span><div className="flex-1 h-px bg-[#f0f0f0]" /></div>
      <button className="w-full border border-[#e5e7eb] text-sm py-2.5 rounded-lg text-[#191919] flex items-center justify-center gap-2">
        <div className="w-4 h-4 rounded-full bg-[#ea4335]" />Google 账号登录
      </button>
    </div>
  </div>
);

const DashboardCanvas = () => (
  <div className="w-full h-full bg-[#f8fafc] flex">
    <div className="w-[150px] bg-white border-r border-[#f0f0f0] flex flex-col py-4 shrink-0">
      <div className="px-4 mb-5"><div className="w-7 h-7 rounded-lg bg-[#1476ff] flex items-center justify-center"><Sparkles size={14} className="text-white" /></div></div>
      {['概览', '项目', '团队', '资产库', '设置'].map((item, i) => (
        <div key={item} className={`px-4 py-2 text-xs flex items-center gap-2 ${i === 0 ? 'text-[#1476ff] bg-[#f0f5ff] font-medium' : 'text-[#555]'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#1476ff]' : 'bg-[#ddd]'}`} />{item}
        </div>
      ))}
    </div>
    <div className="flex-1 p-5 overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-sm font-bold text-[#191919]">项目概览</h1>
        <span className="text-xs text-[#777]">2026 / 03</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{ label: '进行中', value: '12', color: '#1476ff' }, { label: '待评审', value: '5', color: '#f59e0b' }, { label: '本月交付', value: '28', color: '#10b981' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 border border-[#f0f0f0]">
            <div className="text-[10px] text-[#777] mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#f0f0f0] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#f5f5f5] flex justify-between"><span className="text-xs font-medium text-[#191919]">最近项目</span><span className="text-[10px] text-[#1476ff]">查看全部</span></div>
        {['登录体验优化', '首页改版 v3', '设计规范 2.0'].map((name, i) => (
          <div key={name} className="px-4 py-2.5 flex items-center gap-3 border-b border-[#f9f9f9] last:border-0">
            <div className="w-5 h-5 rounded bg-[#e8f0fe] flex items-center justify-center"><Layers size={10} className="text-[#1476ff]" /></div>
            <span className="text-xs text-[#191919] flex-1">{name}</span>
            <div className={`text-[10px] px-2 py-0.5 rounded-full ${['bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-green-50 text-green-600'][i]}`}>{['进行中', '评审中', '已完成'][i]}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DetailCanvas = () => (
  <div className="w-full h-full bg-white flex flex-col">
    <div className="border-b border-[#f0f0f0] px-5 py-3 flex items-center gap-3">
      <span className="text-xs font-medium text-[#191919] flex-1">设计详情</span>
      <button className="text-[10px] text-white bg-[#1476ff] px-3 py-1 rounded-full">发布</button>
    </div>
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 p-5">
        <div className="rounded-xl bg-gradient-to-br from-[#1476ff] to-[#6366f1] aspect-[16/9] w-full mb-4 flex items-center justify-center">
          <span className="text-white text-sm opacity-70">设计预览</span>
        </div>
        <h2 className="text-sm font-semibold text-[#191919] mb-1">登录体验优化 v2.1</h2>
        <p className="text-xs text-[#777] leading-relaxed mb-3">优化了登录流程，简化了表单步骤，提升了视觉一致性。</p>
        <div className="flex gap-2">{['登录', 'UI优化', '表单设计'].map(tag => <span key={tag} className="text-[10px] bg-[#f0f5ff] text-[#1476ff] px-2 py-0.5 rounded-full">{tag}</span>)}</div>
      </div>
      <div className="w-[160px] border-l border-[#f5f5f5] p-4 shrink-0">
        <div className="text-[10px] text-[#777] mb-3 font-medium uppercase tracking-wide">设计参数</div>
        {[{ label: '主色', value: '#1476FF' }, { label: '字体', value: 'PingFang SC' }, { label: '圆角', value: '8px / 16px' }].map(p => (
          <div key={p.label} className="mb-2.5"><div className="text-[10px] text-[#aaa]">{p.label}</div><div className="text-[10px] text-[#191919] font-medium">{p.value}</div></div>
        ))}
      </div>
    </div>
  </div>
);

const FormCanvas = () => (
  <div className="w-full h-full bg-[#f8fafc] flex items-center justify-center">
    <div className="w-[400px] bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-6 space-y-4">
      <h2 className="text-sm font-bold text-[#191919]">新增需求</h2>
      {[{ label: '需求名称', placeholder: '请输入需求名称' }, { label: '负责人', placeholder: '请选择负责人' }, { label: '交付时间', placeholder: '2026-04-01' }].map(f => (
        <div key={f.label}><label className="block text-xs text-[#555] mb-1">{f.label}</label><div className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#aaa] bg-[#fafafa]">{f.placeholder}</div></div>
      ))}
      <div className="flex gap-2 pt-2"><button className="flex-1 bg-[#1476ff] text-white text-sm py-2 rounded-lg font-medium">提交</button><button className="flex-1 border border-[#e5e7eb] text-sm py-2 rounded-lg text-[#555]">取消</button></div>
    </div>
  </div>
);

const ListCanvas = () => (
  <div className="w-full h-full bg-[#f8fafc] flex flex-col">
    <div className="bg-white border-b border-[#f0f0f0] px-5 py-3 flex items-center gap-3">
      <div className="flex-1 relative"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" /><div className="border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-2 text-xs text-[#aaa] bg-[#fafafa]">搜索资产名称、标签...</div></div>
      <button className="bg-[#1476ff] text-white text-xs px-3 py-2 rounded-lg">筛选</button>
    </div>
    <div className="flex-1 overflow-auto p-4 space-y-2">
      {['AI功能 Toolbar', 'Dashboard 图表', '天气卡片', '官网首页', '渐变按钮'].map((name, i) => (
        <div key={name} className="bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-[#e8f0fe] to-[#f0f5ff] shrink-0" />
          <div className="flex-1 min-w-0"><div className="text-xs font-medium text-[#191919] truncate">{name}</div><div className="text-[10px] text-[#999] mt-0.5">组件库 · {['Vivian', 'Tom', 'Alex', 'Jackson', 'Lisa'][i]}</div></div>
          <div className="text-[10px] text-[#1476ff] bg-[#f0f5ff] px-2 py-0.5 rounded-full">查看</div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileCanvas = () => (
  <div className="w-full h-full bg-[#f8fafc] flex">
    <div className="w-[180px] bg-white border-r border-[#f0f0f0] h-full p-5 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1476ff] to-[#6366f1] flex items-center justify-center"><span className="text-white text-xl font-bold">V</span></div>
      <div className="text-center"><div className="text-sm font-semibold text-[#191919]">Vivian Chen</div><div className="text-[10px] text-[#777]">UI Designer</div></div>
      {['个人信息', '我的项目', '团队', '收藏', '设置'].map((item, i) => <div key={item} className={`w-full text-xs py-2 px-3 rounded-lg ${i === 0 ? 'bg-[#f0f5ff] text-[#1476ff] font-medium' : 'text-[#555]'}`}>{item}</div>)}
    </div>
    <div className="flex-1 p-5">
      <h2 className="text-sm font-bold text-[#191919] mb-4">个人信息</h2>
      <div className="space-y-3">{[{ label: '姓名', value: 'Vivian Chen' }, { label: '邮箱', value: 'vivian@company.com' }, { label: '部门', value: '设计中心' }].map(f => (<div key={f.label} className="flex items-center gap-3"><span className="text-[10px] text-[#aaa] w-16 shrink-0">{f.label}</span><div className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#191919] bg-white">{f.value}</div></div>))}</div>
    </div>
  </div>
);

// (CANVAS_MAP is defined above using shared canvases)

// ─── @ Mention Panel (3 tabs) ──────────────────────────────────────────────────
type MentionTab = 'assets' | 'research' | 'skills';

interface MentionPanelProps {
  mentionQuery: string;
  skills: Skill[];
  onToggleSkill: (id: string) => void;
  onInsertAsset: (text: string) => void;  // assets → text inserted into textarea
  onInsertMention: (name: string) => void; // docs/skills → become chips
  onSelectDoc: (doc: ResearchDoc) => void;
  onClose: () => void;
}

const MentionPanel: React.FC<MentionPanelProps> = ({
  mentionQuery, skills, onToggleSkill, onInsertAsset, onInsertMention, onSelectDoc, onClose,
}) => {
  const [tab, setTab] = useState<MentionTab>('research');

  const filteredDocs = RESEARCH_DOCS.filter(d =>
    d.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const MENTION_TABS: { id: MentionTab; label: string }[] = [
    { id: 'research', label: '用研文档' },
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
      {/* Header */}
      <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AtSign size={10} className="text-[#1476ff]" />
          <span className="text-[10px] font-medium text-[#555]">引用内容</span>
          {mentionQuery && <span className="text-[10px] text-[#bbb]">· {mentionQuery}</span>}
        </div>
        <button onClick={onClose} className="text-[#ccc] hover:text-[#555] transition-colors"><X size={12} /></button>
      </div>

      {/* Tab bar */}
      <div className="flex px-3 pt-2 gap-1">
        {MENTION_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${tab === t.id ? 'bg-[#f0f5ff] text-[#1476ff] font-medium' : 'text-[#777] hover:bg-[#f5f6f7]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 240 }}>

        {/* 用研文档 */}
        {tab === 'research' && (
          <div className="px-2 py-2 space-y-0.5">
            {filteredDocs.length === 0 && (
              <p className="text-[10px] text-[#bbb] text-center py-4">无匹配文档</p>
            )}
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

        {/* 资产库 */}
        {tab === 'assets' && (
          <div className="px-3 py-2 space-y-3">
            {ASSET_SECTIONS.map(section => (
              <div key={section.id}>
                <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5">{section.label}</p>
                {section.id === 'icons' && (
                  <div className="grid grid-cols-6 gap-1">
                    {(section.items as { name: string; icon: string }[]).map(item => (
                      <button key={item.name} onClick={() => onInsertAsset(`[图标:${item.name}]`)}
                        title={item.name}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-[#f0f5ff] transition-colors group">
                        <div className="w-7 h-7 bg-[#f5f6f7] rounded-lg flex items-center justify-center text-[#555] text-sm group-hover:bg-white group-hover:text-[#1476ff] transition-colors">
                          {item.icon}
                        </div>
                        <span className="text-[10px] text-[#bbb] truncate w-full text-center">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {section.id === 'illustrations' && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {(section.items as { name: string; color: string }[]).map(item => (
                      <button key={item.name} onClick={() => onInsertAsset(`[插画:${item.name}]`)}
                        className="flex flex-col items-center gap-1 group">
                        <div className={`w-full aspect-[4/3] rounded-lg bg-gradient-to-br ${item.color} group-hover:scale-[1.04] transition-transform`} />
                        <span className="text-[10px] text-[#777]">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {section.id === 'components' && (
                  <div className="grid grid-cols-6 gap-1">
                    {(section.items as { name: string; preview: string }[]).map(item => (
                      <button key={item.name} onClick={() => onInsertAsset(`[组件:${item.name}]`)}
                        title={item.name}
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

        {/* 技能社区 — click to insert @skill reference */}
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
                      {skill.enabled && (
                        <span className="text-[10px] bg-[#f0fdf4] text-[#10b981] px-1 py-0.5 rounded font-medium">已启用</span>
                      )}
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

// ─── Pix Import Modal ──────────────────────────────────────────────────────────
interface PixImportModalProps {
  onClose: () => void;
  onImport: (name: string) => void;
}
const PixImportModal: React.FC<PixImportModalProps> = ({ onClose, onImport }) => {
  const [tab, setTab] = useState<'code' | 'url'>('code');
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');

  const handleConfirm = () => {
    const value = tab === 'code' ? code.trim() : url.trim();
    if (!value) return;
    const name = tab === 'code' ? `传送码:${value}.pix` : `导入设计.pix`;
    onImport(name);
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

          {/* Tabs */}
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
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="例如：ABCD-1234-EFGH"
                autoFocus
                className="w-full border border-[rgba(25,25,25,0.12)] rounded-xl px-3 py-2.5 text-sm text-[#191919] placeholder:text-[#ccc] outline-none focus:border-[#1476ff] font-mono tracking-wider"
              />
              <p className="text-[10px] text-[#ccc]">传送码有效期 24 小时，每次生成唯一</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-[#aaa]">粘贴 Pix 设计文件的共享链接</p>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://pix.design/share/..."
                autoFocus
                className="w-full border border-[rgba(25,25,25,0.12)] rounded-xl px-3 py-2.5 text-sm text-[#191919] placeholder:text-[#ccc] outline-none focus:border-[#1476ff]"
              />
              <p className="text-[10px] text-[#ccc]">仅支持 pix.design 共享链接</p>
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 border border-[rgba(25,25,25,0.12)] text-sm py-2.5 rounded-xl text-[#555] hover:bg-[#f8fafc] transition-colors">取消</button>
            <button onClick={handleConfirm}
              disabled={tab === 'code' ? !code.trim() : !url.trim()}
              className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-colors ${(tab === 'code' ? code.trim() : url.trim()) ? 'bg-[#1476ff] text-white hover:bg-[#1060d0]' : 'bg-[#f0f0f0] text-[#bbb] cursor-not-allowed'}`}>
              导入
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── AnimatedDots ──────────────────────────────────────────────────────────────
const AnimatedDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    {[0, 1, 2].map(i => (
      <motion.span key={i} className="w-1 h-1 rounded-full bg-current inline-block"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
    ))}
  </span>
);

// ─── Assets Tab ────────────────────────────────────────────────────────────────
const AssetsTab = ({ onInsert }: { onInsert: (text: string) => void }) => {
  const [search, setSearch] = useState('');
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索资产..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f5f6f7] rounded-lg text-[#191919] placeholder:text-[#bbb] outline-none"
          />
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
                    <div className="w-8 h-8 bg-[#f5f6f7] rounded-lg flex items-center justify-center text-[#555] text-sm group-hover:bg-white group-hover:text-[#1476ff] group-hover:shadow-sm transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-[#999] truncate w-full text-center">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
            {section.id === 'illustrations' && (
              <div className="grid grid-cols-3 gap-2">
                {(section.items as { name: string; color: string }[]).map(item => (
                  <button key={item.name} onClick={() => onInsert(`[插画:${item.name}]`)}
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
                  <button key={item.name} onClick={() => onInsert(`[组件:${item.name}]`)}
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

// ─── Research Tab ──────────────────────────────────────────────────────────────
const ResearchTab = ({ onInsert }: { onInsert: (text: string) => void }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0">
      <p className="text-[10px] text-[#999]">在对话框中输入 <span className="font-mono bg-[#f5f6f7] px-1 rounded text-[#555]">@</span> 可快速引用文档</p>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {RESEARCH_DOCS.map(doc => {
        const meta = DOC_TYPE_META[doc.type];
        return (
          <div key={doc.id} className="bg-white border border-[rgba(25,25,25,0.08)] rounded-xl p-3 hover:border-[#d4e0ff] hover:shadow-sm transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                </div>
                <p className="text-xs font-medium text-[#191919] leading-snug mb-1">{doc.title}</p>
                <p className="text-[10px] text-[#aaa]">{doc.author} · {doc.updatedAt}</p>
              </div>
              <button onClick={() => onInsert(`@${doc.title} `)}
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

// ─── Skills Tab ────────────────────────────────────────────────────────────────
const SkillsTab = ({ skills, onToggle }: { skills: Skill[]; onToggle: (id: string) => void }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b border-[rgba(25,25,25,0.06)] shrink-0">
      <p className="text-[10px] text-[#999]">已装载 {skills.filter(s => s.enabled).length} 个技能 · 共 {skills.length} 个</p>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {skills.map(skill => {
        const Icon = skill.icon;
        return (
          <div key={skill.id} className="flex items-center gap-3 bg-white border border-[rgba(25,25,25,0.08)] rounded-xl px-3 py-3 hover:border-[rgba(25,25,25,0.12)] transition-colors">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${skill.enabled ? 'bg-[#f0f5ff]' : 'bg-[#f5f6f7]'}`}>
              <Icon size={14} className={skill.enabled ? 'text-[#1476ff]' : 'text-[#bbb]'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#191919]">{skill.name}</p>
              <p className="text-[10px] text-[#aaa] mt-0.5">{skill.desc}</p>
            </div>
            <button onClick={() => onToggle(skill.id)} className="shrink-0">
              <div className={`w-[26px] h-[14px] rounded-full flex items-center transition-colors duration-200 px-[2px] ${skill.enabled ? 'bg-[#1476ff]' : 'bg-[#d0d3d9]'}`}>
                <div className={`w-[10px] h-[10px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ${skill.enabled ? 'translate-x-[12px]' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Publish Modal ─────────────────────────────────────────────────────────────
interface PublishModalProps {
  onClose: () => void;
  pages: GeneratedPage[];
  spec: string;
  title: string;
  onPublished?: (url: string, at: number) => void;
}
const PublishModal: React.FC<PublishModalProps> = ({ onClose, pages, spec, title, onPublished }) => {
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
    const ts = Date.now();
    onPublished?.(url, ts);
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
          <>
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
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─── Share Panel ───────────────────────────────────────────────────────────────
interface SharePanelProps {
  onClose: () => void;
  pages: GeneratedPage[];
  spec: string;
  title: string;
  existingCollabId?: string;
  onCollabIdCreated?: (id: string) => void;
}

const SharePanel: React.FC<SharePanelProps> = ({ onClose, pages, spec, title, existingCollabId, onCollabIdCreated }) => {
  const [copied, setCopied] = useState(false);
  const [copiedOpen, setCopiedOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  // Generate or reuse the collab session ID, save once on mount
  const [collabSessionId] = useState(() => {
    const id = existingCollabId ?? generateId();
    saveCollab(id, {
      id, title, spec, pages,
      activePageId: pages[0]?.id ?? null,
      publishedAt: Date.now(),
      owner: 'Vivian Chen',
      collaborators: [],
    });
    pushLiveUpdate(id, {
      title, spec, pages,
      activePageId: pages[0]?.id ?? null,
      owner: 'Vivian Chen',
      collaborators: [],
    });
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
    if (trimmed && !invitedEmails.includes(trimmed)) {
      setInvitedEmails(prev => [...prev, trimmed]);
    }
    setEmail('');
  };

  const collaborators = [
    { name: 'Vivian Chen', role: '所有者', initial: 'V', color: '#1476ff' },
    ...invitedEmails.map((e, i) => ({
      name: e, role: '编辑者',
      initial: e.charAt(0).toUpperCase(),
      color: ['#7c3aed', '#059669', '#d97706', '#db2777'][i % 4],
    })),
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

          {/* Invite by email */}
          <div className="flex gap-2 mb-5">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              placeholder="输入邮箱邀请协作者..."
              className="flex-1 border border-[rgba(25,25,25,0.12)] rounded-xl px-3 py-2 text-xs text-[#191919] placeholder:text-[#bbb] outline-none focus:border-[#1476ff]"
            />
            <button onClick={handleInvite}
              className="bg-[#1476ff] text-white text-xs px-4 py-2 rounded-xl hover:bg-[#1060d0] transition-colors whitespace-nowrap flex items-center gap-1.5">
              <UserPlus size={12} /> 邀请
            </button>
          </div>

          {/* Collaborators list */}
          <div className="mb-5">
            <p className="text-[10px] text-[#aaa] mb-2.5">当前协作者 · {collaborators.length} 人</p>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {collaborators.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: c.color }}>
                    {c.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#191919]">{c.name}</p>
                    <p className="text-[10px] text-[#aaa]">{c.role}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${c.role === '所有者' ? 'border-[#d4e0ff] text-[#1476ff] bg-[#f0f5ff]' : 'border-[rgba(25,25,25,0.1)] text-[#777]'}`}>{c.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Invite link */}
          <div className="border-t border-[rgba(25,25,25,0.06)] pt-4 space-y-2">
            <p className="text-[10px] text-[#aaa]">协作链接（粘贴到浏览器即可加入）</p>
            <div className="bg-[#f8fafc] border border-[rgba(25,25,25,0.07)] rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Link size={12} className="text-[#aaa] shrink-0" />
              <span className="text-[10px] text-[#555] flex-1 truncate font-mono">{inviteUrl}</span>
              <button onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-[#f0fdf4] text-[#10b981]' : 'bg-[#f5f6f7] text-[#555] hover:bg-[#eee]'}`}>
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

// ─── Viewport sizes ────────────────────────────────────────────────────────────
const VIEWPORT_SIZES: Record<ViewportMode, { w: number; h: number; label: string }> = {
  desktop: { w: 900, h: 600, label: '桌面端' },
  tablet: { w: 640, h: 480, label: '平板端' },
  mobile: { w: 375, h: 667, label: '移动端' },
};

// ─── Main Component ────────────────────────────────────────────────────────────
interface VibeDesignProps {
  onClose: () => void;
  onToast: (msg: string) => void;
  /** Set when entering via a collab link */
  collabId?: string;
  isCollaborator?: boolean;
  initialPages?: GeneratedPage[];
  initialSpec?: string;
}

const LEFT_TABS: { id: LeftTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'chat', label: '主对话', icon: MessageSquare },
  { id: 'assets', label: '资产库', icon: LayoutGrid },
  { id: 'research', label: '用研文档', icon: BookOpen },
  { id: 'skills', label: '技能社区', icon: FlaskConical },
];

export const VibeDesign: React.FC<VibeDesignProps> = ({
  onClose, onToast,
  collabId: initCollabId, isCollaborator = false,
  initialPages = [], initialSpec,
}) => {
  const [leftTab, setLeftTab] = useState<LeftTab>('chat');
  const [messages, setMessages] = useState<Msg[]>([{
    id: 'init', role: 'ai',
    text: isCollaborator
      ? '你已加入协作项目。可以继续描述需求，画布修改将实时同步给所有协作者。\n\n输入 @ 可快速引用用研文档，也可以上传参考图或 .pix 文件。'
      : '你好！我是 Vibe Design AI。\n\n描述你想生成的界面，我会结合企业组件库、图标和设计规范快速生成 Demo 方案。\n\n输入 @ 可快速引用用研文档，也可以上传参考图或 .pix 文件。',
  }]);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [personalAssets, setPersonalAssets] = useState<AssetRecord[]>(PERSONAL_ASSETS);
  const [referencedAssets, setReferencedAssets] = useState<AssetRecord[]>([]);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>(initialPages);
  const [activePage, setActivePage] = useState<GeneratedPage | null>(initialPages[0] ?? null);
  const [zoom, setZoom] = useState(100);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [selectedSpec, setSelectedSpec] = useState(initialSpec ?? DESIGN_SPECS_DATA[0]);
  const [showSpecMenu, setShowSpecMenu] = useState(false);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS_DATA);
  const [showPublish, setShowPublish] = useState(false);
  const [publishedInfo, setPublishedInfo] = useState<{ url: string; at: number } | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showSkillMarket, setShowSkillMarket] = useState(false);
  const [referenceDrawerItem, setReferenceDrawerItem] = useState<RefDrawerItem | null>(null);
  const [versions, setVersions] = useState<CanvasVersion[]>([]);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const versionPickerRef = React.useRef<HTMLDivElement>(null);
  // Collab session ID (set when share is opened, or inherited from prop)
  const [currentCollabId, setCurrentCollabId] = useState<string | undefined>(initCollabId);
  const collabIdRef = React.useRef<string | undefined>(initCollabId);
  // Live update indicator
  const [liveUpdateMsg, setLiveUpdateMsg] = useState<string | null>(null);
  // @ mention
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMention, setShowMention] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const specMenuRef = useRef<HTMLDivElement>(null);

  const syncInputText = useCallback((nextText: string) => {
    const el = inputRef.current;
    setDraft(nextText);
    if (!el) return;
    el.innerText = nextText;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close spec menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (specMenuRef.current && !specMenuRef.current.contains(e.target as Node)) {
        setShowSpecMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close version picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (versionPickerRef.current && !versionPickerRef.current.contains(e.target as Node)) {
        setShowVersionPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live sync: listen for storage events when in collab mode
  useEffect(() => {
    const id = collabIdRef.current;
    if (!id) return;
    const liveKey = getLiveKey(id);
    const handler = (e: StorageEvent) => {
      if (e.key !== liveKey || !e.newValue) return;
      try {
        const update = JSON.parse(e.newValue) as { pages: GeneratedPage[]; spec: string; activePageId: string | null; ts: number };
        setGeneratedPages(update.pages ?? []);
        if (update.spec) setSelectedSpec(update.spec);
        if (update.activePageId) {
          const page = (update.pages ?? []).find(p => p.id === update.activePageId);
          if (page) setActivePage(page);
        }
        setLiveUpdateMsg('画布已更新（协作者修改）');
        setTimeout(() => setLiveUpdateMsg(null), 3000);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []); // only run once; collabIdRef is a ref so no dep needed

  // @ mention detection (contentEditable div)
  const handleDraftChange = (e: React.FormEvent<HTMLDivElement>) => {
    const el = inputRef.current;
    if (!el) return;
    const text = el.innerText;
    setDraft(text);

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { setShowMention(false); return; }

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const textBefore = (node.textContent ?? '').slice(0, range.startOffset);
      const atIdx = textBefore.lastIndexOf('@');
      if (atIdx !== -1 && !textBefore.slice(atIdx + 1).includes(' ') && !textBefore.slice(atIdx + 1).includes('\n')) {
        setMentionQuery(textBefore.slice(atIdx + 1));
        setShowMention(true);
        return;
      }
    }
    setShowMention(false);
  };

  // Insert @mention as an inline styled span in the contentEditable div
  const handleInsertMention = (name: string) => {
    const el = inputRef.current;
    if (!el) { setShowMention(false); return; }
    el.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const textBefore = (node.textContent ?? '').slice(0, range.startOffset);
        const atIdx = textBefore.lastIndexOf('@');
        if (atIdx !== -1) {
          // Delete from @ to cursor
          range.setStart(node, atIdx);
          range.deleteContents();
        }
      }
      // Create inline mention span
      const span = document.createElement('span');
      span.setAttribute('contenteditable', 'false');
      span.setAttribute('data-mention', name);
      span.style.cssText = 'display:inline-flex;align-items:center;gap:2px;color:#1476ff;background:#f0f5ff;border-radius:4px;padding:1px 6px;font-size:13px;font-weight:500;user-select:none;cursor:default;white-space:nowrap;margin:0 2px;line-height:1.4;';
      span.textContent = `@${name}`;
      range.insertNode(span);
      // Move cursor after the span
      const after = document.createRange();
      after.setStartAfter(span);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      // Insert a non-breaking space so user can continue typing after the chip
      document.execCommand('insertText', false, '\u00A0');
    }
    setDraft(el.innerText);
    setShowMention(false);
  };

  // Keep for backward compat (no longer used for chip path, but left for safety)
  const handleMentionSelect = (doc: ResearchDoc) => handleInsertMention(doc.title);

  const filteredMentions = RESEARCH_DOCS.filter(d =>
    d.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSend = useCallback(() => {
    const el = inputRef.current;
    const text = (el?.innerText ?? draft).trim();
    if (!text && attachments.length === 0) return;
    const currentDraft = text;
    const currentAttachments = [...attachments];
    const currentReferencedAssets = [...referencedAssets];
    if (el) el.innerHTML = '';
    setDraft('');
    setAttachments([]);
    setShowMention(false);

    const userId = `u-${Date.now()}`;
    const thinkId = `t-${Date.now()}`;

    setMessages(prev => [...prev, {
      id: userId,
      role: 'user',
      text: currentDraft,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      referencedAssets: currentReferencedAssets.length > 0 ? currentReferencedAssets : undefined,
    }]);
    setMessages(prev => [...prev, { id: thinkId, role: 'ai', text: '', thinking: true }]);

    setTimeout(() => {
      const canvasType = inferCanvasTypeV2(currentDraft || '仪表盘');
      const pageName = inferPageNameV2(currentDraft || '首页');
      // Always generate exactly 1 page — the canvas shows a live demo, not variants
      const newPages: GeneratedPage[] = [{
        id: `p-${Date.now()}`,
        name: pageName,
        canvasType,
      }];

      // Track as a version
      const newVersion: CanvasVersion = {
        id: `v-${Date.now()}`,
        page: newPages[0],
        prompt: currentDraft,
        spec: selectedSpec,
        createdAt: Date.now(),
      };
      setVersions(prev => [...prev, newVersion]);

      setGeneratedPages(prev => {
        const next = [...prev, ...newPages];
        // Push live update so all collaborators see the new pages
        const cid = collabIdRef.current;
        if (cid) {
          pushLiveUpdate(cid, {
            title: 'Vibe Design 草稿',
            spec: selectedSpec,
            pages: next,
            activePageId: newPages[0].id,
            owner: 'Vivian Chen',
            collaborators: [],
          });
        }
        return next;
      });
      setActivePage(newPages[0]);

      const attachNote = currentAttachments.length > 0
        ? `\n\n已解析附件：${currentAttachments.map(a => a.name).join('、')}，作为设计参考。`
        : '';
      const assetNote = currentReferencedAssets.length > 0
        ? `\n\n已显式引用资产：${currentReferencedAssets.map(asset => asset.citation_label).join('、')}。`
        : '';
      const conflictNote = currentReferencedAssets.some(asset => asset.source_type === 'personal' && asset.risk_note)
        ? '\n已保留个人资产优先的选择，并对潜在平台规范差异进行了标记。'
        : '';
      const specNote = `（基于「${selectedSpec}」规范生成）`;

      setMessages(prev => prev.map(m => m.id === thinkId ? {
        ...m, thinking: false,
        text: `好的，已根据「${currentDraft || '你的描述'}」${specNote}生成了 ${newPages.length} 个页面方案，可在右侧画布预览。继续描述可进一步调整。${attachNote}${assetNote}${conflictNote}`,
        pages: newPages,
      } : m));
    }, 2000);
  }, [draft, attachments, referencedAssets, selectedSpec]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showMention) {
      if (e.key === 'Escape') { setShowMention(false); return; }
      // Prevent Enter from sending while mention panel is open
      if (e.key === 'Enter') { e.preventDefault(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !showMention) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAdd = (type: Attachment['type'], name: string) => {
    setAttachments(prev => [...prev, { id: `a-${Date.now()}`, name, type }]);
  };

  const handleInsertToChat = (text: string) => {
    const nextText = draft ? `${draft} ${text}` : text;
    syncInputText(nextText);
    setLeftTab('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleReferenceAsset = useCallback((asset: AssetRecord) => {
    setReferencedAssets(prev => prev.some(item => item.asset_id === asset.asset_id) ? prev : [...prev, asset]);
    setLeftTab('chat');
    onToast(`已引用${asset.source_type === 'platform' ? '平台' : '个人'}资产：${asset.title}`);
  }, [onToast]);

  const handleRemoveReferencedAsset = useCallback((assetId: string) => {
    setReferencedAssets(prev => prev.filter(asset => asset.asset_id !== assetId));
  }, []);

  const handleUploadAsset = useCallback((fileName: string) => {
    const dotIndex = fileName.lastIndexOf('.');
    const rawTitle = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    const format = dotIndex > 0 ? fileName.slice(dotIndex + 1).toUpperCase() : 'FILE';
    const newAsset: AssetRecord = {
      asset_id: `personal-upload-${Date.now()}`,
      source_type: 'personal',
      title: rawTitle,
      asset_type: 'delivery',
      owner: 'Vivian Chen',
      format,
      updated_at: '刚刚',
      tags: ['本地上传', '交付件', '个人'],
      summary_for_ai: '刚从本地上传的个人交付件，适合继续作为页面结构、视觉风格和交互细节的上下文输入。',
      citation_label: `个人资产 · ${rawTitle}`,
      applicable_scenarios: ['当前任务继续迭代', '交付复用', '局部改版'],
      preview: { kind: 'canvas', accent: '#f5f3ff', secondary: '#ddd6fe', label: '上传件' },
      structured_payload: `基于本地上传文件 ${fileName} 继续生成，优先沿用现有结构、视觉层次和已交付的交互路径。`,
      upload_source: 'local',
      visibility: 'private',
      recent: true,
    };

    setPersonalAssets(prev => [newAsset, ...prev.map(asset => ({ ...asset, recent: false }))]);
    setReferenceDrawerItem({ kind: 'asset', asset: newAsset });
    handleReferenceAsset(newAsset);
  }, [handleReferenceAsset]);

  const handleToggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const vp = VIEWPORT_SIZES_V2[viewport];
  const scaledW = Math.round(vp.w * zoom / 100);
  const scaledH = Math.round(vp.h * zoom / 100);
  const ActiveCanvas = activePage
    ? (CANVAS_MAP[activePage.canvasType] ?? InteractiveLoginDemo)
    : null;

  // Helper: render message text with @mentions as styled chips
  const renderMsgText = (text: string) => {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="inline-flex items-center gap-0.5 bg-[#f0f5ff] text-[#1476ff] text-[10px] px-1.5 py-0.5 rounded-md font-medium mx-0.5 border border-[#d4e0ff] whitespace-nowrap">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const hasPlatformReference = referencedAssets.some(asset => asset.source_type === 'platform');
  const personalConflictAsset = referencedAssets.find(asset => asset.source_type === 'personal' && asset.risk_note);
  const conflictMessage = personalConflictAsset
    ? hasPlatformReference
      ? `${personalConflictAsset.title} 可能与平台规范存在差异。系统将按你的显式选择继续生成，并保留来源标识。`
      : `${personalConflictAsset.title} 属于个人资产，系统将按你的显式选择继续生成。`
    : null;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[200] flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* ════════════════════════════════════════════════════
            LEFT PANEL
        ════════════════════════════════════════════════════ */}
        <div className="w-[400px] shrink-0 flex flex-col bg-white border-r border-[rgba(25,25,25,0.08)] h-full shadow-[2px_0_12px_rgba(0,0,0,0.04)]">

          {/* Header */}
          <div className="px-4 h-12 flex items-center gap-3 border-b border-[rgba(25,25,25,0.07)] shrink-0">
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors text-[#555]">
              <ArrowLeft size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#191919]">Vibe Design</span>
                {publishedInfo ? (
                  <span className="text-[10px] bg-[#f0fdf4] text-[#10b981] border border-[#d1fae5] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <Check size={10} /> 已发布
                  </span>
                ) : isCollaborator ? (
                  <span className="text-[10px] bg-[#f0fdf4] text-[#10b981] border border-[#d1fae5] px-1.5 py-0.5 rounded-full font-medium">协作中</span>
                ) : null}
              </div>
              <div className="text-[10px] text-[#aaa] flex items-center gap-1">
                <span>AI 原型生成 · {isCollaborator ? '协作编辑' : publishedInfo ? '已发布' : '草稿'}</span>
                {publishedInfo && (
                  <button onClick={() => window.open(publishedInfo.url, '_blank')}
                    className="text-[#1476ff] hover:underline flex items-center gap-0.5">
                    <Globe size={10} /> 查看链接
                  </button>
                )}
              </div>
            </div>
            {/* Presence avatars */}
            {isCollaborator && (
              <div className="flex items-center -space-x-1.5 mr-1">
                {[{ initial: 'V', color: '#1476ff', title: 'Vivian Chen（所有者）' },
                  { initial: 'Me', color: '#10b981', title: '我（协作者）' }].map(p => (
                  <div key={p.initial} title={p.title}
                    className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: p.color }}>
                    {p.initial}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-[rgba(25,25,25,0.07)] shrink-0 px-1">
            {LEFT_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors relative ${
                    leftTab === tab.id ? 'text-[#1476ff]' : 'text-[#999] hover:text-[#555]'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {leftTab === tab.id && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1476ff] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {leftTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                  className="flex flex-col h-full min-h-0">

                  {/* Chat History */}
                  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0 bg-white">
                    <AnimatePresence initial={false}>
                      {messages.map(msg => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'ai' && (
                            <div className="flex gap-2.5 max-w-[92%]">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9059c4] to-[#1476ff] flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles size={10} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                {msg.thinking ? (
                                  <div className="inline-flex items-center gap-1.5 bg-[#f5f6f7] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-[#9059c4]">
                                    思考中 <AnimatedDots />
                                  </div>
                                ) : (
                                  <div className="bg-[#f5f6f7] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                                    <p className="text-xs text-[#333] leading-relaxed whitespace-pre-wrap">{renderMsgText(msg.text)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {msg.role === 'user' && (
                            <div className="max-w-[88%] space-y-1.5">
                              {msg.referencedAssets && msg.referencedAssets.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                  {msg.referencedAssets.map(asset => (
                                    <div key={asset.asset_id} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${asset.source_type === 'platform' ? 'bg-[#eff6ff] text-[#1476ff] border-[#dbeafe]' : 'bg-[#faf5ff] text-[#7c3aed] border-[#e9d5ff]'}`}>
                                      {asset.source_type === 'platform' ? <Shield size={10} /> : <Lock size={10} />}
                                      {asset.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                  {msg.attachments.map(att => (
                                    <div key={att.id} className="flex items-center gap-1 bg-[#f0f5ff] text-[#1476ff] text-[10px] px-2 py-1 rounded-lg border border-[#d4e0ff]">
                                      {att.type === 'image' ? <ImageIcon size={10} /> : att.type === 'pix' ? <FolderOpen size={10} /> : att.type === 'mention' ? <AtSign size={10} /> : <Paperclip size={10} />}
                                      {att.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.text && (
                                <div className="bg-[#f0e8f7] px-3.5 py-2.5 text-xs text-[#333] leading-relaxed" style={{ borderRadius: '16px 16px 2px 16px' }}>
                                  {renderMsgText(msg.text)}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="px-3 pb-3 pt-2 border-t border-[rgba(25,25,25,0.07)] shrink-0 bg-white relative">
                    {/* @ Mention Panel — 3 tabs: 资产库 / 用研文档 / 技能社区 */}
                    <AnimatePresence>
                      {showMention && (
                        <MentionPanelV2
                          mentionQuery={mentionQuery}
                          skills={skills}
                          onToggleSkill={handleToggleSkill}
                          onInsertAsset={(text) => { handleInsertToChat(text); setShowMention(false); }}
                          onInsertMention={handleInsertMention}
                          onSelectDoc={handleMentionSelect}
                          onSelectRequirement={({ name }) => {
                            handleInsertToChat(name);
                            setShowMention(false);
                          }}
                          onClose={() => setShowMention(false)}
                        />
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {referencedAssets.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-2.5 rounded-2xl border border-[rgba(25,25,25,0.08)] bg-[#fcfcfd] overflow-hidden"
                        >
                          <div className="px-3 py-2.5 border-b border-[rgba(25,25,25,0.06)] flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide">当前会话已引用资产</p>
                              <p className="text-[10px] text-[#98a2b3] mt-0.5">{referencedAssets.length} 项资产将作为当前 AI 会话的显式上下文</p>
                            </div>
                            <button
                              onClick={() => setLeftTab('assets')}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#f5f6f7] text-[#555] hover:bg-[#eef2ff] hover:text-[#1476ff] transition-colors"
                            >
                              去替换
                            </button>
                          </div>
                          <div className="px-3 py-2.5 space-y-2">
                            {referencedAssets.map(asset => (
                              <div key={asset.asset_id} className="flex items-center gap-2 rounded-xl border border-[rgba(25,25,25,0.06)] bg-white px-2.5 py-2">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${asset.source_type === 'platform' ? 'bg-[#eff6ff] text-[#1476ff]' : 'bg-[#faf5ff] text-[#7c3aed]'}`}>
                                  {asset.source_type === 'platform' ? <Shield size={12} /> : <Lock size={12} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-[11px] font-medium text-[#191919] truncate">{asset.title}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${asset.source_type === 'platform' ? 'bg-[#eff6ff] text-[#1476ff]' : 'bg-[#faf5ff] text-[#7c3aed]'}`}>
                                      {asset.source_type === 'platform' ? '平台' : '个人'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#98a2b3] truncate mt-0.5">{asset.summary_for_ai}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setReferenceDrawerItem({ kind: 'asset', asset })}
                                    className="text-[10px] px-2 py-1 rounded-lg border border-[rgba(25,25,25,0.1)] text-[#555] hover:bg-[#f8fafc] transition-colors"
                                  >
                                    查看
                                  </button>
                                  <button
                                    onClick={() => handleRemoveReferencedAsset(asset.asset_id)}
                                    className="text-[10px] px-2 py-1 rounded-lg bg-[#f5f6f7] text-[#667085] hover:bg-[#fef2f2] hover:text-[#dc2626] transition-colors"
                                  >
                                    移除
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {conflictMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="mb-2.5 rounded-2xl border border-[#fed7aa] bg-[#fff7ed] px-3 py-2.5"
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-[#ea580c] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-[#c2410c] uppercase tracking-wide">软提示</p>
                              <p className="text-[10px] text-[#9a3412] leading-relaxed mt-0.5">{conflictMessage}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Attachments */}
                    <AnimatePresence>
                      {attachments.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-1.5 mb-2">
                          {attachments.map(att => att.type === 'mention' ? (
                            // @ mention chip — purple, visually distinct
                            <div key={att.id} className="flex items-center gap-1 bg-[#f5f0ff] border border-[#d9c5ff] text-[10px] text-[#7c3aed] px-2 py-1 rounded-lg font-medium">
                              <AtSign size={10} className="shrink-0" />
                              <span className="max-w-[120px] truncate">{att.name}</span>
                              <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-[#c4a8ff] hover:text-[#7c3aed] ml-0.5"><X size={10} /></button>
                            </div>
                          ) : (
                            // File / image / pix chip — blue
                            <div key={att.id} className="flex items-center gap-1.5 bg-[#f0f5ff] border border-[#d4e0ff] text-[10px] text-[#1476ff] px-2 py-1 rounded-lg">
                              {att.type === 'image' ? <ImageIcon size={10} /> : att.type === 'pix' ? <FolderOpen size={10} /> : <Paperclip size={10} />}
                              <span className="max-w-[80px] truncate">{att.name}</span>
                              <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-[#aaa] hover:text-[#555]"><X size={10} /></button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="border border-[rgba(25,25,25,0.12)] rounded-2xl overflow-hidden focus-within:border-[#1476ff] transition-colors bg-white">
                      <div
                        ref={inputRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleDraftChange}
                        onKeyDown={handleKeyDown}
                        data-placeholder="描述你想生成的界面，输入 @ 引用用研文档..."
                        className="w-full bg-transparent text-[12px] text-[#191919] outline-none leading-[1.6] px-4 pt-3 pb-2 min-h-[72px] max-h-[180px] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-[#bbb] empty:before:pointer-events-none"
                      />
                      <div className="flex items-center gap-1 px-3 pb-2.5 pt-1 border-t border-[rgba(25,25,25,0.05)]">
                        <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileAdd('file', f.name); e.target.value = ''; }} />
                        <button onClick={() => fileInputRef.current?.click()} title="上传附件" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#777] hover:text-[#1476ff] hover:bg-[#f0f5ff] transition-colors">
                          <Paperclip size={14} />
                        </button>
                        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileAdd('image', f.name); e.target.value = ''; }} />
                        <button onClick={() => imageInputRef.current?.click()} title="上传图片" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#777] hover:text-[#1476ff] hover:bg-[#f0f5ff] transition-colors">
                          <ImageIcon size={14} />
                        </button>
                        <button onClick={() => setShowPixModal(true)}
                          title="导入 .pix 文件"
                          className="flex items-center gap-1 h-7 px-2 rounded-lg text-[#777] hover:text-[#1476ff] hover:bg-[#f0f5ff] transition-colors text-[10px] font-medium border border-transparent hover:border-[#d4e0ff]">
                          <FolderOpen size={12} />.pix
                        </button>
                        <div className="flex-1" />
                        {draft.length > 0 && <span className="text-[10px] text-[#ccc] mr-1">{draft.length}</span>}
                        <button onClick={handleSend} disabled={!draft.trim() && attachments.length === 0}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${draft.trim() || attachments.length > 0 ? 'bg-[#1476ff] text-white hover:bg-[#1060d0] shadow-[0_2px_6px_rgba(20,118,255,0.3)]' : 'bg-[#f0f0f0] text-[#ccc] cursor-not-allowed'}`}>
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#ccc] mt-1.5 text-center">Enter 发送 · Shift+Enter 换行</p>
                  </div>
                </motion.div>
              )}

              {leftTab === 'assets' && (
                <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full min-h-0">
                  <AssetsTabV2
                    platformAssets={PLATFORM_ASSETS}
                    personalAssets={personalAssets}
                    referencedAssetIds={referencedAssets.map(asset => asset.asset_id)}
                    onOpenItem={setReferenceDrawerItem}
                    onReferenceAsset={handleReferenceAsset}
                    onUploadAsset={handleUploadAsset}
                  />
                </motion.div>
              )}

              {leftTab === 'research' && (
                <motion.div key="research" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full min-h-0">
                  <ResearchTabV2
                    onInsert={handleInsertToChat}
                    onOpenDoc={(doc) => setReferenceDrawerItem({ kind: 'doc', doc })}
                  />
                </motion.div>
              )}

              {leftTab === 'skills' && (
                <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full min-h-0">
                  <SkillsTabV2
                    skills={skills}
                    onToggle={handleToggleSkill}
                    onOpenMarket={() => setShowSkillMarket(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT PANEL — 画布区 (AI Image Generation Style)
        ════════════════════════════════════════════════════ */}
        <div className="flex-1 flex min-w-0 h-full" style={{ background: '#EDEEF8' }}>

          {/* ── Left: Image Canvas ── */}
          <div className="flex-1 flex items-center justify-center relative min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {ActiveCanvas ? (
                <motion.div
                  key={activePage!.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                  className="w-full h-full relative"
                >
                  <div className="w-full h-full overflow-hidden">
                    <ActiveCanvas />
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full select-none">
                    AI生成
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                  <BeamsBackground>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center pointer-events-none">
                      <div className="relative w-24 h-24 rotate-45">
                        <style>{`
                          @keyframes vibe-square {
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
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 left-0 w-7 h-7 m-0.5 rounded-sm"
                            style={{
                              background: `rgba(124, 58, 237, ${0.55 - i * 0.05})`,
                              animation: 'vibe-square 10s ease-in-out infinite both',
                              animationDelay: `${-1.4285714286 * i}s`,
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[#333] mb-1.5">试试 Vibe Design 新能力</p>
                        <p className="text-xs text-[#888]">通过左侧对话框描述你的想法，AI 将为你快速构建 Demo 效果</p>
                      </div>
                    </div>
                  </BeamsBackground>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Generation Info Sidebar ── */}
          <div className="w-[272px] shrink-0 overflow-y-auto py-5 px-4 flex flex-col gap-5 border-l border-[rgba(124,58,237,0.08)]" style={{ background: '#EDEEF8' }}>

            {/* 生成结果 */}
            <div>
              <p className="text-[12px] font-semibold text-[#191919] mb-3">生成结果</p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[aiCardImg, controlImg, home3Img, homeWebpImg].map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${selectedVariant === i ? 'border-[#7C3AED]' : 'border-transparent hover:border-[#c4b5fd]'}`}
                  >
                    <img src={src} alt={`方案${String.fromCharCode(65 + i)}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-[12px] font-bold text-[#191919] mb-1.5">
                方案{String.fromCharCode(65 + selectedVariant)}：{['城市公园夜跑', '河边步道晨跑', '社区健身', '滨江跑道'][selectedVariant]}
              </p>
              <p className="text-[10px] text-[#666] leading-relaxed">
                {activePage
                  ? `${activePage.name}，AI 基于描述生成的界面方案，可继续迭代调整。`
                  : ['城市公园夜间跑步场景，路灯照明，跑道清晰，运动者剪影', '清晨河边步道，阳光透过树叶，清新自然', '社区户外健身区，活力社区，居民锻炼', '滨江景观跑道，江景优美，沉浸自然'][selectedVariant]}
              </p>
            </div>

            {/* 生成信息 */}
            <div>
              <p className="text-[12px] font-semibold text-[#191919] mb-2.5">生成信息</p>
              <div className="space-y-2">
                {([
                  ['模型', '图片5.0 Lite'],
                  ['比例', '16:9'],
                  ['分辨率', '1920x1080'],
                  ['时间', '2026-04-01 16:45'],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-[#999]">{label}</span>
                    <span className="text-[10px] text-[#333] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 提示词 */}
            <div>
              <p className="text-[12px] font-semibold text-[#191919] mb-1.5">提示词</p>
              <p className="text-[10px] text-[#666] leading-relaxed">
                {activePage ? activePage.name : '生成运动主题氛围图：城市公园夜跑、河边步道晨跑、社区健身、滨江跑道。生活化真实场景，高清摄影风格'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => onToast('正在重新生成...')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[12px] font-medium transition-colors hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)' }}
              >
                <Sparkles size={14} />
                再次生成
              </button>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { icon: Wand2, label: '变清晰' },
                  { icon: Scissors, label: '抠图' },
                  { icon: Paintbrush, label: '局部重绘' },
                  { icon: Expand, label: '扩图' },
                ] as { icon: React.FC<{ size?: number; className?: string }>; label: string }[]).map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => onToast(`${label}功能即将上线`)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[#444] text-[12px] border border-[rgba(25,25,25,0.12)] bg-white/50 hover:bg-white/80 transition-colors active:scale-[0.98]"
                  >
                    <Icon size={13} className="text-[#666]" />
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onToast('在线编辑功能即将上线')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[#444] text-[12px] border border-[rgba(25,25,25,0.12)] bg-white/50 hover:bg-white/80 transition-colors active:scale-[0.98]"
              >
                <Pencil size={13} className="text-[#666]" />
                在线编辑
              </button>
            </div>

            {/* 风格标签 */}
            <div>
              <p className="text-[12px] font-semibold text-[#191919] mb-2">风格标签</p>
              <div className="flex flex-wrap gap-1.5">
                {['运动', '氛围图', '摄影风格'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2.5 py-1 rounded-full border cursor-default select-none border-[#7C3AED] text-[#7C3AED] bg-[#f5f0ff]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 相关作品 */}
            <div>
              <p className="text-[12px] font-semibold text-[#191919] mb-2">相关作品</p>
              <div className="grid grid-cols-2 gap-2">
                {[home2Img, gradientBtnImg].map((src, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Pix Import Modal */}
      <AnimatePresence>
        {showPixModal && (
          <PixImportModalV2
            onClose={() => setShowPixModal(false)}
            onImport={(name) => {
              handleFileAdd('pix', name);
              onToast(`.pix 文件导入成功，已作为设计参考`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Live update notification */}
      <AnimatePresence>
        {liveUpdateMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[500] bg-[#191919] text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            {liveUpdateMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals — rendered outside the sliding panel */}
      <AnimatePresence>
        {showPublish && (
          <PublishModalV2
            onClose={() => setShowPublish(false)}
            pages={generatedPages}
            spec={selectedSpec}
            title="Vibe Design 草稿"
            onPublished={(url, at) => setPublishedInfo({ url, at })}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showShare && (
          <SharePanelV2
            onClose={() => setShowShare(false)}
            pages={generatedPages}
            spec={selectedSpec}
            title="Vibe Design 草稿"
            existingCollabId={currentCollabId}
            onCollabIdCreated={(id) => {
              collabIdRef.current = id;
              setCurrentCollabId(id);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSkillMarket && (
          <SkillMarketModal
            skills={skills}
            onToggle={handleToggleSkill}
            onClose={() => setShowSkillMarket(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {referenceDrawerItem && (
          <ReferenceDrawer
            item={referenceDrawerItem}
            onClose={() => setReferenceDrawerItem(null)}
            onInsertText={handleInsertToChat}
            onReferenceAsset={handleReferenceAsset}
          />
        )}
      </AnimatePresence>
    </>
  );
};
