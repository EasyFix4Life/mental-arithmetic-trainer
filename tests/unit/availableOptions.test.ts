import { describe, expect, it, vi } from 'vitest';
import { availableDigitCounts, DEFAULT_SETTINGS, isAvailableSettings, isAvailableLearnSettings, normalizeAvailableSettings } from '../../src/availableOptions';
import { RoundController } from '../../src/roundController';

describe('available app options', () => {
  it('defaults to two-digit addition and offers exactly three Practice operation/length combinations', () => {
    expect(DEFAULT_SETTINGS).toEqual({ operation: 'addition', digitCount: 2 });
    expect(new RoundController().snapshot.settings).toEqual(DEFAULT_SETTINGS);
    expect(availableDigitCounts('addition')).toEqual([2]);
    expect(availableDigitCounts('multiplication')).toEqual([1, 2]);
    for (const digitCount of [1, 2, 3] as const) {
      expect(isAvailableSettings({ operation: 'addition', digitCount })).toBe(digitCount === 2);
      expect(isAvailableSettings({ operation: 'multiplication', digitCount })).toBe(digitCount <= 2);
      expect(isAvailableLearnSettings({ operation: 'addition', digitCount })).toBe(false);
      expect(isAvailableLearnSettings({ operation: 'multiplication', digitCount })).toBe(digitCount <= 2);
    }
  });

  it.each([1, 2, 3] as const)('normalizes unavailable lengths while preserving valid operation lengths from %i digits', (digitCount) => {
    expect(normalizeAvailableSettings({ operation: 'addition', digitCount })).toEqual(DEFAULT_SETTINGS);
    expect(normalizeAvailableSettings({ operation: 'multiplication', digitCount })).toEqual({
      operation: 'multiplication', digitCount: digitCount === 3 ? 1 : digitCount,
    });
  });

  it.each([{ operation: 'addition', digitCount: 1 }, { operation: 'addition', digitCount: 3 },
    { operation: 'multiplication', digitCount: 3 }] as const)('rejects unavailable $operation/$digitCount before generation or changing the current round', ({ operation, digitCount }) => {
    const generate = vi.fn();
    const controller = new RoundController({ generate });
    const before = controller.snapshot;
    expect(() => controller.start({ operation, digitCount })).toThrow(/two-digit/);
    expect(generate).not.toHaveBeenCalled();
    expect(controller.snapshot).toBe(before);
  });

  it('keeps two-digit addition available to Practice while excluding it from Learn', () => {
    expect(isAvailableSettings(DEFAULT_SETTINGS)).toBe(true);
    expect(isAvailableLearnSettings(DEFAULT_SETTINGS)).toBe(false);
    const controller = new RoundController();
    controller.start(DEFAULT_SETTINGS);
    expect(controller.snapshot.problem?.operation).toBe('addition');
    const before = controller.snapshot;
    expect(() => controller.start({ operation: 'multiplication', digitCount: 3 })).toThrow(/one- or two-digit/);
    expect(controller.snapshot).toBe(before);
  });

  it('still starts every available app option with correctly sized operands', () => {
    for (const operation of ['addition', 'multiplication'] as const) {
      for (const digitCount of availableDigitCounts(operation)) {
        const controller = new RoundController();
        controller.start({ operation, digitCount });
        expect(controller.snapshot.settings).toEqual({ operation, digitCount });
        expect(controller.snapshot.problem?.operands.every((value) => String(value).length === digitCount)).toBe(true);
      }
    }
  });
});
