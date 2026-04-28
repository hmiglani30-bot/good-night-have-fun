import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import yaml from "js-yaml";

export interface TelemetryEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
}

const CONFIG_DIR = join(homedir(), ".gnhf");
const CONFIG_PATH = join(CONFIG_DIR, "config.yml");
const TELEMETRY_FILE = "telemetry.jsonl";

/**
 * Check whether telemetry is enabled in the user's config.
 * Telemetry is opt-in: the config must explicitly contain `telemetry: true`.
 */
export function isTelemetryEnabled(): boolean {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const config = yaml.load(raw) as Record<string, unknown> | null;
    return config?.telemetry === true;
  } catch {
    return false;
  }
}

/**
 * Generate a random session ID for grouping telemetry events from one CLI invocation.
 */
export function getTelemetrySessionId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Record a telemetry event.
 *
 * Currently writes to `~/.gnhf/telemetry.jsonl` (local-only).
 * A future version may send events to a remote endpoint if the user opts in,
 * but for now all data stays on disk and can be inspected or deleted at any time.
 */
export function trackEvent(event: TelemetryEvent): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    const filePath = join(CONFIG_DIR, TELEMETRY_FILE);
    appendFileSync(filePath, JSON.stringify(event) + "\n", "utf-8");
  } catch {
    // Telemetry is best-effort; never interfere with the main workflow
  }
}
