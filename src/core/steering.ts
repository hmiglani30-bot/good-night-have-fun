import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";

/**
 * Steering primitives let an external operator pause, redirect, or resume an
 * in-flight gnhf run without killing the process. The orchestrator checks
 * three files between iterations:
 *
 *   .gnhf/runs/<runId>/control/pause          — orchestrator waits while present
 *   .gnhf/runs/<runId>/control/steer.md       — appended to the next iteration prompt
 *   .gnhf/runs/<runId>/control/abort          — orchestrator aborts cleanly
 *
 * Files are created and removed by the `gnhf pause`, `gnhf resume`, and
 * `gnhf steer` subcommands, but anything that can write to the run directory
 * can drive the same protocol.
 */

export interface ControlPaths {
  controlDir: string;
  pauseFile: string;
  steerFile: string;
  abortFile: string;
}

export function getControlPaths(runDir: string): ControlPaths {
  const controlDir = join(runDir, "control");
  return {
    controlDir,
    pauseFile: join(controlDir, "pause"),
    steerFile: join(controlDir, "steer.md"),
    abortFile: join(controlDir, "abort"),
  };
}

function ensureDir(file: string): void {
  mkdirSync(dirname(file), { recursive: true });
}

export function isPaused(runDir: string): boolean {
  return existsSync(getControlPaths(runDir).pauseFile);
}

export function shouldAbort(runDir: string): boolean {
  return existsSync(getControlPaths(runDir).abortFile);
}

export function readSteer(runDir: string): string | null {
  const { steerFile } = getControlPaths(runDir);
  if (!existsSync(steerFile)) return null;
  try {
    return readFileSync(steerFile, "utf-8");
  } catch {
    return null;
  }
}

export function clearSteer(runDir: string): void {
  const { steerFile } = getControlPaths(runDir);
  try {
    rmSync(steerFile, { force: true });
  } catch {
    // best effort
  }
}

export function writePause(runDir: string): void {
  const { pauseFile } = getControlPaths(runDir);
  ensureDir(pauseFile);
  writeFileSync(pauseFile, new Date().toISOString() + "\n", "utf-8");
}

export function clearPause(runDir: string): void {
  const { pauseFile } = getControlPaths(runDir);
  try {
    rmSync(pauseFile, { force: true });
  } catch {
    // best effort
  }
}

export function writeSteer(runDir: string, text: string): void {
  const { steerFile } = getControlPaths(runDir);
  ensureDir(steerFile);
  writeFileSync(steerFile, text, "utf-8");
}

export function writeAbort(runDir: string, reason: string): void {
  const { abortFile } = getControlPaths(runDir);
  ensureDir(abortFile);
  writeFileSync(abortFile, reason + "\n", "utf-8");
}

export interface PollOptions {
  intervalMs?: number;
  signal?: AbortSignal;
}

/**
 * Wait while a pause file exists. Resolves when the pause file disappears or
 * the abort signal fires. Returns "resumed" or "aborted" so callers can react.
 */
export async function waitWhilePaused(
  runDir: string,
  options: PollOptions = {},
): Promise<"resumed" | "aborted"> {
  const interval = options.intervalMs ?? 1000;
  const signal = options.signal;

  while (isPaused(runDir)) {
    if (signal?.aborted) return "aborted";
    if (shouldAbort(runDir)) return "aborted";
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, interval);
      timer.unref?.();
      if (signal) {
        const onAbort = () => {
          clearTimeout(timer);
          resolve();
        };
        signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }
  return "resumed";
}
