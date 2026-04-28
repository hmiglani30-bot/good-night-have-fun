import {
  closeSync,
  createReadStream,
  createWriteStream,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline";

export const GNHF_REEXEC_STDIN_PROMPT = "GNHF_REEXEC_STDIN_PROMPT";
export const GNHF_REEXEC_STDIN_PROMPT_FILE = "GNHF_REEXEC_STDIN_PROMPT_FILE";
export const GNHF_REEXEC_STDIN_PROMPT_DIR_PREFIX = "gnhf-stdin-";
export const GNHF_REEXEC_STDIN_PROMPT_FILENAME = "prompt.txt";

export class PromptSignalError extends Error {
  constructor(public readonly signal: NodeJS.Signals) {
    super(signal);
  }
}

export function openPromptTerminal(): {
  input: NodeJS.ReadableStream;
  output: NodeJS.WritableStream;
  cleanup: () => void;
} {
  if (process.stdin.isTTY) {
    return {
      input: process.stdin,
      output: process.stderr,
      cleanup: () => {},
    };
  }

  const inputPath = process.platform === "win32" ? "CONIN$" : "/dev/tty";
  const outputPath = process.platform === "win32" ? "CONOUT$" : "/dev/tty";
  const inputFd = openSync(inputPath, "r");
  try {
    const outputFd = openSync(outputPath, "w");
    try {
      const input = createReadStream("", { autoClose: true, fd: inputFd });
      const output = createWriteStream("", { autoClose: true, fd: outputFd });
      return {
        input,
        output,
        cleanup: () => {
          input.destroy();
          output.destroy();
        },
      };
    } catch (error) {
      closeSync(outputFd);
      throw error;
    }
  } catch (error) {
    closeSync(inputFd);
    throw error;
  }
}

export function ask(
  question: string,
  closeMessage: string,
  unavailableMessage: string,
): Promise<string> {
  let terminal;
  try {
    terminal = openPromptTerminal();
  } catch {
    throw new Error(unavailableMessage);
  }

  const rl = createInterface({
    input: terminal.input,
    output: terminal.output,
  });
  return new Promise((resolve, reject) => {
    const handleClose = () => {
      terminal.cleanup();
      rl.off("close", handleClose);
      rl.off("SIGINT", handleSigInt);
      reject(new Error(closeMessage));
    };

    const handleSigInt = () => {
      rl.off("close", handleClose);
      rl.off("SIGINT", handleSigInt);
      rl.close();
      terminal.cleanup();
      reject(new PromptSignalError("SIGINT"));
    };

    rl.once("close", handleClose);
    rl.once("SIGINT", handleSigInt);
    rl.question(question, (answer) => {
      rl.off("close", handleClose);
      rl.off("SIGINT", handleSigInt);
      rl.close();
      terminal.cleanup();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export function persistStdinPromptForReexec(prompt: string): {
  path: string;
  cleanup: () => void;
} {
  const promptDir = mkdtempSync(
    join(tmpdir(), GNHF_REEXEC_STDIN_PROMPT_DIR_PREFIX),
  );
  const promptPath = join(promptDir, GNHF_REEXEC_STDIN_PROMPT_FILENAME);
  writeFileSync(promptPath, prompt, { encoding: "utf-8", mode: 0o600 });
  return {
    path: promptPath,
    cleanup: () => {
      rmSync(promptDir, { recursive: true, force: true });
    },
  };
}

export function isTrustedReexecPromptPath(promptPath: string): boolean {
  const resolvedPromptPath = resolve(promptPath);
  const promptDir = dirname(resolvedPromptPath);
  return (
    basename(resolvedPromptPath) === GNHF_REEXEC_STDIN_PROMPT_FILENAME &&
    dirname(promptDir) === resolve(tmpdir()) &&
    basename(promptDir).startsWith(GNHF_REEXEC_STDIN_PROMPT_DIR_PREFIX)
  );
}

export function cleanupTrustedReexecPromptPath(promptPath: string): void {
  if (!isTrustedReexecPromptPath(promptPath)) {
    return;
  }

  const resolvedPromptPath = resolve(promptPath);
  rmSync(resolvedPromptPath, { force: true });
  try {
    rmdirSync(dirname(resolvedPromptPath));
  } catch {
    // Leave the directory in place if anything unexpected remains.
  }
}

export function readReexecStdinPrompt(
  env: NodeJS.ProcessEnv,
): string | undefined {
  const promptPath = env[GNHF_REEXEC_STDIN_PROMPT_FILE];
  if (promptPath !== undefined) {
    delete env[GNHF_REEXEC_STDIN_PROMPT_FILE];
    try {
      return readFileSync(promptPath, "utf-8");
    } finally {
      cleanupTrustedReexecPromptPath(promptPath);
    }
  }

  const prompt = env[GNHF_REEXEC_STDIN_PROMPT];
  if (prompt !== undefined) {
    delete env[GNHF_REEXEC_STDIN_PROMPT];
    return prompt;
  }

  return undefined;
}
