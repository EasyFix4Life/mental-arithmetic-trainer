import { renderCarry } from './carryVisualizer';
import type {
  InstructionalDigitCount,
  InstructionStep,
  LessonOperation,
  WorkedExample,
} from './lessonTypes';

export function renderHorizontalExpression(
  example: WorkedExample | null,
  digitCount: InstructionalDigitCount,
  operation: LessonOperation,
  highlightedRefs: readonly string[] | null,
): HTMLElement {
  const expression = document.createElement('div');
  expression.className = 'learn-expression';
  expression.classList.toggle('addition-expression', operation === 'addition');
  expression.setAttribute('role', 'img');
  const expressionLabel = example === null
    ? `${digitCount}-digit ${operation}: worked example pending`
    : `${example.operands[0]} ${operation === 'addition' ? 'plus' : 'times'} ${example.operands[1]}`;
  const selectedDigitDescriptions: string[] = [];

  const symbol = document.createElement('span');
  symbol.className = 'learn-operation';
  symbol.textContent = operation === 'addition' ? '+' : '×';

  for (const [operandIndex, side] of (['left', 'right'] as const).entries()) {
    const operand = document.createElement('span');
    operand.className = 'learn-operand';
    operand.dataset.side = side;
    operand.setAttribute('aria-hidden', 'true');
    const characters = example === null ? '□'.repeat(digitCount) : example.operands[operandIndex];
    for (const [index, character] of Array.from(characters).entries()) {
      const digit = document.createElement('span');
      digit.className = 'learn-digit';
      digit.textContent = character;
      if (example !== null) {
        const reference = `${side}:${index}`;
        digit.dataset.digitRef = reference;
        if (highlightedRefs?.includes(reference)) {
          digit.classList.add('digit-highlight');
          digit.title = 'Selected digit for this step';
          const spokenSide = operation === 'addition' ? (side === 'left' ? 'top' : 'bottom') : side;
          selectedDigitDescriptions.push(`${spokenSide} operand, position ${index + 1}, digit ${character}`);
        }
      } else {
        digit.classList.add('digit-placeholder');
      }
      operand.append(digit);
    }
    expression.append(operand);
    if (operandIndex === 0) expression.append(symbol);
  }
  if (operation === 'addition') {
    const rule = document.createElement('span');
    rule.className = 'addition-rule';
    rule.setAttribute('aria-hidden', 'true');
    expression.append(rule);
  }
  expression.setAttribute('aria-label', selectedDigitDescriptions.length > 0
    ? `${expressionLabel}. Selected digits: ${selectedDigitDescriptions.join('; ')}.`
    : expressionLabel);
  return expression;
}

/** A result view follows the four named instructions; it is not a fifth stage. */
export function renderFinalAnswer(
  example: WorkedExample,
  digitCount: InstructionalDigitCount,
  finalAnswer: string,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'instruction-step final-answer-step';
  const heading = document.createElement('h3');
  heading.textContent = 'Final answer';
  const expression = renderHorizontalExpression(example, digitCount, example.operation, []);
  expression.classList.add('final-answer-expression');
  const equals = document.createElement('span');
  equals.textContent = '=';
  equals.className = 'final-answer-equals';
  equals.setAttribute('aria-hidden', 'true');
  const result = document.createElement('span');
  result.className = 'final-answer-value';
  result.textContent = finalAnswer;
  result.setAttribute('aria-hidden', 'true');
  expression.append(equals, result);
  expression.setAttribute('aria-label', `${example.operands[0]} ${
    example.operation === 'addition' ? 'plus' : 'times'
  } ${example.operands[1]} equals ${finalAnswer}`);
  section.append(heading, expression);
  return section;
}

/** A shared data renderer: addition need not adopt multiplication's stage names. */
export function renderInstructionStep(
  step: InstructionStep,
  example: WorkedExample | null,
  digitCount: InstructionalDigitCount,
  operation: LessonOperation,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'instruction-step';
  section.dataset.stepId = step.id;
  if (step.stageName !== undefined) section.dataset.stageTone = step.stageName.toLowerCase();
  if (step.stageName !== undefined) {
    const title = document.createElement('h3');
    title.textContent = step.stageName;
    section.append(title);
  }
  if (step.stepLabel !== undefined) {
    const label = document.createElement('h4');
    label.className = 'step-label';
    label.textContent = step.stepLabel;
    section.append(label);
  }
  if (step.stageName === undefined && step.stepLabel === undefined && step.navigationLabel) {
    const heading = document.createElement('h3');
    heading.textContent = step.navigationLabel;
    section.append(heading);
  }
  const expression = renderHorizontalExpression(example, digitCount, operation, step.highlightedDigitRefs);
  if (example && connectsAuthoredPair(step, example)) {
    const diagram = document.createElement('div');
    diagram.className = 'pairing-diagram';
    diagram.classList.toggle('pairing-stacked', operation === 'addition');
    const connector = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    connector.classList.add('digit-pairing-connector');
    connector.setAttribute('aria-hidden', 'true');
    connector.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    connector.append(path);
    diagram.append(expression, connector);
    section.append(diagram);
  } else section.append(expression);

  if (step.highlightedDigitRefs === null) {
    const pending = document.createElement('p');
    pending.className = 'digit-selection-pending';
    pending.textContent = 'Digit selection pending.';
    section.append(pending);
  }

  if (step.narration !== undefined) {
    const narration = document.createElement('p');
    narration.className = 'step-narration';
    narration.textContent = step.narration;
    section.append(narration);
  }

  const fields = [
    ['Calculation', step.operationDisplay, 'step-operation'],
    ['Intermediate result', step.intermediateResult, 'step-intermediate-result'],
    ['Answer digits so far', step.visibleResultDigits, 'step-result-digits'],
  ] as const;
  const details = document.createElement('dl');
  details.className = 'step-calculations';
  for (const [label, value, className] of fields) {
    if (value === undefined) continue;
    const name = document.createElement('dt');
    name.textContent = label;
    const entry = document.createElement('dd');
    entry.className = className;
    if (className === 'step-operation') renderCalculation(entry, step);
    else if (className === 'step-result-digits') {
      entry.setAttribute('role', 'img');
      entry.setAttribute('aria-label', value);
      for (const character of value) {
        const digit = document.createElement('span');
        digit.className = character === '□' ? 'result-digit result-pending' : 'result-digit';
        digit.textContent = character;
        digit.setAttribute('aria-hidden', 'true');
        entry.append(digit);
      }
    } else entry.textContent = value;
    details.append(name, entry);
  }
  if (details.childElementCount > 0) section.append(details);
  const carry = renderCarry(step);
  if (carry !== null) section.append(carry);
  return section;
}

/** A connector requires exactly one existing pair and its displayed operation.
 * Carry sums and multi-product groups keep their authored highlights only. */
function connectsAuthoredPair(step: InstructionStep, example: WorkedExample): boolean {
  if (step.carryIn !== undefined || step.highlightedDigitRefs?.length !== 2) return false;
  const left = step.highlightedDigitRefs.find(ref => ref.startsWith('left:'));
  const right = step.highlightedDigitRefs.find(ref => ref.startsWith('right:'));
  if (!left || !right) return false;
  const first = example.operands[0][Number(left.split(':')[1])];
  const second = example.operands[1][Number(right.split(':')[1])];
  if (first === undefined || second === undefined) return false;
  const calculation = step.operationDisplay?.split(';')[0]?.split('=')[0]?.trim();
  return calculation === `${first} ${example.operation === 'addition' ? '+' : '×'} ${second}`;
}

/** Geometry follows only the references selected by connectsAuthoredPair. */
export function updatePairingConnectors(root: HTMLElement): void {
  for (const diagram of root.querySelectorAll<HTMLElement>('.pairing-diagram')) {
    const svg = diagram.querySelector<SVGSVGElement>('svg');
    const path = svg?.querySelector('path');
    const expression = diagram.querySelector<HTMLElement>('.learn-expression');
    const selected = [...diagram.querySelectorAll<HTMLElement>('.digit-highlight')];
    if (!svg || !path || !expression || selected.length < 2) continue;
    const box = diagram.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const positions = selected.map(digit => digit.getBoundingClientRect());
    if (diagram.classList.contains('pairing-stacked')) {
      const x = expression.getBoundingClientRect().right - box.left + 5;
      const top = Math.min(...positions.map(p => p.top + p.height / 2)) - box.top;
      const bottom = Math.max(...positions.map(p => p.top + p.height / 2)) - box.top;
      path.setAttribute('d', `M ${x} ${top} H ${x + 9} V ${bottom} H ${x}`);
      svg.dataset.pairingKind = 'stacked';
    } else {
      const left = Math.min(...positions.map(p => p.left + p.width / 2)) - box.left;
      const right = Math.max(...positions.map(p => p.left + p.width / 2)) - box.left;
      const top = expression.getBoundingClientRect().bottom - box.top + 2;
      path.setAttribute('d', `M ${left} ${top} V ${top + 8} H ${right} V ${top}`);
      svg.dataset.pairingKind = selected.length === 2 ? 'pair' : 'group';
    }
  }
}

/** Sum terms are stacked, including carry sums within a multiplication trace. */
function renderCalculation(root: HTMLElement, step: InstructionStep): void {
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', step.operationDisplay ?? '');
  let terms = step.calculationTerms;
  let prefix = step.calculationPrefix;
  if (!terms) {
    const pieces = step.operationDisplay?.split('; ') ?? [];
    const sum = pieces.at(-1)?.match(/^(\d+) \+ (\d+)$/);
    if (sum) {
      terms = [sum[1]!, sum[2]!];
      prefix = pieces.slice(0, -1).join('; ');
    }
  }
  if (!terms?.length) {
    root.textContent = step.operationDisplay ?? '';
    return;
  }
  root.setAttribute('aria-label', step.operationDisplay ?? terms.join(' + '));
  if (prefix) {
    const lead = document.createElement('div');
    lead.className = 'calculation-prefix';
    lead.textContent = prefix;
    root.append(lead);
  }
  const sum = document.createElement('span');
  sum.className = 'vertical-calculation';
  sum.setAttribute('aria-hidden', 'true');
  for (const [index, term] of terms.entries()) {
    const row = document.createElement('span');
    row.className = 'calculation-row';
    const operator = document.createElement('span');
    operator.textContent = index > 0 ? '+ ' : '';
    const value = document.createElement('span');
    value.textContent = term;
    row.append(operator, value);
    sum.append(row);
  }
  root.append(sum);
}
