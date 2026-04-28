import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { Command } from "commander";
import { AGENT_NAMES, loadConfig } from "./core/config.js";
import {
  appendDebugLog,
  initDebugLog,
  serializeError,
} from "./core/debug-log.js";
import {
  ensureCleanWorkingTree,
  getCurrentBranch,
  removeWorktree,
} from "./core/git.js";
import { setupRun, resumeRun, getLastIterationNumber } from "./core/run.js";
import { readStdinText } from "./core/stdin.js";
import { startSleepPrevention } from "./core/sleep.js";
import { createAgent } from "./core/agents/factory.js";
import { Orchestrator } from "./core/orchestrator.js";
import { MockOrchestrator } from "./mock-orchestrator.js";
import { Renderer } from "./renderer.js";
import { HeadlessRenderer } from "./headless-renderer.js";
import { loadCheckpoint } from "./core/checkpoint.js";
import {
  calculateCost,
  formatRunStats,
  formatStatsReport,
  loadAllStats,
  saveStats,
  type RunStats,
} from "./core/analytics.js";
import { runInit } from "./cli/init.js";
import { runWizard } from "./cli/wizard.js";
import {
  initializeNewBranch,
  initializeWorktreeRun,
} from "./cli/branch-management.js";
import {
  getTelemetrySessionId,
  isTelemetryEnabled,
  trackEvent,
} from "./core/telemetry.js";
import {
  parseNotificationFlag,
  sendNotification,
  type RunSummary,
} from "./core/notifications.js";
import { createAutoPr } from "./core/auto-pr.js";
import {
  formatComparison,
  formatHistoryTable,
  findRun,
  loadRunHistory,
} from "./core/run-history.js";
import {
  clearPause,
  writeAbort,
  writePause,
  writeSteer,
} from "./core/steering.js";
import {
  ask,
  PromptSignalError,
  persistStdinPromptForReexec,
  readReexecStdinPrompt,
  GNHF_REEXEC_STDIN_PROMPT_FILE,
} from "./cli/prompt-handling.js";
import { enterAltScreen, exitAltScreen, die } from "./cli/screen.js";
import {
  parseNonNegativeInteger,
  parseOnOffBoolean,
  isAgentName,
  AGENT_NAME_LIST,
} from "./cli/parsers.js";

const packageVersion = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
).version as string;
const FORCE_EXIT_TIMEOUT_MS = 5_000;

function getSignalExitCode(signal: NodeJS.Signals): number {
  return signal === "SIGINT" ? 130 : 143;
}

interface PostRunSideEffectsParams {
  runStats: RunStats;
  finalStatus: "running" | "waiting" | "aborted" | "stopped";
  runInfo: { runId: string };
  branchName: string;
  cwd: string;
  prompt: string;
  iterations: number;
  successCount: number;
  failCount: number;
  commitCount: number;
  worktreePath: string | null;
  notifyWebhook?: string;
  notifySlack?: string;
  autoPr: boolean;
  autoPrBase?: string;
  autoPrDraft: boolean;
  telemetrySessionId: string;
}

async function runPostRunSideEffects(
  params: PostRunSideEffectsParams,
): Promise<void> {
  if (isTelemetryEnabled()) {
    trackEvent({
      event: "run.complete",
      timestamp: new Date().toISOString(),
      sessionId: params.telemetrySessionId,
      properties: {
        agent: params.runStats.agent,
        iterations: params.iterations,
        successCount: params.successCount,
        failCount: params.failCount,
        durationMs: params.runStats.durationMs,
        totalInputTokens: params.runStats.totalInputTokens,
        totalOutputTokens: params.runStats.totalOutputTokens,
        estimatedCostUsd: params.runStats.estimatedCostUsd,
        status: params.finalStatus,
      },
    });
  }

  const targets = parseNotificationFlag(params.notifyWebhook, params.notifySlack);
  if (targets.length > 0) {
    const summary: RunSummary = {
      runId: params.runInfo.runId,
      agent: params.runStats.agent,
      status: params.finalStatus,
      iterations: params.iterations,
      successCount: params.successCount,
      failCount: params.failCount,
      totalInputTokens: params.runStats.totalInputTokens,
      totalOutputTokens: params.runStats.totalOutputTokens,
      estimatedCostUsd: params.runStats.estimatedCostUsd,
      durationMs: params.runStats.durationMs,
      worktreePath: params.worktreePath,
    };
    for (const target of targets) {
      try {
        await sendNotification(target, summary);
      } catch (err) {
        console.error(
          `  gnhf: notification (${target.type}) failed — ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  if (params.autoPr && params.commitCount > 0) {
    const result = createAutoPr(
      {
        branch: params.branchName,
        prompt: params.prompt,
        successCount: params.successCount,
        failCount: params.failCount,
        iterations: params.iterations,
        baseBranch: params.autoPrBase,
        draft: params.autoPrDraft,
      },
      params.cwd,
    );
    if (result.status === "created") {
      console.error(`  gnhf: opened PR ${result.url ?? ""}`);
    } else {
      console.error(`  gnhf: auto-pr skipped — ${result.reason ?? "unknown"}`);
    }
  } else if (params.autoPr) {
    console.error("  gnhf: auto-pr skipped — no commits produced");
  }
}

const program = new Command();

program
  .name("gnhf")
  .description("Before I go to bed, I tell my agents: good night, have fun")
  .version(packageVersion)
  .argument("[prompt]", "The objective for the coding agent")
  .option("--agent <agent>", `Agent to use (${AGENT_NAMES.join(", ")})`)
  .option(
    "--max-iterations <n>",
    "Abort after N total iterations",
    parseNonNegativeInteger,
  )
  .option(
    "--max-tokens <n>",
    "Abort after N total input+output tokens",
    parseNonNegativeInteger,
  )
  .option(
    "--stop-when <condition>",
    "End the loop when the agent reports this natural-language condition is met",
  )
  .option(
    "--prevent-sleep <mode>",
    'Prevent system sleep during the run ("on" or "off")',
    parseOnOffBoolean,
  )
  .option(
    "--worktree",
    "Run in a separate git worktree (enables multiple agents on the same repo)",
    false,
  )
  .option(
    "--resume",
    "Resume from the last checkpoint saved in the run directory",
    false,
  )
  .option(
    "--headless",
    "Disable TUI and output structured JSON lines to stdout (for CI)",
    false,
  )
  .option(
    "--wizard",
    "Run the interactive objective wizard to build a prompt",
    false,
  )
  .option(
    "--auto-pr",
    "When the run finishes with commits, push the branch and open a PR via the gh CLI",
    false,
  )
  .option(
    "--auto-pr-base <branch>",
    "Base branch to target for --auto-pr (defaults to gh's default)",
  )
  .option(
    "--auto-pr-draft",
    "Open the PR as a draft when --auto-pr is enabled",
    false,
  )
  .option(
    "--notify-webhook <url>",
    "POST a JSON run summary to this URL when the run finishes",
  )
  .option(
    "--notify-slack <url>",
    "POST a Slack-formatted summary to this incoming-webhook URL when the run finishes",
  )
  .option("--mock", "", false)
  .action(
    async (
      promptArg: string | undefined,
      options: {
        agent?: string;
        maxIterations?: number;
        maxTokens?: number;
        stopWhen?: string;
        preventSleep?: boolean;
        worktree: boolean;
        resume: boolean;
        headless: boolean;
        wizard: boolean;
        autoPr: boolean;
        autoPrBase?: string;
        autoPrDraft: boolean;
        notifyWebhook?: string;
        notifySlack?: string;
        mock: boolean;
      },
    ) => {
      if (options.mock) {
        const mock = new MockOrchestrator();
        enterAltScreen();
        const renderer = new Renderer(
          mock as unknown as Orchestrator,
          "let's minimize app startup latency without sacrificing any functionality",
          "claude",
        );
        renderer.start();
        mock.start();
        await renderer.waitUntilExit();
        exitAltScreen();
        return;
      }
      let initialSleepPrevention: Awaited<
        ReturnType<typeof startSleepPrevention>
      > | null = null;
      if (process.env.GNHF_SLEEP_INHIBITED === "1") {
        initialSleepPrevention = await startSleepPrevention(
          process.argv.slice(2),
        );
      }
      let prompt = promptArg;
      let promptFromStdin = false;

      const agentName = options.agent;
      if (agentName !== undefined && !isAgentName(agentName)) {
        console.error(
          `Unknown agent: ${options.agent}. Use ${AGENT_NAME_LIST}.`,
        );
        process.exit(1);
      }

      const loadedConfig = loadConfig(
        agentName
          ? {
              agent: agentName,
            }
          : {},
      );
      const config = {
        ...loadedConfig,
        ...(options.preventSleep === undefined
          ? {}
          : { preventSleep: options.preventSleep }),
      };
      if (!isAgentName(config.agent)) {
        console.error(
          `Unknown agent: ${config.agent}. Use ${AGENT_NAME_LIST}.`,
        );
        process.exit(1);
      }

      if (!prompt && process.env.GNHF_SLEEP_INHIBITED === "1") {
        prompt = readReexecStdinPrompt(process.env);
      }
      if (!prompt && options.wizard) {
        if (!process.stdin.isTTY) {
          die("--wizard requires an interactive terminal");
        }
        prompt = await runWizard();
      }
      if (!prompt && !process.stdin.isTTY) {
        prompt = await readStdinText(process.stdin);
        promptFromStdin = true;
      }

      const cwd = process.cwd();
      let effectiveCwd = cwd;
      let worktreePath: string | null = null;
      let worktreeCleanup: (() => void) | null = null;

      const currentBranch = getCurrentBranch(cwd);
      const onGnhfBranch = currentBranch.startsWith("gnhf/");

      const schemaOptions = {
        includeStopField: options.stopWhen !== undefined,
      };

      let runInfo;
      let startIteration = 0;

      if (options.worktree) {
        if (!prompt) {
          program.help();
          return;
        }

        if (onGnhfBranch) {
          console.error(
            "Cannot use --worktree from a gnhf branch. Switch to the base branch first.",
          );
          process.exit(1);
        }

        const wt = initializeWorktreeRun(prompt, cwd, schemaOptions);
        runInfo = wt.runInfo;
        effectiveCwd = wt.effectiveCwd;
        worktreePath = wt.worktreePath;
        worktreeCleanup = () => {
          try {
            removeWorktree(cwd, wt.worktreePath);
          } catch {
            // Best-effort cleanup
          }
        };

        // Ensure worktree cleanup runs even if die() or process.exit() is
        // called before reaching the normal cleanup block (e.g. orchestrator
        // crash → .catch → die → process.exit(1)).
        const exitCleanup = worktreeCleanup;
        process.on("exit", () => {
          if (worktreeCleanup === exitCleanup) {
            exitCleanup();
          }
        });
      } else if (onGnhfBranch) {
        const existingRunId = currentBranch.slice("gnhf/".length);
        const existing = resumeRun(existingRunId, cwd, schemaOptions);
        const existingPrompt = readFileSync(existing.promptPath, "utf-8");

        if (!prompt || prompt === existingPrompt) {
          prompt = existingPrompt;
          runInfo = existing;
          startIteration = getLastIterationNumber(existing);
        } else {
          const answer = await ask(
            `You are on gnhf branch "${currentBranch}".\n` +
              `  (o) Update prompt and continue current run\n` +
              `  (n) Start a new branch on top of this one\n` +
              `  (q) Quit\n` +
              `Choose [o/n/q]: `,
            "The overwrite prompt closed before a choice was entered. Re-run gnhf from an interactive terminal and choose o, n, or q.",
            "Cannot show the overwrite prompt because stdin is not interactive. Re-run gnhf from an interactive terminal and choose o, n, or q.",
          );

          if (answer === "o") {
            ensureCleanWorkingTree(cwd);
            runInfo = setupRun(
              existingRunId,
              prompt,
              existing.baseCommit,
              cwd,
              schemaOptions,
            );
            startIteration = getLastIterationNumber(existing);
          } else if (answer === "n") {
            runInfo = initializeNewBranch(prompt, cwd, schemaOptions);
          } else {
            process.exit(0);
          }
        }
      } else {
        if (!prompt) {
          program.help();
          return;
        }

        runInfo = initializeNewBranch(prompt, cwd, schemaOptions);
      }

      // --resume: restore iteration counter and token counts from checkpoint
      if (options.resume && runInfo) {
        const checkpoint = loadCheckpoint(runInfo.runDir);
        if (checkpoint) {
          startIteration = checkpoint.iteration;
          appendDebugLog("checkpoint:restored", {
            runId: checkpoint.runId,
            iteration: checkpoint.iteration,
            totalInputTokens: checkpoint.totalInputTokens,
            totalOutputTokens: checkpoint.totalOutputTokens,
          });
        }
      }

      let sleepPreventionCleanup: (() => Promise<void>) | null = null;
      if (config.preventSleep) {
        const persistedPrompt =
          promptFromStdin && prompt !== undefined
            ? persistStdinPromptForReexec(prompt)
            : null;
        let reexeced = false;
        try {
          const sleepPrevention =
            initialSleepPrevention ??
            (await startSleepPrevention(process.argv.slice(2), {
              reexecEnv: persistedPrompt
                ? {
                    [GNHF_REEXEC_STDIN_PROMPT_FILE]: persistedPrompt.path,
                  }
                : undefined,
            }));
          if (sleepPrevention.type === "reexeced") {
            reexeced = true;
            process.exit(sleepPrevention.exitCode);
          }
          if (sleepPrevention.type === "active") {
            sleepPreventionCleanup = sleepPrevention.cleanup;
          }
        } finally {
          if (!reexeced) {
            persistedPrompt?.cleanup();
          }
        }
      }

      const telemetrySessionId = getTelemetrySessionId();
      if (isTelemetryEnabled()) {
        trackEvent({
          event: "run.start",
          timestamp: new Date().toISOString(),
          sessionId: telemetrySessionId,
          properties: {
            agent: config.agent,
            headless: options.headless,
            worktree: options.worktree,
            hasMaxIterations: options.maxIterations !== undefined,
            hasMaxTokens: options.maxTokens !== undefined,
            hasStopWhen: options.stopWhen !== undefined,
            promptFromStdin,
            wizard: options.wizard,
            platform: process.platform,
            nodeVersion: process.version,
            gnhfVersion: packageVersion,
          },
        });
      }

      initDebugLog(runInfo.logPath);
      appendDebugLog("run:start", {
        args: process.argv.slice(2),
        runId: runInfo.runId,
        runDir: runInfo.runDir,
        agent: config.agent,
        promptLength: prompt.length,
        promptFromStdin,
        startIteration,
        maxIterations: options.maxIterations,
        maxTokens: options.maxTokens,
        stopWhen: options.stopWhen,
        preventSleep: config.preventSleep,
        agentArgsOverride: config.agentArgsOverride?.[config.agent],
        worktree: options.worktree,
        worktreePath,
        headless: options.headless,
        resume: options.resume,
        platform: process.platform,
        nodeVersion: process.version,
        gnhfVersion: packageVersion,
      });

      const agent = createAgent(
        config.agent,
        runInfo,
        config.agentPathOverride[config.agent],
        config.agentArgsOverride?.[config.agent],
        schemaOptions,
      );
      const orchestrator = new Orchestrator(
        config,
        agent,
        runInfo,
        prompt,
        effectiveCwd,
        startIteration,
        {
          maxIterations: options.maxIterations,
          maxTokens: options.maxTokens,
          stopWhen: options.stopWhen,
        },
      );
      let shutdownSignal: NodeJS.Signals | null = null;

      // Headless mode: structured JSON lines, no TUI
      if (options.headless) {
        const headlessRenderer = new HeadlessRenderer(
          orchestrator,
          process.stdout,
        );
        headlessRenderer.start();

        const requestShutdown = (signal: NodeJS.Signals) => {
          if (shutdownSignal) return;
          shutdownSignal = signal;
          appendDebugLog(`signal:${signal}`);
          headlessRenderer.stop();
          orchestrator.stop();
        };
        const handleSigInt = () => requestShutdown("SIGINT");
        const handleSigTerm = () => requestShutdown("SIGTERM");
        process.on("SIGINT", handleSigInt);
        process.on("SIGTERM", handleSigTerm);

        try {
          await orchestrator.start();
        } catch (err) {
          appendDebugLog("orchestrator:fatal", {
            error: serializeError(err),
          });
          die(err instanceof Error ? err.message : String(err));
        } finally {
          headlessRenderer.stop();
          process.off("SIGINT", handleSigInt);
          process.off("SIGTERM", handleSigTerm);
          await sleepPreventionCleanup?.();
        }

        const finalState = orchestrator.getState();
        appendDebugLog("run:complete", {
          signal: shutdownSignal,
          status: finalState.status,
          iterations: finalState.currentIteration,
          successCount: finalState.successCount,
          failCount: finalState.failCount,
          totalInputTokens: finalState.totalInputTokens,
          totalOutputTokens: finalState.totalOutputTokens,
          commitCount: finalState.commitCount,
          worktreePath,
        });

        const durationMs = Date.now() - finalState.startTime.getTime();
        const runStats: RunStats = {
          runId: runInfo.runId,
          totalInputTokens: finalState.totalInputTokens,
          totalOutputTokens: finalState.totalOutputTokens,
          estimatedCostUsd: calculateCost(
            finalState.totalInputTokens,
            finalState.totalOutputTokens,
            config.agent,
          ),
          iterations: finalState.currentIteration,
          successCount: finalState.successCount,
          failCount: finalState.failCount,
          durationMs,
          agent: config.agent,
        };

        try {
          saveStats(undefined, runStats);
        } catch {
          // Best-effort; don't block shutdown
        }
        // In headless mode, print stats to stderr so stdout stays clean JSON
        console.error(formatRunStats(runStats));

        await runPostRunSideEffects({
          runStats,
          finalStatus: finalState.status,
          runInfo,
          branchName: `gnhf/${runInfo.runId}`,
          cwd: effectiveCwd,
          prompt,
          iterations: finalState.currentIteration,
          successCount: finalState.successCount,
          failCount: finalState.failCount,
          commitCount: finalState.commitCount,
          worktreePath,
          notifyWebhook: options.notifyWebhook,
          notifySlack: options.notifySlack,
          autoPr: options.autoPr,
          autoPrBase: options.autoPrBase,
          autoPrDraft: options.autoPrDraft,
          telemetrySessionId,
        });

        if (worktreePath) {
          if (finalState.commitCount > 0) {
            worktreeCleanup = null;
            console.error(
              `\n  gnhf: worktree preserved at ${worktreePath}` +
                `\n  gnhf: merge the branch and remove with: git worktree remove "${worktreePath}"\n`,
            );
          } else {
            worktreeCleanup?.();
            worktreeCleanup = null;
            appendDebugLog("worktree:cleaned-up", { worktreePath });
          }
        }

        if (shutdownSignal) {
          process.exit(getSignalExitCode(shutdownSignal));
        }
        return;
      }

      // Normal TUI mode
      enterAltScreen();
      const renderer = new Renderer(orchestrator, prompt, config.agent);
      renderer.start();

      const requestShutdown = (signal: NodeJS.Signals) => {
        if (shutdownSignal) return;
        shutdownSignal = signal;
        appendDebugLog(`signal:${signal}`);
        renderer.stop();
        orchestrator.stop();
      };
      const handleSigInt = () => requestShutdown("SIGINT");
      const handleSigTerm = () => requestShutdown("SIGTERM");
      process.on("SIGINT", handleSigInt);
      process.on("SIGTERM", handleSigTerm);

      const orchestratorPromise = orchestrator
        .start()
        .finally(() => {
          const keepTui =
            orchestrator.getState().status === "aborted" && process.stdin.isTTY;
          if (!keepTui) {
            renderer.stop();
          }
        })
        .catch((err) => {
          appendDebugLog("orchestrator:fatal", {
            error: serializeError(err),
          });
          exitAltScreen();
          die(err instanceof Error ? err.message : String(err));
        });

      try {
        const rendererExitReason = await renderer.waitUntilExit();
        if (rendererExitReason === "interrupted" && !shutdownSignal) {
          shutdownSignal = "SIGINT";
          appendDebugLog("signal:SIGINT");
        }
        exitAltScreen();
        const shutdownResult = await Promise.race([
          orchestratorPromise.then(() => "done" as const),
          new Promise<"timeout">((resolve) => {
            setTimeout(() => resolve("timeout"), FORCE_EXIT_TIMEOUT_MS).unref();
          }),
        ]);

        if (shutdownResult === "timeout") {
          appendDebugLog("run:shutdown-timeout", {
            timeoutMs: FORCE_EXIT_TIMEOUT_MS,
          });
          console.error(
            `\n  gnhf: shutdown timed out after ${FORCE_EXIT_TIMEOUT_MS / 1000}s, forcing exit\n`,
          );
          process.exit(getSignalExitCode(shutdownSignal ?? "SIGINT"));
        }
      } finally {
        process.off("SIGINT", handleSigInt);
        process.off("SIGTERM", handleSigTerm);
        await sleepPreventionCleanup?.();
      }

      {
        const finalState = orchestrator.getState();
        appendDebugLog("run:complete", {
          signal: shutdownSignal,
          status: finalState.status,
          iterations: finalState.currentIteration,
          successCount: finalState.successCount,
          failCount: finalState.failCount,
          totalInputTokens: finalState.totalInputTokens,
          totalOutputTokens: finalState.totalOutputTokens,
          commitCount: finalState.commitCount,
          worktreePath,
        });

        const durationMs =
          Date.now() - finalState.startTime.getTime();
        const runStats: RunStats = {
          runId: runInfo.runId,
          totalInputTokens: finalState.totalInputTokens,
          totalOutputTokens: finalState.totalOutputTokens,
          estimatedCostUsd: calculateCost(
            finalState.totalInputTokens,
            finalState.totalOutputTokens,
            config.agent,
          ),
          iterations: finalState.currentIteration,
          successCount: finalState.successCount,
          failCount: finalState.failCount,
          durationMs,
          agent: config.agent,
        };

        try {
          saveStats(undefined, runStats);
        } catch {
          // Best-effort; don't block shutdown
        }
        console.error(formatRunStats(runStats));

        await runPostRunSideEffects({
          runStats,
          finalStatus: finalState.status,
          runInfo,
          branchName: `gnhf/${runInfo.runId}`,
          cwd: effectiveCwd,
          prompt,
          iterations: finalState.currentIteration,
          successCount: finalState.successCount,
          failCount: finalState.failCount,
          commitCount: finalState.commitCount,
          worktreePath,
          notifyWebhook: options.notifyWebhook,
          notifySlack: options.notifySlack,
          autoPr: options.autoPr,
          autoPrBase: options.autoPrBase,
          autoPrDraft: options.autoPrDraft,
          telemetrySessionId,
        });

        if (worktreePath) {
          if (finalState.commitCount > 0) {
            worktreeCleanup = null;
            console.error(
              `\n  gnhf: worktree preserved at ${worktreePath}` +
                `\n  gnhf: merge the branch and remove with: git worktree remove "${worktreePath}"\n`,
            );
          } else {
            worktreeCleanup?.();
            worktreeCleanup = null;
            appendDebugLog("worktree:cleaned-up", {
              worktreePath,
            });
          }
        }
      }

      if (shutdownSignal) {
        process.exit(getSignalExitCode(shutdownSignal));
      }
    },
  );

program
  .command("stats")
  .description("Display cumulative usage statistics from all recorded runs")
  .action(() => {
    const allStats = loadAllStats();
    console.log(formatStatsReport(allStats));
  });

program
  .command("init")
  .description("Interactive setup wizard for gnhf configuration")
  .action(async () => {
    await runInit();
  });

function resolveRunDir(runId: string, cwd: string): string {
  return join(cwd, ".gnhf", "runs", runId);
}

function ensureRunDirExists(runDir: string, runId: string): void {
  if (!existsSync(runDir)) {
    die(`No run directory found for "${runId}" at ${runDir}`);
  }
}

program
  .command("pause")
  .argument("[runId]", "Run ID to pause (defaults to the current gnhf branch)")
  .description("Signal a running gnhf loop to pause before its next iteration")
  .action((runIdArg: string | undefined) => {
    const cwd = process.cwd();
    const runId = runIdArg ?? getCurrentBranch(cwd).replace(/^gnhf\//, "");
    if (!runId || runId.startsWith("gnhf")) {
      die("Could not infer a run ID. Run from a gnhf/ branch or pass one explicitly.");
    }
    const runDir = resolveRunDir(runId, cwd);
    ensureRunDirExists(runDir, runId);
    writePause(runDir);
    console.error(`  gnhf: paused ${runId}. Run \`gnhf resume ${runId}\` to continue.`);
  });

program
  .command("resume-run")
  .argument("[runId]", "Run ID to resume (defaults to the current gnhf branch)")
  .description("Clear a previously-set pause so the loop continues")
  .action((runIdArg: string | undefined) => {
    const cwd = process.cwd();
    const runId = runIdArg ?? getCurrentBranch(cwd).replace(/^gnhf\//, "");
    if (!runId || runId.startsWith("gnhf")) {
      die("Could not infer a run ID. Run from a gnhf/ branch or pass one explicitly.");
    }
    const runDir = resolveRunDir(runId, cwd);
    ensureRunDirExists(runDir, runId);
    clearPause(runDir);
    console.error(`  gnhf: resumed ${runId}.`);
  });

program
  .command("steer")
  .argument("<text...>", "Steering text to append to the next iteration prompt")
  .option("--run-id <runId>", "Target run (defaults to the current gnhf branch)")
  .option("--from-file <path>", "Read the steer text from a file instead of args")
  .description("Inject operator guidance into the next iteration prompt")
  .action((text: string[], opts: { runId?: string; fromFile?: string }) => {
    const cwd = process.cwd();
    const runId = opts.runId ?? getCurrentBranch(cwd).replace(/^gnhf\//, "");
    if (!runId || runId.startsWith("gnhf")) {
      die("Could not infer a run ID. Run from a gnhf/ branch or pass --run-id.");
    }
    const runDir = resolveRunDir(runId, cwd);
    ensureRunDirExists(runDir, runId);

    const body = opts.fromFile
      ? readFileSync(opts.fromFile, "utf-8")
      : text.join(" ").trim();
    if (!body) {
      die("Refusing to write an empty steer message.");
    }
    writeSteer(runDir, body);
    console.error(
      `  gnhf: steer recorded for ${runId} (${body.length} chars). It will be applied to the next iteration.`,
    );
  });

program
  .command("abort")
  .argument("[runId]", "Run ID to abort (defaults to the current gnhf branch)")
  .option("--reason <text>", "Reason recorded alongside the abort", "operator requested abort")
  .description("Ask the orchestrator to stop cleanly between iterations")
  .action((runIdArg: string | undefined, opts: { reason: string }) => {
    const cwd = process.cwd();
    const runId = runIdArg ?? getCurrentBranch(cwd).replace(/^gnhf\//, "");
    if (!runId || runId.startsWith("gnhf")) {
      die("Could not infer a run ID. Run from a gnhf/ branch or pass one explicitly.");
    }
    const runDir = resolveRunDir(runId, cwd);
    ensureRunDirExists(runDir, runId);
    writeAbort(runDir, opts.reason);
    console.error(`  gnhf: abort recorded for ${runId}.`);
  });

program
  .command("runs")
  .description("List recorded runs in this repository")
  .action(() => {
    const cwd = process.cwd();
    const entries = loadRunHistory(cwd);
    process.stdout.write(formatHistoryTable(entries));
  });

program
  .command("compare")
  .argument("<runA>", "First run ID")
  .argument("<runB>", "Second run ID")
  .description("Compare two recorded runs side-by-side")
  .action((runAId: string, runBId: string) => {
    const cwd = process.cwd();
    const entries = loadRunHistory(cwd);
    const a = findRun(entries, runAId);
    const b = findRun(entries, runBId);
    if (!a) die(`Could not find run "${runAId}" — try \`gnhf runs\`.`);
    if (!b) die(`Could not find run "${runBId}" — try \`gnhf runs\`.`);
    process.stdout.write(formatComparison(a, b));
  });

try {
  await program.parseAsync();
} catch (err) {
  if (err instanceof PromptSignalError) {
    process.exit(getSignalExitCode(err.signal));
  }
  die(err instanceof Error ? err.message : String(err));
}
