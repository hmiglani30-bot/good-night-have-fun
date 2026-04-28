import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { OrchestratorState } from "./orchestrator.js";

export interface Checkpoint {
  runId: string;
  iteration: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  successCount: number;
  failCount: number;
  consecutiveFailures: number;
  consecutiveErrors: number;
  commitCount: number;
  notes: string[];
  timestamp: string;
}

function checkpointPath(runDir: string): string {
  return join(runDir, "checkpoint.json");
}

export function saveCheckpoint(runDir: string, state: OrchestratorState): void {
  const checkpoint: Checkpoint = {
    runId: runDir.split("/").pop() ?? "",
    iteration: state.currentIteration,
    totalInputTokens: state.totalInputTokens,
    totalOutputTokens: state.totalOutputTokens,
    successCount: state.successCount,
    failCount: state.failCount,
    consecutiveFailures: state.consecutiveFailures,
    consecutiveErrors: state.consecutiveErrors,
    commitCount: state.commitCount,
    notes: state.iterations.map(
      (r) => `#${r.number} ${r.success ? "OK" : "FAIL"}: ${r.summary}`,
    ),
    timestamp: new Date().toISOString(),
  };
  const filePath = checkpointPath(runDir);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(checkpoint, null, 2) + "\n", "utf-8");
}

export function loadCheckpoint(runDir: string): Checkpoint | null {
  const filePath = checkpointPath(runDir);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Checkpoint;
  } catch {
    return null;
  }
}

export function hasCheckpoint(runDir: string): boolean {
  return existsSync(checkpointPath(runDir));
}
