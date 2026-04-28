import { InvalidArgumentError } from "commander";
import { AGENT_NAMES, type AgentName } from "../core/config.js";

export const AGENT_NAME_SET = new Set<string>(AGENT_NAMES);
export const AGENT_NAME_LIST = `"${AGENT_NAMES.slice(0, -1).join('", "')}", or "${
  AGENT_NAMES[AGENT_NAMES.length - 1]
}"`;

export function parseNonNegativeInteger(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new InvalidArgumentError("must be a non-negative integer");
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed)) {
    throw new InvalidArgumentError("must be a safe integer");
  }

  return parsed;
}

export function parseOnOffBoolean(value: string): boolean {
  if (value === "on" || value === "true") return true;
  if (value === "off" || value === "false") return false;
  throw new InvalidArgumentError(
    'must be one of: "on", "off", "true", "false"',
  );
}

export function isAgentName(name: string): name is AgentName {
  return AGENT_NAME_SET.has(name);
}
