import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const assetsDir = path.join(distDir, 'assets');
const indexHtmlPath = path.join(distDir, 'index.html');
const outputFileName = 'octo-client-shell-offline-mock.html';
const outputPath = path.join(projectRoot, outputFileName);

const MIME_BY_EXT = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.json': 'application/json',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

function normalizeAssetRef(ref) {
  return ref.replace(/^https?:\/\/[^/]+/i, '').replace(/^\.?\//, '').replace(/^\/+/, '');
}

function toDataUrl(filePath, contentBuffer) {
  const mime = getMimeType(filePath);
  const base64 = contentBuffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

function replaceAllByMap(content, replacementMap) {
  let next = content;
  const entries = [...replacementMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    next = next.split(from).join(to);
  }
  return next;
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

async function main() {
  const indexHtml = await fs.readFile(indexHtmlPath, 'utf8');

  const cssRefs = [...indexHtml.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)].map((m) => m[1]);
  const jsRefs = [...indexHtml.matchAll(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g)].map((m) => m[1]);

  const replacementMap = new Map();

  const assetNames = await fs.readdir(assetsDir);
  for (const name of assetNames) {
    const abs = path.join(assetsDir, name);
    const stat = await fs.stat(abs);
    if (!stat.isFile()) continue;
    const buffer = await fs.readFile(abs);
    const dataUrl = toDataUrl(abs, buffer);
    const rel = `assets/${name}`;
    replacementMap.set(`/${rel}`, dataUrl);
    replacementMap.set(`./${rel}`, dataUrl);
    replacementMap.set(rel, dataUrl);
  }

  let html = indexHtml;
  for (const ref of [...cssRefs, ...jsRefs]) {
    const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`<link[^>]+href="${escapedRef}"[^>]*>`, 'g'), '');
    html = html.replace(new RegExp(`<script[^>]+src="${escapedRef}"[^>]*><\\/script>`, 'g'), '');
  }

  const styleBlocks = [];
  for (const ref of cssRefs) {
    const normalized = normalizeAssetRef(ref);
    const abs = path.join(distDir, normalized);
    const raw = await readIfExists(abs);
    if (!raw) continue;
    const css = replaceAllByMap(raw.toString('utf8'), replacementMap);
    styleBlocks.push(`<style>\n${css}\n</style>`);
  }

  const scriptBlocks = [];
  for (const ref of jsRefs) {
    const normalized = normalizeAssetRef(ref);
    const abs = path.join(distDir, normalized);
    const raw = await readIfExists(abs);
    if (!raw) continue;
    const js = replaceAllByMap(raw.toString('utf8'), replacementMap);
    scriptBlocks.push(`<script type="module">\n${js}\n</script>`);
  }

  html = replaceAllByMap(html, replacementMap);
  if (styleBlocks.length > 0) {
    html = html.replace('</head>', `${styleBlocks.join('\n')}\n</head>`);
  }
  if (scriptBlocks.length > 0) {
    html = html.replace('</body>', `${scriptBlocks.join('\n')}\n</body>`);
  }

  await fs.writeFile(outputPath, html, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Exported: ${outputPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

