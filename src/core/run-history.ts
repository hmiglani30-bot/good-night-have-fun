import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import type { RunStats } from "./analytics.js";
import { loadAllStats } from "./analytics.js";

export interface RunHistoryEntry {
  runId: string;
  prompt: string;
  agent?: string;
  iterations: number;
  successCount: number;
  failCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd?: number;
  durationMs?: number;
  startedAt: string;
  branch: string;
  commitCount: number;
}

function gitListGnhfBranches(cwd: string): string[] {
  try {
    const out = execFileSync("git", ["branch", "--list", "gnhf/*"], {
      cwd,
      encoding: "utf-8",
    });
    return out
      .split("\n")
      .map((line) => line.replace(/^[*\s]+/, "").trim())
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

function commitCountForBranch(branch: string, cwd: string): number {
  try {
    const out = execFileSync("git", ["rev-list", "--count", branch], {
      cwd,
      encoding: "utf-8",
    });
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function safeReadJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf-8");
  const out: T[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as T);
    } catch {
      // skip malformed
    }
  }
  return out;
}

interface IterationLogLine {
  type?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
}

function aggregateRunStatsFromDir(runDir: string): {
  iterations: number;
  successCount: number;
  failCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
} {
  let iterations = 0;
  let successCount = 0;
  let failCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const files = (() => {
    try {
      return readdirSync(runDir);
    } catch {
      return [];
    }
  })();

  const iterationFiles = files
    .filter((f) => /^iteration-\d+\.jsonl$/.test(f))
    .sort((a, b) => {
      const ai = parseInt(a.replace(/\D+/g, ""), 10) || 0;
      const bi = parseInt(b.replace(/\D+/g, ""), 10) || 0;
      return ai - bi;
    });
  iterations = iterationFiles.length;

  // best-effort token aggregation from per-iteration logs
  for (const f of iterationFiles) {
    const lines = safeReadJsonl<IterationLogLine>(join(runDir, f));
    for (const line of lines) {
      if (typeof line.totalInputTokens === "number") {
        totalInputTokens = Math.max(totalInputTokens, line.totalInputTokens);
      }
      if (typeof line.totalOutputTokens === "number") {
        totalOutputTokens = Math.max(totalOutputTokens, line.totalOutputTokens);
      }
      if (typeof line.inputTokens === "number" && !line.totalInputTokens) {
        totalInputTokens += line.inputTokens;
      }
      if (typeof line.outputTokens === "number" && !line.totalOutputTokens) {
        totalOutputTokens += line.outputTokens;
      }
    }
  }

  // Pull success/fail from notes.md best-effort
  const notesPath = join(runDir, "notes.md");
  if (existsSync(notesPath)) {
    const notes = readFileSync(notesPath, "utf-8");
    failCount = (notes.match(/\[FAIL\]|\[ERROR\]/g) ?? []).length;
    const total = (notes.match(/^### Iteration /gm) ?? []).length;
    successCount = Math.max(0, total - failCount);
    iterations = Math.max(iterations, total);
  }

  return {
    iterations,
    successCount,
    failCount,
    totalInputTokens,
    totalOutputTokens,
  };
}

export function loadRunHistory(cwd: string): RunHistoryEntry[] {
  const runsDir = join(cwd, ".gnhf", "runs");
  if (!existsSync(runsDir)) return [];

  const branches = new Set(gitListGnhfBranches(cwd));
  const persisted = new Map<string, RunStats>();
  try {
    for (const stat of loadAllStats()) {
      persisted.set(stat.runId, stat);
    }
  } catch {
    // analytics may not be available
  }

  const entries: RunHistoryEntry[] = [];

  for (const runId of readdirSync(runsDir)) {
    const runDir = join(runsDir, runId);
    let dirStat;
    try {
      dirStat = statSync(runDir);
    } catch {
      continue;
    }
    if (!dirStat.isDirectory()) continue;

    const promptPath = join(runDir, "prompt.md");
    const prompt = existsSync(promptPath)
      ? readFileSync(promptPath, "utf-8").trim()
      : "";

    const aggregated = aggregateRunStatsFromDir(runDir);
    const stat = persisted.get(runId);
    const branch = `gnhf/${runId}`;
    const commitCount = branches.has(branch)
      ? commitCountForBranch(branch, cwd)
      : 0;

    entries.push({
      runId,
      prompt,
      agent: stat?.agent,
      iterations: stat?.iterations ?? aggregated.iterations,
      successCount: stat?.successCount ?? aggregated.successCount,
      failCount: stat?.failCount ?? aggregated.failCount,
      totalInputTokens: stat?.totalInputTokens ?? aggregated.totalInputTokens,
      totalOutputTokens:
        stat?.totalOutputTokens ?? aggregated.totalOutputTokens,
      estimatedCostUsd: stat?.estimatedCostUsd,
      durationMs: stat?.durationMs,
      startedAt: dirStat.birthtime.toISOString(),
      branch,
      commitCount,
    });
  }

  entries.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return entries;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function formatHistoryTable(entries: RunHistoryEntry[]): string {
  if (entries.length === 0) {
    return "\n  No runs found in .gnhf/runs.\n";
  }

  const rows: string[][] = [
    ["RUN ID", "AGENT", "ITERS", "OK/FAIL", "COMMITS", "PROMPT"],
  ];

  for (const e of entries) {
    rows.push([
      truncate(e.runId, 40),
      e.agent ?? "-",
      String(e.iterations),
      `${e.successCount}/${e.failCount}`,
      String(e.commitCount),
      truncate(e.prompt.replace(/\s+/g, " "), 60),
    ]);
  }

  const widths = rows[0]!.map((_, col) =>
    Math.max(...rows.map((r) => r[col]!.length)),
  );
  const sep = widths.map((w) => "-".repeat(w)).join("  ");
  const out: string[] = [""];
  out.push(rows[0]!.map((c, i) => c.padEnd(widths[i]!)).join("  "));
  out.push(sep);
  for (const r of rows.slice(1)) {
    out.push(r.map((c, i) => c.padEnd(widths[i]!)).join("  "));
  }
  out.push("");
  return out.join("\n");
}

export interface RunComparison {
  a: RunHistoryEntry;
  b: RunHistoryEntry;
}

export function findRun(
  entries: RunHistoryEntry[],
  id: string,
): RunHistoryEntry | undefined {
  return entries.find((e) => e.runId === id || e.runId.startsWith(id));
}

export function formatComparison(a: RunHistoryEntry, b: RunHistoryEntry): string {
  const pad = (s: string, n: number) => s.padEnd(n);
  const lines: string[] = [
    "",
    "  Run comparison",
    "  ==============",
    "",
    pad("  Field", 22) + pad(`A: ${a.runId}`, 35) + `B: ${b.runId}`,
  ];

  const tokens = (e: RunHistoryEntry) =>
    `${e.totalInputTokens.toLocaleString()}/${e.totalOutputTokens.toLocaleString()}`;
  const cost = (e: RunHistoryEntry) =>
    typeof e.estimatedCostUsd === "number"
      ? `$${e.estimatedCostUsd.toFixed(4)}`
      : "n/a";
  const dur = (e: RunHistoryEntry) =>
    typeof e.durationMs === "number" ? `${Math.round(e.durationMs / 1000)}s` : "n/a";

  const fields: Array<[string, (e: RunHistoryEntry) => string]> = [
    ["agent", (e) => e.agent ?? "-"],
    ["iterations", (e) => String(e.iterations)],
    ["ok / fail", (e) => `${e.successCount} / ${e.failCount}`],
    ["commits", (e) => String(e.commitCount)],
    ["tokens (in/out)", tokens],
    ["est. cost", cost],
    ["duration", dur],
    ["started", (e) => e.startedAt],
  ];

  for (const [name, fn] of fields) {
    lines.push(pad(`  ${name}`, 22) + pad(fn(a), 35) + fn(b));
  }
  lines.push("");
  lines.push("  Prompt diff:");
  if (a.prompt === b.prompt) {
    lines.push("    (identical)");
  } else {
    lines.push(`    A: ${truncate(a.prompt.replace(/\s+/g, " "), 100)}`);
    lines.push(`    B: ${truncate(b.prompt.replace(/\s+/g, " "), 100)}`);
  }
  lines.push("");
  return lines.join("\n");
}
