# Contributing to gnhf

Thanks for wanting to contribute! This guide covers everything you need to know to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [The no-mistakes Requirement](#the-no-mistakes-requirement)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Architecture Decisions](#architecture-decisions)
- [Project Governance](#project-governance)
- [Getting Help](#getting-help)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

## The no-mistakes Requirement

**Human-authored pull requests targeting `main` must be raised through [`no-mistakes`](https://github.com/kunchenguid/no-mistakes).**

`no-mistakes` puts a local git proxy in front of your real remote. Pushing through it runs an AI-driven review/test/lint pipeline in an isolated worktree, forwards the push upstream only after every check passes, and opens a clean PR automatically.

A GitHub Actions check (`Require no-mistakes`) runs on PRs targeting `main` and fails if the body is missing the deterministic signature that no-mistakes writes. The release and dependency bots are exempt so their automation keeps working, but regular contributor PRs without the signature will not be reviewed or merged.

## Development Setup

### Prerequisites

- **Node.js 20+** (check with `node --version`)
- **npm** (bundled with Node.js)
- **Git**
- **no-mistakes** (for submitting PRs)

### Getting started

```sh
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/gnhf.git
cd gnhf

# Install dependencies
npm install

# Build the project
npm run build

# Run the test suite
npm test

# Link the CLI for local testing
npm link
```

### Recommended editor setup

The project includes an `.editorconfig` and `.prettierrc` for consistent formatting. If you use VS Code, install the EditorConfig and Prettier extensions for automatic formatting on save.

## Project Structure

```
gnhf/
├── src/
│   ├── cli.ts                    # CLI entry point (commander setup)
│   ├── cli/                      # CLI subcommands
│   │   └── init.ts               # gnhf init wizard
│   ├── core/
│   │   ├── agents/               # Agent implementations
│   │   │   ├── types.ts          # Agent interface and schemas
│   │   │   ├── factory.ts        # Agent creation factory
│   │   │   ├── claude.ts         # Claude Code agent
│   │   │   ├── codex.ts          # Codex agent
│   │   │   ├── copilot.ts        # Copilot agent
│   │   │   ├── opencode.ts       # OpenCode agent
│   │   │   ├── rovodev.ts        # Rovo Dev agent
│   │   │   ├── managed-process.ts # Shared process management
│   │   │   └── stream-utils.ts   # Streaming utilities
│   │   ├── analytics.ts          # Usage statistics and cost tracking
│   │   ├── config.ts             # Config file loading and validation
│   │   ├── debug-log.ts          # JSONL debug logging
│   │   ├── git.ts                # Git operations
│   │   ├── orchestrator.ts       # Main iteration loop
│   │   ├── run.ts                # Run metadata management
│   │   ├── sleep.ts              # Sleep prevention
│   │   ├── stdin.ts              # Stdin reading utilities
│   │   └── telemetry.ts          # Opt-in telemetry
│   ├── templates/
│   │   └── iteration-prompt.ts   # Prompt template builder
│   ├── utils/                    # Shared utilities
│   ├── renderer.ts               # TUI renderer
│   ├── renderer-diff.ts          # Diff rendering
│   └── mock-orchestrator.ts      # Mock for --mock mode
├── docs/                         # VitePress documentation site
├── test/                         # End-to-end tests
├── CONTRIBUTING.md               # This file
├── CODE_OF_CONDUCT.md            # Contributor Covenant
└── ROADMAP.md                    # Project roadmap
```

## Development Workflow

### Build commands

```sh
npm run build          # Build with tsdown
npm run dev            # Watch mode (rebuilds on changes)
npm run start          # Run the built CLI
```

### Development cycle

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run the full check suite locally (see below)
4. Commit following conventional commit conventions
5. Push through `no-mistakes`

### Running checks locally

Before pushing, run the full suite:

```sh
npm run lint           # ESLint
npm run format:check   # Prettier format check
npm run typecheck      # TypeScript type checking
npm test               # Build + unit tests (Vitest)
npm run test:e2e       # Build + end-to-end tests
```

The `no-mistakes` pipeline will run all of these again, but a fast local pass saves time.

## Testing

### Philosophy

- Use **TDD** for bug fixes and new features
- Tests are **co-located** as `*.test.ts` next to their source files
- End-to-end tests live in `test/`

### Running tests

```sh
# Run all unit tests
npm test

# Run tests in watch mode (during development)
npx vitest

# Run a specific test file
npx vitest run src/core/config.test.ts

# Run end-to-end tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Writing tests

- Place unit tests next to the module: `foo.ts` -> `foo.test.ts`
- Use Vitest's `describe`/`it`/`expect` API
- Mock filesystem and child processes where needed
- Test both success and failure paths

Example:

```ts
import { describe, it, expect } from "vitest";
import { calculateCost } from "./analytics.js";

describe("calculateCost", () => {
  it("calculates cost for claude agent", () => {
    const cost = calculateCost(1_000_000, 1_000_000, "claude");
    expect(cost).toBe(18); // $3 input + $15 output
  });
});
```

## Code Style

### TypeScript

- **ESM-only** — all imports use `.js` extensions
- **Strict mode** — no `any` types without justification
- **Node 20+ APIs** — use modern Node.js APIs
- Formatting is handled by **Prettier** (see `.prettierrc`)
- Linting is handled by **ESLint** (see `eslint.config.js`)

### Naming conventions

- Files: `kebab-case.ts`
- Interfaces/Types: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for derived values

### Imports

Always use ESM imports with `.js` extensions:

```ts
// Correct
import { loadConfig } from "./core/config.js";

// Wrong
import { loadConfig } from "./core/config";
```

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic changelog generation via release-please.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
| --- | --- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Maintenance tasks, dependency updates |
| `ci` | CI/CD changes |

### Examples

```
feat: add usage analytics and cost tracking
fix: handle missing config file gracefully on first run
docs: add configuration guide to docs site
refactor(orchestrator): extract iteration loop into separate method
test: add unit tests for analytics module
```

### Breaking changes

Use `!` after the type or add a `BREAKING CHANGE:` footer:

```
feat!: rename --max-retries to --max-iterations

BREAKING CHANGE: The --max-retries flag has been renamed to --max-iterations
for clarity. Update any scripts using the old flag name.
```

**Important:** Do not hand-edit `CHANGELOG.md` or `.release-please-manifest.json`. They are managed by release-please.

## Pull Request Process

1. **Fork and branch** — create a feature branch from `main`
2. **Develop** — write code and tests following the guidelines above
3. **Local checks** — run lint, format, typecheck, and tests
4. **Initialize no-mistakes** — run `no-mistakes init` once per repo clone
5. **Push through the gate** — `git push no-mistakes`
6. **Monitor the pipeline** — run `no-mistakes` to watch the AI review
7. **Automatic PR** — once the pipeline passes, it opens a PR for you

See the [no-mistakes quick start](https://kunchenguid.github.io/no-mistakes/start-here/quick-start/) for the full first-run walkthrough.

### PR expectations

- Each PR should focus on a single concern
- Include tests for new functionality
- Update documentation if behavior changes
- Keep commits clean and following conventional commit format

## Architecture Decisions

Significant architectural decisions are recorded as Architecture Decision Records (ADRs) in `docs/adr/`. See [ADR-0001](./docs/adr/0001-record-architecture-decisions.md) for the ADR process itself.

When proposing a significant change, consider writing an ADR as part of your PR.

## Project Governance

gnhf is an open-source project run as a benevolent-dictator-with-a-paper-trail. This section is the paper trail.

### Roles

- **Maintainers** — currently [@kunchenguid](https://github.com/kunchenguid). Maintainers have merge rights and own the technical roadmap. They are nominated and confirmed by the existing maintainer set; the maintainer roster is recorded in [`MAINTAINERS.md`](./MAINTAINERS.md).
- **Triagers** — long-time contributors who have demonstrated good judgement on issues. Triagers can label, close, and route issues, but cannot merge. They are appointed by maintainers and listed in `MAINTAINERS.md` under "Triagers".
- **Contributors** — anyone who has had a PR merged. Listed in [`CONTRIBUTORS.md`](./CONTRIBUTORS.md), generated automatically from git history.

### Decision-making

1. **Lazy consensus** is the default for everyday changes. A PR with a single maintainer approval and a passing CI run can merge after 24 hours if no objections are raised.
2. **Lightweight RFC** for changes that touch the public CLI surface, config schema, or agent contract. Open an issue with the `rfc:` prefix, link it from the PR, and wait at least 7 days for community feedback before merging.
3. **ADR** for cross-cutting architectural decisions (see above). One maintainer plus one triager approval is required to merge an ADR.
4. **Governance changes** require unanimous maintainer approval and a 14-day comment period on a PR labelled `governance`.

### Stable surface and deprecation policy

The following are part of the stable public surface:

- The `gnhf` binary entrypoint and any subcommands documented in the `README.md`.
- All flags listed in `gnhf --help` for stable commands.
- The `~/.gnhf/config.yml` keys documented in [docs/guide/configuration](./docs/guide/configuration.md).
- The programmatic API exported from `src/index.ts` (re-exported as the `gnhf` package's main entry).

Removing or breaking any of the above requires:

1. A deprecation notice published in the next minor release, including a migration path.
2. At least one minor release of overlap during which both the old and new behaviour work.
3. A `BREAKING CHANGE:` commit footer when the deprecated surface is finally removed in a major version bump.

### Releases

Releases are cut from `main` by [release-please](https://github.com/googleapis/release-please) on every merge. Maintainers do not hand-tag; the release PR is reviewed and merged like any other PR. Patch releases are continuous, minor releases bundle deprecations, and majors bundle the actual removals.

### Conflict resolution

If reasonable contributors cannot reach consensus on a PR or RFC:

1. The maintainer assigned to the area writes a short decision note in the issue or PR.
2. If the disagreement persists, escalate to the full maintainer set; majority rules.
3. The decision and its reasoning are recorded as an ADR if the topic is broad enough to come up again.

### Code of conduct enforcement

CoC reports go to conduct@gnhf.dev (or, until that mailbox is set up, by emailing any maintainer listed in `MAINTAINERS.md`). Reports are handled in confidence by at least two maintainers. Outcomes range from a private warning to a permanent ban; the rationale is recorded privately and a redacted summary is published if the project's reputation requires it.

### Funding and dependencies

gnhf does not currently accept paid contributions in exchange for roadmap influence. Maintainers may take on paid work elsewhere; if that work overlaps with gnhf they must disclose the relationship in PR descriptions and recuse themselves from related governance votes.

A separate [`BUSINESS_MODEL.md`](./BUSINESS_MODEL.md) describes the proposed open-core commercial layer. The OSS project's governance does not depend on that commercial layer existing or succeeding.

## Getting Help

- **Issues** — open an issue on GitHub for bugs or feature requests
- **Discord** — join the [gnhf Discord](https://discord.gg/Wsy2NpnZDu) for discussion
- **X/Twitter** — reach out to [@kunchenguid](https://x.com/kunchenguid)
