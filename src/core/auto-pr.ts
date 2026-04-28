import { execFileSync, spawnSync } from "node:child_process";

export interface AutoPrOptions {
  branch: string;
  prompt: string;
  successCount: number;
  failCount: number;
  iterations: number;
  baseBranch?: string;
  draft?: boolean;
}

export interface AutoPrResult {
  status: "created" | "skipped";
  url?: string;
  reason?: string;
}

function ghAvailable(): boolean {
  const result = spawnSync(
    process.platform === "win32" ? "where" : "which",
    ["gh"],
    { stdio: "pipe" },
  );
  return result.status === 0;
}

function gitPushBranch(branch: string, cwd: string): void {
  execFileSync("git", ["push", "--set-upstream", "origin", branch], {
    cwd,
    stdio: "pipe",
  });
}

function buildPrBody(opts: AutoPrOptions): string {
  const lines = [
    "## Objective",
    "",
    "```",
    opts.prompt.trim(),
    "```",
    "",
    "## gnhf run summary",
    "",
    `- Iterations: ${opts.iterations}`,
    `- Successes: ${opts.successCount}`,
    `- Failures: ${opts.failCount}`,
    "",
    "_Opened automatically by [gnhf](https://github.com/kunchenguid/gnhf)._",
  ];
  return lines.join("\n");
}

function buildPrTitle(opts: AutoPrOptions): string {
  const firstLine = opts.prompt.split(/\r?\n/)[0]?.trim() ?? opts.branch;
  const trimmed = firstLine.length > 70 ? firstLine.slice(0, 67) + "…" : firstLine;
  return `gnhf: ${trimmed}`;
}

export function createAutoPr(
  opts: AutoPrOptions,
  cwd: string,
): AutoPrResult {
  if (!ghAvailable()) {
    return {
      status: "skipped",
      reason:
        "GitHub CLI (`gh`) is not available on PATH; install it and re-run with --auto-pr to enable.",
    };
  }

  try {
    gitPushBranch(opts.branch, cwd);
  } catch (err) {
    return {
      status: "skipped",
      reason: `Failed to push ${opts.branch}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const args = [
    "pr",
    "create",
    "--head",
    opts.branch,
    "--title",
    buildPrTitle(opts),
    "--body",
    buildPrBody(opts),
  ];
  if (opts.baseBranch) {
    args.push("--base", opts.baseBranch);
  }
  if (opts.draft) {
    args.push("--draft");
  }

  try {
    const out = execFileSync("gh", args, {
      cwd,
      encoding: "utf-8",
    });
    const url = out.trim().split("\n").pop();
    return { status: "created", url };
  } catch (err) {
    return {
      status: "skipped",
      reason: `gh pr create failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
