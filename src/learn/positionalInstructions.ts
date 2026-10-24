import type {
  AuthoredExample, InstructionalDigitCount, InstructionStep, LessonOperation,
} from './lessonTypes';
import { createMultiplicationExample } from './randomExample';

interface PositionalGroup {
  readonly label: string;
  readonly expression: string;
  readonly result: number;
  readonly digitRefs: readonly string[];
  /** Addition is displayed vertically, including sums of cross-products. */
  readonly calculationTerms?: readonly string[];
}

/**
 * Generate the owner's positional procedure for all six lesson categories.
 * Group arithmetic is separate from the renderer and practice state machine.
 * The established two-digit multiplication trace remains its existing source.
 */
export function createInstructionExample(
  operation: LessonOperation,
  digitCount: InstructionalDigitCount,
  left: number,
  right: number,
): AuthoredExample {
  if (operation !== 'addition' && operation !== 'multiplication') {
    throw new RangeError('Instructional examples require addition or multiplication.');
  }
  if (![1, 2, 3].includes(digitCount)) {
    throw new RangeError('Instructional examples require one, two, or three digits.');
  }
  const minimum = digitCount === 1 ? 1 : 10 ** (digitCount - 1);
  const maximum = 10 ** digitCount - 1;
  if (![left, right].every(value => Number.isInteger(value) && value >= minimum && value <= maximum)) {
    throw new RangeError('Both instructional operands must match the selected digit range.');
  }
  if (operation === 'multiplication' && digitCount === 2) {
    return createMultiplicationExample(left, right);
  }

  const firstDigits = String(left).split('').map(Number);
  const secondDigits = String(right).split('').map(Number);
  let groups: PositionalGroup[];
  if (operation === 'addition') {
    groups = firstDigits.map((first, index) => {
      const second = secondDigits[index]!;
      return {
        label: `Step ${index + 1}`,
        expression: `${first} + ${second}`,
        calculationTerms: [String(first), String(second)],
        result: first + second,
        digitRefs: [`left:${index}`, `right:${index}`],
      };
    });
  } else {
    // Exact owner-described three-digit order, including first×last before
    // last×first and middle×middle in the central group. Single digits are the
    // one-product base case. Carries follow the confirmed 18×18 direction.
    const pairs: readonly (readonly (readonly [number, number])[])[] = digitCount === 1
      ? [[[0, 0]]]
      : [[[0, 0]], [[0, 1], [1, 0]], [[0, 2], [2, 0], [1, 1]], [[1, 2], [2, 1]], [[2, 2]]];
    groups = pairs.map((group, index) => {
      const terms = group.map(([a, b]) => `${firstDigits[a]!} × ${secondDigits[b]!}`);
      return {
        label: `Step ${index + 1}`,
        expression: terms.join(' + '),
        result: group.reduce((sum, [a, b]) => sum + firstDigits[a]! * secondDigits[b]!, 0),
        digitRefs: [...new Set(group.flatMap(([a, b]) => [`left:${a}`, `right:${b}`]))],
        ...(terms.length > 1 ? { calculationTerms: terms } : {}),
      };
    });
  }
  return resolveGroups(operation, left, right, groups);
}

function resolveGroups(
  operation: LessonOperation,
  left: number,
  right: number,
  groups: readonly PositionalGroup[],
): AuthoredExample {
  const finalAnswer = String(operation === 'addition' ? left + right : left * right);
  const symbol = operation === 'addition' ? '+' : '×';
  const resultName = operation === 'addition' ? 'Sum' : 'Product';
  const prefix = `random-${left}-${operation}-${right}`;
  const blank = '□'.repeat(finalAnswer.length);
  const lastIndex = groups.length - 1;
  let suffix = '';
  let pendingCarry = 0;
  const steps: InstructionStep[] = groups.map((group, index) => {
    const step: InstructionStep = {
      id: `${prefix}-group-${index}`,
      navigationLabel: group.label,
      highlightedDigitRefs: group.digitRefs,
      operationDisplay: group.expression,
      intermediateResult: String(group.result),
      visibleResultDigits: blank,
      ...(group.calculationTerms ? { calculationTerms: group.calculationTerms } : {}),
    };
    if (index !== lastIndex) return step;
    if (lastIndex === 0) {
      suffix = String(group.result);
      return { ...step, visibleResultDigits: finalAnswer, narration: `${resultName} = ${finalAnswer}.` };
    }
    suffix = String(group.result % 10);
    pendingCarry = Math.floor(group.result / 10);
    return {
      ...step,
      visibleResultDigits: '□'.repeat(finalAnswer.length - suffix.length) + suffix,
      ...(pendingCarry > 0 ? {
        carryOut: String(pendingCarry),
        carryToStepId: `${prefix}-resolve-${lastIndex - 1}`,
        carryToLabel: `${groups[lastIndex - 1]!.label} (${groups[lastIndex - 1]!.result})`,
      } : {}),
      narration: pendingCarry > 0
        ? `Write ${suffix}, carry ${pendingCarry} to ${groups[lastIndex - 1]!.result}.`
        : `Write ${suffix}.`,
    };
  });

  for (let index = lastIndex - 1; index >= 0; index -= 1) {
    const group = groups[index]!;
    const carryIn = pendingCarry;
    const resolved = group.result + carryIn;
    const record = index === 0 ? String(resolved) : String(resolved % 10);
    pendingCarry = index === 0 ? 0 : Math.floor(resolved / 10);
    suffix = record + suffix;
    const previousId = index === lastIndex - 1
      ? `${prefix}-group-${lastIndex}` : `${prefix}-resolve-${index + 1}`;
    steps.push({
      id: `${prefix}-resolve-${index}`,
      navigationLabel: groups[lastIndex]!.label,
      stepLabel: index === 0 ? 'Complete the answer' : `Complete ${group.label.toLowerCase()}`,
      highlightedDigitRefs: group.digitRefs,
      operationDisplay: carryIn > 0 ? `${group.result} + ${carryIn}` : group.expression,
      ...(carryIn > 0 ? { calculationTerms: [String(group.result), String(carryIn)] }
        : group.calculationTerms ? { calculationTerms: group.calculationTerms } : {}),
      intermediateResult: String(resolved),
      visibleResultDigits: '□'.repeat(Math.max(0, finalAnswer.length - suffix.length)) + suffix,
      ...(carryIn > 0 ? {
        carryIn: String(carryIn),
        carryFromStepId: previousId,
        carryFromLabel: index === lastIndex - 1
          ? `${groups[lastIndex]!.label} (${groups[lastIndex]!.result})` : groups[index + 1]!.label,
      } : {}),
      ...(pendingCarry > 0 ? {
        carryOut: String(pendingCarry),
        carryToStepId: `${prefix}-resolve-${index - 1}`,
        carryToLabel: `${groups[index - 1]!.label} (${groups[index - 1]!.result})`,
      } : {}),
      narration: index === 0 ? `${resultName} = ${finalAnswer}.`
        : pendingCarry > 0 ? `Write ${record}, carry ${pendingCarry} to ${groups[index - 1]!.result}.`
          : `Write ${record}.`,
    });
  }
  return {
    id: prefix,
    title: `${left} ${symbol} ${right} — random example`,
    example: { operands: [String(left), String(right)], operation },
    steps,
    finalAnswer,
  };
}
