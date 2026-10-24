import { describe, expect, it } from 'vitest';
import { correctAnswer, expectedDigits } from '../../src/answerPolicy';
import { RoundController } from '../../src/roundController';
import type { Problem, Settings } from '../../src/types';

const settings: Settings = { operation: 'multiplication', digitCount: 2 };

function setup() {
  let now = 1000.25;
  const controller = new RoundController({
    clock: () => now,
    generate: () => Array.from({ length: 10 }, (_, index): Problem => ({
      id: `fixture-${index}`,
      operation: 'multiplication',
      operands: [10, 10 + index],
    })),
  });
  return { controller, advance: (elapsedMs: number) => { now += elapsedMs; } };
}

function activeProblem(controller: RoundController): Problem {
  const problem = controller.snapshot.problem;
  expect(problem).not.toBeNull();
  return problem!;
}

describe('completed round timing summary', () => {
  it('summarizes all ten high-resolution durations, including incorrect answers, only on completion', () => {
    const { controller, advance } = setup();
    const durations = [99.25, 211.5, 78.75, 455.125, 300.875, 100.25, 600.5, 199.75, 805.125, 149.875];
    expect(controller.snapshot.timingSummary).toBeNull();
    controller.start(settings);

    for (let index = 0; index < durations.length; index += 1) {
      expect(controller.snapshot.timingSummary).toBeNull();
      const problem = activeProblem(controller);
      advance(durations[index]!);
      const input = index % 2 === 0 ? correctAnswer(problem) : '0'.repeat(expectedDigits(problem));
      expect(controller.submit(problem.id, input)).toBe(true);
      if (index < 9) expect(controller.snapshot.timingSummary).toBeNull();
    }

    expect(controller.snapshot.phase).toBe('finished');
    expect(controller.snapshot.correctCount).toBe(5);
    expect(controller.snapshot.timingSummary).toEqual({
      minimumMs: 78.75,
      maximumMs: 805.125,
      averageMs: 300.1,
    });
  });

  it('does not sample partial, invalid, duplicate, or stale submissions or reset their active timer', () => {
    const { controller, advance } = setup();
    controller.start(settings);
    const first = activeProblem(controller);
    advance(25.5);
    const initial = controller.snapshot;
    for (const input of ['', '1', '10', '100x']) {
      expect(controller.submit(first.id, input)).toBe(false);
      expect(controller.snapshot).toBe(initial);
    }
    advance(99.5);
    expect(controller.submit(first.id, correctAnswer(first))).toBe(true);

    advance(50);
    const afterFirst = controller.snapshot;
    expect(controller.submit(first.id, correctAnswer(first))).toBe(false);
    expect(controller.submit('unknown-problem', '110')).toBe(false);
    expect(controller.snapshot).toBe(afterFirst);
    advance(200);
    const second = activeProblem(controller);
    expect(controller.submit(second.id, correctAnswer(second))).toBe(true);

    for (let index = 2; index < 10; index += 1) {
      const problem = activeProblem(controller);
      advance(375);
      expect(controller.submit(problem.id, correctAnswer(problem))).toBe(true);
    }

    expect(controller.snapshot.answeredCount).toBe(10);
    expect(controller.snapshot.timingSummary).toEqual({
      minimumMs: 125,
      maximumMs: 375,
      averageMs: (125 + 250 + 8 * 375) / 10,
    });
  });

  it('keeps the completed summary immutable and stable across elapsed reads and rejected submissions', () => {
    const { controller, advance } = setup();
    controller.start(settings);
    let lastProblem: Problem | undefined;
    for (let index = 0; index < 10; index += 1) {
      lastProblem = activeProblem(controller);
      advance(100.25 + index);
      expect(controller.submit(lastProblem.id, correctAnswer(lastProblem))).toBe(true);
    }

    const completed = controller.snapshot;
    const summary = completed.timingSummary;
    expect(Object.isFrozen(completed)).toBe(true);
    expect(Object.isFrozen(summary)).toBe(true);
    advance(60_000);
    expect(controller.elapsed()).toBe(0);
    expect(controller.submit(lastProblem!.id, correctAnswer(lastProblem!))).toBe(false);
    expect(controller.snapshot).toBe(completed);
    expect(controller.snapshot.timingSummary).toBe(summary);
    expect(summary).toEqual({ minimumMs: 100.25, maximumMs: 109.25, averageMs: 104.75 });
  });

  it('clears the old summary and samples on explicit restart without accepting callbacks from the old round', () => {
    const { controller, advance } = setup();
    controller.start(settings);
    const staleProblem = activeProblem(controller);
    for (let index = 0; index < 10; index += 1) {
      const problem = activeProblem(controller);
      advance(1000);
      expect(controller.submit(problem.id, correctAnswer(problem))).toBe(true);
    }
    const firstSummary = controller.snapshot.timingSummary;

    controller.start(settings);
    expect(controller.snapshot.timingSummary).toBeNull();
    expect(controller.submit(staleProblem.id, correctAnswer(staleProblem))).toBe(false);
    expect(controller.snapshot.answeredCount).toBe(0);
    for (let index = 0; index < 10; index += 1) {
      const problem = activeProblem(controller);
      advance(125.5);
      expect(controller.submit(problem.id, correctAnswer(problem))).toBe(true);
    }

    expect(firstSummary).toEqual({ minimumMs: 1000, maximumMs: 1000, averageMs: 1000 });
    expect(controller.snapshot.timingSummary).toEqual({
      minimumMs: 125.5,
      maximumMs: 125.5,
      averageMs: 125.5,
    });
    expect(controller.snapshot.timingSummary).not.toBe(firstSummary);
  });
});
