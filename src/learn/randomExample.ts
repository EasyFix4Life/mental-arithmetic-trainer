import type {
  AuthoredExample,
  InstructionalDigitCount,
  InstructionStep,
  LessonOperation,
  WorkedExample,
} from './lessonTypes';

/**
 * Generate operands only. Lessons without an owner-supplied procedure can show a
 * random question without inventing an explanation of how Jeff teaches it.
 * A repeated unordered pair advances the right operand once, without retrying
 * the RNG, so a constant RNG cannot hang the lesson or repeat its last example.
 */
export function generateRandomProblem(
  operation: LessonOperation,
  digitCount: InstructionalDigitCount,
  previous?: WorkedExample | null,
  random: () => number = Math.random,
): WorkedExample {
  if (operation !== 'addition' && operation !== 'multiplication') {
    throw new RangeError('Learn examples support addition and multiplication.');
  }
  if (digitCount !== 1 && digitCount !== 2 && digitCount !== 3) {
    throw new RangeError('Learn examples support one, two, or three digits per operand.');
  }
  const minimum = digitCount === 1 ? 1 : 10 ** (digitCount - 1);
  const maximum = 10 ** digitCount - 1;
  const range = maximum - minimum + 1;
  const drawOperand = (): number => {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError('The random source must return a number from 0 up to, but excluding, 1.');
    }
    return minimum + Math.floor(sample * range);
  };
  const left = drawOperand();
  let right = drawOperand();
  if (previous?.operation === operation) {
    const [previousLeft, previousRight] = previous.operands;
    if ((previousLeft === String(left) && previousRight === String(right))
      || (previousLeft === String(right) && previousRight === String(left))) {
      right = right === maximum ? minimum : right + 1;
    }
  }
  return { operation, operands: [String(left), String(right)] };
}

/**
 * Apply the First → Inside → Outside → Last sequence and the carry direction
 * confirmed by Jeff for 12 × 12 and 18 × 18 to any two-digit operands.
 * The owner's later correction names the adjacent inner digits Inside and
 * the two outer digits Outside in the horizontal operand arrangement.
 * Arithmetic lives here; the instruction renderer only displays the trace.
 */
export function createMultiplicationExample(left: number, right: number): AuthoredExample {
  if (!Number.isInteger(left) || left < 10 || left > 99
    || !Number.isInteger(right) || right < 10 || right > 99) {
    throw new RangeError('The multiplication lesson requires two integers from 10 to 99.');
  }

  const leftFirst = Math.floor(left / 10);
  const leftLast = left % 10;
  const rightFirst = Math.floor(right / 10);
  const rightLast = right % 10;
  const first = leftFirst * rightFirst;
  const inside = leftLast * rightFirst;
  const outside = leftFirst * rightLast;
  const middle = inside + outside;
  const last = leftLast * rightLast;
  const unitsDigit = last % 10;
  const carryToMiddle = Math.floor(last / 10);
  const resolvedMiddle = middle + carryToMiddle;
  const tensDigit = resolvedMiddle % 10;
  const carryToFirst = Math.floor(resolvedMiddle / 10);
  const resolvedFirst = first + carryToFirst;
  const finalAnswer = `${resolvedFirst}${tensDigit}${unitsDigit}`;
  const prefix = `random-${left}-times-${right}`;
  const blank = '□'.repeat(finalAnswer.length);
  const unitsOnly = `${'□'.repeat(finalAnswer.length - 1)}${unitsDigit}`;
  const lastTwo = `${'□'.repeat(finalAnswer.length - 2)}${tensDigit}${unitsDigit}`;
  const needsMiddleStep = carryToMiddle > 0 || carryToFirst > 0;

  const steps: InstructionStep[] = [
    {
      id: `${prefix}-first`,
      stageName: 'First',
      highlightedDigitRefs: ['left:0', 'right:0'],
      operationDisplay: `${leftFirst} × ${rightFirst}`,
      intermediateResult: String(first),
      visibleResultDigits: blank,
    },
    {
      id: `${prefix}-inside`,
      stageName: 'Inside',
      highlightedDigitRefs: ['left:1', 'right:0'],
      operationDisplay: `${leftLast} × ${rightFirst}`,
      intermediateResult: String(inside),
      visibleResultDigits: blank,
    },
    {
      id: `${prefix}-outside`,
      stageName: 'Outside',
      highlightedDigitRefs: ['left:0', 'right:1'],
      operationDisplay: `${leftFirst} × ${rightLast} = ${outside}; ${inside} + ${outside}`,
      intermediateResult: String(middle),
      visibleResultDigits: blank,
      narration: `Combine Inside and Outside: ${inside} + ${outside} = ${middle}.`,
    },
    {
      id: `${prefix}-last`,
      stageName: 'Last',
      highlightedDigitRefs: ['left:1', 'right:1'],
      operationDisplay: `${leftLast} × ${rightLast}`,
      intermediateResult: String(last),
      visibleResultDigits: needsMiddleStep ? unitsOnly : finalAnswer,
      ...(carryToMiddle > 0 ? {
        carryOut: String(carryToMiddle),
        carryToStepId: `${prefix}-middle-carry`,
        carryToLabel: `Inside + Outside (${middle})`,
      } : {}),
      narration: carryToMiddle > 0
        ? `Write ${unitsDigit}, carry ${carryToMiddle} to ${middle}.`
        : needsMiddleStep ? `Write ${unitsDigit}.` : `Product = ${finalAnswer}.`,
    },
  ];

  if (needsMiddleStep) {
    steps.push({
      id: `${prefix}-middle-carry`,
      stageName: 'Last',
      stepLabel: carryToMiddle > 0 ? 'Carry to the middle' : 'Complete the middle',
      highlightedDigitRefs: [],
      operationDisplay: carryToMiddle > 0
        ? `${middle} + ${carryToMiddle}` : `${inside} + ${outside}`,
      intermediateResult: String(resolvedMiddle),
      visibleResultDigits: carryToFirst > 0 ? lastTwo : finalAnswer,
      ...(carryToMiddle > 0 ? {
        carryIn: String(carryToMiddle),
        carryFromStepId: `${prefix}-last`,
        carryFromLabel: `Last (${last})`,
      } : {}),
      ...(carryToFirst > 0 ? {
        carryOut: String(carryToFirst),
        carryToStepId: `${prefix}-first-carry`,
        carryToLabel: `First (${first})`,
      } : {}),
      narration: carryToFirst > 0
        ? `${carryToMiddle > 0 ? `${middle} + ${carryToMiddle}` : `${inside} + ${outside}`} = ${resolvedMiddle}. Write ${tensDigit}, carry ${carryToFirst} to the first ${first}.`
        : `${middle} + ${carryToMiddle} = ${resolvedMiddle}. Write ${tensDigit}. Product = ${finalAnswer}.`,
    });
  }
  if (carryToFirst > 0) {
    steps.push({
      id: `${prefix}-first-carry`,
      stageName: 'Last',
      stepLabel: 'Complete the answer',
      highlightedDigitRefs: ['left:0', 'right:0'],
      operationDisplay: `${first} + ${carryToFirst}`,
      intermediateResult: String(resolvedFirst),
      visibleResultDigits: finalAnswer,
      carryIn: String(carryToFirst),
      carryFromStepId: `${prefix}-middle-carry`,
      carryFromLabel: `Inside + Outside (${resolvedMiddle})`,
      narration: `${first} + ${carryToFirst} = ${resolvedFirst}. Product = ${finalAnswer}.`,
    });
  }
  return {
    id: prefix,
    title: `${left} × ${right} — random example`,
    example: { operands: [String(left), String(right)], operation: 'multiplication' },
    steps,
    finalAnswer,
  };
}
