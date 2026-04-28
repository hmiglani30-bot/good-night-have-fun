import type {
  Orchestrator,
  OrchestratorState,
  IterationRecord,
} from "./core/orchestrator.js";

interface HeadlessEvent {
  type: "iteration:start" | "iteration:end" | "abort" | "stopped";
  timestamp: string;
  data: Record<string, unknown>;
}

export class HeadlessRenderer {
  private orchestrator: Orchestrator;
  private output: NodeJS.WritableStream;

  constructor(orchestrator: Orchestrator, output: NodeJS.WritableStream) {
    this.orchestrator = orchestrator;
    this.output = output;
  }

  start(): void {
    this.orchestrator.on(
      "iteration:start",
      (iteration: number) => {
        this.writeEvent({
          type: "iteration:start",
          timestamp: new Date().toISOString(),
          data: { iteration },
        });
      },
    );

    this.orchestrator.on(
      "iteration:end",
      (record: IterationRecord) => {
        this.writeEvent({
          type: "iteration:end",
          timestamp: new Date().toISOString(),
          data: {
            iteration: record.number,
            success: record.success,
            summary: record.summary,
            keyChanges: record.keyChanges,
            keyLearnings: record.keyLearnings,
          },
        });
      },
    );

    this.orchestrator.on("abort", (reason: string) => {
      this.writeEvent({
        type: "abort",
        timestamp: new Date().toISOString(),
        data: { reason },
      });
    });

    this.orchestrator.on("stopped", () => {
      this.writeEvent({
        type: "stopped",
        timestamp: new Date().toISOString(),
        data: {},
      });
    });
  }

  stop(): void {
    this.orchestrator.removeAllListeners("iteration:start");
    this.orchestrator.removeAllListeners("iteration:end");
    this.orchestrator.removeAllListeners("abort");
    this.orchestrator.removeAllListeners("stopped");
  }

  private writeEvent(event: HeadlessEvent): void {
    this.output.write(JSON.stringify(event) + "\n");
  }
}
