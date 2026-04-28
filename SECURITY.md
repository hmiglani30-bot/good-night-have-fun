# Security Policy

## Supported Versions

gnhf is in active development. Security fixes are issued for:

- The latest minor release on `main`.
- The previous minor release for 30 days after a new minor ships.

Older releases do not receive security backports — please upgrade.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security reports.**

Instead:

1. Email `security@gnhf.dev` (or, until that mailbox is set up, send a private message to a maintainer listed in [MAINTAINERS.md](./MAINTAINERS.md)).
2. Include enough detail to reproduce the issue: gnhf version, OS, steps, and (if possible) a minimal proof of concept.
3. We will acknowledge receipt within 3 business days and aim to ship a fix within 30 days for high-severity issues.

You are welcome to request CVE credit for any reported vulnerability.

## Scope

In scope:

- The published `gnhf` npm package.
- The orchestrator's interaction with agent CLIs (process spawning, signal handling, environment exposure).
- The local filesystem state managed under `.gnhf/runs/` and `~/.gnhf/`.
- The `--auto-pr` flow and any third-party network calls (`--notify-webhook`, `--notify-slack`, opt-in telemetry).

Out of scope:

- Bugs in the agent CLIs themselves (Claude Code, Codex, etc.) — please report those upstream.
- Issues reproducible only by running gnhf with attacker-supplied configuration files combined with attacker-supplied agents.
- DoS by giving gnhf an arbitrarily large prompt or letting an agent run forever — this is the user's responsibility to bound via `--max-iterations` / `--max-tokens`.

## Hardening notes

- gnhf never reads `~/.ssh` or other ambient credentials directly. It does shell out to `git`, `gh`, and the configured agent binary, which inherit the user's environment.
- The `--auto-pr` flow uses the `gh` CLI's existing authentication. gnhf does not handle GitHub tokens.
- Webhook URLs passed via `--notify-webhook`/`--notify-slack` are sent the run summary verbatim. Treat them like any other outbound HTTP secret.
- Telemetry is **opt-in** and writes to `~/.gnhf/telemetry.jsonl` locally. There is no remote sink unless you wire one up yourself.
