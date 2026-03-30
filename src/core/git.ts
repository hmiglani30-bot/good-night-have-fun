import { execSync } from "node:child_process";

function git(args: string, cwd: string): string {
  return execSync(`git ${args}`, {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();
}

export function getCurrentBranch(cwd: string): string {
  return git("rev-parse --abbrev-ref HEAD", cwd);
}

export function ensureCleanWorkingTree(cwd: string): void {
  const status = git("status --porcelain", cwd);
  if (status) {
    throw new Error(
      "Working tree is not clean. Commit or stash changes first.",
    );
  }
}

export function createBranch(branchName: string, cwd: string): void {
  git(`checkout -b ${branchName}`, cwd);
}

export function commitAll(message: string, cwd: string): void {
  git("add -A", cwd);
  try {
    git(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
  } catch {
    // Nothing to commit (no changes) -- that's fine
  }
}

export function resetHard(cwd: string): void {
  git("reset --hard HEAD", cwd);
  git("clean -fd", cwd);
}
