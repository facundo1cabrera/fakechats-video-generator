import { chromium } from 'playwright';
import type { Project, ChatConfig } from '../projectSchema.js';
import { getScreenshotPath, getChatScreenshotsDir } from '../utils/paths.js';
import { chatTemplateHtml } from './template.js';
import sharp from 'sharp';

export async function renderScreenshots(project: Project, projectDir: string): Promise<void> {
  const chatDir = getChatScreenshotsDir(projectDir);
  const templateHtml = chatTemplateHtml;

  // Get unique screenshot identifiers from overlays
  // Use a combination of messageIndex and endMessageIndex to create unique screenshot IDs
  const screenshotKeys = new Set(
    project.overlays.map(o => `${o.messageIndex}-${o.endMessageIndex}`)
  );
  const sortedKeys = Array.from(screenshotKeys).sort((a, b) => {
    const [aStart, aEnd] = a.split('-').map(Number);
    const [bStart, bEnd] = b.split('-').map(Number);
    if (aStart !== bStart) return aStart - bStart;
    return aEnd - bEnd;
  });

  console.log(`Rendering ${sortedKeys.length} chat screenshots...`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: {
      width: project.resolution.w,
      height: project.resolution.h
    }
  });

  try {
    for (const key of sortedKeys) {
      const [start, end] = key.split('-').map(Number);
      const screenshotPath = getScreenshotPath(projectDir, key);
      
      // Create chat data with messages in the range [start, end] (inclusive)
      const chatData: ChatConfig = {
        ...project.chat,
        messages: project.chat.messages.slice(start, end + 1),
      };

      // Inject chat data into HTML
      const htmlWithData = templateHtml.replace(
        'window.chatData ||',
        `window.chatData = ${JSON.stringify(chatData)}; window.chatData ||`
      );

      const page = await context.newPage();
      await page.setContent(htmlWithData, { waitUntil: 'networkidle' });

      // Wait a bit for any animations/rendering
      await page.waitForTimeout(100);

      // Take screenshot with transparent background
      const screenshotBuffer = await page.screenshot({
        omitBackground: true,
        fullPage: false,
        clip: await page.locator('#chatContainer').boundingBox() ?? undefined,  // Screenshot only the container
      });

      // Trim transparent padding from the image
      const trimmedBuffer = await sharp(screenshotBuffer)
        .trim({ threshold: 0 }) // Trim all fully transparent pixels
        .toBuffer();

      // Write the trimmed image
      await sharp(trimmedBuffer).toFile(screenshotPath);

      await page.close();
      console.log(`  ✓ Generated ${screenshotPath} (messages ${start}-${end})`);
    }
  } finally {
    await browser.close();
  }

  console.log(`✓ All screenshots rendered to ${chatDir}`);
}

