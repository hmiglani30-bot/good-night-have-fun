import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "node:child_process";
import {
  ensureCleanWorkingTree,
  createBranch,
  commitAll,
  resetHard,
} from "./git.js";

const mockExecSync = vi.mocked(execSync);

describe("git utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReturnValue("");
  });

  describe("ensureCleanWorkingTree", () => {
    it("does not throw when working tree is clean", () => {
      mockExecSync.mockReturnValue("");
      expect(() => ensureCleanWorkingTree("/repo")).not.toThrow();
    });

    it("throws when working tree has changes", () => {
      mockExecSync.mockReturnValue(" M src/index.ts");
      expect(() => ensureCleanWorkingTree("/repo")).toThrow(
        "Working tree is not clean",
      );
    });

    it("calls git status --porcelain with correct cwd", () => {
      mockExecSync.mockReturnValue("");
      ensureCleanWorkingTree("/my/repo");
      expect(mockExecSync).toHaveBeenCalledWith("git status --porcelain", {
        cwd: "/my/repo",
        encoding: "utf-8",
        stdio: "pipe",
      });
    });
  });

  describe("createBranch", () => {
    it("calls git checkout -b with the branch name", () => {
      createBranch("feature/test", "/repo");
      expect(mockExecSync).toHaveBeenCalledWith(
        "git checkout -b feature/test",
        {
          cwd: "/repo",
          encoding: "utf-8",
          stdio: "pipe",
        },
      );
    });
  });

  describe("commitAll", () => {
    it("stages all files and commits with the message", () => {
      commitAll("initial commit", "/repo");
      expect(mockExecSync).toHaveBeenCalledWith("git add -A", {
        cwd: "/repo",
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect(mockExecSync).toHaveBeenCalledWith(
        'git commit -m "initial commit"',
        {
          cwd: "/repo",
          encoding: "utf-8",
          stdio: "pipe",
        },
      );
    });

    it("escapes double quotes in commit message", () => {
      commitAll('fix "broken" test', "/repo");
      expect(mockExecSync).toHaveBeenCalledWith(
        'git commit -m "fix \\"broken\\" test"',
        {
          cwd: "/repo",
          encoding: "utf-8",
          stdio: "pipe",
        },
      );
    });

    it("does not throw when there is nothing to commit", () => {
      mockExecSync.mockImplementation((cmd) => {
        if (typeof cmd === "string" && cmd.startsWith("git commit")) {
          throw new Error("nothing to commit");
        }
        return "";
      });

      expect(() => commitAll("empty", "/repo")).not.toThrow();
    });
  });

  describe("resetHard", () => {
    it("runs git reset --hard HEAD and git clean -fd", () => {
      resetHard("/repo");
      expect(mockExecSync).toHaveBeenCalledWith("git reset --hard HEAD", {
        cwd: "/repo",
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect(mockExecSync).toHaveBeenCalledWith("git clean -fd", {
        cwd: "/repo",
        encoding: "utf-8",
        stdio: "pipe",
      });
    });
  });
});
