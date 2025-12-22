import { existsSync } from 'fs';
import type { Project } from '../projectSchema.js';
import { execCommand } from '../utils/exec.js';
import { getScreenshotPath, resolvePath } from '../utils/paths.js';

export async function renderVideo(project: Project, projectDir: string): Promise<void> {
  const bgVideoPath = resolvePath(project.bgVideo, projectDir);
  const outputPath = resolvePath(project.output, projectDir);

  if (!existsSync(bgVideoPath)) {
    throw new Error(`Background video not found: ${bgVideoPath}`);
  }

  console.log(`Rendering video: ${outputPath}`);
  console.log(`  Background: ${bgVideoPath}`);
  console.log(`  Resolution: ${project.resolution.w}x${project.resolution.h}`);
  console.log(`  FPS: ${project.fps}`);

  // Build filter_complex chain
  const filters: string[] = [];
  const inputs: string[] = [];
  let currentLabel = 'base';

  // Start with background video: scale and pad to target resolution
  const aspectRatio = project.resolution.w / project.resolution.h;
  // Scale to fit within target dimensions, maintaining aspect ratio
  // Use -2 to maintain aspect ratio, then pad to exact size
  filters.push(
    `[0:v]scale='min(${project.resolution.w}\\,iw)':'min(${project.resolution.h}\\,ih)':force_original_aspect_ratio=decrease[scaled]`
  );
  filters.push(
    `[scaled]pad=${project.resolution.w}:${project.resolution.h}:(ow-iw)/2:(oh-ih)/2:black[${currentLabel}]`
  );

  // Add each overlay
  let overlayIndex = 1;
  for (const overlay of project.overlays) {
    const screenshotPath = getScreenshotPath(projectDir, `${overlay.messageIndex}-${overlay.endMessageIndex}`);
    
    if (!existsSync(screenshotPath)) {
      throw new Error(`Screenshot not found: ${screenshotPath}`);
    }

    inputs.push('-i');
    inputs.push(screenshotPath);

    const prevLabel = currentLabel;
    const overlayLabel = `ov${overlayIndex}`;
    const nextLabel = `v${overlayIndex}`;
    currentLabel = nextLabel;

    // Scale overlay to target width, maintain aspect ratio
    filters.push(`[${overlayIndex}:v]scale=${overlay.w}:-1[${overlayLabel}]`);

    // Overlay with time-based enable
    filters.push(
      `[${prevLabel}][${overlayLabel}]overlay=${overlay.x}:${overlay.y}:enable='between(t,${overlay.start},${overlay.end})'[${nextLabel}]`
    );

    overlayIndex++;
  }

  // Build FFmpeg command
  const filterComplex = filters.join(';');
  
  // Check if background video has audio
  const hasAudioCheck = await execCommand(
    `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${bgVideoPath}"`
  );
  const hasAudio = hasAudioCheck.stdout.trim().length > 0;

  // Build command array for better shell escaping
  const commandArgs: string[] = [
    '-y',
    '-i', bgVideoPath,
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', `[${currentLabel}]`,
  ];

  if (hasAudio) {
    commandArgs.push('-map', '0:a?', '-c:a', 'aac', '-b:a', '192k');
  }

  commandArgs.push(
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', String(project.fps),
    outputPath
  );

  // Escape arguments properly for shell
  const escapeShell = (arg: string): string => {
    if (/^[a-zA-Z0-9/_.-]+$/.test(arg)) {
      return arg;
    }
    return `"${arg.replace(/"/g, '\\"')}"`;
  };

  const command = `ffmpeg ${commandArgs.map(escapeShell).join(' ')}`;

  console.log('Running FFmpeg...');
  const result = await execCommand(command, { cwd: projectDir });

  if (result.stderr) {
    // FFmpeg outputs to stderr, but that's normal
    console.log(result.stderr);
  }

  console.log(`✓ Video rendered: ${outputPath}`);
}

