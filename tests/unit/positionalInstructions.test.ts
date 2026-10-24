import { describe, expect, it } from 'vitest';
import { createInstructionExample } from '../../src/learn/positionalInstructions';
import { createMultiplicationExample, generateRandomProblem } from '../../src/learn/randomExample';
import type { AuthoredExample, InstructionalDigitCount, LessonOperation } from '../../src/learn/lessonTypes';

function checkTrace(example: AuthoredExample, expected: string): void {
  expect(example.finalAnswer).toBe(expected);
  expect(example.steps.at(-1)?.visibleResultDigits).toBe(expected);
  const byId = new Map(example.steps.map(step => [step.id, step]));
  expect(byId.size).toBe(example.steps.length);
  for (const step of example.steps) {
    const shown = step.visibleResultDigits!;
    expect(shown.length).toBe(expected.length);
    for (let index = 0; index < shown.length; index++) {
      if (shown[index] !== '□') expect(shown[index]).toBe(expected[index]);
    }
    if (step.carryOut !== undefined) {
      expect(Number(step.carryOut)).toBeGreaterThan(0);
      const target = byId.get(step.carryToStepId!);
      expect(target?.carryIn).toBe(step.carryOut);
      expect(target?.carryFromStepId).toBe(step.id);
      expect(step.carryToLabel).toBeTruthy();
    }
    if (step.carryIn !== undefined) {
      const source = byId.get(step.carryFromStepId!);
      expect(source?.carryOut).toBe(step.carryIn);
      expect(source?.carryToStepId).toBe(step.id);
      expect(step.carryFromLabel).toBeTruthy();
    }
  }
}

describe('all six instruction categories', () => {
  it.each([
    ['addition', 1, 8, 7, '15'], ['multiplication', 1, 8, 7, '56'],
    ['addition', 2, 58, 67, '125'], ['multiplication', 2, 18, 18, '324'],
    ['addition', 3, 587, 678, '1265'], ['multiplication', 3, 123, 456, '56088'],
  ] as const)('creates a complete %s/%i trace', (operation, digits, left, right, expected) => {
    const example = createInstructionExample(operation, digits, left, right);
    checkTrace(example, expected);
    expect(example.example).toEqual({ operation, operands: [String(left), String(right)] });
    expect(example.steps.length).toBeGreaterThan(0);
  });

  it('retains the established two-digit multiplication data exactly', () => {
    for (const [left, right] of [[12, 12], [18, 18], [10, 10], [99, 99], [90, 54]]) {
      expect(createInstructionExample('multiplication', 2, left!, right!))
        .toEqual(createMultiplicationExample(left!, right!));
    }
  });

  it('uses one full-result step for a single positional group without fake carries', () => {
    for (const operation of ['addition', 'multiplication'] as const) {
      for (let left = 1; left <= 9; left++) {
        for (let right = 1; right <= 9; right++) {
          const e = createInstructionExample(operation, 1, left, right);
          checkTrace(e, String(operation === 'addition' ? left + right : left * right));
          expect(e.steps).toHaveLength(1);
          expect(e.steps[0]!.navigationLabel).toBe('Step 1');
          expect(e.steps[0]!.carryIn).toBeUndefined();
          expect(e.steps[0]!.carryOut).toBeUndefined();
        }
      }
    }
  });
});

describe('owner-described addition with vertical calculation operands', () => {
  it('calculates left-to-right groups and resolves the final carry to 125', () => {
    const e = createInstructionExample('addition', 2, 58, 67);
    expect(e.steps.map(step => step.intermediateResult)).toEqual(['11', '15', '12']);
    expect(e.steps.map(step => step.calculationTerms)).toEqual([['5', '6'], ['8', '7'], ['11', '1']]);
    expect(e.steps.map(step => step.visibleResultDigits)).toEqual(['□□□', '□□5', '125']);
    expect(e.steps.map(step => step.navigationLabel)).toEqual(['Step 1', 'Step 2', 'Step 2']);
    expect(e.steps[1]!.carryOut).toBe('1');
    expect(e.steps[2]!.carryIn).toBe('1');
    checkTrace(e, '125');
  });

  it('retains all three digit sums and resolves each carry right-to-left', () => {
    const e = createInstructionExample('addition', 3, 587, 678);
    expect(e.steps.map(step => step.intermediateResult)).toEqual(['11', '15', '15', '16', '12']);
    expect(e.steps.map(step => step.visibleResultDigits)).toEqual(['□□□□', '□□□□', '□□□5', '□□65', '1265']);
    expect(e.steps.map(step => step.calculationTerms)).toEqual([['5', '6'], ['8', '7'], ['7', '8'], ['15', '1'], ['11', '1']]);
    expect(e.steps.map(step => step.navigationLabel)).toEqual(['Step 1', 'Step 2', 'Step 3', 'Step 3', 'Step 3']);
    checkTrace(e, '1265');
  });

  it('verifies all 8,100 two-digit sums, including zero digits and hundreds', () => {
    let checked = 0;
    for (let left = 10; left <= 99; left++) {
      for (let right = 10; right <= 99; right++) {
        const e = createInstructionExample('addition', 2, left, right);
        checkTrace(e, String(left + right));
        expect(e.steps.map(step => step.navigationLabel)).toEqual(['Step 1', 'Step 2', 'Step 2']);
        checked++;
      }
    }
    expect(checked).toBe(8100);
  });

  it('verifies 9,000 three-digit boundary/varied sums without leading zero digits', () => {
    for (const left of [100, 101, 109, 110, 199, 505, 900, 909, 990, 999]) {
      for (let right = 100; right <= 999; right++) {
        const e = createInstructionExample('addition', 3, left, right);
        checkTrace(e, String(left + right));
        expect(e.steps).toHaveLength(5);
      }
    }
  });
});

describe('owner-described three-digit multiplication', () => {
  it('keeps the exact central product order and yields 56088', () => {
    const e = createInstructionExample('multiplication', 3, 123, 456);
    expect(e.steps.slice(0, 5).map(step => step.operationDisplay)).toEqual([
      '1 × 4', '1 × 5 + 2 × 4', '1 × 6 + 3 × 4 + 2 × 5', '2 × 6 + 3 × 5', '3 × 6',
    ]);
    expect(e.steps.slice(0, 5).map(step => step.intermediateResult)).toEqual(['4', '13', '28', '27', '18']);
    expect(e.steps[2]!.calculationTerms).toEqual(['1 × 6', '3 × 4', '2 × 5']);
    expect(e.steps.slice(5).map(step => step.operationDisplay)).toEqual(['27 + 1', '28 + 2', '13 + 3', '4 + 1']);
    expect(e.steps.slice(5).map(step => step.navigationLabel)).toEqual(['Step 5', 'Step 5', 'Step 5', 'Step 5']);
    expect(e.steps.map(step => step.visibleResultDigits)).toEqual([
      '□□□□□', '□□□□□', '□□□□□', '□□□□□', '□□□□8', '□□□88', '□□088', '□6088', '56088',
    ]);
    checkTrace(e, '56088');
  });

  it('carries whole values above nine without truncating 999 × 999', () => {
    const e = createInstructionExample('multiplication', 3, 999, 999);
    expect(e.steps.slice(0, 5).map(step => step.intermediateResult)).toEqual(['81', '162', '243', '162', '81']);
    expect(e.steps.slice(5).map(step => step.intermediateResult)).toEqual(['170', '260', '188', '99']);
    expect(e.steps.slice(4, 8).map(step => step.carryOut)).toEqual(['8', '17', '26', '18']);
    checkTrace(e, '998001');
  });

  it('verifies boundaries and 2,000 deterministically varied three-digit products', () => {
    const bounds = [100, 101, 109, 110, 199, 505, 900, 909, 990, 999];
    const pairs = bounds.flatMap(left => bounds.map(right => [left, right] as const));
    let state = 0x12345678;
    const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return 100 + state % 900; };
    for (let index = 0; index < 2000; index++) pairs.push([next(), next()]);
    for (const [left, right] of pairs) {
      const e = createInstructionExample('multiplication', 3, left, right);
      checkTrace(e, String(left * right));
      expect(e.steps).toHaveLength(9);
      for (const step of e.steps) {
        for (const ref of step.highlightedDigitRefs ?? []) expect(ref).toMatch(/^(left|right):[0-2]$/);
      }
    }
  });
});

describe('three-digit random Learn problems and validation', () => {
  it.each(['addition', 'multiplication'] as const)('generates %s at bounds and prevents immediate unordered repeats', operation => {
    let samples = [0, 0.99999999];
    expect(generateRandomProblem(operation, 3, null, () => samples.shift()!))
      .toEqual({ operation, operands: ['100', '999'] });
    const first = generateRandomProblem(operation, 3, null, () => 0);
    expect(generateRandomProblem(operation, 3, first, () => 0).operands).toEqual(['100', '101']);
    expect(generateRandomProblem(operation, 3, { operation, operands: ['999', '999'] }, () => 0.99999999).operands)
      .toEqual(['999', '100']);
    samples = [0, 0.99999999];
    expect(generateRandomProblem(operation, 3, { operation, operands: ['999', '100'] }, () => samples.shift()!).operands)
      .toEqual(['100', '100']);
  });

  it('rejects incompatible digit ranges, fractions, nonfinite values and unsupported operations', () => {
    for (const digits of [1, 2, 3] as const) {
      const minimum = digits === 1 ? 1 : 10 ** (digits - 1);
      for (const invalid of [minimum - 1, 10 ** digits, minimum + 0.5, NaN, Infinity, -Infinity]) {
        expect(() => createInstructionExample('addition', digits, minimum, invalid)).toThrow(RangeError);
        expect(() => createInstructionExample('multiplication', digits, invalid, minimum)).toThrow(RangeError);
      }
    }
    expect(() => createInstructionExample('division' as LessonOperation, 1, 1, 1)).toThrow(RangeError);
    expect(() => createInstructionExample('addition', 4 as InstructionalDigitCount, 1000, 1000)).toThrow(RangeError);
  });
});
