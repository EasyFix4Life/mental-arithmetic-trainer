import { describe, expect, it } from 'vitest';
import { createMultiplicationExample, generateRandomProblem } from '../../src/learn/randomExample';
import type { InstructionStep, WorkedExample } from '../../src/learn/lessonTypes';

function samples(...values: number[]): () => number {
  let index = 0;
  return () => values[index++]!;
}

describe('random Learn operands', () => {
  it.each(['addition', 'multiplication'] as const)('draws one-digit %s operands at both inclusive bounds', (operation) => {
    expect(generateRandomProblem(operation, 1, null, samples(0, 0.999999999)))
      .toEqual({ operation, operands: ['1', '9'] });
  });

  it('draws two independent two-digit operands at both inclusive bounds', () => {
    expect(generateRandomProblem('multiplication', 2, null, samples(0, 0.999999999)))
      .toEqual({ operation: 'multiplication', operands: ['10', '99'] });
    expect(generateRandomProblem('multiplication', 2, null, samples((88.25) / 90, (77.25) / 90)))
      .toEqual({ operation: 'multiplication', operands: ['98', '87'] });
  });

  it('cannot immediately repeat a square even with a constant random source', () => {
    const first = generateRandomProblem('multiplication', 2, null, () => 0);
    const second = generateRandomProblem('multiplication', 2, first, () => 0);
    expect(first.operands).toEqual(['10', '10']);
    expect(second.operands).toEqual(['10', '11']);
    expect(generateRandomProblem('multiplication', 2, {
      operation: 'multiplication', operands: ['99', '99'],
    }, () => 0.999999999).operands).toEqual(['99', '10']);
  });

  it('treats a swapped previous pair as the same example without retrying the RNG', () => {
    const previous: WorkedExample = { operation: 'addition', operands: ['9', '1'] };
    let draws = 0;
    const draw = samples(0, 0.999999999);
    const next = generateRandomProblem('addition', 1, previous, () => { draws++; return draw(); });
    expect(next.operands).toEqual(['1', '1']);
    expect(draws).toBe(2);
    expect(previous.operands).toEqual(['9', '1']);
  });

  it('does not exclude an addition example from multiplication', () => {
    expect(generateRandomProblem('multiplication', 1, {
      operation: 'addition', operands: ['1', '1'],
    }, () => 0).operands).toEqual(['1', '1']);
  });

  it.each([1, -0.1, NaN, Infinity])('rejects an invalid random value %s instead of generating invalid operands', (value) => {
    expect(() => generateRandomProblem('addition', 1, null, () => value)).toThrow(RangeError);
  });
});

describe('the confirmed two-digit multiplication procedure applied to random operands', () => {
  it('uses the inner digits for Inside and outer digits for Outside in the reported 82 × 76 example', () => {
    const example = createMultiplicationExample(82, 76);
    expect(example.steps.map((step) => step.operationDisplay)).toEqual([
      '8 × 7', '2 × 7', '8 × 6 = 48; 14 + 48', '2 × 6', '62 + 1', '56 + 6',
    ]);
    expect(example.steps[1]!.highlightedDigitRefs).toEqual(['left:1', 'right:0']);
    expect(example.steps[1]!.intermediateResult).toBe('14');
    expect(example.steps[2]!.highlightedDigitRefs).toEqual(['left:0', 'right:1']);
    expect(example.steps[2]!.narration).toBe('Combine Inside and Outside: 14 + 48 = 62.');
    expect(example.steps.slice(3).map((step) => step.visibleResultDigits)).toEqual(['□□□2', '□□32', '6232']);
    expect(example.finalAnswer).toBe('6232');
  });

  it('keeps a zero Inside product and carries the Outside product into First for 20 × 15', () => {
    const example = createMultiplicationExample(20, 15);
    expect(example.steps.map((step) => step.operationDisplay)).toEqual([
      '2 × 1', '0 × 1', '2 × 5 = 10; 0 + 10', '0 × 5', '0 + 10', '2 + 1',
    ]);
    expect(example.steps[1]!.intermediateResult).toBe('0');
    expect(example.steps[2]!.narration).toBe('Combine Inside and Outside: 0 + 10 = 10.');
    expect(example.steps[4]!.carryOut).toBe('1');
    expect(example.steps.at(-1)!.visibleResultDigits).toBe('300');
  });

  it('produces the confirmed 18 × 18 carry calculations and routing', () => {
    const example = createMultiplicationExample(18, 18);
    expect(example.finalAnswer).toBe('324');
    expect(example.steps.map((step) => step.operationDisplay)).toEqual([
      '1 × 1', '8 × 1', '1 × 8 = 8; 8 + 8', '8 × 8', '16 + 6', '1 + 2',
    ]);
    expect(example.steps.map((step) => step.intermediateResult)).toEqual(['1', '8', '16', '64', '22', '3']);
    expect(example.steps.slice(3).map((step) => step.visibleResultDigits)).toEqual(['□□4', '□24', '324']);
    expect(example.steps[3]!.carryToStepId).toBe(example.steps[4]!.id);
    expect(example.steps[4]!.carryToStepId).toBe(example.steps[5]!.id);
    expect(example.steps[4]!.carryIn).toBe('6');
    expect(example.steps[5]!.carryIn).toBe('2');
  });

  it.each([
    [10, 10, '100'], [12, 12, '144'], [20, 15, '300'],
    [15, 15, '225'], [12, 90, '1080'], [98, 87, '8526'], [99, 99, '9801'],
  ])('finishes %i × %i as %s including zero digits and three/four-digit answers', (left, right, expected) => {
    const example = createMultiplicationExample(left, right);
    expect(example.finalAnswer).toBe(expected);
    expect(example.steps.at(-1)!.visibleResultDigits).toBe(expected);
    expect(example.example.operands).toEqual([String(left), String(right)]);
  });

  it('does not create zero carries or unnecessary carry screens', () => {
    const noCarry = createMultiplicationExample(10, 10);
    expect(noCarry.steps).toHaveLength(4);
    expect(noCarry.steps.every((step) => step.carryIn === undefined && step.carryOut === undefined)).toBe(true);
    // Units produce no carry; the two cross-products alone require carrying.
    const middleOnly = createMultiplicationExample(20, 15);
    expect(middleOnly.steps).toHaveLength(6);
    expect(middleOnly.steps[3]!.carryOut).toBeUndefined();
    expect(middleOnly.steps[4]!.carryIn).toBeUndefined();
    expect(middleOnly.steps[4]!.carryOut).toBe('1');
    // The units carry changes the middle without changing First.
    const unitsOnly = createMultiplicationExample(13, 14);
    expect(unitsOnly.steps).toHaveLength(5);
    expect(unitsOnly.steps[3]!.carryOut).toBe('1');
    expect(unitsOnly.steps[4]!.carryIn).toBe('1');
    expect(unitsOnly.steps[4]!.carryOut).toBeUndefined();
    expect(unitsOnly.steps[4]!.visibleResultDigits).toBe('182');
  });

  it.each([9, 100, 12.5, NaN, Infinity])('rejects an invalid two-digit operand %s', (operand) => {
    expect(() => createMultiplicationExample(operand, 12)).toThrow(RangeError);
    expect(() => createMultiplicationExample(12, operand)).toThrow(RangeError);
  });

  it('checks every 10..99 pair: arithmetic, stage mapping, stable revealed digits, and complete carry links', () => {
    let checked = 0;
    for (let left = 10; left <= 99; left++) {
      for (let right = 10; right <= 99; right++) {
        const example = createMultiplicationExample(left, right);
        const finalAnswer = String(left * right);
        const [leftTens, leftUnits] = Array.from(String(left), Number);
        const [rightTens, rightUnits] = Array.from(String(right), Number);
        const expectedProducts = [leftTens! * rightTens!, leftUnits! * rightTens!,
          leftTens! * rightUnits! + leftUnits! * rightTens!, leftUnits! * rightUnits!];
        expect(example.finalAnswer).toBe(finalAnswer);
        expect(example.steps.slice(0, 4).map((step) => step.stageName)).toEqual(['First', 'Inside', 'Outside', 'Last']);
        expect(example.steps.slice(0, 4).map((step) => step.highlightedDigitRefs)).toEqual([
          ['left:0', 'right:0'], ['left:1', 'right:0'], ['left:0', 'right:1'], ['left:1', 'right:1'],
        ]);
        expect(example.steps.slice(0, 4).map((step) => Number(step.intermediateResult))).toEqual(expectedProducts);
        expect(example.steps.at(-1)!.visibleResultDigits).toBe(finalAnswer);
        const byId = new Map(example.steps.map((step) => [step.id, step]));
        expect(byId.size).toBe(example.steps.length);
        for (const step of example.steps) {
          const shown = step.visibleResultDigits!;
          expect(shown).toHaveLength(finalAnswer.length);
          for (let index = 0; index < shown.length; index++) {
            if (shown[index] !== '□') expect(shown[index]).toBe(finalAnswer[index]);
          }
          if (step.carryOut !== undefined) {
            expect(Number(step.carryOut)).toBeGreaterThan(0);
            const destination = byId.get(step.carryToStepId!) as InstructionStep;
            expect(destination).toBeDefined();
            expect(destination.carryIn).toBe(step.carryOut);
            expect(destination.carryFromStepId).toBe(step.id);
          }
          if (step.carryIn !== undefined) {
            const source = byId.get(step.carryFromStepId!) as InstructionStep;
            expect(source).toBeDefined();
            expect(source.carryOut).toBe(step.carryIn);
            expect(source.carryToStepId).toBe(step.id);
          }
        }
        checked++;
      }
    }
    expect(checked).toBe(8100);
  });
});
