/** Shared display data for confirmed examples and traces generated from their method. */
export type LessonOperation = 'addition' | 'multiplication';
export type InstructionalDigitCount = 1 | 2 | 3;
export type MultiplicationStage = 'First' | 'Inside' | 'Outside' | 'Last';

/** Character positions run left to right within each displayed operand. */
export type DigitRef = `${'left' | 'right'}:${number}`;

export interface WorkedExample {
  readonly operands: readonly [string, string];
  readonly operation: LessonOperation;
}

export interface InstructionStep {
  readonly id: string;
  readonly stageName?: MultiplicationStage;
  readonly navigationLabel?: string;
  readonly calculationTerms?: readonly string[];
  readonly calculationPrefix?: string;
  /** A learner-directed substep within the named stage, such as a carry. */
  readonly stepLabel?: string;
  /** null means the source has not supplied a digit-to-stage mapping. */
  readonly highlightedDigitRefs: readonly string[] | null;
  readonly operationDisplay?: string;
  readonly intermediateResult?: string;
  readonly carryIn?: string;
  readonly carryOut?: string;
  /** Routes refer to authored step IDs, never inferred operand positions. */
  readonly carryFromStepId?: string;
  readonly carryToStepId?: string;
  readonly carryFromLabel?: string;
  readonly carryToLabel?: string;
  readonly visibleResultDigits?: string;
  readonly narration?: string;
}

export interface AuthoredExample {
  readonly id: string;
  readonly title: string;
  readonly example: WorkedExample;
  readonly steps: readonly InstructionStep[];
  readonly finalAnswer?: string;
}

export interface CarryFragment {
  readonly intermediateProduct: string;
  readonly recordDigit: string;
  readonly carry: string;
  readonly status: string;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly operation: LessonOperation;
  readonly digitCount: InstructionalDigitCount;
  readonly authoredStatus: string;
  readonly example: WorkedExample | null;
  readonly steps: readonly InstructionStep[];
  readonly examples?: readonly AuthoredExample[];
  /** A source fragment, deliberately separate from an executable step trace. */
  readonly carryFragment?: CarryFragment;
}
