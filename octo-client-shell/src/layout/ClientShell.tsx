import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  FolderOpen,
  Heart,
  LayoutGrid,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Upload,
  Users,
  Wand2,
  X,
  MessageSquarePlus,
} from 'lucide-react';
import { createPortal } from 'react-dom';
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
import { AssetsPanel, type AssetTabKey } from '../features/assets/AssetsPanel';

const KNOWLEDGE_MANAGEMENT_ICON_MASK_URL = 'https://www.figma.com/api/mcp/asset/866fcb9e-d7f0-4f57-a4b3-c341c6c37b84';
const KNOWLEDGE_MANAGEMENT_ICON_FILL_URL = 'https://www.figma.com/api/mcp/asset/dbb0e47f-7de5-4caf-bb6f-f4b1c5395ee0';

export type NavKey = 'chat' | 'skill_market' | 'knowledge_base';
type SkillSource = 'platform' | 'personal';

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
  group: '领域专业知识' | '团队知识' | '个人资产';
  type: 'doc' | 'report' | 'faq' | 'spec';
  size: string;
  updatedAt: number;
  snippet: string;
  format?: 'pdf' | 'md' | 'txt' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'json' | 'fig' | 'png';
  owner?: string;
  tags?: string[];
  content?: string;
  source?: 'platform' | 'personal';
  authority?: '强制' | '标准' | '参考';
  reviewStatus?: '已审核' | '评审中';
  applicableScenarios?: string[];
  citationLabel?: string;
  visibility?: 'private';
  uploadSource?: 'cloud' | 'local';
  riskNote?: string;
  sections: Array<{ title: string; content: string }>;
}

type PersonalSkillFileFormat = 'md' | 'txt' | 'json' | 'code';

interface PersonalSkillFileNode {
  id: string;
  name: string;
  type: 'file';
  format: PersonalSkillFileFormat;
  content: string;
  updatedAt: number;
}

interface PersonalSkillFolderNode {
  id: string;
  name: string;
  type: 'folder';
  children: PersonalSkillNode[];
}

type PersonalSkillNode = PersonalSkillFileNode | PersonalSkillFolderNode;

interface PersonalSkillPackage {
  id: string;
  name: string;
  summary: string;
  nodes: PersonalSkillNode[];
  updatedAt: number;
}

function createPersonalSkillDocMarkdown(payload: {
  title: string;
  concept: string;
  useCases: string[];
  outputs: string[];
  workflow: string[];
  rules: string[];
}): string {
  return [
    `# ${payload.title}`,
    '',
    '## 核心概念',
    payload.concept,
    '',
    '## 适用场景',
    ...payload.useCases.map((item) => `- ${item}`),
    '',
    '## 输出内容',
    ...payload.outputs.map((item) => `- ${item}`),
    '',
    '## 推荐工作流',
    ...payload.workflow.map((item, index) => `${index + 1}. ${item}`),
    '',
    '## 使用规则',
    ...payload.rules.map((item) => `- ${item}`),
  ].join('\n');
}

const DEFAULT_PERSONAL_SKILL_PACKAGES: PersonalSkillPackage[] = [
  {
    id: 'ps-harmony',
    name: '鸿蒙规范生成',
    summary: '面向 HarmonyOS 场景的视觉与组件规范生成能力。',
    updatedAt: 1744819200000,
    nodes: [
      {
        id: 'ps-harmony-skill-md',
        name: 'skill.md',
        type: 'file',
        format: 'md',
        updatedAt: 1744819200000,
        content: createPersonalSkillDocMarkdown({
          title: '鸿蒙规范生成',
          concept: '鸿蒙规范生成会基于 HarmonyOS 的组件约束、层级关系和交互反馈，快速给出符合系统语言的界面建议。它尤其适用于要做鸿蒙适配的产品团队，帮助在有限时间内把控系统一致性和生态感。',
          useCases: [
            '将现有产品快速适配到 HarmonyOS 视觉体系',
            '生成符合鸿蒙组件规范的原型和页面草稿',
            '检查导航结构、卡片样式和反馈机制是否符合生态风格',
          ],
          outputs: [
            'HarmonyOS 风格页面建议',
            '组件样式与状态规范说明',
            '导航与布局适配建议',
          ],
          workflow: [
            '识别页面类型与设备上下文',
            '匹配 HarmonyOS 组件与视觉模式',
            '生成页面框架、组件样式和反馈方案',
            '输出适配说明与注意事项',
          ],
          rules: [
            '默认优先采用系统原生交互和视觉表达',
            '不主动引入与 HarmonyOS 风格冲突的品牌装饰',
            '如有品牌色，会以系统兼容方式进行收敛',
          ],
        }),
      },
      {
        id: 'ps-harmony-agent',
        name: 'Agent',
        type: 'folder',
        children: [
          {
            id: 'ps-harmony-agent-system',
            name: 'system-prompt.md',
            type: 'file',
            format: 'md',
            updatedAt: 1744819200000,
            content: [
              '# Agent 角色说明',
              '',
              '## 目标',
              '帮助团队把当前设计方案快速映射到 HarmonyOS 组件与交互语义。',
              '',
              '## 行为约束',
              '- 优先输出系统一致性建议',
              '- 对品牌化视觉做风险提示',
              '- 提供组件替代方案与适配说明',
            ].join('\n'),
          },
        ],
      },
      {
        id: 'ps-harmony-assets',
        name: 'Assets',
        type: 'folder',
        children: [
          {
            id: 'ps-harmony-assets-tokens',
            name: 'tokens.json',
            type: 'file',
            format: 'json',
            updatedAt: 1744819200000,
            content: JSON.stringify(
              {
                color: { primary: '#0A59F7', surface: '#F7F9FC', text: '#191919' },
                radius: { card: 16, control: 12 },
                spacing: { section: 32, item: 12 },
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        id: 'ps-harmony-eval',
        name: 'eval-viewer',
        type: 'folder',
        children: [
          {
            id: 'ps-harmony-eval-readme',
            name: 'README.md',
            type: 'file',
            format: 'md',
            updatedAt: 1744819200000,
            content: [
              '# eval-viewer',
              '',
              '用于查看鸿蒙适配后的页面检查结果，包含组件映射、视觉偏差与交互风险说明。',
            ].join('\n'),
          },
        ],
      },
      {
        id: 'ps-harmony-refs',
        name: 'references',
        type: 'folder',
        children: [
          {
            id: 'ps-harmony-refs-guidelines',
            name: 'harmony-guidelines.md',
            type: 'file',
            format: 'md',
            updatedAt: 1744819200000,
            content: [
              '# HarmonyOS 适配指南',
              '',
              '- 导航优先使用系统模式',
              '- 强反馈组件遵循系统动效时长',
              '- 强品牌色需要经过兼容性收敛',
            ].join('\n'),
          },
        ],
      },
      {
        id: 'ps-harmony-agents',
        name: 'Agents',
        type: 'folder',
        children: [
          {
            id: 'ps-harmony-agents-config',
            name: 'agent-config.json',
            type: 'file',
            format: 'json',
            updatedAt: 1744819200000,
            content: JSON.stringify(
              { fallback: 'system-default', target: 'HarmonyOS', mode: 'guided' },
              null,
              2,
            ),
          },
        ],
      },
      {
        id: 'ps-harmony-scripts',
        name: 'Scripts',
        type: 'folder',
        children: [
          {
            id: 'ps-harmony-scripts-validate',
            name: 'validate.ts',
            type: 'file',
            format: 'code',
            updatedAt: 1744819200000,
            content: [
              'export function validateHarmonyMapping(input: string[]) {',
              '  return input.filter(Boolean).map((item) => ({ item, status: "ok" }));',
              '}',
            ].join('\n'),
          },
        ],
      },
    ],
  },
  {
    id: 'ps-research',
    name: '研究方案设计',
    summary: '把一个模糊的研究目标，整理成可直接执行的用户研究方案。',
    updatedAt: 1744732800000,
    nodes: [
      {
        id: 'ps-research-skill-md',
        name: 'skill.md',
        type: 'file',
        format: 'md',
        updatedAt: 1744732800000,
        content: createPersonalSkillDocMarkdown({
          title: '研究方案设计',
          concept: '研究方案设计会围绕研究目标、目标人群和业务阶段，自动组合访谈、可用性测试、问卷、日志分析等方法，并形成完整的执行计划。',
          useCases: [
            '为新版本改版定义研究目标、对象和方法',
            '补齐项目立项前的研究计划与时间安排',
            '把零散需求整理为统一的研究执行框架',
          ],
          outputs: [
            '研究目标与假设清单',
            '样本招募策略与执行计划',
            '访谈提纲 / 测试任务 / 分析框架',
          ],
          workflow: [
            '识别业务问题与研究问题',
            '匹配研究方法和样本规模',
            '生成执行节奏、任务安排与产出模板',
            '整理分析维度与洞察输出框架',
          ],
          rules: [
            '优先输出可落地的轻量研究计划，而不是理论化模板',
            '默认覆盖招募、执行、分析和汇报四个阶段',
            '如果研究目标过大，会自动拆分为阶段性任务',
          ],
        }),
      },
      {
        id: 'ps-research-assets',
        name: 'Assets',
        type: 'folder',
        children: [
          {
            id: 'ps-research-assets-interview',
            name: 'interview-outline.md',
            type: 'file',
            format: 'md',
            updatedAt: 1744732800000,
            content: [
              '# 访谈提纲',
              '',
              '## 访谈目标',
              '验证用户在新版本中的主要任务路径和关键疑虑。',
            ].join('\n'),
          },
        ],
      },
    ],
  },
];

const KNOWLEDGE_GROUPS: Array<KnowledgeItem['group']> = ['领域专业知识', '团队知识', '个人资产'];
const KNOWLEDGE_UPLOAD_ACCEPT = '.pdf,.md,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.json,.fig,.png';
const KNOWLEDGE_FORMATS: Array<NonNullable<KnowledgeItem['format']>> = [
  'pdf', 'md', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'json', 'fig', 'png',
];

const STORAGE_KEYS = {
  nav: 'octo.client.activeNav',
  navCollapsed: 'octo.client.navCollapsed',
  navWidth: 'octo.client.navWidth',
  conversations: 'octo.client.conversations',
  currentConversationId: 'octo.client.currentConversationId',
  personalSkills: 'octo.client.personalSkills',
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
  {
    id: 'kb-p1',
    title: '结算台改版交付稿',
    source: 'personal',
    group: '个人资产',
    type: 'doc',
    format: 'fig',
    owner: '你',
    visibility: 'private',
    uploadSource: 'cloud',
    authority: '参考',
    applicableScenarios: ['当前项目迭代', '交付复用', '局部改版'],
    citationLabel: '个人资产 · 结算台改版交付稿',
    tags: ['交付稿', '结算台', '个人'],
    size: '4.6 MB',
    updatedAt: 1744389600000,
    snippet: '当前项目的结算台交付稿，可继续作为页面结构、字段顺序和交互路径的上下文输入。',
    riskNote: '该交付稿中的强调色与平台品牌色存在轻微差异，系统会保留来源提示。',
    sections: [
      { title: '资产说明', content: '这是你的云端交付件，主要用于后续结算流程、账单明细和确认路径的延续设计。' },
      { title: '适用建议', content: '适合在同项目继续迭代时引用，优先复用字段顺序、摘要卡片和确认区布局。' },
    ],
  },
  {
    id: 'kb-p2',
    title: 'B端深色看板探索稿',
    source: 'personal',
    group: '个人资产',
    type: 'report',
    format: 'png',
    owner: '你',
    visibility: 'private',
    uploadSource: 'cloud',
    authority: '参考',
    applicableScenarios: ['视觉探索', '暗色模式', '方案比稿'],
    citationLabel: '个人资产 · B端深色看板探索稿',
    tags: ['探索稿', '深色', '看板'],
    size: '2.1 MB',
    updatedAt: 1744476000000,
    snippet: '个人探索的深色控制台方向，适合用于比稿和风格尝试，不建议直接作为正式平台规范。',
    riskNote: '探索稿使用的高饱和紫色不符合平台品牌色基线。',
    sections: [
      { title: '资产说明', content: '用于探索高密度信息看板在暗色主题下的视觉层级和卡片节奏。' },
      { title: '适用建议', content: '适合概念提案与视觉探索，不建议直接覆盖平台正式规范。' },
    ],
  },
];

function getKnowledgeSource(item: KnowledgeItem): 'platform' | 'personal' {
  return item.source ?? (item.group === '个人资产' ? 'personal' : 'platform');
}

function getKnowledgeAuthority(item: KnowledgeItem): '强制' | '标准' | '参考' {
  if (item.authority) return item.authority;
  if (item.type === 'spec') return '标准';
  if (item.type === 'doc') return '标准';
  return '参考';
}

function getKnowledgeReviewStatus(item: KnowledgeItem): '已审核' | '评审中' {
  return item.reviewStatus ?? '已审核';
}

function getKnowledgeScenarios(item: KnowledgeItem): string[] {
  if (item.applicableScenarios?.length) return item.applicableScenarios;
  if (item.type === 'spec') return ['规范对齐', '正式交付', '设计评审'];
  if (item.type === 'report') return ['方案研究', '汇报准备', '洞察复用'];
  if (item.type === 'faq') return ['问答参考', '知识复用', '方案澄清'];
  return ['团队沉淀', '上下文补充', '交付复用'];
}

function getKnowledgeCitation(item: KnowledgeItem): string {
  return item.citationLabel ?? `${getKnowledgeSource(item) === 'platform' ? '平台资产' : '个人资产'} · ${item.title}`;
}

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

function loadPersonalSkillPackages(): PersonalSkillPackage[] {
  const parsed = safeParse<PersonalSkillPackage[]>(safeStorageGet(STORAGE_KEYS.personalSkills), DEFAULT_PERSONAL_SKILL_PACKAGES);
  return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_PERSONAL_SKILL_PACKAGES;
}

function savePersonalSkillPackages(items: PersonalSkillPackage[]) {
  safeStorageSet(STORAGE_KEYS.personalSkills, JSON.stringify(items));
}

function findFirstPersonalSkillFile(nodes: PersonalSkillNode[]): PersonalSkillFileNode | null {
  for (const node of nodes) {
    if (node.type === 'file') return node;
    const nested = findFirstPersonalSkillFile(node.children);
    if (nested) return nested;
  }
  return null;
}

function findPersonalSkillNode(nodes: PersonalSkillNode[], nodeId: string): PersonalSkillNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.type === 'folder') {
      const nested = findPersonalSkillNode(node.children, nodeId);
      if (nested) return nested;
    }
  }
  return null;
}

function getPersonalFileFormat(name: string): PersonalSkillFileFormat {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'md') return 'md';
  if (ext === 'json') return 'json';
  if (ext === 'txt') return 'txt';
  return 'code';
}

function updatePersonalSkillNodeContent(nodes: PersonalSkillNode[], targetId: string, content: string, updatedAt: number): PersonalSkillNode[] {
  return nodes.map((node) => {
    if (node.type === 'file') {
      return node.id === targetId ? { ...node, content, updatedAt } : node;
    }
    return {
      ...node,
      children: updatePersonalSkillNodeContent(node.children, targetId, content, updatedAt),
    };
  });
}

function createPersonalSkillPackageFromArchive(file: File): PersonalSkillPackage {
  const createdAt = Date.now();
  const packageName = file.name.replace(/\.zip$/i, '') || '导入技能';
  const archiveLabel = `${file.name} · ${formatFileSize(file.size)} · ${formatTime(createdAt)}`;

  return {
    id: makeId('ps_pkg'),
    name: packageName,
    summary: '通过 zip 包导入的个人技能，可继续在当前工作区内补充和编辑。',
    updatedAt: createdAt,
    nodes: [
      {
        id: makeId('ps_file'),
        name: 'skill.md',
        type: 'file',
        format: 'md',
        updatedAt: createdAt,
        content: [
          `# ${packageName}`,
          '',
          '## 导入说明',
          `该技能由压缩包导入：${archiveLabel}`,
          '',
          '## 当前状态',
          '- 已在个人技能列表中创建根节点',
          '- 已生成基础目录骨架',
          '- 可继续补充说明文档、脚本和资源文件',
          '',
          '## 建议下一步',
          '1. 在 Agent 目录补充 system prompt',
          '2. 在 Assets 目录添加资源与配置',
          '3. 在 Scripts 目录添加自动化脚本',
        ].join('\n'),
      },
      {
        id: makeId('ps_folder'),
        name: 'Agent',
        type: 'folder',
        children: [
          {
            id: makeId('ps_file'),
            name: 'README.md',
            type: 'file',
            format: 'md',
            updatedAt: createdAt,
            content: `# Agent\n\n${packageName} 的 Agent 目录，建议补充 system prompt 和运行说明。`,
          },
        ],
      },
      { id: makeId('ps_folder'), name: 'Assets', type: 'folder', children: [] },
      { id: makeId('ps_folder'), name: 'eval-viewer', type: 'folder', children: [] },
      { id: makeId('ps_folder'), name: 'references', type: 'folder', children: [] },
      { id: makeId('ps_folder'), name: 'Agents', type: 'folder', children: [] },
      { id: makeId('ps_folder'), name: 'Scripts', type: 'folder', children: [] },
      {
        id: makeId('ps_file'),
        name: 'archive-info.txt',
        type: 'file',
        format: 'txt',
        updatedAt: createdAt,
        content: `source=${file.name}\nsize=${formatFileSize(file.size)}\nimportedAt=${formatTime(createdAt)}`,
      },
    ],
  };
}

function filterPersonalSkillNodes(nodes: PersonalSkillNode[], query: string): PersonalSkillNode[] {
  if (!query) return nodes;
  const q = query.trim().toLowerCase();
  return nodes.reduce<PersonalSkillNode[]>((acc, node) => {
    if (node.type === 'file') {
      const matches = node.name.toLowerCase().includes(q) || node.content.toLowerCase().includes(q);
      if (matches) acc.push(node);
      return acc;
    }
    const children = filterPersonalSkillNodes(node.children, query);
    if (node.name.toLowerCase().includes(q) || children.length > 0) {
      acc.push({ ...node, children });
    }
    return acc;
  }, []);
}

function collectPersonalFolderIds(nodes: PersonalSkillNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type !== 'folder') return [];
    return [node.id, ...collectPersonalFolderIds(node.children)];
  });
}

function renderPersonalSkillContent(content: string, format: PersonalSkillFileFormat): React.ReactNode {
  if (format === 'json' || format === 'code') {
    return (
      <pre className="whitespace-pre-wrap break-words rounded-[12px] bg-[#fafbfd] px-[20px] py-[18px] text-[13px] leading-[22px] text-[#191919]">
        {content}
      </pre>
    );
  }

  const lines = content.split('\n');
  const blocks: Array<
    | { type: 'h1'; text: string }
    | { type: 'h2'; text: string }
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] }
  > = [];

  let paragraphBuffer: string[] = [];
  let ulBuffer: string[] = [];
  let olBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    blocks.push({ type: 'p', text: paragraphBuffer.join(' ') });
    paragraphBuffer = [];
  };

  const flushLists = () => {
    if (ulBuffer.length) {
      blocks.push({ type: 'ul', items: ulBuffer });
      ulBuffer = [];
    }
    if (olBuffer.length) {
      blocks.push({ type: 'ol', items: olBuffer });
      olBuffer = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushLists();
      return;
    }
    if (line.startsWith('# ')) {
      flushParagraph();
      flushLists();
      blocks.push({ type: 'h1', text: line.slice(2) });
      return;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushLists();
      blocks.push({ type: 'h2', text: line.slice(3) });
      return;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      olBuffer = [];
      ulBuffer.push(line.slice(2));
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      ulBuffer = [];
      olBuffer.push(line.replace(/^\d+\.\s/, ''));
      return;
    }
    flushLists();
    paragraphBuffer.push(line);
  });

  flushParagraph();
  flushLists();

  return blocks.map((block, index) => {
    if (block.type === 'h1') {
      return <h1 key={index} className="text-[28px] font-semibold leading-[40px] text-[#191919]">{block.text}</h1>;
    }
    if (block.type === 'h2') {
      return <h2 key={index} className="mt-[28px] text-[16px] font-semibold leading-[24px] text-[#191919]">{block.text}</h2>;
    }
    if (block.type === 'p') {
      return <p key={index} className="mt-[12px] text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">{block.text}</p>;
    }
    if (block.type === 'ul') {
      return (
        <div key={index} className="mt-[12px] space-y-[4px]">
          {block.items.map((item) => (
            <div key={item} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">
              • {item}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div key={index} className="mt-[12px] space-y-[4px]">
        {block.items.map((item, itemIndex) => (
          <div key={item} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">
            {itemIndex + 1}. {item}
          </div>
        ))}
      </div>
    );
  });
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
  { key: 'skill_market', label: '技能库', icon: LayoutGrid },
  { key: 'knowledge_base', label: '资产库', icon: FolderOpen },
];

const SKILL_SOURCE_LABEL: Record<SkillSource, string> = {
  platform: '平台技能',
  personal: '项目技能',
};

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
  const [activeKnowledgeSource, setActiveKnowledgeSource] = useState<'platform' | 'personal'>('platform');
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [knowledgeTagFilter, setKnowledgeTagFilter] = useState('全部');
  const [knowledgeSortMode, setKnowledgeSortMode] = useState<'recent' | 'title'>('recent');
  const [referencedKnowledgeIds, setReferencedKnowledgeIds] = useState<string[]>([]);

  const [collapsedKnowledgeGroups, setCollapsedKnowledgeGroups] = useState<Record<KnowledgeItem['group'], boolean>>({
    '领域专业知识': false,
    '团队知识': false,
    '个人资产': false,
  });
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<AssetTabKey>('user_insight');
  const [galleryCategory, setGalleryCategory] = useState<string>('全部');
  const [galleryHoverId, setGalleryHoverId] = useState<string | null>(null);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<SkillMarketCategory | '全部技能'>('全部技能');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [activeSkillSource, setActiveSkillSource] = useState<SkillSource>('platform');
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<SkillMarketItem | null>(null);
  const [activeSkillDetailTab, setActiveSkillDetailTab] = useState<'overview' | 'history'>('overview');
  const personalSkillUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [personalSkillPackages, setPersonalSkillPackages] = useState<PersonalSkillPackage[]>(loadPersonalSkillPackages);
  const [selectedPersonalSkillId, setSelectedPersonalSkillId] = useState<string | null>(() => loadPersonalSkillPackages()[0]?.id ?? null);
  const [selectedPersonalNodeId, setSelectedPersonalNodeId] = useState<string | null>(() => {
    const firstPackage = loadPersonalSkillPackages()[0];
    return firstPackage ? findFirstPersonalSkillFile(firstPackage.nodes)?.id ?? null : null;
  });
  const [personalSkillViewMode, setPersonalSkillViewMode] = useState<'preview' | 'edit'>('preview');
  const [expandedPersonalSkillIds, setExpandedPersonalSkillIds] = useState<Record<string, boolean>>(() => {
    const [firstPackage] = loadPersonalSkillPackages();
    return firstPackage ? { [firstPackage.id]: true } : {};
  });
  const [expandedPersonalFolderIds, setExpandedPersonalFolderIds] = useState<Record<string, boolean>>({});
  const [collapsedSkillGroups, setCollapsedSkillGroups] = useState<Record<SkillMarketCategory, boolean>>({
    '高保真设计': false,
    '用户研究': false,
    '视觉设计': false,
    '竞品分析': false,
    '趋势报告': false,
    '体验评估': false,
  });

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
    savePersonalSkillPackages(personalSkillPackages);
  }, [personalSkillPackages]);

  const filteredPersonalSkillPackages = useMemo(() => {
    const q = skillSearchQuery.trim().toLowerCase();
    return personalSkillPackages
      .map((pkg) => {
        if (!q) return pkg;
        const filteredNodes = filterPersonalSkillNodes(pkg.nodes, q);
        const matchesPkg = pkg.name.toLowerCase().includes(q) || pkg.summary.toLowerCase().includes(q);
        if (!matchesPkg && filteredNodes.length === 0) return null;
        return { ...pkg, nodes: matchesPkg && filteredNodes.length === 0 ? pkg.nodes : filteredNodes };
      })
      .filter((item): item is PersonalSkillPackage => item !== null);
  }, [personalSkillPackages, skillSearchQuery]);

  const selectedPersonalSkill = useMemo(
    () => filteredPersonalSkillPackages.find((pkg) => pkg.id === selectedPersonalSkillId) ?? filteredPersonalSkillPackages[0] ?? null,
    [filteredPersonalSkillPackages, selectedPersonalSkillId],
  );

  const selectedPersonalNode = useMemo(() => {
    if (!selectedPersonalSkill || !selectedPersonalNodeId) return findFirstPersonalSkillFile(selectedPersonalSkill?.nodes ?? []);
    return findPersonalSkillNode(selectedPersonalSkill.nodes, selectedPersonalNodeId);
  }, [selectedPersonalNodeId, selectedPersonalSkill]);

  const selectedPersonalFile = selectedPersonalNode?.type === 'file' ? selectedPersonalNode : null;

  useEffect(() => {
    if (!filteredPersonalSkillPackages.length) {
      setSelectedPersonalSkillId(null);
      setSelectedPersonalNodeId(null);
      return;
    }

    const currentPackage = filteredPersonalSkillPackages.find((pkg) => pkg.id === selectedPersonalSkillId) ?? filteredPersonalSkillPackages[0];
    if (currentPackage.id !== selectedPersonalSkillId) {
      setSelectedPersonalSkillId(currentPackage.id);
    }

    const currentNode = selectedPersonalNodeId ? findPersonalSkillNode(currentPackage.nodes, selectedPersonalNodeId) : null;
    if (!currentNode || currentNode.type !== 'file') {
      const firstFile = findFirstPersonalSkillFile(currentPackage.nodes);
      setSelectedPersonalNodeId(firstFile?.id ?? null);
    }
  }, [filteredPersonalSkillPackages, selectedPersonalNodeId, selectedPersonalSkillId]);

  useEffect(() => {
    if (!skillSearchQuery.trim()) return;
    setExpandedPersonalSkillIds(
      Object.fromEntries(filteredPersonalSkillPackages.map((pkg) => [pkg.id, true])),
    );
    if (selectedPersonalSkill) {
      setExpandedPersonalFolderIds(
        Object.fromEntries(collectPersonalFolderIds(selectedPersonalSkill.nodes).map((id) => [id, true])),
      );
    }
  }, [filteredPersonalSkillPackages, selectedPersonalSkill, skillSearchQuery]);

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

  const groupedVisibleSkills = useMemo(() => {
    const groups = SKILL_MARKET_CATEGORIES
      .map((category) => ({
        category,
        items: visibleSkills.filter((skill) => skill.category === category),
      }))
      .filter((group) => group.items.length > 0);

    if (skillCategoryFilter !== '全部技能') {
      return groups.filter((group) => group.category === skillCategoryFilter);
    }

    return groups;
  }, [skillCategoryFilter, visibleSkills]);

  const closeSkillDetail = useCallback(() => {
    setActiveSkillDetailTab('overview');
    setSelectedSkillDetail(null);
  }, []);

  const togglePersonalSkillPackage = useCallback((pkg: PersonalSkillPackage) => {
    setExpandedPersonalSkillIds((prev) => ({ ...prev, [pkg.id]: !(prev[pkg.id] ?? false) }));
    setSelectedPersonalSkillId(pkg.id);
    const firstFile = findFirstPersonalSkillFile(pkg.nodes);
    if (firstFile) setSelectedPersonalNodeId(firstFile.id);
  }, []);

  const togglePersonalSkillFolder = useCallback((folderId: string) => {
    setExpandedPersonalFolderIds((prev) => ({ ...prev, [folderId]: !(prev[folderId] ?? false) }));
  }, []);

  const handlePersonalSkillContentChange = useCallback((nextContent: string) => {
    if (!selectedPersonalSkill || !selectedPersonalFile) return;
    const updatedAt = Date.now();
    setPersonalSkillPackages((prev) => prev.map((pkg) => (
      pkg.id === selectedPersonalSkill.id
        ? {
            ...pkg,
            updatedAt,
            nodes: updatePersonalSkillNodeContent(pkg.nodes, selectedPersonalFile.id, nextContent, updatedAt),
          }
        : pkg
    )));
  }, [selectedPersonalFile, selectedPersonalSkill]);

  const handlePersonalSkillUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const zipFiles = files.filter((file) => /\.zip$/i.test(file.name));
    if (!zipFiles.length) {
      setToast('仅支持上传 .zip 技能包');
      event.target.value = '';
      return;
    }

    const createdPackages = zipFiles.map((file) => createPersonalSkillPackageFromArchive(file));
    const firstPackage = createdPackages[0];
    const firstFile = firstPackage ? findFirstPersonalSkillFile(firstPackage.nodes) : null;

    setPersonalSkillPackages((prev) => [...createdPackages, ...prev]);

    if (firstPackage) {
      setExpandedPersonalSkillIds((prev) => ({
        ...prev,
        ...Object.fromEntries(createdPackages.map((pkg) => [pkg.id, true])),
      }));
      setSelectedPersonalSkillId(firstPackage.id);
      setSelectedPersonalNodeId(firstFile?.id ?? null);
      setPersonalSkillViewMode('preview');
    }

    if (zipFiles.length !== files.length) {
      setToast(`已导入 ${zipFiles.length} 个 zip 技能包，非 zip 文件已忽略`);
    } else {
      setToast(`已导入 ${zipFiles.length} 个 zip 技能包`);
    }
    event.target.value = '';
  }, []);

  const toggleSkillGroup = useCallback((category: SkillMarketCategory) => {
    setCollapsedSkillGroups((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const scopedKnowledgeItems = useMemo(
    () => knowledgeItems.filter((item) => getKnowledgeSource(item) === activeKnowledgeSource),
    [activeKnowledgeSource, knowledgeItems],
  );

  const knowledgeTagOptions = useMemo(() => {
    const tags = Array.from(new Set(scopedKnowledgeItems.flatMap((item) => item.tags ?? [])));
    return ['全部', ...tags.slice(0, 8)];
  }, [scopedKnowledgeItems]);

  const filteredKnowledgeItems = useMemo(() => {
    const q = knowledgeSearchQuery.trim().toLowerCase();
    const next = scopedKnowledgeItems.filter((item) => {
      const matchesQuery = !q
        || item.title.toLowerCase().includes(q)
        || (item.owner ?? '').toLowerCase().includes(q)
        || (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      const matchesTag = knowledgeTagFilter === '全部' || (item.tags ?? []).includes(knowledgeTagFilter);
      return matchesQuery && matchesTag;
    });
    return [...next].sort((a, b) => knowledgeSortMode === 'recent'
      ? b.updatedAt - a.updatedAt
      : a.title.localeCompare(b.title, 'zh-CN'));
  }, [knowledgeSearchQuery, knowledgeSortMode, knowledgeTagFilter, scopedKnowledgeItems]);

  const groupedKnowledgeItems = useMemo(() => {
    const groups = activeKnowledgeSource === 'platform'
      ? (['领域专业知识', '团队知识'] as KnowledgeItem['group'][])
      : (['个人资产'] as KnowledgeItem['group'][]);
    return groups.map((group) => ({
      group,
      items: filteredKnowledgeItems.filter((item) => item.group === group),
    })).filter(({ items }) => items.length > 0);
  }, [activeKnowledgeSource, filteredKnowledgeItems]);

  const selectedKnowledgeItem = useMemo(
    () => filteredKnowledgeItems.find((item) => item.id === selectedKnowledgeId) ?? filteredKnowledgeItems[0] ?? null,
    [filteredKnowledgeItems, selectedKnowledgeId],
  );

  const referencedKnowledgeItems = useMemo(
    () => knowledgeItems.filter((item) => referencedKnowledgeIds.includes(item.id)),
    [knowledgeItems, referencedKnowledgeIds],
  );

  const knowledgeConflictItem = useMemo(
    () => referencedKnowledgeItems.find((item) => getKnowledgeSource(item) === 'personal' && item.riskNote),
    [referencedKnowledgeItems],
  );

  useEffect(() => {
    if (!filteredKnowledgeItems.length) {
      setSelectedKnowledgeId(null);
      return;
    }
    if (!selectedKnowledgeId || !filteredKnowledgeItems.some((item) => item.id === selectedKnowledgeId)) {
      setSelectedKnowledgeId(filteredKnowledgeItems[0].id);
    }
  }, [filteredKnowledgeItems, selectedKnowledgeId]);

  const handleKnowledgeUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const created = files.map((file, index) => {
      const rawExt = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
      const format = (KNOWLEDGE_FORMATS.includes(rawExt as NonNullable<KnowledgeItem['format']>)
        ? rawExt
        : 'txt') as NonNullable<KnowledgeItem['format']>;
      const title = file.name.replace(/\.[^/.]+$/, '') || `上传文档 ${index + 1}`;

      const createdItem: KnowledgeItem = {
        id: makeId('kb_upload'),
        title,
        source: 'personal',
        group: '个人资产',
        type: 'doc',
        size: formatFileSize(file.size),
        updatedAt: Date.now() + index,
        format,
        owner: '你',
        visibility: 'private',
        uploadSource: 'local',
        authority: '参考',
        applicableScenarios: ['当前会话补充', '交付复用', '本地上传'],
        citationLabel: `个人资产 · ${title}`,
        tags: ['上传资产', format.toUpperCase(), '待整理'],
        snippet: `已上传文件《${file.name}》（示意）。系统已创建个人资产卡片，可直接引用到当前会话。`,
        sections: [
          { title: '来源信息', content: `来源文件：${file.name}\n文件类型：${format.toUpperCase()}\n导入时间：${formatTime(Date.now())}` },
          { title: '资产摘要（可编辑）', content: '请在这里补充该资产的核心内容、结论与可复用信息。' },
          { title: '行动建议（可编辑）', content: '请补充下一步动作、负责人和适用场景。' },
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
    setActiveKnowledgeSource('personal');
    setToast(`已上传 ${created.length} 份个人资产`);
    knowledgeUploadGroupRef.current = null;
    event.target.value = '';
  }, []);

  const handleKnowledgeUploadClick = useCallback((group: KnowledgeItem['group']) => {
    knowledgeUploadGroupRef.current = group;
    knowledgeUploadInputRef.current?.click();
  }, []);

  const toggleKnowledgeReference = useCallback((id: string) => {
    setReferencedKnowledgeIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
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
                        <div className="absolute right-[4px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-[4px] px-[4px] py-[4px]">
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
            <input
              ref={personalSkillUploadInputRef}
              type="file"
              multiple
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handlePersonalSkillUpload}
              className="hidden"
            />
            <div className="shrink-0 border-b border-[rgba(0,0,0,0.08)] pl-[16px] pr-[40px] pt-[12px] pb-[13px]">
              <div className="flex items-center gap-[16px] min-h-[44px]">
                <div className="relative shrink-0 flex size-[36px] items-center justify-center overflow-hidden rounded-[10px] border border-white/35 bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_rgba(148,163,184,0.14)] backdrop-blur-[14px]">
                  <div className="absolute inset-[1px] rounded-[9px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.06))]" />
                  <div className="absolute right-[4px] top-[3px] h-[11px] w-[16px] rounded-full bg-white/30 blur-[6px]" />
                  <LayoutGrid size={16} strokeWidth={2.1} className="relative z-10 text-[#5167eb] drop-shadow-[0_1px_2px_rgba(81,103,235,0.12)]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold leading-[20px] text-black">技能库</div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-[10px] px-[20px] h-[52px] border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-[10px]">
                {(['platform', 'personal'] as SkillSource[]).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      setActiveSkillSource(src);
                      closeSkillDetail();
                    }}
                    className={`rounded-[18px] px-[12px] py-[4px] text-[14px] leading-[20px] transition-colors ${
                      activeSkillSource === src
                        ? 'bg-[rgba(10,89,247,0.10)] text-[#0a59f7] font-medium'
                        : 'text-[#191919] hover:text-[#0a59f7]'
                    }`}
                  >
                    {SKILL_SOURCE_LABEL[src]}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-[10px]">
                <div className="relative">
                  <Search size={12} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[rgba(0,0,0,0.35)]" />
                  <input
                    type="text"
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    placeholder={activeSkillSource === 'personal' ? '搜索' : '搜索技能'}
                    className="w-[280px] h-[36px] rounded-[12px] bg-[rgba(0,0,0,0.04)] pl-[30px] pr-[10px] text-[12px] text-[#1a1a1a] outline-none focus:bg-white focus:shadow-[0_0_0_1px_rgba(20,118,255,0.35)] transition-all"
                  />
                </div>
                {activeSkillSource === 'personal' && (
                  <button
                    type="button"
                    onClick={() => personalSkillUploadInputRef.current?.click()}
                    className="inline-flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[#1476ff] px-[14px] text-[13px] font-medium text-white hover:bg-[#0f67de] transition-colors"
                  >
                    <Upload size={14} />
                    <span>上传</span>
                  </button>
                )}
              </div>
            </div>

            {activeSkillSource === 'personal' ? (
              <PersonalSkillWorkspace
                packages={filteredPersonalSkillPackages}
                selectedPackage={selectedPersonalSkill}
                selectedFile={selectedPersonalFile}
                viewMode={personalSkillViewMode}
                expandedPackageIds={expandedPersonalSkillIds}
                expandedFolderIds={expandedPersonalFolderIds}
                onTogglePackage={togglePersonalSkillPackage}
                onToggleFolder={togglePersonalSkillFolder}
                onSelectPackage={setSelectedPersonalSkillId}
                onSelectFile={setSelectedPersonalNodeId}
                onViewModeChange={setPersonalSkillViewMode}
                onContentChange={handlePersonalSkillContentChange}
              />
            ) : selectedSkillDetail ? (
              <div className="flex-1 min-h-0 overflow-y-auto bg-transparent px-[32px] py-[32px]" style={{ scrollbarWidth: 'thin' }}>
                {(() => {
                  const categoryUi = SKILL_CATEGORY_UI[selectedSkillDetail.category];
                  const SkillIcon = categoryUi.icon;
                  return (
                    <div className="rounded-[16px] bg-white px-[32px] py-[24px]">
                      <button
                        type="button"
                        onClick={closeSkillDetail}
                        className="inline-flex items-center gap-[6px] text-[14px] font-medium text-[#191919] hover:text-[#0a59f7] transition-colors"
                      >
                        <ArrowLeft size={16} />
                        <span>{SKILL_SOURCE_LABEL[activeSkillSource]}</span>
                      </button>

                      <div className="mt-[24px] flex items-start justify-between gap-[24px] pb-[20px]">
                        <div className="min-w-0 flex items-start gap-[16px]">
                          <div
                            className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px]"
                            style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                          >
                            <SkillIcon size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[20px] font-semibold leading-[28px] text-[#191919]">{selectedSkillDetail.name}</div>
                            <div className="mt-[4px] text-[14px] leading-[22px] text-[rgba(25,25,25,0.7)]">
                              {selectedSkillDetail.detail.tagline}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSkill(selectedSkillDetail.id)}
                          className={`mt-[4px] h-[24px] w-[40px] rounded-full transition-colors shrink-0 relative ${
                            selectedSkillDetail.enabled ? 'bg-[#0a59f7]' : 'bg-[#d7dbe4]'
                          }`}
                          aria-label={`${selectedSkillDetail.enabled ? '停用' : '启用'} ${selectedSkillDetail.name}`}
                        >
                          <span
                            className={`absolute top-1/2 size-[16px] -translate-y-1/2 rounded-full bg-white transition-all ${
                              selectedSkillDetail.enabled ? 'left-[20px]' : 'left-[2px]'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-[24px] border-b border-[rgba(25,25,25,0.08)]">
                        {([
                          { key: 'overview' as const, label: '概述' },
                          { key: 'history' as const, label: '版本历史' },
                        ]).map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveSkillDetailTab(tab.key)}
                            className={`relative h-[40px] text-[14px] transition-colors ${
                              activeSkillDetailTab === tab.key
                                ? 'font-medium text-[#0a59f7]'
                                : 'text-[rgba(25,25,25,0.55)] hover:text-[#191919]'
                            }`}
                          >
                            {tab.label}
                            {activeSkillDetailTab === tab.key && (
                              <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#0a59f7]" />
                            )}
                          </button>
                        ))}
                      </div>

                      {activeSkillDetailTab === 'overview' ? (
                        <div className="pt-[28px] pb-[8px] text-[#191919]">
                          <div className="text-[30px] font-semibold leading-[40px]">{selectedSkillDetail.name}</div>

                          <div className="mt-[32px] space-y-[32px]">
                            <section>
                              <div className="text-[16px] font-semibold leading-[24px]">核心概念</div>
                              <p className="mt-[12px] text-[14px] leading-[28px] text-[rgba(25,25,25,0.85)]">
                                {selectedSkillDetail.detail.overview}
                              </p>
                            </section>

                            <section>
                              <div className="text-[16px] font-semibold leading-[24px]">适用场景</div>
                              <div className="mt-[12px] space-y-[4px]">
                                {selectedSkillDetail.detail.useCases.map((item) => (
                                  <div key={item} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.85)]">
                                    • {item}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <div className="text-[16px] font-semibold leading-[24px]">输出内容</div>
                              <div className="mt-[12px] space-y-[4px]">
                                {selectedSkillDetail.detail.outputs.map((item) => (
                                  <div key={item} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.85)]">
                                    • {item}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <div className="text-[16px] font-semibold leading-[24px]">推荐工作流</div>
                              <div className="mt-[12px] space-y-[4px]">
                                {selectedSkillDetail.detail.workflow.map((item, index) => (
                                  <div key={item} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.85)]">
                                    {index + 1}. {item}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <div className="text-[16px] font-semibold leading-[24px]">使用规则</div>
                              <div className="mt-[12px] space-y-[4px]">
                                {selectedSkillDetail.detail.rules.map((item) => (
                                  <div key={item} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.85)]">
                                    • {item}
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-[28px] pb-[8px]">
                          <div className="rounded-[12px] border border-[rgba(25,25,25,0.08)] bg-[#fafbfd] px-[20px] py-[18px]">
                            <div className="flex items-center justify-between gap-[12px]">
                              <div>
                                <div className="text-[15px] font-semibold leading-[22px] text-[#191919]">
                                  版本 {selectedSkillDetail.detail.version}
                                </div>
                                <div className="mt-[4px] text-[13px] leading-[20px] text-[rgba(25,25,25,0.55)]">
                                  更新于 {selectedSkillDetail.detail.updatedAt}
                                </div>
                              </div>
                              <span
                                className="inline-flex items-center gap-[6px] rounded-[999px] px-[10px] py-[4px] text-[12px] font-medium"
                                style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                              >
                                <SkillIcon size={12} />
                                {selectedSkillDetail.category}
                              </span>
                            </div>
                          </div>

                          <div className="mt-[16px] rounded-[12px] border border-dashed border-[rgba(25,25,25,0.12)] px-[20px] py-[18px] text-[14px] leading-[24px] text-[rgba(25,25,25,0.6)]">
                            当前原型只提供最新版本信息展示，后续可在这里补充变更记录、发布时间和版本对比。
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex bg-transparent">
                <div className="w-[280px] shrink-0 border-r border-[rgba(25,25,25,0.08)] bg-transparent px-[16px] py-[16px]">
                  <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <div className="space-y-[2px]">
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
                            className={`w-full rounded-[8px] px-[12px] py-[9px] flex items-center gap-[12px] text-left text-[14px] transition-colors ${
                              isActive ? 'bg-[rgba(10,89,247,0.10)] text-[#0a59f7]' : 'text-[#191919] hover:bg-[#f7f9fc]'
                            }`}
                          >
                            <span
                              className="shrink-0 flex items-center justify-center"
                              style={{ color: isActive ? '#0a59f7' : '#191919' }}
                            >
                              <CategoryIcon size={16} />
                            </span>
                            <span className={`truncate leading-[22px] ${isActive ? 'font-medium' : ''}`}>{category.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col bg-transparent">
                  <div className="flex-1 min-h-0 overflow-y-auto bg-transparent px-[32px] py-[32px]" style={{ scrollbarWidth: 'thin' }}>
                    <div className="space-y-[24px]">
                      {groupedVisibleSkills.map(({ category, items }) => {
                        const CategoryIcon = SKILL_MARKET_CATEGORIES.includes(category)
                          ? SKILL_CATEGORY_UI[category].icon
                          : FolderOpen;
                        const isCollapsed = collapsedSkillGroups[category];

                        return (
                          <section key={category} className="rounded-[16px] overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => toggleSkillGroup(category)}
                              className="w-full bg-transparent border-b border-[rgba(0,0,0,0.08)] px-[16px] py-[16px] flex items-center justify-between text-left"
                            >
                              <div className="flex items-center gap-[10px]">
                                <CategoryIcon size={20} className="text-[#191919]" />
                                <div className="text-[14px] font-bold leading-[18px] text-black">{category}</div>
                              </div>
                              <ChevronRight
                                size={14}
                                className={`text-[rgba(25,25,25,0.45)] transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-90'}`}
                              />
                            </button>

                            {!isCollapsed && (
                              <div className="bg-transparent px-[16px] py-[16px] space-y-[12px]">
                                {items.map((skill) => (
                                  <div
                                    key={skill.id}
                                    onClick={() => {
                                      setActiveSkillDetailTab('overview');
                                      setSelectedSkillDetail(skill);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setActiveSkillDetailTab('overview');
                                        setSelectedSkillDetail(skill);
                                      }
                                    }}
                                    className="flex items-center gap-[10px] rounded-[8px] bg-[rgba(44,46,52,0.03)] px-[16px] py-[16px] cursor-pointer transition-colors hover:bg-[rgba(44,46,52,0.06)]"
                                  >
                                    <div className="size-[16px] shrink-0 flex items-center justify-center text-[#191919]">
                                      <FolderOpen size={14} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="text-[12px] font-medium leading-[18px] text-black">{skill.name}</div>
                                      <div className="mt-[2px] text-[12px] leading-[18px] text-[rgba(25,25,25,0.7)]">
                                        {skill.description}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        toggleSkill(skill.id);
                                      }}
                                      className={`w-[32px] h-[20px] rounded-full transition-colors shrink-0 relative ${
                                        skill.enabled ? 'bg-[#0a59f7]' : 'bg-[#d7dbe4]'
                                      }`}
                                      aria-label={`${skill.enabled ? '停用' : '启用'} ${skill.name}`}
                                    >
                                      <span
                                        className={`absolute top-1/2 -translate-y-1/2 size-[12px] rounded-full bg-white transition-all ${
                                          skill.enabled ? 'left-[18px]' : 'left-[2px]'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        );
                      })}

                      {groupedVisibleSkills.length === 0 && (
                        <div className="py-16 text-center text-[14px] text-[#999]">
                          未找到匹配的技能
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeNav === 'knowledge_base' && (
          <AssetsPanel
            activeTab={activeKnowledgeTab}
            onActiveTabChange={setActiveKnowledgeTab}
            onToast={setToast}
          />
        )}
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

function PersonalSkillWorkspace({
  packages,
  selectedPackage,
  selectedFile,
  viewMode,
  expandedPackageIds,
  expandedFolderIds,
  onTogglePackage,
  onToggleFolder,
  onSelectPackage,
  onSelectFile,
  onViewModeChange,
  onContentChange,
}: {
  packages: PersonalSkillPackage[];
  selectedPackage: PersonalSkillPackage | null;
  selectedFile: PersonalSkillFileNode | null;
  viewMode: 'preview' | 'edit';
  expandedPackageIds: Record<string, boolean>;
  expandedFolderIds: Record<string, boolean>;
  onTogglePackage: (pkg: PersonalSkillPackage) => void;
  onToggleFolder: (folderId: string) => void;
  onSelectPackage: (pkgId: string) => void;
  onSelectFile: (nodeId: string) => void;
  onViewModeChange: (mode: 'preview' | 'edit') => void;
  onContentChange: (nextContent: string) => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex bg-transparent">
      <aside className="w-[324px] shrink-0 border-r border-[rgba(25,25,25,0.08)] bg-[rgba(255,255,255,0.55)]">
        <div className="h-full overflow-y-auto px-[16px] py-[20px]" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-[12px]">
            {packages.map((pkg) => {
              const isExpanded = expandedPackageIds[pkg.id] ?? pkg.id === selectedPackage?.id;
              const isSelected = pkg.id === selectedPackage?.id;
              return (
                <div key={pkg.id} className="space-y-[4px]">
                  <button
                    type="button"
                    onClick={() => onTogglePackage(pkg)}
                    className="flex w-full items-center gap-[10px] rounded-[12px] px-[12px] py-[10px] text-left text-[#191919] transition-colors hover:bg-[rgba(10,89,247,0.04)]"
                  >
                    <FileText size={16} className="shrink-0 text-[#191919]" />
                    <span className={`min-w-0 flex-1 truncate text-[14px] leading-[22px] ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                      {pkg.name}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 text-[rgba(25,25,25,0.45)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="space-y-[2px] pl-[26px]">
                      {pkg.nodes.map((node) => (
                        <PersonalSkillTreeNode
                          key={node.id}
                          node={node}
                          depth={0}
                          selectedFileId={selectedFile?.id ?? null}
                          expandedFolderIds={expandedFolderIds}
                          onToggleFolder={onToggleFolder}
                          onSelectFile={onSelectFile}
                          onSelectPackage={() => onSelectPackage(pkg.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {packages.length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[rgba(25,25,25,0.12)] px-[16px] py-[18px] text-[13px] leading-[22px] text-[rgba(25,25,25,0.55)]">
                没有匹配的个人技能，试试更换关键词或上传新的技能文件。
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col bg-white">
        {selectedPackage ? (
          <>
            <div className="shrink-0 border-b border-[rgba(25,25,25,0.08)] px-[28px] py-[18px]">
              <div className="flex items-start justify-between gap-[20px]">
                <div className="min-w-0 flex items-start gap-[12px]">
                  <div className="min-w-0">
                    <div className="text-[18px] font-semibold leading-[28px] text-[#191919]">{selectedPackage.name}</div>
                    <div className="text-[14px] leading-[22px] text-[rgba(25,25,25,0.72)]">{selectedPackage.summary}</div>
                  </div>
                </div>

                <div className="flex items-center rounded-[12px] bg-[rgba(25,25,25,0.04)] p-[3px]">
                  {([
                    { key: 'preview' as const, label: '预览', icon: Eye },
                    { key: 'edit' as const, label: '编辑', icon: FileText },
                  ]).map((item) => {
                    const Icon = item.icon;
                    const isActive = viewMode === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onViewModeChange(item.key)}
                        className={`inline-flex h-[32px] items-center gap-[6px] rounded-[10px] px-[12px] text-[13px] transition-colors ${
                          isActive
                            ? 'bg-white text-[#191919] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                            : 'text-[rgba(25,25,25,0.55)] hover:text-[#191919]'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-[28px] py-[24px]" style={{ scrollbarWidth: 'thin' }}>
              {selectedFile ? (
                viewMode === 'preview' ? (
                  <div className="max-w-none">
                    {renderPersonalSkillContent(selectedFile.content, selectedFile.format)}
                  </div>
                ) : (
                  <div className="space-y-[12px]">
                    <div className="flex items-center gap-[8px] text-[12px] text-[rgba(25,25,25,0.5)]">
                      <span>{selectedFile.name}</span>
                      <span>·</span>
                      <span>自动保存</span>
                    </div>
                    <textarea
                      value={selectedFile.content}
                      onChange={(event) => onContentChange(event.target.value)}
                      className="min-h-[720px] w-full resize-none rounded-[16px] border border-[rgba(25,25,25,0.08)] bg-[#fafbfd] px-[18px] py-[16px] font-mono text-[13px] leading-[22px] text-[#191919] outline-none focus:border-[rgba(10,89,247,0.35)] focus:bg-white"
                    />
                  </div>
                )
              ) : (
                <div className="rounded-[16px] border border-dashed border-[rgba(25,25,25,0.12)] px-[20px] py-[18px] text-[14px] leading-[24px] text-[rgba(25,25,25,0.55)]">
                  从左侧选择一个技能文件开始预览。
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[14px] text-[rgba(25,25,25,0.45)]">
            还没有个人技能，点击右上角上传开始创建。
          </div>
        )}
      </section>
    </div>
  );
}

function PersonalSkillTreeNode({
  node,
  depth,
  selectedFileId,
  expandedFolderIds,
  onToggleFolder,
  onSelectFile,
  onSelectPackage,
}: {
  node: PersonalSkillNode;
  depth: number;
  selectedFileId: string | null;
  expandedFolderIds: Record<string, boolean>;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (nodeId: string) => void;
  onSelectPackage: () => void;
}) {
  const paddingLeft = 12 + depth * 18;

  if (node.type === 'file') {
    const isSelected = node.id === selectedFileId;
    return (
      <button
        type="button"
        onClick={() => {
          onSelectPackage();
          onSelectFile(node.id);
        }}
        className={`flex w-full items-center gap-[10px] rounded-[10px] py-[9px] pr-[12px] text-left transition-colors ${
          isSelected ? 'bg-[rgba(10,89,247,0.10)] text-[#191919]' : 'text-[#191919] hover:bg-[rgba(10,89,247,0.04)]'
        }`}
        style={{ paddingLeft }}
      >
        <FileText size={15} className={`shrink-0 ${isSelected ? 'text-[#0a59f7]' : 'text-[rgba(25,25,25,0.72)]'}`} />
        <span className="truncate text-[14px] leading-[22px]">{node.name}</span>
      </button>
    );
  }

  const isExpanded = expandedFolderIds[node.id] ?? false;
  return (
    <div className="space-y-[2px]">
      <button
        type="button"
        onClick={() => onToggleFolder(node.id)}
        className="flex w-full items-center gap-[10px] py-[9px] pr-[12px] text-left text-[#191919] transition-colors hover:bg-[rgba(10,89,247,0.04)] rounded-[10px]"
        style={{ paddingLeft }}
      >
        <FolderOpen size={15} className="shrink-0 text-[rgba(25,25,25,0.72)]" />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[22px]">{node.name}</span>
        <ChevronRight
          size={14}
          className={`shrink-0 text-[rgba(25,25,25,0.45)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-[2px]">
          {node.children.map((child) => (
            <PersonalSkillTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              expandedFolderIds={expandedFolderIds}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
              onSelectPackage={onSelectPackage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
