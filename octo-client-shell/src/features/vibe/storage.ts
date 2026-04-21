import type { VibeSession } from './types';

const PUB_PREFIX = 'vibe-pub-';
const COLLAB_PREFIX = 'vibe-collab-';
const LIVE_PREFIX = 'vibe-live-'; // realtime canvas state for collab

export function savePublished(id: string, session: VibeSession) {
  localStorage.setItem(PUB_PREFIX + id, JSON.stringify(session));
}

export function loadPublished(id: string): VibeSession | null {
  try {
    const raw = localStorage.getItem(PUB_PREFIX + id);
    return raw ? (JSON.parse(raw) as VibeSession) : null;
  } catch {
    return null;
  }
}

export function saveCollab(id: string, session: VibeSession) {
  localStorage.setItem(COLLAB_PREFIX + id, JSON.stringify(session));
}

export function loadCollab(id: string): VibeSession | null {
  try {
    const raw = localStorage.getItem(COLLAB_PREFIX + id);
    return raw ? (JSON.parse(raw) as VibeSession) : null;
  } catch {
    return null;
  }
}

/** Push a live canvas update (called by owner on every generation) */
export function pushLiveUpdate(collabId: string, session: Omit<VibeSession, 'id' | 'publishedAt'>) {
  localStorage.setItem(LIVE_PREFIX + collabId, JSON.stringify({ ...session, ts: Date.now() }));
}

/** Read the latest live canvas update */
export function readLiveUpdate(collabId: string): (Omit<VibeSession, 'id' | 'publishedAt'> & { ts: number }) | null {
  try {
    const raw = localStorage.getItem(LIVE_PREFIX + collabId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getLiveKey(collabId: string) {
  return LIVE_PREFIX + collabId;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}
