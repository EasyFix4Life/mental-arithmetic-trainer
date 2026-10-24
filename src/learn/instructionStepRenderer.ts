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
  section.append(renderHorizontalExpression(example, digitCount, operation, step.highlightedDigitRefs));

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
    else entry.textContent = value;
    details.append(name, entry);
  }
  if (details.childElementCount > 0) section.append(details);
  const carry = renderCarry(step);
  if (carry !== null) section.append(carry);
  return section;
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
