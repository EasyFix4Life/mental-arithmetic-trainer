/**
 * Provisional policies from PRODUCT_SPEC sections 4 and 6.
 * Each transaction belongs to the problem active WHEN THAT EVENT ARRIVES.
 * Separate physical keystrokes after a submission therefore reach the next
 * problem. This deliberately does not resolve the owner's attribution question.
 * No grace period, swallowed keys, or retroactive changes to completed answers.
 */
export const inputPolicy = {
  afterSubmission: 'current-problem',
  allowPartialBackspace: true,
} as const;

export function isDecimalEntry(value: string): boolean {
  return /^[0-9]*$/.test(value);
}

/** Reject invalid transactions whole; never strip formatting into a correct answer. */
export function insertDigits(
  current: string,
  inserted: string,
  selectionStart: number,
  selectionEnd: number,
): string | null {
  if (!isDecimalEntry(inserted)) return null;
  return current.slice(0, selectionStart) + inserted + current.slice(selectionEnd);
}
