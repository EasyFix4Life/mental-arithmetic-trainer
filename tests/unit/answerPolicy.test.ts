import { describe, expect, it } from 'vitest';
import { assessAnswer, correctAnswer, expectedDigits } from '../../src/answerPolicy';
import { fixtureProblem, requirements } from './requirements';

describe('supplied arithmetic acceptance examples', () => {
  for (const row of requirements.arithmeticExamples) {
    const label = `${row.operands[0]} ${row.operation} ${row.operands[1]}`;

    it(`${label}: answer, digit length, exact right and same-length wrong`, () => {
      const problem = fixtureProblem(row);
      expect(correctAnswer(problem)).toBe(String(row.expectedAnswer));
      expect(expectedDigits(problem)).toBe(row.expectedDigits);
      expect(assessAnswer(problem, row.exactCorrectInput)).toEqual({
        shouldSubmit: true,
        correct: true,
      });
      expect(assessAnswer(problem, row.sameLengthWrongInput)).toEqual({
        shouldSubmit: true,
        correct: false,
      });
    });

    it(`${label}: each incomplete prefix remains unscored`, () => {
      const problem = fixtureProblem(row);
      for (let length = 0; length < row.expectedDigits; length += 1) {
        expect(assessAnswer(problem, row.exactCorrectInput.slice(0, length))).toEqual({
          shouldSubmit: false,
          correct: null,
        });
      }
    });

    it(`${label}: overlong and leading-zero transactions are wrong`, () => {
      const problem = fixtureProblem(row);
      expect(assessAnswer(problem, `${row.exactCorrectInput}0`)).toEqual({
        shouldSubmit: true,
        correct: false,
      });
      expect(assessAnswer(problem, `0${row.exactCorrectInput.slice(1)}`)).toEqual({
        shouldSubmit: true,
        correct: false,
      });
    });
  }
});

describe('supplied input acceptance cases', () => {
  it.each(requirements.inputCases)('$id', (row) => {
    const problem = fixtureProblem(row, row.id);
    expect(expectedDigits(problem)).toBe(row.expectedDigits);
    expect(assessAnswer(problem, row.input)).toEqual({
      shouldSubmit: row.shouldSubmit,
      correct: row.expectedOutcome === null ? null : row.expectedOutcome === 'correct',
    });
  });
});

describe('only unadorned ASCII decimal digits are eligible', () => {
  const problem = fixtureProblem({ operation: 'multiplication', operands: [10, 10] });

  it.each([
    ' 100', '100 ', '\t100', '\n100', '100\n', '+100', '-100', '100.0',
    '1,00', '1e2', '0x64', '١٠٠', '１００', '1a00', '100🧮', '1 00',
  ])('ignores invalid transaction %j without scoring', (input) => {
    expect(assessAnswer(problem, input)).toEqual({ shouldSubmit: false, correct: null });
  });
});
