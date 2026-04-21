/**
 * 版本交付模块 — 独立模块，不影响原有设计资产库逻辑
 */
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  ChevronRight, ChevronDown, Search, Sparkles, X, CheckCircle2, Loader2,
  RefreshCw, Copy, Check, Folder, Plus, Upload, Calendar,
  MoreHorizontal, FolderOpen,
} from 'lucide-react';
import { AIAssistantPanel } from '../components/AIAssistantPanel';
import { VibeDesign } from './VibeDesign';
import { OctoBuild, type OctoBuildState } from './OctoBuild';
import { AnimatePresence, motion } from 'motion/react';

import imgA1  from '../assets/previews/AI功能Toolbar.jpg';
import imgA3  from '../assets/previews/Dashboard图表.jpg';
import imgA4  from '../assets/previews/Dashboard图表2.jpg';
import imgA5  from '../assets/previews/天气卡片.jpg';
import imgA6  from '../assets/previews/官网楼层.jpg';
import imgA7  from '../assets/previews/官网首页.webp';
import imgA8  from '../assets/previews/官网首页2.webp';
import imgA11 from '../assets/previews/渐变按钮.jpg';

// ─── Context ──────────────────────────────────────────────────────────────────
export const VersionDeliveryCtx = createContext<{
  activeSection: string;
  setActiveSection: (s: string) => void;
}>({ activeSection: 'requirements', setActiveSection: () => {} });

// ─── Figma 用户头像 ────────────────────────────────────────────────────────────
const AVATAR_VIVIAN  = 'https://www.figma.com/api/mcp/asset/19b97513-c535-4edc-976b-a7c3a3df1d07';
const AVATAR_JACKSON = 'https://www.figma.com/api/mcp/asset/380e87ae-be9a-459a-8ebd-5b8e279768fa';
const AVATAR_ANDREW  = 'https://www.figma.com/api/mcp/asset/5266b7d5-4a5b-43b2-a2d2-f0f472b5dda7';
const AVATAR_SUN     = 'https://www.figma.com/api/mcp/asset/dd44ee0b-7025-4ab7-af9e-54f2076cf9b9';

const USERS = [
  { name: 'Vivian',  avatar: AVATAR_VIVIAN  },
  { name: 'Jackson', avatar: AVATAR_JACKSON },
  { name: 'Andrew',  avatar: AVATAR_ANDREW  },
  { name: 'Sun',     avatar: AVATAR_SUN     },
];
const CURRENT_USER = 'Vivian';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Requirement {
  id: string;
  name: string;
  proposer: { name: string; avatar: string };
  owner:    { name: string; avatar: string };
  reviewStatus: string;
  deliveryDate: string;
  priority: 'high' | 'medium' | 'low';
  tags: string;
  description: string;
}

interface MatchedAsset {
  id: string;
  title: string;
  isComponent: boolean;
  author: string;
  score: number;
  tags: string[];
  uploadTime: string;
  thumbnail?: string;
}

interface MockFile {
  id: string;
  name: string;
  type: 'folder' | 'pix' | 'make';
  thumbnail?: string;
  author?: string;
  date?: string;
  itemCount?: number;
  children?: MockFile[];
  sectionId?: string;
  workspace?: OctoBuildState;
}
type PathEntry = { id: string; name: string; children: MockFile[] };

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_REQUIREMENTS: Requirement[] = [
  {
    id: 'r1', name: '业务视图体验优化',
    proposer: { name: 'Vivian',  avatar: AVATAR_VIVIAN  },
    owner:    { name: 'Vivian',  avatar: AVATAR_VIVIAN  },
    reviewStatus: '评审通过', deliveryDate: '2026-03-30', priority: 'high',
    tags: 'UX优化',
    description: '针对业务视图页面的整体体验进行系统性优化，包括空白态处理、加载状态展示、以及拓扑图的交互体验改善，提升整体视觉一致性与可用性。',
  },
  {
    id: 'r2', name: '拓扑图优化',
    proposer: { name: 'Jackson', avatar: AVATAR_JACKSON },
    owner:    { name: 'Jackson', avatar: AVATAR_JACKSON },
    reviewStatus: '待评审', deliveryDate: '2026-03-30', priority: 'medium',
    tags: 'UX优化, 可视化',
    description: '对网络拓扑可视化模块进行优化，改善节点关系呈现方式、链路状态表达以及 Spine-Leaf 架构的图形化展示，提升工程师使用效率。',
  },
  {
    id: 'r3', name: '卡间路径体验优化',
    proposer: { name: 'Andrew',  avatar: AVATAR_ANDREW  },
    owner:    { name: 'Andrew',  avatar: AVATAR_ANDREW  },
    reviewStatus: '评审通过', deliveryDate: '2026-03-30', priority: 'medium',
    tags: '导航, 引导',
    description: '改善用户在不同业务卡片之间的跳转路径体验，区分异常态与正常态的视觉表达，并增加清晰的用户引导流程，减少操作迷失感。',
  },
  {
    id: 'r4', name: '新增告警智能分析',
    proposer: { name: 'Sun',     avatar: AVATAR_SUN     },
    owner:    { name: 'Sun',     avatar: AVATAR_SUN     },
    reviewStatus: '--', deliveryDate: '2026-04-15', priority: 'medium',
    tags: 'AI, 监控',
    description: '在告警系统中引入 AI 分析能力，支持告警事件的智能归因、趋势预测和异常根因定位，降低运维人员的告警噪音处理负担。',
  },
];

const AI_CONFIG: Record<string, {
  keywords: string[];
  monologue: string[];
  transferCode: string;
  assets: MatchedAsset[];
}> = {
  r1: {
    keywords: ['业务视图', '体验优化', '空白页', '拓扑'],
    transferCode: 'OCTO-BV-2026',
    monologue: [
      '正在理解需求「业务视图体验优化」...',
      '核心关注点：视图展示方式、空白态处理、交互体验改善。',
      '在 14 项设计资产中进行全文语义检索...',
      '命中关键词「业务视图」的资产共 5 项，按语义距离排序。',
      '综合评估关键词覆盖率、设计风格一致性与版本时效性...',
      '过滤相似度低于 80% 的项，确认推荐 3 项高度相关资产。',
    ],
    assets: [
      { id: 'a1', title: 'AI功能Toolbar',  isComponent: false, author: '张设计', score: 96, tags: ['AI', 'Toolbar'],     uploadTime: '2025-10-12', thumbnail: imgA1 },
      { id: 'a3', title: 'Dashboard图表',  isComponent: false, author: '张设计', score: 88, tags: ['Dashboard', '图表'], uploadTime: '2025-10-01', thumbnail: imgA3 },
      { id: 'a4', title: 'Dashboard图表2', isComponent: true,  author: '王视觉', score: 82, tags: ['Dashboard', '图表'], uploadTime: '2025-09-25', thumbnail: imgA4 },
    ],
  },
  r2: {
    keywords: ['拓扑图', '网络结构', 'Spine', 'Leaf'],
    transferCode: 'OCTO-TP-2026',
    monologue: [
      '正在理解需求「拓扑图优化」...',
      '核心关注点：网络拓扑可视化、节点关系呈现、链路状态表达。',
      '在 14 项设计资产中检索「拓扑」「网络」相关内容...',
      '发现 3 项命中，其中 2 项与当前需求高度吻合。',
      '排除版本过旧的资产，最终确认推荐 2 项。',
    ],
    assets: [
      { id: 'a4', title: 'Dashboard图表2', isComponent: true,  author: '王视觉', score: 94, tags: ['Dashboard', '图表'], uploadTime: '2025-09-25', thumbnail: imgA4 },
      { id: 'a5', title: '天气卡片',        isComponent: false, author: '李交互', score: 87, tags: ['天气', '卡片'],      uploadTime: '2025-09-18', thumbnail: imgA5 },
    ],
  },
  r3: {
    keywords: ['卡间路径', '用户指引', '异常', '正常'],
    transferCode: 'OCTO-CP-2026',
    monologue: [
      '正在理解需求「卡间路径体验优化」...',
      '识别到场景：卡间导航路径、异常/正常状态区分、用户引导流程。',
      '检索与「卡间路径」语义相近的资产...',
      '找到异常态和正常态两个核心设计稿，相似度极高。',
      '同时发现「用户指引」资产可作为补充引导素材。',
      '综合评估后，确认推荐 3 项高度相关资产。',
    ],
    assets: [
      { id: 'a7', title: '官网首页',  isComponent: false, author: '王视觉', score: 97, tags: ['官网', '首页'],   uploadTime: '2025-09-30', thumbnail: imgA7 },
      { id: 'a8', title: '官网首页2', isComponent: false, author: '王视觉', score: 95, tags: ['官网', '首页'],   uploadTime: '2025-09-28', thumbnail: imgA8 },
      { id: 'a6', title: '官网楼层',  isComponent: true,  author: '张设计', score: 79, tags: ['官网', '楼层'],   uploadTime: '2025-10-10', thumbnail: imgA6 },
    ],
  },
  r4: {
    keywords: ['告警', '智能分析', '监控', 'AI'],
    transferCode: 'OCTO-AL-2026',
    monologue: [
      '正在理解需求「新增告警智能分析」...',
      '关注点：告警事件的 AI 分析能力、趋势预测、异常根因定位。',
      '检索「监控」「告警」「分析」相关设计资产...',
      '「监控告警」资产与需求核心场景直接对应，相似度 93%。',
      '「趋势分析」可支撑告警趋势可视化部分，纳入推荐列表。',
      '共确认 2 项高度相关资产。',
    ],
    assets: [
      { id: 'a11', title: '渐变按钮', isComponent: true,  author: '李交互', score: 93, tags: ['按钮', '渐变'],  uploadTime: '2025-10-02', thumbnail: imgA11 },
      { id: 'a12', title: '趋势分析', isComponent: false, author: '赵产品', score: 81, tags: ['监控', '趋势'], uploadTime: '2025-09-20' },
    ],
  },
};

const FILE_DATA: Record<string, MockFile[]> = {
  plan: [
    { id: 'fp1', name: 'Q1 规划', type: 'folder', itemCount: 3, children: [
      { id: 'fp1-1', name: '产品路线图', type: 'pix', thumbnail: imgA7, author: 'Vivian', date: '2026-01-15' },
      { id: 'fp1-2', name: '迭代计划表', type: 'pix', thumbnail: imgA8, author: 'Jackson', date: '2026-01-20' },
      { id: 'fp1-3', name: '里程碑节点', type: 'pix', thumbnail: imgA3, author: 'Vivian', date: '2026-02-01' },
    ]},
    { id: 'fp2', name: '发版日历', type: 'pix', thumbnail: imgA4, author: 'Andrew', date: '2026-02-10' },
    { id: 'fp3', name: '版本依赖图', type: 'pix', thumbnail: imgA6, author: 'Sun', date: '2026-02-15' },
  ],
  test: [
    { id: 'ft1', name: '测试报告', type: 'folder', itemCount: 2, children: [
      { id: 'ft1-1', name: '功能验收报告', type: 'pix', thumbnail: imgA5, author: 'Vivian', date: '2026-03-01' },
      { id: 'ft1-2', name: 'A/B 测试结果', type: 'pix', thumbnail: imgA3, author: 'Jackson', date: '2026-03-05' },
    ]},
    { id: 'ft2', name: 'UX 评估总结', type: 'pix', thumbnail: imgA1, author: 'Vivian', date: '2026-03-08' },
    { id: 'ft3', name: '用户研究报告', type: 'pix', thumbnail: imgA11, author: 'Andrew', date: '2026-03-10' },
  ],
  overview: [
    { id: 'fo1', name: '版本说明文档', type: 'pix', thumbnail: imgA7, author: 'Vivian', date: '2026-02-28' },
    { id: 'fo2', name: '核心功能清单', type: 'pix', thumbnail: imgA8, author: 'Jackson', date: '2026-03-01' },
    { id: 'fo3', name: '变更日志', type: 'folder', itemCount: 4, children: [
      { id: 'fo3-1', name: 'v1.2.0 变更记录', type: 'pix', thumbnail: imgA3, author: 'Vivian', date: '2026-01-10' },
      { id: 'fo3-2', name: 'v1.1.0 变更记录', type: 'pix', thumbnail: imgA4, author: 'Vivian', date: '2025-12-15' },
      { id: 'fo3-3', name: 'v1.0.0 变更记录', type: 'pix', thumbnail: imgA6, author: 'Vivian', date: '2025-11-01' },
      { id: 'fo3-4', name: 'Beta 变更记录',  type: 'pix', thumbnail: imgA5, author: 'Vivian', date: '2025-10-01' },
    ]},
  ],
  'outline-design': [
    { id: 'od1', name: '业务视图', type: 'folder', itemCount: 3, children: [
      { id: 'od1-1', name: '业务视图-框架稿',   type: 'pix', thumbnail: imgA1, author: 'Vivian', date: '2026-02-05' },
      { id: 'od1-2', name: '业务视图-流程图',   type: 'pix', thumbnail: imgA3, author: 'Vivian', date: '2026-02-08' },
      { id: 'od1-3', name: '业务视图-交互说明', type: 'pix', thumbnail: imgA4, author: 'Andrew', date: '2026-02-10' },
    ]},
    { id: 'od2', name: '拓扑图概要设计', type: 'pix', thumbnail: imgA5, author: 'Jackson', date: '2026-02-12' },
    { id: 'od3', name: '整体架构示意',   type: 'pix', thumbnail: imgA7, author: 'Vivian', date: '2026-02-15' },
  ],
  'outline-eval': [
    { id: 'oe1', name: '设计评审记录', type: 'pix', thumbnail: imgA8, author: 'Vivian', date: '2026-02-18' },
    { id: 'oe2', name: '评审意见汇总', type: 'folder', itemCount: 2, children: [
      { id: 'oe2-1', name: '第一轮评审意见', type: 'pix', thumbnail: imgA6, author: 'Jackson', date: '2026-02-16' },
      { id: 'oe2-2', name: '第二轮评审意见', type: 'pix', thumbnail: imgA11, author: 'Jackson', date: '2026-02-19' },
    ]},
    { id: 'oe3', name: '评估指标基线', type: 'pix', thumbnail: imgA3, author: 'Andrew', date: '2026-02-20' },
  ],
  'detail-design': [
    { id: 'dd1', name: '业务视图详细设计', type: 'folder', itemCount: 4, children: [
      { id: 'dd1-1', name: '主页面设计稿', type: 'pix', thumbnail: imgA1, author: 'Vivian', date: '2026-02-25' },
      { id: 'dd1-2', name: '空态设计稿',   type: 'pix', thumbnail: imgA4, author: 'Vivian', date: '2026-02-26' },
      { id: 'dd1-3', name: '错误态设计稿', type: 'pix', thumbnail: imgA5, author: 'Andrew', date: '2026-02-27' },
      { id: 'dd1-4', name: '弹窗组件稿',   type: 'pix', thumbnail: imgA3, author: 'Vivian', date: '2026-02-28' },
    ]},
    { id: 'dd2', name: '拓扑图详细设计', type: 'pix', thumbnail: imgA7, author: 'Jackson', date: '2026-03-01' },
    { id: 'dd3', name: '告警面板设计',   type: 'pix', thumbnail: imgA8, author: 'Sun', date: '2026-03-03' },
  ],
  'detail-interaction': [
    { id: 'di1', name: '交互说明文档', type: 'folder', itemCount: 2, children: [
      { id: 'di1-1', name: '拖拽交互规范', type: 'pix', thumbnail: imgA11, author: 'Vivian', date: '2026-03-04' },
      { id: 'di1-2', name: '动效设计规范', type: 'pix', thumbnail: imgA6,  author: 'Andrew', date: '2026-03-05' },
    ]},
    { id: 'di2', name: '微交互原型',   type: 'pix', thumbnail: imgA1, author: 'Vivian', date: '2026-03-06' },
    { id: 'di3', name: '操作反馈设计', type: 'pix', thumbnail: imgA3, author: 'Jackson', date: '2026-03-07' },
  ],
  'detail-visual': [
    { id: 'dv1', name: '设计令牌', type: 'folder', itemCount: 3, children: [
      { id: 'dv1-1', name: '颜色系统', type: 'pix', thumbnail: imgA11, author: 'Vivian', date: '2026-03-01' },
      { id: 'dv1-2', name: '字体规范', type: 'pix', thumbnail: imgA4,  author: 'Vivian', date: '2026-03-02' },
      { id: 'dv1-3', name: '间距规范', type: 'pix', thumbnail: imgA5,  author: 'Andrew', date: '2026-03-03' },
    ]},
    { id: 'dv2', name: '图标库设计',   type: 'pix', thumbnail: imgA6, author: 'Sun',    date: '2026-03-05' },
    { id: 'dv3', name: '组件视觉规范', type: 'pix', thumbnail: imgA7, author: 'Vivian', date: '2026-03-08' },
  ],
};

const PRIORITY_MAP: Record<Requirement['priority'], { label: string; bg: string; text: string }> = {
  high:   { label: '高', bg: 'bg-[rgba(200,32,32,0.12)]',  text: 'text-[#c82020]' },
  medium: { label: '中', bg: 'bg-[rgba(33,157,72,0.12)]',  text: 'text-[#197837]' },
  low:    { label: '低', bg: 'bg-[rgba(234,179,8,0.12)]',  text: 'text-[#854d0e]' },
};

const REVIEW_STATUS_OPTIONS = ['--', '待评审', '评审中', '评审通过', '评审驳回'];

const SECTION_BREADCRUMB: Record<string, string> = {
  requirements:         '版本管理 / 需求管理',
  plan:                 '版本管理 / 版本计划',
  test:                 '版本管理 / 体验测试与评估',
  overview:             '版本概括',
  'outline-design':     '概要设计与评估 / 概要设计稿',
  'outline-eval':       '概要设计与评估 / 设计评估',
  'detail-design':      '详细设计与评估 / 详细设计稿',
  'detail-interaction': '详细设计与评估 / 交互说明',
  'detail-visual':      '详细设计与评估 / 视觉规范',
};

const SECTION_TITLE: Record<string, string> = {
  requirements:         '需求管理',
  plan:                 '版本计划',
  test:                 '体验测试与评估',
  overview:             '版本概括',
  'outline-design':     '概要设计稿',
  'outline-eval':       '设计评估',
  'detail-design':      '详细设计稿',
  'detail-interaction': '交互说明',
  'detail-visual':      '视觉规范',
};

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
export const VersionDeliverySidebarNav: React.FC = () => {
  const { activeSection, setActiveSection } = useContext(VersionDeliveryCtx);
  const [expanded01, setExpanded01] = useState(true);
  const [expanded02, setExpanded02] = useState(false);
  const [expanded03, setExpanded03] = useState(false);

  const NavItem: React.FC<{ section: string; label: string; indent?: boolean }> = ({ section, label, indent }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`h-9 text-left text-xs rounded-md w-full transition-colors ${
        indent ? 'pl-10' : 'px-2'
      } ${activeSection === section ? 'bg-[#eff6ff] text-[#155dfc]' : 'text-[#191919] hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );

  const SectionHeader: React.FC<{
    label: string;
    expanded: boolean;
    onToggle: () => void;
  }> = ({ label, expanded, onToggle }) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-2 h-9 rounded-md text-xs text-[#191919] hover:bg-gray-50 transition-colors"
    >
      <span>{label}</span>
      {expanded
        ? <ChevronDown size={14} className="text-[#6a7282]" />
        : <ChevronRight size={14} className="text-[#6a7282]" />}
    </button>
  );

  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      <NavItem section="overview" label="版本概括" />

      <div>
        <SectionHeader label="01  版本管理" expanded={expanded01} onToggle={() => setExpanded01(v => !v)} />
        {expanded01 && (
          <div className="flex flex-col gap-0.5">
            <NavItem section="requirements" label="需求管理"        indent />
            <NavItem section="plan"         label="版本计划"        indent />
            <NavItem section="test"         label="体验测试与评估"  indent />
          </div>
        )}
      </div>

      <div>
        <SectionHeader label="02  概要设计与评估" expanded={expanded02} onToggle={() => setExpanded02(v => !v)} />
        {expanded02 && (
          <div className="flex flex-col gap-0.5">
            <NavItem section="outline-design" label="概要设计稿" indent />
            <NavItem section="outline-eval"   label="设计评估"   indent />
          </div>
        )}
      </div>

      <div>
        <SectionHeader label="03  详细设计与评估" expanded={expanded03} onToggle={() => setExpanded03(v => !v)} />
        {expanded03 && (
          <div className="flex flex-col gap-0.5">
            <NavItem section="detail-design"       label="详细设计稿" indent />
            <NavItem section="detail-interaction"  label="交互说明"   indent />
            <NavItem section="detail-visual"       label="视觉规范"   indent />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  Vivian:  '#8B5CF6',
  Jackson: '#3B82F6',
  Andrew:  '#10B981',
  Sun:     '#F59E0B',
};
const Avatar: React.FC<{ src: string; name: string; size?: number }> = ({ src: _src, name, size = 24 }) => {
  const bg = AVATAR_COLORS[name] ?? '#6B7280';
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center text-white font-semibold select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.45 }}
    >
      {initials}
    </div>
  );
};

// ─── Design File Browser ──────────────────────────────────────────────────────
const DesignFileBrowser: React.FC<{
  section: string;
  pathStack: PathEntry[];
  setPathStack: React.Dispatch<React.SetStateAction<PathEntry[]>>;
  onToast: (m: string) => void;
  onOpenCreate: () => void;
  onOpenFile: (file: MockFile) => void;
  extraFiles?: MockFile[];
}> = ({ section, pathStack, setPathStack, onToast, onOpenCreate, onOpenFile, extraFiles = [] }) => {
  const rootFiles = [
    ...extraFiles.filter(file => !file.sectionId || file.sectionId === section),
    ...(FILE_DATA[section] ?? []),
  ];
  const [searchText, setSearchText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => { setSearchText(''); }, [section]);

  const currentFiles = pathStack.length > 0
    ? pathStack[pathStack.length - 1].children
    : rootFiles;

  const filtered = searchText.trim()
    ? currentFiles.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()))
    : currentFiles;

  const navigateInto = (folder: MockFile) => {
    if (folder.type !== 'folder') return;
    setPathStack(prev => [...prev, { id: folder.id, name: folder.name, children: folder.children ?? [] }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-8 pt-4 pb-3 flex items-center justify-between shrink-0">
        {/* Title — current folder or section name */}
        <span className="text-sm font-bold text-[#191919]">
          {pathStack.length > 0 ? pathStack[pathStack.length - 1].name : (SECTION_TITLE[section] ?? section)}
        </span>
        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777]" />
            <input
              type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="搜索文件"
              className="border border-[rgba(25,25,25,0.12)] rounded-full pl-7 pr-3 py-1 text-xs text-[#191919] placeholder:text-[#777] focus:outline-none focus:border-[#1476ff] w-32 transition-colors"
            />
          </div>
          <button
            onClick={() => onToast('新建文件夹功能开发中')}
            className="flex items-center gap-1 border border-[rgba(25,25,25,0.12)] text-[#191919] text-xs px-2.5 py-1 rounded-full hover:bg-gray-50 transition-colors"
          >
            <Plus size={12} /> 新建文件夹
          </button>
          <button
            onClick={() => onToast('上传文件功能开发中')}
            className="flex items-center gap-1 border border-[rgba(25,25,25,0.12)] text-[#191919] text-xs px-2.5 py-1 rounded-full hover:bg-gray-50 transition-colors"
          >
            <Upload size={12} /> 上传
          </button>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1 bg-[#1476ff] text-white text-xs px-2.5 py-1 rounded-full hover:bg-[#1060d0] transition-colors"
          >
            <Plus size={12} /> 创建
          </button>
        </div>
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[#aaa] text-sm gap-2">
            <FolderOpen size={32} className="text-[#ddd]" />
            <span>暂无文件</span>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {filtered.map(file => (
              <div
                key={file.id}
                onMouseEnter={() => setHoveredId(file.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => file.type === 'folder' ? navigateInto(file) : onOpenFile(file)}
                className="flex flex-col rounded-xl border border-[rgba(25,25,25,0.08)] bg-white hover:border-[#1476ff] hover:shadow-[0_4px_12px_0_rgba(20,118,255,0.1)] transition-colors cursor-pointer overflow-hidden group"
              >
                {/* Preview */}
                <div className="relative w-full aspect-[4/3] bg-[#f5f6f7] overflow-hidden">
                  {file.type === 'folder' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Folder size={40} className="text-[#facc15]" fill="#facc15" fillOpacity={0.3} />
                    </div>
                  ) : file.thumbnail ? (
                    <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.type === 'make' ? 'bg-[#f3eeff]' : 'bg-[#e8f0fe]'}`}>
                        <span className={`text-[10px] font-bold ${file.type === 'make' ? 'text-[#6d28d9]' : 'text-[#1476ff]'}`}>
                          {file.type === 'make' ? '.make' : '.pix'}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Hover overlay for files */}
                  {file.type !== 'folder' && hoveredId === file.id && (
                    <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)] flex items-center justify-center gap-2">
                      <span className="text-white text-[10px] font-medium">{file.type === 'make' ? '打开 .make 工作台' : '打开文件'}</span>
                    </div>
                  )}
                  {/* File type badge */}
                  {file.type !== 'folder' && (
                    <div className={`absolute bottom-1.5 right-1.5 text-white text-[10px] font-bold px-1 py-0.5 rounded ${
                      file.type === 'make' ? 'bg-[#6d28d9]' : 'bg-[#1476ff]'
                    }`}>
                      {file.type === 'make' ? '.make' : '.pix'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <div className="text-xs font-medium text-[#191919] truncate">{file.name}</div>
                  <div className="mt-0.5 text-[10px] text-[#999] truncate">
                    {file.type === 'folder'
                      ? `${file.itemCount ?? 0} 个文件`
                      : `${file.author} · ${file.date}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Requirement Detail Panel ──────────────────────────────────────────────────
// ─── Requirement Detail Field helper ──────────────────────────────────────────
const DetailField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs text-[#777] leading-5">{label}</span>
    <div className="text-sm text-[#191919] leading-5">{children}</div>
  </div>
);

const MOCK_LINKED_FILES = [
  { id: 'f1', name: '助手 V1.0设计方案' },
  { id: 'f2', name: '助手 V1.0设计方案' },
];

const RequirementDetailPanel: React.FC<{
  req: Requirement;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Requirement>) => void;
}> = ({ req, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'ux' | 'proposer'>('ux');
  const pm = PRIORITY_MAP[req.priority];

  const handleSuspend = () => {};
  const handleDelete = () => {};

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/30 z-[100]"
        onClick={onClose}
      />

      {/* Floating panel */}
      <motion.div
        initial={{ x: 1200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 1200, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        className="fixed right-0 top-0 h-full w-[1200px] bg-white z-[101] flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.12)]"
      >
        {/* Title row */}
        <div className="px-8 pt-8 pb-5 shrink-0 flex items-start justify-between border-b border-[rgba(25,25,25,0.06)]">
          <h2 className="text-xl font-bold text-[#101828] leading-tight">{req.name}</h2>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#191919] transition-colors p-1 mt-0.5 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* ── Left column ── */}
          <div className="w-[400px] shrink-0 border-r border-[rgba(25,25,25,0.08)] overflow-y-auto scroll-hover">
            <div className="px-8 py-7 flex flex-col gap-7">

              {/* UX需求详情 */}
              <section>
                <h3 className="text-[16px] font-bold text-[#101828] mb-5">UX需求详情</h3>
                {/* Unified 2-column grid — all field rows share the same column widths */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">

                  {/* 提出人 | 需求创建时间 */}
                  <div>
                    <p className="text-xs text-[#777] mb-2">提出人</p>
                    <div className="flex items-center gap-2">
                      <Avatar src={req.proposer.avatar} name={req.proposer.name} size={20} />
                      <span className="text-sm text-[#191919]">{req.proposer.name}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#777] mb-2">需求创建时间</p>
                    <span className="text-sm text-[#191919]">2025年9月20日</span>
                  </div>

                  {/* 责任人 | 设计交付时间 */}
                  <div>
                    <p className="text-xs text-[#777] mb-2">责任人</p>
                    <div className="flex items-center gap-2">
                      <Avatar src={req.owner.avatar} name={req.owner.name} size={20} />
                      <span className="text-sm text-[#191919]">{req.owner.name}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#777] mb-2">设计交付时间</p>
                    <span className="text-sm text-[#191919]">{req.deliveryDate}</span>
                  </div>

                  {/* 工作量 | 优先级 */}
                  <div>
                    <p className="text-xs text-[#777] mb-2">工作量</p>
                    <span className="text-sm text-[#191919]">23.1 人天</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#777] mb-2">优先级</p>
                    <span className={`text-sm font-medium ${pm.text}`}>{pm.label}</span>
                  </div>

                </div>

                {/* 标签 + 备注 — full width below the grid */}
                <div className="flex flex-col gap-5 mt-5">
                  <div>
                    <p className="text-xs text-[#777] mb-2">标签</p>
                    <div className="flex flex-wrap gap-1.5">
                      {req.tags && req.tags !== '--'
                        ? req.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="bg-[#f0f0f0] text-[#191919] text-xs px-2.5 py-1 rounded-full">{tag}</span>
                          ))
                        : <span className="bg-[#f0f0f0] text-[#191919] text-xs px-2.5 py-1 rounded-full">待串讲</span>
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#777] mb-2">备注</p>
                    <p className="text-sm text-[#191919] leading-relaxed">{req.description || '暂无'}</p>
                  </div>
                </div>
              </section>

              <div className="h-px bg-[rgba(25,25,25,0.08)]" />

              {/* 需求描述 */}
              <section>
                <h3 className="text-[16px] font-bold text-[#101828] mb-4">需求描述</h3>
                <div className="bg-[#f6f6f6] rounded-xl h-[160px]" />
              </section>

              {/* 附件 */}
              <section>
                <h3 className="text-[16px] font-bold text-[#101828] mb-4">附件</h3>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 border border-[rgba(25,25,25,0.12)] rounded-lg px-3 py-1.5 text-sm text-[#191919] hover:bg-[#f5f5f5] transition-colors whitespace-nowrap">
                    <Upload size={12} />
                    文件上传
                  </button>
                  <span className="text-xs text-[#999]">不超过20m，支持ppt, doc, xls, pdf, jpg, png</span>
                </div>
              </section>

            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex-1 overflow-y-auto scroll-hover px-8 py-7 flex flex-col gap-7 min-w-0">

            {/* UCD活动里程碑 — tabs */}
            <section>
              <h3 className="text-[16px] font-bold text-[#101828] mb-4">UCD活动里程碑</h3>
              <div className="bg-[#ebebeb] inline-flex p-[3px] rounded-lg gap-0.5">
                <button
                  onClick={() => setActiveTab('ux')}
                  className={`px-5 py-[5px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'ux' ? 'bg-white text-[#1476ff] shadow-sm' : 'text-[#888]'}`}
                >
                  UX设计
                </button>
                <button
                  onClick={() => setActiveTab('proposer')}
                  className={`px-5 py-[5px] rounded-md text-xs transition-colors whitespace-nowrap ${activeTab === 'proposer' ? 'bg-white text-[#1476ff] font-medium shadow-sm' : 'text-[#888]'}`}
                >
                  提出人
                </button>
              </div>
            </section>

            {/* 关联文件 — same grid cols as tables so "操作" aligns */}
            <section>
              <h3 className="text-[16px] font-bold text-[#101828] mb-4">关联文件</h3>
              {/* Header row */}
              <div className="grid grid-cols-[1fr_88px] gap-x-4 pb-1 text-xs text-[#999]">
                <span>文件</span>
                <span className="text-right">操作</span>
              </div>
              <div className="flex flex-col">
                {MOCK_LINKED_FILES.map(file => (
                  <div key={file.id} className="grid grid-cols-[1fr_88px] gap-x-4 items-center py-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-[18px] h-[18px] bg-[#155dfc] rounded-[3px] flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold leading-none">P</span>
                      </div>
                      <span className="text-sm text-[#191919] truncate">{file.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-[#1476ff] justify-end">
                      <button className="hover:opacity-70 transition-opacity">查看</button>
                      <button className="hover:opacity-70 transition-opacity">更多</button>
                    </div>
                  </div>
                ))}
                <button className="flex items-center gap-1.5 text-sm text-[#1476ff] hover:opacity-70 transition-opacity self-start mt-3">
                  <Plus size={12} />新增
                </button>
              </div>
            </section>

            {/* 设计评审 — table */}
            <section>
              <h3 className="text-[16px] font-bold text-[#101828] mb-4">设计评审</h3>
              <div className="flex flex-col">
                {/* Header */}
                <div className="grid grid-cols-[1fr_96px_68px_68px_88px] gap-x-4 pb-2 text-xs text-[#999]">
                  <span>UCD活动</span>
                  <span>需求创建时间</span>
                  <span>评审结论</span>
                  <span>关联文件</span>
                  <span className="text-right">操作</span>
                </div>
                {/* Row */}
                <div className="grid grid-cols-[1fr_96px_68px_68px_88px] gap-x-4 py-2 text-sm text-[#191919]">
                  <span>-</span><span>-</span><span>-</span><span>-</span><span className="text-right">-</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button className="flex items-center gap-1.5 text-sm text-[#1476ff] hover:opacity-70 transition-opacity self-start">
                  <Plus size={12} />提交线上评审
                </button>
                <button className="flex items-center gap-1.5 text-sm text-[#1476ff] hover:opacity-70 transition-opacity self-start">
                  <Plus size={12} />提交线下评审结论
                </button>
              </div>
            </section>

            {/* 设计归档文件 */}
            <section>
              <h3 className="text-[16px] font-bold text-[#101828] mb-4">设计归档文件</h3>
              <div className="flex flex-col">
                {/* Header */}
                <div className="grid grid-cols-[1fr_96px_72px_56px_88px] gap-x-4 pb-2 text-xs text-[#999]">
                  <span>关联文件</span>
                  <span>归档时间</span>
                  <span>来源</span>
                  <span>备注</span>
                  <span className="text-right">操作</span>
                </div>
                <div className="pt-1" />
              </div>
              <button className="flex items-center gap-1.5 text-sm text-[#1476ff] hover:opacity-70 transition-opacity self-start mt-1">
                <Plus size={12} />新增
              </button>
            </section>

          </div>
        </div>

        {/* Bottom action bar */}
        <div className="px-8 py-4 border-t border-[rgba(25,25,25,0.06)] shrink-0 flex justify-end gap-3">
          <button
            onClick={handleSuspend}
            className="border border-[rgba(25,25,25,0.12)] px-6 py-2 rounded-lg text-sm text-[#191919] hover:bg-[#f5f5f5] transition-colors"
          >
            挂起
          </button>
          <button
            onClick={handleDelete}
            className="border border-[rgba(25,25,25,0.12)] px-6 py-2 rounded-lg text-sm text-[#191919] hover:bg-[#f5f5f5] transition-colors"
          >
            删除
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ─── Add Requirement Modal ─────────────────────────────────────────────────────
const AddRequirementModal: React.FC<{
  onClose: () => void;
  onAdd: (req: Requirement) => void;
}> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Requirement['priority']>('medium');
  const [owner, setOwner] = useState('Vivian');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { setError('需求名称不能为空'); return; }
    const ownerUser = USERS.find(u => u.name === owner) ?? USERS[0];
    onAdd({
      id: `r${Date.now()}`,
      name: name.trim(),
      proposer: USERS[0], // Vivian = current user
      owner: ownerUser,
      reviewStatus: '--',
      deliveryDate: date || '--',
      priority,
      tags: tags.trim() || '--',
      description: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-2xl shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] w-[480px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[rgba(25,25,25,0.08)]">
          <span className="text-sm font-semibold text-[#191919]">新增需求</span>
          <button onClick={onClose} className="text-[#777] hover:text-[#191919] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-xs text-[#777] mb-1.5 block">
              需求名称 <span className="text-[#c82020]">*</span>
            </label>
            <input
              type="text" value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="输入需求名称"
              autoFocus
              className={`w-full border rounded-lg px-3 py-2 text-sm text-[#191919] focus:outline-none transition-colors ${
                error ? 'border-[#c82020]' : 'border-[rgba(25,25,25,0.12)] focus:border-[#1476ff]'
              }`}
            />
            {error && <p className="text-[10px] text-[#c82020] mt-1">{error}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs text-[#777] mb-2 block">优先级</label>
            <div className="flex items-center gap-4">
              {(['high', 'medium', 'low'] as const).map(p => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                  <div
                    onClick={() => setPriority(p)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      priority === p ? 'border-[#1476ff]' : 'border-[#ddd]'
                    }`}
                  >
                    {priority === p && <div className="w-2 h-2 rounded-full bg-[#1476ff]" />}
                  </div>
                  <span className={`text-xs ${PRIORITY_MAP[p].text}`}>{PRIORITY_MAP[p].label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="text-xs text-[#777] mb-1.5 block">负责人</label>
            <div className="relative">
              <select
                value={owner} onChange={e => setOwner(e.target.value)}
                className="w-full border border-[rgba(25,25,25,0.12)] rounded-lg px-3 py-2 text-sm text-[#191919] focus:outline-none focus:border-[#1476ff] transition-colors appearance-none bg-white pr-8"
              >
                {USERS.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] pointer-events-none" />
            </div>
          </div>

          {/* Delivery Date */}
          <div>
            <label className="text-xs text-[#777] mb-1.5 block">交付时间</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input
                type="text" value={date} onChange={e => setDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="w-full border border-[rgba(25,25,25,0.12)] rounded-lg pl-8 pr-3 py-2 text-sm text-[#191919] focus:outline-none focus:border-[#1476ff] transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-[#777] mb-1.5 block">标签 <span className="text-[#bbb]">（可选，逗号分隔）</span></label>
            <input
              type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="如：UX优化, 监控"
              className="w-full border border-[rgba(25,25,25,0.12)] rounded-lg px-3 py-2 text-sm text-[#191919] focus:outline-none focus:border-[#1476ff] transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-[rgba(25,25,25,0.12)] text-[#191919] text-sm px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#1476ff] text-white text-sm px-4 py-2 rounded-full hover:bg-[#1060d0] transition-colors"
          >
            新增
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Inline Editable Status ───────────────────────────────────────────────────
const InlineStatusCell: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const statusColor: Record<string, string> = {
    '评审通过': 'bg-[rgba(33,157,72,0.12)] text-[#197837]',
    '评审驳回': 'bg-[rgba(200,32,32,0.12)] text-[#c82020]',
    '待评审':   'bg-[rgba(234,179,8,0.12)] text-[#854d0e]',
    '评审中':   'bg-[rgba(20,118,255,0.1)] text-[#1476ff]',
    '--':       'text-[#999]',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`text-xs px-2 py-0.5 rounded-full transition-colors hover:opacity-80 ${statusColor[value] ?? 'text-[#999]'}`}
      >
        {value}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[rgba(25,25,25,0.1)] rounded-xl shadow-[0_4px_16px_0_rgba(0,0,0,0.1)] py-1 min-w-[110px]">
          {REVIEW_STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left text-xs px-3 py-1.5 hover:bg-gray-50 transition-colors ${value === opt ? 'text-[#1476ff]' : 'text-[#191919]'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Inline Editable Tags ─────────────────────────────────────────────────────
const InlineTagsCell: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => { onChange(draft || '--'); setEditing(false); };

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="text-xs border border-[#1476ff] rounded px-1.5 py-0.5 focus:outline-none w-28"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-[#191919] hover:text-[#1476ff] transition-colors text-left group flex items-center gap-1"
      title="点击编辑标签"
    >
      <span>{value === '--' ? <span className="text-[#bbb]">--</span> : value}</span>
    </button>
  );
};

// ─── Requirements Table ───────────────────────────────────────────────────────
const RequirementsTable: React.FC<{
  requirements: Requirement[];
  activeReqId: string | null;
  onAIClick: (req: Requirement) => void;
  onDetailClick: (req: Requirement) => void;
  onUpdateReq: (id: string, patch: Partial<Requirement>) => void;
}> = ({ requirements, activeReqId, onAIClick, onDetailClick, onUpdateReq }) => (
  <table className="w-full border-collapse table-fixed">
    <thead>
      <tr className="bg-[#f5f5f5] rounded-lg">
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap rounded-l-lg w-[220px]">需求名称</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap w-[100px]">提出人</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap w-[100px]">责任人</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap w-[110px]">评审状态</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap w-[120px]">设计交付时间</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap w-[60px]">优先级</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap">标签</th>
        <th className="text-left text-xs font-normal text-[#535353] px-3 py-2.5 whitespace-nowrap rounded-r-lg w-[70px]">操作</th>
      </tr>
    </thead>
    <tbody>
      {requirements.map(req => {
        const p = PRIORITY_MAP[req.priority];
        const isActive = activeReqId === req.id;
        return (
          <tr key={req.id} className={`border-b border-[rgba(25,25,25,0.04)] transition-colors ${isActive ? 'bg-[#f5f9ff]' : 'hover:bg-[#fafafa]'}`}>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-2 group">
                <span className="text-sm font-medium text-[#1476ff] whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:underline" onClick={() => onDetailClick(req)}>
                  {req.name}
                </span>
                <button
                  onClick={() => onAIClick(req)}
                  title="AI 智能推荐"
                  className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#155dfc] text-white'
                      : 'bg-[#eff6ff] text-[#155dfc] opacity-0 group-hover:opacity-100 hover:bg-[#155dfc] hover:text-white'
                  }`}
                >
                  <Sparkles size={10} />推荐
                </button>
              </div>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-[#191919] whitespace-nowrap">
                <Avatar src={req.proposer.avatar} name={req.proposer.name} size={20} />
                {req.proposer.name}
              </div>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-[#191919] whitespace-nowrap">
                <Avatar src={req.owner.avatar} name={req.owner.name} size={20} />
                {req.owner.name}
              </div>
            </td>
            <td className="px-3 py-2.5">
              <InlineStatusCell
                value={req.reviewStatus}
                onChange={v => onUpdateReq(req.id, { reviewStatus: v })}
              />
            </td>
            <td className="px-3 py-2.5 text-xs text-[#191919] whitespace-nowrap">{req.deliveryDate}</td>
            <td className="px-3 py-2.5">
              <span className={`${p.bg} ${p.text} text-xs px-2 py-0.5 rounded-full inline-flex items-center justify-center min-w-[28px] text-center whitespace-nowrap`}>
                {p.label}
              </span>
            </td>
            <td className="px-3 py-2.5">
              <InlineTagsCell
                value={req.tags}
                onChange={v => onUpdateReq(req.id, { tags: v })}
              />
            </td>
            <td className="px-3 py-2.5">
              <button
                onClick={() => onDetailClick(req)}
                className="text-xs text-[#1476ff] hover:underline whitespace-nowrap"
              >
                查看详情
              </button>
            </td>
          </tr>
        );
      })}
      {requirements.length === 0 && (
        <tr>
          <td colSpan={8} className="px-3 py-10 text-center text-sm text-[#aaa]">暂无匹配的需求</td>
        </tr>
      )}
    </tbody>
  </table>
);

// ─── AI Recommend Panel ───────────────────────────────────────────────────────
const LINE_DELAYS = [300, 900, 1600, 2300, 3000, 3700];

const AIRecommendPanel: React.FC<{
  req: Requirement;
  onClose: () => void;
  onAssetClick?: (assetId: string) => void;
  onOpenVibe?: (req: Requirement) => void;
}> = ({ req, onClose, onAssetClick, onOpenVibe }) => {
  const config = AI_CONFIG[req.id];
  const [visibleLines, setVisibleLines] = useState(0);
  const [showAssets, setShowAssets] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const timersRef = useRef<number[]>([]);

  const runAnimation = useCallback(() => {
    setVisibleLines(0); setShowAssets(false); setElapsedSec(0);
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    const delays = LINE_DELAYS.slice(0, config.monologue.length);
    delays.forEach((delay, i) => {
      const t = window.setTimeout(() => setVisibleLines(i + 1), delay);
      timersRef.current.push(t);
    });
    const done = window.setTimeout(() => setShowAssets(true), delays[delays.length - 1] + 500);
    timersRef.current.push(done);
  }, [config.monologue.length]);

  useEffect(() => { runAnimation(); return () => timersRef.current.forEach(clearTimeout); }, [req.id, runKey]);

  useEffect(() => {
    if (showAssets) return;
    const iv = window.setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [showAssets, runKey]);

  return (
    <AIAssistantPanel
      title="AI 智能推荐"
      onClose={onClose}
      userMessage={`帮我找一下与${req.name}相关的设计资产`}
      thinking={{
        lines: config.monologue,
        visibleCount: visibleLines,
        isDone: showAssets,
        elapsedSec,
        keywords: config.keywords,
      }}
      assets={showAssets ? config.assets.map(asset => ({
        id: asset.id,
        title: asset.title,
        subtitle: `${asset.author} · ${asset.uploadTime}`,
        score: asset.score,
        thumbnail: asset.thumbnail ? (
          <div className="w-[64px] h-[46px] rounded-[8px] shrink-0 overflow-hidden">
            <img src={asset.thumbnail} alt={asset.title} className="w-full h-full object-cover" />
          </div>
        ) : undefined,
        onClick: () => onAssetClick?.(asset.id),
      })) : []}
      resultLabel={showAssets ? `发现 ${config.assets.length} 项相关设计资产` : undefined}
      actions={showAssets ? [
        { label: '重新匹配', icon: <RefreshCw size={12} />, onClick: () => setRunKey(k => k + 1), tone: 'default' },
        {
          label: '用 Vibe Design 探索',
          icon: <Sparkles size={12} />,
          onClick: () => onOpenVibe?.(req),
          tone: 'primary' as const,
        },
      ] : []}
    />
  );
};

// ─── Create Selection Modal ───────────────────────────────────────────────────
type CreateType = 'online' | 'vibe' | 'make';
const CREATE_OPTIONS: Array<{ id: CreateType; icon: React.ReactNode; title: string; desc: string }> = [
  {
    id: 'online',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#e8f0fe" />
        <rect x="7" y="9" width="14" height="10" rx="2" stroke="#1476ff" strokeWidth="1.5" />
        <path d="M10 13h8M10 16h5" stroke="#1476ff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '在线设计',
    desc: '使用矢量绘图工具进行精细化 UI 编辑',
  },
  {
    id: 'vibe',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#f3eeff" />
        <path d="M9 19l3-6 3 4 2-3 2 5" stroke="#9059c4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="9" r="2" fill="#9059c4" fillOpacity="0.5" />
        <circle cx="9" cy="10" r="1.5" fill="#1476ff" fillOpacity="0.5" />
      </svg>
    ),
    title: 'Vibe Design',
    desc: '通过 AI 对话快速生成 Demo 设计方案',
  },
  {
    id: 'make',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#eef2ff" />
        <path d="M9 18l3.2-8 2.2 5 2.1-3 2.5 6" stroke="#6d28d9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="9" r="1.75" fill="#8b5cf6" fillOpacity="0.45" />
        <circle cx="9" cy="10" r="1.5" fill="#1476ff" fillOpacity="0.5" />
      </svg>
    ),
    title: 'Octo Make',
    desc: '通过 AI 对话生成研究、原型与创意视频内容',
  },
];

const CreateSelectionModal: React.FC<{
  onClose: () => void;
  onConfirm: (type: CreateType) => void;
}> = ({ onClose, onConfirm }) => {
  const [selected, setSelected] = useState<CreateType>('vibe');

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-2xl shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] w-[480px] overflow-hidden"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        transition={{ duration: 0.18 }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgba(25,25,25,0.08)]">
          <h3 className="text-sm font-semibold text-[#191919]">选择创建类型</h3>
          <p className="text-xs text-[#777] mt-0.5">选择适合当前任务的工具</p>
        </div>

        {/* Options */}
        <div className="px-6 py-5 flex gap-3">
          {CREATE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors text-center ${
                selected === opt.id
                  ? 'border-[#1476ff] bg-[#f0f5ff]'
                  : 'border-[rgba(25,25,25,0.08)] hover:border-[rgba(25,25,25,0.18)] bg-white'
              }`}
            >
              {opt.icon}
              <div>
                <div className={`text-xs font-semibold mb-0.5 ${selected === opt.id ? 'text-[#1476ff]' : 'text-[#191919]'}`}>
                  {opt.title}
                </div>
                <div className="text-[10px] text-[#777] leading-relaxed">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-[rgba(25,25,25,0.12)] text-[#191919] text-xs px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="bg-[#1476ff] text-white text-xs px-4 py-2 rounded-full hover:bg-[#1060d0] transition-colors"
          >
            确认创建
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Content ─────────────────────────────────────────────────────────────
export const VersionDeliveryContent: React.FC<{ onAssetClick?: (assetId: string) => void }> = ({ onAssetClick }) => {
  const { activeSection, setActiveSection } = useContext(VersionDeliveryCtx);

  // Requirements state
  const [requirements, setRequirements] = useState<Requirement[]>(INITIAL_REQUIREMENTS);
  const [onlyMine, setOnlyMine] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [detailReq, setDetailReq] = useState<Requirement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVibeDesign, setShowVibeDesign] = useState(false);
  const [showOctoBuild, setShowOctoBuild] = useState(false);
  const [vibeReq, setVibeReq] = useState<Requirement | null>(null);
  const [vibeFiles, setVibeFiles] = useState<MockFile[]>([]);
  const [makeFiles, setMakeFiles] = useState<MockFile[]>([]);
  const [activeMakeFileId, setActiveMakeFileId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2500);
  };

  const [fileBrowserPath, setFileBrowserPath] = useState<PathEntry[]>([]);
  const activeMakeFile = makeFiles.find(file => file.id === activeMakeFileId) ?? null;

  // Close panels and reset file browser path when section changes
  useEffect(() => {
    setDetailReq(null);
    setFileBrowserPath([]);
  }, [activeSection]);

  const handleAIClick = (req: Requirement) => {
    setVibeReq(req);
    setShowVibeDesign(true);
  };

  const handleDetailClick = (req: Requirement) => {
    setDetailReq(prev => (prev?.id === req.id ? null : req));
  };

  const handleUpdateReq = (id: string, patch: Partial<Requirement>) => {
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    // Keep detail panel in sync
    setDetailReq(prev => prev?.id === id ? { ...prev, ...patch } as Requirement : prev);
  };

  const handleAddReq = (req: Requirement) => {
    setRequirements(prev => [...prev, req]);
    showToast(`需求「${req.name}」已新增`);
  };

  const createDateLabel = () => new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');

  const handleOpenFile = useCallback((file: MockFile) => {
    if (file.type === 'make') {
      setActiveMakeFileId(file.id);
      setShowOctoBuild(true);
      return;
    }
    showToast(`已打开 ${file.name}.${file.type}`);
  }, []);

  const handleCreateMakeFile = useCallback(() => {
    const newFile: MockFile = {
      id: `make-${Date.now()}`,
      name: 'Octo Make 草稿',
      type: 'make',
      author: 'Me',
      date: createDateLabel(),
      sectionId: activeSection,
      workspace: { deliverables: [], activeWorkflow: null, readyWorkflows: [], msgs: [] },
    };
    setMakeFiles(prev => [newFile, ...prev]);
    setActiveMakeFileId(newFile.id);
    setShowOctoBuild(true);
  }, [activeSection]);

  const updateMakeWorkspace = useCallback((fileId: string, workspace: OctoBuildState) => {
    setMakeFiles(prev => prev.map(file => (
      file.id === fileId ? { ...file, workspace } : file
    )));
  }, []);

  // Filter for requirements view
  const filteredRequirements = requirements.filter(req => {
    if (onlyMine && req.owner.name !== CURRENT_USER && req.proposer.name !== CURRENT_USER) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      return req.name.toLowerCase().includes(q) || req.tags.toLowerCase().includes(q);
    }
    return true;
  });

  const isRequirements = activeSection === 'requirements';

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Breadcrumb — single source of truth for all navigation */}
      {(() => {
        const sectionSegs = (SECTION_BREADCRUMB[activeSection] ?? activeSection).split(' / ');
        const allSegs = ['项目空间', '版本交付', ...sectionSegs, ...fileBrowserPath.map(p => p.name)];
        return (
          <div className="px-8 pt-3 pb-0 shrink-0 flex items-center gap-1 flex-wrap">
            {allSegs.map((seg, i) => {
              const isLast = i === allSegs.length - 1;
              // 项目空间 (i=0): not navigable in demo
              // 版本交付 (i=1): resets to requirements
              // section group segments (i=2, middle): not navigable
              // section leaf (i = 2 + sectionSegs.length - 1): navigable if we're inside a subfolder
              // pathStack segments (i > 1 + sectionSegs.length): navigable via fileBrowserPath
              const isSectionLeaf = i === 1 + sectionSegs.length && fileBrowserPath.length > 0;
              const isPathEntry = i > 1 + sectionSegs.length;
              const isClickable = !isLast && (i === 1 || isSectionLeaf || isPathEntry);

              const handleClick = () => {
                if (i === 1) { setActiveSection('requirements'); }
                else if (isSectionLeaf) { setFileBrowserPath([]); }
                else if (isPathEntry) {
                  const pathIdx = i - (2 + sectionSegs.length);
                  setFileBrowserPath(prev => prev.slice(0, pathIdx + 1));
                }
              };

              return (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs text-[#ccc]">/</span>}
                  {isLast ? (
                    <span className="text-xs text-[#aaa]">{seg}</span>
                  ) : (
                    <button
                      onClick={isClickable ? handleClick : undefined}
                      className={`text-xs transition-colors ${
                        isClickable
                          ? 'text-[#aaa] hover:text-[#4a5565] cursor-pointer'
                          : 'text-[#aaa] cursor-default'
                      }`}
                    >
                      {seg}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        );
      })()}

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          {isRequirements ? (
            <>
              {/* Tab bar + actions */}
              <div className="px-8 pt-3 flex items-center justify-between shrink-0">
                <div className="border-b-2 border-[#101828] pb-[14px]">
                  <span className="text-sm font-bold text-[#101828]">
                    全部需求（{filteredRequirements.length}）
                  </span>
                </div>
                <div className="flex items-center gap-3 pb-[14px]">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#191919]">
                    <span
                      onClick={() => setOnlyMine(v => !v)}
                      className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm transition-colors cursor-pointer shrink-0 ${
                        onlyMine ? 'bg-[#1476ff] border-[#1476ff]' : 'border-[rgba(119,119,119,0.47)]'
                      }`}
                    >
                      {onlyMine && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    仅显示与我相关
                  </label>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#1476ff] text-white text-xs px-3 py-1.5 rounded-full hover:bg-[#1060d0] transition-colors"
                  >
                    新增需求
                  </button>
                  <button
                    onClick={() => showToast('导出功能开发中')}
                    className="border border-[rgba(25,25,25,0.12)] text-[#191919] text-xs px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    导出
                  </button>
                  <button
                    onClick={() => showToast('导入功能开发中')}
                    className="border border-[rgba(25,25,25,0.12)] text-[#191919] text-xs px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    导入
                  </button>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777]" />
                    <input
                      type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
                      placeholder="搜索需求"
                      className="border border-[rgba(25,25,25,0.12)] rounded-full pl-7 pr-3 py-1.5 text-xs text-[#191919] placeholder:text-[#777] focus:outline-none focus:border-[#1476ff] w-36 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto px-8 pt-2 pb-6">
                <RequirementsTable
                  requirements={filteredRequirements}
                  activeReqId={detailReq?.id ?? null}
                  onAIClick={handleAIClick}
                  onDetailClick={handleDetailClick}
                  onUpdateReq={handleUpdateReq}
                />
              </div>
            </>
          ) : (
            <DesignFileBrowser
              section={activeSection}
              pathStack={fileBrowserPath}
              setPathStack={setFileBrowserPath}
              onToast={showToast}
              onOpenCreate={() => setShowCreateModal(true)}
              onOpenFile={handleOpenFile}
              extraFiles={[...makeFiles, ...vibeFiles]}
            />
          )}
        </div>

        {/* Right panels */}
        <AnimatePresence>
          {detailReq && (
            <RequirementDetailPanel
              key={`detail-${detailReq.id}`}
              req={detailReq}
              onClose={() => setDetailReq(null)}
              onUpdate={handleUpdateReq}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Add Requirement Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddRequirementModal
            key="add-modal"
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddReq}
          />
        )}
      </AnimatePresence>

      {/* Create Selection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSelectionModal
            key="create-modal"
            onClose={() => setShowCreateModal(false)}
            onConfirm={(type) => {
              setShowCreateModal(false);
              if (type === 'vibe') {
                setShowVibeDesign(true);
              } else if (type === 'make') {
                handleCreateMakeFile();
              } else {
                showToast('功能开发中，敬请期待');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Vibe Design */}
      <AnimatePresence>
        {showVibeDesign && (
          <VibeDesign
            key="vibe-design"
            onClose={() => { setShowVibeDesign(false); setVibeReq(null); }}
            onToast={showToast}
            onSaveAndClose={(title) => {
              const newFile: MockFile = {
                id: `vibe-${Date.now()}`,
                name: title,
                type: 'pix',
                author: 'Me',
                date: createDateLabel(),
                sectionId: activeSection,
              };
              setVibeFiles(prev => [newFile, ...prev]);
            }}
            initialRequirement={vibeReq ? { name: vibeReq.name, description: vibeReq.description } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Octo Build */}
      <AnimatePresence>
        {showOctoBuild && activeMakeFile && (
          <motion.div
            key={`octo-build-${activeMakeFile.id}`}
            className="fixed inset-0 z-[520] bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <OctoBuild
              key={activeMakeFile.id}
              initialState={activeMakeFile.workspace}
              onStateChange={(workspace) => updateMakeWorkspace(activeMakeFile.id, workspace)}
              onBack={() => { setShowOctoBuild(false); setActiveMakeFileId(null); }}
              title={activeMakeFile.name}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-[#191919] text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none whitespace-nowrap"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
