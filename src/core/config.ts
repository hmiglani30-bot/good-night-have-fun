import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import yaml from "js-yaml";

export interface Config {
  agent: "claude" | "codex";
  maxConsecutiveFailures: number;
}

const DEFAULT_CONFIG: Config = {
  agent: "claude",
  maxConsecutiveFailures: 5,
};

export function loadConfig(overrides?: Partial<Config>): Config {
  const configPath = join(homedir(), ".gnhf", "config.yml");
  let fileConfig: Partial<Config> = {};

  try {
    const raw = readFileSync(configPath, "utf-8");
    fileConfig = (yaml.load(raw) as Partial<Config>) ?? {};
  } catch {
    // Config file doesn't exist or is invalid -- use defaults
  }

  return { ...DEFAULT_CONFIG, ...fileConfig, ...overrides };
}
