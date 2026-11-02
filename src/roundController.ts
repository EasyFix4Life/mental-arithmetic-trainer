import { assessAnswer } from './answerPolicy';
import { DEFAULT_SETTINGS, isAvailableSettings } from './availableOptions';
import { generateRound, operandRange } from './generateRound';
import { createTimer, type Clock, type Timer } from './timer';
import {
  ROUND_LENGTH,
  type DigitCount,
  type Operation,
  type Problem,
  type RoundSnapshot,
  type Settings,
} from './types';

export type { RoundSnapshot } from './types';

export interface RoundControllerOptions {
  readonly clock?: Clock;
  readonly generate?: (operation: Operation, digitCount: DigitCount) => readonly Problem[];
}

function validateRound(problems: readonly Problem[], settings: Settings): void {
  if (problems.length !== ROUND_LENGTH) {
    throw new RangeError(`A round must contain exactly ${ROUND_LENGTH} problems.`);
  }
  const range = operandRange(settings.digitCount);
  const seenPairs = new Set<string>();
  for (const problem of problems) {
    const [first, second] = problem.operands;
    if (
      problem.operands.length !== 2 ||
      problem.operation !== settings.operation ||
      ![first, second].every(
        (operand) => Number.isInteger(operand) && operand >= range.min && operand <= range.max,
      )
    ) {
      throw new RangeError('Generated problems must match the selected operation and digit range.');
    }
    const key = `${Math.min(first, second)},${Math.max(first, second)}`;
    if (seenPairs.has(key)) {
      throw new RangeError('A round cannot contain repeated unordered operand pairs.');
    }
    seenPairs.add(key);
  }
}

export function scoreText(correctCount: number): string {
  return `${correctCount} / ${ROUND_LENGTH}`;
}

export class RoundController {
  private readonly generate: NonNullable<RoundControllerOptions['generate']>;
  private readonly timer: Timer;
  private roundNumber = 0;
  private problems: readonly Problem[] = [];
  private durationsMs: number[] = [];
  private state: RoundSnapshot = Object.freeze({
    phase: 'idle',
    settings: DEFAULT_SETTINGS,
    problem: null,
    index: 0,
    answeredCount: 0,
    correctCount: 0,
    previous: null,
    timingSummary: null,
  });

  constructor(options: RoundControllerOptions = {}) {
    this.generate = options.generate ?? generateRound;
    this.timer = createTimer(options.clock);
  }

  get snapshot(): RoundSnapshot {
    return this.state;
  }

  start(settings: Settings): void {
    // Complete generation and validation before changing any existing state.
    const selectedSettings: Settings = Object.freeze({ ...settings });
    if (settings.operation !== 'addition' && settings.operation !== 'multiplication') {
      throw new RangeError('Operation must be addition or multiplication.');
    }
    operandRange(settings.digitCount);
    if (!isAvailableSettings(settings)) {
      throw new RangeError('Addition practice supports two-digit operands only.');
    }
    const generated = this.generate(settings.operation, settings.digitCount);
    validateRound(generated, settings);
    this.roundNumber += 1;
    this.problems = Object.freeze(
      generated.map((problem, index) =>
        Object.freeze({
          id: `${this.roundNumber}:${index}`,
          operation: problem.operation,
          operands: Object.freeze([...problem.operands] as [number, number]),
        }),
      ),
    );
    this.durationsMs = [];
    this.state = Object.freeze({
      phase: 'active',
      settings: selectedSettings,
      problem: this.problems[0]!,
      index: 0,
      answeredCount: 0,
      correctCount: 0,
      previous: null,
      timingSummary: null,
    });
    this.timer.reset();
  }

  /** Synchronous transition: a problem ID can score at most once. */
  submit(problemId: string, input: string): boolean {
    const current = this.state;
    if (current.phase !== 'active' || current.problem?.id !== problemId) return false;
    const assessment = assessAnswer(current.problem, input);
    if (!assessment.shouldSubmit || assessment.correct === null) return false;

    const elapsedMs = this.timer.elapsed();
    this.durationsMs.push(elapsedMs);
    const answeredCount = current.answeredCount + 1;
    const correctCount = current.correctCount + Number(assessment.correct);
    if (answeredCount === ROUND_LENGTH) {
      this.state = Object.freeze({
        phase: 'finished',
        settings: current.settings,
        problem: null,
        index: ROUND_LENGTH,
        answeredCount,
        correctCount,
        previous: null,
        timingSummary: Object.freeze({
          minimumMs: Math.min(...this.durationsMs),
          maximumMs: Math.max(...this.durationsMs),
          averageMs: this.durationsMs.reduce((total, duration) => total + duration, 0) / answeredCount,
        }),
      });
    } else {
      this.state = Object.freeze({
        phase: 'active',
        settings: current.settings,
        problem: this.problems[answeredCount]!,
        index: answeredCount,
        answeredCount,
        correctCount,
        previous: Object.freeze({ correct: assessment.correct, elapsedMs }),
        timingSummary: null,
      });
      this.timer.reset();
    }
    return true;
  }

  elapsed(): number {
    return this.state.phase === 'active' ? this.timer.elapsed() : 0;
  }
}
