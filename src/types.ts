export type Operation = 'addition' | 'multiplication';

export type DigitCount = 1 | 2 | 3;

export interface Settings {
  readonly operation: Operation;
  readonly digitCount: DigitCount;
}

export interface Problem {
  readonly id: string;
  readonly operation: Operation;
  readonly operands: readonly [number, number];
}

export const ROUND_LENGTH = 10;

export interface PreviousResult {
  readonly correct: boolean;
  readonly elapsedMs: number;
}

export interface RoundTimingSummary {
  readonly minimumMs: number;
  readonly maximumMs: number;
  readonly averageMs: number;
}

export interface RoundSnapshot {
  readonly phase: 'idle' | 'active' | 'finished';
  readonly settings: Settings;
  readonly problem: Problem | null;
  /** Zero-based current problem index; ROUND_LENGTH after completion. */
  readonly index: number;
  readonly answeredCount: number;
  readonly correctCount: number;
  readonly previous: PreviousResult | null;
  /** All accepted answers, correct and incorrect; available only after completion. */
  readonly timingSummary: RoundTimingSummary | null;
}
