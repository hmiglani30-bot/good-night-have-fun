export function buildIterationPrompt(params: {
  n: number;
  runId: string;
  prompt: string;
}): string {
  return `You are working autonomously on an objective given below.
This is iteration ${params.n} of an ongoing loop to fully accomplish the objective.

## Instructions

1. Read .gnhf/runs/${params.runId}/notes.md first to understand what has been done in previous iterations.
2. Focus on one smallest logical unit of work that's individually testable and would make incremental progress towards the objective. Do NOT try to do everything at once.
3. Run build/tests/linters/formatters if available to validate your work.
4. Do NOT make any git commits. Commits will be handled automatically by the gnhf orchestrator.
5. When you are done, respond with a JSON object according to the provided schema.

## Objective

${params.prompt}`;
}
