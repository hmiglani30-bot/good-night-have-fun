import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import type {
  Agent,
  AgentResult,
  AgentOutput,
  TokenUsage,
  AgentRunOptions,
} from "./types.js";

interface CodexItemCompleted {
  type: "item.completed";
  item: { type: string; text: string };
}

interface CodexTurnCompleted {
  type: "turn.completed";
  usage: {
    input_tokens: number;
    cached_input_tokens: number;
    output_tokens: number;
  };
}

type CodexEvent = CodexItemCompleted | CodexTurnCompleted | { type: string };

export class CodexAgent implements Agent {
  name = "codex";

  private schemaPath: string;

  constructor(schemaPath: string) {
    this.schemaPath = schemaPath;
  }

  run(
    prompt: string,
    cwd: string,
    options?: AgentRunOptions,
  ): Promise<AgentResult> {
    const { onUsage, onMessage, signal, logPath } = options ?? {};

    return new Promise((resolve, reject) => {
      const logStream = logPath ? createWriteStream(logPath) : null;

      const child = spawn(
        "codex",
        [
          "exec",
          prompt,
          "--json",
          "--output-schema",
          this.schemaPath,
          "--dangerously-bypass-approvals-and-sandbox",
          "--color",
          "never",
        ],
        { cwd, stdio: ["ignore", "pipe", "pipe"], env: process.env },
      );

      if (signal) {
        const onAbort = () => {
          child.kill("SIGTERM");
          reject(new Error("Agent was aborted"));
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
        child.on("close", () => signal.removeEventListener("abort", onAbort));
      }

      let stderr = "";
      let lastAgentMessage: string | null = null;
      const usages: CodexTurnCompleted["usage"][] = [];
      let buffer = "";

      child.stdout.on("data", (data: Buffer) => {
        logStream?.write(data);
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as CodexEvent;

            if (
              event.type === "item.completed" &&
              "item" in event &&
              (event as CodexItemCompleted).item.type === "agent_message"
            ) {
              lastAgentMessage = (event as CodexItemCompleted).item.text;
              onMessage?.(lastAgentMessage);
            }

            if (event.type === "turn.completed" && "usage" in event) {
              usages.push((event as CodexTurnCompleted).usage);
              if (onUsage) {
                const cumulative: TokenUsage = usages.reduce(
                  (acc, u) => ({
                    inputTokens: acc.inputTokens + (u.input_tokens ?? 0),
                    outputTokens: acc.outputTokens + (u.output_tokens ?? 0),
                    cacheReadTokens:
                      acc.cacheReadTokens + (u.cached_input_tokens ?? 0),
                    cacheCreationTokens: 0,
                  }),
                  {
                    inputTokens: 0,
                    outputTokens: 0,
                    cacheReadTokens: 0,
                    cacheCreationTokens: 0,
                  },
                );
                onUsage(cumulative);
              }
            }
          } catch {
            // Skip unparseable lines
          }
        }
      });

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        reject(new Error(`Failed to spawn codex: ${err.message}`));
      });

      child.on("close", (code) => {
        logStream?.end();
        if (code !== 0) {
          reject(new Error(`codex exited with code ${code}: ${stderr}`));
          return;
        }

        if (!lastAgentMessage) {
          reject(new Error("codex returned no agent message"));
          return;
        }

        try {
          const output = JSON.parse(lastAgentMessage) as AgentOutput;

          const usage: TokenUsage = usages.reduce(
            (acc, u) => ({
              inputTokens: acc.inputTokens + (u.input_tokens ?? 0),
              outputTokens: acc.outputTokens + (u.output_tokens ?? 0),
              cacheReadTokens:
                acc.cacheReadTokens + (u.cached_input_tokens ?? 0),
              cacheCreationTokens: acc.cacheCreationTokens,
            }),
            {
              inputTokens: 0,
              outputTokens: 0,
              cacheReadTokens: 0,
              cacheCreationTokens: 0,
            },
          );

          resolve({ output, usage });
        } catch (err) {
          reject(
            new Error(
              `Failed to parse codex output: ${err instanceof Error ? err.message : err}`,
            ),
          );
        }
      });
    });
  }
}
