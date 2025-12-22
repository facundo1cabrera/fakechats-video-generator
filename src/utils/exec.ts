import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export async function execCommand(
  command: string,
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<ExecResult> {
  try {
    return await execAsync(command, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
    });
  } catch (error: any) {
    // exec throws on non-zero exit codes, but we might want stdout/stderr
    if (error.stdout || error.stderr) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
      };
    }
    throw error;
  }
}

export async function checkFFmpeg(): Promise<boolean> {
  try {
    await execCommand('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

