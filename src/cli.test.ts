import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const packageVersion = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
).version as string;

describe("cli", () => {
  it("prints the package version for -V", async () => {
    const originalArgv = [...process.argv];
    const stdoutWrite = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as typeof process.exit);

    process.argv = ["node", "gnhf", "-V"];

    try {
      vi.resetModules();
      await import("./cli.js");

      expect(stdoutWrite).toHaveBeenCalledWith(`${packageVersion}\n`);
      expect(exitSpy).toHaveBeenCalledWith(0);
    } finally {
      process.argv = originalArgv;
      stdoutWrite.mockRestore();
      exitSpy.mockRestore();
    }
  });
});
