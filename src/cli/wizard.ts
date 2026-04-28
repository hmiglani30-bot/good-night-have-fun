import { createInterface } from "node:readline";

interface WizardAnswers {
  intent: string;
  scope: string;
  successCriteria: string;
  constraints: string;
  outOfScope: string;
}

const TEMPLATES: Array<{
  key: string;
  label: string;
  description: string;
  prompt: (a: WizardAnswers) => string;
}> = [
  {
    key: "1",
    label: "Refactor",
    description: "Reduce complexity / improve a module without behaviour change",
    prompt: (a) =>
      [
        `Refactor ${a.scope}.`,
        ``,
        `Goal: ${a.intent}`,
        `Done when: ${a.successCriteria}`,
        a.constraints ? `Constraints: ${a.constraints}` : "",
        a.outOfScope ? `Out of scope: ${a.outOfScope}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  {
    key: "2",
    label: "Add tests",
    description: "Increase coverage on a module or behaviour",
    prompt: (a) =>
      [
        `Add tests for ${a.scope}.`,
        ``,
        `What to cover: ${a.intent}`,
        `Done when: ${a.successCriteria}`,
        a.constraints ? `Constraints: ${a.constraints}` : "",
        a.outOfScope ? `Out of scope: ${a.outOfScope}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  {
    key: "3",
    label: "Bug fix",
    description: "Track down and fix a specific reproducible bug",
    prompt: (a) =>
      [
        `Fix the following bug.`,
        ``,
        `Symptom: ${a.intent}`,
        `Where it lives: ${a.scope}`,
        `Done when: ${a.successCriteria}`,
        a.constraints ? `Constraints: ${a.constraints}` : "",
        a.outOfScope ? `Out of scope: ${a.outOfScope}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  {
    key: "4",
    label: "Dependency upgrade",
    description: "Bump a dependency and update call sites",
    prompt: (a) =>
      [
        `Upgrade ${a.scope}.`,
        ``,
        `Target: ${a.intent}`,
        `Done when: ${a.successCriteria}`,
        a.constraints ? `Constraints: ${a.constraints}` : "",
        a.outOfScope ? `Out of scope: ${a.outOfScope}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
  },
  {
    key: "5",
    label: "Custom",
    description: "Write a free-form objective with the standard structure",
    prompt: (a) =>
      [
        a.intent,
        ``,
        `Scope: ${a.scope}`,
        `Done when: ${a.successCriteria}`,
        a.constraints ? `Constraints: ${a.constraints}` : "",
        a.outOfScope ? `Out of scope: ${a.outOfScope}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
  },
];

function ask(
  rl: ReturnType<typeof createInterface>,
  question: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

export async function runWizard(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  try {
    process.stderr.write("\n  gnhf objective wizard\n");
    process.stderr.write("  =====================\n\n");
    process.stderr.write("  Pick a template:\n\n");
    for (const t of TEMPLATES) {
      process.stderr.write(`    ${t.key}. ${t.label} — ${t.description}\n`);
    }
    process.stderr.write("\n");

    let template = TEMPLATES[TEMPLATES.length - 1]!;
    const choice = await ask(rl, "  Template [1-5, default 5]: ");
    if (choice) {
      const match = TEMPLATES.find((t) => t.key === choice);
      if (match) template = match;
    }

    process.stderr.write(`\n  Selected: ${template.label}\n\n`);

    const intent = await ask(
      rl,
      "  In one sentence, what do you want done?\n  > ",
    );
    if (!intent) {
      throw new Error("Wizard cancelled: an intent is required");
    }

    const scope = await ask(
      rl,
      "  Which files/modules/areas does this touch?\n  > ",
    );
    const successCriteria = await ask(
      rl,
      "  How will you know it's done? (tests pass, X file shrinks, etc.)\n  > ",
    );
    const constraints = await ask(
      rl,
      "  Any constraints? (no behaviour change, keep public API, etc.)\n  > ",
    );
    const outOfScope = await ask(
      rl,
      "  Anything explicitly out of scope?\n  > ",
    );

    const answers: WizardAnswers = {
      intent,
      scope: scope || "the codebase",
      successCriteria: successCriteria || "the agent reports the objective is met",
      constraints,
      outOfScope,
    };

    const prompt = template.prompt(answers);

    process.stderr.write("\n  Generated objective:\n");
    process.stderr.write("  --------------------\n");
    for (const line of prompt.split("\n")) {
      process.stderr.write(`  ${line}\n`);
    }
    process.stderr.write("\n");

    const confirm = await ask(rl, "  Use this objective? (Y/n): ");
    if (confirm.toLowerCase() === "n") {
      throw new Error("Wizard cancelled by user");
    }

    return prompt;
  } finally {
    rl.close();
  }
}
