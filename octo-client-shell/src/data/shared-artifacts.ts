export const SHARED_ARTIFACT_STORAGE_PREFIX = 'octo.shared-artifact.';
export const SHARED_ARTIFACT_HASH_PREFIX = '#shared-artifact=';

export interface SharedArtifactPayload {
  id: string;
  workflow: 'ui-design' | 'demo' | 'creative' | 'research' | 'interview';
  title: string;
  subtitle?: string;
  content: string;
  createdAt: number;
}

function makeShareId() {
  return `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSharedArtifact(payload: Omit<SharedArtifactPayload, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') return null;
  const record: SharedArtifactPayload = {
    ...payload,
    id: makeShareId(),
    createdAt: Date.now(),
  };
  window.localStorage.setItem(`${SHARED_ARTIFACT_STORAGE_PREFIX}${record.id}`, JSON.stringify(record));
  return {
    record,
    url: `${window.location.origin}${window.location.pathname}${SHARED_ARTIFACT_HASH_PREFIX}${record.id}`,
  };
}

export function loadSharedArtifact(id: string): SharedArtifactPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${SHARED_ARTIFACT_STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as SharedArtifactPayload;
  } catch {
    return null;
  }
}
