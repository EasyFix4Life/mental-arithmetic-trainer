import type { Problem } from './types';

export interface AnswerAssessment {
  readonly shouldSubmit: boolean;
  readonly correct: boolean | null;
}

export function correctAnswer(problem: Problem): string {
  const [first, second] = problem.operands;
  return String(problem.operation === 'addition' ? first + second : first * second);
}

export function expectedDigits(problem: Problem): number {
  return correctAnswer(problem).length;
}

/** An invalid transaction is ignored; it is never normalized into an answer. */
export function assessAnswer(problem: Problem, input: string): AnswerAssessment {
  if (!/^[0-9]*$/.test(input) || input.length < expectedDigits(problem)) {
    return { shouldSubmit: false, correct: null };
  }

  // Exact string comparison preserves leading-zero and atomic-overlong errors.
  return { shouldSubmit: true, correct: input === correctAnswer(problem) };
}
