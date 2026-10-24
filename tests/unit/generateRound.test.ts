import { describe, expect, it } from 'vitest';
import { generateRound, operandRange } from '../../src/generateRound';
import { correctAnswer, expectedDigits } from '../../src/answerPolicy';
import type { DigitCount, Operation, Problem } from '../../src/types';
import { requirements } from './requirements';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function assertRound(round: readonly Problem[], operation: Operation, digitCount: DigitCount): void {
  expect(round).toHaveLength(requirements.generationInvariants.roundLength);
  const { min, max } = operandRange(digitCount);
  const pairs = new Set<string>();
  const ids = new Set<string>();

  for (const problem of round) {
    expect(problem.operation).toBe(operation);
    expect(problem.operands).toHaveLength(2);
    const [a, b] = problem.operands;
    for (const operand of problem.operands) {
      expect(Number.isInteger(operand)).toBe(true);
      expect(operand).toBeGreaterThanOrEqual(min);
      expect(operand).toBeLessThanOrEqual(max);
      expect(String(operand)).toHaveLength(digitCount);
    }
    pairs.add([Math.min(a, b), Math.max(a, b)].join(':'));
    ids.add(problem.id);
    const answer = String(operation === 'addition' ? a + b : a * b);
    expect(correctAnswer(problem)).toBe(answer);
    expect(expectedDigits(problem)).toBe(answer.length);
  }

  expect(pairs.size).toBe(round.length);
  expect(ids.size).toBe(round.length);
}

describe('configured operand ranges', () => {
  it.each([
    [1, { min: requirements.generationInvariants.oneDigitMinProvisional, max: 9 }],
    [2, { min: 10, max: 99 }],
    [3, { min: 100, max: 999 }],
  ] as const)('%i digits uses exact inclusive decimal bounds', (digits, range) => {
    expect(operandRange(digits)).toEqual(range);
  });
});

describe('generation properties across every permitted configuration', () => {
  for (const operation of requirements.generationInvariants.allowedOperations) {
    for (const digitCount of requirements.generationInvariants.operandDigitCounts) {
      const label = `${operation}, ${digitCount} digits`;

      it(`${label}: 128 seeded rounds satisfy arithmetic, length, range and unordered uniqueness`, () => {
        for (let seed = 0; seed < 128; seed += 1) {
          assertRound(generateRound(operation, digitCount, seededRandom(seed)), operation, digitCount);
        }
      });

      it(`${label}: injected seed reproduces operand sequence and different seeds vary it`, () => {
        const sequence = (seed: number) =>
          generateRound(operation, digitCount, seededRandom(seed)).map(({ operands }) => operands);
        expect(sequence(1234)).toEqual(sequence(1234));
        expect(sequence(1234)).not.toEqual(sequence(5678));
      });

      it(`${label}: a pathological constant random source still returns a complete unique round`, () => {
        let calls = 0;
        const round = generateRound(operation, digitCount, () => {
          calls += 1;
          if (calls > 1000) throw new Error('Generation failed to terminate within a bounded number of random draws.');
          return 0;
        });
        assertRound(round, operation, digitCount);
        expect(calls).toBeLessThanOrEqual(1000);
      });
    }
  }
});
