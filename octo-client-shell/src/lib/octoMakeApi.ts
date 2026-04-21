/**
 * Octo Make API client — bridges the frontend with the Node.js backend
 * Backend base URL is configured via VITE_API_URL env variable.
 * Development default: http://localhost:3001
 * Production: http://8.135.52.162:3001 (set in Vercel env)
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
function safeStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  safeStorageGet('octo_use_mock') === 'true';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FigmaDesignData {
  /** Display name of the frame/component */
  name: string;
  type?: string;
  width?: number;
  height?: number;
  /** Hex colors extracted from fills */
  colors: string[];
  /** Font families used */
  fonts: string[];
  /** Top-level frames and components */
  components: Array<{ name: string; type: string; width?: number; height?: number }>;
  /** Sample text content from the design */
  textContent?: string[];
  /** Number of direct children */
  childCount?: number;
  /** Human-readable size + type description */
  description?: string;
  /** PNG thumbnail URL (Figma CDN, for display only) */
  thumbnail?: string | null;
  /** Structured design spec extracted from Figma node tree (used by AI for accurate generation) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  designSpec?: Record<string, any> | null;
  /** Figma file key */
  fileKey: string;
  /** Selected node ID (colon-separated) */
  nodeId?: string | null;
}

export interface StreamCallbacks {
  onThinkingLine?: (line: string) => void;
  onContent?: (token: string) => void;
  onDone?: (fullHtml: string) => void;
  onError?: (message: string) => void;
}

const MOCK_FIGMA_DATA: FigmaDesignData = {
  name: 'Mock Design',
  type: 'FRAME',
  width: 375,
  height: 812,
  colors: ['#0F172A', '#6366F1', '#A5B4FC', '#E2E8F0'],
  fonts: ['Inter', 'SF Pro Display'],
  components: [{ name: 'Hero Card', type: 'FRAME', width: 343, height: 180 }],
  textContent: ['本地 Mock 数据', '未连接真实后端'],
  childCount: 3,
  description: 'FRAME · 375×812px · 1 个组件',
  thumbnail: null,
  designSpec: {
    name: 'Mock Design',
    type: 'FRAME',
    w: 375, h: 812, x: 0, y: 0,
    bg: '#0F172A',
    children: [
      {
        name: 'Title', type: 'TEXT', w: 280, h: 36, x: 20, y: 60,
        text: '本地 Mock 设计稿',
        font: { size: 28, weight: 700, family: 'Inter', color: '#ffffff' }
      },
      {
        name: 'Card', type: 'FRAME', w: 343, h: 180, x: 16, y: 120, radius: 20, bg: '#1E293B',
        children: [
          { name: 'Desc', type: 'TEXT', w: 300, h: 20, x: 16, y: 16, text: '当前未连接后端服务器，使用 Mock 数据预览。', font: { size: 14, weight: 400, family: 'Inter', color: '#94A3B8' } }
        ]
      }
    ]
  },
  fileKey: 'mock-file-key',
  nodeId: 'mock-node-id',
};

// ─── Figma Parser ─────────────────────────────────────────────────────────────

export async function parseFigmaUrl(url: string): Promise<FigmaDesignData> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_FIGMA_DATA);
  }
  const res = await fetch(
    `${API_BASE}/api/figma/parse?url=${encodeURIComponent(url)}`
  );
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = ((await res.json()) as { error: string }).error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<FigmaDesignData>;
}

// Mock 模式下返回空 HTML，让 DemoCanvas 展示默认的 ComputeGraphViewer
const MOCK_HTML = ''; 

// ─── AI Demo Generator (streaming) ───────────────────────────────────────────

/**
 * Streams an AI-generated HTML demo from the Kimi backend.
 * Thinking lines are accumulated line-by-line and surfaced via onThinkingLine.
 * HTML content tokens are streamed via onContent.
 * Full HTML is returned via onDone when the stream ends.
 */
export async function generateDemoStream(
  prompt: string,
  figmaData: FigmaDesignData | null,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const { onThinkingLine, onContent, onDone, onError } = callbacks;

  if (USE_MOCK) {
    const thinking = ['Mock: 解析设计需求', 'Mock: 规划页面结构', 'Mock: 生成交互组件'];
    for (const line of thinking) {
      if (signal?.aborted) return;
      await new Promise(r => setTimeout(r, 400));
      if (signal?.aborted) return;
      onThinkingLine?.(line);
    }
    if (signal?.aborted) return;
    await new Promise(r => setTimeout(r, 300));
    if (signal?.aborted) return;
    const chunks = [MOCK_HTML.slice(0, 200), MOCK_HTML.slice(200, 500), MOCK_HTML.slice(500)];
    for (const chunk of chunks) {
      if (signal?.aborted) return;
      await new Promise(r => setTimeout(r, 150));
      onContent?.(chunk);
    }
    onDone?.(MOCK_HTML);
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, figmaData }),
      signal,
    });
  } catch (err) {
    onError?.((err as Error).message || '网络连接失败，请检查后端服务是否运行');
    return;
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = ((await res.json()) as { error: string }).error; } catch { /* ignore */ }
    onError?.(msg);
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let thinkingBuffer = '';

  const flush = (force = false) => {
    // Surface complete thinking lines
    const nl = thinkingBuffer.indexOf('\n');
    if (nl !== -1 || force) {
      const lines = thinkingBuffer.split('\n');
      const last = lines.pop() ?? '';
      lines.forEach(line => { if (line.trim()) onThinkingLine?.(line.trim()); });
      thinkingBuffer = force ? '' : last;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const raw of lines) {
      if (!raw.startsWith('data: ')) continue;
      try {
        const ev = JSON.parse(raw.slice(6)) as {
          type: 'thinking' | 'content' | 'done' | 'error';
          content?: string;
          message?: string;
        };

        if (ev.type === 'thinking' && ev.content) {
          thinkingBuffer += ev.content;
          flush();
        }

        if (ev.type === 'content' && ev.content) {
          // If we were still thinking, flush remaining lines
          if (thinkingBuffer) flush(true);
          fullContent += ev.content;
          onContent?.(ev.content);
        }

        if (ev.type === 'done') {
          flush(true);
          onDone?.(extractHtml(fullContent));
        }

        if (ev.type === 'error') {
          onError?.(ev.message ?? '生成失败');
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  // Edge case: stream ended without a 'done' event
  if (fullContent && !fullContent.startsWith('{')) {
    flush(true);
    onDone?.(extractHtml(fullContent));
  }
}

// ─── SVG converter (复制为设计稿) ─────────────────────────────────────────────

export async function generateSvgFromHtml(html: string): Promise<string> {
  if (USE_MOCK) {
    return Promise.resolve(`<svg xmlns="http://www.w3.org/2000/svg" width="375" height="812" viewBox="0 0 375 812"><rect width="375" height="812" fill="#0F172A"/><text x="24" y="80" fill="white" font-family="Inter" font-size="28" font-weight="bold">本地 Mock Demo</text><rect x="16" y="120" width="343" height="180" rx="20" fill="#1E293B"/><text x="32" y="160" fill="#94A3B8" font-family="Inter" font-size="14">当前未连接后端服务器</text></svg>`);
  }

  const res = await fetch(`${API_BASE}/api/ai/to-svg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = ((await res.json()) as { error: string }).error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const data = (await res.json()) as { svg: string };
  return data.svg;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts raw HTML from an AI response that may wrap it in markdown code fences.
 */
function extractHtml(content: string): string {
  // ```html ... ``` or ``` ... ```
  const fenceMatch = content.match(/```(?:html)?\n([\s\S]*?)\n```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Already starts with <!DOCTYPE or <html
  const htmlMatch = content.match(/(<!DOCTYPE\s+html[\s\S]*?<\/html>)/i);
  if (htmlMatch) return htmlMatch[1].trim();

  return content.trim();
}
