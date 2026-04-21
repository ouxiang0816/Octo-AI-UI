import {
  BarChart2, FileText, Layers, Monitor, Moon, Zap,
  Code, Hash, Globe, Search, Cpu, FolderOpen, Link, BookOpen,
} from 'lucide-react';
import type { ResearchDoc, Skill } from './types';

// ─── Assets ──────────────────────────────────────────────────────────────────
export const ASSET_SECTIONS = [
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

// ─── Research ─────────────────────────────────────────────────────────────────
export const RESEARCH_DOCS: ResearchDoc[] = [
  { id: 'r1', type: 'journey', title: '电商购物用户旅程图', author: 'Vivian', updatedAt: '3天前' },
  { id: 'r2', type: 'cj', title: '新用户 CJ 图（注册→首购）', author: 'Tom', updatedAt: '1周前' },
  { id: 'r3', type: 'report', title: '结账流程可用性测试报告', author: 'Alex', updatedAt: '2周前' },
  { id: 'r4', type: 'competitor', title: '竞品功能横向对比分析', author: 'Jackson', updatedAt: '1月前' },
  { id: 'r5', type: 'interview', title: '用户深度访谈摘要 Q1', author: 'Lisa', updatedAt: '1月前' },
  { id: 'r6', type: 'persona', title: '核心用户画像（3 类）', author: 'Vivian', updatedAt: '2月前' },
];

export const DOC_TYPE_META: Record<ResearchDoc['type'], { label: string; color: string; bg: string }> = {
  journey: { label: '旅程图', color: '#1476ff', bg: '#f0f5ff' },
  cj: { label: 'CJ 图', color: '#7c3aed', bg: '#f5f3ff' },
  report: { label: '可用性报告', color: '#d97706', bg: '#fffbeb' },
  competitor: { label: '竞品分析', color: '#059669', bg: '#f0fdf4' },
  interview: { label: '用户访谈', color: '#db2777', bg: '#fdf2f8' },
  persona: { label: '用户画像', color: '#0891b2', bg: '#f0fdfa' },
};

export const DOC_DETAILS: Record<string, { summary: string; insights: string[] }> = {
  r1: { summary: '电商用户从首页到完成购买的完整旅程分析，识别了 6 个关键触点和 3 个主要痛点。', insights: ['搜索到商品详情页的流失率高达 42%', '收货地址填写是最大摩擦点', '复购用户偏好快速结账通道', '移动端购物车放弃率比桌面端高 18%'] },
  r2: { summary: '新用户从注册到首次购买的完整转化漏斗，全程 7 步，平均完成时间 12 分钟。', insights: ['注册步骤超过 3 步流失率超 60%', '手机号验证是最常见的中断点', '首单优惠券使转化提升 34%', '新用户引导动效可降低迷失感'] },
  r3: { summary: '对 32 名用户进行的结账流程可用性测试，发现 5 个严重问题，11 个改进机会。', insights: ['支付方式排布影响用户选择', '"提交订单"按钮位置需更突出', '优惠码输入框被 40% 用户忽略', '订单确认页信息层级需优化'] },
  r4: { summary: '对标 4 家竞品（淘宝、京东、拼多多、小红书）的 12 个核心功能横向评估。', insights: ['个性化推荐准确度差距显著', '我方搜索体验评分落后 2 位', '收藏夹功能设计最具竞争力', '社交分享功能存在较大缺口'] },
  r5: { summary: 'Q1 共完成 15 次深度访谈，覆盖高、中、低消费频次用户各 5 名。', insights: ['高频用户核心诉求是效率', '中频用户最在意商品真实性', '低频用户主要被价格和活动驱动', '所有用户反馈页面加载速度问题'] },
  r6: { summary: '基于 2000+ 用户数据分析提炼出 3 类核心用户画像：猎手型、囤货型、礼品型。', insights: ['猎手型占比 38%，贡献 GMV 55%', '囤货型复购周期约 2–4 周', '礼品型客单价最高，均 ¥320+', '三类用户对促销的敏感度差异显著'] },
};

// ─── Components ───────────────────────────────────────────────────────────────
export const COMPONENT_DETAILS: Record<string, { desc: string; props: { name: string; type: string; default: string }[] }> = {
  Button:  { desc: '基础按钮，支持多尺寸、多变体和加载态。', props: [{ name: 'variant', type: '"primary"|"ghost"|"danger"', default: '"primary"' }, { name: 'size', type: '"sm"|"md"|"lg"', default: '"md"' }, { name: 'loading', type: 'boolean', default: 'false' }, { name: 'disabled', type: 'boolean', default: 'false' }] },
  Input:   { desc: '文本输入框，支持前后缀插槽与校验状态。', props: [{ name: 'placeholder', type: 'string', default: '""' }, { name: 'prefix', type: 'ReactNode', default: 'undefined' }, { name: 'status', type: '"default"|"error"|"success"', default: '"default"' }, { name: 'disabled', type: 'boolean', default: 'false' }] },
  Modal:   { desc: '对话框容器，内置动效与遮罩层管理。', props: [{ name: 'open', type: 'boolean', default: 'false' }, { name: 'title', type: 'string', default: '""' }, { name: 'width', type: 'number', default: '480' }, { name: 'onClose', type: '() => void', default: '—' }] },
  Card:    { desc: '通用内容卡片，支持封面、头部和操作区。', props: [{ name: 'cover', type: 'ReactNode', default: 'undefined' }, { name: 'hoverable', type: 'boolean', default: 'false' }, { name: 'bordered', type: 'boolean', default: 'true' }, { name: 'padding', type: 'number', default: '16' }] },
  Table:   { desc: '数据表格，支持排序、筛选与虚拟滚动。', props: [{ name: 'columns', type: 'Column[]', default: '[]' }, { name: 'dataSource', type: 'any[]', default: '[]' }, { name: 'rowKey', type: 'string', default: '"id"' }, { name: 'loading', type: 'boolean', default: 'false' }] },
  Badge:   { desc: '徽标数，用于角标、状态和计数展示。', props: [{ name: 'count', type: 'number', default: '0' }, { name: 'dot', type: 'boolean', default: 'false' }, { name: 'color', type: 'string', default: '"#f5222d"' }, { name: 'offset', type: '[number,number]', default: '[0,0]' }] },
  Tabs:    { desc: '选项卡，支持卡片、线条和胶囊三种样式。', props: [{ name: 'activeKey', type: 'string', default: '""' }, { name: 'type', type: '"line"|"card"|"pill"', default: '"line"' }, { name: 'onChange', type: '(key:string)=>void', default: '—' }, { name: 'items', type: 'TabItem[]', default: '[]' }] },
  Toast:   { desc: '全局轻提示，支持成功、警告、错误三态。', props: [{ name: 'message', type: 'string', default: '""' }, { name: 'type', type: '"info"|"success"|"warning"|"error"', default: '"info"' }, { name: 'duration', type: 'number', default: '3000' }, { name: 'position', type: '"top"|"bottom"', default: '"top"' }] },
};

// ─── Skills ───────────────────────────────────────────────────────────────────
export const ALL_SKILLS: Skill[] = [
  {
    id: 's1', name: '数据可视化', desc: '自动生成图表、数据看板组件', enabled: true, icon: BarChart2, category: '设计能力', official: true,
    detail: {
      tagline: '把原始业务指标直接转成适合汇报和监控的数据可视化界面。',
      overview: '数据可视化技能会根据指标结构、业务目标和展示场景，自动匹配图表类型、卡片布局和信息层级，适合大屏、运营看板和管理驾驶舱等界面方案生成。',
      useCases: ['快速生成经营分析看板', '把指标表转成图表化布局', '给汇报场景补齐重点趋势卡片'],
      outputs: ['图表区块和指标卡片', '图例、筛选器和时间维度布局', '数据密度与阅读路径建议'],
      workflow: ['识别核心指标与维度', '匹配图表类型', '组织看板布局', '补充筛选和说明信息'],
      rules: ['优先保证重点指标的层级突出', '默认控制图表种类数量避免噪音', '复杂指标会自动拆成多块展示'],
      version: 'v2.1',
      updatedAt: '2026-04-17',
    },
  },
  {
    id: 's2', name: '表单生成', desc: '根据字段描述生成完整表单布局', enabled: true, icon: FileText, category: '设计能力', official: true,
    detail: {
      tagline: '从字段和业务规则出发，生成清晰可用的表单结构。',
      overview: '表单生成会结合字段类型、必填规则和操作流程，自动安排分组、间距、输入控件和校验提示，适合后台录入、申请流和配置类场景。',
      useCases: ['快速搭建配置表单', '生成审批 / 申请流程页', '补齐复杂字段的分组与提示文案'],
      outputs: ['表单布局和字段分组', '按钮区与操作区建议', '校验、说明和错误态提示'],
      workflow: ['识别字段和规则', '生成分组与模块层级', '匹配控件和状态', '完善说明与操作反馈'],
      rules: ['优先缩短主任务填写路径', '复杂表单默认分步或分组展示', '必填与错误信息必须明确可见'],
      version: 'v1.8',
      updatedAt: '2026-04-16',
    },
  },
  {
    id: 's3', name: '导航生成', desc: '自动生成侧边栏与顶部导航结构', enabled: true, icon: Layers, category: '设计能力', official: true,
    detail: {
      tagline: '根据信息架构自动搭建主导航、二级导航和页面入口关系。',
      overview: '导航生成适合后台工作台、控制台和复杂业务系统，用于快速生成侧边栏、顶部导航和分层入口。它强调模块收纳逻辑和操作路径清晰度。',
      useCases: ['后台工作台导航搭建', '复杂业务模块的信息架构梳理', '导航重构前快速验证入口分层'],
      outputs: ['侧边栏和顶部导航方案', '导航层级与入口分组', '选中态与折叠态规则'],
      workflow: ['识别模块和任务频次', '建立导航层级', '组织主次入口', '补充导航状态规则'],
      rules: ['高频任务优先进入一级导航', '避免单层导航承载过多入口', '默认保留面包屑和定位反馈'],
      version: 'v1.7',
      updatedAt: '2026-04-14',
    },
  },
  {
    id: 's4', name: '响应式布局', desc: '自动适配桌面端、平板、移动端', enabled: true, icon: Monitor, category: '设计能力', official: true,
    detail: {
      tagline: '基于同一内容结构，自动生成桌面、平板和移动端布局变化。',
      overview: '响应式布局技能会在统一设计语言下自动重排模块，控制信息密度和交互方式，适合多端产品、营销站点和工作台页面。',
      useCases: ['为同一方案生成多端版本', '检查关键模块在小屏下的收纳方式', '输出设计交付前的响应式参考稿'],
      outputs: ['多端布局稿', '断点下模块变化建议', '不同设备的信息优先级策略'],
      workflow: ['识别页面模块', '按断点重排布局', '调整组件尺寸与栅格', '补充适配说明'],
      rules: ['主任务区优先保留可见性', '移动端默认收敛次级信息', '复杂表格优先转卡片或分段展示'],
      version: 'v2.0',
      updatedAt: '2026-04-17',
    },
  },
  {
    id: 's6', name: '暗色主题', desc: '支持生成对应的暗色模式版本', enabled: false, icon: Moon, category: '设计能力', official: true,
    detail: {
      tagline: '将现有界面平滑扩展为暗色主题版本。',
      overview: '暗色主题技能会在保留原有层级关系的前提下，调整背景、文字、分隔线和强调色对比，适合控制台、数据产品和夜间使用场景。',
      useCases: ['现有界面补一套暗色稿', '检查夜间模式下的阅读对比', '统一暗色版组件表现'],
      outputs: ['暗色主题页面稿', '颜色 token 建议', '亮暗模式切换规则'],
      workflow: ['提取原主题层级', '转换背景和文字对比', '校正强调色和状态色', '补充组件暗色规范'],
      rules: ['优先保证文本可读性', '强调色不直接沿用高亮纯色', '重要信息需保留足够对比度'],
      version: 'v1.5',
      updatedAt: '2026-04-15',
    },
  },
  {
    id: 's7', name: '动效设计', desc: '为界面关键节点添加过渡动效', enabled: false, icon: Zap, category: '设计能力', official: true,
    detail: {
      tagline: '围绕关键节点补充过渡、反馈和状态动效设计。',
      overview: '动效设计技能会基于页面结构和交互目标，为加载、切换、提交和反馈等节点添加节奏清晰的过渡效果，提升操作感知和体验连贯性。',
      useCases: ['页面切换和内容进场动效', '按钮与表单反馈设计', '关键状态变化的视觉提示'],
      outputs: ['动效建议稿', '交互动效节奏说明', '关键节点动效标注'],
      workflow: ['识别关键交互节点', '匹配动效类型与时长', '补充入场和反馈节奏', '生成标注与说明'],
      rules: ['动效优先服务信息传达', '避免全局过度动画', '默认保持轻量、快速、可中断'],
      version: 'v1.6',
      updatedAt: '2026-04-16',
    },
  },
  {
    id: 's5', name: '代码同步输出', desc: '生成 Demo 同步输出 React/Vue 代码', enabled: false, icon: Code, category: '开发能力', official: true,
    detail: {
      tagline: '在生成视觉稿的同时，给出可继续开发的前端代码骨架。',
      overview: '代码同步输出面向设计到开发协作，自动把页面结构转换为 React 或 Vue 代码示意，适合 Demo 验证、前端对齐和交付草稿阶段。',
      useCases: ['设计稿同步输出组件代码', '交互 Demo 与前端结构联动', '快速生成前端起步模板'],
      outputs: ['React / Vue 代码骨架', '组件拆分建议', '样式和结构映射说明'],
      workflow: ['识别页面模块', '拆分组件层级', '输出结构和样式草稿', '补充开发建议'],
      rules: ['优先保证结构清晰和可维护性', '默认输出基础组件拆分，不做过度抽象', '复杂交互需结合真实项目进一步补全'],
      version: 'v2.2',
      updatedAt: '2026-04-17',
    },
  },
  {
    id: 's9', name: 'TypeScript 支持', desc: '输出带完整类型标注的 TS 代码', enabled: false, icon: Hash, category: '开发能力', official: true,
    detail: {
      tagline: '让生成代码天然带上更完整的类型标注。',
      overview: 'TypeScript 支持技能会为组件 props、状态、事件和数据结构补齐类型声明，适合面向工程落地的代码输出场景。',
      useCases: ['生成类型完整的组件代码', '为数据结构补齐 interface', '减少后续联调时的类型缺失问题'],
      outputs: ['TSX 组件代码', '类型声明与 interface', '关键事件和数据结构约束'],
      workflow: ['识别组件输入输出', '生成 props 和状态类型', '补充数据结构约束', '输出可继续开发的 TS 代码'],
      rules: ['优先保证关键路径类型明确', '避免为 mock 结构生成过度复杂类型', '事件和回调默认保留可扩展性'],
      version: 'v1.9',
      updatedAt: '2026-04-14',
    },
  },
  {
    id: 's10', name: '单元测试生成', desc: '自动为组件生成 Jest 测试用例', enabled: false, icon: FileText, category: '开发能力', official: true,
    detail: {
      tagline: '围绕组件主路径自动生成可读、可维护的测试样例。',
      overview: '单元测试生成会根据组件职责、状态变化和关键交互，输出基础的 Jest / Testing Library 测试样例，适合提升交付完整度和回归效率。',
      useCases: ['给新组件补基础测试', '覆盖主交互和异常状态', '为设计系统组件生成回归样例'],
      outputs: ['测试文件样例', '主路径与边界场景覆盖点', '测试命名与结构建议'],
      workflow: ['识别组件核心行为', '生成主路径测试', '补充边界和异常场景', '输出可运行的测试草稿'],
      rules: ['优先测试用户可感知行为', '避免对实现细节过度断言', '复杂联动场景建议再结合真实数据调整'],
      version: 'v1.3',
      updatedAt: '2026-04-13',
    },
  },
  {
    id: 's8', name: 'A11y 检查', desc: '可访问性自动检查并给出改进建议', enabled: false, icon: Globe, category: '质量检查', official: true,
    detail: {
      tagline: '自动扫描界面的可访问性问题并给出可执行建议。',
      overview: 'A11y 检查围绕文本对比、焦点顺序、键盘可达性、语义结构和状态反馈进行扫描，适合设计评审和前端自检阶段。',
      useCases: ['上线前快速做可访问性检查', '补齐焦点和语义问题', '对照规范沉淀修复建议'],
      outputs: ['问题列表与优先级', '对比度 / 焦点 / 语义建议', '修复方向说明'],
      workflow: ['扫描界面元素和交互路径', '识别可访问性风险', '按严重级别分类', '输出修复建议'],
      rules: ['优先关注高频交互路径', '文本和控件必须具备足够辨识度', '建议默认对齐 WCAG 基础要求'],
      version: 'v2.0',
      updatedAt: '2026-04-17',
    },
  },
  {
    id: 's11', name: '设计走查', desc: '对照规范自动标注偏差项', enabled: false, icon: Search, category: '质量检查', official: true,
    detail: {
      tagline: '把界面和规范逐项对照，快速标出偏差点。',
      overview: '设计走查技能适合在评审前、交付前和开发联调时使用，用于识别颜色、字号、间距、组件和交互规则上的偏差，减少人工走查成本。',
      useCases: ['设计评审前预检', '开发联调后的 UI 复核', '规范执行偏差标注'],
      outputs: ['偏差项清单', '影响范围说明', '建议修正方向'],
      workflow: ['读取规范与页面结构', '逐项比对关键属性', '汇总偏差项', '输出修正建议'],
      rules: ['优先标注影响阅读和交互的偏差', '同类问题会自动合并归类', '建议配合版本说明一起输出'],
      version: 'v1.8',
      updatedAt: '2026-04-16',
    },
  },
  {
    id: 's12', name: '性能预估', desc: '分析组件渲染开销并给出优化建议', enabled: false, icon: Cpu, category: '质量检查', official: true,
    detail: {
      tagline: '从组件规模、结构复杂度和交互密度预估前端性能压力。',
      overview: '性能预估技能偏向前端实现前的风险识别，用于判断页面在复杂列表、大量图表和频繁状态更新场景下的潜在性能问题。',
      useCases: ['识别高密度页面的性能风险', '评估图表或表格场景的开销', '提前给前端提出优化建议'],
      outputs: ['性能风险清单', '高开销模块提示', '优化方向建议'],
      workflow: ['扫描组件结构和交互密度', '识别高开销模块', '预估渲染与更新压力', '整理优化建议'],
      rules: ['重点关注列表、图表和高频交互模块', '结果偏向风险预判，不替代真实 profiling', '建议结合真实数据规模再细化'],
      version: 'v1.2',
      updatedAt: '2026-04-12',
    },
  },
  {
    id: 's13', name: 'Figma 同步', desc: '从 Figma 文件拉取最新组件', enabled: false, icon: FolderOpen, category: '集成服务',
    detail: {
      tagline: '把设计稿中的组件和页面结构同步到当前工作流里。',
      overview: 'Figma 同步适合从设计稿继续生成 Demo 或做设计到代码衔接时使用，用于拉取页面、组件和基础布局信息。',
      useCases: ['从 Figma 导入最新页面结构', '同步组件和版式变化', '作为设计到代码链路入口'],
      outputs: ['页面和组件结构数据', '同步状态说明', '导入结果摘要'],
      workflow: ['连接设计文件', '拉取页面与组件', '建立映射关系', '输出同步结果'],
      rules: ['默认优先同步结构化信息', '复杂交互动效需额外补充', '建议在文件结构清晰时使用'],
      version: 'v1.1',
      updatedAt: '2026-04-11',
    },
  },
  {
    id: 's14', name: 'GitHub 推送', desc: '将生成代码直接推送到 GitHub 仓库', enabled: false, icon: Link, category: '集成服务',
    detail: {
      tagline: '把生成结果直接接到 GitHub 仓库协作流程中。',
      overview: 'GitHub 推送技能用于把生成的页面代码或组件草稿快速提交到指定仓库，适合验证方案、团队评审和交付衔接。',
      useCases: ['把生成的组件直接推到仓库', '给评审准备可 diff 的代码版本', '减少手动复制代码的中间步骤'],
      outputs: ['推送代码包', '分支或提交说明', '变更摘要'],
      workflow: ['整理待输出代码', '确认目录和目标分支', '生成提交内容', '推送并记录结果'],
      rules: ['默认不覆盖已有关键文件', '推送前建议确认仓库结构和权限', '复杂项目需人工复核后再合并'],
      version: 'v1.0',
      updatedAt: '2026-04-10',
    },
  },
  {
    id: 's15', name: 'Storybook 导出', desc: '一键导出为 Storybook 组件故事', enabled: false, icon: BookOpen, category: '集成服务',
    detail: {
      tagline: '把页面或组件草稿快速整理成 Storybook 可读的故事文件。',
      overview: 'Storybook 导出适合设计系统和前端组件库团队，用于把生成组件转成 stories，提升演示、验证和交付效率。',
      useCases: ['给组件库补 stories', '把生成组件快速接入 Storybook', '输出演示态和变体态样例'],
      outputs: ['Story 文件草稿', '变体和状态示例', '展示结构建议'],
      workflow: ['识别组件和状态', '生成 stories 结构', '补充示例和文案', '输出导出结果'],
      rules: ['优先覆盖默认态、禁用态和交互态', '复杂业务数据需再人工补足', '命名会尽量对齐组件目录结构'],
      version: 'v1.4',
      updatedAt: '2026-04-15',
    },
  },
];

export const INITIAL_SKILLS: Skill[] = ALL_SKILLS.map(s => ({ ...s }));

export const SKILL_CATEGORIES = ['全部', '设计能力', '开发能力', '质量检查', '集成服务'];

// ─── Design Specs ─────────────────────────────────────────────────────────────
export const DESIGN_SPECS = [
  'H Design_v1.1规范',
  'ICT UI_v3.1.0规范',
  'Cloud UI_v1.0.1规范',
  'DevUI_v1.0.0规范',
];

// ─── Vibe Requirements (same source as VersionDelivery INITIAL_REQUIREMENTS) ──
export interface VibeRequirement {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  owner: string;
}

export const VIBE_REQUIREMENTS: VibeRequirement[] = [
  {
    id: 'vr1',
    name: '业务视图体验优化',
    description: '针对业务视图页面的整体体验进行系统性优化，包括空白态处理、加载状态展示、以及拓扑图的交互体验改善，提升整体视觉一致性与可用性。',
    priority: 'high',
    owner: 'Vivian',
  },
  {
    id: 'vr2',
    name: '拓扑图优化',
    description: '重新设计拓扑图的交互模式，支持节点拖拽、缩放、以及自定义布局。提升大规模节点场景下的渲染性能，减少卡顿感。',
    priority: 'medium',
    owner: 'Jackson',
  },
  {
    id: 'vr3',
    name: '告警中心重构',
    description: '重构告警中心的信息架构，增加告警分级展示、批量处理操作，以及告警与资产的关联视图，降低运维人员的认知负担。',
    priority: 'high',
    owner: 'Andrew',
  },
  {
    id: 'vr4',
    name: '移动端适配',
    description: '对核心查看类页面进行移动端响应式适配，支持在手机和平板设备上流畅浏览监控数据，满足移动办公场景需求。',
    priority: 'low',
    owner: 'Sun',
  },
];
