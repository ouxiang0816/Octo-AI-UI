# Octo Client Shell — Mac/Windows 桌面客户端 MVP 计划书

## Context

当前 `octo-client-shell` 是一个纯前端 React Web App，所有 AI 能力均为 Mock 数据驱动。  
目标：接入真实 AI 模型（Kimi + MiniMax），打包成 Mac/Windows 可安装客户端，支持 4 个核心 Agent 演示场景，2 周内可发布给用户安装体验，完成 MVP 产品验证。

---

## 最终架构

```
Electron Desktop App
├── Renderer Process（现有 React App，零改动 UI）
│   └── octo-client-shell/src/ （现有代码）
│       └── octoMakeApi.ts → 改为调用 window.electronAPI（IPC）
│
└── Main Process（新增 Node.js 后端，内嵌在 Electron 中）
    ├── electron/main.ts          — 窗口管理、菜单、Dock
    ├── electron/preload.ts       — contextBridge，暴露 electronAPI
    ├── electron/ipc/
    │   ├── ai.ts                 — Kimi / MiniMax API 调用 + 流式 IPC
    │   ├── figma.ts              — Figma REST API 解析
    │   ├── db.ts                 — SQLite CRUD
    │   └── settings.ts           — API Key 管理
    └── electron/db/
        ├── schema.ts             — SQLite 建表语句
        └── client.ts             — better-sqlite3 单例
```

**关键依赖包：**

| 包 | 用途 |
|---|---|
| `electron` ^28 | 桌面壳 |
| `electron-builder` | Mac DMG + Windows NSIS 打包 |
| `electron-updater` | 自动更新 |
| `better-sqlite3` | 嵌入式数据库（无需安装服务） |
| `openai` (npm) | Kimi API 兼容 OpenAI 协议，直接复用 |
| `node-fetch` / 原生 | MiniMax 图像生成 API |
| `vite-plugin-electron` | Vite 同时构建 Renderer + Main |

---

## 数据库 Schema（SQLite）

```sql
-- 对话会话
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT,
  workflow TEXT,  -- 'demo'|'research'|'interview'|'creative'
  created_at INTEGER
);

-- 消息历史
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  role TEXT,      -- 'user'|'ai'
  content TEXT,
  thinking_lines TEXT,  -- JSON array
  workflow TEXT,
  created_at INTEGER
);

-- 生成产物（HTML Demo、报告、图片路径）
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  type TEXT,       -- 'html'|'report'|'image'
  content TEXT,    -- HTML 内容 or 文件路径
  label TEXT,
  created_at INTEGER
);

-- 用户设置（API Key 等）
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## AI 模型集成方案

### Kimi（月之暗面）— 文字生成主力

```
Base URL: https://api.moonshot.cn/v1
Model: moonshot-v1-128k
协议: OpenAI 兼容，直接用 openai npm 包
用途: Demo HTML 生成、竞品报告、访谈大纲
```

### MiniMax — 图像生成

```
Base URL: https://api.minimax.chat/v1
文字 Model: abab6.5s-chat（备用文字）
图像 API: POST /image_generation
用途: 文生图、图生图（Creative 场景）
```

---

## 4 个核心 Agent 演示场景

### 场景 1：Demo 生成（Figma → 可交互 HTML）

```
用户输入: Figma 链接 + 自然语言描述
→ [Figma API] 解析 Frame 结构、颜色、字体、组件
→ [Kimi 128k] System Prompt 内嵌 Figma JSON + 设计规范
→ 流式输出思考过程 + HTML 代码
→ 前端 iframe 渲染可交互 Demo
```

**关键 Prompt 设计：**
- System：角色是"资深前端工程师"，输出格式为独立 HTML（内联 CSS+JS，支持页面切换）
- 工具调用：Figma 数据通过 System Prompt 传入（不走 function calling，避免复杂度）

### 场景 2：竞品研究报告

```
用户输入: "分析XX产品的核心功能和用户体验"
→ [Kimi] 生成结构化竞品分析（含功能矩阵、体验评分、洞察）
→ 流式输出 Markdown 报告
→ 前端渲染卡片式报告（现有 ResearchReport 组件）
```

### 场景 3：用户访谈 & 用研

```
用户输入: 研究目标 + 用户群体描述
→ [Kimi] 生成访谈大纲 → 用户画像 → 洞察摘要
→ 支持追问（多轮对话，历史通过 SQLite 持久化）
→ 前端渲染访谈文档（现有 InterviewReport 组件）
```

### 场景 4：文生图 / 图生图（Creative）

```
文生图: 用户输入描述 → [MiniMax 图像 API] → 返回图片 URL → 前端展示
图生图: 用户上传图片 + 描述 → [MiniMax] → 返回修改后图片
输出: 图片保存到本地 ~/Documents/Octo/
```

---

## IPC API 设计（Renderer ↔ Main 通信）

```typescript
// preload.ts 暴露的接口（window.electronAPI）
interface ElectronAPI {
  // AI 流式生成（事件模式）
  aiGenerate(params: { prompt: string; figmaData?: any; workflow: string }): void;
  onAiChunk(callback: (chunk: { type: 'thinking'|'content'|'done'|'error'; data: string }) => void): void;
  
  // Figma 解析
  figmaParse(url: string): Promise<FigmaDesignData>;
  
  // 图像生成
  imageGenerate(params: { prompt: string; imageBase64?: string }): Promise<string>; // 返回本地路径
  
  // 数据持久化
  db: {
    saveSession(session: Session): Promise<void>;
    getSessions(): Promise<Session[]>;
    saveArtifact(artifact: Artifact): Promise<void>;
    getArtifacts(sessionId: string): Promise<Artifact[]>;
  };
  
  // 设置
  settings: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
  };
}
```

**`octoMakeApi.ts` 改造策略：**
- 保留现有接口签名（`generateDemoStream`, `parseFigmaUrl` 等）
- 内部判断：`window.electronAPI` 存在则走 IPC，否则走 HTTP（保持 Web 版兼容）

---

## 新增 UI：设置页面

位置：`ClientShell.tsx` 左下角齿轮图标 → 弹窗  
内容：
- Kimi API Key 输入框（保存到 SQLite settings 表）
- MiniMax API Key 输入框
- Figma Personal Access Token 输入框
- 当前版本号 + 检查更新按钮

---

## 项目目录结构变更

```
standalone/
├── electron/                     ← 新建
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc/
│   │   ├── ai.ts
│   │   ├── figma.ts
│   │   ├── db.ts
│   │   └── settings.ts
│   ├── db/
│   │   ├── schema.ts
│   │   └── client.ts
│   └── tsconfig.json
├── electron-builder.config.ts    ← 新建（打包配置）
├── octo-client-shell/
│   ├── src/
│   │   ├── lib/
│   │   │   └── octoMakeApi.ts    ← 改造（IPC 优先）
│   │   ├── pages/
│   │   │   └── Settings.tsx      ← 新建（API Key 配置）
│   │   └── layout/
│   │       └── ClientShell.tsx   ← 微改（加设置入口）
│   └── vite.config.ts            ← 改造（加 electron 插件）
└── package.json                  ← 改造（加 electron 依赖和脚本）
```

---

## 打包配置（electron-builder）

```typescript
// electron-builder.config.ts
const config = {
  appId: 'com.octo.client',
  productName: 'Octo',
  directories: { output: 'release' },
  
  mac: {
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    icon: 'assets/icon.icns',
    // 注：MVP 阶段不做代码签名，用户需在"安全性"里手动允许
  },
  
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.ico',
  },
  
  publish: {
    provider: 'github',
    owner: 'ouxiang0816',
    repo: 'octo-releases',
  },
};
```

**分发方式（MVP）：**
- Mac：直接发 `.dmg` 文件，用户拖拽安装
- Windows：直接发 `Setup.exe`，双击安装
- 自动更新：通过 GitHub Releases（electron-updater 检查）

---

## 执行计划（2 周）

### Week 1：基础设施

| 天 | 任务 | 关键产出 |
|---|---|---|
| Day 1-2 | Electron 接入：安装依赖、`main.ts`、`preload.ts`、Vite 双构建配置 | `npm run dev:electron` 跑起来显示现有 UI |
| Day 3 | SQLite 集成：`better-sqlite3` + schema 建表 + `db.ts` CRUD | 设置页面可存储 API Key |
| Day 4 | IPC 框架：`ai.ts` + `settings.ts` handler + `electronAPI` bridge | IPC 通道打通 |
| Day 5 | `octoMakeApi.ts` 改造：IPC 优先，HTTP 降级 | 现有 Mock 流程通过 IPC 走通 |
| Day 6-7 | Kimi API 集成：流式生成 + IPC 事件推送 + Scene 1（Demo 生成）测试 | 真实 AI 返回 HTML Demo |

### Week 2：场景 + 打包

| 天 | 任务 | 关键产出 |
|---|---|---|
| Day 8 | Figma REST API 解析（Personal Token 模式） | Figma 链接真实解析，结构传给 Kimi |
| Day 9 | Scene 2+3：竞品报告 + 访谈大纲 Prompt 调优 | 两个场景端到端跑通 |
| Day 10 | MiniMax 图像 API 集成，Scene 4 文生图/图生图 | Creative 场景可用 |
| Day 11 | 设置 UI + API Key 管理 + 错误处理（超时、无效 Key、网络错误） | 用户可自配置 |
| Day 12 | Mac DMG 打包：`electron-builder --mac`，测试安装 | Mac 安装包可分发 |
| Day 13 | Windows EXE 打包（需 Windows 环境或 CI）；GitHub Releases 配置 | Windows 安装包可分发 |
| Day 14 | 全场景回归测试 + Bug 修复 + 安装体验打磨 | MVP 发布 |

---

## 关键文件列表（需新建/修改）

### 新建文件
- `electron/main.ts` — Electron 主进程，窗口 800×600 起步，MacMenuBar 集成
- `electron/preload.ts` — contextBridge 暴露 `window.electronAPI`
- `electron/ipc/ai.ts` — Kimi（openai sdk）+ MiniMax 调用，SSE → IPC 事件转发
- `electron/ipc/figma.ts` — Figma REST API `/v1/files/:key/nodes`
- `electron/ipc/db.ts` — SQLite sessions / messages / artifacts CRUD
- `electron/ipc/settings.ts` — API Key 读写
- `electron/db/schema.ts` — 建表 SQL
- `electron/db/client.ts` — better-sqlite3 单例（App userData 目录）
- `electron/tsconfig.json` — target Node18, module CommonJS
- `electron-builder.config.ts` — Mac + Windows 打包配置
- `octo-client-shell/src/pages/Settings.tsx` — API Key 配置页

### 修改文件
- `package.json` — 加 electron / electron-builder / better-sqlite3 / openai 依赖；加 `dev:electron` / `build:electron` script
- `octo-client-shell/vite.config.ts` — 加 `vite-plugin-electron` renderer 配置
- `octo-client-shell/src/lib/octoMakeApi.ts` — IPC 优先，HTTP 降级
- `octo-client-shell/src/layout/ClientShell.tsx` — 加设置入口（齿轮图标）
- `octo-client-shell/src/App.tsx` — 加 Settings 路由

---

## System Prompt 设计（Demo 生成场景）

```
你是 Octo AI，专门将 Figma 设计稿转换为可交互的 HTML Demo 原型。

规则：
1. 输出单个完整 HTML 文件，内联所有 CSS 和 JS
2. 使用 375px 宽度，模拟移动端界面
3. 页面切换使用 CSS transition（slide/fade），动画时长 280ms
4. 按钮点击有 scale(0.96) 反馈
5. 使用设计稿的真实颜色和字体
6. 输出格式：先输出思考过程（<!-- thinking: ... -->），再输出 HTML

Figma 设计数据：
{figmaJson}

用户需求：{userPrompt}
```

---

## 验证方案

### 功能验证
1. `npm run dev:electron` 启动，UI 完整显示（无白屏）
2. 设置页输入 Kimi API Key → 保存 → 重启后仍存在
3. 输入 Figma 链接 → 解析成功，显示设计信息
4. 输入 "生成一个电商首页 Demo" → 流式返回思考过程 → 右侧渲染 HTML
5. 输入 "分析淘宝的竞品" → 生成结构化报告
6. Creative 场景输入描述 → 返回图片

### 安装验证
1. `npm run build:electron` 生成安装包
2. Mac：双击 `.dmg` → 拖到 Applications → 双击打开（需在安全性允许）
3. Windows：双击 `Setup.exe` → 默认安装 → 开始菜单打开
4. 卸载后重装，设置数据清空（存在 userData，卸载不会自动清理，需告知用户）

---

## MVP 不做的事（明确排除）

- ❌ 代码签名 / Apple 公证（需 $99/年 Developer 账号，MVP 阶段手动允许）
- ❌ 多账号 / 用户登录
- ❌ 云端同步（所有数据本地 SQLite）
- ❌ WebSocket 实时协作
- ❌ Figma OAuth（使用 Personal Access Token 替代）
- ❌ MAS / Microsoft Store 上架
