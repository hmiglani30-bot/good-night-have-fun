import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/mock-home"),
}));

import { readFileSync } from "node:fs";
import { loadConfig } from "./config.js";

const mockReadFileSync = vi.mocked(readFileSync);

describe("loadConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when config file does not exist", () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const config = loadConfig();
    expect(config).toEqual({
      agent: "claude",
      maxConsecutiveFailures: 5,
    });
  });

  it("reads config from ~/.gnhf/config.yml", () => {
    mockReadFileSync.mockReturnValue("agent: codex\n");

    const config = loadConfig();

    expect(mockReadFileSync).toHaveBeenCalledWith(
      "/mock-home/.gnhf/config.yml",
      "utf-8",
    );
    expect(config.agent).toBe("codex");
  });

  it("merges file config with defaults", () => {
    mockReadFileSync.mockReturnValue("maxConsecutiveFailures: 10\n");

    const config = loadConfig();
    expect(config).toEqual({
      agent: "claude",
      maxConsecutiveFailures: 10,
    });
  });

  it("overrides take precedence over file config and defaults", () => {
    mockReadFileSync.mockReturnValue(
      "agent: codex\nmaxConsecutiveFailures: 10\n",
    );

    const config = loadConfig({ agent: "claude", maxConsecutiveFailures: 3 });
    expect(config).toEqual({
      agent: "claude",
      maxConsecutiveFailures: 3,
    });
  });

  it("handles empty config file gracefully", () => {
    mockReadFileSync.mockReturnValue("");

    const config = loadConfig();
    expect(config).toEqual({
      agent: "claude",
      maxConsecutiveFailures: 5,
    });
  });

  it("handles invalid YAML gracefully", () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("invalid yaml");
    });

    const config = loadConfig();
    expect(config).toEqual({
      agent: "claude",
      maxConsecutiveFailures: 5,
    });
  });
});
