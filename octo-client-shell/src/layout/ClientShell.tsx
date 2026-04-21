import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart2,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  FolderOpen,
  Heart,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Users,
  Wand2,
  X,
  MessageSquarePlus,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { OctoBuild, type OctoBuildState } from '../pages/OctoBuild';
import {
  loadSkillMarketItems,
  saveSkillMarketItems,
  SKILL_MARKET_CATEGORIES,
  SKILL_MARKET_UPDATED_EVENT,
  type SkillMarketCategory,
  type SkillMarketItem,
} from '../data/skill-market-data';
import unionIcon from '../assets/icons/union.svg';

const KNOWLEDGE_MANAGEMENT_ICON_MASK_URL = 'https://www.figma.com/api/mcp/asset/866fcb9e-d7f0-4f57-a4b3-c341c6c37b84';
const KNOWLEDGE_MANAGEMENT_ICON_FILL_URL = 'https://www.figma.com/api/mcp/asset/dbb0e47f-7de5-4caf-bb6f-f4b1c5395ee0';

export type NavKey = 'chat' | 'skill_market' | 'knowledge_base';

// ── Project Selection Types ─────────────────────────────────────────────────
type Domain = '终端' | 'ICT' | '质量与流程IT' | '华为云' | '制造部' | 'EBG（UCD)' | 'GTS' | '2012实验室';

interface ProductLine {
  name: string;
  products: string[];
}

interface DomainData {
  name: Domain;
  productLines: ProductLine[];
}

const DOMAIN_DATA: DomainData[] = [
  {
    name: '终端',
    productLines: [
      { name: '手机', products: ['Mate系列', 'P系列', 'nova系列'] },
      { name: '平板', products: ['MatePad Pro', 'MatePad', 'MatePad SE'] },
    ],
  },
  {
    name: 'ICT',
    productLines: [
      { name: 'ICT战略与Marketing', products: ['战略洞察', '市场分析'] },
      { name: '计算', products: ['Devkit', 'BMC', '鲲鹏昇腾社区', 'OpenGauss DataKit'] },
      { name: '核心网', products: ['5G核心网', '4G核心网'] },
      { name: '公开', products: ['公开产品1', '公开产品2'] },
      { name: '无线', products: ['5G基站', '4G基站'] },
      { name: '数据存储/智能协作', products: ['OceanStor', 'IdeaHub'] },
      { name: '光产品线', products: ['光传输', '光接入'] },
      { name: '数通产品线', products: ['交换机', '路由器'] },
    ],
  },
  {
    name: '质量与流程IT',
    productLines: [
      { name: '质量管理', products: ['质量平台', '测试工具'] },
    ],
  },
  {
    name: '华为云',
    productLines: [
      { name: '基础服务', products: ['ECS', 'OBS', 'VPC'] },
    ],
  },
  {
    name: '制造部',
    productLines: [
      { name: '智能制造', products: ['MES', 'WMS'] },
    ],
  },
  {
    name: 'EBG（UCD)',
    productLines: [
      { name: '企业业务', products: ['企业路由', '企业交换'] },
    ],
  },
  {
    name: 'GTS',
    productLines: [
      { name: '技术服务', products: ['交付平台', '运维工具'] },
    ],
  },
  {
    name: '2012实验室',
    productLines: [
      { name: '前沿技术', products: ['AI平台', '芯片设计'] },
    ],
  },
];

const VERSIONS = ['V_261230', 'V_251230'];

const SKILL_CATEGORY_UI: Record<SkillMarketCategory, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  accentBg: string;
}> = {
  '高保真设计': { icon: LayoutGrid, accent: '#1476ff', accentBg: '#eff6ff' },
  '用户研究': { icon: Users, accent: '#6d28d9', accentBg: '#f5f3ff' },
  '视觉设计': { icon: Wand2, accent: '#c2410c', accentBg: '#fff7ed' },
  '竞品分析': { icon: BarChart2, accent: '#0f766e', accentBg: '#ecfeff' },
  '趋势报告': { icon: RefreshCw, accent: '#1d4ed8', accentBg: '#eff6ff' },
  '体验评估': { icon: Heart, accent: '#059669', accentBg: '#ecfdf5' },
};

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: number;
  preview: string;
  workspace: OctoBuildState;
}

interface KnowledgeItem {
  id: string;
  title: string;
  group: '领域专业知识' | '团队知识';
  type: 'doc' | 'report' | 'faq' | 'spec';
  size: string;
  updatedAt: number;
  snippet: string;
  format?: 'pdf' | 'md' | 'txt' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'json';
  owner?: string;
  tags?: string[];
  content?: string;
  sections: Array<{ title: string; content: string }>;
}

const KNOWLEDGE_GROUPS: Array<KnowledgeItem['group']> = ['领域专业知识', '团队知识'];
const KNOWLEDGE_UPLOAD_ACCEPT = '.pdf,.md,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.json';
const KNOWLEDGE_FORMATS: Array<NonNullable<KnowledgeItem['format']>> = [
  'pdf', 'md', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'json',
];

const STORAGE_KEYS = {
  nav: 'octo.client.activeNav',
  navCollapsed: 'octo.client.navCollapsed',
  navWidth: 'octo.client.navWidth',
  conversations: 'octo.client.conversations',
  currentConversationId: 'octo.client.currentConversationId',
} as const;

const NAV_WIDTH_DEFAULT = 240;
const NAV_WIDTH_MIN = 220;
const NAV_WIDTH_MAX = 360;
const MAIN_MIN_WIDTH = 520;

export const DEFAULT_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'kb-1',
    title: '算子开发工具行业术语库',
    group: '领域专业知识',
    type: 'doc',
    format: 'md',
    owner: '算法平台组',
    tags: ['术语', '算子', '推理', '编译'],
    size: '2.4 MB',
    updatedAt: 1744041600000,
    snippet: '沉淀算子、编译、调度、推理部署等高频概念，统一团队在行业表达上的口径。',
    sections: [
      {
        title: '使用说明',
        content: '本术语库整理了算子开发工具相关的核心概念，供产品、设计与研发在调研、方案评审和对外交流时统一引用。遇到概念分歧时请优先查阅本文档。\n\n文档每季度由算法平台组与产品组联合复核，新增术语须附来源（论文或官方文档）和适用版本范围。',
      },
      {
        title: '核心术语',
        content: '- 算子注册：将自定义算子实现注册到框架图引擎，使其可在模型描述中被引用和调度\n- 图优化（Graph Optimization）：在计算图上执行算子融合、常量折叠、冗余删除等优化，减少调度和显存开销\n- 推理编排（Inference Orchestration）：多算子子图拆分、设备分配与执行序列的运行时调度策略\n- 编译后端：将高层算子描述翻译为目标硬件可执行指令，通常对应特定芯片驱动或汇编器\n- 算子融合（Op Fusion）：将多个相邻算子合并为单个 Kernel 以减少显存读写和 Launch 开销\n- 量化感知训练（QAT）：在训练阶段模拟量化噪声，相比训练后量化有更低精度损失',
      },
      {
        title: '常见误用',
        content: '- "推理"与"训练"不可混用：推理指已训练模型在新数据上的前向计算，不包含反向传播\n- "算子"不等于"层"：一个网络层（如 Transformer Block）可能由多个算子组成\n- "编译"与"转换"有区别：转换是格式迁移，编译是面向目标硬件的代码生成和优化',
      },
      {
        title: '对外表达建议',
        content: '调研报告和竞品分析引用平台能力时，应使用本文档标准术语而非厂商自定义命名。评审 PPT 和需求文档中建议添加术语注释，方便跨职能团队理解。',
      },
    ],
  },
  {
    id: 'kb-2',
    title: '企业级 AI 开发平台竞品研究',
    group: '领域专业知识',
    type: 'report',
    size: '5.8 MB',
    updatedAt: 1743955200000,
    snippet: '对比主流算子开发工具在功能闭环、体验路径和生态兼容上的差异。',
    sections: [
      { title: '文档摘要', content: '围绕华为云、阿里云及开源工具链，对比其算子开发、编译调试、测试验证与部署上线能力。' },
      { title: '关键结论', content: '头部平台更强于工程闭环与云上集成，开源方案更强于灵活性与可定制性，中型团队更需要一站式引导体验。' },
    ],
  },
  {
    id: 'kb-3',
    title: '模型训练与推理链路说明',
    group: '领域专业知识',
    type: 'spec',
    size: '1.9 MB',
    updatedAt: 1743696000000,
    snippet: '说明从数据准备、训练编排到推理部署的标准链路，便于需求讨论时对齐范围。',
    sections: [
      { title: '文档摘要', content: '描述训练前数据处理、模型构建、算子编译、推理验证和上线部署的完整流程，用于界定平台功能边界。' },
      { title: '适用场景', content: '适用于产品需求梳理、体验设计串联和研发阶段职责划分，帮助团队快速理解全链路上下文。' },
    ],
  },
  {
    id: 'kb-4',
    title: '行业客户场景问答集',
    group: '领域专业知识',
    type: 'faq',
    size: '860 KB',
    updatedAt: 1743523200000,
    snippet: '整理政府、制造、科研客户在算子开发平台选型中的共性问题与回答模板。',
    sections: [
      { title: '文档摘要', content: '汇总不同行业客户在平台采购、迁移、兼容、成本和交付方式上的高频问题，形成统一问答模板。' },
      { title: '使用建议', content: '可用于售前支持、演示准备和方案评审，快速提炼客户关心的业务价值与技术风险。' },
    ],
  },
  {
    id: 'kb-5',
    title: '团队设计评审记录',
    group: '团队知识',
    type: 'doc',
    size: '1.2 MB',
    updatedAt: 1743350400000,
    snippet: '汇总近期设计评审反馈，覆盖信息架构、动效节奏和状态提示等问题。',
    sections: [
      { title: '文档摘要', content: '记录近期关键页面和工作流的评审结论，帮助团队回看设计决策的来龙去脉。' },
      { title: '重点内容', content: '包含信息密度控制、任务导向布局、组件对齐和反馈文案等问题，便于后续迭代统一处理。' },
    ],
  },
  {
    id: 'kb-6',
    title: '交互规范协作手册',
    group: '团队知识',
    type: 'spec',
    size: '3.1 MB',
    updatedAt: 1743177600000,
    snippet: '统一团队在交互命名、组件状态和跨端体验上的设计标准。',
    sections: [
      { title: '文档摘要', content: '定义按钮、菜单、弹窗、工作流切换与系统反馈等交互规范，是团队协作的基础文档。' },
      { title: '协作规则', content: '明确命名方式、交互动线、异常态处理与交付约束，减少设计和研发在实现时的偏差。' },
    ],
  },
  {
    id: 'kb-7',
    title: '周会纪要与版本复盘',
    group: '团队知识',
    type: 'doc',
    size: '940 KB',
    updatedAt: 1743004800000,
    snippet: '沉淀每周版本推进、阻塞事项与复盘结论，帮助项目成员快速接续上下文。',
    sections: [
      { title: '文档摘要', content: '按周归档项目推进进展、问题清单与复盘结论，帮助新成员快速补齐上下文。' },
      { title: '内容结构', content: '包含需求进度、设计变更、研发风险与下一步行动项，可作为项目同步和回顾依据。' },
    ],
  },
  {
    id: 'kb-8',
    title: '项目交付模板合集',
    group: '团队知识',
    type: 'faq',
    size: '1.6 MB',
    updatedAt: 1742832000000,
    snippet: '包含需求说明、研究交付、设计走查和验收文档模板，提升团队输出一致性。',
    sections: [
      { title: '文档摘要', content: '沉淀需求文档、研究报告、交互说明、视觉稿评审和验收单等常用模板，方便团队直接复用。' },
      { title: '使用建议', content: '推荐在项目启动、方案汇报和版本交付时优先选用标准模板，减少沟通成本与结构遗漏。' },
    ],
  },
  {
    id: 'kb-9',
    title: 'GPU 算子性能基准数据集',
    group: '领域专业知识',
    type: 'report',
    size: '4.3 MB',
    updatedAt: 1744300800000,
    format: 'xlsx',
    owner: '性能工程组',
    tags: ['性能基准', 'GPU', '算子优化', 'Benchmark'],
    snippet: '收录卷积、注意力、归一化等核心算子在 A100、昇腾和消费级 GPU 的基准表现，用于评估优化收益。',
    sections: [
      { title: '数据范围', content: '覆盖 68 个高频算子、7 种 batch 配置与 4 类模型拓扑，包含延迟、吞吐、显存占用等指标。' },
      { title: '使用方式', content: '建议作为方案评估和发布验收的统一基线，避免仅依据单场景结果做性能承诺。' },
      { title: '更新节奏', content: '每月按驱动版本和编译参数重新采样，当前版本已同步 2026 Q1 数据。' },
    ],
  },
  {
    id: 'kb-10',
    title: '多模态 Agent 产品路线图',
    group: '领域专业知识',
    type: 'spec',
    size: '2.7 MB',
    updatedAt: 1744214400000,
    format: 'pptx',
    owner: '产品规划组',
    tags: ['路线图', '多模态', 'Agent', '季度规划'],
    snippet: '规划多模态输入、任务编排、可解释反馈与企业权限体系四条主线，明确季度里程碑和验收口径。',
    sections: [
      { title: '阶段目标', content: 'Q2 完成多模态输入统一协议；Q3 打通编排可视化与工具市场；Q4 聚焦企业级权限治理。' },
      { title: '关键风险', content: '跨模态一致性、上下文窗口成本和企业审计要求是主要风险，需并行治理。' },
      { title: '协作依赖', content: '依赖模型平台、权限中台、前端设计系统三方并行投入，需提前锁定接口版本。' },
    ],
  },
  {
    id: 'kb-11',
    title: '模型压缩与蒸馏实践手册',
    group: '领域专业知识',
    type: 'doc',
    size: '1.8 MB',
    updatedAt: 1744128000000,
    format: 'md',
    owner: '算法平台组',
    tags: ['蒸馏', '量化', '剪枝', '推理优化'],
    snippet: '整理量化、剪枝、蒸馏与混合精度策略在不同业务场景下的收益区间与工程代价。',
    sections: [
      { title: '推荐策略', content: '实时场景优先 INT8 量化 + 结构化剪枝，离线场景可增加蒸馏阶段追求更高压缩比。' },
      { title: '收益评估', content: '文档内提供统一测评表，要求同时记录精度回归、吞吐提升和稳定性回归。' },
      { title: '落地清单', content: '附带压缩流程 checklist，覆盖数据集选择、校准集构建、线上回滚与灰度发布。' },
    ],
  },
  {
    id: 'kb-12',
    title: '数据合规与安全评审清单',
    group: '领域专业知识',
    type: 'faq',
    size: '960 KB',
    updatedAt: 1744041600000,
    format: 'json',
    owner: '合规治理组',
    tags: ['合规', '安全', 'PII', '审计'],
    snippet: '覆盖采集、标注、训练、推理、导出各阶段的合规审查问题，支持售前与交付阶段复用。',
    sections: [
      { title: '审查维度', content: '含数据来源合法性、个人信息处理、第三方依赖、跨境传输和审计留痕五大维度。' },
      { title: '高频问题', content: '明确“可匿名即匿名、可脱敏即脱敏”原则，并附业务场景示例与判定边界。' },
      { title: '输出模板', content: '提供审查记录 JSON 模板，支持自动汇总项目级风险与责任人。' },
    ],
  },
  {
    id: 'kb-13',
    title: '用户访谈原始摘录与标签集',
    group: '团队知识',
    type: 'doc',
    size: '1.4 MB',
    updatedAt: 1743955200000,
    format: 'txt',
    owner: '用户研究组',
    tags: ['用户访谈', '原始语料', '标签体系'],
    snippet: '沉淀 32 位目标用户的访谈摘录与标签标注结果，便于产品与设计快速定位证据链。',
    sections: [
      { title: '样本构成', content: '涵盖企业采购决策者、技术负责人、一线执行者三类角色，地区和行业分布均衡。' },
      { title: '标签说明', content: '标签分为需求动机、风险顾虑、决策路径、价值感知四层，支持跨项目复用。' },
      { title: '注意事项', content: '引用原始语料需去标识化，外部分享仅可使用聚合结论和匿名片段。' },
    ],
  },
  {
    id: 'kb-14',
    title: '项目风险台账与应对策略',
    group: '团队知识',
    type: 'report',
    size: '2.2 MB',
    updatedAt: 1743868800000,
    format: 'xls',
    owner: 'PMO',
    tags: ['风险管理', '里程碑', '应对策略'],
    snippet: '按里程碑维护技术、资源、需求、上线四类风险，附预警阈值与升级机制。',
    sections: [
      { title: '风险分级', content: '采用 P0-P3 分级，定义触发条件、响应时效与升级路径，统一跨团队处置语义。' },
      { title: '跟踪机制', content: '每周例会更新状态，红色风险必须在 48 小时内形成应对动作与负责人。' },
      { title: '复盘方式', content: '版本结束后按“触发原因-处置动作-结果评估-改进项”四步形成闭环复盘。' },
    ],
  },
  {
    id: 'kb-15',
    title: '发布演示脚本与讲解手册',
    group: '团队知识',
    type: 'spec',
    size: '1.1 MB',
    updatedAt: 1743782400000,
    format: 'docx',
    owner: '解决方案组',
    tags: ['演示脚本', '讲解话术', '发布会'],
    snippet: '统一发布演示中的故事线、话术节奏和风险兜底策略，确保不同讲解人输出一致。',
    sections: [
      { title: '演示结构', content: '建议采用“问题-方案-效果-落地”四段式结构，每段控制在 2-3 分钟。' },
      { title: '话术规范', content: '提供核心价值表达、技术细节解释与常见追问应答模板，避免术语歧义。' },
      { title: '演练建议', content: '上线前至少完成两轮彩排并记录时间轴，确保关键环节可在中断后快速恢复。' },
    ],
  },
  {
    id: 'kb-16',
    title: '跨团队协作接口对齐记录',
    group: '团队知识',
    type: 'faq',
    size: '740 KB',
    updatedAt: 1743696000000,
    format: 'md',
    owner: '工程效率组',
    tags: ['接口对齐', '协作机制', '研发流程'],
    snippet: '记录产品、设计、前后端与测试之间的接口对齐规则、变更通知机制和冲突处理方式。',
    sections: [
      { title: '版本协议', content: '接口文档采用语义化版本管理，破坏性变更需提前一个迭代通知并提供兼容期。' },
      { title: '协作流程', content: '需求评审后 24 小时内完成字段冻结，设计稿与接口 mock 同步更新。' },
      { title: '冲突处理', content: '优先按业务影响范围定级，再由对应 Owner 发起三方会快速决策。' },
    ],
  },
];

// ── Image Gallery Mock Data ──────────────────────────────────────────────────
interface GalleryImage {
  id: string;
  title: string;
  author: string;
  likes: number;
  views: number;
  aspect: 'tall' | 'wide' | 'square';
  gradient: string;
  category: string;
  tags: string[];
  prompt?: string;
}

export const GALLERY_CATEGORIES = ['全部', '人物写真', '概念艺术', '建筑空间', '科技未来', '自然风景', '插画风格', '产品创意'];

export const MOCK_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 'img-1',
    title: '霓虹都市漫游者',
    author: '视觉炼金术',
    likes: 1284,
    views: 8920,
    aspect: 'tall',
    gradient: 'linear-gradient(135deg, #0d0d2b 0%, #1a0533 40%, #2d1b69 70%, #0f3460 100%)',
    category: '科技未来',
    tags: ['赛博朋克', '人物', '霓虹'],
    prompt: 'Cyberpunk city wanderer, neon reflections on wet pavement, cinematic lighting',
  },
  {
    id: 'img-2',
    title: '云端悬浮建筑群',
    author: '建筑梦境',
    likes: 876,
    views: 5430,
    aspect: 'wide',
    gradient: 'linear-gradient(160deg, #a8edea 0%, #fed6e3 50%, #d4e8ff 100%)',
    category: '建筑空间',
    tags: ['建筑', '概念设计', '云端'],
    prompt: 'Floating architectural complex above clouds, pastel sky, ultra-detailed render',
  },
  {
    id: 'img-3',
    title: '星际穿越的少女',
    author: '幻境绘事',
    likes: 2103,
    views: 14200,
    aspect: 'square',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)',
    category: '人物写真',
    tags: ['人物', '星空', '奇幻'],
    prompt: 'Young woman standing in cosmic gateway, stars and nebulae, ethereal atmosphere',
  },
  {
    id: 'img-4',
    title: '机械生命体',
    author: '代码雕塑家',
    likes: 1567,
    views: 9800,
    aspect: 'tall',
    gradient: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%)',
    category: '科技未来',
    tags: ['机械', '生命体', '概念艺术'],
    prompt: 'Biomechanical entity awakening, chrome and organic fusion, hyperrealistic detail',
  },
  {
    id: 'img-5',
    title: '竹林间的静谧茶室',
    author: '东方意境',
    likes: 698,
    views: 4210,
    aspect: 'wide',
    gradient: 'linear-gradient(150deg, #134e5e 0%, #71b280 50%, #c8f4c8 100%)',
    category: '建筑空间',
    tags: ['东方', '竹林', '茶室'],
    prompt: 'Serene Japanese tea house in bamboo forest, morning mist, soft green light',
  },
  {
    id: 'img-6',
    title: '数字化人体解构',
    author: '像素解剖师',
    likes: 3241,
    views: 21500,
    aspect: 'square',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 40%, #4facfe 100%)',
    category: '概念艺术',
    tags: ['数字艺术', '解构', '人体'],
    prompt: 'Digital deconstruction of human form, particle dispersion, vibrant data streams',
  },
  {
    id: 'img-7',
    title: '冰川雪峰晨曦',
    author: '天涯摄影师',
    likes: 912,
    views: 6780,
    aspect: 'tall',
    gradient: 'linear-gradient(180deg, #e0f7fa 0%, #80deea 30%, #4dd0e1 60%, #00acc1 100%)',
    category: '自然风景',
    tags: ['雪山', '冰川', '晨光'],
    prompt: 'Majestic glacier peaks at dawn, golden hour light, pristine snow texture',
  },
  {
    id: 'img-8',
    title: '极简主义耳机设计',
    author: '产品炼金师',
    likes: 1124,
    views: 7650,
    aspect: 'square',
    gradient: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 40%, #bdbdbd 100%)',
    category: '产品创意',
    tags: ['产品设计', '极简', '耳机'],
    prompt: 'Minimalist premium headphone design, studio product photography, white background',
  },
  {
    id: 'img-9',
    title: '森林精灵插画',
    author: '幻彩绘手',
    likes: 1876,
    views: 12300,
    aspect: 'tall',
    gradient: 'linear-gradient(145deg, #1b4332 0%, #2d6a4f 30%, #52b788 60%, #d8f3dc 100%)',
    category: '插画风格',
    tags: ['插画', '精灵', '森林'],
    prompt: 'Forest spirit illustration, luminous particles, studio ghibli inspired, detailed foliage',
  },
  {
    id: 'img-10',
    title: '未来感都市航拍',
    author: '空域观察者',
    likes: 734,
    views: 4890,
    aspect: 'wide',
    gradient: 'linear-gradient(160deg, #2c3e50 0%, #3498db 50%, #2980b9 100%)',
    category: '科技未来',
    tags: ['城市', '航拍', '未来'],
    prompt: 'Aerial view of future metropolis, clean energy infrastructure, dusk lighting',
  },
  {
    id: 'img-11',
    title: '潮流街头摄影',
    author: '街头故事书',
    likes: 2567,
    views: 17800,
    aspect: 'square',
    gradient: 'linear-gradient(135deg, #fc5c7d 0%, #6a3093 50%, #232526 100%)',
    category: '人物写真',
    tags: ['街头', '潮流', '人物'],
    prompt: 'Street fashion portrait, golden hour, urban background, editorial photography style',
  },
  {
    id: 'img-12',
    title: '熔岩与冰川的边界',
    author: '地球诗人',
    likes: 1089,
    views: 7230,
    aspect: 'wide',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 30%, #ffd700 50%, #4ecdc4 80%, #1a535c 100%)',
    category: '自然风景',
    tags: ['熔岩', '冰川', '对比'],
    prompt: 'Dramatic contrast where lava meets glacier, Iceland landscape, epic natural phenomenon',
  },
  {
    id: 'img-13',
    title: '量子纠缠视觉化',
    author: '物理幻境',
    likes: 1932,
    views: 13400,
    aspect: 'tall',
    gradient: 'linear-gradient(145deg, #000428 0%, #004e92 50%, #1a1a2e 100%)',
    category: '概念艺术',
    tags: ['量子', '物理', '视觉化'],
    prompt: 'Visual representation of quantum entanglement, glowing particles, deep space background',
  },
  {
    id: 'img-14',
    title: '水晶洞穴探险家',
    author: '地下王国',
    likes: 1445,
    views: 9100,
    aspect: 'square',
    gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 40%, #12c2e9 100%)',
    category: '概念艺术',
    tags: ['水晶洞穴', '探险', '奇幻'],
    prompt: 'Explorer in giant crystal cave, bioluminescent glow, award-winning fantasy illustration',
  },
  {
    id: 'img-15',
    title: '新中式庭院设计',
    author: '院落美学',
    likes: 823,
    views: 5600,
    aspect: 'tall',
    gradient: 'linear-gradient(160deg, #f8e8d0 0%, #e8c9a0 30%, #c9a87c 60%, #8b6914 100%)',
    category: '建筑空间',
    tags: ['中式', '庭院', '设计'],
    prompt: 'New Chinese style courtyard, pebble pathway, traditional architectural elements, soft lighting',
  },
  {
    id: 'img-16',
    title: '橙色狐狸的冬日',
    author: '动物绘集',
    likes: 3124,
    views: 23000,
    aspect: 'square',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 50%, #f7971e 100%)',
    category: '插画风格',
    tags: ['狐狸', '冬天', '插画'],
    prompt: 'Fox in snowy landscape, warm orange tones against cold white, Pixar style illustration',
  },
];

function createEmptyWorkspace(): OctoBuildState {
  return { deliverables: [], activeWorkflow: null, readyWorkflows: [], msgs: [] };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createConversation(title = '新对话'): ConversationItem {
  return {
    id: makeId('conv'),
    title,
    updatedAt: Date.now(),
    preview: '开始你的第一个需求描述',
    workspace: createEmptyWorkspace(),
  };
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures for file:// exports and privacy-restricted contexts.
  }
}

function safeStorageRemove(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures for file:// exports and privacy-restricted contexts.
  }
}

function loadConversations(): ConversationItem[] {
  const parsed = safeParse<ConversationItem[]>(safeStorageGet(STORAGE_KEYS.conversations), []);
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  return parsed;
}

function loadSkills(): SkillMarketItem[] {
  return loadSkillMarketItems();
}

function loadActiveNav(): NavKey {
  const saved = safeStorageGet(STORAGE_KEYS.nav);
  if (saved === 'chat' || saved === 'skill_market' || saved === 'knowledge_base') {
    return saved;
  }
  // Migrate legacy nav keys
  if (saved === 'new_chat' || saved === 'history') return 'chat';
  return 'chat';
}

function loadCurrentConversationId(): string | null {
  return safeStorageGet(STORAGE_KEYS.currentConversationId);
}


function loadNavWidth(): number {
  const saved = Number(safeStorageGet(STORAGE_KEYS.navWidth));
  if (!Number.isFinite(saved)) return NAV_WIDTH_DEFAULT;
  // Migrate legacy width (previous default 300) to the new visual baseline.
  if (saved >= 295 && saved <= 305) return NAV_WIDTH_DEFAULT;
  return Math.min(Math.max(saved, NAV_WIDTH_MIN), NAV_WIDTH_MAX);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatKnowledgeDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildKnowledgeDocumentHtml(item: KnowledgeItem): string {
  const tags = (item.tags ?? []).join('、') || '-';
  const sectionHtml = item.sections.map((section) => (
    `<h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.content || '')}</p>`
  )).join('');

  return [
    `<h1 data-kb-title="true">${escapeHtml(item.title)}</h1>`,
    '<div class="kb-doc-meta">',
    `<p><strong>分组：</strong>${escapeHtml(item.group)}</p>`,
    `<p><strong>文档类型：</strong>${escapeHtml(item.type.toUpperCase())}</p>`,
    `<p><strong>文件格式：</strong>${escapeHtml(item.format?.toUpperCase() ?? '-')}</p>`,
    `<p><strong>文件大小：</strong>${escapeHtml(item.size)}</p>`,
    `<p><strong>更新时间：</strong>${escapeHtml(formatTime(item.updatedAt))}</p>`,
    `<p><strong>负责人：</strong>${escapeHtml(item.owner ?? '-')}</p>`,
    `<p><strong>标签：</strong>${escapeHtml(tags)}</p>`,
    '</div>',
    '<h2>摘要</h2>',
    `<p data-kb-snippet="true">${escapeHtml(item.snippet || '')}</p>`,
    sectionHtml,
  ].join('');
}

function deriveTitle(currentTitle: string, state: OctoBuildState): string {
  if (!currentTitle.startsWith('新对话')) return currentTitle;
  const userMsg = state.msgs.find((msg) => msg.role === 'user');
  if (!userMsg?.text?.trim()) return currentTitle;
  return userMsg.text.trim().replace(/\s+/g, ' ').slice(0, 18);
}

function derivePreview(state: OctoBuildState): string {
  const last = [...state.msgs].reverse().find((msg) => msg.text?.trim());
  if (!last) return '开始你的第一个需求描述';
  return last.text.replace(/\s+/g, ' ').slice(0, 40);
}

function isWorkspaceStateEqual(a: OctoBuildState, b: OctoBuildState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const NAV_ITEMS: Array<{ key: NavKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { key: 'skill_market', label: '技能社区', icon: LayoutGrid },
  { key: 'knowledge_base', label: '知识库', icon: FolderOpen },
];

export interface PendingNav {
  nav: NavKey;
  conversationId?: string;
  knowledgeId?: string;
}

interface ClientShellProps {
  isNavCollapsed: boolean;
  setIsNavCollapsed: (v: boolean) => void;
  pendingNav?: PendingNav | null;
  onNavHandled?: () => void;
  onOpenSearch?: () => void;
  showWindowControls?: boolean;
  onWindowClose?: () => void;
  onWindowMinimize?: () => void;
  onWindowToggleFullscreen?: () => void;
  isWindowFullscreen?: boolean;
  onWindowDragStart?: (event: React.MouseEvent) => void;
}

export function ClientShell({
  isNavCollapsed,
  setIsNavCollapsed,
  pendingNav,
  onNavHandled,
  onOpenSearch,
  showWindowControls = true,
  onWindowClose,
  onWindowMinimize,
  onWindowToggleFullscreen,
  isWindowFullscreen = false,
  onWindowDragStart,
}: ClientShellProps) {
  const [activeNav, setActiveNav] = useState<NavKey>(loadActiveNav);
  const [conversations, setConversations] = useState<ConversationItem[]>(loadConversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(loadCurrentConversationId);
  const [draftWorkspaceState, setDraftWorkspaceState] = useState<OctoBuildState>(() => createEmptyWorkspace());
  const [draftWorkspaceId, setDraftWorkspaceId] = useState<string>(() => makeId('draft'));
  const [navWidth, setNavWidth] = useState<number>(loadNavWidth);
  const [isNavResizing, setIsNavResizing] = useState(false);
  const [skills, setSkills] = useState<SkillMarketItem[]>(loadSkills);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(DEFAULT_KNOWLEDGE);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(DEFAULT_KNOWLEDGE[0]?.id ?? null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const draftLinkedConversationIdRef = useRef<string | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const navResizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const knowledgeUploadInputRef = useRef<HTMLInputElement | null>(null);
  const knowledgeUploadGroupRef = useRef<KnowledgeItem['group'] | null>(null);
  const [knowledgeEnabledMap, setKnowledgeEnabledMap] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(DEFAULT_KNOWLEDGE.map((item) => [item.id, true]));
  });

  const [collapsedKnowledgeGroups, setCollapsedKnowledgeGroups] = useState<Record<KnowledgeItem['group'], boolean>>({
    '领域专业知识': false,
    '团队知识': false,
  });
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<'docs' | 'images' | 'videos' | 'reports'>('docs');
  const [galleryCategory, setGalleryCategory] = useState<string>('全部');
  const [galleryHoverId, setGalleryHoverId] = useState<string | null>(null);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<SkillMarketCategory | '全部技能'>('全部技能');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<SkillMarketItem | null>(null);

  // ── Project Selection State ───────────────────────────────────────────────
  const [selectedDomain, setSelectedDomain] = useState<Domain>('ICT');
  const [selectedProductLine, setSelectedProductLine] = useState<string>('计算');
  const [selectedProduct, setSelectedProduct] = useState<string>('Devkit');
  const [selectedVersion, setSelectedVersion] = useState<string>('V_261230');
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const projectSelectorRef = useRef<HTMLDivElement | null>(null);
  const versionSelectorRef = useRef<HTMLDivElement | null>(null);
  const [projectPanelStyle, setProjectPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);
  const [versionPanelStyle, setVersionPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);

  const getProjectPanelStyle = useCallback(() => {
    const trigger = projectSelectorRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const width = Math.max(320, Math.min(600, viewportWidth - 24));
    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));
    const top = rect.bottom + 8;
    return { left, top, width };
  }, []);

  const updateProjectPanelStyle = useCallback(() => {
    const next = getProjectPanelStyle();
    if (next) setProjectPanelStyle(next);
  }, [getProjectPanelStyle]);

  const getVersionPanelStyle = useCallback(() => {
    const trigger = versionSelectorRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const width = Math.min(320, Math.max(276, viewportWidth - 24));
    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));
    const top = rect.bottom + 8;
    return { left, top, width };
  }, []);

  const updateVersionPanelStyle = useCallback(() => {
    const next = getVersionPanelStyle();
    if (next) setVersionPanelStyle(next);
  }, [getVersionPanelStyle]);

  // Get current domain data
  const currentDomainData = useMemo(() => 
    DOMAIN_DATA.find(d => d.name === selectedDomain) || DOMAIN_DATA[0],
    [selectedDomain]
  );

  // Get current product line data
  const currentProductLineData = useMemo(() =>
    currentDomainData.productLines.find(pl => pl.name === selectedProductLine) || currentDomainData.productLines[0],
    [currentDomainData, selectedProductLine]
  );

  // Handle domain change
  const handleDomainChange = useCallback((domain: Domain) => {
    setSelectedDomain(domain);
    const domainData = DOMAIN_DATA.find(d => d.name === domain);
    if (domainData && domainData.productLines.length > 0) {
      setSelectedProductLine(domainData.productLines[0].name);
      if (domainData.productLines[0].products.length > 0) {
        setSelectedProduct(domainData.productLines[0].products[0]);
      }
    }
  }, []);

  // Handle product line change
  const handleProductLineChange = useCallback((productLine: string) => {
    setSelectedProductLine(productLine);
    const plData = currentDomainData.productLines.find(pl => pl.name === productLine);
    if (plData && plData.products.length > 0) {
      setSelectedProduct(plData.products[0]);
    }
  }, [currentDomainData]);

  // Click outside to close selectors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is inside project selector button or portal panel
      const isInsideProjectSelector = projectSelectorRef.current?.contains(target) || 
        (target as Element)?.closest?.('[data-project-selector-panel]') != null;
      // Check if click is inside version selector button or portal panel
      const isInsideVersionSelector = versionSelectorRef.current?.contains(target) ||
        (target as Element)?.closest?.('[data-version-selector-panel]') != null;
      if (!isInsideProjectSelector) {
        setShowProjectSelector(false);
      }
      if (!isInsideVersionSelector) {
        setShowVersionSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!showProjectSelector) return;
    updateProjectPanelStyle();
    const handleUpdate = () => updateProjectPanelStyle();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [showProjectSelector, updateProjectPanelStyle]);

  useLayoutEffect(() => {
    if (!showVersionSelector) return;
    updateVersionPanelStyle();
    const handleUpdate = () => updateVersionPanelStyle();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [showVersionSelector, updateVersionPanelStyle]);

  useLayoutEffect(() => {
    if (showProjectSelector) updateProjectPanelStyle();
    if (showVersionSelector) updateVersionPanelStyle();
  }, [navWidth, isNavCollapsed, showProjectSelector, showVersionSelector, updateProjectPanelStyle, updateVersionPanelStyle]);

  const clampNavWidth = useCallback((targetWidth: number) => {
    const containerWidth = shellRef.current?.clientWidth ?? window.innerWidth;
    const maxByContainer = Math.max(NAV_WIDTH_MIN, containerWidth - MAIN_MIN_WIDTH);
    const maxWidth = Math.min(NAV_WIDTH_MAX, maxByContainer);
    return Math.min(Math.max(targetWidth, NAV_WIDTH_MIN), maxWidth);
  }, []);

  useEffect(() => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (!toast) return;
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  // Handle external navigation from GlobalSearchModal
  useEffect(() => {
    if (!pendingNav) return;
    if (pendingNav.nav === 'chat' && pendingNav.conversationId) {
      setCurrentConversationId(pendingNav.conversationId);
      setActiveNav('chat');
    } else if (pendingNav.nav === 'knowledge_base' && pendingNav.knowledgeId) {
      setSelectedKnowledgeId(pendingNav.knowledgeId);
      setActiveNav('knowledge_base');
    } else {
      setActiveNav(pendingNav.nav);
    }
    onNavHandled?.();
  }, [pendingNav, onNavHandled]);

  useEffect(() => {
    if (currentConversationId && !conversations.some((conv) => conv.id === currentConversationId)) {
      setCurrentConversationId(conversations[0]?.id ?? null);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.nav, activeNav);
  }, [activeNav]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.navWidth, String(navWidth));
  }, [navWidth]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.conversations, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      safeStorageSet(STORAGE_KEYS.currentConversationId, currentConversationId);
      return;
    }
    safeStorageRemove(STORAGE_KEYS.currentConversationId);
  }, [currentConversationId]);

  useEffect(() => {
    const syncSkills = () => setSkills(loadSkillMarketItems());
    window.addEventListener(SKILL_MARKET_UPDATED_EVENT, syncSkills as EventListener);
    window.addEventListener('storage', syncSkills);
    return () => {
      window.removeEventListener(SKILL_MARKET_UPDATED_EVENT, syncSkills as EventListener);
      window.removeEventListener('storage', syncSkills);
    };
  }, []);

  useEffect(() => {
    if (!selectedSkillDetail) return;
    const next = skills.find((skill) => skill.id === selectedSkillDetail.id) ?? null;
    setSelectedSkillDetail(next);
  }, [skills, selectedSkillDetail]);

  useEffect(() => {
    if (!shellRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setNavWidth((prev) => clampNavWidth(prev));
    });
    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, [clampNavWidth]);

  useEffect(() => {
    if (!isNavResizing) return;

    const handlePointerMove = (event: MouseEvent) => {
      if (!navResizeStateRef.current) return;
      const deltaX = event.clientX - navResizeStateRef.current.startX;
      setNavWidth(clampNavWidth(navResizeStateRef.current.startWidth + deltaX));
    };

    const stopResize = () => {
      navResizeStateRef.current = null;
      setIsNavResizing(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [clampNavWidth, isNavResizing]);

  const currentConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversationId) ?? null,
    [conversations, currentConversationId],
  );

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );

  const installedSkillsCount = useMemo(
    () => skills.filter((skill) => skill.enabled).length,
    [skills],
  );

  const visibleSkills = useMemo(() => {
    const q = skillSearchQuery.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchesCategory = skillCategoryFilter === '全部技能' || skill.category === skillCategoryFilter;
      const matchesQuery = !q
        || skill.name.toLowerCase().includes(q)
        || skill.description.toLowerCase().includes(q)
        || skill.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [skillCategoryFilter, skillSearchQuery, skills]);

  const closeSkillDetail = useCallback(() => {
    setSelectedSkillDetail(null);
  }, []);

  const groupedKnowledgeItems = useMemo(() => {
    return KNOWLEDGE_GROUPS.map((group) => ({
      group,
      items: knowledgeItems
        .filter((item) => item.group === group)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  }, [knowledgeItems]);

  const selectedKnowledgeItem = useMemo(
    () => knowledgeItems.find((item) => item.id === selectedKnowledgeId) ?? knowledgeItems[0] ?? null,
    [knowledgeItems, selectedKnowledgeId],
  );

  useEffect(() => {
    if (!knowledgeItems.length) {
      setSelectedKnowledgeId(null);
      return;
    }
    if (!selectedKnowledgeId || !knowledgeItems.some((item) => item.id === selectedKnowledgeId)) {
      setSelectedKnowledgeId(knowledgeItems[0].id);
    }
  }, [knowledgeItems, selectedKnowledgeId]);

  const handleKnowledgeUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const preferredGroup = knowledgeUploadGroupRef.current;

    const created = files.map((file, index) => {
      const rawExt = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
      const format = (KNOWLEDGE_FORMATS.includes(rawExt as NonNullable<KnowledgeItem['format']>)
        ? rawExt
        : 'txt') as NonNullable<KnowledgeItem['format']>;
      const title = file.name.replace(/\.[^/.]+$/, '') || `上传文档 ${index + 1}`;
      const group = preferredGroup ?? (index % 2 === 0 ? '领域专业知识' : '团队知识');

      const createdItem: KnowledgeItem = {
        id: makeId('kb_upload'),
        title,
        group,
        type: group === '领域专业知识' ? 'report' : 'doc',
        size: formatFileSize(file.size),
        updatedAt: Date.now() + index,
        format,
        owner: '你',
        tags: ['上传文档', format.toUpperCase(), '待整理'],
        snippet: `已上传文件《${file.name}》（示意）。当前版本仅提供知识卡片创建与可编辑预览，不解析文件正文。`,
        sections: [
          { title: '来源信息', content: `来源文件：${file.name}\n文件类型：${format.toUpperCase()}\n导入时间：${formatTime(Date.now())}` },
          { title: '知识摘要（可编辑）', content: '请在这里补充该文档的核心内容、结论与可复用信息。' },
          { title: '行动建议（可编辑）', content: '请补充下一步动作、负责人和交付时间。' },
        ],
      };
      createdItem.content = buildKnowledgeDocumentHtml(createdItem);
      return createdItem;
    });

    setKnowledgeItems((prev) => [...created, ...prev]);
    setKnowledgeEnabledMap((prev) => {
      const next = { ...prev };
      created.forEach((item) => {
        next[item.id] = true;
      });
      return next;
    });
    setSelectedKnowledgeId(created[0]?.id ?? null);
    setToast(`已上传 ${created.length} 份知识（示意）`);
    knowledgeUploadGroupRef.current = null;
    event.target.value = '';
  }, []);

  const handleKnowledgeUploadClick = useCallback((group: KnowledgeItem['group']) => {
    knowledgeUploadGroupRef.current = group;
    knowledgeUploadInputRef.current?.click();
  }, []);

  const toggleKnowledgeEnabled = useCallback((id: string) => {
    setKnowledgeEnabledMap((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  const toggleKnowledgeGroupCollapse = useCallback((group: KnowledgeItem['group']) => {
    setCollapsedKnowledgeGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);


  const handleNavClick = useCallback((nav: NavKey) => {
    setActiveNav(nav);
  }, []);

  const handleNewChat = useCallback(() => {
    draftLinkedConversationIdRef.current = null;
    setDraftWorkspaceState(createEmptyWorkspace());
    setDraftWorkspaceId(makeId('draft'));
    setCurrentConversationId(null);
    setActiveNav('chat');
  }, []);

  const handleConversationClick = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setActiveNav('chat');
  }, []);

  const handleDeleteConversation = useCallback((conversationId: string) => {
    const confirmDelete = window.confirm('确认删除该历史对话吗？');
    if (!confirmDelete) return;

    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    if (draftLinkedConversationIdRef.current === conversationId) {
      draftLinkedConversationIdRef.current = null;
    }
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
    setToast('会话已删除');
  }, [currentConversationId]);

  const handleRenameSubmit = useCallback((conversationId: string) => {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      setEditingConversationId(null);
      setEditingTitle('');
      return;
    }
    setConversations((prev) => prev.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      return { ...conversation, title: nextTitle, updatedAt: Date.now() };
    }));
    setEditingConversationId(null);
    setEditingTitle('');
  }, [editingTitle]);

  const updateCurrentWorkspace = useCallback((state: OctoBuildState) => {
    const hasUserInput = state.msgs.some((msg) => msg.role === 'user' && Boolean(msg.text?.trim()));

    if (!currentConversationId) {
      setDraftWorkspaceState(state);
      if (!hasUserInput) return;

      const linkedId = draftLinkedConversationIdRef.current;
      if (!linkedId) {
        // Promote the draft to a real conversation — reuse draftWorkspaceId as the
        // conversation id so OctoBuild's workspaceId prop stays stable across the
        // transition. Changing workspaceId would trigger OctoBuild's hydration
        // effect and wipe liveWorkflow, causing the input-then-blank bug.
        const baseTitle = `新对话 ${conversations.length + 1}`;
        const nextTitle = deriveTitle(baseTitle, state);
        const nextPreview = derivePreview(state);
        const seededConversation: ConversationItem = {
          id: draftWorkspaceId,
          title: nextTitle,
          preview: nextPreview,
          updatedAt: Date.now(),
          workspace: state,
        };
        draftLinkedConversationIdRef.current = seededConversation.id;
        setCurrentConversationId(seededConversation.id);
        setConversations((prev) => [seededConversation, ...prev].sort((a, b) => b.updatedAt - a.updatedAt));
        return;
      }

      setConversations((prev) => {
        const next = prev.map((conversation) => {
          if (conversation.id !== linkedId) return conversation;
          const nextTitle = deriveTitle(conversation.title, state);
          const nextPreview = derivePreview(state);
          const didChange =
            !isWorkspaceStateEqual(conversation.workspace, state)
            || conversation.title !== nextTitle
            || conversation.preview !== nextPreview;
          if (!didChange) return conversation;
          return {
            ...conversation,
            title: nextTitle,
            preview: nextPreview,
            updatedAt: Date.now(),
            workspace: state,
          };
        });
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      return;
    }

    setConversations((prev) => {
      const next = prev.map((conversation) => {
        if (conversation.id !== currentConversationId) return conversation;
        const nextTitle = deriveTitle(conversation.title, state);
        const nextPreview = derivePreview(state);
        const didChange =
          !isWorkspaceStateEqual(conversation.workspace, state)
          || conversation.title !== nextTitle
          || conversation.preview !== nextPreview;

        if (!didChange) return conversation;

        return {
          ...conversation,
          title: nextTitle,
          preview: nextPreview,
          updatedAt: Date.now(),
          workspace: state,
        };
      });
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, [currentConversationId, conversations.length, draftWorkspaceId]);

  const toggleSkill = useCallback((skillId: string) => {
    setSkills((prev) => {
      const next = prev.map((skill) => (
        skill.id === skillId ? { ...skill, enabled: !skill.enabled } : skill
      ));
      // Persist outside render/update flow to avoid StrictMode double-invoke side effects.
      setTimeout(() => saveSkillMarketItems(next), 0);
      return next;
    });
  }, []);


  const handleToggleNav = useCallback(() => {
    const next = !isNavCollapsed;
    setIsNavCollapsed(next);
    safeStorageSet(STORAGE_KEYS.navCollapsed, next ? '1' : '0');
  }, [isNavCollapsed, setIsNavCollapsed]);

  const handleStartNavResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isNavCollapsed || event.button !== 0) return;
    event.preventDefault();
    navResizeStateRef.current = { startX: event.clientX, startWidth: navWidth };
    setIsNavResizing(true);
  }, [isNavCollapsed, navWidth]);

  const renderWorkspace = (conversation: ConversationItem | null) => {
    const workspaceId = conversation?.id ?? draftWorkspaceId;
    const workspaceTitle = conversation?.title ?? '新对话';
    const initialState = conversation?.workspace ?? draftWorkspaceState;
    return (
      <OctoBuild
        embedded
        workspaceId={workspaceId}
        title={workspaceTitle}
        initialState={initialState}
        onStateChange={updateCurrentWorkspace}
      />
    );
  };

  return (
    <div
      ref={shellRef}
      className="relative h-full w-full overflow-hidden flex"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
      }}
    >
      {/* Sidebar */}
      <aside
        className={`shrink-0 flex flex-col transition-[width] overflow-visible ${
          isNavResizing ? 'duration-0' : 'duration-200'
        }`}
        style={{
          width: isNavCollapsed ? 56 : navWidth,
          background: 'rgba(255, 252, 255, 0)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        {showWindowControls && (
          <div
            className={`h-[40px] shrink-0 flex items-center ${isNavCollapsed ? 'justify-center px-[8px]' : 'px-[16px]'}`}
            onMouseDown={onWindowDragStart}
          >
            <div className="flex items-center gap-[9px]" onMouseDown={(event) => event.stopPropagation()}>
              <button
                onClick={onWindowClose}
                className="w-[14px] h-[14px] rounded-full bg-[#ff736a] border border-[rgba(0,0,0,0.1)] shrink-0 hover:brightness-90 active:brightness-75 transition-[filter,opacity] group relative"
                title="关闭"
                aria-label="关闭"
              >
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[#6e0000] leading-none" style={{ fontSize: 9 }}>✕</span>
              </button>
              <button
                onClick={onWindowMinimize}
                className="w-[14px] h-[14px] rounded-full bg-[#febc2e] border border-[rgba(0,0,0,0.1)] shrink-0 hover:brightness-90 active:brightness-75 transition-[filter,opacity] group relative"
                title="最小化"
                aria-label="最小化"
              >
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[#6e4600] leading-none" style={{ fontSize: 9 }}>—</span>
              </button>
              <button
                onClick={onWindowToggleFullscreen}
                className="w-[14px] h-[14px] rounded-full bg-[#19c332] border border-[rgba(0,0,0,0.1)] shrink-0 hover:brightness-90 active:brightness-75 transition-[filter,opacity] group relative"
                title={isWindowFullscreen ? '还原' : '全屏'}
                aria-label={isWindowFullscreen ? '还原' : '全屏'}
              >
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[#004d00] leading-none" style={{ fontSize: 8 }}>
                  {isWindowFullscreen ? '⊙' : '⤢'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Brand */}
        {!isNavCollapsed && (
          <div className={`flex items-center gap-[10px] px-[16px] pb-[14px] shrink-0 ${showWindowControls ? 'pt-[14px]' : 'pt-[22px]'}`}>
            <img src={unionIcon} alt="" aria-hidden="true" className="shrink-0 w-[30px] h-[30px]" />
            <span className="font-semibold text-[20px] text-[#191919] leading-normal">Octo AI</span>
          </div>
        )}

        {!isNavCollapsed && (
          <div className="px-[12px] pb-[12px] shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full h-[32px] rounded-[8px] px-[12px] flex items-center justify-between text-[12px] text-[rgba(0,0,0,0.6)] hover:bg-[rgba(255,255,255,0.72)] transition-colors"
              style={{ background: 'rgba(255, 255, 255, 0.50)' }}
              aria-label="搜索对话和文件"
            >
              <span>搜索对话和文件</span>
              <span>Enter</span>
            </button>
          </div>
        )}

        {/* Project context card + Nav items */}
        <div className="shrink-0 overflow-visible">
          {/* Project context card */}
          {!isNavCollapsed && (
            <div className="px-[12px] pb-[12px] shrink-0 overflow-visible">
              <div className="bg-[#f2f2f2] border border-[rgba(25,25,25,0.06)] rounded-[12px] w-full overflow-visible">
                {/* Project selector */}
                <div 
                  className="relative overflow-visible"
                  ref={projectSelectorRef}
                >
                  <button
                    onClick={() => {
                      setShowProjectSelector((prev) => {
                        const next = !prev;
                        if (next) {
                          const nextStyle = getProjectPanelStyle();
                          if (nextStyle) setProjectPanelStyle(nextStyle);
                        }
                        return next;
                      });
                    }}
                    className="w-full flex items-center gap-[12px] p-[12px] hover:bg-[rgba(0,0,0,0.035)] transition-colors rounded-t-[12px]"
                  >
                    <FolderOpen size={16} className="shrink-0 text-[#191919]" />
                    <div className="flex flex-col flex-1 min-w-0 gap-[4px] text-left">
                      <span className="text-[14px] text-[#191919] leading-normal">{selectedProduct}</span>
                      <span className="text-[12px] text-[rgba(25,25,25,0.6)] leading-normal">{selectedDomain}/{selectedProductLine}</span>
                    </div>
                    <ChevronRight size={16} className={`shrink-0 text-[#191919] transition-transform ${showProjectSelector ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {/* Three-column cascade selector */}
                  {showProjectSelector && projectPanelStyle && createPortal(
                    <div
                      data-project-selector-panel
                      className="fixed bg-white rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-[rgba(0,0,0,0.12)] z-[9999] overflow-hidden"
                      style={{
                        height: '360px',
                        width: `${projectPanelStyle.width}px`,
                        left: `${projectPanelStyle.left}px`,
                        top: `${projectPanelStyle.top}px`,
                      }}
                    >
                      <div className="flex h-full">
                        {/* Column 1: Domain */}
                        <div className="flex-1 min-w-0 border-r border-[rgba(0,0,0,0.06)] flex flex-col">
                          <div className="px-6 py-3 text-[10px] text-[#999] font-medium uppercase tracking-wide shrink-0 border-b border-[rgba(0,0,0,0.04)] bg-white">领域</div>
                          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {DOMAIN_DATA.map((domain) => (
                              <button
                                key={domain.name}
                                onClick={() => handleDomainChange(domain.name)}
                                className={`w-full px-6 py-2.5 text-left text-[14px] transition-colors ${
                                  selectedDomain === domain.name 
                                    ? 'bg-[#f0f5ff] text-[#1476ff]' 
                                    : 'text-[#333] hover:bg-[#f5f5f5]'
                                }`}
                              >
                                {domain.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Column 2: Product Line */}
                        <div className="flex-1 min-w-0 border-r border-[rgba(0,0,0,0.06)] flex flex-col">
                          <div className="px-6 py-3 text-[10px] text-[#999] font-medium uppercase tracking-wide shrink-0 border-b border-[rgba(0,0,0,0.04)] bg-white">产品线</div>
                          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {currentDomainData.productLines.map((pl) => (
                              <button
                                key={pl.name}
                                onClick={() => handleProductLineChange(pl.name)}
                                className={`w-full px-6 py-2.5 text-left text-[14px] transition-colors ${
                                  selectedProductLine === pl.name 
                                    ? 'bg-[#f0f5ff] text-[#1476ff]' 
                                    : 'text-[#333] hover:bg-[#f5f5f5]'
                                }`}
                              >
                                {pl.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Column 3: Product */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="px-6 py-3 text-[10px] text-[#999] font-medium uppercase tracking-wide shrink-0 border-b border-[rgba(0,0,0,0.04)] bg-white">产品</div>
                          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {currentProductLineData?.products.map((product) => (
                              <button
                                key={product}
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowProjectSelector(false);
                                }}
                                className={`w-full px-6 py-2.5 text-left text-[14px] transition-colors ${
                                  selectedProduct === product 
                                    ? 'bg-[#f0f5ff] text-[#1476ff]' 
                                    : 'text-[#333] hover:bg-[#f5f5f5]'
                                }`}
                              >
                                {product}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>

                <div className="h-px bg-[rgba(0,0,0,0.08)] mx-[12px]" />
                
                {/* Version selector */}
                <div 
                  className="relative"
                  ref={versionSelectorRef}
                >
                  <button
                    onClick={() => {
                      setShowVersionSelector((prev) => {
                        const next = !prev;
                        if (next) {
                          const nextStyle = getVersionPanelStyle();
                          if (nextStyle) setVersionPanelStyle(nextStyle);
                        }
                        return next;
                      });
                    }}
                    className="w-full flex items-center gap-[12px] p-[12px] hover:bg-[rgba(0,0,0,0.035)] transition-colors rounded-b-[12px]"
                  >
                    <FileText size={16} className="shrink-0 text-[#191919]" />
                    <div className="flex flex-1 min-w-0 text-left">
                      <span className="text-[14px] text-[#191919] leading-normal whitespace-nowrap">当前版本：{selectedVersion}</span>
                    </div>
                    <ChevronRight size={16} className={`shrink-0 text-[#191919] transition-transform ${showVersionSelector ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {/* Version dropdown */}
                  {showVersionSelector && versionPanelStyle && createPortal(
                    <div
                      data-version-selector-panel
                      className="fixed bg-white rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-[rgba(0,0,0,0.12)] z-[9999] overflow-hidden"
                      style={{
                        width: `${versionPanelStyle.width}px`,
                        left: `${versionPanelStyle.left}px`,
                        top: `${versionPanelStyle.top}px`,
                      }}
                    >
                      {VERSIONS.map((version) => (
                        <button
                          key={version}
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowVersionSelector(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-[14px] transition-colors ${
                            selectedVersion === version 
                              ? 'bg-[#f0f5ff] text-[#1476ff]' 
                              : 'text-[#333] hover:bg-[#f5f5f5]'
                          }`}
                        >
                          {version}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nav items */}
          <div className="flex flex-col gap-[2px] px-[12px] pb-[4px]">
            <button
              onClick={handleNewChat}
              title="新建对话"
              className={`w-full relative flex items-center gap-[12px] px-[12px] py-[9px] rounded-[8px] transition-colors text-[14px] text-[#191919] hover:bg-[#f2f2f2] ${isNavCollapsed ? 'justify-center gap-0' : ''}`}
            >
              <span className="flex items-center justify-center text-[#191919]">
                <MessageSquarePlus size={16} />
              </span>
              {!isNavCollapsed && (
                <span className="whitespace-nowrap leading-[22px] text-[#191919]">新建对话</span>
              )}
            </button>
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  title={item.label}
                  className={`w-full relative flex items-center gap-[12px] px-[12px] py-[9px] rounded-[8px] transition-colors text-[14px] ${
                    isActive
                      ? 'bg-[rgba(239,246,255,0.85)] text-[#0a59f7]'
                      : 'text-[#191919] hover:bg-[#f2f2f2]'
                  } ${isNavCollapsed ? 'justify-center gap-0' : ''}`}
                >
                  <span className={`flex items-center justify-center ${isActive ? 'text-[#0a59f7]' : 'text-[#191919]'}`}>
                    <item.icon size={16} />
                  </span>
                  {!isNavCollapsed && (
                    <span className={`whitespace-nowrap leading-[22px] ${isActive ? 'font-medium text-[#0a59f7]' : 'text-[#191919]'}`}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !isNavCollapsed && (
                    <span className="absolute right-[4px] top-1/2 -translate-y-1/2 h-[32px] w-[4px] rounded-[99px] bg-[#0a59f7]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* History list */}
        {!isNavCollapsed && (
          <div className="flex-1 min-h-0 overflow-y-auto px-[12px] py-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="text-[12px] font-medium text-[rgba(25,25,25,0.45)] tracking-wide px-[12px] py-[4px]">
              历史记录
            </div>
            {sortedConversations.length === 0 ? (
              <div className="px-[12px] py-[4px] text-[12px] text-[rgba(25,25,25,0.4)]">
                暂无对话记录
              </div>
            ) : (
              <div className="flex flex-col gap-[2px]">
                {sortedConversations.map((conversation) => {
                  const isActive = activeNav === 'chat' && currentConversationId === conversation.id;
                  return (
                    <div key={conversation.id} className="group relative">
                      {editingConversationId === conversation.id ? (
                        <div className="flex items-center gap-1 px-[12px] py-[6px] rounded-[6px] bg-[#eff6ff] border border-[#dbeafe]">
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(conversation.id);
                              if (e.key === 'Escape') {
                                setEditingConversationId(null);
                                setEditingTitle('');
                              }
                            }}
                            className="flex-1 min-w-0 bg-transparent text-[12px] text-[#191919] outline-none border-b border-[#1476ff]"
                          />
                          <button onClick={() => handleRenameSubmit(conversation.id)} className="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/60"><Check size={10} /></button>
                          <button onClick={() => { setEditingConversationId(null); setEditingTitle(''); }} className="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/60"><X size={10} /></button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConversationClick(conversation.id)}
                          className={`w-full text-left px-[12px] py-[6px] rounded-[6px] text-[12px] truncate transition-colors ${
                            isActive
                              ? 'bg-[rgba(20,118,255,0.12)] text-[#0a59f7] font-medium'
                              : 'text-[#191919] hover:bg-[rgba(0,0,0,0.05)]'
                          }`}
                        >
                          {conversation.title}
                        </button>
                      )}
                      {editingConversationId !== conversation.id && (
                        <div className="absolute right-[4px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-[4px] bg-gradient-to-l from-[rgba(255,255,255,1)] via-[rgba(255,255,255,0.95)] to-transparent px-[8px] py-[4px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingConversationId(conversation.id); setEditingTitle(conversation.title); }}
                            className="w-5 h-5 flex items-center justify-center rounded text-[#888] hover:text-[#191919] hover:bg-[#f0f0f0]"
                            title="重命名"
                          >
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conversation.id); }}
                            className="w-5 h-5 flex items-center justify-center rounded text-[#888] hover:text-[#e11d48] hover:bg-[#fef2f2]"
                            title="删除"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {isNavCollapsed && <div className="flex-1 min-h-0" />}

        <div className={`shrink-0 ${isNavCollapsed ? 'px-[8px] py-[8px]' : 'px-[12px] py-[8px]'}`}>
          {isNavCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                title="设置"
                aria-label="设置"
                className="w-8 h-8 rounded-[8px] text-[#191919] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center"
              >
                <Settings size={16} />
              </button>
              <button
                type="button"
                onClick={handleToggleNav}
                title="展开导航"
                aria-label="展开导航"
                className="w-8 h-8 rounded-[8px] text-[#191919] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center"
              >
                <svg className={`transition-transform duration-200 ${isNavCollapsed ? 'scale-x-[-1]' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4h11M2.5 8h11M2.5 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="设置"
                aria-label="设置"
                className="flex-1 h-9 rounded-[10px] text-[#191919] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 px-[12px]"
              >
                <Settings size={16} />
                <span className="text-[14px] leading-none">设置</span>
              </button>
              <button
                type="button"
                onClick={handleToggleNav}
                title="收起导航"
                aria-label="收起导航"
                className="w-9 h-9 rounded-[10px] text-[#191919] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center"
              >
                <svg className={`transition-transform duration-200 ${isNavCollapsed ? 'scale-x-[-1]' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4h11M2.5 8h11M2.5 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {!isNavCollapsed && (
        <div
          className="absolute top-0 bottom-0 w-3 -translate-x-1/2 cursor-col-resize group z-20 select-none"
          style={{ left: navWidth }}
          onMouseDown={handleStartNavResize}
          role="separator"
          aria-orientation="vertical"
          aria-label="拖拽调整左侧导航宽度"
        >
          <div
            className={`absolute left-1/2 top-0 -translate-x-1/2 h-full w-px transition-colors ${
              isNavResizing ? 'bg-[#93c5fd]' : 'bg-transparent group-hover:bg-[#dbeafe]'
            }`}
          />
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-[3px] rounded-full transition-colors ${
              isNavResizing ? 'bg-[#93c5fd]' : 'bg-transparent group-hover:bg-[#bfdbfe]'
            }`}
          />
        </div>
      )}

      {/* Right container: chat + canvas workspace */}
      <section
        className="flex-1 min-w-0 h-full rounded-[24px] overflow-hidden"
        style={{
          background: 'rgba(251, 252, 255, 0.80)',
          backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
        }}
        onMouseDown={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest('button,input,textarea,select,a,[role="button"],[data-no-window-drag="true"]')) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientY - rect.top <= 40) {
            onWindowDragStart?.(event);
          }
        }}
      >
        {/* Main area */}
        <main className="h-full min-w-0 bg-transparent">
        {activeNav === 'chat' && (
          <div className="h-full min-w-0">{renderWorkspace(currentConversation)}</div>
        )}

        {activeNav === 'skill_market' && (
          <div className="h-full flex flex-col bg-transparent">
            <div className="shrink-0 border-b border-[rgba(0,0,0,0.08)] pl-[16px] pr-[40px] pt-[12px] pb-[13px]">
              <div className="flex items-center gap-[16px] min-h-[44px]">
                <div className="relative shrink-0 flex size-[36px] items-center justify-center overflow-hidden rounded-[10px] border border-white/35 bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_rgba(148,163,184,0.14)] backdrop-blur-[14px]">
                  <div className="absolute inset-[1px] rounded-[9px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.06))]" />
                  <div className="absolute right-[4px] top-[3px] h-[11px] w-[16px] rounded-full bg-white/30 blur-[6px]" />
                  <LayoutGrid size={16} strokeWidth={2.1} className="relative z-10 text-[#5167eb] drop-shadow-[0_1px_2px_rgba(81,103,235,0.12)]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold leading-[20px] text-black">技能社区</div>
                  <div className="mt-[4px] text-[12px] leading-[18px] text-[rgba(0,0,0,0.6)]">
                    发现、安装与管理 Agent 技能扩展，快速补齐工作流能力
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex bg-transparent">
              <div className="w-[268px] shrink-0 bg-[#fafafa] border-r border-[rgba(25,25,25,0.08)] px-4 py-6 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {([
                  {
                    key: '全部技能' as const,
                    label: '全部技能',
                    icon: Sparkles,
                    accent: '#1476ff',
                    accentBg: '#eff6ff',
                  },
                  ...SKILL_MARKET_CATEGORIES.map((category) => ({
                    key: category,
                    label: category,
                    icon: SKILL_CATEGORY_UI[category].icon,
                    accent: SKILL_CATEGORY_UI[category].accent,
                    accentBg: SKILL_CATEGORY_UI[category].accentBg,
                  })),
                ]).map((category) => {
                  const CategoryIcon = category.icon;
                  const isActive = skillCategoryFilter === category.key;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setSkillCategoryFilter(category.key)}
                      className={`w-full h-14 px-4 rounded-[16px] flex items-center gap-3 text-left transition-colors ${
                        isActive ? 'bg-[#ece9e9] text-[#191919]' : 'text-[#191919] hover:bg-[#f1f1f1]'
                      }`}
                    >
                      <span
                        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: category.accentBg, color: category.accent }}
                      >
                        <CategoryIcon size={20} />
                      </span>
                      <span className="text-[14px] font-medium">{category.label}</span>
                    </button>
                  );
                })}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="px-7 py-6 border-b border-[rgba(25,25,25,0.08)] flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold text-[#191919]">{skillCategoryFilter}</div>
                    <div className="text-[12px] text-[#808080] mt-1">已选 {installedSkillsCount}/{skills.length}</div>
                  </div>
                  <div className="relative w-full max-w-[320px] shrink-0">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(25,25,25,0.35)]" />
                    <input
                      type="text"
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      placeholder="搜索技能"
                      className="w-full h-10 pl-10 pr-4 rounded-[12px] text-[14px] text-[#191919] placeholder:text-[rgba(25,25,25,0.35)] outline-none border border-[rgba(0,0,0,0.08)] focus:border-[rgba(0,0,0,0.16)] bg-white"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-7 py-4 min-h-0" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-0">
                    {visibleSkills.map((skill) => {
                      const categoryUi = SKILL_CATEGORY_UI[skill.category];
                      const SkillIcon = categoryUi.icon;
                      return (
                        <div
                          key={skill.id}
                          className="min-h-[104px] border-b border-[rgba(25,25,25,0.08)] flex items-center gap-4"
                        >
                          <div
                            onClick={() => setSelectedSkillDetail(skill)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedSkillDetail(skill);
                              }
                            }}
                            className="min-w-0 flex-1 flex items-center gap-4 cursor-pointer rounded-[18px] -mx-3 px-3 py-3 hover:bg-[#fafafa] transition-colors"
                          >
                            <div
                              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                            >
                              <SkillIcon size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-semibold text-[#191919]">{skill.name}</div>
                              <div className="text-[12px] text-[#808080] mt-1 leading-[1.7]">{skill.description}</div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 text-[#999]">
                              <span className="text-[11px] text-[#999]">查看详情</span>
                              <ChevronRight size={16} />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSkill(skill.id);
                            }}
                            className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${
                              skill.enabled ? 'bg-[#1476ff]' : 'bg-[#d7dbe4]'
                            }`}
                            aria-label={`${skill.enabled ? '停用' : '启用'} ${skill.name}`}
                          >
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-colors ${
                                skill.enabled ? 'left-5' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                    {visibleSkills.length === 0 && (
                      <div className="py-16 text-center text-[14px] text-[#999]">
                        未找到匹配的技能
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {createPortal(
              <AnimatePresence>
                {selectedSkillDetail && (() => {
                  const categoryUi = SKILL_CATEGORY_UI[selectedSkillDetail.category];
                  const SkillIcon = categoryUi.icon;
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-[2px] px-6 py-6"
                      onClick={closeSkillDetail}
                    >
                      <div className="min-h-full flex items-start justify-center">
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.985 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.985 }}
                          transition={{ duration: 0.16 }}
                          onClick={(event) => event.stopPropagation()}
                          className="w-[1200px] max-w-[calc(100vw-48px)] rounded-[14px] bg-white border border-[rgba(25,25,25,0.08)] shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden"
                        >
                          <div className="px-6 py-5 border-b border-[rgba(25,25,25,0.08)]">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                            >
                              <SkillIcon size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-[16px] font-semibold text-[#191919]">{selectedSkillDetail.name}</h3>
                                    <span className="text-[12px] text-[rgba(25,25,25,0.6)]">Skill</span>
                                  </div>
                                  <p className="mt-3 text-[14px] text-[#191919] leading-[1.7] max-w-[640px]">
                                    {selectedSkillDetail.detail.tagline}
                                  </p>
                                </div>
                                <button
                                  onClick={closeSkillDetail}
                                  className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#191919] hover:bg-[#f5f5f5] transition-colors shrink-0"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className="inline-flex items-center gap-1 rounded-[6px] px-[8px] py-[4px] text-[12px] font-medium"
                                      style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                                    >
                                      <SkillIcon size={12} />
                                      {selectedSkillDetail.category}
                                    </span>
                                    <span className="text-[12px] text-[rgba(25,25,25,0.6)]">版本 {selectedSkillDetail.detail.version}</span>
                                    <span className="text-[12px] text-[rgba(25,25,25,0.4)]">更新于 {selectedSkillDetail.detail.updatedAt}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleSkill(selectedSkillDetail.id)}
                                  className={`w-12 h-7 rounded-full transition-colors shrink-0 relative ${
                                    selectedSkillDetail.enabled ? 'bg-[#1476ff]' : 'bg-[#d7dbe4]'
                                  }`}
                                  aria-label={`${selectedSkillDetail.enabled ? '停用' : '启用'} ${selectedSkillDetail.name}`}
                                >
                                  <span
                                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white transition-colors ${
                                      selectedSkillDetail.enabled ? 'left-6' : 'left-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                          </div>

                          <div className="px-6 py-6 space-y-6">
                            <div className="rounded-[12px] border border-[rgba(25,25,25,0.08)] bg-white p-[20px]">
                              <p className="text-[14px] text-[#191919] leading-[1.8]">{selectedSkillDetail.detail.overview}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="rounded-[12px] border border-[rgba(25,25,25,0.08)] bg-white p-[20px]">
                                <div className="text-[16px] font-semibold text-[#191919]">适用场景</div>
                                <div className="mt-3 space-y-2">
                                  {selectedSkillDetail.detail.useCases.map((item) => (
                                    <div key={item} className="flex gap-2 text-[14px] text-[#191919] leading-[1.7]">
                                      <span className="text-[#1476ff]">•</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-[12px] border border-[rgba(25,25,25,0.08)] bg-white p-[20px]">
                                <div className="text-[16px] font-semibold text-[#191919]">输出内容</div>
                                <div className="mt-3 space-y-2">
                                  {selectedSkillDetail.detail.outputs.map((item) => (
                                    <div key={item} className="flex gap-2 text-[14px] text-[#191919] leading-[1.7]">
                                      <span className="text-[#1476ff]">•</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[12px] border border-[rgba(25,25,25,0.08)] bg-white p-[20px]">
                              <div className="text-[16px] font-semibold text-[#191919]">推荐工作流</div>
                              <div className="mt-4 space-y-3">
                                {selectedSkillDetail.detail.workflow.map((item, index) => (
                                  <div key={item} className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-full bg-[rgba(20,118,255,0.08)] text-[#1476ff] text-[10px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                                      {index + 1}
                                    </span>
                                    <span className="text-[14px] text-[#191919] leading-[1.7]">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-[12px] border border-[rgba(25,25,25,0.08)] bg-white p-[20px]">
                              <div className="text-[16px] font-semibold text-[#191919]">使用规则</div>
                              <div className="mt-3 space-y-2">
                                {selectedSkillDetail.detail.rules.map((item) => (
                                  <div key={item} className="flex gap-2 text-[14px] text-[#191919] leading-[1.7]">
                                    <span className="text-[#6d28d9]">•</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="px-6 py-4 border-t border-[rgba(25,25,25,0.08)] flex items-center justify-between gap-4">
                            <button
                              onClick={() => toggleSkill(selectedSkillDetail.id)}
                              className={`h-10 px-[16px] py-[10px] rounded-[8px] text-[12px] font-medium transition-colors active:scale-[0.98] ${
                                selectedSkillDetail.enabled
                                  ? 'text-[#e11d48] hover:bg-[#fef2f2]'
                                  : 'bg-[#1476ff] text-white hover:bg-[#1060d0]'
                              }`}
                            >
                              {selectedSkillDetail.enabled ? '卸载技能' : '添加技能'}
                            </button>
                            <button
                              onClick={closeSkillDetail}
                              className="h-10 px-[16px] py-[10px] rounded-[8px] border border-[rgba(25,25,25,0.12)] text-[12px] font-medium text-[#191919] hover:bg-[#f5f5f5] transition-colors active:scale-[0.98]"
                            >
                              关闭详情
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>,
              document.body
            )}
          </div>
        )}

        {activeNav === 'knowledge_base' && (() => {
          // ── helpers ──────────────────────────────────────────────────────────
          const fmtColor: Record<string, string> = {
            md: '#1476ff', pdf: '#e53935', doc: '#1476ff', docx: '#1476ff',
            xls: '#2e7d32', xlsx: '#2e7d32', ppt: '#e65100', pptx: '#e65100',
            txt: '#6b7280', json: '#7c3aed',
          };
          const renderDocContent = (sections: Array<{ title: string; content: string }>, snippet: string) => {
            const allSections = [{ title: '摘要', content: snippet }, ...sections];
            return allSections.map((sec, si) => {
              const lines = sec.content.split('\n').filter(Boolean);
              type Block = { kind: 'text'; text: string } | { kind: 'list'; items: string[] };
              const blocks: Block[] = [];
              let currentList: string[] | null = null;
              lines.forEach((l) => {
                if (l.startsWith('- ')) {
                  if (!currentList) { currentList = []; blocks.push({ kind: 'list', items: currentList }); }
                  currentList.push(l.slice(2));
                } else {
                  currentList = null;
                  blocks.push({ kind: 'text', text: l });
                }
              });
              return (
                <div key={si} className={si > 0 ? 'mt-[28px]' : ''}>
                  <h2 className="text-[14px] font-semibold text-[#111] mb-[10px]">{sec.title}</h2>
                  {blocks.map((b, bi) =>
                    b.kind === 'list' ? (
                      <ul key={bi} className="mb-[8px] space-y-[6px]">
                        {b.items.map((item, ii) => (
                          <li key={ii} className="flex gap-[10px] text-[14px] leading-[22px] text-[#1a1a1a]">
                            <span className="mt-[8px] shrink-0 w-[5px] h-[5px] rounded-full bg-[#9ca3af]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={bi} className="text-[14px] leading-[24px] text-[#1a1a1a] mb-[8px]">{b.text}</p>
                    )
                  )}
                </div>
              );
            });
          };

          // ── Tab definitions ───────────────────────────────────────────────
          const KB_TABS: Array<{ key: typeof activeKnowledgeTab; label: string; disabled?: boolean }> = [
            { key: 'docs', label: '项目文档' },
            { key: 'images', label: '图片生成' },
            { key: 'videos', label: '视频生成', disabled: true },
            { key: 'reports', label: '研究报告', disabled: true },
          ];

          // ── Filtered gallery images ───────────────────────────────────────
          const filteredImages = galleryCategory === '全部'
            ? MOCK_GALLERY_IMAGES
            : MOCK_GALLERY_IMAGES.filter((img) => img.category === galleryCategory);

          // split into 3 columns for masonry
          const col0 = filteredImages.filter((_, i) => i % 3 === 0);
          const col1 = filteredImages.filter((_, i) => i % 3 === 1);
          const col2 = filteredImages.filter((_, i) => i % 3 === 2);

          const formatLikes = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

          return (
            <div className="h-full flex flex-col bg-transparent">
              <input ref={knowledgeUploadInputRef} type="file" multiple accept={KNOWLEDGE_UPLOAD_ACCEPT} onChange={handleKnowledgeUpload} className="hidden" />

              <div className="shrink-0 border-b border-[rgba(0,0,0,0.08)] pl-[16px] pr-[40px] pt-[12px] pb-[13px]">
                <div className="flex items-center gap-[16px] min-h-[44px]">
                  <div className="relative shrink-0 flex size-[36px] items-center justify-center overflow-hidden rounded-[10px] border border-white/35 bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_rgba(148,163,184,0.14)] backdrop-blur-[14px]">
                    <div
                      className="absolute inset-[4.17%_11.84%_5.23%_8.33%]"
                      style={{
                        WebkitMaskImage: `url('${KNOWLEDGE_MANAGEMENT_ICON_MASK_URL}')`,
                        maskImage: `url('${KNOWLEDGE_MANAGEMENT_ICON_MASK_URL}')`,
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                      }}
                    >
                      <img alt="" src={KNOWLEDGE_MANAGEMENT_ICON_FILL_URL} className="block h-full w-full max-w-none" />
                    </div>
                    <div className="absolute left-[19.5px] top-[13.37px] flex h-[3px] w-[8.06px] items-center justify-center">
                      <div className="h-[1.1px] w-[8.03px] rotate-[-13.92deg] rounded-[12px] bg-white" />
                    </div>
                    <div className="absolute left-[19.5px] top-[18px] flex h-[2.31px] w-[5.37px] items-center justify-center">
                      <div className="h-[1.07px] w-[5.27px] rotate-[-13.92deg] rounded-[12px] bg-white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold leading-[20px] text-black">知识管理</div>
                    <div className="mt-[4px] text-[12px] leading-[18px] text-[rgba(0,0,0,0.6)]">
                      上传行业文档与团队资料，构建Agent的专业知识体系
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Tab bar ── */}
              <div className="shrink-0 flex items-center gap-[4px] px-[20px] border-b border-[rgba(0,0,0,0.08)] h-[44px]">
                {KB_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    disabled={tab.disabled}
                    onClick={() => !tab.disabled && setActiveKnowledgeTab(tab.key)}
                    className={`relative h-full px-[12px] text-[14px] transition-colors ${
                      tab.disabled
                        ? 'text-[rgba(0,0,0,0.25)] cursor-not-allowed'
                        : activeKnowledgeTab === tab.key
                          ? 'text-[#1a1a1a] font-medium'
                          : 'text-[rgba(0,0,0,0.45)] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {tab.label}
                    {!tab.disabled && activeKnowledgeTab === tab.key && (
                      <span className="absolute bottom-0 left-[12px] right-[12px] h-[2px] rounded-t-full bg-[#1476ff]" />
                    )}
                    {tab.disabled && (
                      <span className="ml-[4px] text-[10px] text-[rgba(0,0,0,0.2)]">即将上线</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab content ── */}
              {activeKnowledgeTab === 'docs' && (
                <div className="flex-1 min-h-0 flex bg-transparent">
                  {/* Left directory panel */}
                  <div className="w-[200px] shrink-0 flex flex-col border-r border-[rgba(0,0,0,0.08)] bg-transparent">
                    <div className="shrink-0 h-[40px] flex items-center px-[12px] justify-between border-b border-[rgba(0,0,0,0.08)]">
                      <span className="text-[12px] font-semibold text-[#1a1a1a]">文档目录</span>
                      <div className="flex items-center gap-[2px]">
                        <button className="w-[20px] h-[20px] flex items-center justify-center rounded-[4px] text-[rgba(0,0,0,0.4)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1a1a1a] transition-colors">
                          <Search size={12} />
                        </button>
                        <button
                          onClick={() => handleKnowledgeUploadClick('领域专业知识')}
                          className="w-[20px] h-[20px] flex items-center justify-center rounded-[4px] text-[rgba(0,0,0,0.4)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1a1a1a] transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-[12px] py-[8px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex flex-col gap-[8px]">
                        {groupedKnowledgeItems.map(({ group, items }) => {
                          const collapsed = collapsedKnowledgeGroups[group];
                          return (
                            <div key={group} className="flex flex-col gap-[4px]">
                              <button
                                type="button"
                                onClick={() => toggleKnowledgeGroupCollapse(group)}
                                className="w-full flex items-center gap-[4px] px-[12px] py-[8px] rounded-[6px] text-[12px] font-medium text-[rgba(25,25,25,0.45)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                              >
                                <ChevronRight size={14} className={`text-[rgba(25,25,25,0.35)] transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`} />
                                <span>{group}</span>
                              </button>
                              {!collapsed && (
                                <div className="flex flex-col gap-[4px]">
                                  {items.map((item) => {
                                    const isSelected = selectedKnowledgeItem?.id === item.id;
                                    const fmt = item.format ?? 'md';
                                    const dotColor = fmtColor[fmt] ?? '#6b7280';
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedKnowledgeId(item.id)}
                                        className={`w-full flex items-center gap-[6px] pl-[32px] pr-[12px] py-[8px] rounded-[6px] text-left text-[12px] truncate transition-colors ${
                                          isSelected
                                            ? 'bg-[rgba(20,118,255,0.12)] text-[#0a59f7] font-medium'
                                            : 'text-[#191919] hover:bg-[rgba(0,0,0,0.05)]'
                                        }`}
                                      >
                                        <FileText size={14} className="shrink-0" style={{ color: dotColor }} />
                                        <span className="truncate">{item.title}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right preview panel */}
                  <div className="flex-1 min-w-0 flex flex-col bg-transparent overflow-hidden">
                    {selectedKnowledgeItem ? (() => {
                      const item = selectedKnowledgeItem;
                      const fmt = item.format ?? 'md';
                      const fmtBadgeColor = fmtColor[fmt] ?? '#6b7280';
                      const isEnabled = knowledgeEnabledMap[item.id] ?? true;
                      return (
                        <>
                          <div className="shrink-0 h-[40px] border-b border-[rgba(0,0,0,0.08)] flex items-center px-[16px] gap-[6px]">
                            <span
                              className="shrink-0 text-[10px] font-bold px-[4px] py-[1px] rounded"
                              style={{ color: fmtBadgeColor, background: `${fmtBadgeColor}18` }}
                            >
                              {fmt.toUpperCase()}
                            </span>
                            <span className="text-[12px] text-[rgba(0,0,0,0.6)] truncate">{item.title}.{fmt}</span>
                            <div className="ml-auto shrink-0 flex items-center gap-[4px]">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isEnabled}
                                onClick={() => toggleKnowledgeEnabled(item.id)}
                                className={`relative h-[16px] w-[28px] rounded-full transition-colors mr-[6px] ${isEnabled ? 'bg-[#0a59f7]' : 'bg-[rgba(0,0,0,0.18)]'}`}
                              >
                                <span className={`absolute top-1/2 -translate-y-1/2 h-[10px] w-[10px] rounded-full bg-white transition-[left] ${isEnabled ? 'left-[15px]' : 'left-[3px]'}`} />
                              </button>
                              <button className="w-[24px] h-[24px] flex items-center justify-center rounded-[4px] text-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1a1a1a] transition-colors">
                                <Eye size={13} />
                              </button>
                              <button className="w-[24px] h-[24px] flex items-center justify-center rounded-[4px] text-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1a1a1a] transition-colors">
                                <Copy size={13} />
                              </button>
                              <button className="w-[24px] h-[24px] flex items-center justify-center rounded-[4px] text-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[#1a1a1a] transition-colors">
                                <MoreHorizontal size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                            <div className="mx-[150px] px-[24px] py-[28px]">
                              <h1 className="text-[16px] font-bold text-[#111] leading-[24px] mb-[8px]">{item.title}</h1>
                              <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[2px] mb-[20px] pb-[12px] border-b border-[rgba(0,0,0,0.07)]">
                                {item.owner && <span className="text-[12px] text-[rgba(0,0,0,0.4)]">负责人：{item.owner}</span>}
                                <span className="text-[12px] text-[rgba(0,0,0,0.4)]">更新：{formatKnowledgeDate(item.updatedAt)}</span>
                                <span className="text-[12px] text-[rgba(0,0,0,0.4)]">{item.size}</span>
                                {(item.tags ?? []).map((tag) => (
                                  <span key={tag} className="text-[10px] text-[rgba(0,0,0,0.4)] bg-[rgba(0,0,0,0.05)] px-[5px] py-[1px] rounded-[3px]">{tag}</span>
                                ))}
                              </div>
                              {renderDocContent(item.sections, item.snippet)}
                            </div>
                          </div>
                        </>
                      );
                    })() : (
                      <div className="flex-1 flex items-center justify-center text-[14px] text-[rgba(0,0,0,0.25)]">
                        从左侧选择文件预览内容
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeKnowledgeTab === 'images' && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {/* category filter bar */}
                  <div className="shrink-0 flex items-center gap-[6px] px-[20px] py-[10px] border-b border-[rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-[6px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {GALLERY_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setGalleryCategory(cat)}
                          className={`shrink-0 h-[28px] px-[10px] rounded-full text-[12px] transition-colors ${
                            galleryCategory === cat
                              ? 'bg-[#1a1a1a] text-white'
                              : 'bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.55)] hover:bg-[rgba(0,0,0,0.09)]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto shrink-0 flex items-center gap-[4px]">
                      <button className="h-[28px] px-[10px] flex items-center gap-[4px] rounded-full bg-[rgba(20,118,255,0.08)] text-[#1476ff] text-[12px] hover:bg-[rgba(20,118,255,0.14)] transition-colors">
                        <Plus size={12} />
                        <span>生成图片</span>
                      </button>
                    </div>
                  </div>

                  {/* masonry grid */}
                  <div className="flex-1 overflow-y-auto px-[20px] py-[16px] [scrollbar-width:thin]">
                    <div className="flex gap-[12px]">
                      {[col0, col1, col2].map((col, ci) => (
                        <div key={ci} className="flex-1 flex flex-col gap-[12px]">
                          {col.map((img) => {
                            const heightClass = img.aspect === 'tall' ? 'h-[240px]' : img.aspect === 'wide' ? 'h-[160px]' : 'h-[200px]';
                            const isHovered = galleryHoverId === img.id;
                            return (
                              <div
                                key={img.id}
                                className="relative rounded-[10px] overflow-hidden cursor-pointer group"
                                style={{ background: img.gradient }}
                                onMouseEnter={() => setGalleryHoverId(img.id)}
                                onMouseLeave={() => setGalleryHoverId(null)}
                              >
                                <div className={`${heightClass} w-full`} />
                                {/* subtle noise texture overlay */}
                                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />
                                {/* hover overlay */}
                                <div className={`absolute inset-0 bg-[rgba(0,0,0,0.45)] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                                {/* bottom info */}
                                <div className={`absolute bottom-0 left-0 right-0 p-[10px] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                  <p className="text-white text-[12px] font-medium leading-[16px] mb-[4px] line-clamp-2">{img.title}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[rgba(255,255,255,0.7)] text-[10px]">{img.author}</span>
                                    <div className="flex items-center gap-[8px]">
                                      <span className="flex items-center gap-[3px] text-[rgba(255,255,255,0.7)] text-[10px]">
                                        <Heart size={10} />
                                        {formatLikes(img.likes)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* category badge always visible */}
                                <div className="absolute top-[8px] left-[8px]">
                                  <span className="text-[10px] text-white bg-[rgba(0,0,0,0.35)] backdrop-blur-sm px-[6px] py-[2px] rounded-full">{img.category}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        </main>
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[12px] px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(2,6,23,0.25)] z-[680]">
          {toast}
        </div>
      )}
    </div>
  );
}
