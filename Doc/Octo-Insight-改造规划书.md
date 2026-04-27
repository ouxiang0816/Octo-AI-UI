# Octo Insight 模块改造规划书

> **文档用途**：指导 Agent 完成 Octo Insight 模块的 Demo 演示效果改造  
> **优先级焦点**：Demo 流程完整性 · UI 视觉质量 · 交互体验细节  
> **目标文件**：`octo-client-shell/src/pages/OctoBuild.tsx`  
> **日期**：2026-04-22

---

## 一、改造目标

将当前 Octo Insight 的简单 `research/interview` 双工作流，升级为具备**三级交互结构**的洞察分析系统，支持 5 种可视化输出，并通过精心设计的 Demo 流程展现 AI 分析能力。

---

## 二、信息架构对比

```
【Before】平铺两档
Octo Insight
├── 深度研究       → CompetitiveAnalysisCanvas（竞品分析）
└── 模拟用户访谈   → InterviewCanvas（访谈画像）

【After】三级结构
Octo Insight
├── 访谈观点洞察 ──┬── 观点解析       → InsightTableView
│   (需上传文件)  ├── 按提纲聚类     → InsightOutlineMindMap
│                ├── AI 用户画像    → InsightPersonaCard
│                └── 思维导图       → InsightLogicMindMap
├── 评估问题整理   → InsightEvalQuestionTable（需上传文件）
└── 用研知识问答   → （直接发送，不需上传文件）
```

---

## 三、界面草图

### 3.1 ChatComposer — 研究选项选择器

```
┌─────────────────────────────────────────────────────────┐
│  ☰ Octo Insight ▾ │ 访谈观点洞察/AI用户画像 ▾ │        │
└─────────────────────────────────────────────────────────┘
        │ 点击展开一级菜单
        ▼
┌──────────────────────┬──────────────────────┐
│  ○ 访谈观点洞察   ›  │  ● 观点解析           │
│  ○ 评估问题整理      │  ○ 按提纲聚类         │
│  ○ 用研知识问答      │  ○ AI 用户画像        │
└──────────────────────┤  ○ 思维导图           │
   hover 右侧弹出 ──── └──────────────────────┘

  说明：
  › = 有二级子菜单，hover 触发
  ● = 当前选中项（高亮蓝色）
  ○ = 未选中项
```

### 3.2 ChatComposer — 输入区状态

```
【访谈观点洞察 / 评估问题整理 — 未上传文件时】

┌─────────────────────────────────────────────────────────┐
│  @ 选择文件  上传访谈逐字稿、访谈大纲，智能构建用户画像… │
│                                                         │
│                                            [ 发送 ⊘ ]  │
│                                         ↑ 灰化不可点    │
└─────────────────────────────────────────────────────────┘
   hover 发送按钮 → tooltip: "请先上传访谈逐字稿和大纲"

【上传文件后】

┌─────────────────────────────────────────────────────────┐
│  📎 访谈逐字稿.pdf ×    📎 大纲.docx ×                 │
│  描述分析目标或直接发送…                                │
│                                            [ 发送 ▶ ]  │
└─────────────────────────────────────────────────────────┘
   发送按钮激活（蓝色）
```

### 3.3 Chat 面板 — AI 回复 & 思考过程

```
┌─────────────────────────────────────────────────────────┐
│ 用户：帮我分析这次跑步 App 的访谈结果，生成用户画像      │
├─────────────────────────────────────────────────────────┤
│ ◐ 思考中                                                │
│   ✓ 解析访谈逐字稿结构                                  │
│   ✓ 识别 3 位受访者的行为模式                           │
│   ✓ 提取核心动机与痛点                                  │
│   ◌ 生成用户画像卡片…                                   │
├─────────────────────────────────────────────────────────┤
│ AI：已完成用户画像分析：                                 │
│   · 识别到 3 类典型用户群体                              │
│   · 每类画像包含角色/目标/痛点/语录                      │
│   · 右侧已展示可视化画像卡片                             │
│                                                         │
│ ┌──────────────────────────────────────┐               │
│ │  🔍 Octo Insight                     │               │
│ │  AI用户画像.Insight                  │               │
│ │  Octo Insight · 访谈观点洞察         │               │
│ │  ─────────────────────────           │               │
│ │           查看详情  ›                │               │
│ └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 3.4 右侧 Canvas — 5 种可视化输出草图

---

**① InsightTableView（观点解析）**

```
┌──────────────────────────────────────────────────────────────┐
│  访谈观点解析表                          [下载] [保存] [分享] │
├──────────────┬────────────────┬────────┬──────────────────── │
│  访谈问题    │   用户观点     │ 场景   │  用户原声           │
├──────────────┼────────────────┼────────┼─────────────────────│
│ 您通常在什么 │ 倾向晨跑，     │ 户外   │ "天气好的时候就     │
│ 时间段跑步？ │ 避开通勤高峰   │ 公园   │  想出去跑一圈"      │
├──────────────┼────────────────┼────────┼─────────────────────│
│ 跑步时遇到   │ 配速不稳定，   │ 长距离 │ "跑到一半就不知道   │
│ 最大的挑战？ │ 不知何时补给   │ 赛事   │  该不该喝水了"      │
├──────────────┼────────────────┼────────┼─────────────────────│
│ ...（共 8行）│                │        │                     │
└──────────────┴────────────────┴────────┴─────────────────────┘
```

---

**② InsightOutlineMindMap（按提纲聚类）**

```
                    ┌──────────────┐
                    │  访谈核心主题  │
                    └──────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼                ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
   │  动机与目标  │  │  行为习惯   │  │  痛点障碍   │  │  需求期望   │
   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
         │               │               │               │
   ┌─────┴──────┐  ┌─────┴──────┐  ┌────┴───────┐  ┌────┴───────┐
   │ [健康管理]  │  │ [晨跑优先]  │  │ [配速不稳] │  │ [智能提醒] │
   │ [社交激励]  │  │ [固定路线]  │  │ [天气限制] │  │ [成就系统] │
   │ [个人成就]  │  │ [音乐伴跑]  │  │ [动力缺失] │  │ [社群互动] │
   └────────────┘  └────────────┘  └────────────┘  └────────────┘
   
   [ ] = 关键词标签（蓝色 pill 样式）
```

---

**③ InsightPersonaCard（AI 用户画像）**

```
┌──────────────────────────────────────────────────────────────┐
│     [ 小李 · 入门跑者 ]  [ 阿杰 · 社交跑者 ]  [ 老王 · 老将 ] │
│          ↑ 三卡并排，当前选中第一张                           │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│  👤  小李     24岁  · 产品经理      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  性格标签：[ 自律 ] [ 目标导向 ]    │
│                                     │
│  🎯 核心目标                        │
│     · 减重 10kg，提升身体状态       │
│     · 建立规律运动习惯              │
│                                     │
│  😤 主要痛点                        │
│     · 跑步节奏感差，容易放弃        │
│     · 缺乏科学训练计划引导          │
│                                     │
│  💬 用户语录                        │
│     "我需要有人告诉我今天该怎么跑"  │
└─────────────────────────────────────┘
```

---

**④ InsightLogicMindMap（思维导图三列）**

```
┌─────────────────┬──────────────────┬─────────────────────┐
│   🔍 核心发现    │   💡 用户期望     │   ✅ 关键结论        │
├─────────────────┼──────────────────┼─────────────────────┤
│                 │                  │                     │
│ ▸ 用户运动频次  │ ▸ 个性化配速建议 │ ▸ 初级用户最需要    │
│   集中在周末    │                  │   引导而非功能堆砌  │
│                 │ ▸ 社群激励机制   │                     │
│ ▸ 配速焦虑是    │                  │ ▸ 社交功能优先级    │
│   最高频痛点    │ ▸ 天气/路线推荐  │   应高于数据记录    │
│                 │                  │                     │
│ ▸ 社交驱动占    │ ▸ 成就徽章体系   │ ▸ "够用就好"是      │
│   用户动力 40%  │                  │   主流心理模型      │
│                 │ ▸ AI 训练计划    │                     │
│ ▸ ...           │ ▸ ...            │ ▸ ...               │
└─────────────────┴──────────────────┴─────────────────────┘
```

---

**⑤ InsightEvalQuestionTable（评估问题整理）**

```
┌───────────────────────────────────────────────────────────┐
│  评估问题整理                       [下载] [保存] [分享]   │
├────────────────────┬──────────────────────┬───────────────┤
│  任务名称          │  用户可用性问题/需求  │  用户原声      │
├────────────────────┼──────────────────────┼───────────────┤
│ [📋 注册登录任务]  │  用户未注意到隐私协  │ "这里要我同意  │
│                    │  议，直接点了跳过    │  什么？"       │
├────────────────────┼──────────────────────┼───────────────┤
│ [📋 配置训练计划]  │  步骤过多，完成率低  │ "我以为设置好  │
│                    │  于 30%              │  了，原来没有" │
├────────────────────┼──────────────────────┼───────────────┤
│ ...（共 8 行）     │                      │               │
└────────────────────┴──────────────────────┴───────────────┘
  任务名称 = 蓝色标签样式（bg-[#f0f5ff] text-[#1476ff]）
  用户原声 = 斜体引用样式
```

---

## 四、任务拆解与执行顺序

### Phase 1 — 数据层（必须最先完成，影响所有后续任务）

> **风险最高**：漏补映射会导致运行时崩溃

**Task 1.1：扩展 WorkflowType**

```typescript
// 在 WorkflowType 类型定义处追加
export type WorkflowType =
  | 'ui-design' | 'demo' | 'creative' | 'research' | 'interview'
  | 'insight-viewpoint'      // 观点解析
  | 'insight-outline'        // 按提纲聚类
  | 'insight-persona'        // AI 用户画像
  | 'insight-mindmap'        // 思维导图
  | 'insight-eval-question'; // 评估问题整理
```

**Task 1.2：补全 7 处全量映射**

每个新增 WorkflowType 必须在以下 7 处补充，以 `insight-persona` 为示例：

| Record | 补充内容 |
|--------|---------|
| `INTENT_RULES` | `'insight-persona': []` |
| `WORKFLOW_INTENT_META` | `label: 'AI用户画像', color: '#6d28d9', bg: '#f5f3ff', border: '#ede9fe'` |
| `WORKFLOW_META` | `badge: 'Octo Insight', fileLabel: 'AI用户画像.Insight', accentClass: 'from-[#6d28d9] to-[#8b5cf6]'` |
| `WORKFLOW_ARTIFACTS` | `badge: 'Octo Insight', Icon: Users, iconColor: '#6d28d9', iconBg: '#f5f3ff'` |
| `CODE_SNIPPETS` | `// AI用户画像 Mock 数据` |
| `CanvasSkeleton.labels` | `'正在生成用户画像…'` |
| `WORKFLOW_TO_AGENT` | `'research'` |

**Task 1.3：新增映射常量**

```typescript
const INSIGHT_SUB_OPTIONS = ['观点解析', '按提纲聚类', 'AI用户画像', '思维导图'];

const INSIGHT_SUB_TO_WF: Record<string, WorkflowType> = {
  '观点解析':   'insight-viewpoint',
  '按提纲聚类': 'insight-outline',
  'AI用户画像': 'insight-persona',
  '思维导图':   'insight-mindmap',
};

const RESEARCH_OPTION_TO_WF: Partial<Record<string, WorkflowType>> = {
  '评估问题整理': 'insight-eval-question',
};

const WF_TO_INSIGHT_SUB: Partial<Record<WorkflowType, string>> = {
  'insight-viewpoint':      '观点解析',
  'insight-outline':        '按提纲聚类',
  'insight-persona':        'AI用户画像',
  'insight-mindmap':        '思维导图',
  'insight-eval-question':  '评估问题整理',
};
```

**Task 1.4：更新 RESEARCH_OPTIONS**

```typescript
// Before
const RESEARCH_OPTIONS = ['深度研究', '访谈观点洞察', '模拟用户访谈'];

// After
const RESEARCH_OPTIONS = ['访谈观点洞察', '评估问题整理', '用研知识问答'];
```

**Task 1.5：扩展 SendPayloadOptions**

```typescript
interface SendPayloadOptions {
  hasDesignAttachment?: boolean;
  creativePayload?: CanvaSubmissionPayload;
  insightSubOption?: string;    // 访谈观点洞察的三级子选项名称
  researchWf?: WorkflowType;    // 非访谈观点洞察时的目标 WorkflowType
}
```

---

### Phase 2 — ChatComposer 交互层

**Task 2.1：insightSubOption 状态**

```typescript
// ChatComposer 组件内新增
const [insightSubOption, setInsightSubOption] = useState(INSIGHT_SUB_OPTIONS[0]);
// 默认值 '观点解析'，切换 researchOption 时重置
```

**Task 2.2：研究选项下拉菜单升级（核心交互）**

```
交互规格：
- 点击 [访谈观点洞察/观点解析 ▾] 按钮 → 向上弹出一级菜单
- 一级菜单包含 3 个选项
- hover 到"访谈观点洞察"时 → 右侧 4px 间距处弹出二级面板
- 二级面板包含 4 个子选项，点击任意子选项 → 选中 + 关闭所有菜单
- 点击"评估问题整理"或"用研知识问答"→ 直接选中 + 关闭（无二级）
```

**Task 2.3：主按钮文本回显逻辑**

```typescript
// 按钮 label 计算
const researchButtonLabel = researchOption === '访谈观点洞察'
  ? `访谈观点洞察/${insightSubOption}`
  : researchOption;
```

**Task 2.4：Placeholder 分支**

```typescript
placeholder={
  selectedSkills.length > 0 ? '' :
  agent === 'research' && researchOption === '访谈观点洞察'
    ? '上传访谈逐字稿、访谈大纲、智能构建用户画像等……' :
  agent === 'research' && researchOption === '评估问题整理'
    ? '上传评估任务书、逐字稿，智能整理问题观点' :
  agent === 'research' && researchOption === '用研知识问答'
    ? '描述你的研究问题，AI 将基于已有知识库作答……' :
  agent === 'creative' ? '描述图片主体、风格、构图和氛围…' :
  '描述你想生成的内容，输入 / 唤起技能，或通过 + 上传文件…'
}
```

**Task 2.5：发送按钮禁用逻辑**

```typescript
const needsUpload = agent === 'research'
  && (researchOption === '访谈观点洞察' || researchOption === '评估问题整理')
  && attachments.length === 0;

// canSend 增加此条件
const canSend = (draft.trim().length > 0 || attachments.length > 0 || ...) && !needsUpload;

// tooltip 文案
const sendDisabledHint = researchOption === '评估问题整理'
  ? '请先上传评估任务书和逐字稿'
  : '请先上传访谈逐字稿和大纲';
```

**Task 2.6：handleSubmit 组装 payload**

```typescript
const insightSub = agent === 'research' && researchOption === '访谈观点洞察'
  ? insightSubOption : undefined;
const researchWf = agent === 'research' && researchOption !== '访谈观点洞察'
  ? RESEARCH_OPTION_TO_WF[researchOption] : undefined;

onSend(composed, { hasDesignAttachment, insightSubOption: insightSub, researchWf });
```

---

### Phase 3 — handleSend 数据流

**Task 3.1：首条消息路由**

```typescript
// onStartConversation 签名扩展（如需）
// 首条消息使用 researchWf 或 insight 子 WorkflowType
const targetWf = options?.researchWf
  ?? (options?.insightSubOption ? INSIGHT_SUB_TO_WF[options.insightSubOption] : null)
  ?? resolvedMode;

if (msgs.length === 0) {
  onStartConversation(content, targetWf);
  return;
}
```

**Task 3.2：后续消息 AI 思考步骤**

为 5 个新 WorkflowType 分别在 `generateAIResponse` 中添加专用思考步骤：

| WorkflowType | 思考步骤示例（3-4 条） |
|---|---|
| insight-viewpoint | 解析访谈结构 → 提取用户观点 → 按维度归类 → 生成解析表 |
| insight-outline | 识别提纲层级 → 按主题聚类 → 标注关键词 → 生成导图 |
| insight-persona | 分析行为模式 → 构建用户群 → 生成画像卡片 |
| insight-mindmap | 抽取核心发现 → 归纳期望 → 提炼结论 |
| insight-eval-question | 解析任务列表 → 匹配问题 → 关联用户原声 |

---

### Phase 4 — Canvas 可视化组件

> **工作量最大**，每个组件独立实现，互不依赖，可并行

**通用样式规范**：
- 主色：紫色体系 `#6d28d9` / `#8b5cf6`
- 容器：`rounded-[16px] border border-[#ede9fe] bg-white`
- 表头：`bg-[#f5f3ff] text-[#6d28d9] text-[12px] font-semibold`
- 标签 pill：`bg-[#f0f5ff] text-[#1476ff] rounded-full px-2 py-0.5 text-[11px]`
- 用户原声：`italic text-[#6b7280]`
- 工具栏：右上角固定 [下载] [保存至项目资产] [分享] 三按钮

---

**Task 4.1：InsightTableView**

```
Props: 无（Mock 数据内置）
表头: 访谈问题 / 用户观点 / 场景主体 / 用户原声（4列）
行数: 8 行 Mock
特性:
  - overflow-x: auto（移动端横向滚动）
  - min-w-[600px]
  - 用户原声列 italic 斜体
  - 每行 hover 高亮 bg-[#faf5ff]
```

**Task 4.2：InsightOutlineMindMap**

```
Props: 无（Mock 数据内置）
布局: 中心节点 + 4 分支（flex 水平排布）
特性:
  - 中心节点: 渐变背景 from-[#6d28d9] to-[#8b5cf6]，圆角矩形
  - 分支连线: SVG path 或 border-based 线条
  - 每分支标题: 深紫色 text-[#6d28d9]
  - 关键词标签: pill 样式，每分支 3-4 个
  - 整体居中，留白充足
```

**Task 4.3：InsightPersonaCard**

```
Props: 无（Mock 数据内置）
布局: 顶部 Tab 切换（小李/阿杰/老王）+ 卡片内容区
卡片字段:
  - 头像（用 emoji 或渐变色 Avatar 占位）
  - 姓名 + 年龄 + 职业
  - 性格标签（pill 列表）
  - 核心目标（bullet list）
  - 主要痛点（bullet list，红色前缀点）
  - 用户语录（引用块样式，紫色左边框）
特性:
  - Tab 切换带 motion 滑动动画
  - 卡片整体圆角阴影
```

**Task 4.4：InsightLogicMindMap**

```
Props: 无（Mock 数据内置）
布局: 三列等宽，顶部图标+标题，内容 bullet list
列定义:
  - 🔍 核心发现（灰色背景列）
  - 💡 用户期望（浅黄背景列）
  - ✅ 关键结论（浅绿背景列）
每列: 4-5 条 bullet 条目
特性:
  - 列间分割线
  - 条目 hover 轻微高亮
```

**Task 4.5：InsightEvalQuestionTable**

```
Props: 无（Mock 数据内置）
表头: 任务名称 / 用户可用性问题或需求 / 用户原声（3列）
行数: 8 行 Mock
特性:
  - 任务名称: 蓝色标签样式 bg-[#f0f5ff] text-[#1476ff]
  - 同一任务的多行合并视觉（左侧任务列相同时显示竖线）
  - 用户原声: italic + 引号包裹
  - 表格可横向滚动
```

---

### Phase 5 — Canvas 路由接入

```typescript
// PreviewStage 组件内，在现有 research/interview 路由后追加：
{workflow === 'insight-viewpoint'     && <InsightTableView ... />}
{workflow === 'insight-outline'       && <InsightOutlineMindMap ... />}
{workflow === 'insight-persona'       && <InsightPersonaCard ... />}
{workflow === 'insight-mindmap'       && <InsightLogicMindMap ... />}
{workflow === 'insight-eval-question' && <InsightEvalQuestionTable ... />}
```

---

## 五、Demo 演示流程设计

> 完整演示路径（约 3 分钟）

```
Step 1  选择模式
        ─────────────────────────────────────────────────
        用户点击 [通用问答 ▾] → 切换为 [Octo Insight]
        右侧工具栏模式标签同步变更

Step 2  选择分析类型
        ─────────────────────────────────────────────────
        点击 [访谈观点洞察 ▾]
        弹出一级菜单 → hover 到"访谈观点洞察"
        右侧弹出二级子菜单 → 点击"AI 用户画像"
        按钮变为 [访谈观点洞察/AI用户画像]

Step 3  上传文件触发解锁
        ─────────────────────────────────────────────────
        发送按钮为灰色，hover 显示 tooltip
        点击 [@] 选择文件 / 点击 [+] 上传文件
        文件标签出现后，发送按钮变蓝激活

Step 4  发送 & 思考过程
        ─────────────────────────────────────────────────
        输入："帮我基于这次跑步 App 用研，生成用户画像"
        点击发送 → Chat 面板出现用户消息气泡
        AI 开始思考：依次出现 3 条思考步骤（逐步渐入）
        思考结束 → 出现 AI 回复文本 + Insight 结果卡片

Step 5  右侧 Canvas 展示
        ─────────────────────────────────────────────────
        InsightPersonaCard 渐入展示
        顶部 Tab 显示 3 位受访者姓名
        可点击切换不同画像

Step 6  切换其他子功能（可选演示）
        ─────────────────────────────────────────────────
        重新点击选择器 → 改为"观点解析"
        重新发送 → 右侧切换为 InsightTableView

Step 7  评估问题整理支线
        ─────────────────────────────────────────────────
        切换为 [评估问题整理]
        上传评估任务书 + 发送
        右侧展示 InsightEvalQuestionTable
```

---

## 六、执行 Checklist

### Phase 1 — 数据层

- [ ] 1.1 WorkflowType 添加 5 个新类型
- [ ] 1.2 INTENT_RULES 补充 5 个空数组条目
- [ ] 1.2 WORKFLOW_INTENT_META 补充 5 条
- [ ] 1.2 WORKFLOW_META 补充 5 条
- [ ] 1.2 WORKFLOW_ARTIFACTS 补充 5 条
- [ ] 1.2 CODE_SNIPPETS 补充 5 条
- [ ] 1.2 CanvasSkeleton.labels 补充 5 条
- [ ] 1.2 WORKFLOW_TO_AGENT 补充 5 条（均为 `'research'`）
- [ ] 1.3 新增 INSIGHT_SUB_OPTIONS / INSIGHT_SUB_TO_WF / RESEARCH_OPTION_TO_WF / WF_TO_INSIGHT_SUB
- [ ] 1.4 RESEARCH_OPTIONS 替换为新三项
- [ ] 1.5 SendPayloadOptions 扩展两个字段

### Phase 2 — ChatComposer

- [ ] 2.1 insightSubOption state
- [ ] 2.2 二级子菜单 hover 展开 UI
- [ ] 2.3 主按钮文本回显
- [ ] 2.4 Placeholder 三分支
- [ ] 2.5 发送按钮禁用 + tooltip
- [ ] 2.6 handleSubmit payload 组装

### Phase 3 — handleSend

- [ ] 3.1 首条消息 WorkflowType 路由
- [ ] 3.2 generateAIResponse 扩展 5 个 case
- [ ] 3.2 collectPromptHighlights 扩展
- [ ] 3.2 generateFollowUpCopy leadMap/detailMap 扩展

### Phase 4 — Canvas 组件

- [ ] 4.1 InsightTableView（观点解析）
- [ ] 4.2 InsightOutlineMindMap（按提纲聚类）
- [ ] 4.3 InsightPersonaCard（AI用户画像）
- [ ] 4.4 InsightLogicMindMap（思维导图三列）
- [ ] 4.5 InsightEvalQuestionTable（评估问题整理）

### Phase 5 — 路由接入

- [ ] 5.1 PreviewStage 补充 5 条 workflow 路由

---

## 七、设计规范速查

```
主色调   #6d28d9 (深紫)  / #8b5cf6 (中紫)
浅背景   #f5f3ff         / #ede9fe (边框)
强调蓝   #1476ff         / #f0f5ff (浅蓝背景标签)
文字     #191919 (主)    / #6b7280 (次)  / #9ca3af (占位)
成功绿   #10b981         警示红  #ef4444

组件圆角     rounded-xl (12px)  / rounded-2xl (16px)
卡片阴影     shadow-[0_4px_16px_rgba(109,40,217,0.08)]
过渡动画     duration-200 ease-out
思考步骤间距 700ms / 560ms（Canvas 类）
```

---

*规划书版本：v1.0 | 生成日期：2026-04-22*
