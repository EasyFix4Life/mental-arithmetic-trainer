import { readFileSync } from 'node:fs';
import type { Operation, Problem } from '../../src/types';

interface ArithmeticExample {
  operation: Operation;
  digitCount: 1 | 2 | 3;
  operands: [number, number];
  expectedAnswer: number;
  expectedDigits: number;
  exactCorrectInput: string;
  sameLengthWrongInput: string;
}

interface InputCase {
  id: string;
  operation: Operation;
  operands: [number, number];
  input: string;
  expectedDigits: number;
  shouldSubmit: boolean;
  expectedOutcome: 'correct' | 'incorrect' | null;
}

interface ExamplesAndEdgeCases {
  arithmeticExamples: ArithmeticExample[];
  inputCases: InputCase[];
  generationInvariants: {
    roundLength: number;
    allowedOperations: Operation[];
    operandDigitCounts: (1 | 2 | 3)[];
    oneDigitMinProvisional: number;
  };
  roundScoringCases: { correctCount: number; display: string }[];
}

// Read the supplied acceptance data itself, rather than transcribing its values.
export const requirements = JSON.parse(
  readFileSync(
    new URL('../../requirements/EXAMPLES_AND_EDGE_CASES.json', import.meta.url),
    'utf8',
  ),
) as ExamplesAndEdgeCases;

export function fixtureProblem(
  row: Pick<ArithmeticExample, 'operation' | 'operands'>,
  id = 'fixture',
): Problem {
  return { id, operation: row.operation, operands: row.operands };
}
