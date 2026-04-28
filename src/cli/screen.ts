import process from "node:process";

export function enterAltScreen(): void {
  process.stdout.write("\x1b[?1049h");
  process.stdout.write("\x1b[?25l");
}

export function exitAltScreen(): void {
  process.stdout.write("\x1b[?25h");
  process.stdout.write("\x1b[?1049l");
}

export function humanizeErrorMessage(message: string): string {
  if (message.includes("not a git repository")) {
    return 'This command must be run inside a Git repository. Change into a repo or run "git init" first.';
  }

  return message;
}

export function die(message: string): never {
  console.error(`\n  gnhf: ${humanizeErrorMessage(message)}\n`);
  process.exit(1);
}
