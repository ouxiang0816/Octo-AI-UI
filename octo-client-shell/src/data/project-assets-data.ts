export const PROJECT_ASSET_STORAGE_KEY = 'octo.client.projectAssets';
export const PROJECT_ASSETS_UPDATED_EVENT = 'octo.client.projectAssets.updated';

export type ProjectAssetFileFormat = 'doc' | 'md' | 'txt' | 'json';
export type ProjectAssetSectionKey = 'user_insight' | 'design_system' | 'illustration' | 'icon' | 'prototype_dev' | 'experience_eval';
export type ArtifactWorkflowKey = 'ui-design' | 'demo' | 'creative' | 'research' | 'interview';

export interface ProjectAssetFile {
  id: string;
  name: string;
  format: ProjectAssetFileFormat;
  content: string;
  updatedAt: number;
}

export interface ProjectAssetFolder {
  id: string;
  name: string;
  files: ProjectAssetFile[];
}

export interface ProjectAssetSection {
  key: ProjectAssetSectionKey;
  label: string;
  folders: ProjectAssetFolder[];
}

const DEFAULT_PROJECT_ASSETS: ProjectAssetSection[] = [
  {
    key: 'user_insight',
    label: '用户洞察',
    folders: [
      { id: 'pa-ui-communication', name: '用户访谈', files: [] },
      { id: 'pa-ui-interview', name: '访谈记录', files: [] },
    ],
  },
  {
    key: 'design_system',
    label: '设计系统',
    folders: [{ id: 'pa-ds-components', name: '组件规范', files: [] }],
  },
  { key: 'illustration', label: '插画', folders: [] },
  { key: 'icon', label: '图标', folders: [] },
  {
    key: 'experience_eval',
    label: '体验评估',
    folders: [{ id: 'pa-ee-review', name: '走查记录', files: [] }],
  },
  {
    key: 'prototype_dev',
    label: '原型开发',
    folders: [{ id: 'pa-pd-scheme', name: '方案草稿', files: [] }],
  },
];

function makeProjectAssetId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadProjectAssets(): ProjectAssetSection[] {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_ASSETS;
  try {
    const raw = window.localStorage.getItem(PROJECT_ASSET_STORAGE_KEY);
    if (!raw) return DEFAULT_PROJECT_ASSETS;
    const parsed = JSON.parse(raw) as ProjectAssetSection[];
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_PROJECT_ASSETS;
    return DEFAULT_PROJECT_ASSETS.map((def) => parsed.find((item) => item.key === def.key) ?? def);
  } catch {
    return DEFAULT_PROJECT_ASSETS;
  }
}

export function saveProjectAssets(items: ProjectAssetSection[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROJECT_ASSET_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(PROJECT_ASSETS_UPDATED_EVENT));
}

function getArtifactTarget(workflow: ArtifactWorkflowKey): { sectionKey: ProjectAssetSectionKey; folderId: string; format: ProjectAssetFileFormat } {
  switch (workflow) {
    case 'interview':
      return { sectionKey: 'user_insight', folderId: 'pa-ui-interview', format: 'md' };
    case 'research':
      return { sectionKey: 'experience_eval', folderId: 'pa-ee-review', format: 'md' };
    case 'ui-design':
    case 'demo':
    case 'creative':
    default:
      return { sectionKey: 'prototype_dev', folderId: 'pa-pd-scheme', format: 'txt' };
  }
}

export function appendGeneratedArtifactToProjectAssets(
  workflow: ArtifactWorkflowKey,
  fileName: string,
  content: string,
) {
  const target = getArtifactTarget(workflow);
  const nextFile: ProjectAssetFile = {
    id: makeProjectAssetId('pa_file'),
    name: fileName,
    format: target.format,
    content,
    updatedAt: Date.now(),
  };

  const nextAssets = loadProjectAssets().map((section) => {
    if (section.key !== target.sectionKey) return section;
    return {
      ...section,
      folders: section.folders.map((folder) => (
        folder.id === target.folderId
          ? { ...folder, files: [...folder.files, nextFile] }
          : folder
      )),
    };
  });

  saveProjectAssets(nextAssets);
  return nextFile;
}
