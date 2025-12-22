import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getProjectRoot(): string {
  // Assuming we're in src/utils, go up two levels
  return resolve(__dirname, '../..');
}

export function resolvePath(relativePath: string, baseDir?: string): string {
  const base = baseDir || process.cwd();
  return resolve(base, relativePath);
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export function getOutputDir(projectDir: string): string {
  return resolvePath('out', projectDir);
}

export function getChatScreenshotsDir(projectDir: string): string {
  const outDir = getOutputDir(projectDir);
  const chatDir = join(outDir, 'chat');
  ensureDir(chatDir);
  return chatDir;
}

export function getScreenshotPath(projectDir: string, identifier: string | number): string {
  const chatDir = getChatScreenshotsDir(projectDir);
  const filename = typeof identifier === 'number' 
    ? `chat-${identifier}.png`
    : `chat-${identifier}.png`;
  return join(chatDir, filename);
}

