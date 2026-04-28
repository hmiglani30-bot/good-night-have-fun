# gnhf Roadmap

This roadmap is a living document. Quarterly milestones are commitments; items inside a milestone may be re-ordered as we learn from users. File an issue if you want to see something here, or pick up an item you'd like to drive.

Status legend: planned, in-progress, shipped.

## v0.2 — Stability and Operability (Q2 2026)

Ship the foundations that production users need before we start layering on collaboration and cloud features.

- in-progress &middot; **Decompose the CLI entry point** into focused modules (parsers, prompt-handling, branch management, screen control). Reduce `src/cli.ts` to wiring only.
- shipped &middot; **Headless / CI mode** (`--headless`). Disables the TUI and emits structured JSONL events to stdout for use in CI runners and Docker.
- shipped &middot; **Checkpoint / restart** for long runs. Iteration counters, token totals, and notes are persisted on every iteration so a crashed or interrupted run can resume with `--resume`.
- shipped &middot; **Programmatic API**. `import { Orchestrator, createAgent, loadConfig } from "gnhf"` — embed gnhf in your own scripts and tools.
- shipped &middot; **Opt-in telemetry**. Local-only by default; `telemetry: true` in `~/.gnhf/config.yml` enables event capture for usage research. No data leaves the machine without explicit opt-in.
- planned &middot; **Pause, steer, resume**. File-based control plane lets you pause a running session, inject additional context, or abort cleanly without killing the process.
- planned &middot; **Completion notifications**. Slack / webhook / email targets via `--notify`, configurable per-run.
- planned &middot; **Auto-PR on success**. `--auto-pr` opens a pull request via the `gh` CLI with an AI-generated summary derived from the iteration log.

## v0.3 — Reach and Adoption (Q3 2026)

Make gnhf easier to discover, easier to onboard onto, and easier to use day-to-day.

- shipped &middot; **Onboarding tutorial** (`gnhf init`). Interactive setup that writes `~/.gnhf/config.yml`, validates the chosen agent binary, and links to next steps.
- planned &middot; **Interactive objective wizard** (`gnhf wizard`). Helps users specify well-formed objectives — scope, success criteria, constraints — before launching a run.
- shipped &middot; **Run history and comparison**. `gnhf history` lists recent runs; `gnhf compare <a> <b>` puts two runs side by side to measure prompt effectiveness.
- shipped &middot; **Usage analytics and cost tracking**. `gnhf stats` aggregates per-agent token spend and estimated USD cost across runs.
- shipped &middot; **Documentation site** (VitePress). Hosted at gnhf.dev with getting-started, configuration, agents, and advanced guides.
- planned &middot; **Landing page**. Marketing surface for the docs site with live demo GIF, social proof, and quick-start CTA.
- planned &middot; **Contributor guide and governance**. `CONTRIBUTING.md` extension, `CODE_OF_CONDUCT.md`, PR template, feature request template, public roadmap (this file).

## v0.4 — Strategic Positioning (Q4 2026)

Frame gnhf as the orchestration layer for autonomous coding agents — not just a single tool, but the layer everyone standardizes on.

- in-progress &middot; **Strategic repositioning**. Update `README.md` and the docs site to lead with "the universal orchestration layer for autonomous coding agents." See `POSITIONING.md`.
- planned &middot; **Strategic partnerships**. Formal relationships with Anthropic, OpenAI, GitHub, Atlassian, OpenCode. See `PARTNERSHIPS.md`.
- planned &middot; **Business model validation**. Pilot the open-core / Pro / Enterprise tiers described in `BUSINESS_MODEL.md`.
- planned &middot; **Architecture decision records** (`docs/adr/`). Capture key decisions (agent adapter pattern, file-based steering, opt-in telemetry posture) so future contributors and forks understand the why.

## v1.0 and beyond — Platform (2027)

The XL items intentionally deferred from earlier milestones. These require dedicated funding or partnership commitments before they make sense.

- planned &middot; **Web dashboard for run monitoring** (XL). Lightweight self-hosted or hosted UI for live iteration progress, history, and diffs.
- planned &middot; **IDE extension** (XL). VS Code and JetBrains wrappers around the gnhf CLI with a GUI for objective input, branch management, and run review.
- planned &middot; **Team / multi-user features** (XL). Shared objectives, team-visible run history, role-based access. Cloud component required.
- planned &middot; **Agent marketplace / plugin system** (XL). User-contributed agent configurations, prompt templates, and custom adapters.
- planned &middot; **Enterprise feature set** (XL). SSO (SAML/OIDC), audit logging, policy controls (max tokens per run, allowed agents, allowed repos).
- planned &middot; **Formal security audit** (XL). Third-party review of the agent execution model, sandboxing improvements, signed releases.

## How to influence this roadmap

- Open an issue describing the use case and what success looks like.
- Comment on an existing issue to add weight or new context.
- Pick up a `planned` item and open a PR — see `CONTRIBUTING.md`.
- For paid sponsorship of a specific item, reach out via Discord.
