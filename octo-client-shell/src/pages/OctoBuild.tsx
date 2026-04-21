/**
 * Octo Build — AI 能力工作台
 * 左侧对话面板 (400px) + 右侧 ResultWorkspace
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles, Plus, Send, Paperclip,
  ChevronDown, Check, Loader2, Copy,
  Monitor, Image, Layers, BarChart2, Play, Pause, Maximize2, Minimize2,
  ExternalLink, LayoutGrid, Code, Upload, Minus, RotateCcw, ArrowLeft,
  AtSign, FolderOpen, Heart, ChevronRight, X, Smartphone, Tablet, Share2, Download, Link2,
  RefreshCw, Wand2, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import {
  loadSkillMarketItems,
  saveSkillMarketItems,
  SKILL_MARKET_CATEGORIES,
  SKILL_MARKET_UPDATED_EVENT,
  type SkillMarketCategory,
  type SkillMarketItem,
} from '../data/skill-market-data';
import imgA1 from '../assets/previews/AI功能Toolbar.jpg';
import imgA3 from '../assets/previews/Dashboard图表.jpg';
import imgA4 from '../assets/previews/Dashboard图表2.jpg';
import imgA5 from '../assets/previews/天气卡片.jpg';
import canvasCase2 from '../assets/canvas/Canvas2.jpg';
import codingCase from '../assets/canvas/CodingCase.jpg';
import casePng from '../assets/canvas/case.png';
import imgHealthApp from '../assets/demos/health-app-demo.png';
import { parseFigmaUrl, generateDemoStream, generateSvgFromHtml, type FigmaDesignData } from '../lib/octoMakeApi';
import StarBorder from '../components/StarBorder';

// ─── Types ────────────────────────────────────────────────────────────────────
export type WorkflowType = 'ui-design' | 'demo' | 'creative' | 'research' | 'interview';
type WorkspaceView = 'preview' | 'code';
type ComposerMode = 'auto' | WorkflowType | 'review';
type ComposerAgent = 'auto' | 'research' | 'ui-design' | 'demo' | 'creative' | 'review';

// ─── 意图识别引擎 ─────────────────────────────────────────────────────────────
// 多维度评分 + 置信度系统，替代原有单一正则匹配

interface IntentRule {
  pattern: RegExp;
  score: number;
}

const INTENT_RULES: Record<WorkflowType, IntentRule[]> = {
  // 用户访谈 / 访谈计划
  'interview': [
    { pattern: /深度访谈|用户访谈|访谈计划|访谈提纲|访谈脚本/, score: 10 },
    { pattern: /焦点小组|用研|用户研究/, score: 8 },
    { pattern: /用户画像|人物画像|persona/, score: 6 },
    { pattern: /访谈|受访|受访者|被访/, score: 5 },
    { pattern: /问题清单|调研提纲|访谈大纲/, score: 5 },
  ],
  // 竞品 / 市场研究
  'research': [
    { pattern: /竞品分析|竞品报告|竞品对比|竞品调研/, score: 10 },
    { pattern: /竞争对手|市场调研|行业分析|行业报告/, score: 8 },
    { pattern: /竞品|对标|行业洞察|市场洞察|趋势分析/, score: 6 },
    { pattern: /市场份额|用户规模|增长趋势|商业模式分析/, score: 5 },
    { pattern: /竞争|对手|调研|分析|对比|走查/, score: 3 },
  ],
  // 可交互 Demo
  'demo': [
    { pattern: /可交互.*demo|交互.*演示|demo.*页面|demo.*原型/, score: 10 },
    { pattern: /真实预览|可预览|在线演示|演示效果/, score: 8 },
    { pattern: /交互原型|原型演示|可点击|动效预览/, score: 7 },
    { pattern: /还原.*设计稿|还原.*html|做成.*html|转.*html|生成.*html|导出.*html/, score: 8 },
    { pattern: /html.*页面|静态页面|静态.*html|html.*静态/, score: 6 },
    { pattern: /demo|交互|滚动效果|动态交互/, score: 4 },
    { pattern: /展示给用户|演示给客户|给客户看|汇报用/, score: 3 },
  ],
  // 创意图像生成
  'creative': [
    { pattern: /场景效果图|氛围图|概念图|创意图|渲染图|插画/, score: 10 },
    { pattern: /海报|banner|封面图|背景图|宣传图/, score: 8 },
    { pattern: /生成.*图片|出.*图|画.*场景|绘制.*效果/, score: 8 },
    { pattern: /夜跑|城市夜景|赛博朋克|霓虹|跑者剪影|动感运动/, score: 7 },
    { pattern: /效果图|场景图|图片|插图|配图|视觉素材/, score: 4 },
  ],
  // UI 设计稿（兜底，得分最低但覆盖面最广）
  'ui-design': [
    { pattern: /ui.*设计|设计稿|界面设计|页面设计/, score: 10 },
    { pattern: /月报.*界面|首页.*设计|设计.*首页|app.*设计/, score: 9 },
    { pattern: /figma|原型图|线框图|视觉稿/, score: 8 },
    { pattern: /界面|页面|布局|组件|卡片|导航|配色/, score: 4 },
    { pattern: /设计|ui|ux|交互设计/, score: 3 },
    { pattern: /做.*页面|生成.*页面|帮我.*页面/, score: 2 },
  ],
};

// 返回每种 workflow 的原始得分
function scoreIntents(text: string): Record<WorkflowType, number> {
  const t = text.toLowerCase();
  const scores: Record<WorkflowType, number> = {
    'interview': 0, 'research': 0, 'creative': 0, 'demo': 0, 'ui-design': 0,
  };
  for (const [wf, rules] of Object.entries(INTENT_RULES) as [WorkflowType, IntentRule[]][]) {
    for (const { pattern, score } of rules) {
      if (pattern.test(t)) scores[wf] += score;
    }
  }
  return scores;
}

// 识别主意图，返回 { workflow, confidence: 0-1 }
export function detectIntentWithConfidence(text: string): { workflow: WorkflowType; confidence: number } {
  if (!text.trim()) return { workflow: 'ui-design', confidence: 0 };
  const scores = scoreIntents(text);
  const entries = Object.entries(scores) as [WorkflowType, number][];
  const total = entries.reduce((sum, [, s]) => sum + s, 0);
  const [best] = entries.sort((a, b) => b[1] - a[1]);
  const confidence = total === 0 ? 0 : best[1] / total;
  return { workflow: best[0], confidence };
}

function detectWorkflow(text: string): WorkflowType {
  return detectIntentWithConfidence(text).workflow;
}

// 各工作流的显示标签 & 颜色
const WORKFLOW_INTENT_META: Record<WorkflowType, { label: string; color: string; bg: string; border: string }> = {
  'ui-design':  { label: 'UI 设计',  color: '#7c3aed', bg: '#f5f0ff', border: '#e4d4ff' },
  'demo':       { label: '交互 Demo', color: '#1476ff', bg: '#eff6ff', border: '#c7d9ff' },
  'creative':   { label: '创意生成',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'research':   { label: '竞品研究',  color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'interview':  { label: '用户访谈',  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};

export interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  workflow?: WorkflowType;
  thinkingDone?: boolean;
  thinkingLines?: string[];
  canvasType?: WorkflowType;
  isUpdate?: boolean;
}

export interface OctoBuildState {
  deliverables: WorkflowType[];
  activeWorkflow: WorkflowType | null;
  readyWorkflows: WorkflowType[];
  msgs: ChatMsg[];
}

// ─── Static data ──────────────────────────────────────────────────────────────

const WORKFLOW_META: Record<WorkflowType, {
  badge: string;
  fileLabel: string;
  fileExt: string;
  accentClass: string;
  badgeClass: string;
  workspaceLabel: string;
}> = {
  'ui-design': {
    badge: 'UI 设计',
    fileLabel: 'ComputeGraphMemoryViewer.design',
    fileExt: 'Figma · 可编辑',
    accentClass: 'from-[#7c3aed] to-[#1476ff]',
    badgeClass: 'bg-[#f5f0ff] text-[#7c3aed] border-[#e9ddff]',
    workspaceLabel: 'UI 设计稿预览',
  },
  'demo': {
    badge: 'Demo',
    fileLabel: 'ComputeGraphViewer.make',
    fileExt: 'Interactive Demo',
    accentClass: 'from-[#1476ff] to-[#38bdf8]',
    badgeClass: 'bg-[#eff6ff] text-[#1476ff] border-[#d8e7ff]',
    workspaceLabel: 'Demo 预览',
  },
  'creative': {
    badge: 'Octo Canvas',
    fileLabel: '开发工程师场景图',
    fileExt: 'Octo Canvas · 创意图像',
    accentClass: 'from-[#d97706] to-[#ef4444]',
    badgeClass: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
    workspaceLabel: '效果图预览',
  },
  'research': {
    badge: '竞品分析',
    fileLabel: '算子开发工具竞品分析报告.Insight',
    fileExt: 'Octo Insight · 行业洞察',
    accentClass: 'from-[#0891b2] to-[#0ea5e9]',
    badgeClass: 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]',
    workspaceLabel: '竞品分析报告',
  },
  'interview': {
    badge: '用户访谈',
    fileLabel: '跑步App用研报告.Insight',
    fileExt: 'Octo Insight · 访谈报告',
    accentClass: 'from-[#6366f1] to-[#8b5cf6]',
    badgeClass: 'bg-[#f5f3ff] text-[#6d28d9] border-[#ede9fe]',
    workspaceLabel: '访谈报告',
  },
};

// ─── 动态文案生成器 ────────────────────────────────────────────────────────────
// 根据用户 prompt 提取主题词，生成与上下文相关的思考步骤和回复文案

function extractTopic(prompt: string): string {
  // 去掉常见的指令动词前缀，提取核心主题
  return prompt
    .replace(/^(帮我|帮忙|请|麻烦|我要|我想|生成|做|制作|创建|设计|输出|写|整理|分析|调研|研究|搜集|搜索|完成|给我|给出|做一个|做一份|做一下|出一个|出一份|帮我做|帮我生成|帮我整理|帮我分析)\s*/g, '')
    .replace(/[，。！？、,.!?]/g, '')
    .slice(0, 20)
    .trim() || '目标内容';
}

function collectPromptHighlights(prompt: string, wf: WorkflowType): string[] {
  const text = prompt.toLowerCase();
  const highlights: string[] = [];

  const keywordGroups: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /字体|字重|字号|排版|文案/, label: '文字与排版表现' },
    { pattern: /颜色|配色|主题|深色|浅色|品牌色/, label: '整体配色与主题氛围' },
    { pattern: /圆角|边框|阴影|描边/, label: '卡片细节与视觉层次' },
    { pattern: /布局|间距|留白|对齐|栅格/, label: '布局结构与间距关系' },
    { pattern: /导航|tab|页签|菜单|侧边栏/, label: '导航结构与切换路径' },
    { pattern: /按钮|卡片|弹窗|表单|列表/, label: '关键组件状态与细节' },
    { pattern: /动效|动画|过渡|切换|反馈/, label: '交互动效与状态反馈' },
    { pattern: /滚动|滑动|手势|拖拽/, label: '滚动与手势体验' },
    { pattern: /图表|数据|指标|看板|统计/, label: '数据展示与信息表达' },
    { pattern: /竞品|对比|报告|研究|洞察/, label: '分析维度与研究内容' },
    { pattern: /访谈|画像|用户|问题|需求/, label: '访谈结构与用户洞察' },
  ];

  keywordGroups.forEach(({ pattern, label }) => {
    if (pattern.test(text)) highlights.push(label);
  });

  if (highlights.length === 0) {
    switch (wf) {
      case 'ui-design':
        return ['页面结构与视觉呈现'];
      case 'demo':
        return ['交互链路与预览表现'];
      case 'creative':
        return ['画面构图与风格表达'];
      case 'research':
        return ['分析内容与结论结构'];
      case 'interview':
        return ['访谈内容与洞察输出'];
    }
  }

  return highlights.slice(0, 3);
}

function generateFollowUpCopy(wf: WorkflowType, topic: string, highlights: string[]): string {
  const leadMap: Record<WorkflowType, string> = {
    'ui-design': `我已经围绕「${topic}」重新整理了这版设计方案。`,
    'demo': `我已经根据这次输入，重做了 Demo 里与「${topic}」相关的部分。`,
    'creative': `我已经按照「${topic}」重新生成了这一版视觉内容。`,
    'research': `我已经基于这次输入，补充并重组了「${topic}」相关的分析内容。`,
    'interview': `我已经围绕「${topic}」更新了这版用研与访谈输出。`,
  };

  const detailMap: Record<WorkflowType, string[]> = {
    'ui-design': [
      `· 已重点调整 ${highlights[0] ?? '页面结构与视觉呈现'}`,
      `· 同步优化 ${highlights[1] ?? '关键组件层次与样式细节'}`,
      '· 右侧设计稿已切换为最新版本，可继续迭代',
    ],
    'demo': [
      `· 已同步更新 ${highlights[0] ?? '交互链路与预览表现'}`,
      `· 当前版本重点处理了 ${highlights[1] ?? '页面状态、切换逻辑和展示细节'}`,
      '· 右侧可直接预览这一版效果并继续细调',
    ],
    'creative': [
      `· 这一版重点强化了 ${highlights[0] ?? '画面构图与风格表达'}`,
      `· 已同步调整 ${highlights[1] ?? '色彩、光影和视觉氛围'}`,
      '· 如果你继续补充描述，我可以基于这一版继续迭代',
    ],
    'research': [
      `· 已补充 ${highlights[0] ?? '分析维度与研究内容'}`,
      `· 当前结果重点覆盖 ${highlights[1] ?? '对比结论、机会点和结构整理'}`,
      '· 右侧报告已更新为最新分析版本，可继续补充问题',
    ],
    'interview': [
      `· 已更新 ${highlights[0] ?? '访谈内容与洞察输出'}`,
      `· 这一版重点补强了 ${highlights[1] ?? '问题框架、用户反馈与结论整理'}`,
      '· 右侧报告可继续查看本轮更新后的内容',
    ],
  };

  return `${leadMap[wf]}\n\n${detailMap[wf].join('\n')}`;
}

function generateAIResponse(wf: WorkflowType, prompt: string): { thinkingLines: string[]; text: string; canvasType: WorkflowType } {
  const topic = extractTopic(prompt);

  switch (wf) {
    case 'ui-design': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|3|用户想要「${topic}」的 UI 设计。需判断有无 Figma 设计规范，决定直接生成还是先提取组件库。`,
        `phase|2|思考规划`,
        `thought|2|拆解页面模块：导航栏 / 数据概览 / 内容列表 / 操作栏。色彩主色 #1476FF，字号体系 12/14/16/20/24px，8px 栅格，间距 16/24px 两档。`,
        `phase|3|工具调用`,
        `tool|Figma MCP|getDesignTokens · "${topic}" → color/typography/spacing 共 47 个 token`,
        `tool|Figma MCP|getComponents · filter=interactive → Button×4、Input×3、Card×6、Modal×2`,
        `tool|Octo Renderer|generateLayout · pages=3 → Dashboard、Detail、Settings 框架就绪`,
        `phase|4|结果生成`,
        `thought|2|布局完成，校验对比度：主文本 #191919 on #fff = 16.1:1，通过 WCAG AA。填充组件，输出最终设计稿。`,
      ],
      text: `UI 设计稿已生成：\n\n· 核心主题：${topic}\n· 已完成页面信息架构与模块布局\n· 配色方案、字体规范与间距系统已生成\n· 关键组件与交互状态已完备\n\n右侧支持调整字体、颜色、圆角、布局。`,
      canvasType: 'ui-design',
    };

    case 'demo': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|2|需要生成「${topic}」的可交互 Demo。检查是否有 Figma 设计稿，有则直接解析热区。`,
        `phase|2|思考规划`,
        `thought|2|页面流向：首页→详情→确认→成功。切换动效 slide-left 300ms ease-out，设备 mobile 375px。`,
        `phase|3|工具调用`,
        `tool|Figma MCP|getFrames · query="${topic}" → 5 个 Frame，23 个可点击热区`,
        `tool|Octo Renderer|compileInteractive · transitions=slide · device=mobile → bundle 38.4kb`,
        `phase|4|结果生成`,
        `thought|1|注入滚动物理参数 friction=0.92，点击反馈 scale=0.96。渲染首帧，布局对齐检查通过。`,
      ],
      text: `可交互 Demo 已生成：\n\n· 演示主题：${topic}\n· 真实设备滚动与手势体验\n· 页面切换过渡动效\n· 按钮点击与状态反馈\n\n点击右侧画布内的 ▶ 播放自动演示。`,
      canvasType: 'demo',
    };

    case 'creative': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|2|拆解「${topic}」的视觉关键词：主体、背景氛围、光线方向。`,
        `phase|2|思考规划`,
        `thought|2|确定构图：三分法，主体居中偏右；风格：写实 + 电影感冷调；比例 16:9。`,
        `phase|3|工具调用`,
        `tool|Image Gen MCP|generateSketch · style=draft · ratio=16:9 → 草稿就绪，构图符合预期`,
        `tool|Image Gen MCP|renderFinal · cfg=7.5 · steps=40 · seed=3721 → 高清渲染完成 2048×1280`,
        `phase|4|结果生成`,
        `thought|1|饱和度偏高，叠加 grain texture 8% 降数字感，输出最终版本。`,
      ],
      text: `创意图像已生成：\n\n· 主题：${topic}\n· 构图、光影与色彩方案已完成\n· 支持调整风格、比例与细节元素\n\n输入新的描述可迭代生成下一版。`,
      canvasType: 'creative',
    };

    case 'research': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|2|研究「${topic}」的竞品格局，分析维度：功能覆盖、交互模式、信息架构、增长策略。`,
        `phase|2|思考规划`,
        `thought|2|搜索范围：国内+海外头部产品，近 12 个月数据。直接竞品 3 个重点分析，参考标杆看差异化亮点。`,
        `phase|3|工具调用`,
        `tool|Web Search MCP|search · "${topic} 竞品 2024" → 34 条结果，筛选 8 个高相关度产品`,
        `tool|Web Search MCP|fetchDetail · urls=3 · extract=features,ux,pricing → 功能矩阵提取完毕`,
        `phase|4|结果生成`,
        `thought|3|发现明显空白：所有竞品在「${topic}」场景下均缺乏深度个性化能力，这是核心机会点。整理报告。`,
        `tool|Octo Renderer|generateReport · sections=5 → 报告结构生成完毕`,
      ],
      text: `竞品分析报告已生成：\n\n· 研究主题：${topic}\n· 主要竞品对比矩阵（功能 / 体验 / 策略）\n· 用户行为数据洞察\n· 关键机会点与设计建议\n\n右侧可查看完整报告内容。`,
      canvasType: 'research',
    };

    case 'interview': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|2|「${topic}」用研目标：理解用户行为动机和痛点。先查历史访谈数据是否可复用。`,
        `phase|2|思考规划`,
        `thought|2|构建访谈大纲：背景铺垫→行为探索→痛点深挖→需求确认，共 12 题。生成 3 位典型人设覆盖不同层级用户。`,
        `phase|3|工具调用`,
        `tool|Knowledge Base MCP|query · topic="${topic}" · type=interview → 6 条历史记录 2022-2024`,
        `tool|Octo Persona|generate · segment="目标用户" · count=3 → P1 产品经理 / P2 运营总监 / P3 设计实习生`,
        `phase|4|结果生成`,
        `thought|4|P1 高频提「找不到」「不知道」；P2 关注协作可见性；P3 在乎视觉和易上手。痛点交叉分层，提炼核心洞察，生成报告。`,
      ],
      text: `用研报告已生成：\n\n· 研究主题：${topic}\n· 访谈大纲（4 个维度 · 12 题）\n· 3 位典型用户深度访谈记录\n· 核心用户洞察提炼\n· 设计改进建议\n\n右侧可切换查看各人设访谈记录与完整报告。`,
      canvasType: 'interview',
    };
  }
}

function generateFollowUpReply(wf: WorkflowType, prompt: string): { thinkingLines: string[]; text: string } {
  const topic = extractTopic(prompt);
  const highlights = collectPromptHighlights(prompt, wf);

  switch (wf) {
    case 'ui-design': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|1|调整「${highlights.join(' / ')}」，局部修改，不重建整稿。`,
        `phase|2|思考规划`,
        `thought|1|定位受影响组件，优先改 token，避免全量重绘。`,
        `phase|3|工具调用`,
        `tool|Figma MCP|updateTokens · target="${highlights[0]}" → 定位到 3 处需修改`,
        `phase|4|结果生成`,
        `thought|1|间距对齐检查通过，输出 diff。`,
      ],
      text: generateFollowUpCopy(wf, topic, highlights),
    };
    case 'demo': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|1|调整「${highlights.join(' / ')}」，找到对应交互节点，不全量重编译。`,
        `phase|2|思考规划`,
        `thought|1|只 patch 受影响的热区，保留其余交互链路不变。`,
        `phase|3|工具调用`,
        `tool|Octo Renderer|patchInteractive · target="${highlights[0]}" → 热区更新，事件重新绑定`,
        `phase|4|结果生成`,
        `thought|1|跳转链路验证完整，输出更新版本。`,
      ],
      text: generateFollowUpCopy(wf, topic, highlights),
    };
    case 'creative': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|1|强化「${highlights.join(' / ')}」，保留构图，针对性调整光影色调。`,
        `phase|2|思考规划`,
        `thought|1|用 img2img 保留构图，strength=0.45 保留上版 55% 结构。`,
        `phase|3|工具调用`,
        `tool|Image Gen MCP|img2img · strength=0.45 · prompt_add="${highlights[0]}" → 局部重绘完成`,
        `phase|4|结果生成`,
        `thought|1|颗粒感和氛围保留，输出新版本。`,
      ],
      text: generateFollowUpCopy(wf, topic, highlights),
    };
    case 'research': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|1|补充「${highlights.join(' / ')}」维度，判断现有数据是否够用。`,
        `phase|2|思考规划`,
        `thought|1|已有矩阵保留，增量搜索新维度，减少重复抓取。`,
        `phase|3|工具调用`,
        `tool|Web Search MCP|search · "${highlights[0]}" · incremental=true → 新增 11 条结果`,
        `phase|4|结果生成`,
        `thought|1|整合进对比矩阵，更新结论段落。`,
      ],
      text: generateFollowUpCopy(wf, topic, highlights),
    };
    case 'interview': return {
      thinkingLines: [
        `phase|1|意图理解`,
        `thought|1|补强「${highlights.join(' / ')}」洞察，回查 P1/P2/P3 访谈记录。`,
        `phase|2|思考规划`,
        `thought|1|语录够的话直接提炼，不够再补模拟对话。`,
        `phase|3|工具调用`,
        `tool|Knowledge Base MCP|query · "${highlights[0]}" · scope=session → 4 处相关语录`,
        `phase|4|结果生成`,
        `thought|1|语录支撑充分，更新报告对应段落。`,
      ],
      text: generateFollowUpCopy(wf, topic, highlights),
    };
  }
}

const WORKFLOW_ARTIFACTS: Record<WorkflowType, {
  badge: string;
  label: string;
  meta: string;
  iconColor: string;
  iconBg: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}> = {
  'ui-design': { badge: 'Octo Design',  Icon: Layers, label: 'ComputeGraphMemoryViewer.design',    meta: 'Design · 可编辑设计稿',           iconColor: '#7c3aed', iconBg: '#f5f3ff' },
  'demo':      { badge: 'Octo Make',    Icon: Play,   label: 'ComputeGraphViewer.make',            meta: 'Interactive Demo · 在线预览',    iconColor: '#155dfc', iconBg: '#eff6ff' },
  'creative':  { badge: 'Octo Canvas',  Icon: Wand2,  label: '开发工程师场景图',                          meta: 'Octo Canvas · 创意图像',          iconColor: '#d97706', iconBg: '#fffbeb' },
  'research':  { badge: 'Octo Insight', Icon: Users,  label: '算子开发工具竞品分析报告.Insight',      meta: 'Octo Insight · 行业洞察',         iconColor: '#0891b2', iconBg: '#f0f9ff' },
  'interview': { badge: 'Octo Insight', Icon: Users,  label: '跑步App用研报告.Insight',              meta: 'Octo Insight · 访谈报告',         iconColor: '#6d28d9', iconBg: '#f5f3ff' },
};

const QUICK_SCENARIO_PROMPTS: Array<{ icon: string; label: string; prompt: string; workflow: WorkflowType }> = [
  {
    icon: '📐',
    label: 'UI 设计稿',
    prompt: '帮我生成一个运动健康App的月报UI设计稿，深色主题，包含本月的运动概览、运动日期记录表、消耗的热量、心率状态',
    workflow: 'ui-design',
  },
  {
    icon: '📱',
    label: 'Demo 生成',
    prompt: '基于之前生成的UI设计方案，帮我生成一个真实可预览的Demo效果，模拟真实滚动的效果',
    workflow: 'demo',
  },
  {
    icon: '🎨',
    label: 'Octo Canvas',
    prompt: '软件工程师查看代码、专注专业、蓝灰色调、科技简洁风',
    workflow: 'creative',
  },
];

const CODE_SNIPPETS: Record<WorkflowType, string> = {
  'ui-design': `// 运动健康 App 月报 UI 设计稿
interface HealthDashboardParams {
  primaryColor: string;   // '#A3E635' lime default
  cardRadius: number;     // 16px default
  fontFamily: string;     // 'Inter'
  baseFontSize: number;   // 14px
  spacing: 'compact' | 'normal' | 'spacious';
}

export function HealthDashboard({ params }: { params: HealthDashboardParams }) {
  return (
    <Screen bg="#0A0A0A">
      <MonthlyOverview
        distance="87.4km"
        duration="18:42h"
        calories="6,284kcal"
        accent={params.primaryColor}
      />
      <CalendarGrid activeDays={[1,3,5,6,8,10,12,13,15,17,19,20,22,24,26,27,29]} />
      <CaloriesChart bars={[60,80,45,90,70,85,55,75,95,65,88,72]} />
      <HeartRateCard bpm={72} resting={58} max={174} avg={126} />
    </Screen>
  );
}`,
  'demo': `// 可交互 Demo — 基于设计稿转化
import { useRef } from 'react';

export function HealthAppDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const autoPlay = () => {
    const el = scrollRef.current;
    if (!el) return;
    const step = () => {
      el.scrollTop += 2;
      if (el.scrollTop < el.scrollHeight - el.clientHeight) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  return (
    <PhoneFrame>
      <div ref={scrollRef} style={{ overflowY: 'scroll', height: 480 }}>
        <HealthDashboard />
      </div>
      <PlayButton onClick={autoPlay} label="▶ 自动演示" />
    </PhoneFrame>
  );
}`,
  'creative': `// 创意场景效果图 — 女性跑步健身
// 生成参数 · 2048×1365 · PNG

const sceneConfig = {
  subject: '女性跑步健身',
  pose: '清晨逆光奔跑姿态',
  background: {
    sky: 'gradient(#1a1a2e → #E8A87C → #F4D03F)',
    sun: { position: 'horizon', glow: 'amber', radius: 80 },
    ground: '#1a1a1a silhouette',
  },
  lighting: {
    direction: 'backlit',
    hour: 'golden-hour',
    temperature: 'warm',
  },
  motion: {
    blur: 'radial behind subject',
    particles: 'scattered dust motes',
  },
  output: { width: 2048, height: 1365, format: 'PNG', quality: 100 },
};

export default sceneConfig;`,
  'research': `// 跑步 App 竞品分析 — 训练计划模块
// 竞品: Nike Run Club / Keep / Strava / Garmin Connect

interface Competitor {
  name: string;
  planType: string;
  personalization: string;
  social: string;
  dataDepth: string;
  pricing: string;
}

const competitors: Competitor[] = [
  { name: 'Nike Run Club', planType: '引导式计划', personalization: '目标导向', social: '挑战赛', dataDepth: '基础', pricing: '免费' },
  { name: 'Keep',          planType: '课程+计划', personalization: '水平分级', social: '排行榜', dataDepth: '中等', pricing: 'Freemium' },
  { name: 'Strava',        planType: '训练区间', personalization: '心率区间', social: '路段PK', dataDepth: '深度', pricing: '订阅制' },
  { name: 'Garmin Connect',planType: '周期化规划', personalization: 'VO2Max适配', social: '弱', dataDepth: '专业级', pricing: '硬件绑定' },
];

export { competitors };`,
  'interview': `// 跑步 App 用研报告 — 访谈模拟
// 人设: 入门跑者小李 / 社交驱动阿杰 / 专业跑者老王

interface Persona {
  id: string;
  name: string;
  age: number;
  tags: string[];
  profile: string;
}

const personas: Persona[] = [
  { id: 'p1', name: '小李', age: 24, tags: ['入门跑者', '目标驱动'], profile: '刚开始跑步 3 个月，每周 2-3 次，主要靠 App 的训练计划打卡激励自己坚持。' },
  { id: 'p2', name: '阿杰', age: 29, tags: ['社交驱动', '重视排名'], profile: '跑龄 2 年，喜欢和朋友比较步数和配速，认为社交功能是最大动力来源。' },
  { id: 'p3', name: '老王', age: 38, tags: ['专业跑者', '数据控'],  profile: '马拉松完赛 4 次，关注 VO2Max / 心率区间 / 恢复指数等专业指标。' },
];

export { personas };`,
};

function copyComputedStyles(source: Element, target: Element) {
  const computed = window.getComputedStyle(source);
  const styleTarget = target as HTMLElement | SVGElement;
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed.item(i);
    styleTarget.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
  }
}

function cloneNodeWithInlineStyles<T extends Element>(node: T): T {
  const clone = node.cloneNode(true) as T;

  const sync = (source: Element, target: Element) => {
    copyComputedStyles(source, target);

    if (source instanceof HTMLInputElement && target instanceof HTMLInputElement) {
      target.value = source.value;
      target.setAttribute('value', source.value);
    }

    if (source instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
      target.value = source.value;
      target.textContent = source.value;
    }

    if (source instanceof HTMLCanvasElement && target instanceof HTMLCanvasElement) {
      const ctx = target.getContext('2d');
      if (ctx) ctx.drawImage(source, 0, 0);
    }

    if (source instanceof HTMLElement && target instanceof HTMLElement) {
      target.scrollTop = source.scrollTop;
      target.scrollLeft = source.scrollLeft;
    }

    const sourceChildren = Array.from(source.children);
    const targetChildren = Array.from(target.children);
    sourceChildren.forEach((child, index) => {
      const targetChild = targetChildren[index];
      if (targetChild) sync(child, targetChild);
    });
  };

  sync(node, clone);
  return clone;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const timeoutId = window.setTimeout(() => reject(new Error('图片生成超时，请重试')), 4000);
    image.onload = () => {
      window.clearTimeout(timeoutId);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error('图片生成失败，请重试'));
    };
    image.src = url;
  });
}

async function renderElementToPngBlob(element: HTMLElement, scale: number = 2) {
  // 等待字体加载
  if (document.fonts?.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => window.setTimeout(resolve, 800)),
    ]);
  }

  const rect = element.getBoundingClientRect();
  const w = Math.round(rect.width * scale);
  const h = Math.round(rect.height * scale);

  // 优先用 html2canvas；若元素内有 SVG，同时尝试 SVG 序列化降级路径
  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: rect.width,
      height: rect.height,
    });

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (blob && blob.size > 1000) return blob; // 过小说明可能是空白图，降级
  } catch {
    // html2canvas 失败，走 SVG 序列化路径
  }

  // SVG 序列化降级：将整个元素通过 foreignObject 嵌入 SVG 再转 PNG
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgEl.setAttribute('width', String(w));
  svgEl.setAttribute('height', String(h));
  svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  fo.setAttribute('width', String(w));
  fo.setAttribute('height', String(h));
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '0');

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = `scale(${scale})`;
  clone.style.transformOrigin = 'top left';
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  fo.appendChild(clone);
  svgEl.appendChild(fo);

  const svgStr = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return await new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('图片生成失败，请重试'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片渲染失败，请重试'));
    };
    img.src = url;
  });
}

async function copyElementAsImage(element: HTMLElement) {
  const ClipboardItemCtor = (window as Window & { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  if (!navigator.clipboard?.write || !ClipboardItemCtor) {
    throw new Error('当前浏览器不支持复制图片，请使用 Chromium 内核浏览器');
  }

  // 必须在用户手势上下文中同步发起 clipboard.write，
  // 通过传入 Promise<Blob> 的方式让浏览器在手势上下文内锁定写入权限，
  // 然后异步解析 Blob，避免 await 后丢失手势上下文导致静默失败。
  const blobPromise = renderElementToPngBlob(element);
  await Promise.race([
    navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blobPromise })]),
    new Promise((_, reject) => window.setTimeout(() => reject(new Error('复制图片超时，请重试')), 8000)),
  ]);
}

// ─── AnimatedDots ─────────────────────────────────────────────────────────────
function AnimatedDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -1.5, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

// ─── StreamedText ─────────────────────────────────────────────────────────────
// Tracks message IDs that have already been animated so remounts skip animation
const _streamedMsgIds = new Set<string>();

function StreamedText({ text, msgId, speed = 18 }: { text: string; msgId: string; speed?: number }) {
  const skipAnimation = _streamedMsgIds.has(msgId);
  const [displayed, setDisplayed] = useState(skipAnimation ? text : '');

  useEffect(() => {
    if (skipAnimation) {
      setDisplayed(text);
      return;
    }
    // Mark immediately so any remount during animation also skips
    _streamedMsgIds.add(msgId);
    setDisplayed('');
    let i = 0;
    let timer: number;
    const tick = () => {
      i += 2;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        timer = window.setTimeout(tick, speed);
      }
    };
    timer = window.setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [text, msgId, speed, skipAnimation]);

  return <>{displayed}</>;
}

// ─── Thinking helpers ─────────────────────────────────────────────────────────
// Line format:
//   phase|N|阶段名        → 阶段分隔标题（N = 1~4）
//   thought|Xs|内容       → 可展开的思考片段
//   tool|ToolName|action → result  → 工具调用条目
//   (plain string)        → 兜底纯文本

type ThinkingStep =
  | { type: 'phase'; num: number; label: string }
  | { type: 'thought'; secs: number; content: string }
  | { type: 'tool'; name: string; detail: string }
  | { type: 'plain'; text: string };

function parseThinkingLine(line: string): ThinkingStep {
  const parts = line.split('|');
  if (parts.length >= 3 && parts[0] === 'phase') {
    return { type: 'phase', num: parseInt(parts[1]) || 1, label: parts[2] };
  }
  if (parts.length >= 3 && parts[0] === 'thought') {
    return { type: 'thought', secs: parseInt(parts[1]) || 1, content: parts.slice(2).join('|') };
  }
  if (parts.length >= 3 && parts[0] === 'tool') {
    return { type: 'tool', name: parts[1], detail: parts.slice(2).join('|') };
  }
  return { type: 'plain', text: line };
}

function ThinkingStepRow({ line, isLast = false }: { line: string; isLast?: boolean }) {
  const step = parseThinkingLine(line);

  if (step.type === 'phase') {
    return (
      <div className="flex items-center gap-[6px] pt-[4px]">
        <span className="w-[16px] h-[16px] rounded-full bg-[#f3f4f6] border border-[#e5e7eb] flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-[#9ca3af] leading-none">{step.num}</span>
        </span>
        <span className="text-[11px] font-semibold text-[#9ca3af] tracking-wide">{step.label}</span>
      </div>
    );
  }

  if (step.type === 'thought') {
    return (
      <p className="pl-[22px] text-[12px] leading-[18px] text-[#8b93a0] italic">
        {step.content}
      </p>
    );
  }

  if (step.type === 'tool') {
    const arrowIdx = step.detail.indexOf('→');
    const action = arrowIdx !== -1 ? step.detail.slice(0, arrowIdx).trim() : step.detail.trim();
    const result = arrowIdx !== -1 ? step.detail.slice(arrowIdx + 1).trim() : '';
    return (
      <div className="pl-[22px] flex items-baseline gap-[8px]">
        <span className={`shrink-0 w-[5px] h-[5px] rounded-full mt-[5px] ${isLast ? 'bg-[#d1d5db]' : 'bg-[#10b981]'}`} />
        <span className="text-[12px] font-medium text-[#374151] shrink-0">{step.name}</span>
        {action && <span className="text-[12px] text-[#6b7280] truncate min-w-0">{action}</span>}
        {result && <span className="text-[12px] text-[#adb3bc] shrink-0 whitespace-nowrap">→ {result}</span>}
      </div>
    );
  }

  return (
    <div className="pl-[22px] flex items-baseline gap-[8px] text-[12px] text-[#6b7280]">
      <span className={`shrink-0 w-[5px] h-[5px] rounded-full mt-[5px] ${isLast ? 'bg-[#d1d5db]' : 'bg-[#10b981]'}`} />
      <span>{step.text}</span>
    </div>
  );
}

// ─── ThinkingBlock ────────────────────────────────────────────────────────────
function ThinkingBlock({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  const totalSecs = lines.reduce((acc, l) => {
    const step = parseThinkingLine(l);
    return acc + (step.type === 'thought' ? step.secs : step.type === 'tool' ? 1 : 0);
  }, 0);
  return (
    <div className="mb-2">
      <button
        onMouseDown={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[12px] leading-[16px] text-[#9ca3af] hover:text-[#6a7282] transition-colors"
      >
        思考完毕 · {totalSecs}s
        <ChevronDown size={10} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-[8px] flex flex-col gap-[10px]">
          {lines.map((l, i) => (
            <ThinkingStepRow key={i} line={l} isLast={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UIDesignCanvas ───────────────────────────────────────────────────────────
interface UIDesignParams {
  primaryColor: string;
  cardRadius: number;
  fontFamily: string;
  baseFontSize: number;
  spacing: 'compact' | 'normal' | 'spacious';
}

const COLOR_OPTIONS = ['#A3E635', '#FB923C', '#38BDF8', '#F472B6', '#A78BFA'];

function UIDesignCanvas() {
  const [primaryColor, setPrimaryColor] = useState('#A3E635');
  const [cardRadius, setCardRadius] = useState(16);

  // Infinite canvas state
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Bug 4: Non-passive wheel handler for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale(s => Math.min(Math.max(s * (e.deltaY > 0 ? 0.9 : 1.1), 0.1), 4));
      } else {
        setOffset(o => ({ x: o.x - e.deltaX * 0.4, y: o.y - e.deltaY * 0.4 }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Bug 4: Drag to pan
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-design]')) return;
    setIsDragging(true);
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: dragRef.current.ox + e.clientX - dragRef.current.mx, y: dragRef.current.oy + e.clientY - dragRef.current.my });
  };
  const onMouseUp = () => setIsDragging(false);

  const pc = primaryColor;
  const cr = cardRadius;

  return (
    <div className="flex h-full" style={{ fontFamily: 'Inter' }}>
      {/* ── Infinite canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#fafafa',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Toolbar — top right */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => { window.open('https://www.figma.com/', '_blank'); }}
            className="flex items-center gap-1 h-8 px-2 rounded-[6px] text-[12px] text-[#555] hover:text-[#191919] hover:bg-[#f5f5f5] transition-colors shrink-0"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2H5a3 3 0 0 0 0 6h3V2zM8 8H5a3 3 0 0 0 0 6h3V8zM8 2h3a3 3 0 0 1 0 6H8V2zM8 8h3a3 3 0 0 1 0 6H8V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            从在线设计打开
          </button>
        </div>
        {/* Design preview image — Figma artboard style */}
        <div
          data-design="true"
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
            transformOrigin: 'center center',
            width: 'auto',
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
        >
          {/* Artboard name label */}
          <div
            style={{
              position: 'absolute',
              top: -24,
              left: 0,
              fontSize: 12,
              color: '#666',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            ComputeGraphMemoryViewer.design
          </div>
          {/* Artboard frame */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            <img
              src={casePng}
              alt="Compute Graph Memory Viewer"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '75vh',
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        </div>

        {/* Zoom controls — bottom right */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
          <div className="flex items-center rounded-lg overflow-hidden border" style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}>
            <button onClick={() => setScale(s => Math.max(+(s - 0.1).toFixed(2), 0.1))} className="px-2.5 h-7 text-[#888] hover:text-[#333] hover:bg-[#f5f5f5] transition-colors flex items-center">
              <Minus size={10} />
            </button>
            <span className="px-2 h-7 flex items-center border-x text-[#555]" style={{ fontSize: 11, minWidth: 44, justifyContent: 'center', borderColor: '#d1d5db', fontVariantNumeric: 'tabular-nums' as const }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={() => setScale(s => Math.min(+(s + 0.1).toFixed(2), 4))} className="px-2.5 h-7 text-[#888] hover:text-[#333] hover:bg-[#f5f5f5] transition-colors flex items-center">
              <Plus size={10} />
            </button>
          </div>
          <button
            onClick={() => { setScale(0.85); setOffset({ x: 0, y: 0 }); }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center text-[#888] hover:text-[#333] hover:bg-[#f5f5f5] transition-colors"
            style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
            title="Fit to screen"
          >
            <Maximize2 size={10} />
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── DemoCanvas ───────────────────────────────────────────────────────────────
type DemoView = 'preview' | 'code';
type DeviceType = 'web' | 'app' | 'custom';

const DEMO_CODE = `// Compute Graph Memory Viewer
// 算子级内存分配可视化工具

import { useState } from 'react';

const GRAPH_NODES = [
  { id: 'ld_a',   label: 'TILE_LD_A',       x: 32,  y: 24  },
  { id: 'l1_a',   label: 'TILE_L1_A',       x: 236, y: 40  },
  { id: 'l2_a',   label: 'TILE_L2_A',       x: 396, y: 40  },
  { id: 'l3_a',   label: 'TILE_L3_A',       x: 556, y: 40  },
  { id: 'out_a',  label: 'TILE_OUT_A',      x: 730, y: 24  },
  { id: 'ld_b',   label: 'TILE_LD_B',       x: 32,  y: 122 },
  { id: 'l1_b',   label: 'TILE_L1_B',       x: 236, y: 138 },
  { id: 'l2_b',   label: 'TILE_L2_B',       x: 396, y: 138 },
  { id: 'l3_b',   label: 'TILE_L3_B',       x: 556, y: 138 },
  { id: 'out_b',  label: 'TILE_OUT_B',      x: 730, y: 122 },
  { id: 'ld_c',   label: 'TILE_LD_C',       x: 32,  y: 220 },
  { id: 'l1_c',   label: 'TILE_L1_C',       x: 236, y: 236 },
  { id: 'sel',    label: 'TILE_L1_TO_L0A',  x: 382, y: 234, highlight: true },
  { id: 'l3_c',   label: 'TILE_L3_C',       x: 556, y: 236 },
  { id: 'out_c',  label: 'TILE_OUT_C',      x: 730, y: 220 },
  { id: 'ld_d',   label: 'TILE_LD_D',       x: 32,  y: 318 },
  { id: 'l1_d',   label: 'TILE_L1_D',       x: 236, y: 334 },
  { id: 'l2_d',   label: 'TILE_L2_D',       x: 396, y: 334 },
  { id: 'l3_d',   label: 'TILE_L3_D',       x: 556, y: 334 },
  { id: 'out_d',  label: 'TILE_OUT_D',      x: 730, y: 318 },
  { id: 'ld_e',   label: 'TILE_LD_E',       x: 32,  y: 416 },
  { id: 'l1_e',   label: 'TILE_L1_E',       x: 236, y: 432 },
  { id: 'l2_e',   label: 'TILE_L2_E',       x: 396, y: 432 },
  { id: 'l3_e',   label: 'TILE_L3_E',       x: 556, y: 432 },
  { id: 'out_e',  label: 'TILE_OUT_E',      x: 730, y: 416 },
];

export function ComputeGraphViewer() {
  const [round, setRound] = useState(100);
  const [step,  setStep]  = useState(2);
  return (
    <ComputeGraphLayout
      nodes={GRAPH_NODES}
      selectedNode="TILE_L1_TO_L0A"
      round={round}
      step={step}
      onRoundChange={setRound}
      onStepChange={setStep}
      stats={{ mops: 18944, exports: 48, imports: 40 }}
    />
  );
}`;

// ─── Compute Graph Viewer component (replaces health-app demo) ─────────────
function ComputeGraphViewer() {
  const [selectedNodeId, setSelectedNodeId] = useState('sel');

  // Pan / zoom state
  const [pan, setPan] = useState({ x: 16, y: 20 });
  const [scale, setScale] = useState(0.88);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const graphContainerRef = useRef<HTMLDivElement>(null);

  type GraphNode = { id: string; label: string; x: number; y: number; highlight?: boolean; w?: number; h?: number };
  const nodes: GraphNode[] = [
    { id: 'ld_a',  label: 'TILE_LD_A',      x: 32,  y: 24,  w: 156, h: 56 },
    { id: 'l1_a',  label: 'TILE_L1_A',      x: 236, y: 40,  w: 124, h: 24 },
    { id: 'l2_a',  label: 'TILE_L2_A',      x: 396, y: 40,  w: 124, h: 24 },
    { id: 'l3_a',  label: 'TILE_L3_A',      x: 556, y: 40,  w: 124, h: 24 },
    { id: 'out_a', label: 'TILE_OUT_A',     x: 730, y: 24,  w: 156, h: 56 },
    { id: 'ld_b',  label: 'TILE_LD_B',      x: 32,  y: 122, w: 156, h: 56 },
    { id: 'l1_b',  label: 'TILE_L1_B',      x: 236, y: 138, w: 124, h: 24 },
    { id: 'l2_b',  label: 'TILE_L2_B',      x: 396, y: 138, w: 124, h: 24 },
    { id: 'l3_b',  label: 'TILE_L3_B',      x: 556, y: 138, w: 124, h: 24 },
    { id: 'out_b', label: 'TILE_OUT_B',     x: 730, y: 122, w: 156, h: 56 },
    { id: 'ld_c',  label: 'TILE_LD_C',      x: 32,  y: 220, w: 156, h: 56 },
    { id: 'l1_c',  label: 'TILE_L1_C',      x: 236, y: 236, w: 124, h: 24 },
    { id: 'sel',   label: 'TILE_L1_TO_L0A', x: 382, y: 234, w: 152, h: 28, highlight: true },
    { id: 'l3_c',  label: 'TILE_L3_C',      x: 556, y: 236, w: 124, h: 24 },
    { id: 'out_c', label: 'TILE_OUT_C',     x: 730, y: 220, w: 156, h: 56 },
    { id: 'ld_d',  label: 'TILE_LD_D',      x: 32,  y: 318, w: 156, h: 56 },
    { id: 'l1_d',  label: 'TILE_L1_D',      x: 236, y: 334, w: 124, h: 24 },
    { id: 'l2_d',  label: 'TILE_L2_D',      x: 396, y: 334, w: 124, h: 24 },
    { id: 'l3_d',  label: 'TILE_L3_D',      x: 556, y: 334, w: 124, h: 24 },
    { id: 'out_d', label: 'TILE_OUT_D',     x: 730, y: 318, w: 156, h: 56 },
    { id: 'ld_e',  label: 'TILE_LD_E',      x: 32,  y: 416, w: 156, h: 56 },
    { id: 'l1_e',  label: 'TILE_L1_E',      x: 236, y: 432, w: 124, h: 24 },
    { id: 'l2_e',  label: 'TILE_L2_E',      x: 396, y: 432, w: 124, h: 24 },
    { id: 'l3_e',  label: 'TILE_L3_E',      x: 556, y: 432, w: 124, h: 24 },
    { id: 'out_e', label: 'TILE_OUT_E',     x: 730, y: 416, w: 156, h: 56 },
  ];
  const NODE_H = 28;
  const laneLines = [52, 150, 248, 346, 444];

  type Edge = [string, string];
  const edges: Edge[] = [
    ['ld_a', 'l1_a'], ['l1_a', 'l2_a'], ['l2_a', 'l3_a'], ['l3_a', 'out_a'],
    ['ld_b', 'l1_b'], ['l1_b', 'l2_b'], ['l2_b', 'l3_b'], ['l3_b', 'out_b'],
    ['ld_c', 'l1_c'], ['l1_c', 'sel'],  ['sel',  'l3_c'], ['l3_c', 'out_c'],
    ['ld_d', 'l1_d'], ['l1_d', 'l2_d'], ['l2_d', 'l3_d'], ['l3_d', 'out_d'],
    ['ld_e', 'l1_e'], ['l1_e', 'l2_e'], ['l2_e', 'l3_e'], ['l3_e', 'out_e'],
    ['ld_a', 'ld_b'], ['ld_b', 'ld_c'], ['ld_c', 'ld_d'], ['ld_d', 'ld_e'],
    ['l1_a', 'l1_b'], ['l1_b', 'l1_c'], ['l1_c', 'l1_d'], ['l1_d', 'l1_e'],
    ['l2_a', 'l2_b'], ['l2_b', 'sel'],  ['sel',  'l2_d'], ['l2_d', 'l2_e'],
    ['l3_a', 'l3_b'], ['l3_b', 'l3_c'], ['l3_c', 'l3_d'], ['l3_d', 'l3_e'],
    ['out_a', 'out_b'], ['out_b', 'out_c'], ['out_c', 'out_d'], ['out_d', 'out_e'],
  ];

  const nodeById = (id: string) => nodes.find(n => n.id === id);
  const isCardNode = (n: GraphNode) => n.id.startsWith('ld_') || n.id.startsWith('out_');
  const cardTone = (n: GraphNode) => (n.id === 'ld_e' ? 'blue' : n.id === 'out_e' ? 'green' : 'default');
  const opNodes = nodes.filter((n) => !isCardNode(n));
  const selectedNodeResolvedId = opNodes.some((n) => n.id === selectedNodeId) ? selectedNodeId : 'sel';
  const selectedNodeData = nodeById(selectedNodeResolvedId);
  const selectedNode = selectedNodeData?.label ?? 'TILE_L1_TO_L0A';
  const selectedOpIndex = Math.max(opNodes.findIndex((n) => n.id === selectedNodeResolvedId), 0);
  const selectedStep = selectedNodeResolvedId === 'sel' ? 2 : 4 + selectedOpIndex;
  const runningCount = 1 + (selectedOpIndex % 3);
  const paddingValue = 112 + selectedOpIndex * 8;

  const getFlowMeta = (node: GraphNode | undefined) => {
    const label = node?.label ?? '';
    if (label.includes('TO_L0A')) return { flow: 'L1→L0A', readLevel: 'L1', writeLevel: 'L0A', flowTag: 'L1_L0A' };
    if (label.includes('L1_')) return { flow: 'L1→L2', readLevel: 'L1', writeLevel: 'L2', flowTag: 'L1_L2' };
    if (label.includes('L2_')) return { flow: 'L2→L3', readLevel: 'L2', writeLevel: 'L3', flowTag: 'L2_L3' };
    if (label.includes('L3_')) return { flow: 'L3→OUT', readLevel: 'L3', writeLevel: 'OUT', flowTag: 'L3_OUT' };
    return { flow: 'L1→L0A', readLevel: 'L1', writeLevel: 'L0A', flowTag: 'L1_L0A' };
  };

  const flowMeta = getFlowMeta(selectedNodeData);
  const selectedMagicId = selectedNodeResolvedId === 'sel' ? 10044 : 10060 + selectedOpIndex * 11;
  const mopsValue = selectedNodeResolvedId === 'sel' ? '18,944' : (17500 + selectedOpIndex * 368).toLocaleString('en-US');
  const exportsValue = selectedNodeResolvedId === 'sel' ? '48' : `${42 + (selectedOpIndex % 7) * 2}`;
  const importsValue = selectedNodeResolvedId === 'sel' ? '40' : `${34 + (selectedOpIndex % 6) * 2}`;
  const tileSuffixMatch = selectedNode.match(/_([A-E])$/);
  const tileSuffix = tileSuffixMatch ? tileSuffixMatch[1].toLowerCase() : 'i';
  const statusCycle = [
    { value: '执行中', color: '#DC2626' },
    { value: '等待中', color: '#D97706' },
    { value: '已完成', color: '#059669' },
  ] as const;
  const currentStatus = selectedNodeResolvedId === 'sel'
    ? statusCycle[0]
    : statusCycle[(selectedOpIndex + 1) % statusCycle.length];

  const isOpSelected = (n: GraphNode) => n.id === selectedNodeResolvedId;
  const cx = (n: GraphNode) => n.x + (n.w ?? 86) / 2;
  const cy = (n: GraphNode) => n.y + (n.h ?? NODE_H) / 2;

  // Memory block data (TileFlow view mock)
  const memBlocks = [
    { label: 'L2 Buffer',  color: '#4A90D9', x: 4,  y: 8,  w: 44, h: 80 },
    { label: 'L1 Shared',  color: '#7C5CBF', x: 52, y: 8,  w: 44, h: 60 },
    { label: 'L1 Shared',  color: '#7C5CBF', x: 52, y: 72, w: 44, h: 16 },
    { label: 'L0A Ping',   color: '#2C2C3E', x: 100, y: 8, w: 36, h: 38 },
    { label: 'L0A Pong',   color: '#2C2C3E', x: 100, y: 50, w: 36, h: 38 },
    { label: 'L0B',        color: '#E8A84A', x: 140, y: 28, w: 36, h: 60 },
  ];
  const selectedOpRows: Array<{ key: string; value: string; isStatus?: boolean }> = [
    { key: 'Magic ID', value: `#${selectedMagicId}` },
    { key: '执行顺序', value: `Step ${selectedStep} / 166` },
    { key: '状态', value: currentStatus.value, isStatus: true },
  ];

  const levelTone = (level: string) => {
    if (level === 'L0A') return { accent: '#7C3AED', bg: '#EDE9FE' };
    if (level === 'L1') return { accent: '#1D4ED8', bg: '#DBEAFE' };
    if (level === 'L2') return { accent: '#0EA5E9', bg: '#DFF5FF' };
    if (level === 'L3') return { accent: '#0F766E', bg: '#DDF8F2' };
    return { accent: '#6B7280', bg: '#E5E7EB' };
  };

  const readTone = levelTone(flowMeta.readLevel);
  const writeTone = levelTone(flowMeta.writeLevel);
  const specH = selectedNodeResolvedId === 'sel' ? 64 : (selectedOpIndex % 2 === 0 ? 64 : 32);
  const tensorSpec = `[32x${specH}] BF16`;
  const tensorSize = `${(specH / 16).toFixed(1)} KB`;

  const memoryOps = [
    { action: '读', level: flowMeta.readLevel, name: `View_q${tileSuffix}`, spec: tensorSpec, size: tensorSize, accent: readTone.accent, bg: readTone.bg },
    {
      action: '写',
      level: flowMeta.writeLevel,
      name: flowMeta.writeLevel === 'L0A' ? 'a_l0' : flowMeta.writeLevel === 'OUT' ? `out_${tileSuffix}` : `a_${flowMeta.writeLevel.toLowerCase()}_${tileSuffix}`,
      spec: tensorSpec,
      size: tensorSize,
      accent: writeTone.accent,
      bg: writeTone.bg,
    },
  ];

  const s: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 11 };

  return (
    <div style={{ ...s, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f7', overflow: 'hidden' }}>

      {/* ── Top toolbar ── */}
      <div style={{ height: 34, background: '#fff', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, color: '#191919', fontSize: 12 }}>Compute Graph Memory Viewer</span>
        <div style={{ background: '#3B82F6', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>Round: 100</div>
        <div style={{ background: '#E8F4FF', color: '#1D4ED8', borderRadius: 4, padding: '1px 8px', fontSize: 10, border: '1px solid #BFDBFE', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          TRIGGER_COMP_L1_LD_WAIT(5_PAGES_12)
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: '#999' }}>Step {selectedStep} / 100 — </span>
        <span style={{ fontSize: 10, color: '#3B82F6', fontWeight: 600 }}>{selectedNode}</span>
        <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>{`(#${selectedMagicId.toString().slice(-4)})`}</span>
      </div>

      {/* ── Main body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Compute graph — pan & zoom */}
        <div
          ref={graphContainerRef}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#dce3ea', cursor: isDragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={e => {
            isDragging.current = true;
            lastPos.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.style.cursor = 'grabbing';
          }}
          onMouseMove={e => {
            if (!isDragging.current) return;
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            lastPos.current = { x: e.clientX, y: e.clientY };
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
          }}
          onMouseUp={e => {
            isDragging.current = false;
            e.currentTarget.style.cursor = 'grab';
          }}
          onMouseLeave={e => {
            isDragging.current = false;
            e.currentTarget.style.cursor = 'grab';
          }}
          onWheel={e => {
            e.preventDefault();
            const rect = graphContainerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(s => {
              const ns = Math.min(Math.max(s * delta, 0.2), 5);
              // zoom toward mouse position
              setPan(p => ({
                x: mx - (mx - p.x) * (ns / s),
                y: my - (my - p.y) * (ns / s),
              }));
              return ns;
            });
          }}
        >
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            {/* Background */}
            <rect width="100%" height="100%" fill="#dce3ea"/>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
              {laneLines.map((y, i) => (
                <line
                  key={`lane-${i}`}
                  x1={-60}
                  y1={y}
                  x2={980}
                  y2={y}
                  stroke="#9AA9BB"
                  strokeWidth={1.1}
                  opacity={0.6}
                />
              ))}

              {/* Edges */}
              {edges.map(([a, b], i) => {
                const na = nodeById(a), nb = nodeById(b);
                if (!na || !nb) return null;
                const x1 = cx(na);
                const y1 = cy(na);
                const x2 = cx(nb);
                const y2 = cy(nb);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const d = Math.abs(dx) >= Math.abs(dy)
                  ? `M ${x1} ${y1} L ${x1 + dx / 2} ${y1} L ${x1 + dx / 2} ${y2} L ${x2} ${y2}`
                  : `M ${x1} ${y1} L ${x1} ${y1 + dy / 2} L ${x2} ${y1 + dy / 2} L ${x2} ${y2}`;
                const activeEdge = a === selectedNodeResolvedId || b === selectedNodeResolvedId;
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={activeEdge ? '#F59E0B' : '#94A3B8'}
                    strokeWidth={activeEdge ? 1.9 : 1.4}
                    opacity={activeEdge ? 0.75 : 0.82}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((n, idx) => {
                const w = n.w ?? 86;
                const h = n.h ?? NODE_H;

                if (isCardNode(n)) {
                  const tone = cardTone(n);
                  const border = tone === 'blue' ? '#0B84FF' : tone === 'green' ? '#00C49A' : '#C8D2DE';
                  const body = tone === 'blue' ? '#D6EBFF' : tone === 'green' ? '#D1FAEA' : '#F6FAFD';
                  const header = tone === 'blue' ? '#BEDCFF' : tone === 'green' ? '#B7F3E2' : '#DCE8F9';
                  const glow =
                    tone === 'blue'
                      ? 'drop-shadow(0 0 8px rgba(59,130,246,0.28))'
                      : tone === 'green'
                        ? 'drop-shadow(0 0 8px rgba(16,185,129,0.26))'
                        : 'drop-shadow(0 1px 2px rgba(67,84,104,0.16))';
                  const title = n.id.startsWith('ld_') ? `View_qi (${1082 + idx})` : `a_l0 (${998 + idx})`;
                  const rightTag = `${67 - Math.floor(idx / 5) * 5}`;
                  return (
                    <g key={n.id}>
                      <rect
                        x={n.x} y={n.y} width={w} height={h} rx={8}
                        fill={body}
                        stroke={border}
                        strokeWidth={tone === 'default' ? 1.2 : 2}
                        filter={glow}
                      />
                      <rect
                        x={n.x + 1} y={n.y + 1} width={w - 2} height={18} rx={6}
                        fill={header}
                        opacity={0.92}
                        stroke="none"
                      />
                      <text
                        x={n.x + 8} y={n.y + 13}
                        textAnchor="start"
                        fontSize={6.8}
                        fontWeight={700}
                        fill="#7A8BA2"
                        fontFamily="ui-monospace, monospace"
                      >
                        {title}
                      </text>
                      <text
                        x={n.x + w - 8} y={n.y + 13}
                        textAnchor="end"
                        fontSize={9}
                        fontWeight={700}
                        fill="#4B5A70"
                        fontFamily="ui-monospace, monospace"
                      >
                        {rightTag}
                      </text>
                      <text x={n.x + 8} y={n.y + 28} fontSize={6.8} fill="#7A8BA2" fontFamily="ui-monospace, monospace">shape:   [32,64]</text>
                      <text x={n.x + 8} y={n.y + 36} fontSize={6.8} fill="#7A8BA2" fontFamily="ui-monospace, monospace">reshape: [32,64]</text>
                      <text x={n.x + 8} y={n.y + 44} fontSize={6.8} fill="#7A8BA2" fontFamily="ui-monospace, monospace">offset:  [0,0]</text>
                      <text x={n.x + 8} y={n.y + 52} fontSize={6.8} fill="#7A8BA2" fontFamily="ui-monospace, monospace">datatype: BF16</text>
                    </g>
                  );
                }

                const selected = isOpSelected(n);
                return (
                  <g
                    key={n.id}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setSelectedNodeId(n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={n.x} y={n.y} width={w} height={h} rx={10}
                      fill={selected ? '#F97316' : '#F5F8FC'}
                      stroke={selected ? '#EA580C' : '#D4DCE7'}
                      strokeWidth={selected ? 2.2 : 1.2}
                      filter={selected ? 'drop-shadow(0 2px 8px rgba(249,115,22,0.42))' : 'drop-shadow(0 1px 1px rgba(71,85,105,0.08))'}
                    />
                    <circle cx={n.x - 4} cy={n.y + h / 2} r={3.8} fill="#fff" stroke={selected ? '#FB923C' : '#D4DCE7'} strokeWidth={1.2}/>
                    <circle cx={n.x + w + 4} cy={n.y + h / 2} r={3.8} fill="#fff" stroke={selected ? '#FB923C' : '#D4DCE7'} strokeWidth={1.2}/>
                    <text
                      x={n.x + w / 2} y={n.y + h / 2 + 3.5}
                      textAnchor="middle"
                      fontSize={selected ? 11 : 9.2}
                      fontWeight={selected ? 800 : 700}
                      fill={selected ? '#1F1308' : '#6B7280'}
                      fontFamily="ui-monospace, monospace"
                    >
                      {selected ? `${n.label} ${selectedMagicId}` : `${n.label} ${10045 + (idx % 5)}`}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom hint */}
          <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 9, color: '#bbb', pointerEvents: 'none', fontFamily: 'ui-monospace, monospace' }}>
            {Math.round(scale * 100)}% · 拖拽移动 · 滚轮缩放
          </div>
        </div>

        {/* Right: Memory visualization + details */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e0e0e0', background: '#fff' }}>

          {/* Step controls */}
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#555' }}>▼ {selectedStep} Dims</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>·</span>
            <span style={{ fontSize: 10, color: '#22C55E' }}>{runningCount} running</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>· {paddingValue} padding</span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 10, color: '#999' }}>Actions</span>
          </div>

          {/* TileFlow memory blocks */}
          <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: '#374151', fontWeight: 600, marginBottom: 2 }}>{selectedNode}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>{flowMeta.readLevel} → {flowMeta.writeLevel}</div>

            {/* Memory block visualization */}
            <div style={{ position: 'relative', height: 100, background: '#1e1e2e', borderRadius: 6, overflow: 'hidden' }}>
              {memBlocks.map((b, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${b.x / 1.82}%`,
                  top: b.y,
                  width: `${b.w / 1.82}%`,
                  height: b.h,
                  background: b.color,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} />
              ))}
              <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>TileFlow</div>
            </div>

            {/* Stats rows */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Node', selectedNode],
                ['Step', `${selectedStep} / 100`],
                ['Mops', mopsValue],
                ['Exports', exportsValue],
                ['Imports', importsValue],
                ['Flops', flowMeta.flowTag],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ color: '#9ca3af' }}>{k}</span>
                  <span style={{ color: '#111827', fontWeight: k === 'Node' ? 600 : 400, maxWidth: 160, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Color legend */}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['#4A90D9','L2 Buf'],['#7C5CBF','L1 Shr'],['#2C2C3E','L0A'],['#E8A84A','L0B']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 8, height: 8, background: c, borderRadius: 2 }}/>
                  <span style={{ fontSize: 9, color: '#6b7280' }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Selected operator details */}
            <div style={{ marginTop: 8, borderTop: '1px solid #eceef2', paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: '#F97316' }}/>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>选中算子详情</span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{selectedNode}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ede9fe', color: '#7C3AED', border: '1px solid #d8b4fe', borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>
                    {flowMeta.flow}
                  </div>
                </div>

                {selectedOpRows.map((row) => (
                  <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5 }}>
                    <span style={{ color: '#6b7280' }}>{row.key}</span>
                    <span style={{ color: row.isStatus ? currentStatus.color : '#111827', fontWeight: row.isStatus ? 700 : 600 }}>
                      {row.isStatus ? '▶ ' : ''}{row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory operations */}
            <div style={{ borderTop: '1px solid #eceef2', paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>内存操作</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {memoryOps.map((row) => (
                  <div key={`${row.action}-${row.level}-${row.name}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 8px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: row.accent, background: row.bg, borderRadius: 4, padding: '1px 5px', border: `1px solid ${row.accent}33` }}>{row.action}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: row.accent, borderRadius: 999, padding: '1px 7px' }}>{row.level}</span>
                        <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{row.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 10, whiteSpace: 'nowrap' }}>
                        <span>{row.spec}</span>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>{row.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{ height: 26, background: '#f0f0f2', borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 16, flexShrink: 0 }}>
        {[
          ['Go', selectedNode],
          ['Mops', mopsValue],
          ['Exports', exportsValue],
          ['Imports', importsValue],
          ['Flops', flowMeta.flowTag],
        ].map(([k, v]) => (
          <span key={k} style={{ fontSize: 10, color: '#555' }}>
            <span style={{ color: '#9ca3af' }}>{k}: </span>{v}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DemoCanvas({
  onToast,
  toolbarLeftPadding = 0,
  generatedHtml,
  onCopyAsDesign,
}: {
  onToast?: (message: string) => void;
  toolbarLeftPadding?: number;
  generatedHtml?: string | null;
  onCopyAsDesign?: () => Promise<void>;
}) {
  const [demoView, setDemoView] = useState<DemoView>('preview');
  const [device, setDevice] = useState<DeviceType>('app');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isCopyingDesign, setIsCopyingDesign] = useState(false);
  // Custom resize state
  const [customSize, setCustomSize] = useState({ w: 360, h: 520 });
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const webPreviewRef = useRef<HTMLDivElement>(null);
  const customPreviewRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: customSize.w, startH: customSize.h };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dw = ev.clientX - dragRef.current.startX;
      const dh = ev.clientY - dragRef.current.startY;
      setCustomSize({ w: Math.max(200, dragRef.current.startW + dw), h: Math.max(160, dragRef.current.startH + dh) });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleCopyPreviewImage = useCallback(async () => {
    if (demoView !== 'preview') {
      setDemoView('preview');
      // 等待预览视图挂载完成后再截图
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });
    }

    const targetElement = device === 'custom'
      ? customPreviewRef.current
      : webPreviewRef.current;

    if (!targetElement) {
      onToast?.('未找到可复制的 Demo 预览，请稍后重试');
      return;
    }

    try {
      setIsCopyingImage(true);
      await copyElementAsImage(targetElement);
      onToast?.('已截图并复制，可直接粘贴');
    } catch (error) {
      const message = error instanceof Error ? error.message : '复制图片失败，请重试';
      onToast?.(message);
    } finally {
      setIsCopyingImage(false);
    }
  }, [demoView, device, onToast]);

  const toolbar = (
    <div
      className="shrink-0 w-full p-[12px] z-10 flex items-center gap-2"
      style={{ paddingLeft: 12 + toolbarLeftPadding }}
    >
      {/* Preview / Code segmented */}
      <div className="flex items-center bg-[#f5f5f5] rounded-[8px] p-[2px] h-8">
        <button onClick={() => setDemoView('preview')}
          className={`flex items-center gap-1.5 px-[10px] h-[28px] rounded-[6px] text-[12px] font-medium transition-colors ${demoView === 'preview' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#191919]' : 'text-[#888]'}`}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          预览
        </button>
        <button onClick={() => setDemoView('code')}
          className={`flex items-center gap-1.5 px-[10px] h-[28px] rounded-[6px] text-[12px] font-medium transition-colors ${demoView === 'code' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#191919]' : 'text-[#888]'}`}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          代码
        </button>
      </div>
      {/* Device + fullscreen — only in preview mode */}
      {demoView === 'preview' && (
        <div className="flex items-center bg-[#f5f5f5] rounded-[8px] p-[2px] h-8">
          {/* Web */}
          <button onClick={() => setDevice('web')} title="Web"
            className={`flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-colors ${device === 'web' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#191919]' : 'text-[#888]'}`}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="8" r="1" fill="currentColor"/></svg>
          </button>
          {/* App */}
          <button onClick={() => setDevice('app')} title="App"
            className={`flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-colors ${device === 'app' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#191919]' : 'text-[#888]'}`}>
            <svg width="11" height="13" viewBox="0 0 12 16" fill="none"><rect x="1" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="13" r="0.75" fill="currentColor"/></svg>
          </button>
          {/* Custom */}
          <button onClick={() => setDevice('custom')} title="自定义尺寸"
            className={`flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-colors ${device === 'custom' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#191919]' : 'text-[#888]'}`}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          {/* Divider */}
          <div className="w-px h-4 bg-[rgba(25,25,25,0.12)] mx-0.5" />
          {/* Fullscreen */}
          <button onClick={() => setIsFullscreen(v => !v)} title={isFullscreen ? '退出全屏' : '全屏'}
            className={`flex items-center justify-center w-[28px] h-[28px] rounded-[6px] transition-colors ${isFullscreen ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#191919]' : 'text-[#888] hover:bg-white/60'}`}>
            {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
          </button>
        </div>
      )}
      <div className="flex-1" />
      {/* 复制为设计稿 */}
      <button
        onClick={() => {
          if (generatedHtml && onCopyAsDesign) {
            if (!isCopyingDesign) {
              setIsCopyingDesign(true);
              onCopyAsDesign().finally(() => setIsCopyingDesign(false));
            }
          } else {
            if (!isCopyingImage) void handleCopyPreviewImage();
          }
        }}
        disabled={isCopyingImage || isCopyingDesign}
        className="flex items-center gap-1 h-8 px-2 rounded-[6px] text-[12px] text-[#555] hover:text-[#191919] hover:bg-[#f5f5f5] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        {(isCopyingImage || isCopyingDesign) ? '生成中...' : '复制为设计稿'}
      </button>
    </div>
  );

  // Determine display content based on whether we have AI-generated HTML
  const hasAiHtml = Boolean(generatedHtml);
  const displayCode = hasAiHtml ? generatedHtml! : DEMO_CODE;
  const codeFileName = hasAiHtml ? 'ai-generated-demo.html' : 'ComputeGraphViewer.tsx';

  // iframe for AI-generated HTML
  const iframeContent = (
    <iframe
      srcDoc={generatedHtml ?? ''}
      sandbox="allow-scripts allow-same-origin allow-forms"
      className="w-full h-full border-0"
      title="AI Generated Demo"
    />
  );

  // Compute Graph viewer — used when no AI HTML is available
  const graphFrame = (
    <div ref={webPreviewRef} className="w-full h-full overflow-hidden">
      {hasAiHtml ? iframeContent : <ComputeGraphViewer />}
    </div>
  );

  // Custom resizable frame
  const customFrame = (
    <div ref={customPreviewRef} className="relative select-none" style={{ width: customSize.w, height: customSize.h }}>
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="h-7 bg-[#f5f5f5] flex items-center gap-1.5 px-3 border-b border-[rgba(0,0,0,0.08)] shrink-0">
          <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"/><div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"/><div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"/></div>
          <span className="text-[10px] text-[#aaa] ml-1 font-mono">{customSize.w} × {customSize.h}</span>
        </div>
        <div className="flex-1 overflow-hidden" style={{ scrollbarWidth: 'none' as const }}>
          <style>{`.demo-scroll-c::-webkit-scrollbar{display:none}`}</style>
          <div className="demo-scroll-c w-full h-full">
            {hasAiHtml ? iframeContent : <ComputeGraphViewer />}
          </div>
        </div>
      </div>
      <div onMouseDown={startResize} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-end justify-end pr-1 pb-1 z-10" title="拖拽调整尺寸">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7L7 1M4 7L7 4" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
    </div>
  );

  const previewContent = device === 'custom' ? customFrame : graphFrame;

  const mainContent = (
    <div className="relative h-full flex flex-col">
      {toolbar}
      <AnimatePresence mode="wait">
        {demoView === 'preview' ? (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="flex-1 relative overflow-hidden bg-transparent flex flex-col"
          >
            {/* Canvas content */}
            <div className={`flex-1 flex ${device === 'app' && !hasAiHtml ? 'items-center justify-center pb-5' : ''} overflow-hidden`}>
              {previewContent}
            </div>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col bg-white relative"
          >
            <div className="px-4 py-2 border-b border-[rgba(25,25,25,0.07)] flex items-center justify-between shrink-0 bg-white">
              <span className="text-[10px] text-[#aaa] font-mono">{codeFileName}</span>
              <button onClick={() => navigator.clipboard.writeText(displayCode).catch(()=>{})}
                className="flex items-center gap-1 text-[10px] text-[#999] hover:text-[#333] transition-colors px-2 py-1 rounded-md hover:bg-[#f5f5f5]">
                <Copy size={10} /> 复制
              </button>
            </div>
            <div className="flex-1 overflow-auto flex bg-white">
              <div className="bg-[#fafafa] border-r border-[rgba(25,25,25,0.06)] px-3 pt-4 select-none shrink-0 w-10">
                {displayCode.split('\n').map((_,i) => (
                  <div key={i} className="text-[10px] text-[#ccc] font-mono leading-[1.6] text-right">{i+1}</div>
                ))}
              </div>
              <textarea className="flex-1 p-4 text-[12px] leading-[1.6] resize-none outline-none font-mono bg-white text-[#333] overflow-auto"
                value={displayCode} readOnly spellCheck={false} style={{ tabSize: 2 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[540] bg-white flex flex-col">
        {mainContent}
      </div>
    );
  }

  return mainContent;
}

// ─── CreativeCanvas ───────────────────────────────────────────────────────────
type CreativeImageAction = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const CREATIVE_META_TAGS = ['图片5.0 Lite', '智能比例', '2K'];

const CREATIVE_DEFAULT_PROMPT = '软件工程师查看代码、专注专业、蓝灰色调、科技简洁风';

const CREATIVE_RESULT_IMAGES = [codingCase, canvasCase2];

const CREATIVE_BOTTOM_ACTIONS: CreativeImageAction[] = [
  { id: 'ultra-hd', label: '超高清', Icon: Sparkles },
  { id: 'high-def', label: '高清', Icon: Image },
  { id: 'local-redraw', label: '局部重绘', Icon: Wand2 },
  { id: 'expand-image', label: '扩图', Icon: Maximize2 },
  { id: 'gen-video', label: '生成视频', Icon: Play },
  { id: 'remove-brush', label: '消除笔', Icon: Minus },
];

const CREATIVE_BOTTOM_MORE_ACTIONS = ['细节修复', '对口型'];

function CreativeCanvas({ promptText, onToast }: { promptText: string; onToast?: (msg: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [favoriteIndexes, setFavoriteIndexes] = useState<number[]>([]);

  const images = CREATIVE_RESULT_IMAGES;
  const currentImage = images[currentIndex];
  const isFavorited = favoriteIndexes.includes(currentIndex);
  const imageUrl = typeof window === 'undefined'
    ? currentImage
    : new URL(currentImage, window.location.href).href;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAction = (action: string) => {
    onToast?.(`${action} 功能已触发`);
  };

  const handleToggleFavorite = () => {
    setFavoriteIndexes(prev => (
      prev.includes(currentIndex)
        ? prev.filter(idx => idx !== currentIndex)
        : [...prev, currentIndex]
    ));
    onToast?.(isFavorited ? '已取消收藏' : '已收藏');
  };

  const handleShareImage = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `创意效果图 ${currentIndex + 1}`,
          text: '来自 Octo Canvas',
          url: imageUrl,
        });
        onToast?.('已打开系统分享');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(imageUrl);
        onToast?.('图片链接已复制');
        return;
      }
      onToast?.('当前浏览器不支持分享');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onToast?.('分享失败，请重试');
    }
  };

  const handleDownloadImage = () => {
    try {
      const extMatch = imageUrl.match(/\.(png|jpe?g|webp|avif)(?:\?|#|$)/i);
      const extRaw = (extMatch?.[1] ?? 'png').toLowerCase();
      const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `octo-canvas-${currentIndex + 1}.${ext}`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast?.('已开始下载');
    } catch {
      onToast?.('下载失败，请重试');
    }
  };

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onToast?.('视频生成完成');
    }, 2000);
  };

  return (
    <div className="w-full h-full bg-[#fafafa] flex flex-col">
      {/* 主体内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧图片展示区 */}
        <div className="flex-1 flex flex-col p-6">
          {/* 分页指示器（已移动到图片上方） */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={handlePrev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e5e7eb] transition-colors"
            >
              <ChevronRight size={16} className="text-[#9ca3af] rotate-180" />
            </button>
            <span className="text-[12px] text-[#6b7280]">{currentIndex + 1} / {images.length}</span>
            <button
              onClick={handleNext}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e5e7eb] transition-colors"
            >
              <ChevronRight size={16} className="text-[#9ca3af]" />
            </button>
          </div>

          <div className="flex-1 bg-transparent rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden relative flex items-center justify-center">
            {/* 图片 */}
            <img
              src={currentImage}
              alt={`创意图-${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* 左右切换箭头 */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <ChevronRight size={20} className="text-[#374151] rotate-180" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <ChevronRight size={20} className="text-[#374151]" />
            </button>
          </div>

          {/* 图片操作栏 */}
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-[rgba(0,0,0,0.08)] shadow-[0_6px_14px_rgba(0,0,0,0.08)]">
              <button
                onClick={handleToggleFavorite}
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-colors ${isFavorited ? 'text-[#ef4444] bg-[#fff1f2]' : 'text-[#1f2937] hover:bg-[#f3f4f6]'}`}
                title={isFavorited ? '取消收藏' : '收藏'}
              >
                <Heart size={16} className={isFavorited ? 'fill-current' : ''} />
              </button>
              <button
                onClick={() => { void handleShareImage(); }}
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[#1f2937] hover:bg-[#f3f4f6] transition-colors"
                title="分享"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={handleDownloadImage}
                className="w-[56px] h-[26px] rounded-full bg-[#155dfc] hover:bg-[#0f4bd8] text-white text-[12px] font-medium transition-colors flex items-center justify-center"
                title="下载"
              >
                <span style={{ fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif' }}>
                  下载
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 右侧编辑面板 */}
        <div className="w-[360px] bg-white border-l border-[#e5e7eb] overflow-y-auto">
          {/* 图片提示词 */}
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="text-[12px] text-[#9ca3af] mb-2">图片提示词</div>
            <div className="text-[12px] text-[#374151] leading-relaxed">
              {promptText || CREATIVE_DEFAULT_PROMPT}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[12px] text-[#9ca3af]">
              <span>图片5.0精简版</span>
              <span>·</span>
              <span>智能比例</span>
              <span>·</span>
              <span>2K</span>
              <button className="text-[#155dfc] hover:underline ml-auto">详细信息 &gt;</button>
            </div>
          </div>

          {/* 生成区域 */}
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="text-[12px] text-[#9ca3af] mb-3">生成</div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#f5f5f7] hover:bg-[#e5e7eb] rounded-xl text-[12px] text-[#374151] transition-colors disabled:opacity-60"
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} className="fill-current" />
                )}
                {isGenerating ? '生成中...' : '生成视频'}
              </button>
              <button
                onClick={() => handleAction('去开源编辑')}
                className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#f5f5f7] hover:bg-[#e5e7eb] rounded-xl text-[12px] text-[#374151] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                去开源编辑
              </button>
            </div>
          </div>

          {/* 编辑区域 */}
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="text-[12px] text-[#9ca3af] mb-3">编辑</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '智能超清', badge: '新的' },
                { label: '超清', badge: null },
                { label: '细节修复', badge: null },
                { label: '局部重绘', badge: null },
                { label: '扩图', badge: null },
                { label: '删除笔', badge: null },
                { label: '对口型', badge: null },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleAction(item.label)}
                  className="relative h-10 flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e5e7eb] rounded-xl text-[12px] text-[#374151] transition-colors"
                >
                  {item.label}
                  {item.badge && (
                    <span className="absolute top-1 right-2 text-[10px] text-[#155dfc] font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 更多区域 */}
          <div className="p-4">
            <div className="text-[12px] text-[#9ca3af] mb-3">更多</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction('重新编辑')}
                className="flex items-center justify-center gap-2 h-10 bg-[#f5f5f7] hover:bg-[#e5e7eb] rounded-xl text-[12px] text-[#374151] transition-colors"
              >
                <RotateCcw size={14} />
                重新编辑
              </button>
              <button
                onClick={() => handleAction('再次生成')}
                className="flex items-center justify-center gap-2 h-10 bg-[#f5f5f7] hover:bg-[#e5e7eb] rounded-xl text-[12px] text-[#374151] transition-colors"
              >
                <RefreshCw size={14} />
                再次生成
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
function CanvasSkeleton({ workflow }: { workflow: WorkflowType }) {
  const labels: Record<WorkflowType, string> = {
    'ui-design': '正在生成 UI 设计稿…',
    'demo': '正在生成可交互 Demo…',
    'creative': '正在生成创意效果图…',
    'research': '正在生成竞品分析报告…',
    'interview': '正在生成用研报告…',
  };
  return (
    <div className="absolute inset-0 z-10">
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#155dfc] to-[#7c3aed] flex items-center justify-center">
            <Loader2 size={20} className="text-white animate-spin" />
          </div>
          <p className="text-sm font-medium text-[#374151]">{labels[workflow]}</p>
          <p className="text-xs text-[#9ca3af]">Agent 正在处理，请稍候</p>
        </div>
        <div className="w-full max-w-2xl flex flex-col gap-3 px-8">
          {[100, 80, 60, 90, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-[#e5e7eb] animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CanvasEmptyState ─────────────────────────────────────────────────────────
function CanvasEmptyState({ onQuickStart: _onQuickStart }: { onQuickStart: (prompt: string, wf: WorkflowType) => void }) {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center pointer-events-none">
        <div className="relative w-24 h-24 rotate-45">
          <style>{`
            @keyframes octo-diamond {
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
                background: `rgba(20, 118, 255, ${0.55 - i * 0.05})`,
                animation: 'octo-diamond 10s ease-in-out infinite both',
                animationDelay: `${-1.4285714286 * i}s`,
              }}
            />
          ))}
        </div>
        <div>
          <p className="text-lg font-semibold text-[#333] mb-1.5">试试 Octo AI 新能力</p>
          <p className="text-xs text-[#888]">通过左侧对话框描述你的想法，AI 将为你快速构建效果</p>
        </div>
      </div>
    </div>
  );
}

// ─── CodePanel ────────────────────────────────────────────────────────────────
function CodePanel({ workflow }: { workflow: WorkflowType }) {
  return (
    <motion.div
      key={`code-${workflow}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center"
    >
      <div className="bg-[#1e1e2e] rounded-2xl shadow-[0_16px_56px_rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col" style={{ width: 720, maxHeight: 'calc(100vh - 200px)' }}>
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between shrink-0 bg-[#181825]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[10px] text-[#6c7086] font-mono">octo-build.{workflow}.ts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#45475a] bg-[#313244] px-2 py-0.5 rounded-md font-mono">TS</span>
            <button
              onClick={() => navigator.clipboard.writeText(CODE_SNIPPETS[workflow]).catch(() => {})}
              className="flex items-center gap-1 text-[10px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors px-2 py-1 rounded-md hover:bg-[#313244]"
            >
              <Copy size={10} /> 复制
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex">
          <div className="bg-[#181825] border-r border-[rgba(255,255,255,0.05)] px-3 pt-5 select-none overflow-hidden shrink-0 w-10">
            {CODE_SNIPPETS[workflow].split('\n').map((_, i) => (
              <div key={i} className="text-[10px] text-[#45475a] font-mono leading-[1.6] text-right">{i + 1}</div>
            ))}
          </div>
          <textarea
            className="flex-1 p-5 text-[12px] leading-[1.6] resize-none outline-none font-mono bg-transparent text-[#cdd6f4] overflow-auto"
            value={CODE_SNIPPETS[workflow]}
            readOnly
            spellCheck={false}
            style={{ caretColor: '#cba6f7', tabSize: 2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── CompetitiveAnalysisCanvas (research) ─────────────────────────────────────
type ReportSectionId = 'summary' | 'comparison' | 'opportunity' | 'ux';

const REPORT_NAV_ITEMS: Array<{ id: ReportSectionId; label: string }> = [
  { id: 'summary', label: '核心摘要' },
  { id: 'comparison', label: '竞品功能对比' },
  { id: 'opportunity', label: '产品规划机会点' },
  { id: 'ux', label: 'UX 设计建议' },
];

const REPORT_SUMMARY_STATS = [
  { number: '6', label: '覆盖竞品数量' },
  { number: '12', label: '核心功能维度' },
  { number: '3', label: '战略机会领域' },
  { number: '5', label: 'UX改进建议' },
];

const OPERATOR_COMPARISON_ROWS = [
  ['华为云 ModelArts', '高', '高', '高', '高', '高', '中', '9.2'],
  ['阿里云 PAI', '高', '高', '高', '高', '高', '中', '9.0'],
  ['百度 PaddlePaddle', '中', '中', '高', '中', '中', '中', '7.8'],
  ['Apache TVM', '低', '低', '高', '中', '中', '高', '7.2'],
  ['PyTorch JIT', '中', '中', '中', '高', '高', '高', '7.5'],
  ['自建工具（行业平均）', '低', '低', '低', '低', '低', '高', '5.5'],
] as const;

const REPORT_HIGHLIGHTS = [
  '华为云 ModelArts：独有的「算子智能搜索」+ 自动性能调优，内置 2000+ 预置算子库',
  '阿里云 PAI：深度整合 DataWorks，数据 pipeline 一体化体验最优',
  'Apache TVM：跨硬件后端支持最广，ARM / GPU / FPGA 均可覆盖',
  'PyTorch JIT：Python 原生体验最佳，但仅限于 PyTorch 生态',
];

const REPORT_OPPORTUNITIES = [
  {
    priority: '高优先级',
    title: '机会 1：低代码可视化算子编排',
    description: '现有工具普遍依赖 YAML / JSON 配置，学习成本高。可视化拖拽式编排可大幅降低门槛，预计可减少 60% 的上手时间。',
    tags: ['拖拽编排', '模板市场', '参数面板'],
  },
  {
    priority: '高优先级',
    title: '机会 2：智能算子调试与性能诊断',
    description: '调试环节是痛点集中区。提供可视化执行图、梯度追踪、性能火焰图等能力，可显著提升研发效率。',
    tags: ['执行图可视化', '性能分析', '异常告警'],
  },
  {
    priority: '中优先级',
    title: '机会 3：跨平台一键编译与部署',
    description: '当前跨平台编译配置复杂，不同硬件后端需要分别调试。一键编译多后端输出可大幅提升工程效率。',
    tags: ['多后端编译', '版本镜像', '部署流水线'],
  },
  {
    priority: '中优先级',
    title: '机会 4：算子市场与知识沉淀',
    description: '企业级算子复用率低，社区缺乏高质量算子共享平台。构建「算子市场」可形成生态壁垒。',
    tags: ['算子市场', '评分评论', '私有部署'],
  },
];

const REPORT_UX_SUGGESTIONS = [
  { num: '1', title: '渐进式复杂度', desc: '提供「简单模式」与「专业模式」切换，新手使用低代码编排，熟练后可切换到完整配置视图，避免一上来就被大量选项吓退。' },
  { num: '2', title: '上下文感知帮助', desc: '每个算子节点悬停即显示 tooltip 说明，点击 F1 或「?」键唤起智能助手，基于当前选中元素提供精准帮助，而非通用文档。' },
  { num: '3', title: '实时预览与快速验证', desc: '算子配置页面内嵌入实时执行预览，数据流入流出即时可见。配置错误即时标红提示，支持单步执行而非全量运行。' },
  { num: '4', title: '统一视觉语言', desc: '采用「算子类型 → 颜色/图标」映射系统：数据处理类用蓝色、计算类用橙色、IO 类用绿色，让用户在图中一眼辨识算子职责。' },
  { num: '5', title: '键盘优先交互', desc: '为高频操作绑定快捷键（新增节点 Ctrl+N、执行 Ctrl+Enter、撤销 Ctrl+Z），支持命令面板（Ctrl+K）快速触发任意功能。' },
  { num: '6', title: '状态持久化与回溯', desc: '自动保存操作历史，支持任意步骤回溯。对关键操作提供「命名快照」功能，方便团队在不同实验分支间切换对比。' },
];

function getReportBadgeClass(value: string) {
  if (value === '高' || Number(value) >= 8.5) return 'bg-[#c6f6d5] text-[#276749]';
  if (value === '中' || Number(value) >= 7) return 'bg-[#feebc8] text-[#975a16]';
  return 'bg-[#fed7d7] text-[#c53030]';
}

function CompetitiveAnalysisCanvas({ onToast }: { onToast?: (msg: string) => void }) {
  const [activeSection, setActiveSection] = useState<ReportSectionId>('summary');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<ReportSectionId, HTMLElement | null>>({
    summary: null,
    comparison: null,
    opportunity: null,
    ux: null,
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateActiveSection = () => {
      const sections = REPORT_NAV_ITEMS.map(item => {
        const el = sectionRefs.current[item.id];
        if (!el) return null;
        return { id: item.id, top: el.offsetTop - container.scrollTop };
      }).filter(Boolean) as Array<{ id: ReportSectionId; top: number }>;

      let current = sections[0];
      sections.forEach(section => {
        if (section.top <= 160) current = section;
      });
      if (current && current.id !== activeSection) setActiveSection(current.id);
    };

    updateActiveSection();
    container.addEventListener('scroll', updateActiveSection);
    return () => container.removeEventListener('scroll', updateActiveSection);
  }, [activeSection]);

  const scrollToSection = useCallback((sectionId: ReportSectionId) => {
    const container = scrollContainerRef.current;
    const section = sectionRefs.current[sectionId];
    if (!container || !section) return;
    container.scrollTo({ top: section.offsetTop - 24, behavior: 'smooth' });
    setActiveSection(sectionId);
  }, []);

  const handleDownloadReport = useCallback(() => {
    onToast?.('报告下载功能已触发');
  }, [onToast]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#f7fafc]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 h-[44px] px-[11px] pt-[12px]">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onToast?.('编辑报告功能已触发')}
              className="flex items-center gap-1 h-8 px-3 rounded-[6px] text-[12px] text-[#555] hover:text-[#191919] hover:bg-[#f5f5f5] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v3M6.5 7.5L8 9l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              编辑
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1 h-8 px-3 rounded-[6px] text-[12px] text-[#555] hover:text-[#191919] hover:bg-[#f5f5f5] transition-colors"
            >
              <Download size={12} />
              下载报告
            </button>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-6">
          <header className="mb-12 rounded-b-[24px] bg-[linear-gradient(135deg,#1a365d_0%,#2c5282_100%)] text-white px-6 py-[60px]">
            <span className="inline-block mb-4 rounded-[20px] bg-white/20 px-4 py-1.5 text-[14px]">行业分析 · 2026</span>
            <h1 className="text-[42px] leading-[1.15] font-bold tracking-[-0.5px]">算子开发工具竞品分析报告</h1>
            <p className="mt-3 text-[18px] text-white/90">Operator Development Tools — Competitive Analysis</p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[14px] text-white/85">
              <span className="flex items-center gap-2">📅 报告日期：2026-04-09</span>
              <span className="flex items-center gap-2">📊 样本数量：6款主流产品</span>
              <span className="flex items-center gap-2">🔍 分析维度：功能、体验、生态</span>
            </div>
          </header>

          <section
            ref={el => { sectionRefs.current.summary = el; }}
            className="mb-12 scroll-mt-6"
          >
            <h2 className="mb-6 border-l-4 border-l-[#3182ce] pl-4 text-[28px] font-bold text-[#1a365d]">核心摘要</h2>
            <div className="mb-8 grid grid-cols-4 gap-5">
              {REPORT_SUMMARY_STATS.map(stat => (
                <div key={stat.label} className="rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-7 text-center transition-colors hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)]">
                  <div className="mb-2 bg-[linear-gradient(135deg,#3182ce,#ed8936)] bg-clip-text text-[36px] font-bold text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-[14px] text-[#718096]">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center gap-3 text-[18px] font-semibold text-[#1a365d]">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#3182ce,#ed8936)] text-white">💡</span>
                关键发现
              </div>
              <p className="text-[14px] leading-[1.9] text-[#2d3748]">
                当前行业算子开发工具呈现
                <strong>两极分化</strong>
                格局：头部厂商（华为云、阿里云）已建立完整的云端算子开发闭环，但学习曲线陡峭；开源社区（TVM、Relay）灵活性强但工程化程度不足；中小企业工具链分散，缺乏一站式解决方案。本报告识别出
                <strong>3个高价值战略机会点</strong>
                ，主要集中在低代码化、跨平台编译、智能调试三个方向。
              </p>
            </div>
          </section>

          <section
            ref={el => { sectionRefs.current.comparison = el; }}
            className="mb-12 scroll-mt-6"
          >
            <h2 className="mb-6 border-l-4 border-l-[#3182ce] pl-4 text-[28px] font-bold text-[#1a365d]">竞品功能对比</h2>
            <div className="mb-5 overflow-x-auto rounded-[16px] border border-[#e2e8f0] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr>
                    {['产品', '低代码开发', '可视化调试', '跨平台编译', '版本管理', '生态插件', '学习成本', '综合评分'].map((cell, index, arr) => (
                      <th
                        key={cell}
                        className={`bg-[#1a365d] px-3 py-4 text-left font-semibold text-white ${index === 0 ? 'rounded-tl-[12px]' : ''} ${index === arr.length - 1 ? 'rounded-tr-[12px]' : ''}`}
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OPERATOR_COMPARISON_ROWS.map((row, index) => (
                    <tr key={row[0]} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                      <td className="border-b border-b-[#e2e8f0] px-3 py-3.5 align-top font-semibold text-[#2d3748]">{row[0]}</td>
                      {row.slice(1).map((value, cellIndex) => (
                        <td key={`${row[0]}-${cellIndex}`} className="border-b border-b-[#e2e8f0] px-3 py-3.5 align-top">
                          <span className={`inline-block rounded-[6px] px-2.5 py-1 text-[12px] font-semibold ${getReportBadgeClass(value)}`}>
                            {value}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center gap-3 text-[18px] font-semibold text-[#1a365d]">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#3182ce,#ed8936)] text-white">📌</span>
                差异化亮点
              </div>
              <ul className="list-disc space-y-2 pl-5 text-[14px] text-[#718096]">
                {REPORT_HIGHLIGHTS.map(item => (
                  <li key={item}>
                    <strong className="text-[#2d3748]">{item.split('：')[0]}</strong>
                    ：{item.split('：').slice(1).join('：')}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section
            ref={el => { sectionRefs.current.opportunity = el; }}
            className="mb-12 scroll-mt-6"
          >
            <h2 className="mb-6 border-l-4 border-l-[#3182ce] pl-4 text-[28px] font-bold text-[#1a365d]">产品规划机会点</h2>
            <div className="grid grid-cols-2 gap-5">
              {REPORT_OPPORTUNITIES.map(item => (
                <div key={item.title} className="relative overflow-hidden rounded-[16px] border border-[#e2e8f0] border-l-4 border-l-[#ed8936] bg-white p-6">
                  <div className="pointer-events-none absolute right-0 top-0 h-[120px] w-[120px] rounded-bl-[120px] bg-[linear-gradient(135deg,rgba(237,137,54,0.1),transparent)]" />
                  <span className="absolute right-4 top-4 rounded-[4px] bg-[rgba(237,137,54,0.1)] px-2.5 py-1 text-[10px] font-semibold text-[#ed8936]">
                    {item.priority === '高优先级' ? '⭐ 高优先级' : '◎ 中优先级'}
                  </span>
                  <h3 className="mb-2 text-[16px] font-semibold text-[#1a365d]">{item.title}</h3>
                  <p className="mb-3 text-[14px] leading-[1.8] text-[#718096]">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="rounded-[4px] bg-[#edf2f7] px-2.5 py-1 text-[12px] text-[#2d3748]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            ref={el => { sectionRefs.current.ux = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-6 border-l-4 border-l-[#3182ce] pl-4 text-[28px] font-bold text-[#1a365d]">UX 设计建议</h2>
            <div className="grid grid-cols-3 gap-5">
              {REPORT_UX_SUGGESTIONS.map(item => (
                <div key={item.num} className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3182ce,#1a365d)] text-[20px] font-bold text-white">
                    {item.num}
                  </div>
                  <h3 className="mb-2 text-[16px] font-semibold text-[#1a365d]">{item.title}</h3>
                  <p className="text-[12px] leading-[1.75] text-[#718096]">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-12 border-t border-t-[#e2e8f0] px-6 py-10 text-center text-[12px] text-[#718096]">
            <p>本报告基于公开资料与行业调研整理 · 2026年4月</p>
            <p className="mt-2 opacity-70">数据来源：各厂商官网、GitHub、行业协会报告</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ─── InterviewCanvas (interview) ──────────────────────────────────────────────
type ResearchTab = 'questions' | 'persona1' | 'persona2' | 'persona3' | 'report';

const PERSONAS = [
  {
    id: 'persona1' as ResearchTab,
    name: '小李',
    age: 24,
    occupation: '互联网运营',
    avatar: '🧑',
    tags: ['入门跑者', '目标驱动', '打卡控'],
    color: '#f0f9ff',
    borderColor: '#bae6fd',
    accentColor: '#0891b2',
    profile: '刚开始跑步 3 个月，每周 2-3 次，每次 3-5 公里。主要靠 App 训练计划打卡激励自己坚持，对配速和距离数据关注不深，更在意"今天完成了没有"的满足感。',
    conversations: [
      { q: '你为什么开始跑步？', a: '主要是想减肥吧，朋友推荐我用这个 App，说有训练计划比较容易坚持。' },
      { q: '你平时怎么用训练计划功能？', a: '每天打开 App 看今天该跑多少，完成了就打卡，有时候会超额完成一点点，感觉挺爽的。' },
      { q: '有没有遇到过让你感觉很困难的时候？', a: '有，连续下雨那几天，计划一直跳，后来我不知道该从哪里继续，就放弃了一周。' },
      { q: '你对现在的训练计划功能满意吗？', a: '还好，但感觉计划不太灵活，我有时候只有 20 分钟，但计划要求跑 40 分钟，没办法调整。' },
      { q: '你希望 App 能帮你做什么？', a: '能不能根据我今天的时间自动调整计划？比如我今天只有半小时，它帮我安排一个短的但有效的训练。' },
    ],
  },
  {
    id: 'persona2' as ResearchTab,
    name: '阿杰',
    age: 29,
    occupation: '销售经理',
    avatar: '👨',
    tags: ['社交驱动', '重视排名', '周末跑者'],
    color: '#fdf4ff',
    borderColor: '#e9d5ff',
    accentColor: '#7c3aed',
    profile: '跑龄 2 年，配速约 5\'30"，喜欢和朋友比较步数和配速排名。认为社交 PK 功能是坚持跑步最大的动力，但对系统推送的训练计划内容缺乏信任。',
    conversations: [
      { q: '你跑步最大的动力是什么？', a: '就是看排行榜！我们公司有个跑步群，每周都会 PK，被超过了就很不爽，会多跑。' },
      { q: '你会用 App 的训练计划功能吗？', a: '偶尔看看，但不太按它的来。感觉它不了解我，给的计划跟我实际情况差很远。' },
      { q: '你觉得训练计划最大的问题是什么？', a: '没有针对性，感觉大家用的都是一套计划，凭什么它知道适合我？' },
      { q: '如果计划可以根据你的历史数据定制，你会用吗？', a: '会的，如果真的是基于我的数据来的，我觉得可信度会高很多，也更愿意按它来跑。' },
      { q: '你对社交功能还有什么期待？', a: '希望能有小组挑战，比如我们公司 10 个人组队，看哪组月总里程多，这种更有意思。' },
    ],
  },
  {
    id: 'persona3' as ResearchTab,
    name: '老王',
    age: 38,
    occupation: '工程师',
    avatar: '🧔',
    tags: ['专业跑者', '数据控', '马拉松'],
    color: '#fff7ed',
    borderColor: '#fed7aa',
    accentColor: '#c2410c',
    profile: '跑龄 6 年，马拉松完赛 4 次，个人 PB 3\'58"。高度关注 VO2Max、心率区间、恢复指数等专业数据，认为现有 App 数据深度不够，更多依赖 Garmin 手表。',
    conversations: [
      { q: '你平时用哪些工具管理训练？', a: '主要是 Garmin，手机 App 只是辅助看看，数据没有 Garmin 深，心率区间分析差太多了。' },
      { q: '你觉得训练计划功能对你有用吗？', a: '对我用处不大，给的计划太基础了，没有周期化训练的概念，什么强度分布都没有。' },
      { q: '你最希望训练计划能提供什么？', a: '至少要有基础期、强化期、减量期的规划，还有每次训练的心率区间目标，这是最基本的。' },
      { q: '数据展示上你觉得哪里最不够用？', a: 'VO2Max 趋势、恢复建议、训练压力分、这些一个都没有，专业跑者根本不会用。' },
      { q: '如果做出改进，你会考虑回来用吗？', a: '如果数据深度能接近 Garmin，价格合适的话会考虑，毕竟国内平台社区氛围好一点。' },
    ],
  },
];

const INTERVIEW_QUESTIONS = [
  { dim: '目标动机', questions: ['你开始跑步的原因是什么？最初的目标是什么？', '你目前的训练计划是自己制定还是使用 App 的推荐？', '你觉得当前的训练计划能帮你达成目标吗？'] },
  { dim: '使用行为', questions: ['你通常在什么时间跑步？每次跑多久？', '跑步时你会看哪些数据？跑完后会回顾吗？', '你最常用 App 的哪些功能？训练计划用得多吗？'] },
  { dim: '痛点分析', questions: ['你在使用训练计划时遇到过什么困难或不满意的地方？', '有没有因为计划安排让你感到挫败或放弃的经历？', '你觉得现在的训练计划最缺少什么？'] },
  { dim: '需求挖掘', questions: ['如果训练计划可以完全按照你的需求定制，你最想要什么功能？', '你对 AI 自动生成训练计划这个想法感兴趣吗？你信任它吗？', '你愿意为更专业的训练计划功能付费吗？大概多少合理？'] },
];

const INSIGHTS = [
  { icon: '🎯', title: '目标匹配度低', desc: '现有计划缺乏对用户实际目标的深度理解，入门用户需要"完成感"，专业用户需要"周期化规划"，两者需求差异显著。' },
  { icon: '⏱️', title: '灵活性不足', desc: '用户时间碎片化，但计划固定，当用户无法完成当日计划时缺乏降级选项，是放弃率的主要原因之一。' },
  { icon: '🤝', title: '社交激励有效', desc: '社交 PK 和排行榜是中轻度用户持续跑步的核心动力，但现有社交功能不够深，缺乏小组/战队玩法。' },
  { icon: '📊', title: '数据深度分层', desc: '专业用户对 VO2Max、心率区间、恢复指数等专业数据有强需求，但目前数据展示停留在基础层面。' },
  { icon: '🤖', title: 'AI 信任需建立', desc: '用户对 AI 生成的训练计划持怀疑态度，认为"不了解我"。需要透明展示数据依据，逐步建立信任。' },
  { icon: '💰', title: '付费意愿有限', desc: '多数用户认为训练计划是基础功能应免费，但若能提供接近专业工具的数据深度，20-30元/月的付费意愿存在。' },
];

const SUGGESTIONS = [
  '引入用户画像问卷：首次使用时收集目标、水平、可用时间，生成个性化计划',
  '动态调整机制：当天时间不足时提供"短版替代计划"，避免直接跳过',
  '心率区间可视化：每次训练标注目标区间，训练后展示实际分布对比',
  '周期化训练模块：为进阶用户提供基础期→强化期→减量期的宏观规划',
  '小组挑战功能：支持好友组队 PK 月里程，提升社交留存',
  'AI 计划透明度：展示"基于你过去 30 天数据"的生成依据，增强可信度',
  'VO2Max 趋势追踪：与行业标准（Garmin/Polar）对标，补齐专业数据缺口',
  '计划完成度激励：完成率 > 80% 时给予成就解锁，正向强化打卡习惯',
];

function InterviewCanvas() {
  const [activeTab, setActiveTab] = useState<ResearchTab>('questions');

  const tabs: { id: ResearchTab; label: string; icon: string }[] = [
    { id: 'questions', label: '访谈问题大纲', icon: '📋' },
    { id: 'persona1',  label: '小李的访谈',   icon: '🧑' },
    { id: 'persona2',  label: '阿杰的访谈',   icon: '👨' },
    { id: 'persona3',  label: '老王的访谈',   icon: '🧔' },
    { id: 'report',    label: '用户洞察报告', icon: '📄' },
  ];

  const persona = PERSONAS.find(p => p.id === activeTab);

  return (
    <div className="absolute inset-0 flex bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div className="w-[188px] shrink-0 flex flex-col border-r border-[rgba(0,0,0,0.08)] bg-[#fafafa]">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] font-semibold text-[#0891b2] uppercase tracking-widest mb-0.5">用户访谈模拟</p>
          <p className="text-[12px] text-[#666] leading-snug">跑步训练计划研究</p>
        </div>
        <div className="px-2 flex flex-col gap-0.5 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#e0f2fe] text-[#0369a1] font-medium'
                  : 'text-[#555] hover:bg-[#f0f0f0]'
              }`}
            >
              <span className="text-[12px]">{tab.icon}</span>
              <span className="text-[12px] leading-snug">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-[rgba(0,0,0,0.06)]">
          <div className="text-[10px] text-[#aaa]">3 位用户 · 12 个问题</div>
          <div className="text-[10px] text-[#aaa]">访谈总时长 约 90 分钟</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-6"
          >
            {/* Questions tab */}
            {activeTab === 'questions' && (
              <div>
                <h2 className="text-[16px] font-bold text-[#191919] mb-1">访谈问题大纲</h2>
                <p className="text-[12px] text-[#888] mb-5">4 个维度 · 12 道题目 · 覆盖目标 / 行为 / 痛点 / 需求</p>
                <div className="flex flex-col gap-4">
                  {INTERVIEW_QUESTIONS.map((dim, di) => (
                    <div key={di} className="rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[rgba(0,0,0,0.06)]">
                        <span className="text-[12px] font-semibold text-[#374151]">{di + 1}. {dim.dim}</span>
                      </div>
                      <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                        {dim.questions.map((q, qi) => (
                          <div key={qi} className="px-4 py-3 flex gap-3">
                            <span className="text-[10px] text-[#aaa] shrink-0 mt-0.5">Q{di * 3 + qi + 1}</span>
                            <p className="text-[12px] text-[#374151] leading-snug">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persona interview tabs */}
            {persona && (
              <div>
                {/* Persona header */}
                <div className="flex items-start gap-4 mb-6 p-4 rounded-xl border" style={{ backgroundColor: persona.color, borderColor: persona.borderColor }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
                    {persona.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[16px] font-bold text-[#191919]">{persona.name}</span>
                      <span className="text-[12px] text-[#666]">{persona.age} 岁 · {persona.occupation}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {persona.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: persona.accentColor }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#555] leading-relaxed">{persona.profile}</p>
                  </div>
                </div>

                {/* Conversation */}
                <h3 className="text-[12px] font-semibold text-[#374151] mb-3">访谈对话记录</h3>
                <div className="flex flex-col gap-4">
                  {persona.conversations.map((conv, ci) => (
                    <div key={ci} className="flex flex-col gap-2">
                      {/* Interviewer */}
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[#e0f2fe] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#0369a1] mt-0.5">访</div>
                        <div className="flex-1 bg-[#f8fafc] rounded-xl px-3.5 py-2.5">
                          <p className="text-[12px] text-[#374151] leading-relaxed">{conv.q}</p>
                        </div>
                      </div>
                      {/* Respondent */}
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[12px] mt-0.5" style={{ backgroundColor: persona.color }}>
                          {persona.avatar}
                        </div>
                        <div className="flex-1 rounded-xl px-3.5 py-2.5 border" style={{ backgroundColor: persona.color, borderColor: persona.borderColor }}>
                          <p className="text-[12px] text-[#374151] leading-relaxed">{conv.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report tab */}
            {activeTab === 'report' && (
              <div>
                <h2 className="text-[16px] font-bold text-[#191919] mb-1">用户洞察报告</h2>
                <p className="text-[12px] text-[#888] mb-6">基于 3 位用户深度访谈 · 跑步训练计划模块</p>

                {/* User profiles */}
                <h3 className="text-[12px] font-semibold text-[#374151] mb-3">用户画像摘要</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PERSONAS.map(p => (
                    <div key={p.id} className="rounded-xl p-3 border" style={{ backgroundColor: p.color, borderColor: p.borderColor }}>
                      <div className="text-xl mb-1">{p.avatar}</div>
                      <div className="text-[12px] font-semibold text-[#191919] mb-0.5">{p.name} · {p.age}岁</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.65)', color: p.accentColor }}>{t}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#555] leading-relaxed line-clamp-3">{p.profile}</p>
                    </div>
                  ))}
                </div>

                {/* Key insights */}
                <h3 className="text-[12px] font-semibold text-[#374151] mb-3">核心洞察</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {INSIGHTS.map((ins, i) => (
                    <div key={i} className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[16px]">{ins.icon}</span>
                        <span className="text-[12px] font-semibold text-[#191919]">{ins.title}</span>
                      </div>
                      <p className="text-[10px] text-[#666] leading-relaxed">{ins.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Design suggestions */}
                <h3 className="text-[12px] font-semibold text-[#374151] mb-3">设计建议</h3>
                <div className="flex flex-col gap-2 mb-6">
                  {SUGGESTIONS.map((s, i) => (
                    <div key={i} className="flex gap-3 items-start px-3.5 py-2.5 rounded-lg bg-[#f8fafc] border border-[rgba(0,0,0,0.06)]">
                      <span className="w-5 h-5 rounded-full bg-[#0891b2] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-[12px] text-[#374151] leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-4">
                  <p className="text-[12px] font-semibold text-[#c2410c] mb-2">研究局限与后续建议</p>
                  <ul className="text-[10px] text-[#7c3410] leading-relaxed space-y-1 list-disc list-inside">
                    <li>样本量为 3 人，建议后续扩大至 15-20 人进行量化验证</li>
                    <li>访谈为模拟场景，需补充真实用户深度访谈数据</li>
                    <li>建议结合行为埋点数据，验证"灵活性"和"社交激励"的量化影响</li>
                    <li>后续可设计 A/B 测试，验证 AI 计划透明度对信任度的提升效果</li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── PreviewStage ─────────────────────────────────────────────────────────────
function PreviewStage({
  workflow,
  onToast,
  toolbarLeftPadding,
  generatedHtml,
  onCopyAsDesign,
}: {
  workflow: WorkflowType;
  onToast?: (message: string) => void;
  toolbarLeftPadding?: number;
  generatedHtml?: string | null;
  onCopyAsDesign?: () => Promise<void>;
}) {
  return (
    <motion.div
      key={`preview-${workflow}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0"
    >
      {workflow === 'ui-design' && <UIDesignCanvas />}
      {workflow === 'demo' && (
        <DemoCanvas
          onToast={onToast}
          toolbarLeftPadding={toolbarLeftPadding}
          generatedHtml={generatedHtml}
          onCopyAsDesign={onCopyAsDesign}
        />
      )}
      {workflow === 'creative' && <CreativeCanvas promptText={CREATIVE_DEFAULT_PROMPT} onToast={onToast} />}
      {workflow === 'research' && <CompetitiveAnalysisCanvas onToast={onToast} />}
      {workflow === 'interview' && <InterviewCanvas />}
    </motion.div>
  );
}

// ─── DemoPublishModal ─────────────────────────────────────────────────────────
function DemoPublishModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] p-6 w-[400px] mx-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0">
            <Monitor size={20} className="text-[#1476ff]" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-[#191919]">Demo 已发布</p>
            <p className="text-[12px] text-[#999]">任何人均可通过链接访问</p>
          </div>
          <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#bbb] hover:text-[#666] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* URL bar */}
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-3 py-2.5 mb-4">
          <span className="flex-1 text-[12px] text-[#555] truncate font-mono">{url}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] text-[10px] text-[#333] hover:bg-[#f9f9f9] transition-colors shrink-0"
          >
            {copied ? <Check size={10} className="text-[#22c55e]" /> : <Copy size={10} />}
            {copied ? '已复制' : '复制链接'}
          </button>
        </div>

        {/* Open link */}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-[#1476ff] text-[12px] text-white font-medium hover:bg-[#1060d0] transition-colors"
        >
          <ExternalLink size={12} />
          在新标签页打开
        </a>
      </motion.div>
    </div>
  );
}

// ─── DeliveryTabBar ───────────────────────────────────────────────────────────
function DeliveryTabBar({
  deliverables,
  activeWorkflow,
  readyWorkflows,
  onSelect,
  onClose,
  onFirstTabOffsetChange,
}: {
  deliverables: WorkflowType[];
  activeWorkflow: WorkflowType | null;
  readyWorkflows: WorkflowType[];
  onSelect: (wf: WorkflowType) => void;
  onClose: (wf: WorkflowType) => void;
  onFirstTabOffsetChange?: (offset: number) => void;
}) {
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstTabRef = useRef<HTMLDivElement | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onFirstTabOffsetChange) return;

    const updateOffset = () => {
      if (!containerRef.current || !firstTabRef.current) return;
      const offset = firstTabRef.current.getBoundingClientRect().left - containerRef.current.getBoundingClientRect().left;
      onFirstTabOffsetChange(offset);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [deliverables.length, onFirstTabOffsetChange, readyWorkflows.length]);

  const handleShare = useCallback(() => {
    const id = `make-${Date.now()}`;
    localStorage.setItem(`octo-make-${id}`, JSON.stringify({ id, publishedAt: Date.now() }));
    const url = `${window.location.origin}${window.location.pathname}#/make/${id}`;
    setPublishedUrl(url);
  }, []);

  useEffect(() => {
    const onShareRequest = () => handleShare();
    window.addEventListener('octo-share-request', onShareRequest);
    return () => window.removeEventListener('octo-share-request', onShareRequest);
  }, [handleShare]);

  const IconByWorkflow: Record<WorkflowType, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    'ui-design': Layers,
    'demo': Monitor,
    'creative': Image,
    'research': BarChart2,
    'interview': Users,
  };

  const handleTabsWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const scrollEl = tabsScrollRef.current;
    if (!scrollEl) return;
    if (scrollEl.scrollWidth <= scrollEl.clientWidth) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    scrollEl.scrollLeft += event.deltaY;
    event.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1.5 px-3 h-[54px] bg-transparent border-b border-[rgba(0,0,0,0.12)] shrink-0 relative"
    >
      {deliverables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-[#999]">当前暂无任务</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="relative flex-1 min-w-0 h-full">
            <div
              ref={tabsScrollRef}
              onWheel={handleTabsWheel}
              className="flex items-center gap-1 h-full overflow-x-auto overflow-y-hidden pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {deliverables.map(wf => {
                const isActive = activeWorkflow === wf;
                const isReady = readyWorkflows.includes(wf);
                const meta = WORKFLOW_META[wf];
                const Icon = IconByWorkflow[wf];
                return (
                  <div key={wf} ref={deliverables[0] === wf ? firstTabRef : undefined} className="relative flex items-center h-full shrink-0">
                    <div className={`flex items-center gap-1 rounded-[8px] h-[30px] transition-colors ${isActive ? 'bg-[#efefef]' : 'hover:bg-[rgba(0,0,0,0.04)]'}`}>
                      <button
                        onClick={() => onSelect(wf)}
                        className={`flex min-w-0 items-center gap-1.5 pl-2.5 pr-1 py-1.5 text-[12px] font-medium whitespace-nowrap max-w-[300px] max-[1280px]:max-w-[240px] ${isActive ? 'text-[#191919]' : 'text-[#666]'}`}
                      >
                        <Icon size={12} style={{ color: isActive ? '#191919' : '#999' }} />
                        <span className="min-w-0 truncate">{meta.fileLabel}</span>
                        {!isReady && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0 animate-pulse" />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onClose(wf); }}
                        className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/8 text-[#bbb] hover:text-[#666] transition-colors mr-1 shrink-0"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#f5f5f5] to-transparent" />
          </div>
          <AnimatePresence>
            {publishedUrl && (
              <DemoPublishModal url={publishedUrl} onClose={() => setPublishedUrl(null)} />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── ResultWorkspace ──────────────────────────────────────────────────────────
function ResultWorkspace({
  deliverables,
  activeWorkflow,
  readyWorkflows,
  onReset,
  onTabSelect,
  onTabClose,
  onQuickStart,
  onToast,
  generatedHtml,
  onCopyAsDesign,
}: {
  deliverables: WorkflowType[];
  activeWorkflow: WorkflowType | null;
  readyWorkflows: WorkflowType[];
  onReset: () => void;
  onTabSelect: (wf: WorkflowType) => void;
  onTabClose: (wf: WorkflowType) => void;
  onQuickStart: (prompt: string, wf: WorkflowType) => void;
  onToast?: (message: string) => void;
  generatedHtml?: string | null;
  onCopyAsDesign?: () => Promise<void>;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [firstTabOffsetLeft, setFirstTabOffsetLeft] = useState(0);
  const canvasReady = activeWorkflow !== null && readyWorkflows.includes(activeWorkflow);
  const toolbarLeftPadding = fullscreen ? firstTabOffsetLeft : Math.max(firstTabOffsetLeft - 12, 0);

  const canvasKey = activeWorkflow === null ? '__empty__' : !canvasReady ? `__skeleton__${activeWorkflow}` : activeWorkflow;
  const canvasContent = (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={canvasKey}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {activeWorkflow === null ? (
            <CanvasEmptyState onQuickStart={onQuickStart} />
          ) : !canvasReady ? (
            <CanvasSkeleton workflow={activeWorkflow} />
          ) : (
            <PreviewStage
              workflow={activeWorkflow}
              onToast={onToast}
              toolbarLeftPadding={toolbarLeftPadding}
              generatedHtml={generatedHtml}
              onCopyAsDesign={onCopyAsDesign}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[530] flex flex-col bg-black">
        {/* Fullscreen tab bar */}
        <div className="bg-[#111] border-b border-white/8 shrink-0">
          <DeliveryTabBar
            deliverables={deliverables}
            activeWorkflow={activeWorkflow}
            readyWorkflows={readyWorkflows}
            onSelect={onTabSelect}
            onClose={onTabClose}
            onFirstTabOffsetChange={setFirstTabOffsetLeft}
          />
        </div>
        <div className="flex-1 min-h-0">{canvasContent}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent">
      {/* DeliveryTabBar */}
      <DeliveryTabBar
        deliverables={deliverables}
        activeWorkflow={activeWorkflow}
        readyWorkflows={readyWorkflows}
        onSelect={onTabSelect}
        onClose={onTabClose}
        onFirstTabOffsetChange={setFirstTabOffsetLeft}
      />
      {/* Canvas area */}
      <div className="flex-1 min-h-0 p-0 relative" style={{ height: 0 }}>
        <div className="w-full h-full overflow-hidden bg-transparent">
          {canvasContent}
        </div>
      </div>
    </div>
  );
}

// ─── LeftPanelHeader ──────────────────────────────────────────────────────────
function LeftPanelHeader({
  onBack,
  title,
}: {
  onBack?: () => void;
  title?: string;
}) {

  return (
    <div className="px-4 h-[54px] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors text-[#555] shrink-0"
            aria-label="返回文件列表"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <span className="text-[14px] font-semibold text-[#191919] leading-none truncate">{title ?? 'Octo Build 草稿'}</span>
      </div>
    </div>
  );
}

// ─── IntroBubble ──────────────────────────────────────────────────────────────
function IntroBubble() {
  return (
    <div className="w-full">
      <p className="text-[14px] text-[#333] leading-[20px] whitespace-pre-wrap">
        你好！我是 Octo AI。{'\n\n'}请描述你的设计需求，我将会根据你的描述自动执行任务{'\n\n'}· Octo Design：生成可编辑的 UI 设计稿{'\n'}· Octo Make：将设计稿转化为可交互演示{'\n'}· Octo Canvas：根据描述生成创意效果图{'\n'}· Octo Insight：模拟用户访谈，生成用研报告{'\n'}· Octo Review：进行分析与体验评审{'\n\n'}每种类型对应右侧一个文件 Tab，支持多轮迭代。
      </p>
    </div>
  );
}

// ─── ChatComposer ─────────────────────────────────────────────────────────────
const AGENT_OPTIONS: { id: ComposerAgent; label: string; icon: React.ReactNode }[] = [
  { id: 'auto',       label: '通用问答',     icon: <Sparkles size={12} /> },
  { id: 'research',   label: 'Octo Insight', icon: <Users size={12} /> },
  { id: 'ui-design',  label: 'Octo Design',  icon: <Layers size={12} /> },
  { id: 'demo',       label: 'Octo Make',    icon: <Play size={12} /> },
  { id: 'creative',   label: 'Octo Canvas',  icon: <Wand2 size={12} /> },
  { id: 'review',     label: 'Octo Review',  icon: <BarChart2 size={12} /> },
];

const WORKFLOW_TO_AGENT: Record<WorkflowType, ComposerAgent> = {
  'ui-design': 'auto',
  'demo': 'demo',
  'creative': 'creative',
  'research': 'research',
  'interview': 'research',
};

const AGENT_TO_MODE: Record<ComposerAgent, ComposerMode> = {
  'auto': 'auto',
  'research': 'research',
  'ui-design': 'ui-design',
  'demo': 'demo',
  'creative': 'creative',
  'review': 'review',
};

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

type SkillMarketModalCategory = '全部技能' | SkillMarketCategory;

const RESEARCH_OPTIONS = ['深度研究', '访谈观点洞察', '模拟用户访谈'];
const DESIGN_OPTIONS = ['高保真设计', '低保真设计'];

const DEMO_SPEC_OPTIONS = ['H Design_v1.1', 'DevUI_v1.0.0', 'ICT UI_v3.1.0'];

const CREATIVE_MEDIA_OPTIONS = ['图片', '视频'];

const CREATIVE_MODEL_OPTIONS = [
  { id: 'image-5-lite', label: '图片5.0 Lite', description: '指令响应更精准，生成效果更智能', badge: 'New' },
  { id: 'image-4-6', label: '图片4.6', description: '人像一致性保持更好，性价比更高', badge: 'New' },
  { id: 'image-4-5', label: '图片 4.5', description: '强化一致性、风格与图文响应', badge: null },
  { id: 'image-4-1', label: '图片 4.1', description: '更专业的创意、美学和一致性保持', badge: null },
  { id: 'image-4-0', label: '图片 4.0', description: '支持多参考图、系列组图生成', badge: null },
] as const;

const CREATIVE_RATIO_OPTIONS = ['智能', '21:9', '16:9', '3:2', '4:3', '1:1', '3:4', '2:3', '9:16'];

const CREATIVE_QUALITY_OPTIONS = ['高清 2K', '超清 4K'];

interface ComposerAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'design';
  designSource?: 'url' | 'code';
}

interface SendPayloadOptions {
  hasDesignAttachment?: boolean;
}

interface SelectedComposerSkill {
  id: string;
  name: string;
}

function ChatComposer({
  draft,
  setDraft,
  onSend,
  activeWorkflow,
  setMode,
  figmaData,
  onFigmaData,
}: {
  draft: string;
  setDraft: (value: string) => void;
  onSend: (content?: string, options?: SendPayloadOptions) => void;
  activeWorkflow: WorkflowType | null;
  setMode: (mode: ComposerMode) => void;
  figmaData?: FigmaDesignData | null;
  onFigmaData?: (data: FigmaDesignData | null) => void;
}) {
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [agent, setAgent] = useState<ComposerAgent>('auto');
  // 意图识别
  const [intentDismissed, setIntentDismissed] = useState(false);
  const detectedIntent = useMemo(() => {
    if (!draft.trim() || agent !== 'auto') return null;
    const result = detectIntentWithConfidence(draft);
    // 置信度低于 0.3 时不显示（避免噪音），ui-design 作为兜底不主动提示
    if (result.confidence < 0.3 || result.workflow === 'ui-design') return null;
    return result;
  }, [draft, agent]);
  const [showDemoSpecMenu, setShowDemoSpecMenu] = useState(false);
  const [showCreativeMediaMenu, setShowCreativeMediaMenu] = useState(false);
  const [showCreativeOutputMenu, setShowCreativeOutputMenu] = useState(false);
  const [showDesignImportModal, setShowDesignImportModal] = useState(false);
  const [showSkillManagementModal, setShowSkillManagementModal] = useState(false);
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<SkillMarketItem | null>(null);
  const [skillMarketCategory, setSkillMarketCategory] = useState<SkillMarketModalCategory>('全部技能');
  const [designImportMode, setDesignImportMode] = useState<'url' | 'code'>('url');
  const [designImportValue, setDesignImportValue] = useState('');
  const [isFigmaParsing, setIsFigmaParsing] = useState(false);
  const [figmaParseError, setFigmaParseError] = useState<string | null>(null);
  const [researchOption, setResearchOption] = useState(RESEARCH_OPTIONS[0]);
  const [designOption, setDesignOption] = useState(DESIGN_OPTIONS[0]);
  const [showResearchMenu, setShowResearchMenu] = useState(false);
  const [showDesignMenu, setShowDesignMenu] = useState(false);
  const [demoSpec, setDemoSpec] = useState(DEMO_SPEC_OPTIONS[0]);
  const [creativeMediaType, setCreativeMediaType] = useState(CREATIVE_MEDIA_OPTIONS[0]);
  const [creativeRatio, setCreativeRatio] = useState('16:9');
  const [creativeQuality, setCreativeQuality] = useState(CREATIVE_QUALITY_OPTIONS[1]);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedComposerSkill[]>([]);
  const [composerSkills, setComposerSkills] = useState<SkillMarketItem[]>(loadSkillMarketItems);
  const [activeSlashSkillIndex, setActiveSlashSkillIndex] = useState(0);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const insertMenuLayerRef = useRef<HTMLDivElement>(null);
  const researchMenuRef = useRef<HTMLDivElement>(null);
  const designMenuRef = useRef<HTMLDivElement>(null);
  const demoSpecMenuRef = useRef<HTMLDivElement>(null);
  const creativeMediaMenuRef = useRef<HTMLDivElement>(null);
  const creativeOutputMenuRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const composerShellRef = useRef<HTMLDivElement>(null);

  const closePresetMenus = useCallback(() => {
    setShowResearchMenu(false);
    setShowDesignMenu(false);
    setShowDemoSpecMenu(false);
    setShowCreativeMediaMenu(false);
    setShowCreativeOutputMenu(false);
  }, []);

  const closeInsertMenu = useCallback(() => {
    setShowInsertMenu(false);
    setShowSkillsMenu(false);
  }, []);

  const closeDesignImportModal = useCallback(() => {
    setShowDesignImportModal(false);
    setDesignImportMode('url');
    setDesignImportValue('');
    setFigmaParseError(null);
  }, []);

  const closeSkillDetailModal = useCallback(() => {
    setSelectedSkillDetail(null);
  }, []);

  const handleFigmaImportConfirm = useCallback(async () => {
    const val = designImportValue.trim();
    if (!val) return;

    // Figma URL import
    if (designImportMode === 'url' && val.includes('figma.com')) {
      setIsFigmaParsing(true);
      setFigmaParseError(null);
      try {
        const data = await parseFigmaUrl(val);
        onFigmaData?.(data);
        setAttachments(prev => [
          ...prev.filter(a => a.type !== 'design'),
          { id: `figma-${Date.now()}`, name: data.name, type: 'design', designSource: 'url' },
        ]);
        closeDesignImportModal();
      } catch (err) {
        setFigmaParseError((err as Error).message || '解析失败，请检查 Figma URL');
      } finally {
        setIsFigmaParsing(false);
      }
      return;
    }

    // Non-Figma URL or code mode — just attach as reference
    setAttachments(prev => [
      ...prev.filter(a => a.type !== 'design'),
      { id: `design-${Date.now()}`, name: val.slice(0, 40), type: 'design', designSource: designImportMode },
    ]);
    closeDesignImportModal();
  }, [designImportValue, designImportMode, onFigmaData, closeDesignImportModal]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!agentMenuRef.current?.contains(event.target as Node)) setShowAgentMenu(false);
      if (
        !insertMenuRef.current?.contains(event.target as Node)
        && !insertMenuLayerRef.current?.contains(event.target as Node)
      ) closeInsertMenu();
      if (!researchMenuRef.current?.contains(event.target as Node)) setShowResearchMenu(false);
      if (!designMenuRef.current?.contains(event.target as Node)) setShowDesignMenu(false);
      if (!demoSpecMenuRef.current?.contains(event.target as Node)) setShowDemoSpecMenu(false);
      if (!creativeMediaMenuRef.current?.contains(event.target as Node)) setShowCreativeMediaMenu(false);
      if (!creativeOutputMenuRef.current?.contains(event.target as Node)) setShowCreativeOutputMenu(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [closeInsertMenu]);

  useEffect(() => {
    const syncSkills = () => setComposerSkills(loadSkillMarketItems());
    window.addEventListener(SKILL_MARKET_UPDATED_EVENT, syncSkills as EventListener);
    window.addEventListener('storage', syncSkills);
    return () => {
      window.removeEventListener(SKILL_MARKET_UPDATED_EVENT, syncSkills as EventListener);
      window.removeEventListener('storage', syncSkills);
    };
  }, []);

  useEffect(() => {
    if (!selectedSkillDetail) return;
    const nextDetail = composerSkills.find((skill) => skill.id === selectedSkillDetail.id) ?? null;
    setSelectedSkillDetail(nextDetail);
  }, [composerSkills, selectedSkillDetail]);

  // Sync agent pill with active workflow tab
  useEffect(() => {
    const syncedAgent = activeWorkflow ? WORKFLOW_TO_AGENT[activeWorkflow] : 'auto';
    if (activeWorkflow) {
      setAgent(syncedAgent);
      setMode(AGENT_TO_MODE[syncedAgent]);
    } else {
      setAgent('auto');
      setMode('auto');
    }
    closePresetMenus();
    closeInsertMenu();
  }, [activeWorkflow, closeInsertMenu, closePresetMenus, setMode]);

  const handleSelectAgent = (nextAgent: ComposerAgent) => {
    setAgent(nextAgent);
    setMode(AGENT_TO_MODE[nextAgent]);
    setShowAgentMenu(false);
    closePresetMenus();
    closeInsertMenu();
  };

  const handleUploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const nextUploads = files.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
    }));
    setAttachments(prev => [...prev, ...nextUploads].slice(0, 8));
    event.target.value = '';
    closeInsertMenu();
  };

  const handleDesignImportConfirm = useCallback(() => {
    const value = designImportValue.trim();
    if (!value) return;

    const nextAttachment: ComposerAttachment = {
      id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: designImportMode === 'url' ? value : `传送码：${value}`,
      type: 'design',
      designSource: designImportMode,
    };

    setAttachments(prev => [...prev, nextAttachment].slice(0, 8));
    closeInsertMenu();
    closeDesignImportModal();
  }, [closeDesignImportModal, closeInsertMenu, designImportMode, designImportValue]);

  const installedSkills = useMemo(
    () => composerSkills.filter(skill => skill.enabled),
    [composerSkills],
  );

  const slashCommandMatch = useMemo(
    () => draft.match(/(?:^|\s)\/([^\s]*)$/),
    [draft],
  );

  const filteredSlashSkills = useMemo(() => {
    if (!slashCommandMatch) return [];
    const query = slashCommandMatch[1].trim().toLowerCase();
    if (!query) return installedSkills;
    return installedSkills.filter(skill => skill.name.toLowerCase().includes(query));
  }, [installedSkills, slashCommandMatch]);

  const activeCategorySkills = useMemo(
    () => skillMarketCategory === '全部技能'
      ? composerSkills
      : composerSkills.filter(skill => skill.category === skillMarketCategory),
    [composerSkills, skillMarketCategory],
  );

  useEffect(() => {
    if (!composerInputRef.current) return;
    composerInputRef.current.style.height = '0px';
    composerInputRef.current.style.height = `${Math.min(composerInputRef.current.scrollHeight, 160)}px`;
  }, [draft, selectedSkills]);

  useEffect(() => {
    setActiveSlashSkillIndex(0);
  }, [slashCommandMatch?.[1]]);

  const handleInsertSkill = useCallback((skillName: string) => {
    setSelectedSkills(prev => {
      if (prev.some(skill => skill.name === skillName)) return prev;
      return [...prev, { id: `skill-${skillName}`, name: skillName }];
    });
    setDraft(prev => prev.replace(/(?:^|\s)\/[^\s]*$/, match => (match.startsWith(' ') ? ' ' : '')));
    setShowSkillsMenu(false);
    closeInsertMenu();
    requestAnimationFrame(() => composerInputRef.current?.focus());
  }, [closeInsertMenu, setDraft]);

  const toggleComposerSkill = useCallback((skillId: string) => {
    setComposerSkills(prev => {
      const next = prev.map(skill => (
        skill.id === skillId ? { ...skill, enabled: !skill.enabled } : skill
      ));
      // Save outside the updater to avoid the storage event firing during render,
      // which would cause syncSkills to overwrite the local state change.
      setTimeout(() => saveSkillMarketItems(next), 0);
      return next;
    });
  }, []);

  const handleOpenSkillDetail = useCallback((skill: SkillMarketItem) => {
    setSelectedSkillDetail(skill);
  }, []);

  const handleSkillDetailTryInChat = useCallback(() => {
    if (!selectedSkillDetail) return;
    handleInsertSkill(selectedSkillDetail.name);
    setShowSkillManagementModal(false);
    setSelectedSkillDetail(null);
  }, [handleInsertSkill, selectedSkillDetail]);

  // draft 清空时重置意图 dismiss 状态
  useEffect(() => {
    if (!draft.trim()) setIntentDismissed(false);
  }, [draft]);

  const handleSubmit = useCallback(() => {
    const content = draft.trim();
    if (!content && attachments.length === 0) return;
    const hasDesignAttachment = attachments.some((item) => item.type === 'design');

    const attachmentLine = attachments.length > 0
      ? `已附带附件：${attachments.map(item => item.type === 'design' ? `设计稿 ${item.name}` : item.name).join('、')}`
      : '';
    const composed = [attachmentLine, content].filter(Boolean).join('\n');
    onSend(composed, { hasDesignAttachment });
    setAttachments([]);
    if (hasDesignAttachment) onFigmaData?.(null);
    setSelectedSkills([]);
    closeInsertMenu();
  }, [attachments, closeInsertMenu, draft, onFigmaData, onSend]);

  const currentAgentOption = AGENT_OPTIONS.find(o => o.id === agent) ?? AGENT_OPTIONS[0];
  const canSend = draft.trim().length > 0 || attachments.length > 0;
  const isAgentSelected = true;
  const composerShellStyle = useMemo<React.CSSProperties>(() => ({
    border: '1px solid transparent',
    background: 'linear-gradient(#fff, #fff) padding-box, conic-gradient(from 180deg, #f66117 5%, #3d5dff 22%, #8b68ff 43%, #1cab6f 54%, #3d5dff 66%, #ce07e8 92%, #f66117 100%) border-box',
    boxShadow: isComposerFocused
      ? '0 8px 32px 0 rgba(21,57,217,0.32)'
      : '0 4px 24px 0 rgba(21,57,217,0.24)',
  }), [isComposerFocused]);

  const handleComposerFocusCapture = useCallback(() => {
    setIsComposerFocused(true);
  }, []);

  const handleComposerBlurCapture = useCallback(() => {
    requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      setIsComposerFocused(Boolean(composerShellRef.current?.contains(activeElement)));
    });
  }, []);

  return (
    <div className="p-5 shrink-0" style={{ borderTop: 'none' }}>
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip"
        onChange={handleUploadFiles}
      />
      <div
        ref={composerShellRef}
        onFocusCapture={handleComposerFocusCapture}
        onBlurCapture={handleComposerBlurCapture}
        className="relative rounded-[16px] transition-[box-shadow] duration-200"
        style={composerShellStyle}
      >
        {isComposerFocused && (
          <StarBorder
            as="div"
            className="composer-star-border"
            color="#ffffff"
            speed="3.2s"
            thickness={2}
            aria-hidden="true"
          >
            <div />
          </StarBorder>
        )}
        {attachments.length > 0 && (
          <div className="relative z-[1] mx-4 mt-3 mb-1 flex flex-wrap gap-1.5">
            {attachments.map(item => (
              <div
                key={item.id}
                className="h-7 max-w-[240px] rounded-lg bg-[#f3f6ff] border border-[#d9e5ff] text-[#1d4ed8] text-[10px] px-2.5 inline-flex items-center gap-1.5"
              >
                {item.type === 'image' ? (
                  <Image size={12} />
                ) : item.type === 'design' ? (
                  item.designSource === 'code' ? <Code size={12} /> : <Link2 size={12} />
                ) : (
                  <Paperclip size={12} />
                )}
                <span className="truncate">{item.name}</span>
                <button
                  onClick={() => {
                    if (item.type === 'design') onFigmaData?.(null);
                    setAttachments(prev => prev.filter(att => att.id !== item.id));
                  }}
                  className="w-4 h-4 inline-flex items-center justify-center rounded hover:bg-[#dbeafe] transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative z-[1] px-3 pt-2.5 pb-1.5 h-[133px]">
          <div className="flex flex-wrap items-start gap-1.5 h-full">
            {selectedSkills.map(skill => (
              <div
                key={skill.id}
                className="h-7 max-w-full rounded-[10px] bg-[#f5ecff] text-[#7c3aed] px-1 inline-flex items-center gap-1"
              >
                <Layers size={12} />
                <span className="text-[10px] font-medium truncate leading-none">{skill.name}</span>
              </div>
            ))}
            <textarea
              ref={composerInputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (slashCommandMatch && filteredSlashSkills.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveSlashSkillIndex(prev => (prev + 1) % filteredSlashSkills.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveSlashSkillIndex(prev => (prev - 1 + filteredSlashSkills.length) % filteredSlashSkills.length);
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInsertSkill(filteredSlashSkills[activeSlashSkillIndex]?.name ?? filteredSlashSkills[0].name);
                    return;
                  }
                }
                if (slashCommandMatch && e.key === 'Escape') {
                  e.preventDefault();
                  setDraft(prev => prev.replace(/(?:^|\s)\/[^\s]*$/, match => (match.startsWith(' ') ? ' ' : '')));
                  return;
                }
                if ((e.key === 'Backspace' || e.key === 'Delete') && draft.length === 0 && selectedSkills.length > 0) {
                  e.preventDefault();
                  setSelectedSkills(prev => prev.slice(0, -1));
                  return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={selectedSkills.length > 0 ? '' : '描述你想生成的内容，输入 / 唤起技能，或通过 + 上传文件与选择技能...'}
              className="min-w-[120px] flex-1 self-stretch bg-transparent text-[12px] text-[#191919] outline-none leading-[1.7] py-0.5 resize-none overflow-auto placeholder:text-[rgba(25,25,25,0.5)]"
            />
          </div>

          <AnimatePresence>
            {slashCommandMatch && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 bottom-full mb-2 w-[260px] rounded-[16px] border border-[rgba(25,25,25,0.08)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden z-40"
              >
                {filteredSlashSkills.length > 0 ? (
                  <div className="max-h-[260px] overflow-y-auto py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="px-3 pb-1 text-[10px] text-[#808080]">已安装技能</div>
                    {filteredSlashSkills.map((skill, index) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleInsertSkill(skill.name)}
                        className={`w-full px-3 py-2.5 text-left transition-colors flex items-center gap-2 ${
                          index === activeSlashSkillIndex ? 'bg-[#f5ecff] text-[#7c3aed]' : 'text-[#191919] hover:bg-[#f8fafc]'
                        }`}
                      >
                        <Layers size={14} />
                        <span className="text-[12px] font-medium">{skill.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-[12px] text-[#999]">没有匹配的技能</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Bottom action row */}
        <div className="relative z-[70] h-[47px]" style={{ borderTop: '1px solid rgba(25,25,25,0.15)' }}>
          {/* Right fade gradient for overflow - fixed position */}
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10 rounded-br-2xl" />
          <div className="flex items-center h-full px-2 gap-1 pr-12 overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* + button */}
          <div className="relative shrink-0" ref={insertMenuRef}>
            <button
              onClick={() => {
                setShowInsertMenu(v => !v);
                setShowSkillsMenu(false);
                setShowAgentMenu(false);
                closePresetMenus();
              }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0 ${showInsertMenu ? 'bg-[#f0f5ff] text-[#1476ff]' : 'text-[#777] hover:bg-[#f5f5f5]'}`}
            >
              <Plus size={16} />
            </button>
          </div>
          {/* Agent selector */}
          <div className="relative shrink-0" ref={agentMenuRef}>
            <div className="flex items-center h-8 rounded-xl border transition-colors bg-[#f1f5ff] border-[#d8e7ff]">
              <button
                onClick={() => {
                  setShowAgentMenu(v => !v);
                  closeInsertMenu();
                }}
                className="flex items-center gap-1 h-8 px-2 rounded-xl text-[12px] transition-colors text-[#1476ff]"
              >
                <span className="w-5 h-5 rounded-md bg-[#eff6ff] text-[#1476ff] flex items-center justify-center">{currentAgentOption.icon}</span>
                <span>{currentAgentOption.label}</span>
                <ChevronDown size={10} className="text-[#1476ff]" />
              </button>
            </div>
          </div>
          {agent === 'creative' && (
            <>
              <div className="relative shrink-0 z-[60]" ref={creativeMediaMenuRef}>
                <button
                  onClick={() => {
                    setShowCreativeMediaMenu(v => !v);
                    setShowDemoSpecMenu(false);
                    setShowCreativeOutputMenu(false);
                  }}
                  className="flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] text-[#191919] hover:bg-[#f5f5f5] transition-colors"
                >
                  <span>{creativeMediaType}</span>
                  <ChevronDown size={10} />
                </button>
                <AnimatePresence>
                  {showCreativeMediaMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-1 w-[120px] bg-white rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] border border-[rgba(25,25,25,0.08)] overflow-hidden z-[220]"
                    >
                      {CREATIVE_MEDIA_OPTIONS.map(media => (
                        <button
                          key={media}
                          onClick={() => {
                            setCreativeMediaType(media);
                            setShowCreativeMediaMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${creativeMediaType === media ? 'text-[#1476ff] bg-[#f0f5ff]' : 'text-[#333] hover:bg-[#f8fafc]'}`}
                        >
                          {media}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative shrink-0 z-[60]" ref={creativeOutputMenuRef}>
                <button
                  onClick={() => {
                    setShowCreativeOutputMenu(v => !v);
                    setShowDemoSpecMenu(false);
                    setShowCreativeMediaMenu(false);
                  }}
                  className="flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] text-[#191919] hover:bg-[#f5f5f5] transition-colors"
                >
                  <span>{creativeQuality}</span>
                  <ChevronDown size={10} />
                </button>
                <AnimatePresence>
                  {showCreativeOutputMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full right-0 mb-1 w-[240px] bg-white rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] border border-[rgba(25,25,25,0.08)] p-3 z-[220]"
                    >
                      <div>
                        <p className="text-[10px] font-medium text-[#999]">图片比例</p>
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {CREATIVE_RATIO_OPTIONS.map((ratio, idx) => {
                            const isActive = creativeRatio === ratio;
                            return (
                              <button
                                key={`${ratio}-${idx}`}
                                onClick={() => setCreativeRatio(ratio)}
                                className={`h-8 rounded-lg border text-[12px] font-medium transition-colors ${
                                  isActive
                                    ? 'border-[#c7d9ff] bg-[#f0f5ff] text-[#1476ff]'
                                    : 'border-[#e5e7eb] bg-[#ffffff] text-[#555] hover:bg-[#f8fafc]'
                                }`}
                              >
                                {ratio}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-[10px] font-medium text-[#999]">画质选择</p>
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          {CREATIVE_QUALITY_OPTIONS.map(quality => {
                            const isActive = creativeQuality === quality;
                            return (
                              <button
                                key={quality}
                                onClick={() => {
                                  setCreativeQuality(quality);
                                  setShowCreativeOutputMenu(false);
                                }}
                                className={`h-8 rounded-lg border text-[12px] font-medium transition-colors ${
                                  isActive
                                    ? 'border-[#c7d9ff] bg-[#f0f5ff] text-[#1476ff]'
                                    : 'border-[#e5e7eb] bg-[#ffffff] text-[#555] hover:bg-[#f8fafc]'
                                }`}
                              >
                                {quality}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
          {agent === 'research' && (
            <div className="relative shrink-0 z-[60]" ref={researchMenuRef}>
              <button
                onClick={() => {
                  setShowResearchMenu(v => !v);
                  setShowDesignMenu(false);
                  setShowDemoSpecMenu(false);
                  setShowCreativeMediaMenu(false);
                  setShowCreativeOutputMenu(false);
                }}
                className="flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] text-[#191919] hover:bg-[#f5f5f5] transition-colors"
              >
                <span>{researchOption}</span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showResearchMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full left-0 mb-1 w-[140px] bg-white rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] border border-[rgba(25,25,25,0.08)] overflow-hidden z-[220]"
                  >
                    {RESEARCH_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setResearchOption(opt);
                          setShowResearchMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${researchOption === opt ? 'text-[#1476ff] bg-[#f0f5ff]' : 'text-[#333] hover:bg-[#f8fafc]'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {agent === 'ui-design' && (
            <div className="relative shrink-0 z-[60]" ref={designMenuRef}>
              <button
                onClick={() => {
                  setShowDesignMenu(v => !v);
                  setShowResearchMenu(false);
                  setShowDemoSpecMenu(false);
                  setShowCreativeMediaMenu(false);
                  setShowCreativeOutputMenu(false);
                }}
                className="flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] text-[#191919] hover:bg-[#f5f5f5] transition-colors"
              >
                <span>{designOption}</span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showDesignMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full left-0 mb-1 w-[120px] bg-white rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] border border-[rgba(25,25,25,0.08)] overflow-hidden z-[220]"
                  >
                    {DESIGN_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setDesignOption(opt);
                          setShowDesignMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${designOption === opt ? 'text-[#1476ff] bg-[#f0f5ff]' : 'text-[#333] hover:bg-[#f8fafc]'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          </div>
            <AnimatePresence>
              {showInsertMenu && (
                <motion.div
                  ref={insertMenuLayerRef}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full left-0 mb-2 w-[220px] rounded-2xl bg-white border border-[rgba(25,25,25,0.08)] shadow-[0_-8px_24px_rgba(0,0,0,0.12)] z-50 overflow-visible"
                >
                  <button
                    onClick={() => {
                      uploadInputRef.current?.click();
                      closeInsertMenu();
                    }}
                    className="w-full px-4 py-3 text-left text-[14px] text-[#191919] hover:bg-[#f8fafc] transition-colors rounded-t-2xl flex items-center gap-2"
                  >
                    <Paperclip size={16} className="text-[#333]" />
                    上传文件或图片
                  </button>
                  <div className="mx-4 h-px bg-[rgba(25,25,25,0.08)]" />
                  <button
                    onClick={() => {
                      closeInsertMenu();
                      setShowDesignImportModal(true);
                    }}
                    className="w-full px-4 py-3 text-left text-[14px] text-[#191919] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                  >
                    <Code size={16} className="text-[#333]" />
                    导入设计稿
                  </button>
                  <div className="mx-4 h-px bg-[rgba(25,25,25,0.08)]" />
                  <div className="relative">
                    <button
                      onClick={() => setShowSkillsMenu(v => !v)}
                      className="w-full px-4 py-3 text-left text-[14px] text-[#191919] hover:bg-[#f8fafc] transition-colors rounded-b-2xl flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[#333]" />
                        Skills
                      </span>
                      <ChevronRight size={14} className={`text-[#555] transition-transform ${showSkillsMenu ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showSkillsMenu && (
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-full bottom-0 ml-1 w-[220px] max-h-[340px] rounded-xl bg-white border border-[rgba(25,25,25,0.08)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
                        >
                          <div className="max-h-[272px] overflow-y-auto py-2" style={{ scrollbarWidth: 'thin' }}>
                            <div className="space-y-0.5 px-2">
                              {installedSkills.length > 0 ? installedSkills.map(skill => (
                                <button
                                  key={skill.id}
                                  onClick={() => handleInsertSkill(skill.name)}
                                  className="w-full px-3 py-2.5 text-left rounded-lg text-[12px] text-[#191919] hover:bg-[#f8fafc] transition-colors truncate"
                                >
                                  {skill.name}
                                </button>
                              )) : (
                                <div className="px-3 py-4 text-[12px] text-[#999]">暂无已启用技能</div>
                              )}
                            </div>
                          </div>
                          <div className="mx-3 h-px bg-[rgba(25,25,25,0.08)]" />
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setShowSkillsMenu(false);
                                closeInsertMenu();
                                setShowSkillManagementModal(true);
                              }}
                              className="w-full px-3 py-2.5 text-left rounded-lg text-[12px] text-[#191919] hover:bg-[#f8fafc] transition-colors flex items-center justify-between"
                            >
                              <span>技能管理</span>
                              <ChevronRight size={14} className="text-[#777] shrink-0" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAgentMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full left-0 mb-1 w-36 bg-white rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] border border-[rgba(25,25,25,0.08)] overflow-hidden z-50"
                >
                  {AGENT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAgent(opt.id)}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center justify-between gap-2 ${agent === opt.id ? 'text-[#1476ff] bg-[#f0f5ff]' : 'text-[#333] hover:bg-[#f8fafc]'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#eff6ff] text-[#1476ff] flex items-center justify-center">{opt.icon}</span>
                        {opt.label}
                      </span>
                      {agent === opt.id && <Check size={10} className="text-[#1476ff] shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

              <AnimatePresence>
                {showDemoSpecMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full right-0 mb-1 w-[176px] bg-white rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] border border-[rgba(25,25,25,0.08)] overflow-hidden z-50"
                  >
                    {DEMO_SPEC_OPTIONS.map(spec => (
                      <button
                        key={spec}
                        onClick={() => {
                          setDemoSpec(spec);
                          setShowDemoSpecMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${demoSpec === spec ? 'text-[#1476ff] bg-[#f0f5ff]' : 'text-[#333] hover:bg-[#f8fafc]'}`}
                      >
                        {spec}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

          <AnimatePresence>
            {showSkillManagementModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[615] flex items-center justify-center"
                onClick={() => {
                  setShowSkillManagementModal(false);
                  setSelectedSkillDetail(null);
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  onClick={(event) => event.stopPropagation()}
                  className="relative w-[950px] max-w-[calc(100vw-32px)] h-[750px] max-h-[calc(100vh-32px)] overflow-hidden rounded-[24px] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] border border-[rgba(25,25,25,0.08)] flex"
                >
                  <div className="w-[268px] shrink-0 bg-[#fafafa] border-r border-[rgba(25,25,25,0.08)] px-4 py-6 flex flex-col">
                    <div className="px-2">
                      <h3 className="text-[16px] font-semibold text-[#191919]">技能社区</h3>
                      <p className="text-[12px] text-[#808080] mt-1">Skills</p>
                    </div>

                    <div className="mt-6 space-y-1.5">
                      {([
                        {
                          key: '全部技能' as SkillMarketModalCategory,
                          label: '全部技能',
                          icon: Sparkles,
                          accent: '#1476ff',
                          accentBg: '#eff6ff',
                        },
                        ...SKILL_MARKET_CATEGORIES.map(category => ({
                          key: category as SkillMarketModalCategory,
                          label: category,
                          icon: SKILL_CATEGORY_UI[category].icon,
                          accent: SKILL_CATEGORY_UI[category].accent,
                          accentBg: SKILL_CATEGORY_UI[category].accentBg,
                        })),
                      ]).map((category) => {
                        const CategoryIcon = category.icon;
                        const isActive = skillMarketCategory === category.key;
                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => setSkillMarketCategory(category.key)}
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
                      <div>
                        <div className="text-[16px] font-semibold text-[#191919]">{skillMarketCategory}</div>
                        <div className="text-[12px] text-[#808080] mt-1">已选 {installedSkills.length}/{composerSkills.length}</div>
                      </div>
                      <button
                        onClick={() => {
                          setShowSkillManagementModal(false);
                          setSelectedSkillDetail(null);
                        }}
                        className="w-8 h-8 rounded-xl text-[#666] hover:text-[#191919] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center shrink-0"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-7 py-4 min-h-0" style={{ scrollbarWidth: 'thin' }}>
                      <div className="space-y-0">
                        {activeCategorySkills.map(skill => {
                          const categoryUi = SKILL_CATEGORY_UI[skill.category];
                          const SkillIcon = categoryUi.icon;
                          return (
                            <div
                              key={skill.id}
                              className="min-h-[104px] border-b border-[rgba(25,25,25,0.08)] flex items-center gap-4"
                            >
                              <div
                                onClick={() => handleOpenSkillDetail(skill)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleOpenSkillDetail(skill);
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
                                  toggleComposerSkill(skill.id);
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
                        {activeCategorySkills.length === 0 && (
                          <div className="py-16 text-center text-[14px] text-[#999]">
                            当前分类下暂无技能
                          </div>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedSkillDetail && (() => {
                        const categoryUi = SKILL_CATEGORY_UI[selectedSkillDetail.category];
                        const SkillIcon = categoryUi.icon;
                        return (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[5] flex items-center justify-center bg-[rgba(255,255,255,0.62)] backdrop-blur-[2px] px-6 py-6"
                            onClick={closeSkillDetailModal}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 14, scale: 0.985 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.985 }}
                              transition={{ duration: 0.16 }}
                              onClick={(event) => event.stopPropagation()}
                              className="w-[760px] max-w-[calc(100%-24px)] max-h-full rounded-[28px] bg-white border border-[rgba(25,25,25,0.08)] shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
                            >
                              <div className="px-8 pt-7 pb-6 border-b border-[rgba(25,25,25,0.06)]">
                                <div className="flex items-start gap-4">
                                  <div
                                    className="w-16 h-16 rounded-[18px] flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                                  >
                                    <SkillIcon size={30} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="text-[28px] leading-[1.1] font-semibold text-[#191919]">{selectedSkillDetail.name}</h3>
                                          <span className="text-[14px] text-[#808080]">Skill</span>
                                        </div>
                                        <div className="mt-3 text-[14px] text-[#555] max-w-[540px] leading-[1.7]">
                                          {selectedSkillDetail.detail.tagline}
                                        </div>
                                      </div>
                                      <button
                                        onClick={closeSkillDetailModal}
                                        className="w-9 h-9 rounded-xl text-[#666] hover:text-[#191919] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center shrink-0"
                                      >
                                        <X size={20} />
                                      </button>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium"
                                          style={{ backgroundColor: categoryUi.accentBg, color: categoryUi.accent }}
                                        >
                                          <SkillIcon size={12} />
                                          {selectedSkillDetail.category}
                                        </span>
                                        <span className="text-[12px] text-[#888]">版本 {selectedSkillDetail.detail.version}</span>
                                        <span className="text-[12px] text-[#bbb]">更新于 {selectedSkillDetail.detail.updatedAt}</span>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        <button
                                          type="button"
                                          onClick={() => toggleComposerSkill(selectedSkillDetail.id)}
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
                              </div>

                              <div className="px-8 py-6 overflow-y-auto min-h-0 flex-1" style={{ scrollbarWidth: 'thin' }}>
                                <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-[#fcfcfc] px-6 py-5">
                                  <p className="text-[14px] text-[#444] leading-[1.9]">{selectedSkillDetail.detail.overview}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-5">
                                  <div className="rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                                    <div className="text-[15px] font-semibold text-[#191919]">适用场景</div>
                                    <div className="mt-3 space-y-2">
                                      {selectedSkillDetail.detail.useCases.map((item) => (
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
                                      {selectedSkillDetail.detail.outputs.map((item) => (
                                        <div key={item} className="flex gap-2 text-[13px] text-[#555] leading-[1.7]">
                                          <span className="text-[#1476ff]">•</span>
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-5 rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                                  <div className="text-[15px] font-semibold text-[#191919]">推荐工作流</div>
                                  <div className="mt-4 space-y-3">
                                    {selectedSkillDetail.detail.workflow.map((item, index) => (
                                      <div key={item} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-[#eff6ff] text-[#1476ff] text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                          {index + 1}
                                        </span>
                                        <span className="text-[13px] text-[#444] leading-[1.7]">{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-5 rounded-[20px] border border-[rgba(25,25,25,0.08)] bg-white px-5 py-5">
                                  <div className="text-[15px] font-semibold text-[#191919]">使用规则</div>
                                  <div className="mt-3 space-y-2">
                                    {selectedSkillDetail.detail.rules.map((item) => (
                                      <div key={item} className="flex gap-2 text-[13px] text-[#555] leading-[1.7]">
                                        <span className="text-[#7c3aed]">•</span>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="px-8 py-5 border-t border-[rgba(25,25,25,0.06)] flex items-center justify-between gap-4">
                                <button
                                  onClick={() => {
                                    toggleComposerSkill(selectedSkillDetail.id);
                                  }}
                                  className="text-[14px] text-[#ef4444] hover:text-[#dc2626] transition-colors"
                                >
                                  {selectedSkillDetail.enabled ? '卸载' : '重新启用'}
                                </button>
                                <button
                                  onClick={handleSkillDetailTryInChat}
                                  className="h-11 px-5 rounded-[16px] bg-[#191919] text-white text-[14px] font-medium hover:bg-[#111] transition-colors inline-flex items-center justify-center"
                                >
                                  在聊天中试用
                                </button>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDesignImportModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[610] flex items-center justify-center"
                onClick={closeDesignImportModal}
              >
                <div className="absolute inset-0 bg-black/20" />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  onClick={(event) => event.stopPropagation()}
                  className="relative w-[420px] max-w-[calc(100vw-32px)] rounded-[24px] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] border border-[rgba(25,25,25,0.08)] p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#f3f6ff] text-[#1d4ed8] flex items-center justify-center shrink-0">
                      <Code size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-semibold text-[#191919]">导入设计稿</h3>
                      <p className="text-[12px] text-[#888] mt-1">支持通过 URL 或传送码将设计稿附加到当前对话</p>
                    </div>
                    <button
                      onClick={closeDesignImportModal}
                      className="w-8 h-8 rounded-xl text-[#999] hover:text-[#333] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-[#f5f7fb] p-1">
                    <button
                      onClick={() => setDesignImportMode('url')}
                      className={`flex-1 h-9 rounded-xl text-[12px] font-medium transition-colors ${designImportMode === 'url' ? 'bg-white text-[#191919] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-[#666]'}`}
                    >
                      URL 导入
                    </button>
                    <button
                      onClick={() => setDesignImportMode('code')}
                      className={`flex-1 h-9 rounded-xl text-[12px] font-medium transition-colors ${designImportMode === 'code' ? 'bg-white text-[#191919] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-[#666]'}`}
                    >
                      传送码导入
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[12px] text-[#666] mb-2">
                      {designImportMode === 'url' ? 'Figma 设计稿链接' : '设计稿传送码'}
                    </label>
                    <input
                      autoFocus
                      value={designImportValue}
                      onChange={(event) => { setDesignImportValue(event.target.value); setFigmaParseError(null); }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && designImportValue.trim() && !isFigmaParsing) {
                          event.preventDefault();
                          void handleFigmaImportConfirm();
                        }
                      }}
                      placeholder={designImportMode === 'url' ? '粘贴 Figma 设计稿链接（figma.com/design/...）' : '粘贴设计稿传送码'}
                      className="w-full h-11 rounded-[14px] border border-[rgba(25,25,25,0.12)] px-3 text-[12px] text-[#191919] outline-none focus:border-[#1476ff]"
                    />
                    {figmaParseError && (
                      <p className="mt-1.5 text-[11px] text-[#ef4444]">{figmaParseError}</p>
                    )}
                    {figmaData && !figmaParseError && (
                      <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg">
                        <Check size={11} className="text-[#16a34a] shrink-0" />
                        <span className="text-[11px] text-[#166534] truncate">{figmaData.name} · {figmaData.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      onClick={closeDesignImportModal}
                      className="h-10 px-4 rounded-[12px] text-[12px] text-[#555] hover:bg-[#f5f5f5] transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => void handleFigmaImportConfirm()}
                      disabled={!designImportValue.trim() || isFigmaParsing}
                      className={`h-10 px-4 rounded-[12px] text-[12px] font-medium transition-colors flex items-center gap-1.5 ${designImportValue.trim() && !isFigmaParsing ? 'bg-[#1476ff] text-white hover:bg-[#1060d0]' : 'bg-[#f0f0f0] text-[#bbb] cursor-not-allowed'}`}
                    >
                      {isFigmaParsing && <Loader2 size={11} className="animate-spin" />}
                      {isFigmaParsing ? '解析中...' : '确定'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Fixed send button on the right */}
          <button
            onClick={handleSubmit}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors z-20 ${canSend ? 'bg-[#1476ff] text-white hover:bg-[#1060d0] shadow-[0_2px_6px_rgba(20,118,255,0.3)]' : 'bg-[#f0f0f0] text-[#ccc] cursor-default'}`}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────
function ChatPanel({
  activeWorkflow,
  deliverables,
  msgs,
  liveWorkflow,
  onMsgsChange,
  onWorkflowActivated,
  onWorkflowReady,
  onStartConversation,
  onFileOpen,
  onBack,
  title,
  figmaData,
  onFigmaData,
  onGeneratedHtml,
}: {
  activeWorkflow: WorkflowType | null;
  deliverables: WorkflowType[];
  msgs: ChatMsg[];
  liveWorkflow: { wf: WorkflowType; prompt: string } | null;
  onMsgsChange: (msgs: ChatMsg[] | ((prev: ChatMsg[]) => ChatMsg[])) => void;
  onWorkflowActivated: (wf: WorkflowType, isNew: boolean) => void;
  onWorkflowReady: (wf: WorkflowType) => void;
  onStartConversation: (msg: string, wf: WorkflowType) => void;
  onFileOpen?: (wf: WorkflowType) => void;
  onBack?: () => void;
  title?: string;
  figmaData?: FigmaDesignData | null;
  onFigmaData?: (data: FigmaDesignData | null) => void;
  onGeneratedHtml?: (html: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ComposerMode>('auto');
  const endRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const startedRef = useRef(false);
  const onMsgsChangeRef = useRef(onMsgsChange);
  const onWorkflowReadyRef = useRef(onWorkflowReady);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onMsgsChangeRef.current = onMsgsChange;
    onWorkflowReadyRef.current = onWorkflowReady;
  }, [onMsgsChange, onWorkflowReady]);

  const updateMsgs = useCallback((updater: ChatMsg[] | ((prev: ChatMsg[]) => ChatMsg[])) => {
    onMsgsChangeRef.current(updater);
  }, []);

  // Animate AI response when liveWorkflow is set
  useEffect(() => {
    if (!liveWorkflow) {
      startedRef.current = false;
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    const aiId = 'ai-live';

    // ── Real AI for demo workflow ──────────────────────────────────────────
    if (liveWorkflow.wf === 'demo') {
      updateMsgs(prev => [...prev, {
        id: aiId, role: 'ai', text: '正在解析需求，准备生成 Demo...', thinkingDone: false, thinkingLines: [], canvasType: 'demo',
      }]);
      void runRealAiDemo(liveWorkflow.prompt, 'demo', aiId);
      return;
    }

    // ── Mock path for other workflows ──────────────────────────────────────
    const resp = generateAIResponse(liveWorkflow.wf, liveWorkflow.prompt);

    updateMsgs(prev => [...prev, { id: aiId, role: 'ai', text: '…', thinkingDone: false, thinkingLines: [] }]);

    resp.thinkingLines.forEach((line, i) => {
      const tid = window.setTimeout(() => {
        updateMsgs(prev => prev.map(m =>
          m.id === aiId ? { ...m, thinkingLines: resp.thinkingLines.slice(0, i + 1) } : m
        ));
      }, 700 * (i + 1));
      timeoutsRef.current.push(tid);
    });

    const doneAt = 700 * (resp.thinkingLines.length + 1);
    const doneTid = window.setTimeout(() => {
      updateMsgs(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: resp.text, thinkingDone: true, canvasType: resp.canvasType } : m
      ));
      onWorkflowReadyRef.current(liveWorkflow.wf);
    }, doneAt);
    timeoutsRef.current.push(doneTid);

    return () => {
      timeoutsRef.current.forEach(id => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [liveWorkflow, updateMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // ─── Real AI call for demo workflow ──────────────────────────────────────────
  const runRealAiDemo = useCallback(async (content: string, wf: WorkflowType, aiId: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const thinkingAccum: string[] = [];

    try {
      await generateDemoStream(
        content,
        figmaData ?? null,
        {
          onThinkingLine: (line) => {
            thinkingAccum.push(line);
            updateMsgs(prev => prev.map(m =>
              m.id === aiId ? { ...m, thinkingLines: [...thinkingAccum] } : m
            ));
          },
          onContent: (token) => {
            updateMsgs(prev => prev.map(m => {
              if (m.id !== aiId) return m;
              const existing = (m as ChatMsg & { _rawHtml?: string })._rawHtml ?? '';
              return { ...m, _rawHtml: existing + token, text: '正在生成 Demo...' } as ChatMsg;
            }));
          },
          onDone: (html) => {
            onGeneratedHtml?.(html);
            updateMsgs(prev => prev.map(m =>
              m.id === aiId
                ? { ...m, text: `Demo 已生成完成。你可以在右侧预览，也可以点击「代码」查看完整源码。`, thinkingDone: true, canvasType: wf }
                : m
            ));
            onWorkflowReadyRef.current(wf);
          },
          onError: (err) => {
            updateMsgs(prev => prev.map(m =>
              m.id === aiId
                ? { ...m, text: `生成失败：${err}`, thinkingDone: true }
                : m
            ));
            onWorkflowReadyRef.current(wf);
          },
        },
        ctrl.signal
      );
    } catch (error) {
      const message = (error as Error)?.message || '请求失败，请检查后端服务状态';
      updateMsgs(prev => prev.map(m =>
        m.id === aiId
          ? { ...m, text: `生成失败：${message}`, thinkingDone: true }
          : m
      ));
      onWorkflowReadyRef.current(wf);
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
      }
    }
  }, [figmaData, onGeneratedHtml, updateMsgs]);

  const handleSend = useCallback((contentOverride?: string, options?: SendPayloadOptions) => {
    const content = (contentOverride ?? draft).trim();
    if (!content) return;
    setDraft('');
    const useFigmaAttachment = Boolean(options?.hasDesignAttachment && figmaData);

    // Only force demo when this submit explicitly includes a design attachment.
    const resolvedMode: WorkflowType = useFigmaAttachment
      ? 'demo'
      : mode === 'auto' || mode === 'research'
        ? detectWorkflow(content)
        : mode === 'review'
          ? 'research'
          : mode;

    if (msgs.length === 0) {
      onStartConversation(content, resolvedMode);
      return;
    }

    // Follow-up message
    const wf = resolvedMode;
    const isNew = !deliverables.includes(wf);
    onWorkflowActivated(wf, isNew);

    const userId = `u-${Date.now()}`;
    const aiId = `a-${Date.now()}`;

    // ── Real AI path for demo workflow ───────────────────────────────────────
    if (wf === 'demo') {
      updateMsgs(prev => [
        ...prev,
        { id: userId, role: 'user', text: content },
        { id: aiId, role: 'ai', text: '正在分析需求...', thinkingDone: false, thinkingLines: [], isUpdate: true, canvasType: wf },
      ]);
      void runRealAiDemo(content, wf, aiId);
      return;
    }

    // ── Mock path for other workflows ────────────────────────────────────────
    const reply = generateFollowUpReply(wf, content);

    updateMsgs(prev => [
      ...prev,
      { id: userId, role: 'user', text: content },
      { id: aiId, role: 'ai', text: '正在分析…', thinkingDone: false, thinkingLines: [], isUpdate: true },
    ]);

    reply.thinkingLines.forEach((line, i) => {
      const tid = window.setTimeout(() => {
        updateMsgs(prev => prev.map(m =>
          m.id === aiId ? { ...m, thinkingLines: reply.thinkingLines.slice(0, i + 1) } : m
        ));
      }, 600 * (i + 1));
      timeoutsRef.current.push(tid);
    });

    const doneAt = 600 * (reply.thinkingLines.length + 1);
    const doneTid = window.setTimeout(() => {
      updateMsgs(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: reply.text, thinkingDone: true, canvasType: wf } : m
      ));
      onWorkflowReadyRef.current(wf);
    }, doneAt);
    timeoutsRef.current.push(doneTid);
  }, [draft, mode, msgs.length, deliverables, onStartConversation, onWorkflowActivated, updateMsgs, runRealAiDemo]);

  const meta = activeWorkflow ? WORKFLOW_META[activeWorkflow] : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-transparent">
      <style>{`
        .octo-chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          scrollbar-gutter: stable;
        }

        .octo-chat-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .octo-chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .octo-chat-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 999px;
          min-height: 60px;
        }

        .octo-chat-scroll:hover::-webkit-scrollbar-thumb {
          background: #D9D9D9;
        }
      `}</style>
      <LeftPanelHeader onBack={onBack} title={title} />

      <div className="octo-chat-scroll flex-1 overflow-y-scroll overflow-x-hidden p-5 space-y-5 min-h-0">
        {msgs.length === 0 && <IntroBubble />}
        <AnimatePresence initial={false}>
          {msgs.map(msg => (
            <motion.div
              key={msg.id}
              initial={_streamedMsgIds.has(msg.id) ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' ? (
                <div className="w-full max-w-full">
                  {msg.thinkingDone ? (
                    <>
                      {msg.thinkingLines && msg.thinkingLines.length > 0 && (
                        <ThinkingBlock lines={msg.thinkingLines} />
                      )}
                      <div>
                        <p className="text-[14px] text-[#333] leading-[20px] whitespace-pre-wrap"><StreamedText text={msg.text} msgId={msg.id} /></p>
                        {msg.canvasType && (() => {
                          const art = WORKFLOW_ARTIFACTS[msg.canvasType];
                          const ArtIcon = art.Icon;
                          return (
                            <div onClick={() => onFileOpen?.(msg.canvasType!)} className="mt-3 w-full border border-[#e2e2e2] rounded-xl p-[17px] hover:border-[#c7d9ff] hover:shadow-sm transition-colors group cursor-pointer bg-white flex flex-col gap-[16px]">
                              <div className="flex flex-col gap-[12px]">
                                <div
                                  className="inline-flex items-center gap-[4px] px-[12px] py-[6px] rounded-[8px] self-start"
                                  style={{ backgroundColor: art.iconBg }}
                                >
                                  <ArtIcon size={10} style={{ color: art.iconColor }} />
                                  <span className="text-[12px] font-medium" style={{ color: art.iconColor }}>{art.badge}</span>
                                </div>
                                <div className="flex flex-col gap-[8px]">
                                  <p className="text-[14px] font-semibold text-[#191919] leading-normal">{art.label}</p>
                                  <p className="text-[12px] text-[rgba(25,25,25,0.6)] leading-[15px]">{art.meta}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-[2px] bg-[rgba(223,223,223,0.3)] rounded-[8px] px-[12px] py-[6px]">
                                <span className="text-[12px] font-medium text-[#191919]">查看详情</span>
                                <ChevronRight size={16} className="text-[#191919]" />
                              </div>
                              </div>
                            );
                          })()}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="max-w-[88%]">
                  <div className="bg-[rgba(0,0,0,0.04)] px-3.5 py-2.5 text-[14px] text-[#333] leading-[20px] whitespace-pre-wrap break-words overflow-hidden" style={{ borderRadius: '16px 16px 2px 16px', wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 全局思考状态 - 显示在消息列表最下方 */}
        {(() => {
          const lastAiMsg = msgs.findLast(m => m.role === 'ai');
          if (!lastAiMsg) return null;

          // 思考中状态
          if (!lastAiMsg.thinkingDone) {
            const activeLines = lastAiMsg.thinkingLines ?? [];
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="w-full max-w-full">
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-[8px] text-[12px] leading-[16px] text-[#9ca3af]">
                      <motion.span
                        className="w-[5px] h-[5px] rounded-full bg-[#9ca3af] shrink-0"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      />
                      <span>思考中</span>
                    </div>
                    <div className="flex flex-col gap-[10px]">
                    {activeLines.map((line, i) => {
                      const isLast = i === activeLines.length - 1;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <ThinkingStepRow line={line} isLast={isLast} />
                        </motion.div>
                      );
                    })}
                    <div className="flex items-center gap-[6px] pl-[22px]">
                      <motion.span
                        className="w-[5px] h-[5px] rounded-full bg-[#d1d5db] shrink-0"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      />
                      <span className="text-[12px] text-[#c8cdd5]"><AnimatedDots /></span>
                    </div>
                  </div>
                  </div>
                </div>
              </motion.div>
            );
          }

          return null;
        })()}

        <div ref={endRef} />
      </div>

      <ChatComposer
        draft={draft}
        setDraft={setDraft}
        onSend={handleSend}
        activeWorkflow={activeWorkflow}
        setMode={setMode}
        figmaData={figmaData}
        onFigmaData={onFigmaData}
      />
    </div>
  );
}

// ─── OctoBuildProps ───────────────────────────────────────────────────────────
interface OctoBuildProps {
  initialState?: OctoBuildState;
  workspaceId?: string;
  onStateChange?: (state: OctoBuildState) => void;
  onBack?: () => void;
  title?: string;
  embedded?: boolean;
}

// ─── OctoBuild ────────────────────────────────────────────────────────────────
export function OctoBuild({ initialState, workspaceId, onStateChange, onBack, title, embedded = false }: OctoBuildProps = {}) {
  const MIN_CHAT_WIDTH = 320;
  const MIN_CANVAS_WIDTH = 460;
  const [deliverables, setDeliverables] = useState<WorkflowType[]>(initialState?.deliverables ?? []);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType | null>(initialState?.activeWorkflow ?? null);
  const [readyWorkflows, setReadyWorkflows] = useState<WorkflowType[]>(initialState?.readyWorkflows ?? []);
  const [msgs, setMsgs] = useState<ChatMsg[]>(initialState?.msgs ?? []);
  const [liveWorkflow, setLiveWorkflow] = useState<{ wf: WorkflowType; prompt: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  // ── Octo Make: Figma + AI state ──────────────────────────────────────────────
  const [figmaData, setFigmaData] = useState<FigmaDesignData | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const prevWorkspaceIdRef = useRef<string | undefined>(workspaceId);
  const isHydratingWorkspaceRef = useRef(false);
  const hydrateFrameRef = useRef<number | null>(null);

  const clampChatWidth = useCallback((targetWidth: number) => {
    const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;
    const maxWidth = Math.max(MIN_CHAT_WIDTH, containerWidth - MIN_CANVAS_WIDTH);
    return Math.min(Math.max(targetWidth, MIN_CHAT_WIDTH), maxWidth);
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setChatPanelWidth((prev) => clampChatWidth(prev));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [clampChatWidth]);

  useEffect(() => {
    return () => {
      if (hydrateFrameRef.current !== null) {
        window.cancelAnimationFrame(hydrateFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (workspaceId === undefined) return;
    if (prevWorkspaceIdRef.current === workspaceId) return;

    prevWorkspaceIdRef.current = workspaceId;
    isHydratingWorkspaceRef.current = true;

    // Pre-register all historical message IDs so StreamedText skips animation on mount
    initialState?.msgs?.forEach((m) => _streamedMsgIds.add(m.id));

    setDeliverables(initialState?.deliverables ?? []);
    setActiveWorkflow(initialState?.activeWorkflow ?? null);
    setReadyWorkflows(initialState?.readyWorkflows ?? []);
    setMsgs(initialState?.msgs ?? []);
    setLiveWorkflow(null);
    setFigmaData(null);
    setGeneratedHtml(null);

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(null);

    if (hydrateFrameRef.current !== null) {
      window.cancelAnimationFrame(hydrateFrameRef.current);
    }
    hydrateFrameRef.current = window.requestAnimationFrame(() => {
      isHydratingWorkspaceRef.current = false;
      hydrateFrameRef.current = null;
    });
  }, [workspaceId, initialState]);

  const startResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStateRef.current = { startX: event.clientX, startWidth: chatPanelWidth };
    setIsResizing(true);
  }, [chatPanelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const deltaX = event.clientX - resizeStateRef.current.startX;
      setChatPanelWidth(clampChatWidth(resizeStateRef.current.startWidth + deltaX));
    };

    const stopResize = () => {
      resizeStateRef.current = null;
      setIsResizing(false);
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
  }, [clampChatWidth, isResizing]);

  // Auto-heal active workflow selection so right panel always has a valid target tab.
  useEffect(() => {
    if (deliverables.length === 0) {
      if (activeWorkflow !== null) setActiveWorkflow(null);
      return;
    }
    if (!activeWorkflow || !deliverables.includes(activeWorkflow)) {
      setActiveWorkflow(deliverables[deliverables.length - 1]);
    }
  }, [activeWorkflow, deliverables]);

  // Auto-heal ready workflow status from completed AI messages to avoid blank canvas states.
  useEffect(() => {
    setReadyWorkflows((prev) => {
      const nextSet = new Set<WorkflowType>(prev.filter((wf) => deliverables.includes(wf)));

      deliverables.forEach((wf) => {
        const hasCompletedCanvas = msgs.some((msg) => {
          return msg.role === 'ai' && msg.thinkingDone && msg.canvasType === wf;
        });
        if (hasCompletedCanvas) nextSet.add(wf);
      });

      const next = Array.from(nextSet);
      if (next.length === prev.length && next.every((wf, index) => wf === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [deliverables, msgs]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const startConversation = useCallback((msg: string, wf: WorkflowType) => {
    const isNew = !deliverables.includes(wf);
    if (isNew) setDeliverables(prev => [...prev, wf]);
    setReadyWorkflows(prev => prev.filter(w => w !== wf));
    setActiveWorkflow(wf);
    setMsgs([{ id: `u-${Date.now()}`, role: 'user', text: msg }]);
    setLiveWorkflow({ wf, prompt: msg });
  }, [deliverables]);

  const handleWorkflowActivated = useCallback((wf: WorkflowType, isNew: boolean) => {
    if (isNew) setDeliverables(prev => [...prev, wf]);
    setReadyWorkflows(prev => prev.filter(w => w !== wf));
    setActiveWorkflow(wf);
    // 不设 liveWorkflow —— follow-up 动画由 handleSend 内部 setTimeout 独立管理
  }, []);

  const handleWorkflowReady = useCallback((wf: WorkflowType) => {
    setReadyWorkflows(prev => prev.includes(wf) ? prev : [...prev, wf]);
    setLiveWorkflow(null);
  }, []);

  const handleTabClose = useCallback((wf: WorkflowType) => {
    setDeliverables(prev => prev.filter(w => w !== wf));
    setReadyWorkflows(prev => prev.filter(w => w !== wf));
    if (activeWorkflow === wf) setActiveWorkflow(null);
  }, [activeWorkflow]);

  const handleFileOpen = useCallback((wf: WorkflowType) => {
    setDeliverables(prev => prev.includes(wf) ? prev : [...prev, wf]);
    setReadyWorkflows(prev => prev.includes(wf) ? prev : [...prev, wf]);
    setActiveWorkflow(wf);
  }, []);

  const handleReset = useCallback(() => {
    setDeliverables([]);
    setActiveWorkflow(null);
    setReadyWorkflows([]);
    setMsgs([]);
    setLiveWorkflow(null);
    setGeneratedHtml(null);
    setFigmaData(null);
  }, []);

  // ── 复制为设计稿: AI converts generated HTML → SVG → clipboard ───────────────
  const handleCopyAsDesign = useCallback(async () => {
    if (!generatedHtml) return;
    showToast('正在生成矢量设计稿，请稍候...');
    try {
      const svg = await generateSvgFromHtml(generatedHtml);
      await navigator.clipboard.writeText(svg);
      showToast('已复制为矢量设计稿，在 Figma 中 Cmd+V 粘贴即可编辑');
    } catch (err) {
      showToast(`生成失败：${(err as Error).message}`);
    }
  }, [generatedHtml, showToast]);

  useEffect(() => {
    if (isHydratingWorkspaceRef.current) return;
    onStateChange?.({ deliverables, activeWorkflow, readyWorkflows, msgs });
  }, [deliverables, activeWorkflow, readyWorkflows, msgs, onStateChange]);

  return (
    <motion.div
      ref={containerRef}
      className={embedded ? 'relative w-full h-full flex bg-transparent' : 'fixed inset-0 z-[520] flex bg-transparent'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="shrink-0 flex flex-col bg-transparent h-full min-w-0 border-r border-[rgba(25,25,25,0.12)]"
        style={{ width: chatPanelWidth }}
      >
        <ChatPanel
          activeWorkflow={activeWorkflow}
          deliverables={deliverables}
          msgs={msgs}
          liveWorkflow={liveWorkflow}
          onMsgsChange={(msgsOrUpdater) => {
            setMsgs(prev => typeof msgsOrUpdater === 'function' ? msgsOrUpdater(prev) : msgsOrUpdater);
          }}
          onWorkflowActivated={handleWorkflowActivated}
          onWorkflowReady={handleWorkflowReady}
          onStartConversation={startConversation}
          onFileOpen={handleFileOpen}
          onBack={onBack}
          title={title}
          figmaData={figmaData}
          onFigmaData={setFigmaData}
          onGeneratedHtml={setGeneratedHtml}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-3 -translate-x-1/2 cursor-col-resize group z-20 select-none"
        style={{ left: chatPanelWidth }}
        onMouseDown={startResize}
        aria-label="拖拽调整聊天区与画布区宽度"
        role="separator"
        aria-orientation="vertical"
      >
        <div
          className={`absolute left-1/2 top-0 -translate-x-1/2 h-full w-px transition-colors opacity-0 group-hover:opacity-100 ${
            isResizing ? 'bg-[#93c5fd] opacity-100' : 'bg-[#dbeafe]'
          }`}
        />
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-[3px] rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
            isResizing ? 'bg-[#93c5fd] opacity-100' : 'bg-[#bfdbfe]'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0 h-full flex">
        <ResultWorkspace
          deliverables={deliverables}
          activeWorkflow={activeWorkflow}
          readyWorkflows={readyWorkflows}
          onReset={handleReset}
          onTabSelect={setActiveWorkflow}
          onTabClose={handleTabClose}
          onQuickStart={startConversation}
          onToast={showToast}
          generatedHtml={generatedHtml}
          onCopyAsDesign={handleCopyAsDesign}
        />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[580] bg-[#191919] text-white text-[12px] px-4 py-2.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
