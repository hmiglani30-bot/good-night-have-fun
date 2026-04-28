import { describe, expect, it } from "vitest";
import {
  buildPlainSummary,
  parseNotificationFlag,
  type RunSummary,
} from "./notifications.js";

const sampleSummary: RunSummary = {
  runId: "run-test",
  agent: "claude",
  status: "stopped",
  iterations: 5,
  successCount: 4,
  failCount: 1,
  totalInputTokens: 12000,
  totalOutputTokens: 3000,
  estimatedCostUsd: 0.085,
  durationMs: 65_000,
  worktreePath: null,
};

describe("notifications", () => {
  it("formats a plain text summary", () => {
    const text = buildPlainSummary(sampleSummary);
    expect(text).toContain("run-test");
    expect(text).toContain("claude");
    expect(text).toContain("4 ok / 1 failed");
    expect(text).toContain("$0.0850");
    expect(text).toContain("1m 5s");
  });

  it("parses webhook and slack flags into targets", () => {
    expect(parseNotificationFlag(undefined, undefined)).toEqual([]);

    expect(
      parseNotificationFlag("https://example.com/hook", undefined),
    ).toEqual([{ type: "webhook", url: "https://example.com/hook" }]);

    expect(
      parseNotificationFlag(undefined, "https://hooks.slack.com/services/x/y"),
    ).toEqual([
      { type: "slack", url: "https://hooks.slack.com/services/x/y" },
    ]);

    expect(
      parseNotificationFlag(
        "https://example.com/hook",
        "https://hooks.slack.com/services/x/y",
      ),
    ).toHaveLength(2);
  });

  it("includes worktreePath in the summary when set", () => {
    const text = buildPlainSummary({
      ...sampleSummary,
      worktreePath: "/tmp/my-worktree",
    });
    expect(text).toContain("/tmp/my-worktree");
  });
});
