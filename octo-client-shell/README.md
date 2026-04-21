# Octo Client Shell Standalone

从主项目中提取出的独立前端子项目，只保留客户端本体、交互体验和 mock 数据。

## 运行

```bash
cd standalone/octo-client-shell
npm install
npm run dev
```

默认端口为 `3006`。

## 构建

```bash
npm run build
npm run preview
```

## 说明

- 已移除模拟 macOS 桌面、壁纸和窗口外壳。
- 保留 `ClientShell`、`OctoBuild`、搜索弹层、技能社区、知识库和 mock 数据。
- 该子项目当前直接复用了主仓库的依赖版本配置。
