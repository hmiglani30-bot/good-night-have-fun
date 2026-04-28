---
layout: home

hero:
  name: gnhf
  text: Good Night, Have Fun
  tagline: An agent-agnostic orchestrator that keeps your coding agents running while you sleep. Wake up to a branch full of clean, committed work.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/kunchenguid/gnhf

features:
  - title: Dead Simple
    details: One command starts an autonomous loop that runs until you Ctrl+C or a configured runtime cap is reached. No complicated setup required.
    icon: ">"
  - title: Agent-Agnostic
    details: Works with Claude Code, Codex, Rovo Dev, OpenCode, or GitHub Copilot CLI out of the box. Switch agents with a single flag.
    icon: "*"
  - title: Long Running
    details: Each iteration is committed on success, rolled back on failure, with sensible retries and exponential backoff for hard errors.
    icon: "~"
  - title: Parallel Worktrees
    details: Run multiple agents on the same repo simultaneously using git worktrees — each gets its own isolated working directory and branch.
    icon: "&"
---

## How It Works

gnhf creates a dedicated branch, then enters a loop:

1. **Build an iteration prompt** with context from previous iterations
2. **Invoke your agent** in non-interactive mode
3. **On success** — commit the changes, append learnings to shared notes
4. **On failure** — roll back with `git reset --hard`, optionally retry
5. **Repeat** until you stop it, or a configured limit is reached

Every successful iteration produces a clean git commit. You wake up to a branch you can review, cherry-pick, or merge.

## Quick Start

```sh
npm install -g gnhf
cd your-repo
gnhf "reduce complexity of the codebase without changing functionality"
# go to sleep
```

[Read the full guide](/guide/getting-started) to learn more.
