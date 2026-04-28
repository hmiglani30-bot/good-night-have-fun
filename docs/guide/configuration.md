# Configuration

gnhf is configured through a YAML file at `~/.gnhf/config.yml`. If the file does not exist, gnhf creates it with sensible defaults on first run. You can also run `gnhf init` for an interactive setup wizard.

## Config File Location

```
~/.gnhf/config.yml
```

## Full Reference

```yaml
# Agent to use by default (claude, codex, rovodev, opencode, or copilot)
agent: claude

# Custom paths to agent binaries (optional)
# Paths may be absolute, bare executable names on PATH,
# ~-prefixed, or relative to the config directory (~/.gnhf/).
agentPathOverride:
  claude: /path/to/custom-claude
  codex: /path/to/custom-codex
  copilot: /path/to/custom-copilot

# Per-agent CLI arg overrides (optional)
agentArgsOverride:
  codex:
    - -m
    - gpt-5.4
    - -c
    - model_reasoning_effort="high"
    - --full-auto
  copilot:
    - --model
    - gpt-5.4

# Abort after this many consecutive failures
maxConsecutiveFailures: 3

# Prevent the machine from sleeping during a run
preventSleep: true

# Enable anonymous local telemetry (opt-in, local-only)
telemetry: false
```

## Options

### `agent`

**Type:** `string`
**Default:** `"claude"`
**Values:** `claude`, `codex`, `rovodev`, `opencode`, `copilot`

The default agent to use when `--agent` is not specified on the command line.

### `agentPathOverride`

**Type:** `object` (mapping of agent name to file path)
**Default:** `{}`

Override the binary path for any agent. Useful for wrappers like Claude Code Switch or custom Codex builds. The override replaces only the binary name; all standard arguments are preserved, so the replacement must be CLI-compatible with the original agent.

Path resolution rules:
- Absolute paths are used as-is
- Bare executable names (no `/` or `\`) are looked up on `PATH`
- `~`-prefixed paths expand to the user's home directory
- Relative paths resolve against the config directory (`~/.gnhf/`)

### `agentArgsOverride`

**Type:** `object` (mapping of agent name to array of strings)
**Default:** `{}`

Pass through extra CLI flags for any supported agent. Use this for agent-specific options like models, profiles, or reasoning settings.

**Important:** Flags that gnhf manages internally for a given agent (such as output format or local server startup flags) are rejected during config loading. This prevents duplicate-argument ambiguity.

For `codex`, `claude`, and `copilot`, gnhf adds its usual non-interactive permission default only when you do not provide your own permission or execution-mode flag.

### `maxConsecutiveFailures`

**Type:** `number`
**Default:** `3`

After this many consecutive iteration failures, gnhf aborts the run. Agent-reported failures (the agent ran but reported `success: false`) count toward this limit. Hard agent errors (crashes, timeouts) also count but use exponential backoff between retries.

### `preventSleep`

**Type:** `boolean`
**Default:** `true`

When enabled, gnhf prevents the operating system from sleeping during a run:
- **macOS:** Uses `caffeinate`
- **Linux:** Uses `systemd-inhibit`
- **Windows:** Uses a PowerShell helper backed by `SetThreadExecutionState`

### `telemetry`

**Type:** `boolean`
**Default:** `false`

When set to `true`, gnhf records anonymous usage events to `~/.gnhf/telemetry.jsonl`. All data stays local. This is strictly opt-in.

## CLI Flag Overrides

CLI flags always take precedence over config file values:

| Flag | Overrides |
| --- | --- |
| `--agent <agent>` | `agent` |
| `--prevent-sleep <on\|off>` | `preventSleep` |
| `--max-iterations <n>` | Runtime-only (not in config) |
| `--max-tokens <n>` | Runtime-only (not in config) |
| `--stop-when <condition>` | Runtime-only (not in config) |
| `--worktree` | Runtime-only (not in config) |

## Run Metadata

Each run stores its metadata under `.gnhf/runs/<run-id>/` in the repository:

```
.gnhf/runs/<run-id>/
  prompt.md          # The objective for this run
  notes.md           # Accumulated learnings across iterations
  gnhf.log           # JSONL debug log
  iteration-*.jsonl  # Per-iteration agent output streams
```

This directory is git-ignored, so only intentional code changes appear on the branch.
