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
  const currentLabel = step.stepLabel ?? step.stageName ?? step.navigationLabel ?? step.id;
  function route(kind: 'in' | 'out', value: string, origin: string, destination: string): void {
    const details = document.createElement('div');
    details.className = 'carry-route';
    details.dataset.routeKind = kind;
    details.setAttribute('role', 'group');
    details.setAttribute('aria-label', kind === 'in' ? 'Incoming carry' : 'Outgoing carry');
    const values = [
      ['From', origin, kind === 'in' ? 'carry-route-origin carry-from-step' : 'carry-route-origin'],
      [kind === 'in' ? 'Carry in' : 'Carry out', value, `carry-route-value carry-${kind}`],
      ['To', destination, kind === 'out' ? 'carry-route-destination carry-to-step' : 'carry-route-destination'],
    ] as const;
    for (const [index, [label, text, className]] of values.entries()) {
      if (index > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'carry-route-arrow';
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true');
        details.append(arrow);
      }
      const group = document.createElement('dl');
      const name = document.createElement('dt');
      name.textContent = label;
      const entry = document.createElement('dd');
      entry.className = className;
      entry.textContent = text;
      group.append(name, entry);
      details.append(group);
    }
    section.append(details);
  }
  if (step.carryIn !== undefined) route('in', step.carryIn,
    step.carryFromLabel ?? step.carryFromStepId ?? currentLabel, currentLabel);
  if (step.carryOut !== undefined) route('out', step.carryOut, currentLabel,
    step.carryToLabel ?? step.carryToStepId ?? currentLabel);
  // A source fragment may provide a route without a numerical carry. Keep it
  // explicit without manufacturing a value or connecting unprovided digits.
  if (step.carryIn === undefined && step.carryOut === undefined) {
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
  }
  return section;
}
