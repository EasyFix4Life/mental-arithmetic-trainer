import { describe, expect, it, vi } from 'vitest';
import { availableDigitCounts, DEFAULT_SETTINGS, isAvailableSettings, normalizeAvailableSettings } from '../../src/availableOptions';
import { RoundController } from '../../src/roundController';
import type { DigitCount } from '../../src/types';

describe('available app options', () => {
  it('defaults to two-digit addition and offers exactly four operation/length combinations', () => {
    expect(DEFAULT_SETTINGS).toEqual({ operation: 'addition', digitCount: 2 });
    expect(new RoundController().snapshot.settings).toEqual(DEFAULT_SETTINGS);
    expect(availableDigitCounts('addition')).toEqual([2]);
    expect(availableDigitCounts('multiplication')).toEqual([1, 2, 3]);
    for (const digitCount of [1, 2, 3] as const) {
      expect(isAvailableSettings({ operation: 'addition', digitCount })).toBe(digitCount === 2);
      expect(isAvailableSettings({ operation: 'multiplication', digitCount })).toBe(true);
    }
  });

  it.each([1, 2, 3] as const)('normalizes addition from %i digits to two and preserves multiplication', (digitCount) => {
    expect(normalizeAvailableSettings({ operation: 'addition', digitCount })).toEqual(DEFAULT_SETTINGS);
    expect(normalizeAvailableSettings({ operation: 'multiplication', digitCount })).toEqual({
      operation: 'multiplication', digitCount,
    });
  });

  it.each([1, 3] as const)('rejects unavailable %i-digit addition before generation or changing the current round', (digitCount: DigitCount) => {
    const generate = vi.fn();
    const controller = new RoundController({ generate });
    const before = controller.snapshot;
    expect(() => controller.start({ operation: 'addition', digitCount })).toThrow(/two-digit/);
    expect(generate).not.toHaveBeenCalled();
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
