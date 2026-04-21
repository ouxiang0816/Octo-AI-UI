export type SkillMarketCategory = '高保真设计' | '用户研究' | '视觉设计' | '竞品分析' | '趋势报告' | '体验评估';

export interface SkillMarketDetail {
  tagline: string;
  overview: string;
  useCases: string[];
  outputs: string[];
  workflow: string[];
  rules: string[];
  version: string;
  updatedAt: string;
}

export interface SkillMarketItem {
  id: string;
  name: string;
  description: string;
  category: SkillMarketCategory;
  enabled: boolean;
  detail: SkillMarketDetail;
}

export const SKILL_MARKET_STORAGE_KEY = 'octo.shared.skill-market';
export const SKILL_MARKET_UPDATED_EVENT = 'octo.skill-market.updated';

export const SKILL_MARKET_CATEGORIES: SkillMarketCategory[] = [
  '高保真设计',
  '用户研究',
  '视觉设计',
  '竞品分析',
  '趋势报告',
  '体验评估',
];

export const DEFAULT_SKILL_MARKET_ITEMS: SkillMarketItem[] = [
  // 高保真设计
  {
    id: 'hifi-multi-screen',
    name: '多屏生成',
    description: '自动生成多端适配的高保真设计稿，覆盖桌面、平板、移动端，输出完整的响应式界面方案。',
    category: '高保真设计',
    enabled: true,
    detail: {
      tagline: '一次输入，同时产出桌面端、平板端与移动端的高保真界面。',
      overview: '多屏生成会根据同一主题自动拆解信息架构，统一视觉风格后分别生成桌面、平板和移动端界面。它适合方案评审、设计交付和跨端体验对齐，重点解决多端风格不统一、布局断裂和适配效率低的问题。',
      useCases: [
        '从单一需求快速产出 Web + Pad + Mobile 三套高保真方案',
        '给汇报场景准备多终端演示稿和设计对比稿',
        '在既有设计语言下验证同一模块的跨端布局策略',
      ],
      outputs: [
        '多端首页与关键流程页',
        '跨端栅格、间距与组件映射建议',
        '适配说明与设计交付清单',
      ],
      workflow: [
        '解析主题与目标用户，识别核心任务路径',
        '建立跨端信息架构与内容优先级',
        '生成桌面、平板、移动端的高保真页面',
        '补充跨端组件映射和适配说明',
      ],
      rules: [
        '默认优先保证主任务链路在三端体验一致',
        '对复杂数据模块会优先采用桌面增强、移动收敛的布局策略',
        '需要品牌约束时，建议同时提供主色、字体和组件偏好',
      ],
      version: 'v2.3',
      updatedAt: '2026-04-17',
    },
  },

  // 用户研究
  {
    id: 'research-plan-design',
    name: '研究方案设计',
    description: '根据研究目标快速生成完整的用户研究方案，涵盖研究方法选择、样本规划、执行计划与分析框架。',
    category: '用户研究',
    enabled: true,
    detail: {
      tagline: '把一个模糊的研究目标，整理成可直接执行的用户研究方案。',
      overview: '研究方案设计会围绕研究目标、目标人群和业务阶段，自动组合访谈、可用性测试、问卷、日志分析等方法，并形成完整的执行计划。它适合在项目启动期快速对齐研究范围，也适合在资源紧张时做轻量版研究设计。',
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
      version: 'v1.9',
      updatedAt: '2026-04-16',
    },
  },

  // 视觉设计
  {
    id: 'visual-harmony-os',
    name: '鸿蒙规范生成',
    description: '基于 HarmonyOS 设计规范自动生成适配原型，覆盖导航结构、组件样式与交互反馈，确保鸿蒙生态一致性。',
    category: '视觉设计',
    enabled: true,
    detail: {
      tagline: '面向 HarmonyOS 场景的视觉与组件规范生成能力。',
      overview: '鸿蒙规范生成会基于 HarmonyOS 的组件约束、层级关系和交互反馈，快速给出符合系统语言的界面建议。它尤其适用于要做鸿蒙适配的产品团队，帮助在有限时间内把控系统一致性和生态感。',
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
      version: 'v1.4',
      updatedAt: '2026-04-15',
    },
  },

  // 竞品分析
  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis',
    description: '支持从规划到洞察的全流程竞品分析，覆盖目标设定、样本筛选、功能对比与结论提炼，快速生成竞品报告。',
    category: '竞品分析',
    enabled: true,
    detail: {
      tagline: '从竞品样本筛选到洞察提炼，一次完成结构化分析。',
      overview: 'Competitive Analysis 面向产品、设计和策略团队，帮助快速建立竞品池、定义对比维度，并沉淀结论。它适用于新产品规划、方案复盘和行业扫描场景，尤其适合需要快速形成报告初稿的团队。',
      useCases: [
        '做新产品方向评估前的竞品扫描',
        '对标头部产品功能与体验策略',
        '输出用于评审和汇报的竞品结论页',
      ],
      outputs: [
        '竞品样本池与筛选逻辑',
        '功能 / 交互 / 视觉对比矩阵',
        '机会点、风险点与建议结论',
      ],
      workflow: [
        '确定分析主题与样本边界',
        '建立对比维度与评分标准',
        '输出结构化矩阵和关键截图说明',
        '提炼差异化机会点与策略建议',
      ],
      rules: [
        '默认优先筛选同赛道直接竞品，其次补充跨界参考样本',
        '结论必须回收到目标场景，避免泛化分析',
        '如果样本过多，会先生成核心样本组再扩展',
      ],
      version: 'v2.1',
      updatedAt: '2026-04-17',
    },
  },

  // 趋势报告
  {
    id: 'industry-dynamics-trends',
    name: 'Industry Dynamics & Trends',
    description: '实时追踪行业动态与前沿趋势，自动整合多方信息源，生成结构化的行业趋势洞察报告，辅助战略决策。',
    category: '趋势报告',
    enabled: true,
    detail: {
      tagline: '持续跟踪行业变化，把离散信息整合成可读的趋势报告。',
      overview: 'Industry Dynamics & Trends 适用于战略、市场和创新团队，用于跟踪行业动态、技术变化和用户趋势。它强调“信息整合 + 趋势归因 + 影响判断”，帮助团队从零散情报中提炼方向性的判断。',
      useCases: [
        '做季度行业趋势汇报或月度情报同步',
        '追踪新技术、新模式和行业玩家动作',
        '识别未来 3 到 12 个月值得验证的方向',
      ],
      outputs: [
        '趋势主题分组与变化脉络',
        '行业关键事件摘要',
        '机会判断与战略建议',
      ],
      workflow: [
        '聚合主题相关行业信息源',
        '按时间和主题进行聚类整理',
        '提炼影响业务的主要趋势信号',
        '输出趋势判断与优先级建议',
      ],
      rules: [
        '默认优先保留对产品策略有直接影响的趋势',
        '强调趋势变化的连续性，而不是单点新闻',
        '输出结论时会区分已验证趋势与早期信号',
      ],
      version: 'v1.8',
      updatedAt: '2026-04-14',
    },
  },

  // 体验评估
  {
    id: 'ux-usability-testing',
    name: 'UX Usability Testing',
    description: '生成标准化可用性测试方案，涵盖任务设计、指标体系与问题分级，支持远程或线下测试场景快速落地。',
    category: '体验评估',
    enabled: true,
    detail: {
      tagline: '围绕关键任务路径生成标准化可用性测试方案。',
      overview: 'UX Usability Testing 强调测试任务设计、指标定义和问题归因，帮助团队快速启动一轮可用性验证。它适合设计走查后验证、版本上线前回归检查，以及新功能概念验证。',
      useCases: [
        '设计版本上线前做一轮小规模可用性测试',
        '远程验证用户在核心路径上的完成效率',
        '沉淀问题分级和优先级修复列表',
      ],
      outputs: [
        '测试任务脚本与主持词',
        '指标体系与记录模板',
        '问题分级和改进建议清单',
      ],
      workflow: [
        '识别关键任务路径和用户目标',
        '生成主持词、任务脚本和观察项',
        '建立效率、成功率和主观反馈指标',
        '输出问题分级与修复建议',
      ],
      rules: [
        '优先覆盖高频、高风险任务路径',
        '默认输出可用于 5 到 8 人样本测试的方案',
        '问题归因会区分认知负担、信息缺失和交互障碍',
      ],
      version: 'v2.0',
      updatedAt: '2026-04-12',
    },
  },
  {
    id: 'user-agent',
    name: 'User Agent',
    description: '模拟真实用户行为路径，自动执行交互流程并捕捉操作摩擦点，输出量化的用户行为分析报告。',
    category: '体验评估',
    enabled: true,
    detail: {
      tagline: '用模拟用户的方式走完整条交互路径，捕捉关键摩擦点。',
      overview: 'User Agent 会根据预设目标模拟用户完成任务，记录点击、停顿、回退和失败点，适合做快速的行为路径诊断。它偏向行为层面的自动化扫描，适合在迭代早期快速发现明显障碍。',
      useCases: [
        '自动走查注册、购买、提交等关键流程',
        '对多个版本进行交互效率对比',
        '发现高摩擦路径与异常停留节点',
      ],
      outputs: [
        '行为路径回放摘要',
        '高摩擦节点列表',
        '量化行为效率报告',
      ],
      workflow: [
        '定义模拟目标与用户画像',
        '自动执行关键流程并记录行为轨迹',
        '识别卡点、回退和异常中断',
        '输出行为分析与优化建议',
      ],
      rules: [
        '默认优先覆盖一条主路径和两条异常路径',
        '结果更适合发现流程问题，不替代真实用户研究',
        '如果页面依赖复杂权限或真实数据，需补充上下文再分析',
      ],
      version: 'v1.6',
      updatedAt: '2026-04-13',
    },
  },
  {
    id: 'expert-agent',
    name: 'Expert Agent',
    description: '调用专家评审规则库，基于启发式原则快速扫描界面问题，输出优先级排序的改进建议与设计决策依据。',
    category: '体验评估',
    enabled: true,
    detail: {
      tagline: '像专家评审一样快速扫描界面问题，并给出结构化建议。',
      overview: 'Expert Agent 通过启发式规则和设计审查框架，对界面的可理解性、一致性、反馈、容错和效率进行扫描。它适合在资源有限时进行快速审查，也适合在正式评审前先做一轮质量预检。',
      useCases: [
        '在评审会前快速找出高优先级界面问题',
        '为设计方案提供有依据的修改建议',
        '补充可用性测试前的专家视角判断',
      ],
      outputs: [
        '问题清单与严重级别',
        '按模块分类的改进建议',
        '设计判断依据与解释',
      ],
      workflow: [
        '识别页面目标和关键交互模块',
        '按启发式规则进行逐项扫描',
        '整理问题优先级和影响范围',
        '输出带依据的建议清单',
      ],
      rules: [
        '默认优先关注反馈、可理解性和关键路径效率',
        '问题输出强调可执行，而不是泛泛而谈',
        '建议会尽量给出修改方向和影响说明',
      ],
      version: 'v2.2',
      updatedAt: '2026-04-17',
    },
  },
];

export function loadSkillMarketItems(): SkillMarketItem[] {
  if (typeof window === 'undefined') return DEFAULT_SKILL_MARKET_ITEMS;

  try {
    const raw = window.localStorage.getItem(SKILL_MARKET_STORAGE_KEY);
    if (!raw) return DEFAULT_SKILL_MARKET_ITEMS;
    const parsed = JSON.parse(raw) as Array<Partial<SkillMarketItem>>;
    if (!Array.isArray(parsed)) return DEFAULT_SKILL_MARKET_ITEMS;

    const enabledMap = new Map<string, boolean>();
    parsed.forEach((item) => {
      if (typeof item?.id === 'string') enabledMap.set(item.id, item.enabled === true);
    });

    return DEFAULT_SKILL_MARKET_ITEMS.map((item) => ({
      ...item,
      enabled: enabledMap.has(item.id) ? enabledMap.get(item.id) === true : item.enabled,
    }));
  } catch {
    return DEFAULT_SKILL_MARKET_ITEMS;
  }
}

export function saveSkillMarketItems(items: SkillMarketItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SKILL_MARKET_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures for file:// exports and privacy-restricted contexts.
  }
  window.dispatchEvent(new CustomEvent(SKILL_MARKET_UPDATED_EVENT));
}
