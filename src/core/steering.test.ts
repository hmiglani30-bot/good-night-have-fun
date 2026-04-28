import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearPause,
  clearSteer,
  isPaused,
  readSteer,
  shouldAbort,
  waitWhilePaused,
  writeAbort,
  writePause,
  writeSteer,
} from "./steering.js";

describe("steering", () => {
  let runDir: string;

  beforeEach(() => {
    runDir = mkdtempSync(join(tmpdir(), "gnhf-steer-"));
  });

  afterEach(() => {
    rmSync(runDir, { recursive: true, force: true });
  });

  it("starts unpaused with no steer or abort", () => {
    expect(isPaused(runDir)).toBe(false);
    expect(shouldAbort(runDir)).toBe(false);
    expect(readSteer(runDir)).toBeNull();
  });

  it("flips pause on and off", () => {
    writePause(runDir);
    expect(isPaused(runDir)).toBe(true);
    clearPause(runDir);
    expect(isPaused(runDir)).toBe(false);
  });

  it("round-trips steer text and clears it", () => {
    writeSteer(runDir, "focus on the auth module next");
    expect(readSteer(runDir)).toBe("focus on the auth module next");
    clearSteer(runDir);
    expect(readSteer(runDir)).toBeNull();
  });

  it("records abort intent", () => {
    writeAbort(runDir, "operator requested stop");
    expect(shouldAbort(runDir)).toBe(true);
  });

  it("waitWhilePaused resolves to 'resumed' when pause clears", async () => {
    writePause(runDir);
    setTimeout(() => clearPause(runDir), 30);
    const result = await waitWhilePaused(runDir, { intervalMs: 10 });
    expect(result).toBe("resumed");
  });

  it("waitWhilePaused resolves to 'aborted' when abort file appears", async () => {
    writePause(runDir);
    setTimeout(() => writeAbort(runDir, "stop"), 30);
    const result = await waitWhilePaused(runDir, { intervalMs: 10 });
    expect(result).toBe("aborted");
  });
});
