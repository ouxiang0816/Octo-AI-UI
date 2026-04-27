# Octo-Client-Shell 模块化拆解规划书

> 版本：v1.0
> 日期：2026-04-23
> 目标：通过明确的框架结构梳理清楚整个项目的文件层级和依赖关系，确保后续迭代可控

---

## 一、项目现状概览（Before）

### 1.1 整体结构

```
octo-client-shell/
├── src/
│   ├── App.tsx                    # 69行 根组件：hash路由 + 全局搜索 + ClientShell委派
│   ├── main.tsx                   # 入口文件
│   ├── index.css                  # Tailwind 4 全局样式
│   ├── assets/                    # 静态资源（图片、图标、壁纸）
│   ├── components/                # 通用组件（仅有4个，严重不足）
│   │   ├── AIAssistantPanel.tsx
│   │   ├── GlobalSearchModal.tsx
│   │   ├── StarBorder.tsx
│   │   └── StarBorder.css
│   ├── data/                      # 数据层（持久化逻辑 + Mock数据混合）
│   │   ├── project-assets-data.ts
│   │   ├── prototype-component-links.ts
│   │   ├── shared-artifacts.ts
│   │   └── skill-market-data.ts
│   ├── features/                  # 特性模块（边界模糊）
│   │   ├── assets/
│   │   │   ├── AssetsPanel.tsx    # 1935行
│   │   │   └── mock-data.ts
│   │   ├── shared/
│   │   │   └── SharedArtifactView.tsx
│   │   └── vibe/
│   │       ├── BeamsBackground.tsx
│   │       ├── CollabJoinView.tsx
│   │       ├── PublishedView.tsx
│   │       ├── canvases.tsx       # 777行
│   │       ├── mock-data.ts
│   │       ├── modals.tsx
│   │       ├── panels.tsx
│   │       ├── storage.ts
│   │       ├── types.ts
│   │       └── utils.ts
│   ├── layout/                    # 布局
│   │   ├── ClientShell.tsx        # 3327行 主布局壳（职责过重）
│   │   └── MacMenuBar.tsx         # 未使用
│   ├── lib/                       # 工具库
│   │   └── octoMakeApi.ts         # API抽象层（Mock/真实后端桥接）
│   ├── pages/                     # 页面
│   │   ├── OctoBuild.tsx          # 7959行 AI能力工作台（最大模块）
│   │   ├── VibeDesign.tsx         # 1963行 对话式Demo生成
│   │   ├── VersionDelivery.tsx    # 1649行 版本交付管理
│   │   ├── AssetsPanelSketch.html
│   │   └── DemoPublishedView.tsx
│   └── vite-env.d.ts
├── scripts/
│   └── export-single-html.mjs
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

### 1.2 关键文件行数统计

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/pages/OctoBuild.tsx` | **7,959** | 意图识别 + 10种工作流UI + Canvas系统 + 消息系统 + 状态管理 + 导出逻辑 |
| `src/layout/ClientShell.tsx` | **3,327** | 侧边栏导航 + 会话管理 + 技能市场 + 知识库 + 个人技能 |
| `src/pages/VibeDesign.tsx` | **1,963** | 对话式Demo生成 + 4页签面板 + 画布预览 |
| `src/features/assets/AssetsPanel.tsx` | **1,935** | 资产库主面板 + 6大领域Tab + 项目资产管理 |
| `src/pages/VersionDelivery.tsx` | **1,649** | 版本交付 + 需求管理 + 文件浏览 + 内嵌OctoBuild/VibeDesign |
| `src/features/vibe/canvases.tsx` | **777** | Vibe可交互Canvas组件集 |
| `src/lib/octoMakeApi.ts` | **285** | API抽象层 + Mock数据 + Figma解析 + 流式生成 |
| `src/data/skill-market-data.ts` | **352** | 技能市场数据 + localStorage读写 |
| `src/App.tsx` | **69** | 根组件 + hash路由 + 全局搜索 |

### 1.3 现有依赖关系图

```
App.tsx
  |-- ClientShell.tsx
  |     |-- OctoBuild.tsx (7959行)
  |     |     |-- data/skill-market-data.ts
  |     |     |-- data/prototype-component-links.ts
  |     |     |-- data/project-assets-data.ts
  |     |     |-- data/shared-artifacts.ts
  |     |     |-- features/assets/mock-data.ts
  |     |     |-- lib/octoMakeApi.ts
  |     |     +-- components/StarBorder.tsx
  |     |-- AssetsPanel.tsx (1935行)
  |     |     +-- data/prototype-component-links.ts
  |     +-- [内部大量局部组件、类型、工具函数]
  |-- GlobalSearchModal.tsx
  +-- SharedArtifactView.tsx

VersionDelivery.tsx
  |-- AIAssistantPanel.tsx
  |-- VibeDesign.tsx
  |     +-- features/vibe/* (全部)
  +-- OctoBuild.tsx

VibeDesign.tsx
  |-- features/vibe/canvases.tsx
  |-- features/vibe/panels.tsx
  |-- features/vibe/modals.tsx
  |-- features/vibe/storage.ts
  |-- features/vibe/utils.ts
  +-- features/vibe/mock-data.ts
```

---

## 二、核心问题诊断

### 2.1 文件过大，职责混杂（Big Files Anti-Pattern）

- **OctoBuild.tsx (7959行)** = 意图识别引擎 + 10种工作流定义 + AI响应生成器 + 消息系统 + Canvas渲染分发 + 导出工具函数 + 局部UI组件
- **ClientShell.tsx (3327行)** = 侧边栏导航 + 拖拽调整宽度 + 项目选择器 + 会话CRUD + 技能市场UI + 知识库UI + 个人技能树 + Markdown编辑器

这些文件违背了单一职责原则，任何一个小改动都需要在接近万行的文件中定位，极易引入回归问题。

### 2.2 边界模糊，交叉引用混乱

- `data/` 目录同时承担持久化逻辑和Mock数据定义两个职责
- `features/assets/mock-data.ts` 被 `OctoBuild.tsx` 和 `AssetsPanel.tsx` 同时引用
- `data/skill-market-data.ts` 被 `ClientShell.tsx` 和 `OctoBuild.tsx` 同时引用
- 类型定义散落在各业务文件中，没有统一的类型层

### 2.3 可复用组件严重不足

- `components/` 目录仅有 4 个组件，且 `MacMenuBar.tsx` 完全未使用
- 大量通用的 UI 模式（Modal、Toast、Dropdown、SearchInput、FileTree 等）全部以内联方式写在页面文件中
- 同样的按钮样式、卡片样式、头部工具栏在多个文件中重复出现

### 2.4 工作流硬编码，扩展困难

- 10种工作流全部硬编码在 `OctoBuild.tsx` 中，通过巨型 switch 语句分发
- 每种工作流的元数据、AI响应、Canvas组件三者耦合
- 新增一种工作流需要修改 `OctoBuild.tsx` 的多个不相邻区域

### 2.5 Mock 数据与业务逻辑耦合

- `lib/octoMakeApi.ts` 中 `USE_MOCK` 判断与业务逻辑混写
- `generateAIResponse` 函数直接内联了所有 Mock 的 thinking lines 和回复文本
- `data/` 目录的持久化函数与数据结构定义混在一起

---

## 三、目标架构设计（After）

### 3.1 设计原则

1. **按业务域拆分模块**：每个模块有明确的职责边界，对外暴露有限的接口
2. **框架层与业务层分离**：`framework/` 提供可复用的 UI 组件和交互模式
3. **核心基础设施下沉**：`core/` 统一处理路由、存储、API、事件总线
4. **Mock 数据层独立**：`mocks/` 集中管理所有模拟数据和模拟服务
5. **类型驱动开发**：`types/` 统一定义所有领域模型，被上层模块引用

### 3.2 目标文件结构

```
octo-client-shell/src/
│
├── main.tsx                       # 入口（保持不变）
├── App.tsx                        # 根组件（精简为路由壳）
├── index.css                      # 全局样式（保持不变）
├── vite-env.d.ts
│
├── core/                          # 核心基础设施层
│   ├── router/
│   │   ├── index.ts               # hash路由 + 导航守卫
│   │   └── routes.ts              # 路由表定义
│   ├── storage/
│   │   ├── localStorage.ts        # localStorage 封装（带异常处理）
│   │   ├── keys.ts                # 所有 storage key 常量集中管理
│   │   └── sync.ts                # CustomEvent + storage 事件同步
│   ├── api/
│   │   ├── client.ts              # fetch 封装 + 拦截器
│   │   ├── figma.ts               # Figma URL 解析
│   │   ├── ai-stream.ts           # AI 流式生成接口
│   │   └── svg.ts                 # HTML 转 SVG
│   ├── state/
│   │   ├── useNav.ts              # 导航状态
│   │   ├── useSearch.ts           # 全局搜索状态
│   │   └── useToast.ts            # 全局 Toast 通知
│   └── event-bus.ts               # 跨模块事件总线
│
├── framework/                     # 公共UI框架层
│   ├── layout/
│   │   ├── ShellLayout.tsx        # 左侧导航 + 右侧内容区 壳布局
│   │   ├── ResizableSidebar.tsx   # 可拖拽调整宽度的侧边栏
│   │   ├── NavItem.tsx            # 导航项
│   │   └── TopBar.tsx             # 顶部工具栏
│   ├── input/
│   │   ├── SearchInput.tsx        # 搜索输入框
│   │   ├── Composer.tsx           # 对话输入框
│   │   └── Dropdown.tsx           # 下拉选择器
│   ├── feedback/
│   │   ├── Modal.tsx              # 通用弹窗
│   │   ├── Toast.tsx              # 轻量提示
│   │   ├── ConfirmDialog.tsx      # 确认对话框
│   │   └── EmptyState.tsx         # 空状态
│   ├── display/
│   │   ├── FileTree.tsx           # 文件树
│   │   ├── MarkdownViewer.tsx     # Markdown 预览
│   │   ├── CodeEditor.tsx         # 代码编辑器
│   │   ├── StatusBadge.tsx        # 状态徽章
│   │   └── LoadingDots.tsx        # 加载动画
│   ├── data/
│   │   ├── DataTable.tsx          # 表格
│   │   ├── CardGrid.tsx           # 卡片网格
│   │   └── TabPanel.tsx           # 页签面板
│   └── index.ts
│
├── types/                         # 统一类型层
│   ├── workflow.ts                # WorkflowType 及所有工作流相关类型
│   ├── chat.ts                    # 消息、会话类型
│   ├── skill.ts                   # 技能市场、个人技能类型
│   ├── asset.ts                   # 资产库类型
│   ├── project.ts                 # 项目、版本、领域类型
│   ├── insight.ts                 # Octo Insight 相关类型
│   └── index.ts
│
├── mocks/                         # Mock 数据层
│   ├── data/
│   │   ├── skill-market.ts        # 技能市场默认数据
│   │   ├── assets.ts              # 资产库默认数据
│   │   ├── personal-skills.ts     # 个人技能默认数据
│   │   ├── project-assets.ts      # 项目资产默认数据
│   │   ├── conversations.ts       # 会话初始数据
│   │   └── vibe/                  # Vibe 模块 Mock 数据
│   ├── services/
│   │   ├── ai-response.ts         # generateAIResponse 迁移至此
│   │   ├── intent-engine.ts       # 意图识别引擎（Mock模式）
│   │   └── demo-stream.ts         # Demo 流式生成 Mock
│   └── index.ts
│
├── modules/                       # 业务模块层
│   ├── shell/                     # 应用外壳模块
│   │   ├── Shell.tsx
│   │   ├── hooks/
│   │   │   ├── useSidebar.ts
│   │   │   └── useConversations.ts
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ProjectSelector.tsx
│   │   │   └── NavFooter.tsx
│   │   └── index.ts
│   ├── skill-market/              # 技能市场模块
│   │   ├── types.ts
│   │   ├── store.ts
│   │   ├── components/
│   │   │   ├── SkillMarketPanel.tsx
│   │   │   ├── SkillCategoryFilter.tsx
│   │   │   ├── SkillCard.tsx
│   │   │   └── SkillDetail.tsx
│   │   └── index.ts
│   ├── knowledge-base/            # 知识库模块
│   │   ├── store.ts
│   │   ├── components/
│   │   │   ├── KnowledgeBasePanel.tsx
│   │   │   ├── AssetTabNav.tsx
│   │   │   ├── AssetDocCard.tsx
│   │   │   ├── AssetUploader.tsx
│   │   │   └── ProjectAssetTree.tsx
│   │   └── index.ts
│   ├── personal-skills/           # 个人技能模块
│   │   ├── store.ts
│   │   ├── components/
│   │   │   ├── PersonalSkillPanel.tsx
│   │   │   ├── SkillPackageCard.tsx
│   │   │   ├── SkillFileTree.tsx
│   │   │   └── SkillFileEditor.tsx
│   │   └── index.ts
│   ├── octo-build/                # Octo Build AI 工作台模块
│   │   ├── OctoBuild.tsx
│   │   ├── types.ts
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── useWorkflow.ts
│   │   │   └── useCanva.ts
│   │   ├── services/
│   │   │   ├── intent-engine.ts
│   │   │   ├── prompt-builder.ts
│   │   │   └── follow-up.ts
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── ThinkingBlock.tsx
│   │   │   ├── ComposerBar.tsx
│   │   │   ├── WorkflowBadge.tsx
│   │   │   └── ResultWorkspace.tsx
│   │   ├── canvases/
│   │   │   ├── CanvasRouter.tsx
│   │   │   ├── ui-design/
│   │   │   │   ├── UIDesignCanvas.tsx
│   │   │   │   └── ImageViewer.tsx
│   │   │   ├── demo/
│   │   │   │   ├── DemoCanvas.tsx
│   │   │   │   └── DevicePreview.tsx
│   │   │   ├── creative/
│   │   │   │   ├── CreativeCanvas.tsx
│   │   │   │   ├── ImageGenPanel.tsx
│   │   │   │   ├── VideoGenPanel.tsx
│   │   │   │   └── ImageEditPanel.tsx
│   │   │   ├── research/
│   │   │   │   └── CompetitiveAnalysisCanvas.tsx
│   │   │   ├── interview/
│   │   │   │   └── InterviewCanvas.tsx
│   │   │   └── insight/
│   │   │       ├── InsightViewpointTable.tsx
│   │   │       ├── InsightOutlineMindMap.tsx
│   │   │       ├── InsightPersonaCard.tsx
│   │   │       ├── InsightLogicMindMap.tsx
│   │   │       └── InsightEvalQuestionTable.tsx
│   │   └── index.ts
│   ├── octo-insight/              # Octo Insight 工作流逻辑模块
│   │   ├── index.ts
│   │   ├── workflows.ts
│   │   └── mock-data.ts
│   ├── vibe-design/               # Vibe Design 模块
│   │   ├── VibeDesign.tsx
│   │   ├── types.ts
│   │   ├── store.ts
│   │   ├── hooks/
│   │   │   ├── useVibeChat.ts
│   │   │   └── useCanvasVersions.ts
│   │   ├── components/
│   │   │   ├── VibeChatPanel.tsx
│   │   │   ├── VibeCanvasPreview.tsx
│   │   │   └── VibeToolbar.tsx
│   │   ├── canvases/
│   │   │   └── index.tsx
│   │   ├── panels/
│   │   │   ├── AssetsTab.tsx
│   │   │   ├── ResearchTab.tsx
│   │   │   ├── SkillsTab.tsx
│   │   │   └── MentionPanel.tsx
│   │   ├── modals/
│   │   │   ├── PixImportModal.tsx
│   │   │   ├── PublishModal.tsx
│   │   │   └── SharePanel.tsx
│   │   └── index.ts
│   ├── version-delivery/          # 版本交付模块
│   │   ├── VersionDelivery.tsx
│   │   ├── context.ts
│   │   ├── components/
│   │   │   ├── RequirementList.tsx
│   │   │   ├── AssetMatcher.tsx
│   │   │   ├── FileBrowser.tsx
│   │   │   └── DeliveryTimeline.tsx
│   │   └── index.ts
│   ├── shared-artifact/           # 分享产物查看模块
│   │   ├── SharedArtifactView.tsx
│   │   └── index.ts
│   └── global-search/             # 全局搜索模块
│       ├── GlobalSearchModal.tsx
│       ├── hooks/
│       │   └── useSearchIndex.ts
│       └── index.ts
│
├── pages/                         # 页面层（精简为组合层）
│   ├── HomePage.tsx
│   └── SharePage.tsx
│
└── utils/                         # 通用工具函数
    ├── html-export.ts
    ├── dom.ts
    ├── string.ts
    └── index.ts
```

---

## 四、Before / After 核心对比表

| 维度 | Before（现状） | After（目标） | 改进说明 |
|------|---------------|--------------|---------|
| **最大文件** | OctoBuild.tsx **7,959行** | OctoBuild.tsx **< 300行**（仅容器） | 按工作流拆分为独立子模块，每个 Canvas < 500行 |
| **第二文件** | ClientShell.tsx **3,327行** | Shell.tsx **< 200行**（仅组合） | 拆分为 shell/skill-market/knowledge-base/personal-skills 四个模块 |
| **通用组件** | 4个（components/） | 20+个（framework/） | 提取 Modal、Toast、SearchInput、FileTree、Composer 等高频组件 |
| **类型定义** | 散落在各业务文件中 | 统一在 `types/` 目录 | 类型驱动，消除重复定义 |
| **Mock数据** | 与业务逻辑混写 | 独立在 `mocks/` 目录 | `mocks/services/` 提供 Mock 服务，业务代码无感知切换 |
| **API层** | 单个文件 octoMakeApi.ts | `core/api/` 拆分4个文件 | Figma、AI Stream、SVG 转换职责分离 |
| **工作流扩展** | 修改 OctoBuild.tsx 多个区域 | 在 `canvases/` 新增目录 | 新增工作流只需：加类型 + 加 Mock 数据 + 加 Canvas 组件 |
| **Storage Key** | 散落在各文件 | 集中在 `core/storage/keys.ts` | 避免命名冲突，便于迁移清理 |
| **跨模块通信** | 多处 CustomEvent | 统一 `core/event-bus.ts` | 事件名常量集中，便于追踪和调试 |
| **状态管理** | useState/useContext 散落 | `core/state/` + 各模块 store.ts | 轻量封装，保持不引入 Redux 的约定 |

---

## 五、模块依赖关系设计（After）

### 5.1 分层依赖规则

```
+---------------------------------------------+
|  pages/  (页面组合层，只依赖 modules/)         |
+---------------------------------------------+
|  modules/ (业务模块层，可依赖 framework/ + core/ + types/ + mocks/)
+---------------------------------------------+
|  framework/ (UI框架层，只依赖 core/ + types/)  |
+---------------------------------------------+
|  core/ (基础设施层，只依赖 types/ + utils/)    |
+---------------------------------------------+
|  types/ (类型层，无依赖)                       |
|  mocks/ (Mock层，只依赖 types/)               |
|  utils/ (工具层，无依赖)                       |
+---------------------------------------------+
```

**核心规则**：
- **下层不能依赖上层**：`core/` 不能 import `modules/` 或 `framework/`
- **同层尽量隔离**：`modules/skill-market/` 不应直接 import `modules/octo-build/` 的内部文件，应通过 `core/event-bus` 或 props 通信
- **类型先行**：所有模块共享 `types/` 中的定义，避免各自定义导致不一致

### 5.2 关键模块依赖图

```
App.tsx
  |-- pages/HomePage.tsx
  |     +-- modules/shell/Shell.tsx
  |           |-- framework/layout/ShellLayout.tsx
  |           |-- modules/shell/components/Sidebar.tsx
  |           |     |-- modules/skill-market/components/SkillMarketPanel.tsx
  |           |     |-- modules/knowledge-base/components/KnowledgeBasePanel.tsx
  |           |     +-- modules/personal-skills/components/PersonalSkillPanel.tsx
  |           +-- modules/octo-build/OctoBuild.tsx
  |                 |-- modules/octo-build/components/ChatPanel.tsx
  |                 +-- modules/octo-build/canvases/CanvasRouter.tsx
  |                       |-- modules/octo-build/canvases/ui-design/UIDesignCanvas.tsx
  |                       |-- modules/octo-build/canvases/demo/DemoCanvas.tsx
  |                       |-- modules/octo-build/canvases/creative/CreativeCanvas.tsx
  |                       +-- modules/octo-build/canvases/insight/*.tsx
  |-- modules/global-search/GlobalSearchModal.tsx
  +-- modules/shared-artifact/SharedArtifactView.tsx

modules/version-delivery/VersionDelivery.tsx
  |-- modules/octo-build/OctoBuild.tsx
  +-- modules/vibe-design/VibeDesign.tsx
```

---

## 六、分阶段迁移计划

### Phase 1：基础设施准备（1-2天）

**目标**：建立新目录结构，迁移无风险的基础代码

1. **创建目录骨架**
   - 创建 `core/`、`framework/`、`types/`、`mocks/`、`modules/`、`utils/` 目录
2. **提取统一类型层**
   - 从 `OctoBuild.tsx`、`ClientShell.tsx`、`AssetsPanel.tsx` 中抽离类型定义到 `types/`
   - 建立 `types/workflow.ts`、`types/chat.ts`、`types/skill.ts`、`types/asset.ts`
3. **建立 Storage 基础设施**
   - 创建 `core/storage/keys.ts`，汇总所有 localStorage key
   - 创建 `core/storage/localStorage.ts` 封装读写
   - 创建 `core/storage/sync.ts` 封装跨标签同步
4. **建立 API 基础设施**
   - 将 `lib/octoMakeApi.ts` 拆分为 `core/api/client.ts`、`figma.ts`、`ai-stream.ts`、`svg.ts`
   - 将 `USE_MOCK` 判断逻辑封装到 `mocks/index.ts`
5. **建立事件总线**
   - 创建 `core/event-bus.ts`，将散落各处的 CustomEvent 事件名集中管理

### Phase 2：公共框架层建设（2-3天）

**目标**：提取高频可复用组件，消除代码重复

1. **布局组件**
   - 从 `ClientShell.tsx` 提取 `ResizableSidebar.tsx`
   - 提取 `ShellLayout.tsx`、`TopBar.tsx`
2. **输入组件**
   - 从 `OctoBuild.tsx` 提取 `Composer.tsx`（底部输入栏）
   - 从 `ClientShell.tsx`、`AssetsPanel.tsx` 提取 `SearchInput.tsx`
3. **反馈组件**
   - 从 `OctoBuild.tsx` 提取 `Modal.tsx`、`Toast.tsx`
   - 从各处提取 `ConfirmDialog.tsx`
4. **展示组件**
   - 从 `ClientShell.tsx` 提取 `FileTree.tsx`
   - 从 `ClientShell.tsx` 提取 `MarkdownViewer.tsx`、`CodeEditor.tsx`
   - 从 `OctoBuild.tsx` 提取 `LoadingDots.tsx`
5. **数据组件**
   - 从 `AssetsPanel.tsx` 提取 `TabPanel.tsx`
   - 从 `OctoBuild.tsx` 提取 `DataTable.tsx`（评估问题整理等复用）
   - 从 `ClientShell.tsx` 提取 `CardGrid.tsx`（技能市场复用）

### Phase 3：Mock 数据层独立（1天）

**目标**：将所有 Mock 数据与业务逻辑解耦

1. **Mock 数据迁移**
   - `data/skill-market-data.ts` 中的 `DEFAULT_SKILL_MARKET_ITEMS` 迁移到 `mocks/data/skill-market.ts`
   - `features/assets/mock-data.ts` 迁移到 `mocks/data/assets.ts`
   - `ClientShell.tsx` 中的 `DEFAULT_PERSONAL_SKILL_PACKAGES` 迁移到 `mocks/data/personal-skills.ts`
   - `data/project-assets-data.ts` 中的默认数据迁移到 `mocks/data/project-assets.ts`
2. **Mock 服务迁移**
   - 将 `OctoBuild.tsx` 中的 `generateAIResponse` 迁移到 `mocks/services/ai-response.ts`
   - 将 `OctoBuild.tsx` 中的 `detectIntentWithConfidence` 迁移到 `mocks/services/intent-engine.ts`
   - 将 `lib/octoMakeApi.ts` 中的 Mock 流式生成逻辑迁移到 `mocks/services/demo-stream.ts`
3. **无感知切换**
   - 业务代码通过 `core/api/` 调用，由 `mocks/index.ts` 根据 `USE_MOCK` 决定返回 Mock 服务还是真实 API

### Phase 4：OctoBuild 拆解（3-4天）

**目标**：将 7959 行的巨兽拆分为可管理的模块

1. **提取 Canvas 子模块**
   - 从 `OctoBuild.tsx` 中提取 10 个 Canvas 组件到 `modules/octo-build/canvases/`
   - 每个 Canvas 独立为文件，目标 < 500 行
   - 创建 `CanvasRouter.tsx` 统一分发
2. **提取 Chat 子模块**
   - 提取 `ChatPanel.tsx`、`MessageItem.tsx`、`ThinkingBlock.tsx`
   - 提取消息状态管理到 `hooks/useChat.ts`
3. **提取工作流服务**
   - 提取 `intent-engine.ts`（意图识别）
   - 提取 `prompt-builder.ts`（Prompt 构建）
   - 提取 `follow-up.ts`（跟进生成）
4. **精简 OctoBuild.tsx**
   - 保留为纯容器组件，只负责组合 ChatPanel + ResultWorkspace
   - 目标 < 300 行

### Phase 5：ClientShell 拆解（2-3天）

**目标**：将 3327 行的布局壳拆分为独立模块

1. **提取 Shell 模块**
   - 保留 `modules/shell/Shell.tsx` 为容器，只组合 Sidebar + Workspace
2. **提取技能市场模块**
   - 将 `ClientShell.tsx` 中的技能市场逻辑迁移到 `modules/skill-market/`
   - 包括：分类过滤、详情页、启用/停用开关
3. **提取知识库模块**
   - 将 `ClientShell.tsx` 中的知识库逻辑迁移到 `modules/knowledge-base/`
   - 将 `features/assets/AssetsPanel.tsx` 整合进此模块
4. **提取个人技能模块**
   - 将 `ClientShell.tsx` 中的个人技能树迁移到 `modules/personal-skills/`
   - 复用 `framework/display/FileTree.tsx`

### Phase 6：剩余模块迁移（2天）

**目标**：完成 VibeDesign、VersionDelivery、GlobalSearch 的迁移

1. **Vibe Design 模块**
   - 将 `features/vibe/*` 迁移到 `modules/vibe-design/`
   - 按 canvases/panels/modals 拆分为子目录
2. **版本交付模块**
   - 将 `VersionDelivery.tsx` 精简为容器，内部组件迁移到 `modules/version-delivery/components/`
3. **全局搜索模块**
   - 将 `components/GlobalSearchModal.tsx` 迁移到 `modules/global-search/`

### Phase 7：清理与验证（1-2天）

**目标**：删除旧代码，确保编译通过

1. **删除旧目录**
   - 确认所有文件迁移完成后，删除 `src/data/`、`src/features/`、`src/layout/`、`src/lib/`、`src/components/`（除框架层外）
2. **路径批量替换**
   - 更新所有 import 路径
3. **编译验证**
   - `npm run build` 确保无 TypeScript 错误
4. **功能回归**
   - 在 Mock 模式下走查所有核心流程

---

## 七、风险与缓解策略

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| 迁移过程中引入回归bug | 高 | 每完成一个Phase即进行功能回归，不堆叠到最后验证 |
| import路径批量替换遗漏 | 中 | 使用 `tsc --noEmit` 编译检查，零 tolerance 策略 |
| 新目录结构团队不适应 | 低 | 在 plan 中明确每个目录的职责，配套代码规范文档 |
| 迁移工作量超预期 | 中 | 按 Phase 切分，每个 Phase 可独立交付，允许分迭代完成 |

---

## 八、附录：工作流与模块映射表

| 工作流 | 原位置 | 目标位置 | 所属模块 |
|--------|--------|---------|---------|
| UI 设计 | OctoBuild.tsx | `modules/octo-build/canvases/ui-design/` | octo-build |
| 交互 Demo | OctoBuild.tsx | `modules/octo-build/canvases/demo/` | octo-build |
| 创意生成 | OctoBuild.tsx | `modules/octo-build/canvases/creative/` | octo-build |
| 竞品研究 | OctoBuild.tsx | `modules/octo-build/canvases/research/` | octo-build |
| 用户访谈 | OctoBuild.tsx | `modules/octo-build/canvases/interview/` | octo-build |
| 观点解析 | OctoBuild.tsx | `modules/octo-build/canvases/insight/` | octo-insight |
| 按提纲聚类 | OctoBuild.tsx | `modules/octo-build/canvases/insight/` | octo-insight |
| AI用户画像 | OctoBuild.tsx | `modules/octo-build/canvases/insight/` | octo-insight |
| 思维导图 | OctoBuild.tsx | `modules/octo-build/canvases/insight/` | octo-insight |
| 评估问题整理 | OctoBuild.tsx | `modules/octo-build/canvases/insight/` | octo-insight |
| 技能市场 | ClientShell.tsx | `modules/skill-market/` | skill-market |
| 知识库/资产库 | ClientShell.tsx + AssetsPanel.tsx | `modules/knowledge-base/` | knowledge-base |
| 个人技能 | ClientShell.tsx | `modules/personal-skills/` | personal-skills |
| Vibe Design | VibeDesign.tsx + features/vibe/ | `modules/vibe-design/` | vibe-design |
| 版本交付 | VersionDelivery.tsx | `modules/version-delivery/` | version-delivery |
| 全局搜索 | GlobalSearchModal.tsx | `modules/global-search/` | global-search |
| 分享产物 | SharedArtifactView.tsx | `modules/shared-artifact/` | shared-artifact |

---

*本文档由 codebase 分析自动生成，基于实际文件结构和依赖关系设计。*
