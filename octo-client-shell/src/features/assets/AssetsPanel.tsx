/**
 * 资产库（新版）主面板
 * - 第 1 层：平台资产 / 项目资产（+ 搜索）
 * - 第 2 层：用户洞察 / 设计系统 / 原型开发 / 体验评估
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Download, ExternalLink, Eye, FileSpreadsheet, FileText, FolderOpen, Presentation, Search, Upload, LayoutGrid, Image, Hash } from 'lucide-react';
import {
  ASSET_SOURCE_LABEL,
  DESIGN_SPECS,
  DESIGN_SPEC_SOURCES,
  EXPERIENCE_EVAL_TEMPLATES,
  ICONS,
  ICON_CATEGORIES,
  ILLUSTRATIONS,
  ILLUSTRATION_CATEGORIES,
  PROTOTYPE_DOMAINS,
  USER_INSIGHT_TEMPLATES,
  type AssetDocCard,
  type AssetSource,
  type DesignSpecItem,
  type DesignSpecSource,
} from './mock-data';
import {
  loadPrototypeComponentLinkMap,
  savePrototypeComponentLinkMap,
} from '../../data/prototype-component-links';

const KNOWLEDGE_MANAGEMENT_ICON_MASK_URL = 'https://www.figma.com/api/mcp/asset/866fcb9e-d7f0-4f57-a4b3-c341c6c37b84';
const KNOWLEDGE_MANAGEMENT_ICON_FILL_URL = 'https://www.figma.com/api/mcp/asset/dbb0e47f-7de5-4caf-bb6f-f4b1c5395ee0';

export type AssetTabKey = 'user_insight' | 'design_system' | 'illustration' | 'icon' | 'prototype_dev' | 'experience_eval';

const TABS: Array<{ key: AssetTabKey; label: string }> = [
  { key: 'user_insight', label: '用户洞察' },
  { key: 'design_system', label: '设计系统' },
  { key: 'illustration', label: '插画' },
  { key: 'icon', label: '图标' },
  { key: 'prototype_dev', label: '原型开发' },
  { key: 'experience_eval', label: '体验评估' },
];

const PROJECT_ASSET_STORAGE_KEY = 'octo.client.projectAssets';

type ProjectAssetFileFormat = 'doc' | 'md' | 'txt' | 'json';

interface ProjectAssetFile {
  id: string;
  name: string;
  format: ProjectAssetFileFormat;
  content: string;
  updatedAt: number;
}

interface ProjectAssetFolder {
  id: string;
  name: string;
  files: ProjectAssetFile[];
}

interface ProjectAssetSection {
  key: AssetTabKey;
  label: string;
  folders: ProjectAssetFolder[];
}

function makeProjectAssetId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createProjectDoc(title: string, focus: string): string {
  return [
    `# ${title}`,
    '',
    '## 背景',
    `${focus}，用于当前项目复用与交付沉淀。`,
    '',
    '## 关键内容',
    '- 明确当前场景的核心目标',
    '- 保留一线访谈 / 评审 / 方案讨论的上下文',
    '- 为后续设计和开发提供直接参考',
    '',
    '## 结论',
    '- 优先复用已有模块结构',
    '- 对差异点做最小成本适配',
    '- 输出可直接引用的项目资产',
  ].join('\n');
}

const DEFAULT_PROJECT_ASSETS: ProjectAssetSection[] = [
  {
    key: 'user_insight',
    label: '用户洞察',
    folders: [
      {
        id: 'pa-ui-communication',
        name: '用户访谈',
        files: [
          { id: 'pa-ui-communication-1', name: '原生开发技术交流.doc', format: 'doc', updatedAt: 1744905600000, content: createProjectDoc('原生开发技术交流', '记录原生开发技术交流中的需求、痛点与决策点') },
          { id: 'pa-ui-communication-2', name: '原生开发技术交流-补充.doc', format: 'doc', updatedAt: 1744992000000, content: createProjectDoc('原生开发技术交流-补充', '补充访谈后的细节结论、用户原话与机会点') },
          { id: 'pa-ui-communication-3', name: '原生开发技术交流-整理.doc', format: 'doc', updatedAt: 1745078400000, content: createProjectDoc('原生开发技术交流-整理', '整理多轮交流内容，形成可直接复用的项目洞察资产') },
        ],
      },
      {
        id: 'pa-ui-interview',
        name: '访谈记录',
        files: [
          { id: 'pa-ui-interview-1', name: '开发者访谈摘录.md', format: 'md', updatedAt: 1745164800000, content: createProjectDoc('开发者访谈摘录', '沉淀高频原话、疑问与真实使用路径') },
        ],
      },
    ],
  },
  {
    key: 'design_system',
    label: '设计系统',
    folders: [
      {
        id: 'pa-ds-components',
        name: '组件规范',
        files: [
          { id: 'pa-ds-components-1', name: 'Devkit 组件映射表.json', format: 'json', updatedAt: 1744992000000, content: JSON.stringify({ button: 'PrimaryAction', table: 'WorkbenchTable', input: 'SearchInput' }, null, 2) },
        ],
      },
    ],
  },
  {
    key: 'illustration',
    label: '插画',
    folders: [],
  },
  {
    key: 'icon',
    label: '图标',
    folders: [],
  },
  {
    key: 'experience_eval',
    label: '体验评估',
    folders: [
      {
        id: 'pa-ee-review',
        name: '走查记录',
        files: [
          { id: 'pa-ee-review-1', name: '关键路径走查结论.md', format: 'md', updatedAt: 1744819200000, content: createProjectDoc('关键路径走查结论', '汇总版本前关键路径体验问题与修复建议') },
        ],
      },
    ],
  },
  {
    key: 'prototype_dev',
    label: '原型开发',
    folders: [
      {
        id: 'pa-pd-scheme',
        name: '方案草稿',
        files: [
          { id: 'pa-pd-scheme-1', name: '页面结构草图.txt', format: 'txt', updatedAt: 1744732800000, content: '页面结构草图\n\n- 顶部工具栏\n- 左侧导航树\n- 右侧内容工作区\n- 上传与版本切换入口' },
        ],
      },
    ],
  },
];

function safeProjectAssetsGet(): ProjectAssetSection[] {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_ASSETS;
  try {
    const raw = window.localStorage.getItem(PROJECT_ASSET_STORAGE_KEY);
    if (!raw) return DEFAULT_PROJECT_ASSETS;
    const parsed = JSON.parse(raw) as ProjectAssetSection[];
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_PROJECT_ASSETS;
    // Merge with defaults so new sections (e.g. illustration / icon) are preserved
    const merged = DEFAULT_PROJECT_ASSETS.map((def) => {
      const existing = parsed.find((p) => p.key === def.key);
      return existing ?? def;
    });
    return merged;
  } catch {
    return DEFAULT_PROJECT_ASSETS;
  }
}

function safeProjectAssetsSet(items: ProjectAssetSection[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROJECT_ASSET_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function findProjectFolder(sections: ProjectAssetSection[], folderId: string | null) {
  if (!folderId) return null;
  for (const section of sections) {
    const folder = section.folders.find((item) => item.id === folderId);
    if (folder) return { section, folder };
  }
  return null;
}

function findProjectFile(sections: ProjectAssetSection[], fileId: string | null) {
  if (!fileId) return null;
  for (const section of sections) {
    for (const folder of section.folders) {
      const file = folder.files.find((item) => item.id === fileId);
      if (file) return { section, folder, file };
    }
  }
  return null;
}

function filterProjectAssets(sections: ProjectAssetSection[], query: string) {
  if (!query.trim()) return sections;
  const q = query.trim().toLowerCase();
  return sections
    .map((section) => {
      const folders = section.folders
        .map((folder) => {
          const files = folder.files.filter((file) =>
            file.name.toLowerCase().includes(q) || file.content.toLowerCase().includes(q),
          );
          if (folder.name.toLowerCase().includes(q) && files.length === 0) {
            return folder;
          }
          if (files.length > 0) return { ...folder, files };
          return null;
        })
        .filter((folder): folder is ProjectAssetFolder => folder !== null);

      if (section.label.toLowerCase().includes(q) && folders.length === 0) return section;
      if (folders.length > 0) return { ...section, folders };
      return null;
    })
    .filter((section): section is ProjectAssetSection => section !== null);
}

function updateProjectAssetFileContent(
  sections: ProjectAssetSection[],
  fileId: string,
  content: string,
  updatedAt: number,
) {
  return sections.map((section) => ({
    ...section,
    folders: section.folders.map((folder) => ({
      ...folder,
      files: folder.files.map((file) => (file.id === fileId ? { ...file, content, updatedAt } : file)),
    })),
  }));
}

function appendFilesToProjectFolder(
  sections: ProjectAssetSection[],
  folderId: string,
  files: Array<{ name: string; content: string; updatedAt: number; format: ProjectAssetFileFormat }>,
) {
  return sections.map((section) => ({
    ...section,
    folders: section.folders.map((folder) => (
      folder.id === folderId
        ? {
            ...folder,
            files: [
              ...folder.files,
              ...files.map((file) => ({
                id: makeProjectAssetId('pa_file'),
                name: file.name,
                content: file.content,
                updatedAt: file.updatedAt,
                format: file.format,
              })),
            ],
          }
        : folder
    )),
  }));
}

function getProjectAssetFileFormat(name: string): ProjectAssetFileFormat {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'md') return 'md';
  if (ext === 'json') return 'json';
  if (ext === 'txt') return 'txt';
  return 'doc';
}

function renderProjectAssetContent(content: string, format: ProjectAssetFileFormat) {
  if (format === 'json') {
    return (
      <pre className="whitespace-pre-wrap break-words rounded-[12px] bg-[#fafbfd] px-[20px] py-[18px] text-[13px] leading-[22px] text-[#191919]">
        {content}
      </pre>
    );
  }

  const blocks = content.split('\n').map((line, index) => {
    const text = line.trim();
    if (!text) return <div key={index} className="h-[8px]" />;
    if (text.startsWith('# ')) return <h1 key={index} className="text-[28px] font-semibold leading-[40px] text-[#191919]">{text.slice(2)}</h1>;
    if (text.startsWith('## ')) return <h2 key={index} className="mt-[28px] text-[16px] font-semibold leading-[24px] text-[#191919]">{text.slice(3)}</h2>;
    if (text.startsWith('- ')) return <div key={index} className="text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">• {text.slice(2)}</div>;
    return <p key={index} className="mt-[12px] text-[14px] leading-[28px] text-[rgba(25,25,25,0.88)]">{text}</p>;
  });

  return <div>{blocks}</div>;
}

interface ProjectAssetPreviewContent {
  title: string;
  lead: string;
  bullets: string[];
  keyValues?: Array<{ key: string; value: string }>;
}

function getProjectAssetPreviewContent(file: ProjectAssetFile): ProjectAssetPreviewContent {
  if (file.format === 'json') {
    try {
      const parsed = JSON.parse(file.content) as Record<string, unknown>;
      const keyValues = Object.entries(parsed)
        .slice(0, 4)
        .map(([key, value]) => ({ key, value: String(value) }));
      return {
        title: file.name.replace(/\.[^.]+$/, ''),
        lead: '项目内组件映射与结构约定，用于设计实现对齐。',
        bullets: keyValues.map((item) => `${item.key}: ${item.value}`),
        keyValues,
      };
    } catch {
      return {
        title: file.name.replace(/\.[^.]+$/, ''),
        lead: '结构化项目配置与字段映射。',
        bullets: ['保留关键配置字段', '支持项目内统一引用', '便于跨模块同步'],
      };
    }
  }

  const lines = file.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const titleLine = lines.find((line) => line.startsWith('# '));
  const headingLines = lines.filter((line) => line.startsWith('## ')).map((line) => line.slice(3));
  const bulletLines = lines.filter((line) => line.startsWith('- ')).map((line) => line.slice(2));
  const paragraphLine = lines.find((line) => !line.startsWith('#') && !line.startsWith('-'));

  return {
    title: titleLine ? titleLine.slice(2) : file.name.replace(/\.[^.]+$/, ''),
    lead: paragraphLine ?? '沉淀项目过程中的关键结论、上下文与执行建议。',
    bullets: (bulletLines.length ? bulletLines : headingLines).slice(0, 5),
  };
}

export interface AssetsPanelProps {
  activeTab: AssetTabKey;
  onActiveTabChange: (tab: AssetTabKey) => void;
  onToast?: (msg: string) => void;
}

export function AssetsPanel({ activeTab, onActiveTabChange, onToast }: AssetsPanelProps) {
  const [activeSource, setActiveSource] = useState<AssetSource>('platform');
  const [searchQuery, setSearchQuery] = useState('');
  const projectUploadRef = useRef<HTMLInputElement | null>(null);
  const [projectAssets, setProjectAssets] = useState<ProjectAssetSection[]>(safeProjectAssetsGet);
  const [selectedProjectFolderId, setSelectedProjectFolderId] = useState<string | null>(null);
  const [selectedProjectFileId, setSelectedProjectFileId] = useState<string | null>(null);
  const [projectAssetViewMode, setProjectAssetViewMode] = useState<'grid' | 'preview' | 'edit'>('grid');
  const [collapsedProjectSections, setCollapsedProjectSections] = useState<Record<AssetTabKey, boolean>>({
    user_insight: false,
    design_system: true,
    illustration: true,
    icon: true,
    prototype_dev: true,
    experience_eval: true,
  });
  const [specSource, setSpecSource] = useState<DesignSpecSource>('ICT');
  const [illustrationCategory, setIllustrationCategory] = useState<(typeof ILLUSTRATION_CATEGORIES)[number]>('全部');
  const [iconCategory, setIconCategory] = useState<(typeof ICON_CATEGORIES)[number]>('全部');

  // 原型开发
  const [activeDomain, setActiveDomain] = useState<string>(PROTOTYPE_DOMAINS[0].key);
  const [prototypeEnabledMap, setPrototypeEnabledMap] = useState<Record<string, boolean>>(() => loadPrototypeComponentLinkMap());

  // 模版预览
  const [previewTemplate, setPreviewTemplate] = useState<AssetDocCard | null>(null);

  const togglePrototype = (id: string, name: string) => {
    setPrototypeEnabledMap((prev) => {
      const nextEnabled = !prev[id];
      const nextMap = { ...prev, [id]: nextEnabled };
      savePrototypeComponentLinkMap(nextMap);
      onToast?.(nextEnabled ? `已启用 ${name}，Octo Make 将新增"选择开发组件"选项` : `已停用 ${name}`);
      return nextMap;
    });
  };

  const searchPlaceholder = useMemo(() => {
    if (activeSource === 'personal') return '搜索';
    switch (activeTab) {
      case 'user_insight': return '搜索用户洞察模版';
      case 'design_system': return '搜索组件规范';
      case 'illustration': return '搜索插画';
      case 'icon': return '搜索图标';
      case 'prototype_dev': return '搜索领域 / 方案';
      case 'experience_eval': return '搜索体验评估模版';
    }
  }, [activeSource, activeTab]);

  useEffect(() => {
    safeProjectAssetsSet(projectAssets);
  }, [projectAssets]);

  const filteredProjectAssets = useMemo(
    () => filterProjectAssets(projectAssets, searchQuery),
    [projectAssets, searchQuery],
  );

  const selectedProjectSection = useMemo(
    () => filteredProjectAssets.find((section) => section.key === activeTab) ?? filteredProjectAssets[0] ?? null,
    [activeTab, filteredProjectAssets],
  );

  const selectedProjectFolderState = useMemo(
    () => findProjectFolder(filteredProjectAssets, selectedProjectFolderId),
    [filteredProjectAssets, selectedProjectFolderId],
  );

  const selectedProjectFileState = useMemo(
    () => findProjectFile(filteredProjectAssets, selectedProjectFileId),
    [filteredProjectAssets, selectedProjectFileId],
  );

  useEffect(() => {
    if (!filteredProjectAssets.length) {
      setSelectedProjectFolderId(null);
      setSelectedProjectFileId(null);
      setProjectAssetViewMode('grid');
      return;
    }

    if (activeSource === 'personal' && !filteredProjectAssets.some((section) => section.key === activeTab)) {
      onActiveTabChange(filteredProjectAssets[0].key);
    }

    if (selectedProjectFileId && !selectedProjectFileState) {
      setSelectedProjectFileId(null);
      setProjectAssetViewMode('grid');
    }
    if (selectedProjectFolderId && !selectedProjectFolderState) {
      setSelectedProjectFolderId(null);
      setProjectAssetViewMode('grid');
    }
  }, [activeSource, activeTab, filteredProjectAssets, onActiveTabChange, selectedProjectFileId, selectedProjectFileState, selectedProjectFolderId, selectedProjectFolderState]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    setCollapsedProjectSections(
      Object.fromEntries(filteredProjectAssets.map((section) => [section.key, false])) as Record<AssetTabKey, boolean>,
    );
  }, [filteredProjectAssets, searchQuery]);

  useEffect(() => {
    if (activeSource !== 'platform' || !['user_insight', 'experience_eval'].includes(activeTab)) {
      setPreviewTemplate(null);
    }
  }, [activeSource, activeTab]);

  const handleProjectAssetUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const targetFolder = selectedProjectFolderState?.folder ?? selectedProjectSection?.folders[0] ?? filteredProjectAssets[0]?.folders[0];
    if (!targetFolder) return;

    const uploads = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await file.text(),
        updatedAt: Date.now(),
        format: getProjectAssetFileFormat(file.name),
      })),
    );

    const existingCount = targetFolder.files.length;
    setProjectAssets((prev) => appendFilesToProjectFolder(prev, targetFolder.id, uploads));
    setSelectedProjectFolderId(targetFolder.id);
    setProjectAssetViewMode('grid');

    const nextFileId = targetFolder.files[existingCount]?.id ?? null;
    if (nextFileId) setSelectedProjectFileId(nextFileId);

    onToast?.(`已上传 ${files.length} 个项目资产文件`);
    event.target.value = '';
  }, [filteredProjectAssets, onToast, selectedProjectFolderState]);

  const handleProjectAssetContentChange = useCallback((nextContent: string) => {
    if (!selectedProjectFileState?.file) return;
    const updatedAt = Date.now();
    setProjectAssets((prev) => updateProjectAssetFileContent(prev, selectedProjectFileState.file.id, nextContent, updatedAt));
  }, [selectedProjectFileState]);

  return (
    <div className="h-full flex flex-col bg-transparent">
      <input
        ref={projectUploadRef}
        type="file"
        multiple
        accept=".doc,.docx,.md,.txt,.json"
        onChange={handleProjectAssetUpload}
        className="hidden"
      />
      {/* ── 页头 ── */}
      <div className="shrink-0 border-b border-[rgba(0,0,0,0.08)] px-[20px] pt-[12px] pb-[13px]">
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
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold leading-[20px] text-black">资产库</div>
          </div>
        </div>
      </div>

      {/* ── 第 1 层：资产源 + 搜索 ── */}
      <div className="shrink-0 flex items-center gap-[10px] px-[20px] h-[52px] border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-[10px]">
          {(['platform', 'personal'] as AssetSource[]).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                setActiveSource(src);
                if (src === 'personal') {
                  setSelectedProjectFileId(null);
                  setProjectAssetViewMode('grid');
                }
              }}
              className={`rounded-[18px] px-[12px] py-[4px] text-[14px] leading-[20px] transition-colors ${
                activeSource === src
                  ? 'bg-[rgba(10,89,247,0.10)] text-[#0a59f7] font-medium'
                  : 'text-[#191919] hover:text-[#0a59f7]'
              }`}
            >
              {ASSET_SOURCE_LABEL[src]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-[10px]">
          <div className="relative">
            <Search size={12} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[rgba(0,0,0,0.35)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-[260px] h-[36px] rounded-[12px] bg-[rgba(0,0,0,0.04)] pl-[30px] pr-[10px] text-[12px] text-[#1a1a1a] outline-none focus:bg-white focus:shadow-[0_0_0_1px_rgba(20,118,255,0.35)] transition-all"
            />
          </div>
          {activeSource === 'personal' && (
            <button
              type="button"
              onClick={() => projectUploadRef.current?.click()}
              className="inline-flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[#1476ff] px-[14px] text-[13px] font-medium text-white hover:bg-[#0f67de] transition-colors"
            >
              <Upload size={14} />
              <span>上传</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 第 2 层：领域 tab ── */}
      {activeSource === 'platform' && (
        <div className="shrink-0 flex items-center gap-[32px] h-[44px] px-[20px] border-b border-[rgba(0,0,0,0.06)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onActiveTabChange(tab.key)}
              className={`relative h-full text-[14px] transition-colors ${
                activeTab === tab.key ? 'text-[#1a1a1a] font-medium' : 'text-[rgba(0,0,0,0.5)] hover:text-[#1a1a1a]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-[-6px] right-[-6px] h-[2px] rounded-t-full bg-[#1476ff]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── 内容区 ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeSource === 'personal' ? (
          <ProjectAssetWorkspace
            sections={filteredProjectAssets}
            selectedSection={selectedProjectSection}
            selectedFolderState={selectedProjectFolderState}
            selectedFileState={selectedProjectFileState}
            viewMode={projectAssetViewMode}
            collapsedSections={collapsedProjectSections}
            onToggleSection={(key) => setCollapsedProjectSections((prev) => ({ ...prev, [key]: !prev[key] }))}
            onSelectSection={(key) => {
              onActiveTabChange(key);
              setSelectedProjectFolderId(null);
              setSelectedProjectFileId(null);
              setProjectAssetViewMode('grid');
            }}
            onSelectFolder={(folderId) => {
              setSelectedProjectFolderId(folderId);
              setSelectedProjectFileId(null);
              setProjectAssetViewMode('grid');
            }}
            onSelectFile={(fileId) => {
              setSelectedProjectFileId(fileId);
              setProjectAssetViewMode('preview');
            }}
            onBackToGrid={() => {
              setSelectedProjectFileId(null);
              setProjectAssetViewMode('grid');
            }}
            onViewModeChange={setProjectAssetViewMode}
            onContentChange={handleProjectAssetContentChange}
          />
        ) : activeTab === 'user_insight' ? (
          previewTemplate ? (
            <PlatformTemplateDetailPage
              template={previewTemplate}
              tabLabel="用户洞察"
              onBack={() => setPreviewTemplate(null)}
              onToast={onToast}
            />
          ) : (
            <DocCardGrid
              items={USER_INSIGHT_TEMPLATES}
              source={activeSource}
              query={searchQuery}
              emptyHint="没有匹配的用户洞察模版"
              onOpen={setPreviewTemplate}
            />
          )
        ) : null}
        {activeSource === 'platform' && activeTab === 'experience_eval' && (
          previewTemplate ? (
            <PlatformTemplateDetailPage
              template={previewTemplate}
              tabLabel="体验评估"
              onBack={() => setPreviewTemplate(null)}
              onToast={onToast}
            />
          ) : (
            <DocCardGrid
              items={EXPERIENCE_EVAL_TEMPLATES}
              source={activeSource}
              query={searchQuery}
              emptyHint="没有匹配的体验评估模版"
              onOpen={setPreviewTemplate}
            />
          )
        )}
        {activeSource === 'platform' && activeTab === 'design_system' && (
          <DesignSystemView
            specSource={specSource}
            onSpecSourceChange={setSpecSource}
            query={searchQuery}
          />
        )}
        {activeSource === 'platform' && activeTab === 'illustration' && (
          <IllustrationPanel
            source={activeSource}
            category={illustrationCategory}
            onCategoryChange={setIllustrationCategory}
            query={searchQuery}
          />
        )}
        {activeSource === 'platform' && activeTab === 'icon' && (
          <IconPanel
            source={activeSource}
            category={iconCategory}
            onCategoryChange={setIconCategory}
            query={searchQuery}
          />
        )}
        {activeSource === 'platform' && activeTab === 'prototype_dev' && (
          <PrototypeDevView
            activeDomain={activeDomain}
            onActiveDomainChange={setActiveDomain}
            enabledMap={prototypeEnabledMap}
            onToggle={togglePrototype}
            query={searchQuery}
          />
        )}
      </div>
    </div>
  );
}

function ProjectAssetWorkspace({
  sections,
  selectedSection,
  selectedFolderState,
  selectedFileState,
  viewMode,
  collapsedSections,
  onToggleSection,
  onSelectSection,
  onSelectFolder,
  onSelectFile,
  onBackToGrid,
  onViewModeChange,
  onContentChange,
}: {
  sections: ProjectAssetSection[];
  selectedSection: ProjectAssetSection | null;
  selectedFolderState: { section: ProjectAssetSection; folder: ProjectAssetFolder } | null;
  selectedFileState: { section: ProjectAssetSection; folder: ProjectAssetFolder; file: ProjectAssetFile } | null;
  viewMode: 'grid' | 'preview' | 'edit';
  collapsedSections: Record<AssetTabKey, boolean>;
  onToggleSection: (key: AssetTabKey) => void;
  onSelectSection: (key: AssetTabKey) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
  onBackToGrid: () => void;
  onViewModeChange: (mode: 'grid' | 'preview' | 'edit') => void;
  onContentChange: (nextContent: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[308px] shrink-0 border-r border-[rgba(25,25,25,0.08)] bg-[rgba(255,255,255,0.55)]">
        <div className="h-full overflow-y-auto px-[14px] py-[20px]" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-[10px]">
            {sections.map((section) => {
              const isCollapsed = collapsedSections[section.key] ?? false;
              const hasChildSelection =
                selectedFolderState?.section.key === section.key
                || selectedFileState?.section.key === section.key;
              const isActive = selectedSection?.key === section.key && !hasChildSelection;
              return (
                <div key={section.key} className="space-y-[4px]">
                  <div className={`flex items-center gap-[6px] rounded-[10px] px-[10px] py-[9px] transition-colors ${isActive ? 'bg-[rgba(10,89,247,0.06)]' : ''}`}>
                    <button
                      type="button"
                      onClick={() => onSelectSection(section.key)}
                      className="flex min-w-0 flex-1 items-center gap-[10px] text-left text-[#191919]"
                    >
                      <FileText size={16} className="shrink-0" />
                      <span className={`min-w-0 flex-1 truncate text-[14px] leading-[22px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {section.label}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSection(section.key)}
                      className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[rgba(25,25,25,0.45)] hover:bg-[rgba(10,89,247,0.06)]"
                    >
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                      />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-[2px] pl-[30px]">
                      {section.folders.map((folder) => {
                        const selected = selectedFolderState?.folder.id === folder.id;
                        return (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => onSelectFolder(folder.id)}
                            className={`flex w-full items-center gap-[10px] rounded-[10px] px-[12px] py-[9px] text-left transition-colors ${
                              selected
                                ? 'bg-[rgba(10,89,247,0.10)] text-[#0a59f7]'
                                : 'text-[#191919] hover:bg-[rgba(10,89,247,0.04)]'
                            }`}
                          >
                            <span className="truncate text-[14px] leading-[22px]">{folder.name}</span>
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
      </aside>

      <section className="flex-1 min-w-0 bg-white">
        {selectedFileState && viewMode !== 'grid' ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[rgba(25,25,25,0.08)] px-[28px] py-[18px]">
              <div className="flex items-center gap-[4px] text-[12px] leading-[18px]">
                <button
                  type="button"
                  onClick={() => onSelectSection(selectedFileState.section.key)}
                  className="text-[rgba(25,25,25,0.55)] hover:text-[#0a59f7]"
                >
                  {selectedFileState.section.label}
                </button>
                <span className="text-[rgba(25,25,25,0.35)]">/</span>
                <button
                  type="button"
                  onClick={onBackToGrid}
                  className="text-[rgba(25,25,25,0.55)] hover:text-[#0a59f7]"
                >
                  {selectedFileState.folder.name}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-[28px] py-[24px]" style={{ scrollbarWidth: 'thin' }}>
              {renderProjectAssetContent(selectedFileState.file.content, selectedFileState.file.format)}
            </div>
          </div>
        ) : selectedFolderState ? (
          <div className="h-full overflow-y-auto px-[36px] py-[28px]" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex items-center gap-[4px] text-[12px] font-medium leading-[18px]">
              <button
                type="button"
                onClick={() => onSelectSection(selectedFolderState.section.key)}
                className="text-[rgba(25,25,25,0.55)] hover:text-[#0a59f7]"
              >
                {selectedFolderState.section.label}
              </button>
              <span className="text-[rgba(25,25,25,0.35)]">/</span>
              <span className="text-[#191919]">{selectedFolderState.folder.name}</span>
            </div>

            <div className="mt-[28px] grid grid-cols-[repeat(auto-fill,minmax(180px,180px))] gap-[22px]">
              {selectedFolderState.folder.files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => onSelectFile(file.id)}
                  className="text-left transition-transform hover:-translate-y-[1px]"
                >
                  <div className="h-[134px] rounded-[18px] border border-[rgba(25,25,25,0.08)] bg-white p-[8px] shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="relative h-full overflow-hidden rounded-[14px] border border-[rgba(25,25,25,0.06)] bg-[linear-gradient(180deg,#ffffff_0%,#fafbfd_100%)]">
                      <div className="absolute left-[8px] top-[8px] z-[1]">
                        <FormatIcon format={file.format} compact />
                      </div>
                      <ProjectAssetDocumentPreview file={file} />
                    </div>
                  </div>
                  <div className="mt-[10px] min-w-0 text-[13px] font-medium leading-[20px] text-[#191919] truncate">{file.name}</div>
                </button>
              ))}
            </div>

            {selectedFolderState.folder.files.length === 0 && (
              <div className="mt-[28px] rounded-[12px] border border-dashed border-[rgba(25,25,25,0.12)] px-[18px] py-[16px] text-[13px] leading-[22px] text-[rgba(25,25,25,0.55)]">
                当前目录还没有项目资产文件，可以点击右上角上传。
              </div>
            )}
          </div>
        ) : selectedSection ? (
          <div className="h-full overflow-y-auto px-[36px] py-[28px]" style={{ scrollbarWidth: 'thin' }}>
            <div className="text-[14px] font-medium leading-[22px] text-[#191919]">{selectedSection.label}</div>

            <div className="mt-[28px] grid grid-cols-[repeat(auto-fill,minmax(180px,180px))] gap-[22px]">
              {selectedSection.folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className="text-left transition-transform hover:-translate-y-[1px]"
                >
                  <div className="flex h-[134px] items-center justify-center rounded-[18px] border border-[rgba(25,25,25,0.08)] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col items-center gap-[10px] text-[rgba(25,25,25,0.7)]">
                      <FolderOpen size={30} />
                      <span className="text-[12px] text-[rgba(25,25,25,0.45)]">{folder.files.length} 个文件</span>
                    </div>
                  </div>
                  <div className="mt-[10px] text-[13px] font-medium leading-[20px] text-[#191919]">{folder.name}</div>
                </button>
              ))}
            </div>

            {selectedSection.folders.length === 0 && (
              <div className="mt-[28px] rounded-[12px] border border-dashed border-[rgba(25,25,25,0.12)] px-[18px] py-[16px] text-[13px] leading-[22px] text-[rgba(25,25,25,0.55)]">
                当前层级还没有目录内容。
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-[rgba(25,25,25,0.45)]">
            没有匹配的项目资产。
          </div>
        )}
      </section>
    </div>
  );
}

// ─── 子视图：文档卡片网格（用户洞察 / 体验评估） ──────────────────
function DocCardGrid({
  items,
  source,
  query,
  emptyHint,
  onOpen,
}: {
  items: AssetDocCard[];
  source: AssetSource;
  query: string;
  emptyHint: string;
  onOpen: (card: AssetDocCard) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = items.filter(
    (it) => it.source === source && (!q || it.title.toLowerCase().includes(q) || it.owner.toLowerCase().includes(q) || it.summary.toLowerCase().includes(q)),
  );

  if (!filtered.length) {
    return <div className="px-[20px] py-[80px] text-[13px] text-[rgba(0,0,0,0.4)] text-center">{emptyHint}</div>;
  }

  return (
    <div className="px-[20px] py-[24px] grid grid-cols-[repeat(auto-fill,minmax(180px,180px))] gap-[22px]">
      {filtered.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onOpen(it)}
          className="text-left transition-transform hover:-translate-y-[1px]"
        >
          <div className="h-[134px] rounded-[18px] border border-[rgba(25,25,25,0.08)] bg-white p-[8px] shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
            <div className="relative h-full overflow-hidden rounded-[14px] border border-[rgba(25,25,25,0.06)] bg-[linear-gradient(180deg,#ffffff_0%,#fafbfd_100%)]">
              <div className="absolute left-[8px] top-[8px] z-[1]">
                <FormatIcon format={it.format} compact />
              </div>
              <DocumentPreview card={it} />
            </div>
          </div>
          <div className="mt-[10px] min-w-0 text-[13px] font-medium leading-[20px] text-[#191919] truncate">{it.title}.{it.format}</div>
        </button>
      ))}
    </div>
  );
}

type PreviewCardFormat = AssetDocCard['format'] | ProjectAssetFileFormat;

const FORMAT_META: Record<
  PreviewCardFormat,
  { tint: string; iconBg: string; icon: 'doc' | 'sheet' | 'slide' | 'pdf' | 'json' }
> = {
  doc: { tint: '#2563eb', iconBg: 'bg-[#eaf2ff]', icon: 'doc' },
  docx: { tint: '#2563eb', iconBg: 'bg-[#eaf2ff]', icon: 'doc' },
  pdf: { tint: '#d93025', iconBg: 'bg-[#fdecec]', icon: 'pdf' },
  xls: { tint: '#188038', iconBg: 'bg-[#eaf8ef]', icon: 'sheet' },
  xlsx: { tint: '#188038', iconBg: 'bg-[#eaf8ef]', icon: 'sheet' },
  ppt: { tint: '#f26a1b', iconBg: 'bg-[#fff0e6]', icon: 'slide' },
  pptx: { tint: '#f26a1b', iconBg: 'bg-[#fff0e6]', icon: 'slide' },
  md: { tint: '#2563eb', iconBg: 'bg-[#eaf2ff]', icon: 'doc' },
  txt: { tint: '#6b7280', iconBg: 'bg-[#f3f4f6]', icon: 'doc' },
  json: { tint: '#7c3aed', iconBg: 'bg-[#f3e8ff]', icon: 'json' },
};

function FormatIcon({ format, compact = false }: { format: PreviewCardFormat; compact?: boolean }) {
  const meta = FORMAT_META[format];
  const size = compact ? 12 : 14;
  const wrapperClass = compact ? 'w-[20px] h-[20px] rounded-[7px]' : 'w-[22px] h-[22px] rounded-[8px]';
  const icon =
    meta.icon === 'sheet' ? (
      <FileSpreadsheet size={size} style={{ color: meta.tint }} />
    ) : meta.icon === 'slide' ? (
      <Presentation size={size} style={{ color: meta.tint }} />
    ) : meta.icon === 'json' ? (
      <Hash size={size} style={{ color: meta.tint }} />
    ) : (
      <FileText size={size} style={{ color: meta.tint }} />
    );

  return <div className={`inline-flex items-center justify-center ${wrapperClass} ${meta.iconBg}`}>{icon}</div>;
}

interface AssetDocContent {
  title: string;
  lead: string;
  sections: string[];
  bullets: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
}

function getAssetDocContent(card: AssetDocCard): AssetDocContent {
  const lead =
    /用户|访谈|画像|问卷|旅程/.test(card.title)
      ? '聚焦目标用户、关键场景与研究证据，沉淀可复用的洞察框架。'
      : /体验|评估|走查|审核|检核|评分/.test(card.title)
        ? '围绕体验质量、问题分级与整改优先级，形成统一评估结论。'
        : card.summary;

  if (card.format === 'xls' || card.format === 'xlsx') {
    return {
      title: card.title,
      lead,
      sections: ['模块', '状态', '负责人', '完成度'],
      bullets: ['访谈执行', '走查记录', '问题分级', '结论汇总'],
      tableHeaders: ['模块', '状态', '负责人', '完成度'],
      tableRows: [
        ['访谈', '完成', card.owner, '100%'],
        ['走查', '进行中', '林舒', '76%'],
        ['评估', '待评审', '王岸', '45%'],
        ['汇总', '待开始', 'UX', '12%'],
      ],
    };
  }

  if (card.format === 'ppt' || card.format === 'pptx') {
    return {
      title: card.title,
      lead,
      sections: ['适用场景', '关键流程', '输出建议'],
      bullets: ['梳理目标与评估边界', '提炼主要问题与证据', '输出结构化结论页'],
    };
  }

  if (card.format === 'pdf') {
    return {
      title: card.title,
      lead,
      sections: ['评估摘要', '问题明细', '整改建议'],
      bullets: ['明确评估目标与对象', '记录高频问题与影响范围', '输出优先级与整改路径'],
    };
  }

  return {
    title: card.title,
    lead,
    sections: ['背景与目标', '研究对象 / 样本', '关键问题清单', '记录框架', '结论与建议', '附录'],
    bullets: ['明确研究背景与目标', '定义样本范围与筛选条件', '沉淀问题清单与记录模板', '输出结论和行动建议'],
  };
}

function DocumentPreview({ card }: { card: AssetDocCard }) {
  const content = getAssetDocContent(card);

  if (card.format === 'ppt' || card.format === 'pptx') {
    return <SlidePreview card={card} content={content} />;
  }

  if (card.format === 'xls' || card.format === 'xlsx') {
    return <SheetPreview card={card} content={content} />;
  }

  if (card.format === 'pdf') {
    return <PdfPreview card={card} content={content} />;
  }

  return <DocPreview card={card} content={content} />;
}

function DocPreview({ card, content }: { card: AssetDocCard; content: AssetDocContent }) {
  const meta = FORMAT_META[card.format];

  return (
    <div className="h-full p-[10px]">
      <div className="h-full rounded-[12px] border border-[rgba(37,99,235,0.08)] bg-white px-[10px] py-[9px] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          <div className="text-[7px] font-semibold tracking-[0.06em] uppercase text-[rgba(25,25,25,0.42)]">
            {card.owner}
          </div>
          <div className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: meta.tint }} />
        </div>
        <div className="mt-[8px] text-[7px] font-semibold leading-[10px] text-[#202124] truncate">{content.title}</div>
        <div className="mt-[4px] h-[4px] w-[72%] rounded bg-[rgba(37,99,235,0.12)]" />
        <div className="mt-[8px] rounded-[8px] bg-[rgba(37,99,235,0.05)] px-[6px] py-[5px]">
          <div className="text-[6px] font-medium leading-[9px] text-[rgba(25,25,25,0.68)] line-clamp-2">{content.lead}</div>
        </div>
        <div className="mt-[8px] space-y-[4px]">
          {content.bullets.slice(0, 5).map((bullet, index) => (
            <div
              key={`${card.id}_doc_${index}`}
              className="h-[4px] rounded bg-[rgba(25,25,25,0.07)]"
              style={{ width: `${Math.min(92, Math.max(54, 46 + bullet.length * 2.5))}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlidePreview({ card, content }: { card: AssetDocCard; content: AssetDocContent }) {
  const meta = FORMAT_META[card.format];

  return (
    <div className="h-full p-[10px]">
      <div className="h-full rounded-[12px] border border-[rgba(242,106,27,0.12)] bg-white p-[8px] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
        <div
          className="rounded-[9px] px-[8px] py-[7px] text-white"
          style={{ background: `linear-gradient(135deg, ${meta.tint} 0%, rgba(242,106,27,0.75) 100%)` }}
        >
          <div className="text-[7px] font-semibold leading-[10px] truncate">{content.title}</div>
          <div className="mt-[3px] h-[3px] w-[56%] rounded bg-[rgba(255,255,255,0.62)]" />
        </div>
        <div className="mt-[8px] grid grid-cols-[1fr_38px] gap-[8px]">
          <div className="space-y-[4px]">
            {content.bullets.slice(0, 3).map((bullet, index) => (
              <div
                key={`${card.id}_slide_${index}`}
                className="h-[4px] rounded bg-[rgba(25,25,25,0.08)]"
                style={{ width: `${Math.min(92, Math.max(58, 50 + bullet.length * 2.5))}%` }}
              />
            ))}
            <div className="mt-[6px] rounded-[6px] bg-[rgba(242,106,27,0.08)] px-[4px] py-[4px]">
              <div className="text-[6px] font-semibold text-[#f26a1b] truncate">{content.sections[0] ?? '内容结构'}</div>
              <div className="h-[3px] w-[92%] rounded bg-[rgba(242,106,27,0.26)]" />
              <div className="mt-[3px] h-[3px] w-[68%] rounded bg-[rgba(242,106,27,0.18)]" />
            </div>
          </div>
          <div className="flex flex-col justify-end gap-[4px]">
            <div className="h-[18px] rounded-[6px] bg-[rgba(242,106,27,0.18)]" />
            <div className="h-[28px] rounded-[6px] bg-[rgba(242,106,27,0.28)]" />
            <div className="h-[12px] rounded-[6px] bg-[rgba(242,106,27,0.14)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetPreview({ card, content }: { card: AssetDocCard; content: AssetDocContent }) {
  return (
    <div className="h-full p-[10px]">
      <div className="h-full rounded-[12px] border border-[rgba(24,128,56,0.10)] bg-white p-[8px] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-4 gap-[2px] rounded-[8px] bg-[rgba(24,128,56,0.10)] p-[2px]">
          {(content.tableHeaders ?? ['模块', '状态', '负责人', '完成度']).map((label) => (
            <div key={label} className="rounded-[4px] bg-[rgba(24,128,56,0.16)] px-[3px] py-[3px] text-[6px] font-semibold text-[#166534]">
              {label}
            </div>
          ))}
          {(content.tableRows ?? []).map((row, rowIndex) =>
            row.map((cell, cellIndex) => (
              <div
                key={`${rowIndex}_${cellIndex}`}
                className="rounded-[4px] bg-white px-[3px] py-[3px] text-[6px] leading-[8px] text-[rgba(25,25,25,0.72)]"
              >
                {cell}
              </div>
            )),
          )}
        </div>
        <div className="mt-[7px] flex items-center justify-between rounded-[7px] bg-[rgba(24,128,56,0.06)] px-[5px] py-[4px]">
          <span className="text-[6px] font-medium text-[#188038] truncate">{card.owner}</span>
          <span className="text-[6px] text-[rgba(24,128,56,0.74)]">{card.updatedAt}</span>
        </div>
      </div>
    </div>
  );
}

function PdfPreview({ card, content }: { card: AssetDocCard; content: AssetDocContent }) {
  return (
    <div className="h-full p-[10px]">
      <div className="h-full rounded-[12px] border border-[rgba(217,48,37,0.10)] bg-white px-[10px] py-[9px] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          <div className="rounded-[999px] bg-[rgba(217,48,37,0.08)] px-[5px] py-[2px] text-[6px] font-semibold text-[#d93025]">{content.sections[0] ?? 'REVIEW'}</div>
          <div className="text-[6px] text-[rgba(25,25,25,0.38)]">{card.updatedAt}</div>
        </div>
        <div className="mt-[8px] text-[7px] font-semibold leading-[10px] text-[#202124] line-clamp-2">{content.title}</div>
        <div className="mt-[7px] space-y-[4px]">
          {content.bullets.slice(0, 3).map((bullet, index) => (
            <div
              key={`${card.id}_pdf_${index}`}
              className="h-[4px] rounded bg-[rgba(25,25,25,0.08)]"
              style={{ width: `${Math.min(92, Math.max(58, 48 + bullet.length * 2.5))}%` }}
            />
          ))}
        </div>
        <div className="mt-[8px] grid grid-cols-2 gap-[5px]">
          <div className="rounded-[8px] bg-[rgba(217,48,37,0.06)] p-[5px]">
            <div className="text-[6px] font-semibold text-[#d93025]">{content.sections[1] ?? '摘要'}</div>
            <div className="mt-[3px] h-[3px] w-[88%] rounded bg-[rgba(217,48,37,0.16)]" />
            <div className="mt-[3px] h-[3px] w-[68%] rounded bg-[rgba(217,48,37,0.16)]" />
          </div>
          <div className="rounded-[8px] bg-[rgba(25,25,25,0.04)] p-[5px]">
            <div className="text-[6px] font-semibold text-[rgba(25,25,25,0.62)]">{content.sections[2] ?? '结论'}</div>
            <div className="mt-[3px] h-[3px] w-[78%] rounded bg-[rgba(25,25,25,0.10)]" />
            <div className="mt-[3px] h-[3px] w-[60%] rounded bg-[rgba(25,25,25,0.10)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectAssetDocumentPreview({ file }: { file: ProjectAssetFile }) {
  const content = getProjectAssetPreviewContent(file);
  const meta = FORMAT_META[file.format];

  if (file.format === 'json') {
    return (
      <div className="h-full p-[10px]">
        <div className="h-full rounded-[12px] border border-[rgba(124,58,237,0.10)] bg-white px-[10px] py-[9px] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <div className="text-[7px] font-semibold tracking-[0.06em] uppercase text-[rgba(25,25,25,0.42)]">JSON</div>
            <div className="text-[6px] text-[rgba(25,25,25,0.38)]">{new Date(file.updatedAt).toISOString().slice(0, 10)}</div>
          </div>
          <div className="mt-[8px] rounded-[8px] bg-[rgba(124,58,237,0.05)] px-[6px] py-[6px]">
            {(content.keyValues ?? []).slice(0, 4).map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-[4px] text-[6px] leading-[10px] text-[rgba(25,25,25,0.68)]">
                <span className="truncate text-[#7c3aed]">{item.key}</span>
                <span className="truncate text-[rgba(25,25,25,0.58)]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-[8px] space-y-[4px]">
            <div className="h-[4px] w-[74%] rounded bg-[rgba(25,25,25,0.08)]" />
            <div className="h-[4px] w-[66%] rounded bg-[rgba(25,25,25,0.06)]" />
            <div className="h-[4px] w-[82%] rounded bg-[rgba(25,25,25,0.06)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-[10px]">
      <div className="h-full rounded-[12px] border border-[rgba(37,99,235,0.08)] bg-white px-[10px] py-[9px] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          <div className="text-[7px] font-semibold tracking-[0.06em] uppercase text-[rgba(25,25,25,0.42)]">
            {file.format.toUpperCase()}
          </div>
          <div className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: meta.tint }} />
        </div>
        <div className="mt-[8px] text-[7px] font-semibold leading-[10px] text-[#202124] truncate">{content.title}</div>
        <div className="mt-[4px] h-[4px] w-[72%] rounded bg-[rgba(37,99,235,0.12)]" />
        <div className="mt-[8px] rounded-[8px] bg-[rgba(37,99,235,0.05)] px-[6px] py-[5px]">
          <div className="text-[6px] font-medium leading-[9px] text-[rgba(25,25,25,0.68)] line-clamp-2">{content.lead}</div>
        </div>
        <div className="mt-[8px] space-y-[4px]">
          {content.bullets.slice(0, 5).map((bullet, index) => (
            <div
              key={`${file.id}_project_doc_${index}`}
              className="h-[4px] rounded bg-[rgba(25,25,25,0.07)]"
              style={{ width: `${Math.min(92, Math.max(54, 46 + bullet.length * 2.5))}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 子视图：设计系统 ─────────────────────────────────────────────
function DesignSystemView({
  specSource, onSpecSourceChange, query,
}: {
  specSource: DesignSpecSource;
  onSpecSourceChange: (v: DesignSpecSource) => void;
  query: string;
}) {
  const [activeSpecDetail, setActiveSpecDetail] = useState<DesignSpecItem | null>(null);
  const [showSpecSourceMenu, setShowSpecSourceMenu] = useState(false);

  const q = query.trim().toLowerCase();
  const specItems = useMemo(
    () => DESIGN_SPECS[specSource].filter((it) => !q || it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)),
    [q, specSource],
  );
  const groupedSpecItems = useMemo(() => {
    const map = new Map<string, DesignSpecItem[]>();
    specItems.forEach((it) => {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    });
    return Array.from(map.entries());
  }, [specItems]);
  const currentSpecItem = activeSpecDetail && specItems.some((it) => it.id === activeSpecDetail.id)
    ? activeSpecDetail
    : specItems[0] ?? null;

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[224px] shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-[#fbfbfc]">
        <div className="flex h-full flex-col overflow-y-auto px-[14px] py-[16px]" style={{ scrollbarWidth: 'thin' }}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpecSourceMenu((prev) => !prev)}
              className="flex h-[40px] w-full items-center justify-between rounded-[14px] border border-[rgba(0,0,0,0.08)] bg-white px-[12px] text-[13px] font-medium text-[#1a1a1a] transition-colors hover:border-[rgba(20,118,255,0.28)]"
            >
              <span>{specSource}</span>
              <ChevronDown size={14} className={`text-[rgba(0,0,0,0.42)] transition-transform ${showSpecSourceMenu ? 'rotate-180' : ''}`} />
            </button>

            {showSpecSourceMenu && (
              <div className="absolute left-0 right-0 top-[46px] z-[20] rounded-[14px] border border-[rgba(0,0,0,0.08)] bg-white p-[6px]">
                {DESIGN_SPEC_SOURCES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSpecSourceChange(s);
                      setActiveSpecDetail(null);
                      setShowSpecSourceMenu(false);
                    }}
                    className={`flex h-[34px] w-full items-center rounded-[10px] px-[10px] text-left text-[13px] transition-colors ${
                      specSource === s
                        ? 'bg-[#eff6ff] text-[#1476ff] font-medium'
                        : 'text-[rgba(0,0,0,0.72)] hover:bg-[rgba(20,118,255,0.05)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-[14px] space-y-[12px]">
            {groupedSpecItems.map(([cat, list]) => (
              <div key={cat}>
                <div className="px-[6px] text-[11px] font-semibold tracking-[0.02em] text-[rgba(0,0,0,0.38)]">{cat}</div>
                <div className="mt-[4px] space-y-[2px]">
                  {list.map((item) => {
                    const active = currentSpecItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSpecDetail(item)}
                        className={`flex min-h-[38px] w-full items-center rounded-[12px] px-[12px] text-left text-[14px] leading-[22px] transition-colors ${
                          active
                            ? 'bg-[#e9f1ff] text-[#0a59f7] font-medium'
                            : 'text-[rgba(0,0,0,0.74)] hover:bg-[rgba(20,118,255,0.05)]'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!groupedSpecItems.length && (
              <div className="rounded-[14px] border border-dashed border-[rgba(0,0,0,0.10)] px-[12px] py-[18px] text-[12px] leading-[20px] text-[rgba(0,0,0,0.45)]">
                没有匹配的规范条目
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-auto">
        <DesignSpecView specSource={specSource} item={currentSpecItem} />
      </div>
    </div>
  );
}

function IllustrationPanel({
  source, category, onCategoryChange, query,
}: {
  source: AssetSource;
  category: (typeof ILLUSTRATION_CATEGORIES)[number];
  onCategoryChange: (v: (typeof ILLUSTRATION_CATEGORIES)[number]) => void;
  query: string;
}) {
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[224px] shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-[#fbfbfc]">
        <div className="flex h-full flex-col overflow-y-auto px-[14px] py-[16px]" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-[4px]">
            {ILLUSTRATION_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCategoryChange(c)}
                className={`flex h-[38px] w-full items-center rounded-[12px] px-[12px] text-left text-[14px] transition-colors ${
                  category === c
                    ? 'bg-[#e9f1ff] text-[#0a59f7] font-medium'
                    : 'text-[rgba(0,0,0,0.72)] hover:bg-[rgba(20,118,255,0.05)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 overflow-auto">
        <IllustrationView source={source} category={category} onCategoryChange={onCategoryChange} query={query} />
      </div>
    </div>
  );
}

function IconPanel({
  source, category, onCategoryChange, query,
}: {
  source: AssetSource;
  category: (typeof ICON_CATEGORIES)[number];
  onCategoryChange: (v: (typeof ICON_CATEGORIES)[number]) => void;
  query: string;
}) {
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[224px] shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-[#fbfbfc]">
        <div className="flex h-full flex-col overflow-y-auto px-[14px] py-[16px]" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-[4px]">
            {ICON_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCategoryChange(c)}
                className={`flex h-[38px] w-full items-center rounded-[12px] px-[12px] text-left text-[14px] transition-colors ${
                  category === c
                    ? 'bg-[#e9f1ff] text-[#0a59f7] font-medium'
                    : 'text-[rgba(0,0,0,0.72)] hover:bg-[rgba(20,118,255,0.05)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 overflow-auto">
        <IconView source={source} category={category} onCategoryChange={onCategoryChange} query={query} />
      </div>
    </div>
  );
}

function DesignSpecView({
  specSource,
  item,
}: {
  specSource: DesignSpecSource;
  item: DesignSpecItem | null;
}) {
  if (!item) return <div className="px-[28px] py-[60px] text-[13px] text-[rgba(0,0,0,0.4)]">没有匹配的规范条目</div>;

  return <DesignSpecDetail item={item} specSource={specSource} />;
}

// ─── 设计规范：文档详情页（类 Ant Design docs） ─────────────────────
function DesignSpecDetail({
  item,
  specSource,
}: {
  item: DesignSpecItem;
  specSource: DesignSpecSource;
}) {
  const sections = [
    { id: 'overview', title: '概述', body: item.description },
    { id: 'when-to-use', title: '何时使用' },
    { id: 'principles', title: '设计原则' },
    { id: 'visual', title: '视觉规范' },
    { id: 'interaction', title: '交互行为' },
    { id: 'dos-donts', title: '正反例' },
  ];

  return (
    <article className="min-w-0 px-[28px] py-[28px] max-w-[980px]">
        <div className="flex items-center gap-[6px] text-[11px] text-[rgba(0,0,0,0.45)] mb-[8px]">
          <span>{specSource}</span>
          <span>/</span>
          <span>{item.category}</span>
        </div>
        <h1 className="text-[28px] font-semibold text-[#1a1a1a] leading-[36px]">{item.name}</h1>

        <p className="mt-[16px] text-[14px] leading-[26px] text-[rgba(0,0,0,0.72)]">
          {item.description}。本规范属于 {specSource} 设计体系中的{item.category}章节，定义了 {item.name} 的视觉样式、交互状态、使用边界与可访问性要求。
        </p>

        <ul className="mt-[14px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.68)] list-disc pl-[22px] space-y-[4px]">
          <li>为用户在各个阶段提供必要、准确、一致的视觉与行为反馈。</li>
          <li>同一场景下，同层级的 {item.name} 保持统一样式，避免组合滥用。</li>
          <li>严格遵守无障碍要求（对比度、焦点态、键盘可达）。</li>
        </ul>

        <hr className="my-[24px] border-0 border-t border-[rgba(0,0,0,0.06)]" />

        <section id="when-to-use" className="mb-[28px]">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a] leading-[28px] mb-[10px]">何时使用</h2>
          <p className="text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)]">
            当用户需要在 {item.category} 场景下进行核心操作时使用 {item.name}。应优先复用现有能力，避免自定义变体；在无法满足时，先提交到 {specSource} 设计体系治理流程，评审通过后再扩展。
          </p>
        </section>

        <section id="principles" className="mb-[28px]">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a] leading-[28px] mb-[10px]">设计原则</h2>
          <ul className="text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] list-disc pl-[22px] space-y-[4px]">
            <li><strong className="text-[#1a1a1a] font-medium">一致性</strong>：跨页面保持统一样式与行为。</li>
            <li><strong className="text-[#1a1a1a] font-medium">可预期</strong>：状态变化提供明确反馈。</li>
            <li><strong className="text-[#1a1a1a] font-medium">克制</strong>：避免过度装饰性元素，突出信息层级。</li>
          </ul>
        </section>

        <section id="visual" className="mb-[28px]">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a] leading-[28px] mb-[10px]">视觉规范</h2>
          <p className="text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] mb-[12px]">
            默认尺寸、圆角、留白、阴影参照 {specSource} 设计 Token，以下为示意预览：
          </p>
          <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[linear-gradient(135deg,#f8fafc,#eef2ff)] px-[24px] py-[40px] flex items-center justify-center">
            <div className="inline-flex items-center gap-[10px] h-[38px] px-[20px] rounded-[10px] bg-[#1476ff] text-white text-[13px] font-medium shadow-[0_6px_18px_rgba(20,118,255,0.25)]">
              {item.name} 示意
            </div>
          </div>
        </section>

        <section id="interaction" className="mb-[28px]">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a] leading-[28px] mb-[10px]">交互行为</h2>
          <ul className="text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] list-disc pl-[22px] space-y-[4px]">
            <li>Hover：背景/边框变化，时长 120ms。</li>
            <li>Active：下压反馈，避免闪烁。</li>
            <li>Disabled：降低不透明度，保留 tooltip 说明。</li>
            <li>Loading：显示内置 Loading 指示，禁用重复触发。</li>
          </ul>
        </section>

        <section id="dos-donts">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a] leading-[28px] mb-[10px]">正反例</h2>
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="rounded-[12px] border border-[rgba(5,150,105,0.25)] bg-[#ecfdf5] p-[14px]">
              <div className="text-[12px] font-semibold text-[#059669] mb-[4px]">推荐</div>
              <div className="text-[12px] leading-[20px] text-[rgba(0,0,0,0.72)]">同一页面主操作只使用一个主 {item.name}，视觉层级清晰。</div>
            </div>
            <div className="rounded-[12px] border border-[rgba(220,38,38,0.25)] bg-[#fef2f2] p-[14px]">
              <div className="text-[12px] font-semibold text-[#dc2626] mb-[4px]">避免</div>
              <div className="text-[12px] leading-[20px] text-[rgba(0,0,0,0.72)]">多个强调色 {item.name} 同时出现，造成焦点争夺。</div>
            </div>
          </div>
        </section>

        <div className="mt-[24px] text-[11px] text-[rgba(0,0,0,0.4)]">
          以上为示例文档结构，后续将接入真实 {specSource} 规范内容。章节：{sections.map((s) => s.title).join(' · ')}
        </div>
      </article>
  );
}

function IllustrationView({
  source, category, onCategoryChange, query,
}: {
  source: AssetSource;
  category: (typeof ILLUSTRATION_CATEGORIES)[number];
  onCategoryChange: (v: (typeof ILLUSTRATION_CATEGORIES)[number]) => void;
  query: string;
}) {
  const q = query.trim().toLowerCase();
  const list = ILLUSTRATIONS.filter((it) => it.source === source)
    .filter((it) => category === '全部' || it.category === category)
    .filter((it) => !q || it.title.toLowerCase().includes(q));

  return (
    <div className="px-[20px] pb-[24px] pt-[20px]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[14px]">
        {list.map((it) => (
          <div key={it.id} className="rounded-[12px] overflow-hidden border border-[rgba(0,0,0,0.06)] bg-white/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
            <div className="h-[140px]" style={{ background: it.gradient }} />
            <div className="p-[10px] flex items-center justify-between">
              <span className="text-[12px] text-[#1a1a1a] truncate">{it.title}</span>
              <span className="text-[10px] text-[rgba(0,0,0,0.4)]">{it.category}</span>
            </div>
          </div>
        ))}
      </div>
      {!list.length && (
        <div className="py-[60px] text-[13px] text-[rgba(0,0,0,0.4)] text-center">没有匹配的插画</div>
      )}
    </div>
  );
}

function IconView({
  source, category, onCategoryChange, query,
}: {
  source: AssetSource;
  category: (typeof ICON_CATEGORIES)[number];
  onCategoryChange: (v: (typeof ICON_CATEGORIES)[number]) => void;
  query: string;
}) {
  const q = query.trim().toLowerCase();
  const list = ICONS.filter((it) => it.source === source)
    .filter((it) => category === '全部' || it.category === category)
    .filter((it) => !q || it.name.toLowerCase().includes(q));

  return (
    <div className="px-[20px] pb-[24px] pt-[20px]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-[10px]">
        {list.map((it) => (
          <div
            key={it.id}
            className="aspect-square rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-white/80 hover:border-[rgba(20,118,255,0.35)] hover:shadow-[0_4px_12px_rgba(20,118,255,0.08)] transition-all flex flex-col items-center justify-center gap-[4px] p-[8px] cursor-pointer"
          >
            <span className="text-[28px] leading-none">{it.glyph}</span>
            <span className="text-[10px] text-[rgba(0,0,0,0.55)] truncate max-w-full">{it.name}</span>
          </div>
        ))}
      </div>
      {!list.length && (
        <div className="py-[60px] text-[13px] text-[rgba(0,0,0,0.4)] text-center">没有匹配的图标</div>
      )}
    </div>
  );
}

// ─── 子视图：原型开发 ─────────────────────────────────────────────
function PrototypeDevView({
  activeDomain, onActiveDomainChange, enabledMap, onToggle, query,
}: {
  activeDomain: string;
  onActiveDomainChange: (k: string) => void;
  enabledMap: Record<string, boolean>;
  onToggle: (id: string, name: string) => void;
  query: string;
}) {
  const q = query.trim().toLowerCase();
  const domains = q
    ? PROTOTYPE_DOMAINS.filter((d) =>
        d.label.toLowerCase().includes(q)
        || d.solutions.some((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
      )
    : PROTOTYPE_DOMAINS;
  const current = domains.find((d) => d.key === activeDomain) ?? domains[0];

  return (
    <div className="flex min-h-full">
      <aside className="w-[220px] shrink-0 border-r border-[rgba(0,0,0,0.06)] py-[16px] px-[12px]">
        <div className="text-[11px] font-semibold text-[rgba(0,0,0,0.4)] px-[8px] mb-[8px]">业务领域</div>
        <div className="flex flex-col gap-[2px]">
          {domains.map((d) => {
            const enabledCount = d.solutions.filter((s) => enabledMap[s.id]).length;
            const isActive = current?.key === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => onActiveDomainChange(d.key)}
                className={`group flex items-center justify-between gap-[8px] h-[34px] px-[10px] rounded-[8px] text-[13px] transition-colors ${
                  isActive ? 'bg-[#eff6ff] text-[#1476ff] font-medium' : 'text-[#1a1a1a] hover:bg-[rgba(0,0,0,0.04)]'
                }`}
              >
                <span className="truncate">{d.label}</span>
                <span className="flex items-center gap-[4px] shrink-0">
                  {enabledCount > 0 && (
                    <span className="text-[10px] px-[5px] py-[1px] rounded-full bg-[#ecfdf5] text-[#059669]">
                      {enabledCount} 启用
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-[24px]">
        {current ? (
          <>
            <div className="mb-[16px]">
              <div className="text-[14px] font-semibold text-[#1a1a1a]">{current.label}</div>
              <div className="text-[12px] text-[rgba(0,0,0,0.55)] mt-[4px]">{current.summary}</div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[12px]">
              {current.solutions.map((s) => {
                const enabled = !!enabledMap[s.id];
                return (
                  <div
                    key={s.id}
                    className={`rounded-[12px] border p-[14px] transition-all ${
                      enabled
                        ? 'border-[rgba(20,118,255,0.4)] bg-[rgba(20,118,255,0.04)] shadow-[0_6px_18px_rgba(20,118,255,0.08)]'
                        : 'border-[rgba(0,0,0,0.06)] bg-white/80 hover:border-[rgba(0,0,0,0.12)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-[8px] mb-[8px]">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#1a1a1a]">{s.name}</div>
                        <div className="mt-[2px] flex items-center gap-[4px] flex-wrap">
                          {s.tags.map((t) => (
                            <span key={t} className="text-[10px] px-[5px] py-[1px] rounded bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.55)]">{t}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => onToggle(s.id, s.name)}
                        className={`shrink-0 relative h-[18px] w-[32px] rounded-full transition-colors ${enabled ? 'bg-[#1476ff]' : 'bg-[rgba(0,0,0,0.18)]'}`}
                      >
                        <span className={`absolute top-1/2 -translate-y-1/2 h-[12px] w-[12px] rounded-full bg-white transition-[left] ${enabled ? 'left-[17px]' : 'left-[3px]'}`} />
                      </button>
                    </div>
                    <div className="text-[12px] leading-[18px] text-[rgba(0,0,0,0.6)] mb-[12px] min-h-[36px]">
                      {s.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={s.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-[4px] text-[11px] text-[#1476ff] hover:underline"
                      >
                        {s.docSiteName}
                        <ExternalLink size={10} />
                      </a>
                      {enabled && (
                        <span className="inline-flex items-center gap-[3px] text-[10px] text-[#059669]">
                          <Check size={11} /> 已启用
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-[60px] text-[13px] text-[rgba(0,0,0,0.4)] text-center">没有匹配的领域</div>
        )}
      </div>
    </div>
  );
}

// ─── 平台模板详情页（页内二级页面） ────────────────────────────────
function PlatformTemplateDetailPage({
  template,
  tabLabel,
  onBack,
  onToast,
}: {
  template: AssetDocCard;
  tabLabel: string;
  onBack: () => void;
  onToast?: (msg: string) => void;
}) {
  const content = getAssetDocContent(template);

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-[rgba(25,25,25,0.08)] px-[28px] py-[18px]">
        <div className="flex items-start justify-between gap-[20px]">
          <div className="min-w-0">
            <div className="flex items-center gap-[4px] text-[12px] leading-[18px]">
              <button
                type="button"
                onClick={onBack}
                className="text-[rgba(25,25,25,0.55)] hover:text-[#0a59f7]"
              >
                {tabLabel}
              </button>
              <span className="text-[rgba(25,25,25,0.35)]">/</span>
              <span className="text-[#191919]">{template.title}.{template.format}</span>
            </div>
            <div className="mt-[8px] flex items-center gap-[10px]">
              <FormatIcon format={template.format} />
              <div>
                <div className="text-[18px] font-semibold leading-[28px] text-[#191919]">{template.title}</div>
                <div className="mt-[2px] text-[13px] leading-[22px] text-[rgba(25,25,25,0.55)]">{content.lead}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={() => onToast?.(`已开始下载《${template.title}.${template.format}》`)}
              className="inline-flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[rgba(25,25,25,0.04)] px-[14px] text-[13px] font-medium text-[#191919] hover:bg-[rgba(25,25,25,0.08)] transition-colors"
            >
              <Download size={14} />
              <span>下载</span>
            </button>
            <button
              type="button"
              onClick={() => onToast?.(`已将《${template.title}》引用到当前会话`)}
              className="inline-flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[#1476ff] px-[14px] text-[13px] font-medium text-white hover:bg-[#0f67de] transition-colors"
            >
              <ExternalLink size={14} />
              <span>引用到当前会话</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[28px] py-[24px]" style={{ scrollbarWidth: 'thin' }}>
        <article className="max-w-[980px]">
          <div className="text-[11px] text-[rgba(0,0,0,0.45)] mb-[6px]">
            {template.source === 'platform' ? '平台资产' : '项目资产'} · {template.format.toUpperCase()}
          </div>
          <h1 className="text-[26px] font-semibold text-[#1a1a1a] leading-[34px]">{content.title}</h1>
          <p className="mt-[10px] text-[13px] leading-[22px] text-[rgba(0,0,0,0.55)]">{content.lead}</p>

          <div className="mt-[16px] rounded-[10px] border border-[rgba(20,118,255,0.2)] bg-[#eff6ff] px-[14px] py-[10px] text-[12px] leading-[20px] text-[#0a59f7]">
            当前为只读预览。可查看、下载或引用至会话，不支持直接编辑；如需二次加工请先下载到本地。
          </div>

          {template.format === 'xls' || template.format === 'xlsx' ? (
            <TemplateSheetBody template={template} content={content} />
          ) : template.format === 'ppt' || template.format === 'pptx' ? (
            <TemplateSlideBody template={template} content={content} />
          ) : (
            <TemplateDocumentBody template={template} content={content} />
          )}

          <div className="mt-[32px] pt-[16px] border-t border-[rgba(0,0,0,0.06)] text-[11px] text-[rgba(0,0,0,0.4)]">
            最后更新：{template.updatedAt} · 负责人：{template.owner}
          </div>
        </article>
      </div>
    </section>
  );
}

function TemplateDocumentBody({ template, content }: { template: AssetDocCard; content: AssetDocContent }) {
  return (
    <>
      <h2 className="mt-[28px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">{`一、${content.sections[0] ?? '背景与目标'}`}</h2>
      <p className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)]">{content.lead}</p>

      <h2 className="mt-[20px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">{`二、${content.sections[1] ?? '研究对象 / 样本'}`}</h2>
      <ul className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] list-disc pl-[22px] space-y-[4px]">
        {content.bullets.slice(0, 3).map((bullet) => (
          <li key={`${template.id}_${bullet}`}>{bullet}</li>
        ))}
      </ul>

      <h2 className="mt-[20px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">{`三、${content.sections[2] ?? '关键问题清单'}`}</h2>
      <ol className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] list-decimal pl-[22px] space-y-[4px]">
        {content.bullets.map((bullet) => (
          <li key={`${template.id}_ordered_${bullet}`}>{bullet}</li>
        ))}
      </ol>

      <h2 className="mt-[20px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">{`四、${content.sections[3] ?? '记录框架'}`}</h2>
      <p className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)]">
        当前模板建议围绕 <code className="px-[4px] py-[1px] rounded bg-[rgba(0,0,0,0.05)] text-[12px]">{content.sections.join(' / ')}</code> 组织正文结构，便于跨项目复用与复盘。
      </p>
      <blockquote className="mt-[10px] border-l-[3px] border-[#1476ff] pl-[12px] text-[13px] italic text-[rgba(0,0,0,0.65)] leading-[22px]">
        “{content.lead}”
      </blockquote>

      <h2 className="mt-[20px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">{`五、${content.sections[4] ?? '结论与建议'}`}</h2>
      <ul className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] list-disc pl-[22px] space-y-[4px]">
        {content.bullets.slice(1).map((bullet) => (
          <li key={`${template.id}_suggest_${bullet}`}>{bullet}</li>
        ))}
      </ul>

      <h2 className="mt-[20px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">{`六、${content.sections[5] ?? '附录'}`}</h2>
      <p className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)]">
        附带原始材料、阶段记录与版本说明，确保《{template.title}.{template.format}》中的结论可追溯。
      </p>
    </>
  );
}

function TemplateSheetBody({ template, content }: { template: AssetDocCard; content: AssetDocContent }) {
  const headers = content.tableHeaders ?? ['模块', '状态', '负责人', '完成度'];
  const rows = content.tableRows ?? [];

  return (
    <>
      <h2 className="mt-[28px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">一、表格说明</h2>
      <p className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)]">{content.lead}</p>

      <div className="mt-[16px] overflow-hidden rounded-[12px] border border-[rgba(24,128,56,0.12)] bg-white">
        <div className="grid grid-cols-4 bg-[rgba(24,128,56,0.08)]">
          {headers.map((header) => (
            <div key={header} className="px-[14px] py-[10px] text-[12px] font-semibold text-[#166534] border-r last:border-r-0 border-[rgba(24,128,56,0.10)]">
              {header}
            </div>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div key={`${template.id}_row_${rowIndex}`} className="grid grid-cols-4 border-t border-[rgba(0,0,0,0.06)]">
            {row.map((cell, cellIndex) => (
              <div key={`${template.id}_cell_${rowIndex}_${cellIndex}`} className="px-[14px] py-[10px] text-[12px] text-[rgba(0,0,0,0.72)] border-r last:border-r-0 border-[rgba(0,0,0,0.04)]">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      <h2 className="mt-[20px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">二、使用建议</h2>
      <ul className="mt-[8px] text-[13px] leading-[24px] text-[rgba(0,0,0,0.72)] list-disc pl-[22px] space-y-[4px]">
        {content.bullets.map((bullet) => (
          <li key={`${template.id}_sheet_${bullet}`}>{bullet}</li>
        ))}
      </ul>
    </>
  );
}

function TemplateSlideBody({ template, content }: { template: AssetDocCard; content: AssetDocContent }) {
  return (
    <>
      <h2 className="mt-[28px] text-[18px] font-semibold text-[#1a1a1a] leading-[26px]">一、演示结构</h2>
      <div className="mt-[12px] rounded-[16px] border border-[rgba(242,106,27,0.14)] bg-white p-[18px] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="rounded-[12px] bg-[linear-gradient(135deg,#f26a1b_0%,#ff8f55_100%)] px-[18px] py-[16px] text-white">
          <div className="text-[18px] font-semibold">{content.title}</div>
          <div className="mt-[6px] text-[12px] text-[rgba(255,255,255,0.82)]">{content.lead}</div>
        </div>
        <div className="mt-[16px] grid grid-cols-[1.4fr_0.8fr] gap-[14px]">
          <div className="space-y-[10px]">
            {content.bullets.map((bullet) => (
              <div key={`${template.id}_slide_b_${bullet}`} className="rounded-[10px] bg-[rgba(242,106,27,0.06)] px-[12px] py-[10px] text-[13px] text-[rgba(0,0,0,0.72)]">
                {bullet}
              </div>
            ))}
          </div>
          <div className="rounded-[12px] bg-[rgba(242,106,27,0.08)] p-[14px]">
            <div className="text-[12px] font-semibold text-[#f26a1b]">{content.sections.join(' · ')}</div>
            <div className="mt-[12px] h-[88px] rounded-[10px] bg-[rgba(242,106,27,0.14)]" />
          </div>
        </div>
      </div>
    </>
  );
}
