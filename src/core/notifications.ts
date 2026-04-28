import { request } from "node:https";
import { request as httpRequest } from "node:http";
import { URL } from "node:url";

export interface RunSummary {
  runId: string;
  agent: string;
  status: "running" | "waiting" | "aborted" | "stopped";
  iterations: number;
  successCount: number;
  failCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  worktreePath: string | null;
}

export interface NotificationTarget {
  type: "webhook" | "slack";
  url: string;
}

function formatDurationShort(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function buildPlainSummary(summary: RunSummary): string {
  const status = summary.status === "stopped" ? "completed" : summary.status;
  const lines = [
    `gnhf run ${summary.runId} ${status}`,
    `  agent:        ${summary.agent}`,
    `  iterations:   ${summary.iterations} (${summary.successCount} ok / ${summary.failCount} failed)`,
    `  tokens:       ${summary.totalInputTokens.toLocaleString()} in / ${summary.totalOutputTokens.toLocaleString()} out`,
    `  est. cost:    $${summary.estimatedCostUsd.toFixed(4)}`,
    `  duration:     ${formatDurationShort(summary.durationMs)}`,
  ];
  if (summary.worktreePath) {
    lines.push(`  worktree:     ${summary.worktreePath}`);
  }
  return lines.join("\n");
}

function buildSlackPayload(summary: RunSummary): Record<string, unknown> {
  const status = summary.status === "stopped" ? "completed" : summary.status;
  const emoji =
    summary.status === "aborted"
      ? ":x:"
      : summary.failCount > 0 && summary.successCount === 0
        ? ":warning:"
        : ":white_check_mark:";
  return {
    text: `${emoji} gnhf run \`${summary.runId}\` ${status}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *gnhf run* \`${summary.runId}\` ${status}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Agent:*\n${summary.agent}` },
          {
            type: "mrkdwn",
            text: `*Iterations:*\n${summary.iterations} (${summary.successCount} ok / ${summary.failCount} failed)`,
          },
          {
            type: "mrkdwn",
            text: `*Tokens:*\n${summary.totalInputTokens.toLocaleString()} in / ${summary.totalOutputTokens.toLocaleString()} out`,
          },
          {
            type: "mrkdwn",
            text: `*Est. cost:*\n$${summary.estimatedCostUsd.toFixed(4)}`,
          },
          {
            type: "mrkdwn",
            text: `*Duration:*\n${formatDurationShort(summary.durationMs)}`,
          },
        ],
      },
    ],
  };
}

function postJson(url: string, payload: unknown, timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    const isHttps = parsed.protocol === "https:";
    const requestFn = isHttps ? request : httpRequest;
    const body = Buffer.from(JSON.stringify(payload), "utf-8");

    const req = requestFn(
      {
        method: "POST",
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          "content-type": "application/json",
          "content-length": body.length,
        },
        timeout: timeoutMs,
      },
      (res) => {
        // Drain body so the socket can close.
        res.on("data", () => {});
        res.on("end", () => {
          if (
            res.statusCode !== undefined &&
            res.statusCode >= 200 &&
            res.statusCode < 300
          ) {
            resolve();
          } else {
            reject(
              new Error(
                `notification webhook returned status ${res.statusCode ?? "?"}`,
              ),
            );
          }
        });
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("notification webhook timed out"));
    });
    req.write(body);
    req.end();
  });
}

export async function sendNotification(
  target: NotificationTarget,
  summary: RunSummary,
): Promise<void> {
  const payload =
    target.type === "slack"
      ? buildSlackPayload(summary)
      : { runId: summary.runId, summary };
  await postJson(target.url, payload);
}

export function parseNotificationFlag(
  rawWebhook: string | undefined,
  rawSlack: string | undefined,
): NotificationTarget[] {
  const targets: NotificationTarget[] = [];
  if (rawWebhook) {
    targets.push({ type: "webhook", url: rawWebhook });
  }
  if (rawSlack) {
    targets.push({ type: "slack", url: rawSlack });
  }
  return targets;
}
