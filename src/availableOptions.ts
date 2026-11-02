import type { DigitCount, Operation, Settings } from './types';

/** App offerings are separate from the arithmetic engine and historical fixtures. */
const digitCounts: Readonly<Record<Operation, readonly DigitCount[]>> = Object.freeze({
  addition: Object.freeze([2] as const),
  multiplication: Object.freeze([1, 2, 3] as const),
});

export const DEFAULT_SETTINGS: Settings = Object.freeze({ operation: 'addition', digitCount: 2 });

export function availableDigitCounts(operation: Operation): readonly DigitCount[] {
  return digitCounts[operation];
}

export function isAvailableSettings(settings: Settings): boolean {
  return digitCounts[settings.operation]?.includes(settings.digitCount) ?? false;
}

/** Switching from one-/three-digit multiplication to addition selects two digits. */
export function normalizeAvailableSettings(settings: Settings): Settings {
  return {
    operation: settings.operation,
    digitCount: isAvailableSettings(settings) ? settings.digitCount : availableDigitCounts(settings.operation)[0]!,
  };
}
