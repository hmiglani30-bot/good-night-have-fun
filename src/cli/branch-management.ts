import { basename, dirname, join } from "node:path";
import {
  ensureCleanWorkingTree,
  createBranch,
  getHeadCommit,
  getRepoRootDir,
  createWorktree,
} from "../core/git.js";
import { type RunInfo, setupRun } from "../core/run.js";
import { slugifyPrompt } from "../utils/slugify.js";

export interface WorktreeRunResult {
  runInfo: RunInfo;
  worktreePath: string;
  effectiveCwd: string;
}

export function initializeNewBranch(
  prompt: string,
  cwd: string,
  schemaOptions: { includeStopField: boolean },
): RunInfo {
  ensureCleanWorkingTree(cwd);
  const baseCommit = getHeadCommit(cwd);
  const branchName = slugifyPrompt(prompt);
  createBranch(branchName, cwd);
  const runId = branchName.split("/")[1]!;
  return setupRun(runId, prompt, baseCommit, cwd, schemaOptions);
}

export function initializeWorktreeRun(
  prompt: string,
  cwd: string,
  schemaOptions: { includeStopField: boolean },
): WorktreeRunResult {
  // Intentionally skip ensureCleanWorkingTree() — git worktree add creates
  // an independent working directory from HEAD; uncommitted changes in the
  // main checkout don't carry over, so a dirty tree is harmless here.
  const repoRoot = getRepoRootDir(cwd);
  const baseCommit = getHeadCommit(cwd);
  const branchName = slugifyPrompt(prompt);
  const runId = branchName.split("/")[1]!;
  const worktreePath = join(
    dirname(repoRoot),
    `${basename(repoRoot)}-gnhf-worktrees`,
    runId,
  );
  createWorktree(repoRoot, worktreePath, branchName);
  const runInfo = setupRun(
    runId,
    prompt,
    baseCommit,
    worktreePath,
    schemaOptions,
  );
  return { runInfo, worktreePath, effectiveCwd: worktreePath };
}
