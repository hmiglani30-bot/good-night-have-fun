# Getting Started

## Prerequisites

- **Node.js 20+** — gnhf is distributed as an npm package
- **Git** — your project must be a git repository with a clean working tree
- **At least one supported agent** installed and authenticated (see [Agents](./agents))

## Installation

### npm (recommended)

```sh
npm install -g gnhf
```

### From source

```sh
git clone https://github.com/kunchenguid/gnhf.git
cd gnhf
npm install
npm run build
npm link
```

## First Run

### Interactive setup

Run the setup wizard to configure gnhf for the first time:

```sh
gnhf init
```

This walks you through selecting an agent, validating it is installed, and setting your preferences. It writes a config file to `~/.gnhf/config.yml`.

### Quick start

If you prefer to skip the wizard, just run gnhf directly — it will create a default config automatically:

```sh
cd your-git-repo
gnhf "your objective here"
```

gnhf will:

1. Validate you have a clean git working tree
2. Create a `gnhf/<slug>` branch from your current HEAD
3. Start iterating — invoking your agent with a structured prompt each round
4. Commit successful iterations, roll back failures
5. Continue until you press Ctrl+C or a runtime cap is reached

## Basic Usage

### Simple run

```sh
gnhf "reduce complexity of the codebase without changing functionality"
```

### With runtime caps

```sh
gnhf "add comprehensive test coverage" \
    --max-iterations 10 \
    --max-tokens 5000000
```

### With a stop condition

```sh
gnhf "fix all TypeScript strict mode errors" \
    --stop-when "no more TypeScript errors remain"
```

### Pipe a prompt from a file

```sh
cat prd.md | gnhf
```

### Use a specific agent

```sh
gnhf "refactor the auth module" --agent codex
```

## What Happens During a Run

Each iteration:

1. gnhf builds a prompt that includes your objective, a structured output schema, and notes from previous iterations
2. The agent runs in non-interactive mode and produces a JSON result
3. If the agent reports success, gnhf commits the changes and appends a summary to `notes.md`
4. If the agent reports failure, gnhf rolls back with `git reset --hard`
5. After 3 consecutive failures (configurable), gnhf aborts

All run metadata (prompt, notes, debug logs) is stored under `.gnhf/runs/<run-id>/` and git-ignored, so your branch only contains intentional work.

## Resuming a Run

If gnhf is interrupted, just run it again while on the same `gnhf/` branch:

```sh
gnhf
```

It picks up where the previous run left off, preserving the iteration history and notes.

## Checking Usage

After runs complete, you can review cumulative usage statistics:

```sh
gnhf stats
```

This shows total tokens consumed, estimated costs, and per-agent breakdowns across all your runs.

## Next Steps

- [Configuration](./configuration) — learn about all config options
- [Agents](./agents) — supported agents and how to configure each one
- [Advanced Usage](./advanced) — worktrees, stop conditions, programmatic API
