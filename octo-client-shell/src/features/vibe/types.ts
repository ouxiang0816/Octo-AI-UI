import type React from 'react';

// ─── Canvas / Page ──────────────────────────────────────────────────────────
export type CanvasType = 'login' | 'dashboard' | 'detail' | 'form' | 'list' | 'profile' | 'car-home';

export interface GeneratedPage {
  id: string;
  name: string;
  canvasType: CanvasType;
}

export interface VibeSession {
  id: string;
  title: string;
  spec: string;
  pages: GeneratedPage[];
  activePageId: string | null;
  publishedAt: number;
  owner: string;
  collaborators: string[];
  /** collab sessions also carry the latest canvas update sequence */
  seq?: number;
}

// ─── Chat ───────────────────────────────────────────────────────────────────
export type MsgRole = 'ai' | 'user';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'pix' | 'mention';
}

export interface Msg {
  id: string;
  role: MsgRole;
  text: string;
  attachments?: Attachment[];
  pages?: GeneratedPage[];
  thinking?: boolean;
  thinkingLines?: string[];
  thinkingDone?: boolean;
  prdCard?: { title: string; content: string };
}

// ─── Versions ───────────────────────────────────────────────────────────────
export interface CanvasVersion {
  id: string;
  page: GeneratedPage;
  prompt: string;
  spec: string;
  createdAt: number;
}

// ─── Research / Assets ──────────────────────────────────────────────────────
export interface ResearchDoc {
  id: string;
  type: 'journey' | 'cj' | 'report' | 'competitor' | 'interview' | 'persona';
  title: string;
  author: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  icon: React.FC<{ size?: number; className?: string }>;
  category: string;
  official?: boolean;
  detail?: {
    tagline: string;
    overview: string;
    useCases: string[];
    outputs: string[];
    workflow: string[];
    rules: string[];
    version: string;
    updatedAt: string;
  };
}

export type RefDrawerItem =
  | { kind: 'doc'; doc: ResearchDoc }
  | { kind: 'component'; name: string }
  | { kind: 'illustration'; name: string; color: string };

// ─── UI state ───────────────────────────────────────────────────────────────
export type LeftTab = 'chat' | 'assets' | 'research' | 'skills';
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type MentionTab = 'assets' | 'research' | 'skills' | 'requirements';

// ─── Component props ────────────────────────────────────────────────────────
export interface VibeDesignProps {
  onClose: () => void;
  onToast: (msg: string) => void;
  /** Set when entering via a collab link */
  collabId?: string;
  isCollaborator?: boolean;
  initialPages?: GeneratedPage[];
  initialSpec?: string;
}
