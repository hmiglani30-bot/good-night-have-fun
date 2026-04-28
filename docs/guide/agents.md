# Agents

gnhf is agent-agnostic. It supports five coding agents out of the box, and each one is invoked in non-interactive mode with a structured output schema.

## Supported Agents

| Agent | CLI Flag | Binary | Requirements |
| --- | --- | --- | --- |
| Claude Code | `--agent claude` | `claude` | Install Anthropic's Claude CLI and sign in |
| Codex | `--agent codex` | `codex` | Install OpenAI's Codex CLI and sign in |
| GitHub Copilot CLI | `--agent copilot` | `copilot` | Install GitHub Copilot CLI and sign in |
| Rovo Dev | `--agent rovodev` | `acli` | Install Atlassian's acli and authenticate with Rovo Dev |
| OpenCode | `--agent opencode` | `opencode` | Install opencode and configure a model provider |

## Claude Code

Claude Code is the default agent. gnhf invokes `claude` directly in non-interactive print mode with a JSON schema for structured output.

**Setup:**

```sh
# Install the Claude CLI
npm install -g @anthropic-ai/claude-code

# Sign in
claude auth login
```

**How gnhf uses it:**

- Runs in `-p` (print) mode with `--output-format json` and `--json-schema`
- After Claude emits a successful structured result, gnhf treats it as final and shuts down any lingering process tree after a short grace period
- Token usage (input, output, cache read, cache creation) is reported per iteration

**Custom args example:**

```yaml
agentArgsOverride:
  claude:
    - --model
    - claude-sonnet-4-20250514
```

## Codex

gnhf invokes `codex exec` in non-interactive mode with `--json` and `--output-schema`.

**Setup:**

```sh
# Install the Codex CLI
npm install -g @openai/codex

# Sign in
codex auth
```

**How gnhf uses it:**

- Uses Codex's strict mode output schema (all properties required when `additionalProperties: false`)
- Invoked with `--json` flag for structured output

**Custom args example:**

```yaml
agentArgsOverride:
  codex:
    - -m
    - gpt-5.4
    - -c
    - model_reasoning_effort="high"
    - --full-auto
```

## GitHub Copilot CLI

gnhf invokes `copilot` in non-interactive JSONL mode.

**Setup:**

```sh
# Install GitHub Copilot CLI
npm install -g @githubnext/github-copilot-cli

# Sign in
copilot auth login
```

**Note:** Copilot currently exposes assistant output tokens but not full input/cache token totals. Token tracking may be incomplete.

**Custom args example:**

```yaml
agentArgsOverride:
  copilot:
    - --model
    - gpt-5.4
```

## Rovo Dev

gnhf starts a local `acli rovodev serve` process automatically and communicates with it over HTTP.

**Setup:**

```sh
# Install Atlassian's acli
# (Follow Atlassian's documentation for your platform)

# Authenticate with Rovo Dev
acli auth login
```

**How gnhf uses it:**

- Starts `acli rovodev serve --disable-session-token <port>` automatically
- The `agentPathOverride` for rovodev must point to an acli-compatible binary

## OpenCode

gnhf starts a local `opencode serve` process and communicates with it over HTTP.

**Setup:**

```sh
# Install opencode
go install github.com/opencode-ai/opencode@latest

# Configure at least one model provider in opencode's config
```

**How gnhf uses it:**

- Starts `opencode serve --hostname 127.0.0.1 --port <port> --print-logs`
- Creates a per-run session
- Applies a blanket allow rule so tool calls do not block on prompts

## Custom Agent Paths

Use `agentPathOverride` in your config to point any agent at a custom binary:

```yaml
agentPathOverride:
  claude: ~/bin/claude-code-switch
  codex: /usr/local/bin/my-codex-wrapper
  copilot: ~/bin/copilot-wrapper
```

The override replaces only the binary name. All standard arguments are preserved, so the replacement must be CLI-compatible with the original agent. On Windows, `.cmd` and `.bat` wrappers are supported.

## Reserved Arguments

Each agent has a set of CLI flags that gnhf manages internally. These cannot be used in `agentArgsOverride` — gnhf will reject them during config loading with a clear error message. This prevents duplicate-argument conflicts.

For example, you cannot override `--output-format` for Claude or `--json` for Codex, because gnhf uses those flags to control structured output.
