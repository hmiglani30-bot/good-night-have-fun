import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  appendFileSync: vi.fn(),
  readFileSync: vi.fn(() => ""),
  readdirSync: vi.fn(() => []),
  existsSync: vi.fn(() => false),
}));

import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { setupRun, appendNotes } from "./run.js";

const mockMkdirSync = vi.mocked(mkdirSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockAppendFileSync = vi.mocked(appendFileSync);

describe("setupRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the run directory recursively", () => {
    setupRun("test-run-1", "fix bugs", "/project");
    expect(mockMkdirSync).toHaveBeenCalledWith(
      "/project/.gnhf/runs/test-run-1",
      { recursive: true },
    );
  });

  it("writes PROMPT.md with the prompt text", () => {
    setupRun("run-abc", "improve coverage", "/project");
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/project/.gnhf/runs/run-abc/prompt.md",
      "improve coverage",
      "utf-8",
    );
  });

  it("writes notes.md with header and objective", () => {
    setupRun("run-abc", "improve coverage", "/project");
    const notesCall = mockWriteFileSync.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].endsWith("notes.md"),
    );
    expect(notesCall).toBeDefined();
    const content = notesCall![1] as string;
    expect(content).toContain("# gnhf run: run-abc");
    expect(content).toContain("Objective: improve coverage");
    expect(content).toContain("## Iteration Log");
  });

  it("writes output-schema.json with valid JSON schema", () => {
    setupRun("run-abc", "test", "/project");
    const schemaCall = mockWriteFileSync.mock.calls.find(
      (call) =>
        typeof call[0] === "string" && call[0].endsWith("output-schema.json"),
    );
    expect(schemaCall).toBeDefined();
    const schema = JSON.parse(schemaCall![1] as string);
    expect(schema.type).toBe("object");
    expect(schema.required).toContain("success");
    expect(schema.required).toContain("summary");
    expect(schema.required).toContain("key_changes_made");
    expect(schema.required).toContain("key_learnings");
  });

  it("returns correct RunInfo paths", () => {
    const info = setupRun("my-run", "prompt text", "/project");
    expect(info).toEqual({
      runId: "my-run",
      runDir: "/project/.gnhf/runs/my-run",
      promptPath: "/project/.gnhf/runs/my-run/prompt.md",
      notesPath: "/project/.gnhf/runs/my-run/notes.md",
      schemaPath: "/project/.gnhf/runs/my-run/output-schema.json",
    });
  });
});

describe("appendNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends iteration header and summary", () => {
    appendNotes("/notes.md", 3, "Added tests", [], []);
    const content = mockAppendFileSync.mock.calls[0][1] as string;
    expect(content).toContain("### Iteration 3");
    expect(content).toContain("**Summary:** Added tests");
  });

  it("includes changes when provided", () => {
    appendNotes("/notes.md", 1, "summary", ["file1.ts", "file2.ts"], []);
    const content = mockAppendFileSync.mock.calls[0][1] as string;
    expect(content).toContain("**Changes:**");
    expect(content).toContain("- file1.ts");
    expect(content).toContain("- file2.ts");
  });

  it("includes learnings when provided", () => {
    appendNotes("/notes.md", 1, "summary", [], ["learned something"]);
    const content = mockAppendFileSync.mock.calls[0][1] as string;
    expect(content).toContain("**Learnings:**");
    expect(content).toContain("- learned something");
  });

  it("omits changes section when array is empty", () => {
    appendNotes("/notes.md", 1, "summary", [], ["learning"]);
    const content = mockAppendFileSync.mock.calls[0][1] as string;
    expect(content).not.toContain("**Changes:**");
  });

  it("omits learnings section when array is empty", () => {
    appendNotes("/notes.md", 1, "summary", ["change"], []);
    const content = mockAppendFileSync.mock.calls[0][1] as string;
    expect(content).not.toContain("**Learnings:**");
  });
});
