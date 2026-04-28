# Advanced Usage

## Worktree Mode

Pass `--worktree` to run each agent in an isolated [git worktree](https://git-scm.com/docs/git-worktree). This lets you launch multiple agents on the same repo simultaneously.

```sh
gnhf --worktree "implement feature X" &
gnhf --worktree "add tests for module Y" &
gnhf --worktree "refactor the API layer" &
```

### How it works

Each worktree run creates a new directory adjacent to your repository:

```
<repo>/                              <- your repo (unchanged)
<repo>-gnhf-worktrees/
  ├── <run-slug-1>/                  <- worktree for agent 1
  └── <run-slug-2>/                  <- worktree for agent 2
```

### Cleanup behavior

- Worktrees **with commits** are preserved after the run so you can review, merge, or cherry-pick. gnhf prints the path and a cleanup command.
- Worktrees **without commits** are automatically removed on exit.
- `--worktree` must be run from a non-gnhf branch (typically `main`).

### Merging worktree results

After a worktree run with commits:

```sh
# Review what the agent did
cd <repo>-gnhf-worktrees/<run-slug>
git log --oneline

# Merge into main
cd <repo>
git merge gnhf/<run-slug>

# Clean up the worktree
git worktree remove "<repo>-gnhf-worktrees/<run-slug>"
```

## Stop Conditions

The `--stop-when` flag lets you define a natural-language condition. After each iteration, gnhf asks the agent whether the condition is met. If the agent reports `should_fully_stop: true`, gnhf ends the loop.

```sh
gnhf "fix all lint errors" --stop-when "no lint errors remain"
```

This is useful for bounded tasks where you want gnhf to stop once the objective is achieved, rather than running until a token or iteration cap.

## Runtime Caps

### Iteration cap

```sh
gnhf "improve performance" --max-iterations 5
```

gnhf checks the cap **before** starting each iteration. If the limit is reached, it stops cleanly — no partial iteration is left behind.

### Token cap

```sh
gnhf "write documentation" --max-tokens 2000000
```

The token cap can abort **mid-iteration** once reported usage reaches the limit. Uncommitted work from the interrupted iteration is rolled back.

### Combining caps

```sh
gnhf "refactor auth module" \
    --max-iterations 10 \
    --max-tokens 5000000 \
    --stop-when "all auth tests pass"
```

The run ends when **any** of the three conditions is met first.

## Piping Prompts

gnhf reads from stdin when no prompt argument is provided:

```sh
echo "add error handling to all API endpoints" | gnhf
```

This works well with files:

```sh
cat prd.md | gnhf
```

Or command substitution:

```sh
gnhf "$(cat objectives.txt)"
```

When the prompt comes from stdin and sleep prevention triggers a re-exec, gnhf persists the prompt in a temporary file so it survives the process boundary.

## Resume Support

If a run is interrupted (Ctrl+C, crash, power loss), resume it by running gnhf again while on the same branch:

```sh
# You're still on gnhf/reduce-complexity-of-the-codebase
gnhf
```

gnhf detects the existing run, loads the saved prompt and notes, and continues from the last completed iteration.

If you provide a **different** prompt while on an existing gnhf branch, gnhf offers three choices:

1. **Update** the prompt and continue the existing run history
2. **Start** a new branch on top of the current one
3. **Quit**

## Debug Logs

Every run writes a JSONL debug log to `.gnhf/runs/<runId>/gnhf.log`. It captures:

- Orchestrator lifecycle events
- Agent start/stop events
- HTTP request timings (for server-based agents)
- Error cause chains (the full `error.cause` tree)
- Token usage snapshots

This is the single most useful artifact for diagnosing problems. When filing an issue, include a snippet of `gnhf.log`.

## Usage Analytics

After each run, gnhf records statistics to `~/.gnhf/stats.jsonl`. View them with:

```sh
gnhf stats
```

This shows:
- Total runs, iterations, and success/failure counts
- Token consumption and estimated costs per agent
- Recent run history

## Programmatic Usage

gnhf is distributed as an npm package. While it is primarily a CLI tool, you can import its core modules:

```ts
import { loadConfig } from "gnhf/core/config";
import { Orchestrator } from "gnhf/core/orchestrator";
import { createAgent } from "gnhf/core/agents/factory";
```

Note that the programmatic API is not yet formally stabilized and may change between minor versions.
