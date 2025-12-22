#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Project } from './projectSchema.js';
import { validateProject } from './projectSchema.js';
import { renderScreenshots } from './chat/renderScreenshots.js';
import { renderVideo } from './video/renderVideo.js';
import { checkFFmpeg, execCommand } from './utils/exec.js';
import { resolvePath, ensureDir } from './utils/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('chatvid')
  .description('Automated tool for creating short-form videos with chat screenshots')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new project with example files')
  .argument('<dir>', 'Directory to initialize')
  .action(async (dir: string) => {
    const projectDir = resolve(dir);
    ensureDir(projectDir);
    ensureDir(join(projectDir, 'assets'));
    ensureDir(join(projectDir, 'out'));

    const exampleProject: Project = {
      bgVideo: 'assets/bg.example.mp4',
      output: 'out/final.mp4',
      fps: 30,
      resolution: { w: 1080, h: 1920 },
      chat: {
        theme: 'ios',
        participants: [
          { id: 'me', name: 'Me' },
          { id: 'her', name: 'Her' },
        ],
        messages: [
          { from: 'her', text: 'Qué significa ese tatuaje?' },
          { from: 'me', text: 'El tatuaje no... pero la modelo sí 😌' },
        ],
      },
      overlays: [
        { messageIndex: 0, endMessageIndex: 0, start: 0.5, end: 2.5, x: 80, y: 980, w: 920 },
        { messageIndex: 0, endMessageIndex: 1, start: 2.5, end: 5.0, x: 80, y: 980, w: 920 },
      ],
    };

    const projectPath = join(projectDir, 'project.json');
    writeFileSync(projectPath, JSON.stringify(exampleProject, null, 2));
    console.log(`✓ Created ${projectPath}`);

    // Create placeholder background video note
    const bgNotePath = join(projectDir, 'assets', 'README.md');
    writeFileSync(
      bgNotePath,
      'Place your background video here as bg.example.mp4 (or update project.json to point to your video)\n'
    );
    console.log(`✓ Created ${bgNotePath}`);

    console.log(`\n✓ Project initialized in ${projectDir}`);
    console.log(`  Edit project.json and run: chatvid render project.json`);
  });

program
  .command('screenshots')
  .description('Generate chat screenshots from project file')
  .argument('<project.json>', 'Path to project JSON file')
  .action(async (projectPath: string) => {
    const fullPath = resolvePath(projectPath);
    const projectDir = dirname(fullPath);

    if (!existsSync(fullPath)) {
      console.error(`Error: Project file not found: ${fullPath}`);
      process.exit(1);
    }

    const projectData = JSON.parse(readFileSync(fullPath, 'utf-8'));
    validateProject(projectData);

    await renderScreenshots(projectData, projectDir);
  });

program
  .command('render')
  .description('Generate screenshots (if missing) and render final video')
  .argument('<project.json>', 'Path to project JSON file')
  .action(async (projectPath: string) => {
    const fullPath = resolvePath(projectPath);
    const projectDir = dirname(fullPath);

    if (!existsSync(fullPath)) {
      console.error(`Error: Project file not found: ${fullPath}`);
      process.exit(1);
    }

    const projectData = JSON.parse(readFileSync(fullPath, 'utf-8'));
    validateProject(projectData);

    // Check if screenshots exist, generate if missing
    const { getScreenshotPath } = await import('./utils/paths.js');
    const screenshotKeys = new Set(
      projectData.overlays.map((o: any) => `${o.messageIndex}-${o.endMessageIndex}`)
    );
    const missingScreenshots = (Array.from(screenshotKeys) as string[]).filter(
      (key: string) => !existsSync(getScreenshotPath(projectDir, key))
    );

    if (missingScreenshots.length > 0) {
      console.log('Some screenshots are missing, generating...');
      await renderScreenshots(projectData, projectDir);
    }

    await renderVideo(projectData, projectDir);
  });

program
  .command('validate')
  .description('Validate project schema, check file paths, and check FFmpeg availability')
  .argument('<project.json>', 'Path to project JSON file')
  .action(async (projectPath: string) => {
    const fullPath = resolvePath(projectPath);
    const projectDir = dirname(fullPath);

    console.log('Validating project...\n');

    // Check file exists
    if (!existsSync(fullPath)) {
      console.error(`✗ Project file not found: ${fullPath}`);
      process.exit(1);
    }
    console.log(`✓ Project file found: ${fullPath}`);

    // Parse and validate schema
    let projectData: Project;
    try {
      projectData = JSON.parse(readFileSync(fullPath, 'utf-8'));
      validateProject(projectData);
      console.log('✓ Project schema is valid');
    } catch (error: any) {
      console.error(`✗ Schema validation failed: ${error.message}`);
      process.exit(1);
    }

    // Check file paths
    const bgVideoPath = resolvePath(projectData.bgVideo, projectDir);
    if (existsSync(bgVideoPath)) {
      console.log(`✓ Background video found: ${bgVideoPath}`);
    } else {
      console.warn(`⚠ Background video not found: ${bgVideoPath}`);
    }

    // Check FFmpeg
    const hasFFmpeg = await checkFFmpeg();
    if (hasFFmpeg) {
      console.log('✓ FFmpeg is available');
    } else {
      console.error('✗ FFmpeg is not available. Please install FFmpeg.');
      process.exit(1);
    }

    // Check Playwright
    try {
      const { chromium } = await import('playwright');
      console.log('✓ Playwright is available');
    } catch {
      console.error('✗ Playwright is not available. Run: npm install');
      process.exit(1);
    }

    console.log('\n✓ All validations passed!');
  });

program.parse();

