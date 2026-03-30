import { EventEmitter } from "node:events";
import { join } from "node:path";
import type { Agent, TokenUsage } from "./agents/types.js";
import type { Config } from "./config.js";
import type { RunInfo } from "./run.js";
import { commitAll, resetHard } from "./git.js";
import { appendNotes } from "./run.js";
import { buildIterationPrompt } from "../templates/iteration-prompt.js";

export interface IterationRecord {
  number: number;
  success: boolean;
  summary: string;
  keyChanges: string[];
  keyLearnings: string[];
  timestamp: Date;
}

export interface OrchestratorState {
  status: "running" | "waiting" | "aborted" | "stopped";
  currentIteration: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  iterations: IterationRecord[];
  successCount: number;
  failCount: number;
  consecutiveFailures: number;
  startTime: Date;
  waitingUntil: Date | null;
  lastMessage: string | null;
}

export interface OrchestratorEvents {
  state: [OrchestratorState];
  "iteration:start": [number];
  "iteration:end": [IterationRecord];
  abort: [string];
  stopped: [];
}

export class Orchestrator extends EventEmitter<OrchestratorEvents> {
  private config: Config;
  private agent: Agent;
  private runInfo: RunInfo;
  private cwd: string;
  private prompt: string;
  private stopRequested = false;
  private activeAbortController: AbortController | null = null;

  private state: OrchestratorState = {
    status: "running",
    currentIteration: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    iterations: [],
    successCount: 0,
    failCount: 0,
    consecutiveFailures: 0,
    startTime: new Date(),
    waitingUntil: null,
    lastMessage: null,
  };

  constructor(
    config: Config,
    agent: Agent,
    runInfo: RunInfo,
    prompt: string,
    cwd: string,
    startIteration = 0,
  ) {
    super();
    this.config = config;
    this.agent = agent;
    this.runInfo = runInfo;
    this.prompt = prompt;
    this.cwd = cwd;
    this.state.currentIteration = startIteration;
  }

  getState(): OrchestratorState {
    return { ...this.state };
  }

  stop(): void {
    this.stopRequested = true;
    this.activeAbortController?.abort();
    resetHard(this.cwd);
    this.state.status = "stopped";
    this.emit("state", this.getState());
    this.emit("stopped");
  }

  async start(): Promise<void> {
    this.state.startTime = new Date();
    this.state.status = "running";
    this.emit("state", this.getState());

    while (!this.stopRequested) {
      this.state.currentIteration++;
      this.state.status = "running";
      this.emit("iteration:start", this.state.currentIteration);
      this.emit("state", this.getState());

      const iterationPrompt = buildIterationPrompt({
        n: this.state.currentIteration,
        runId: this.runInfo.runId,
        prompt: this.prompt,
      });

      let record: IterationRecord;
      const baseInputTokens = this.state.totalInputTokens;
      const baseOutputTokens = this.state.totalOutputTokens;

      this.activeAbortController = new AbortController();

      const onUsage = (usage: TokenUsage) => {
        this.state.totalInputTokens = baseInputTokens + usage.inputTokens;
        this.state.totalOutputTokens = baseOutputTokens + usage.outputTokens;
        this.emit("state", this.getState());
      };

      const onMessage = (text: string) => {
        this.state.lastMessage = text;
        this.emit("state", this.getState());
      };

      const logPath = join(
        this.runInfo.runDir,
        `iteration-${this.state.currentIteration}.jsonl`,
      );

      try {
        const result = await this.agent.run(iterationPrompt, this.cwd, {
          onUsage,
          onMessage,
          signal: this.activeAbortController.signal,
          logPath,
        });

        if (result.output.success) {
          appendNotes(
            this.runInfo.notesPath,
            this.state.currentIteration,
            result.output.summary,
            result.output.key_changes_made,
            result.output.key_learnings,
          );

          commitAll(
            `gnhf #${this.state.currentIteration}: ${result.output.summary}`,
            this.cwd,
          );

          this.state.successCount++;
          this.state.consecutiveFailures = 0;

          record = {
            number: this.state.currentIteration,
            success: true,
            summary: result.output.summary,
            keyChanges: result.output.key_changes_made,
            keyLearnings: result.output.key_learnings,
            timestamp: new Date(),
          };
        } else {
          appendNotes(
            this.runInfo.notesPath,
            this.state.currentIteration,
            `[FAIL] ${result.output.summary}`,
            [],
            result.output.key_learnings,
          );

          resetHard(this.cwd);
          this.state.failCount++;
          this.state.consecutiveFailures++;

          record = {
            number: this.state.currentIteration,
            success: false,
            summary: result.output.summary,
            keyChanges: [],
            keyLearnings: result.output.key_learnings,
            timestamp: new Date(),
          };
        }
      } catch (err) {
        const summary = err instanceof Error ? err.message : String(err);

        appendNotes(
          this.runInfo.notesPath,
          this.state.currentIteration,
          `[ERROR] ${summary}`,
          [],
          [],
        );

        resetHard(this.cwd);
        this.state.failCount++;
        this.state.consecutiveFailures++;

        record = {
          number: this.state.currentIteration,
          success: false,
          summary,
          keyChanges: [],
          keyLearnings: [],
          timestamp: new Date(),
        };
      }

      this.state.iterations.push(record);
      this.emit("iteration:end", record);
      this.emit("state", this.getState());

      if (
        this.state.consecutiveFailures >= this.config.maxConsecutiveFailures
      ) {
        this.state.status = "aborted";
        const reason = `${this.config.maxConsecutiveFailures} consecutive failures`;
        this.emit("abort", reason);
        this.emit("state", this.getState());
        break;
      }

      if (this.state.consecutiveFailures > 0 && !this.stopRequested) {
        const backoffMs =
          60_000 * Math.pow(2, this.state.consecutiveFailures - 1);
        this.state.status = "waiting";
        this.state.waitingUntil = new Date(Date.now() + backoffMs);
        this.emit("state", this.getState());

        await this.interruptibleSleep(backoffMs);

        this.state.waitingUntil = null;
        if (!this.stopRequested) {
          this.state.status = "running";
          this.emit("state", this.getState());
        }
      }
    }
  }

  private interruptibleSleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.activeAbortController = new AbortController();
      const timer = setTimeout(() => {
        this.activeAbortController = null;
        resolve();
      }, ms);

      this.activeAbortController.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        this.activeAbortController = null;
        resolve();
      });
    });
  }
}
