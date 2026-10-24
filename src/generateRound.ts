import { ROUND_LENGTH, type DigitCount, type Operation, type Problem } from './types';

export interface OperandRange {
  readonly min: number;
  readonly max: number;
}

/** Provisional v1 choice: one-digit operands exclude zero. */
export function operandRange(digitCount: DigitCount): OperandRange {
  switch (digitCount) {
    case 1:
      return { min: 1, max: 9 };
    case 2:
      return { min: 10, max: 99 };
    case 3:
      return { min: 100, max: 999 };
    default:
      throw new RangeError('Operand digit count must be 1, 2, or 3.');
  }
}

function randomIndex(size: number, rng: () => number): number {
  const value = rng();
  // Defensive bounds retain termination with injected pathological RNGs.
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return size - 1;
  return Math.floor(value * size);
}

/** Decode an index in the upper triangle, including equal operand pairs. */
function pairAt(index: number, range: OperandRange): readonly [number, number] {
  let first = range.min;
  let rowLength = range.max - range.min + 1;
  while (index >= rowLength) {
    index -= rowLength;
    first += 1;
    rowLength -= 1;
  }
  return [first, first + index];
}

/** Generate the complete round without rejection loops or commutative repeats. */
export function generateRound(
  operation: Operation,
  digitCount: DigitCount,
  rng: () => number = Math.random,
): readonly Problem[] {
  if (operation !== 'addition' && operation !== 'multiplication') {
    throw new RangeError('Operation must be addition or multiplication.');
  }

  const range = operandRange(digitCount);
  const width = range.max - range.min + 1;
  const pairCount = (width * (width + 1)) / 2;
  const replacements = new Map<number, number>();
  const problems: Problem[] = [];

  // Partial Fisher-Yates samples unordered pairs without replacement in ten
  // bounded iterations, even when the RNG returns the same value every time.
  for (let index = 0; index < ROUND_LENGTH; index += 1) {
    const remaining = pairCount - index;
    const selectedIndex = randomIndex(remaining, rng);
    const selectedPair = replacements.get(selectedIndex) ?? selectedIndex;
    const lastIndex = remaining - 1;
    replacements.set(selectedIndex, replacements.get(lastIndex) ?? lastIndex);
    replacements.delete(lastIndex);

    const [first, second] = pairAt(selectedPair, range);
    const operands: readonly [number, number] =
      randomIndex(2, rng) === 0 ? [first, second] : [second, first];

    problems.push(
      Object.freeze({
        id: `${operation}-${digitCount}-${index}`,
        operation,
        operands: Object.freeze(operands),
      }),
    );
  }

  return Object.freeze(problems);
}
