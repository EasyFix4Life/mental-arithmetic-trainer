import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getLesson, lessons } from '../../src/learn/lessonCatalog';
import { createInstructionExample } from '../../src/learn/positionalInstructions';
import { generateRandomProblem } from '../../src/learn/randomExample';

interface SourceLesson {
  id: string;
  title: string;
  operation: 'addition' | 'multiplication';
  digits_per_operand: 1 | 2;
  owner_authored_steps_status: string;
  stage_sequence?: { name: string; digit_refs: null }[];
}

const source = JSON.parse(readFileSync(new URL(
  '../../requirements/instruction/Mental_Arithmetic_Instructional_Lessons_Codex_2026-10-24.json',
  import.meta.url,
), 'utf8')) as { lessons: SourceLesson[] };

describe('source-preserving instructional catalog', () => {
  it('preserves the available supplied lessons in their original relative order and includes three-digit multiplication', () => {
    expect(lessons.slice(0, 3).map(({ id, title, operation, digitCount }) => ({
      id, title, operation, digitCount,
    }))).toEqual(source.lessons.filter((lesson) => lesson.id !== 'addition-1').map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      operation: lesson.operation,
      digitCount: lesson.digits_per_operand,
    })));
    expect(lessons).toHaveLength(4);
    expect(lessons.slice(3).map(({ id, operation, digitCount }) => ({ id, operation, digitCount }))).toEqual([
      { id: 'multiplication-3', operation: 'multiplication', digitCount: 3 },
    ]);
  });

  it('provides generated instructions in all four available categories using the owner-described methodology', () => {
    for (const lesson of lessons) {
      expect(lesson.authoredStatus).toMatch(/owner-described/i);
      expect(lesson.authoredStatus).not.toMatch(/pending|not yet/i);
      const problem = generateRandomProblem(lesson.operation, lesson.digitCount, null, () => 0.6);
      const [left, right] = problem.operands.map(Number) as [number, number];
      const example = createInstructionExample(lesson.operation, lesson.digitCount, left, right);
      expect(example.steps.length).toBeGreaterThan(0);
      expect(example.finalAnswer).toBe(String(lesson.operation === 'addition' ? left + right : left * right));
    }
  });

  it('keeps the supplied source registry unchanged while adding the later owner-confirmed worked examples', () => {
    const lesson = getLesson('multiplication-2')!;
    expect(source.lessons[3]!.owner_authored_steps_status).toMatch(/complete indexed worked trace not yet recovered/);
    expect(lesson.authoredStatus).toMatch(/confirm/i);
    expect(lesson.examples?.map((example) => example.example.operands)).toEqual([
      ['12', '12'], ['18', '18'],
    ]);
    expect(lesson.example).toEqual(lesson.examples![0]!.example);
    expect(lesson.steps).toEqual(lesson.examples![0]!.steps);
    expect(lesson.carryFragment).toBeUndefined();
  });

  it('records the confirmed 12 × 12 mapping, corrected middle sum, and full 144 result without carries', () => {
    const example = getLesson('multiplication-2')!.examples![0]!;
    expect(example.example).toEqual({ operands: ['12', '12'], operation: 'multiplication' });
    expect(example.finalAnswer).toBe('144');
    expect(example.steps.map((step) => step.stageName)).toEqual(['First', 'Inside', 'Outside', 'Last']);
    expect(example.steps.map((step) => step.highlightedDigitRefs)).toEqual([
      ['left:0', 'right:0'], ['left:1', 'right:0'],
      ['left:0', 'right:1'], ['left:1', 'right:1'],
    ]);
    expect(example.steps.map((step) => step.operationDisplay)).toEqual([
      '1 × 1', '2 × 1', '1 × 2 = 2; 2 + 2', '2 × 2',
    ]);
    expect(example.steps.map((step) => step.intermediateResult)).toEqual(['1', '2', '4', '4']);
    expect(example.steps.map((step) => step.visibleResultDigits)).toEqual(['1□□', '1□□', '14□', '144']);
    for (const step of example.steps) {
      expect(step.carryIn).toBeUndefined();
      expect(step.carryOut).toBeUndefined();
      expect(step.carryFromStepId).toBeUndefined();
      expect(step.carryToStepId).toBeUndefined();
    }
    expect(1 * 2 + 2 * 1).toBe(4);
    expect(12 * 12).toBe(144);
  });

  it('records 18 × 18 in the confirmed order, then resolves both carry destinations to reach 324', () => {
    const example = getLesson('multiplication-2')!.examples![1]!;
    expect(example.example).toEqual({ operands: ['18', '18'], operation: 'multiplication' });
    expect(example.finalAnswer).toBe('324');
    expect(example.steps).toHaveLength(6);
    expect(example.steps.map((step) => step.stageName)).toEqual([
      'First', 'Inside', 'Outside', 'Last', 'Last', 'Last',
    ]);
    expect(example.steps.slice(0, 4).map((step) => step.highlightedDigitRefs)).toEqual([
      ['left:0', 'right:0'], ['left:1', 'right:0'],
      ['left:0', 'right:1'], ['left:1', 'right:1'],
    ]);
    expect(example.steps.map((step) => step.operationDisplay)).toEqual([
      '1 × 1', '8 × 1', '1 × 8 = 8; 8 + 8', '8 × 8', '16 + 6', '1 + 2',
    ]);
    expect(example.steps.map((step) => step.intermediateResult)).toEqual(['1', '8', '16', '64', '22', '3']);
    const [last, middleCarry, firstCarry] = example.steps.slice(3);
    expect(last!.visibleResultDigits).toBe('□□4');
    expect(last!.carryOut).toBe('6');
    expect(last!.carryToStepId).toBe(middleCarry!.id);
    expect(middleCarry!.visibleResultDigits).toBe('□24');
    expect(middleCarry!.carryIn).toBe('6');
    expect(middleCarry!.carryFromStepId).toBe(last!.id);
    expect(middleCarry!.carryOut).toBe('2');
    expect(middleCarry!.carryToStepId).toBe(firstCarry!.id);
    expect(firstCarry!.visibleResultDigits).toBe('324');
    expect(firstCarry!.carryIn).toBe('2');
    expect(firstCarry!.carryFromStepId).toBe(middleCarry!.id);
    expect(firstCarry!.carryOut).toBeUndefined();
    expect(middleCarry!.stepLabel).toBe('Carry to the middle');
    expect(firstCarry!.stepLabel).toBe('Complete the answer');
    expect(8 * 1 + 1 * 8).toBe(16);
    expect(8 * 8).toBe(64);
    expect(16 + 6).toBe(22);
    expect(1 + 2).toBe(3);
    expect(18 * 18).toBe(324);
  });

  it('omits one- and three-digit addition while retaining one-, two- and three-digit multiplication', () => {
    expect(lessons.every((lesson) => lesson.digitCount <= 3)).toBe(true);
    expect(getLesson('multiplication-3')?.digitCount).toBe(3);
    expect(getLesson('addition-1')).toBeUndefined();
    expect(getLesson('addition-3')).toBeUndefined();
    expect(lessons.filter((lesson) => lesson.operation === 'addition').map((lesson) => lesson.digitCount)).toEqual([2]);
    expect(lessons.filter((lesson) => lesson.operation === 'multiplication').map((lesson) => lesson.digitCount)).toEqual([1, 2, 3]);
    expect(getLesson('multiplication-4')).toBeUndefined();
    expect(getLesson('addition-4')).toBeUndefined();
  });

  it('keeps the two supplied instructional source representations equivalent', () => {
    const textSource = JSON.parse(readFileSync(new URL(
      '../../requirements/instruction/INSTRUCTIONAL_LESSON_DATA_as_text.txt', import.meta.url,
    ), 'utf8'));
    expect(textSource).toEqual(source);
  });
});
