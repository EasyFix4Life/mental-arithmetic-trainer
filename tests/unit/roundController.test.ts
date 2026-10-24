import { describe, expect, it } from 'vitest';
import { correctAnswer, expectedDigits } from '../../src/answerPolicy';
import { RoundController, scoreText } from '../../src/roundController';
import type { Problem, Settings } from '../../src/types';
import { requirements } from './requirements';

const settings: Settings = { operation: 'multiplication', digitCount: 2 };

function fixtureRound(): readonly Problem[] {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `reused-generator-id-${index}`,
    operation: 'multiplication' as const,
    operands: [10, 10 + index] as const,
  }));
}

function setup() {
  let now = 1000.25;
  let generationCalls = 0;
  const controller = new RoundController({
    clock: () => now,
    generate: () => {
      generationCalls += 1;
      return fixtureRound();
    },
  });
  return {
    controller,
    advance: (elapsed: number) => { now += elapsed; },
    generationCalls: () => generationCalls,
  };
}

function activeProblem(controller: RoundController): Problem {
  const problem = controller.snapshot.problem;
  expect(problem).not.toBeNull();
  return problem!;
}

describe('supplied score displays', () => {
  it.each(requirements.roundScoringCases)('$correctCount correct displays $display', (row) => {
    expect(scoreText(row.correctCount)).toBe(row.display);
  });
});

describe('round controller sequencing and timing', () => {
  it('stays idle until manual start, then generates one complete round before problem one', () => {
    const { controller, generationCalls } = setup();
    expect(controller.snapshot.phase).toBe('idle');
    expect(controller.snapshot.problem).toBeNull();
    expect(generationCalls()).toBe(0);
    expect(controller.submit('no-active-problem', '100')).toBe(false);

    controller.start(settings);
    expect(generationCalls()).toBe(1);
    expect(controller.snapshot).toMatchObject({
      phase: 'active', settings, index: 0, answeredCount: 0, correctCount: 0, previous: null,
    });
    expect(controller.elapsed()).toBe(0);
    expect(activeProblem(controller).operands).toEqual([10, 10]);
  });

  it('incomplete and invalid input never scores or resets the running timer', () => {
    const { controller, advance } = setup();
    controller.start(settings);
    const first = activeProblem(controller);
    advance(234.567);
    for (const input of ['', '1', '10', '99', '100x', '100\n', '+100', '１００']) {
      expect(controller.submit(first.id, input)).toBe(false);
      expect(controller.snapshot).toMatchObject({
        phase: 'active', index: 0, answeredCount: 0, correctCount: 0, previous: null,
      });
      expect(activeProblem(controller).id).toBe(first.id);
    }
    expect(controller.elapsed()).toBeCloseTo(234.567, 8);
    advance(100);
    expect(controller.elapsed()).toBeCloseTo(334.567, 8);
  });

  it('right and wrong full-length submissions synchronously advance and retain the previous duration', () => {
    const { controller, advance } = setup();
    controller.start(settings);
    const first = activeProblem(controller);
    advance(1234.567);
    expect(controller.submit(first.id, '100')).toBe(true);
    expect(controller.snapshot).toMatchObject({
      phase: 'active', index: 1, answeredCount: 1, correctCount: 1,
      previous: { correct: true },
    });
    expect(controller.snapshot.previous?.elapsedMs).toBeCloseTo(1234.567, 8);
    expect(controller.elapsed()).toBe(0);
    const second = activeProblem(controller);
    expect(second.id).not.toBe(first.id);
    advance(456.789);
    expect(controller.snapshot.previous?.correct).toBe(true);
    expect(controller.snapshot.previous?.elapsedMs).toBeCloseTo(1234.567, 8);
    expect(controller.submit(second.id, '999')).toBe(true);
    expect(controller.snapshot).toMatchObject({
      phase: 'active', index: 2, answeredCount: 2, correctCount: 1,
      previous: { correct: false },
    });
    expect(controller.snapshot.previous?.elapsedMs).toBeCloseTo(456.789, 8);
    expect(controller.elapsed()).toBe(0);
  });

  it('leading zeros and an atomic overlong correct-prefix paste each score wrong and advance once', () => {
    const { controller } = setup();
    controller.start(settings);
    for (const input of ['010', '1109']) {
      const problem = activeProblem(controller);
      expect(controller.submit(problem.id, input)).toBe(true);
      expect(controller.snapshot.previous?.correct).toBe(false);
    }
    expect(controller.snapshot.answeredCount).toBe(2);
    expect(controller.snapshot.correctCount).toBe(0);
  });

  it('ignores duplicate and stale callbacks without scoring the next problem', () => {
    const { controller, advance } = setup();
    controller.start(settings);
    const first = activeProblem(controller);
    expect(controller.submit(first.id, correctAnswer(first))).toBe(true);
    const second = activeProblem(controller);
    advance(125);
    expect(controller.submit(first.id, '100')).toBe(false);
    expect(controller.submit('unknown-problem', '110')).toBe(false);
    expect(controller.snapshot.answeredCount).toBe(1);
    expect(activeProblem(controller).id).toBe(second.id);
    expect(controller.elapsed()).toBe(125);
  });

  it('scores exactly ten, never exposes problem eleven, and waits for explicit restart', () => {
    const { controller, advance, generationCalls } = setup();
    controller.start(settings);
    let lastProblem: Problem | undefined;
    for (let index = 0; index < 10; index += 1) {
      const problem = activeProblem(controller);
      lastProblem = problem;
      expect(controller.snapshot.index).toBe(index);
      advance(101.25 + index);
      const input = index < 7 ? correctAnswer(problem) : '0'.repeat(expectedDigits(problem));
      expect(controller.submit(problem.id, input)).toBe(true);
      expect(controller.snapshot.answeredCount).toBe(index + 1);
      expect(controller.snapshot.phase).toBe(index === 9 ? 'finished' : 'active');
    }
    expect(controller.snapshot.problem).toBeNull();
    expect(controller.snapshot.correctCount).toBe(7);
    expect(scoreText(controller.snapshot.correctCount)).toBe('7 / 10');
    expect(controller.submit(lastProblem!.id, correctAnswer(lastProblem!))).toBe(false);
    const finished = controller.snapshot;
    advance(60_000);
    expect(controller.snapshot).toEqual(finished);
    expect(generationCalls()).toBe(1);

    controller.start(settings);
    expect(generationCalls()).toBe(2);
    expect(controller.snapshot).toMatchObject({
      phase: 'active', index: 0, answeredCount: 0, correctCount: 0, previous: null,
    });
    expect(controller.elapsed()).toBe(0);
  });

  it('rejects callbacks from a previous round even when an injected generator reuses its IDs', () => {
    const { controller } = setup();
    controller.start(settings);
    const beforeRestart = activeProblem(controller);
    controller.start(settings);
    const afterRestart = activeProblem(controller);
    expect(afterRestart.operands).toEqual(beforeRestart.operands);
    expect(afterRestart.id).not.toBe(beforeRestart.id);
    expect(controller.submit(beforeRestart.id, correctAnswer(beforeRestart))).toBe(false);
    expect(controller.snapshot.answeredCount).toBe(0);
    expect(controller.submit(afterRestart.id, correctAnswer(afterRestart))).toBe(true);
    expect(controller.snapshot.answeredCount).toBe(1);
  });
});
