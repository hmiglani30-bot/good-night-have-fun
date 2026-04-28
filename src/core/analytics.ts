import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface RunStats {
  runId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  iterations: number;
  successCount: number;
  failCount: number;
  durationMs: number;
  agent: string;
}

/**
 * Known pricing per 1M tokens: [input, output].
 * These are approximate list prices as of mid-2025.
 */
const PRICING: Record<string, [input: number, output: number]> = {
  claude: [3, 15],
  codex: [2, 8],
  copilot: [2, 8],
  opencode: [2, 8],
  rovodev: [2, 8],
};

const STATS_FILE = "stats.jsonl";

function getDataDir(): string {
  return join(homedir(), ".gnhf");
}

/**
 * Estimate cost in USD based on known per-1M-token pricing.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  agent: string,
): number {
  const [inputRate, outputRate] = PRICING[agent] ?? [3, 15];
  return (inputTokens / 1_000_000) * inputRate +
    (outputTokens / 1_000_000) * outputRate;
}

/**
 * Append a run's stats to the persistent JSONL file at `~/.gnhf/stats.jsonl`.
 * If `dataDir` is provided it is used instead of the default location.
 */
export function saveStats(dataDir: string | undefined, stats: RunStats): void {
  const dir = dataDir ?? getDataDir();
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, STATS_FILE);
  appendFileSync(filePath, JSON.stringify(stats) + "\n", "utf-8");
}

/**
 * Load all previously recorded stats from the JSONL file.
 */
export function loadAllStats(dataDir?: string): RunStats[] {
  const dir = dataDir ?? getDataDir();
  const filePath = join(dir, STATS_FILE);

  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const stats: RunStats[] = [];

  for (const line of lines) {
    try {
      stats.push(JSON.parse(line) as RunStats);
    } catch {
      // Skip malformed lines
    }
  }

  return stats;
}

/**
 * Format a single run's stats for terminal display.
 */
export function formatRunStats(stats: RunStats): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("  Run Summary");
  lines.push("  -----------");
  lines.push(`  Run ID:          ${stats.runId}`);
  lines.push(`  Agent:           ${stats.agent}`);
  lines.push(`  Iterations:      ${stats.iterations} (${stats.successCount} succeeded, ${stats.failCount} failed)`);
  lines.push(`  Input tokens:    ${stats.totalInputTokens.toLocaleString()}`);
  lines.push(`  Output tokens:   ${stats.totalOutputTokens.toLocaleString()}`);
  lines.push(`  Estimated cost:  $${stats.estimatedCostUsd.toFixed(4)}`);
  lines.push(`  Duration:        ${formatDuration(stats.durationMs)}`);
  lines.push("");
  return lines.join("\n");
}

/**
 * Format cumulative stats from all recorded runs.
 */
export function formatStatsReport(stats: RunStats[]): string {
  if (stats.length === 0) {
    return "\n  No runs recorded yet. Run gnhf to get started!\n";
  }

  const totalInputTokens = stats.reduce((s, r) => s + r.totalInputTokens, 0);
  const totalOutputTokens = stats.reduce((s, r) => s + r.totalOutputTokens, 0);
  const totalCost = stats.reduce((s, r) => s + r.estimatedCostUsd, 0);
  const totalIterations = stats.reduce((s, r) => s + r.iterations, 0);
  const totalSuccesses = stats.reduce((s, r) => s + r.successCount, 0);
  const totalFailures = stats.reduce((s, r) => s + r.failCount, 0);
  const totalDuration = stats.reduce((s, r) => s + r.durationMs, 0);

  const agentBreakdown = new Map<string, { runs: number; cost: number; tokens: number }>();
  for (const run of stats) {
    const entry = agentBreakdown.get(run.agent) ?? { runs: 0, cost: 0, tokens: 0 };
    entry.runs++;
    entry.cost += run.estimatedCostUsd;
    entry.tokens += run.totalInputTokens + run.totalOutputTokens;
    agentBreakdown.set(run.agent, entry);
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("  gnhf Usage Statistics");
  lines.push("  =====================");
  lines.push("");
  lines.push(`  Total runs:        ${stats.length}`);
  lines.push(`  Total iterations:  ${totalIterations} (${totalSuccesses} succeeded, ${totalFailures} failed)`);
  lines.push(`  Total input tokens:  ${totalInputTokens.toLocaleString()}`);
  lines.push(`  Total output tokens: ${totalOutputTokens.toLocaleString()}`);
  lines.push(`  Estimated total cost: $${totalCost.toFixed(4)}`);
  lines.push(`  Total run time:    ${formatDuration(totalDuration)}`);
  lines.push("");
  lines.push("  By Agent");
  lines.push("  --------");

  for (const [agent, data] of agentBreakdown.entries()) {
    lines.push(`  ${agent}: ${data.runs} runs, ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(4)}`);
  }

  lines.push("");
  lines.push("  Recent Runs");
  lines.push("  -----------");

  const recent = stats.slice(-10).reverse();
  for (const run of recent) {
    const status = run.failCount > 0 && run.successCount === 0 ? "FAIL" : "OK";
    lines.push(`  [${status}] ${run.runId} (${run.agent}) — ${run.iterations} iters, $${run.estimatedCostUsd.toFixed(4)}, ${formatDuration(run.durationMs)}`);
  }

  lines.push("");
  return lines.join("\n");
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
