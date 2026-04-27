/**
 * 资产库模块 — 静态模拟数据
 * 覆盖：用户洞察、设计系统（设计规范 / 插画 / 图标）、原型开发、体验评估
 * 二级资产源：platform（平台资产） / personal（项目资产，沿用内部 key）
 */

export type AssetSource = 'platform' | 'personal';

// ─── 通用：.doc 模版卡片（用户洞察 / 体验评估共用） ──────────────────
export interface AssetDocCard {
  id: string;
  title: string;
  format: 'doc' | 'docx' | 'pdf' | 'xlsx' | 'xls' | 'ppt' | 'pptx';
  updatedAt: string;
  owner: string;
  usage: number;
  summary: string;
  source: AssetSource;
}

const pickTemplateFormat = (title: string, idx: number): AssetDocCard['format'] => {
  if (/记录表|量表|清单|评分卡|问卷/.test(title)) return idx % 2 === 0 ? 'xlsx' : 'xls';
  if (/汇报|地图|故事板/.test(title)) return idx % 2 === 0 ? 'pptx' : 'ppt';
  if (/报告|走查|评审/.test(title)) return 'pdf';
  return (['docx', 'pptx', 'xlsx', 'pdf', 'doc', 'ppt'] as const)[idx % 6];
};

const makeTemplates = (prefix: string, titles: string[], source: AssetSource): AssetDocCard[] =>
  titles.map((title, idx) => ({
    id: `${prefix}_${source}_${idx}`,
    title,
    format: pickTemplateFormat(title, idx),
    updatedAt: `2026-0${Math.max(1, (idx % 4) + 1)}-${String((idx * 3 + 5) % 28 || 12).padStart(2, '0')}`,
    owner: ['张航', '林舒', '王岸', 'UX 委员会', '体验中台'][idx % 5],
    usage: 20 + ((idx * 17) % 380),
    summary: ['模版包含标准访谈提纲、问题集与记录框架', '结构化输出受访者画像与洞察结论', '可直接复用并适配到具体项目场景'][idx % 3],
    source,
  }));

const USER_INSIGHT_TITLES_PLATFORM = [
  '访谈大纲模版',
  '用户画像调研模版',
  '竞品体验走查模版',
  '可用性测试记录表',
  '客户旅程地图模版',
  '定量问卷模版',
  '焦点小组访谈模版',
  '专家评审模版',
  '场景故事板模版',
  '研究报告汇报模版',
];

const USER_INSIGHT_TITLES_PROJECT = [
  'Devkit V2.6 用户访谈记录',
  'ICT 管理员画像草稿',
  '云服务迁移走查笔记',
  '开发者调研问卷初稿',
];

const EXPERIENCE_EVAL_TITLES_PLATFORM = [
  '体验度量标准模版',
  'SUS 量表评估模版',
  '端到端任务走查模版',
  '关键路径体验检核表',
  '无障碍合规检查清单',
  '视觉一致性审核模版',
  '体验走查复盘模版',
  '发版前体验自检清单',
  '体验评分卡模版',
  '客户满意度评估模版',
];

const EXPERIENCE_EVAL_TITLES_PROJECT = [
  'Devkit 2.6 体验自检',
  '云控制台关键路径走查',
  '开发者工具链满意度回访',
];

export const USER_INSIGHT_TEMPLATES: AssetDocCard[] = [
  ...makeTemplates('ui', USER_INSIGHT_TITLES_PLATFORM, 'platform'),
  ...makeTemplates('ui', USER_INSIGHT_TITLES_PROJECT, 'personal'),
];

export const EXPERIENCE_EVAL_TEMPLATES: AssetDocCard[] = [
  ...makeTemplates('ee', EXPERIENCE_EVAL_TITLES_PLATFORM, 'platform'),
  ...makeTemplates('ee', EXPERIENCE_EVAL_TITLES_PROJECT, 'personal'),
];

// ─── 设计系统 ─────────────────────────────────────────────────────
export type DesignSpecSource = 'ICT' | 'H Design' | 'BP&IT';
export const DESIGN_SPEC_SOURCES: DesignSpecSource[] = ['ICT', 'H Design', 'BP&IT'];

export interface DesignSpecItem {
  id: string;
  name: string;
  description: string;
  category: '基础组件' | 'Pattern' | '布局' | '基础样式';
}

export const DESIGN_SPECS: Record<DesignSpecSource, DesignSpecItem[]> = {
  ICT: [
    { id: 'ict_btn', name: 'Button', description: '主按钮 / 次按钮 / 文本按钮，含四种尺寸与 Loading 态', category: '基础组件' },
    { id: 'ict_input', name: 'Input', description: '单行输入，带前后缀、清除、错误提示', category: '基础组件' },
    { id: 'ict_table', name: 'Table', description: '带排序、筛选、可展开行的数据表格', category: '基础组件' },
    { id: 'ict_form', name: 'Form 校验 Pattern', description: '统一的校验时机、错误文案位置与提交态规范', category: 'Pattern' },
    { id: 'ict_empty', name: '空状态 Pattern', description: '权限受限 / 无数据 / 搜索无结果三类空态', category: 'Pattern' },
    { id: 'ict_grid', name: '栅格布局', description: '24 栅格 · 断点 1280/1440/1920 的适配约束', category: '布局' },
    { id: 'ict_color', name: '色彩体系', description: '功能色 / 品牌色 / 中性色 · 深浅色模式映射', category: '基础样式' },
  ],
  'H Design': [
    { id: 'hd_btn', name: 'HButton', description: '融合情感化反馈的按钮，支持弹性动效', category: '基础组件' },
    { id: 'hd_card', name: 'HCard', description: '卡片容器 · 支持玻璃材质与阴影层级', category: '基础组件' },
    { id: 'hd_nav', name: 'Navigation', description: '导航栏 / 侧栏 / Tab 三套范式', category: '基础组件' },
    { id: 'hd_toast', name: '反馈提示 Pattern', description: 'Toast / Notification / Dialog 的使用边界', category: 'Pattern' },
    { id: 'hd_onboarding', name: '引导流 Pattern', description: '首次登录引导、功能发现、任务完成庆祝', category: 'Pattern' },
    { id: 'hd_motion', name: '动效语言', description: 'Ease 曲线与时长 · 场景化动效分级', category: '基础样式' },
  ],
  'BP&IT': [
    { id: 'bp_btn', name: 'BP Button', description: 'IT 作业型界面的按钮规范，强调结果明确', category: '基础组件' },
    { id: 'bp_filter', name: 'Filter 组合', description: '复杂查询条件组合与保存方案', category: '基础组件' },
    { id: 'bp_approval', name: '审批单 Pattern', description: '审批节点可视化 · 多级并行会签展示', category: 'Pattern' },
    { id: 'bp_detail', name: '详情页 Pattern', description: '左右结构的详情页布局与字段密度', category: 'Pattern' },
    { id: 'bp_layout', name: '作业台布局', description: '工单台 / 运维台 / 数据看板的三套骨架', category: '布局' },
  ],
};

// ─── 插画 ────────────────────────────────────────────────────────
export interface IllustrationItem {
  id: string;
  title: string;
  category: string;
  gradient: string;
  source: AssetSource;
}

export const ILLUSTRATION_CATEGORIES = ['全部', '业务场景', '空状态', '引导', '庆祝', '错误状态'] as const;

export const ILLUSTRATIONS: IllustrationItem[] = [
  { id: 'il_1', title: '数据可视化看板', category: '业务场景', gradient: 'linear-gradient(135deg,#c7d2fe,#e0e7ff 60%,#fce7f3)', source: 'platform' },
  { id: 'il_2', title: '空搜索结果', category: '空状态', gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)', source: 'platform' },
  { id: 'il_3', title: '首次登录引导', category: '引导', gradient: 'linear-gradient(135deg,#a7f3d0,#bbf7d0,#fef9c3)', source: 'platform' },
  { id: 'il_4', title: '任务完成庆祝', category: '庆祝', gradient: 'linear-gradient(135deg,#fbcfe8,#f5d0fe,#ddd6fe)', source: 'platform' },
  { id: 'il_5', title: '服务器异常', category: '错误状态', gradient: 'linear-gradient(135deg,#fecaca,#fed7aa)', source: 'platform' },
  { id: 'il_6', title: '数据导入中', category: '业务场景', gradient: 'linear-gradient(135deg,#bae6fd,#dbeafe)', source: 'platform' },
  { id: 'il_7', title: '权限不足', category: '空状态', gradient: 'linear-gradient(135deg,#e5e7eb,#f3f4f6)', source: 'platform' },
  { id: 'il_8', title: '新功能上线', category: '引导', gradient: 'linear-gradient(135deg,#fecdd3,#fed7aa,#fef08a)', source: 'platform' },
  { id: 'il_9', title: '订阅成功', category: '庆祝', gradient: 'linear-gradient(135deg,#bbf7d0,#99f6e4)', source: 'platform' },
  { id: 'il_10', title: '网络断开', category: '错误状态', gradient: 'linear-gradient(135deg,#cbd5e1,#e2e8f0)', source: 'platform' },
  { id: 'il_11', title: '合作协同场景', category: '业务场景', gradient: 'linear-gradient(135deg,#c4b5fd,#a5b4fc,#bfdbfe)', source: 'platform' },
  { id: 'il_12', title: '搜索历史为空', category: '空状态', gradient: 'linear-gradient(135deg,#fef9c3,#fde68a)', source: 'platform' },
  { id: 'il_p1', title: 'Devkit 首次安装欢迎', category: '引导', gradient: 'linear-gradient(135deg,#bfdbfe,#c7d2fe)', source: 'personal' },
  { id: 'il_p2', title: 'Devkit 发版庆祝', category: '庆祝', gradient: 'linear-gradient(135deg,#fbcfe8,#e9d5ff)', source: 'personal' },
  { id: 'il_p3', title: 'Devkit 构建失败', category: '错误状态', gradient: 'linear-gradient(135deg,#fecaca,#fed7aa)', source: 'personal' },
];

// ─── 图标 ────────────────────────────────────────────────────────
export interface IconItem {
  id: string;
  name: string;
  category: string;
  glyph: string;
  source: AssetSource;
}

export const ICON_CATEGORIES = ['全部', '通用', '方向', '文件', '数据', '通信', '设置'] as const;

const ICON_SEED: Array<[string, string, string]> = [
  ['home', '通用', '🏠'], ['user', '通用', '👤'], ['search', '通用', '🔍'], ['star', '通用', '⭐'],
  ['heart', '通用', '❤️'], ['bell', '通用', '🔔'], ['arrow-up', '方向', '⬆️'], ['arrow-down', '方向', '⬇️'],
  ['arrow-left', '方向', '⬅️'], ['arrow-right', '方向', '➡️'], ['file', '文件', '📄'], ['folder', '文件', '📁'],
  ['document', '文件', '📃'], ['archive', '文件', '🗄️'], ['chart', '数据', '📊'], ['graph', '数据', '📈'],
  ['pie', '数据', '🥧'], ['database', '数据', '🗃️'], ['mail', '通信', '✉️'], ['phone', '通信', '📞'],
  ['chat', '通信', '💬'], ['send', '通信', '📤'], ['settings', '设置', '⚙️'], ['filter', '设置', '🎛️'],
  ['toggle', '设置', '🔘'], ['lock', '设置', '🔒'],
];

export const ICONS: IconItem[] = [
  ...ICON_SEED.map(([name, category, glyph], i): IconItem => ({
    id: `icon_platform_${i}`,
    name,
    category,
    glyph,
    source: 'platform',
  })),
  { id: 'icon_project_0', name: 'devkit-logo', category: '通用', glyph: '🧰', source: 'personal' },
  { id: 'icon_project_1', name: 'build', category: '通用', glyph: '🛠️', source: 'personal' },
  { id: 'icon_project_2', name: 'deploy', category: '通用', glyph: '🚀', source: 'personal' },
];

// ─── 原型开发 ────────────────────────────────────────────────────
export interface PrototypeSolution {
  id: string;
  name: string;
  description: string;
  docUrl: string;
  docSiteName: string;
  tags: string[];
}

export interface PrototypeDomain {
  key: string;
  label: string;
  summary: string;
  solutions: PrototypeSolution[];
}

export const PROTOTYPE_DOMAINS: PrototypeDomain[] = [
  {
    key: 'ict',
    label: 'ICT',
    summary: '面向 ICT 管理作业的运营、运维类 Web 端代码体系',
    solutions: [
      { id: 'ict_react', name: 'React + HCL', description: '基于 HCL（华为云 Liquid）设计体系的 React 实现', docUrl: 'https://example.com/hcl-react', docSiteName: 'HCL Doc', tags: ['React', 'TypeScript', 'Desktop'] },
      { id: 'ict_vue', name: 'Vue + HCL', description: 'HCL Vue 版本，适配已有 Vue 技术栈项目', docUrl: 'https://example.com/hcl-vue', docSiteName: 'HCL Doc', tags: ['Vue3', 'Desktop'] },
    ],
  },
  {
    key: 'cloud',
    label: '华为云',
    summary: '华为云控制台与开发者门户代码方案',
    solutions: [
      { id: 'cloud_console', name: '控制台 Console Kit', description: '控制台级联路由、权限、资源列表的一套模板', docUrl: 'https://example.com/console-kit', docSiteName: 'Console Kit', tags: ['React', 'Micro FE'] },
      { id: 'cloud_portal', name: '开发者门户', description: '文档站 / 社区 / 市场的内容型站点方案', docUrl: 'https://example.com/dev-portal', docSiteName: 'Portal Kit', tags: ['Next.js', 'Content'] },
    ],
  },
  {
    key: 'energy',
    label: '数字能源',
    summary: '能源数字孪生 / 监控大屏 / 终端运维类代码',
    solutions: [
      { id: 'energy_mon', name: '监控大屏 Kit', description: '大屏布局、实时数据、地图可视化组件集', docUrl: 'https://example.com/energy-bigscreen', docSiteName: 'Energy Kit', tags: ['React', 'BigScreen'] },
      { id: 'energy_ops', name: '运维工作台', description: '工单、告警、巡检的工作台脚手架', docUrl: 'https://example.com/energy-ops', docSiteName: 'Energy Kit', tags: ['React'] },
    ],
  },
  {
    key: 'lab2012',
    label: '2012实验室',
    summary: '研究型 / 实验型工具链的原型代码',
    solutions: [
      { id: 'lab_nb', name: 'Research Notebook', description: '基于 Notebook 的研究报告与可复现代码模板', docUrl: 'https://example.com/lab-notebook', docSiteName: '2012 Lab', tags: ['Python', 'Jupyter'] },
      { id: 'lab_sim', name: 'Simulation Toolkit', description: '仿真脚手架，支持图形化配置与回放', docUrl: 'https://example.com/lab-sim', docSiteName: '2012 Lab', tags: ['WebGL'] },
    ],
  },
  {
    key: 'terminal',
    label: '终端BG',
    summary: '面向鸿蒙与 AI Native 应用的代码方案',
    solutions: [
      { id: 'term_arkts', name: 'ArkTS', description: 'HarmonyOS ArkTS 组件与页面模板，含分布式能力示例', docUrl: 'https://example.com/arkts', docSiteName: 'Harmony Dev', tags: ['ArkTS', 'HarmonyOS'] },
      { id: 'term_ai', name: 'AI Code', description: 'AI Native 应用脚手架，内置 Agent / 向量检索 / 多模态调用', docUrl: 'https://example.com/ai-code', docSiteName: 'AI Code', tags: ['AI Native', 'Agent'] },
    ],
  },
  {
    key: 'quality',
    label: '质量与流程IT',
    summary: '作业型 IT 系统：工单、审批、报表',
    solutions: [
      { id: 'q_workbench', name: '作业台 Kit', description: '审批、工单、派单、工时的统一工作台脚手架', docUrl: 'https://example.com/q-workbench', docSiteName: 'Quality Kit', tags: ['React', 'Form Heavy'] },
      { id: 'q_report', name: '报表中心', description: '可配置的报表 / 看板 / 导出方案', docUrl: 'https://example.com/q-report', docSiteName: 'Quality Kit', tags: ['BI'] },
    ],
  },
];

// ─── 平台 / 项目 资产源配置 ──────────────────────────────────────
export const ASSET_SOURCE_LABEL: Record<AssetSource, string> = {
  platform: '平台资产',
  personal: '项目资产',
};

export const ASSET_SOURCE_DESCRIPTION: Record<AssetSource, string> = {
  platform: '公司级沉淀的通用资产，所有项目均可引用',
  personal: '当前项目私有的资产，仅在本项目内可见',
};
