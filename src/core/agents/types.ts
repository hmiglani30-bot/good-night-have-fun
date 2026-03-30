export interface AgentOutput {
  success: boolean;
  summary: string;
  key_changes_made: string[];
  key_learnings: string[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface AgentResult {
  output: AgentOutput;
  usage: TokenUsage;
}

export type OnUsage = (usage: TokenUsage) => void;

export type OnMessage = (text: string) => void;

export interface AgentRunOptions {
  onUsage?: OnUsage;
  onMessage?: OnMessage;
  signal?: AbortSignal;
  logPath?: string;
}

export interface Agent {
  name: string;
  run(
    prompt: string,
    cwd: string,
    options?: AgentRunOptions,
  ): Promise<AgentResult>;
}
