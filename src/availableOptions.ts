import type { DigitCount, Operation, Settings } from './types';

/** Practice offerings are separate from the arithmetic engine and historical fixtures. */
const digitCounts: Readonly<Record<Operation, readonly DigitCount[]>> = Object.freeze({
  addition: Object.freeze([2] as const),
  multiplication: Object.freeze([1, 2] as const),
});
const learnMultiplicationDigits: readonly DigitCount[] = Object.freeze([1, 2] as const);

export const DEFAULT_SETTINGS: Settings = Object.freeze({ operation: 'addition', digitCount: 2 });

export function availableDigitCounts(operation: Operation): readonly DigitCount[] {
  return digitCounts[operation];
}

export function isAvailableSettings(settings: Settings): boolean {
  return digitCounts[settings.operation]?.includes(settings.digitCount) ?? false;
}

/** Learn has its own offering policy; two-digit addition remains Practice-only. */
export function isAvailableLearnSettings(settings: Settings): boolean {
  return settings.operation === 'multiplication' && learnMultiplicationDigits.includes(settings.digitCount);
}

/** Preserve a valid length; normalize unavailable lengths within the operation. */
export function normalizeAvailableSettings(settings: Settings): Settings {
  return {
    operation: settings.operation,
    digitCount: isAvailableSettings(settings) ? settings.digitCount : availableDigitCounts(settings.operation)[0]!,
  };
}
