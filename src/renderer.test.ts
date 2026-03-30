import { describe, it, expect } from "vitest";
import {
  stripAnsi,
  renderTitle,
  renderStats,
  renderAgentMessage,
  renderMoonStrip,
  renderStarFieldLines,
} from "./renderer.js";

describe("renderTitle", () => {
  it("renders the gnhf eyebrow above the ASCII art", () => {
    const lines = renderTitle().map(stripAnsi);
    const eyebrowIdx = lines.findIndex((l) => l.includes("g n h f"));
    const artIdx = lines.findIndex((l) => l.includes("┏━╸┏━┓"));
    expect(eyebrowIdx).toBeGreaterThanOrEqual(0);
    expect(artIdx).toBeGreaterThan(eyebrowIdx);
  });

  it("renders all three lines of ASCII art", () => {
    const plain = renderTitle().map(stripAnsi).join("\n");
    expect(plain).toContain("┏━╸┏━┓┏━┓╺┳┓");
    expect(plain).toContain("┃╺┓┃ ┃┃ ┃ ┃┃");
    expect(plain).toContain("┗━┛┗━┛┗━┛╺┻┛");
  });
});

describe("renderStats", () => {
  it("renders elapsed, input tokens, and output tokens", () => {
    const line = stripAnsi(renderStats("01:23:45", 12400, 8200));
    expect(line).toContain("01:23:45");
    expect(line).toContain("12K");
    expect(line).toContain("8K");
  });

  it("does not contain iteration", () => {
    const line = stripAnsi(renderStats("00:00:00", 0, 0));
    expect(line).not.toContain("iteration");
  });
});

describe("renderAgentMessage", () => {
  it("shows working indicator when no message", () => {
    const plain = renderAgentMessage(null, "running")
      .map(stripAnsi)
      .join("\n");
    expect(plain).toContain("working...");
  });

  it("shows waiting status during backoff", () => {
    const plain = renderAgentMessage(null, "waiting")
      .map(stripAnsi)
      .join("\n");
    expect(plain).toContain("waiting");
  });

  it("renders a short message on one line", () => {
    const plain = renderAgentMessage("Reading file...", "running")
      .map(stripAnsi)
      .join("\n");
    expect(plain).toContain("Reading file...");
  });

  it("truncates messages longer than 3 lines with ellipsis", () => {
    const longMsg =
      "Line one of the message\nLine two of the message\nLine three of the message\nLine four should be cut";
    const plain = renderAgentMessage(longMsg, "running")
      .map(stripAnsi)
      .join("\n");
    expect(plain).toContain("Line one");
    expect(plain).toContain("Line two");
    expect(plain).toContain("\u2026");
    expect(plain).not.toContain("Line four");
  });
});

describe("renderMoonStrip", () => {
  it("renders full moons for successes and new moons for failures", () => {
    const iterations = [
      { success: true },
      { success: true },
      { success: false },
    ];
    const text = renderMoonStrip(iterations, false, Date.now()).join(
      "",
    );
    expect(text).toContain("\u{1F315}\u{1F315}\u{1F311}");
  });

  it("shows an animated moon when running", () => {
    const iterations = [{ success: true }];
    const text = renderMoonStrip(iterations, true, Date.now()).join("");
    expect(text).toContain("\u{1F315}");
    expect(text).toMatch(
      /[\u{1F311}\u{1F312}\u{1F313}\u{1F314}\u{1F315}\u{1F316}\u{1F317}\u{1F318}]/u,
    );
  });

  it("renders empty when no iterations and not running", () => {
    const text = renderMoonStrip([], false, Date.now()).join("");
    expect(text.trim()).toBe("");
  });

  it("shows only active moon when running with no completed iterations", () => {
    const text = renderMoonStrip([], true, Date.now()).join("");
    expect(text).toMatch(
      /[\u{1F311}\u{1F312}\u{1F313}\u{1F314}\u{1F315}\u{1F316}\u{1F317}\u{1F318}]/u,
    );
  });
});

describe("renderStarFieldLines", () => {
  it("renders the correct number of rows", () => {
    const lines = renderStarFieldLines(42, 40, 3, Date.now());
    expect(lines).toHaveLength(3);
  });

  it("contains star characters", () => {
    const text = renderStarFieldLines(42, 80, 5, Date.now())
      .map(stripAnsi)
      .join("\n");
    expect(/[·✧⋆°]/.test(text)).toBe(true);
  });
});
