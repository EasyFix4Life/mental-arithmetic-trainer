import type { InstructionStep } from './lessonTypes';

/** Render only values and routes present in the authored step. No motion or arithmetic. */
export function renderCarry(step: InstructionStep): HTMLElement | null {
  const fields = [
    ['Carry in', step.carryIn, 'carry-in'],
    ['Carry out', step.carryOut, 'carry-out'],
    ['From', step.carryFromLabel ?? step.carryFromStepId, 'carry-from-step'],
    ['To', step.carryToLabel ?? step.carryToStepId, 'carry-to-step'],
  ] as const;
  if (fields.every(([, value]) => value === undefined)) return null;

  const section = document.createElement('section');
  section.className = 'carry-visualizer';
  section.setAttribute('aria-label', 'Carry information');
  const details = document.createElement('dl');
  for (const [label, value, className] of fields) {
    if (value === undefined) continue;
    const name = document.createElement('dt');
    name.textContent = label;
    const entry = document.createElement('dd');
    entry.className = className;
    entry.textContent = value;
    details.append(name, entry);
  }
  section.append(details);
  return section;
}
