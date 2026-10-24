import { getLesson, lessons } from './lessonCatalog';
import { renderFinalAnswer, renderHorizontalExpression, renderInstructionStep } from './instructionStepRenderer';
import { generateRandomProblem } from './randomExample';
import { createInstructionExample } from './positionalInstructions';
import type { AuthoredExample, Lesson } from './lessonTypes';

/** Learner-directed instruction. This module has no practice controller or clock. */
export function mountLearnView(root: HTMLElement): () => void {
  root.innerHTML = `
    <h1>Learn</h1>
    <div class="learn-shell">
      <nav id="lesson-catalog" class="lesson-catalog" aria-label="Lessons"></nav>
      <section class="lesson-detail" aria-labelledby="lesson-title">
        <h2 id="lesson-title"></h2>
        <p id="lesson-status" class="lesson-status"></p>
        <div class="example-actions">
          <div id="example-choice" class="example-choice" hidden>
            <label for="worked-example">Worked example</label>
            <select id="worked-example"></select>
          </div>
          <button id="random-example" type="button">New random example</button>
        </div>
        <div class="lesson-problem-row">
          <div id="lesson-expression"></div>
          <button id="lesson-help" class="lesson-help" type="button"
            aria-label="Open instructional walkthrough" aria-expanded="false"
            aria-controls="walkthrough">?</button>
        </div>
        <p id="example-status" class="example-status">Worked example pending.</p>
        <section id="walkthrough" class="walkthrough" aria-labelledby="walkthrough-heading" hidden>
          <div class="walkthrough-header">
            <h3 id="walkthrough-heading" tabindex="-1">Instructional walkthrough</h3>
            <button id="close-walkthrough" class="text-button" type="button">Close</button>
          </div>
          <p id="walkthrough-status" class="walkthrough-status"></p>
          <ol id="stage-sequence" class="stage-sequence" aria-label="Instruction stages"></ol>
          <div id="step-content" aria-live="polite" aria-atomic="true"></div>
          <div id="step-navigation" class="step-navigation">
            <button id="step-back" type="button">Back</button>
            <p id="step-position" aria-live="polite"></p>
            <button id="step-next" type="button">Next</button>
          </div>
        </section>
        <aside id="carry-fragment" class="carry-fragment" aria-labelledby="carry-fragment-title" hidden>
          <h3 id="carry-fragment-title">Recovered carry fragment</h3>
          <p id="carry-fragment-values" class="carry-fragment-values"></p>
          <p>The original operands and full worked trace are unavailable. This fragment is not assigned to a stage.</p>
        </aside>
      </section>
    </div>
  `;
  const find = <T extends HTMLElement>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Missing Learn element: ${selector}`);
    return node;
  };
  const catalog = find('#lesson-catalog');
  const title = find('#lesson-title');
  const status = find('#lesson-status');
  const exampleChoice = find('#example-choice');
  const exampleSelect = find<HTMLSelectElement>('#worked-example');
  const randomButton = find<HTMLButtonElement>('#random-example');
  const expression = find('#lesson-expression');
  const exampleStatus = find('#example-status');
  const help = find<HTMLButtonElement>('#lesson-help');
  const walkthrough = find('#walkthrough');
  const walkthroughHeading = find('#walkthrough-heading');
  const walkthroughStatus = find('#walkthrough-status');
  const close = find<HTMLButtonElement>('#close-walkthrough');
  const stageSequence = find('#stage-sequence');
  const content = find('#step-content');
  const stepNavigation = find('#step-navigation');
  const back = find<HTMLButtonElement>('#step-back');
  const next = find<HTMLButtonElement>('#step-next');
  const position = find('#step-position');
  const fragment = find('#carry-fragment');
  const fragmentValues = find('#carry-fragment-values');
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let selected: Lesson = lessons[0]!;
  let stepIndex = 0;
  let exampleIndex = -1;
  let open = false;
  let randomProblem = generateRandomProblem(selected.operation, selected.digitCount);
  let randomExample: AuthoredExample | undefined;

  function prepareRandomExample(): void {
    randomExample = createInstructionExample(selected.operation, selected.digitCount,
      Number(randomProblem.operands[0]), Number(randomProblem.operands[1]));
  }
  prepareRandomExample();
  const currentExample = () => exampleIndex < 0 ? randomExample : selected.examples?.[exampleIndex];
  const currentProblem = () => exampleIndex < 0 ? randomProblem : currentExample()?.example ?? selected.example;
  const currentSteps = () => currentExample()?.steps ?? selected.steps;
  const screenCount = () => currentSteps().length + (currentExample()?.finalAnswer !== undefined ? 1 : 0);

  function renderStep(): void {
    const steps = currentSteps();
    const problem = currentProblem();
    const step = steps[stepIndex];
    const finalAnswer = currentExample()?.finalAnswer;
    const isFinalAnswer = finalAnswer !== undefined && stepIndex === steps.length;
    stageSequence.replaceChildren();
    content.replaceChildren();
    stepNavigation.hidden = !step && !isFinalAnswer;
    stageSequence.hidden = !steps.some((item) => item.stageName || item.navigationLabel) && finalAnswer === undefined;
    walkthroughStatus.textContent = steps.length && problem
      ? ''
      : steps.length
        ? 'Structural preview: the full worked example, digit selections and carry destinations are pending.'
        : 'The authored instructional steps for this lesson are pending.';
    walkthroughStatus.hidden = Boolean(problem && steps.length);

    // Carry resolution can take several screens within Last. The final-answer
    // result item follows the four named instructions.
    const renderedStages = new Set<string>();
    for (const [index, item] of steps.entries()) {
      const label = item.stageName ?? item.navigationLabel;
      if (!label || renderedStages.has(label)) continue;
      renderedStages.add(label);
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.stageName = label;
      if (label === (step?.stageName ?? step?.navigationLabel)) button.setAttribute('aria-current', 'step');
      button.addEventListener('click', () => {
        stepIndex = index;
        renderStep();
        stageSequence.querySelector<HTMLButtonElement>(`[data-stage-name="${label}"]`)?.focus();
      });
      li.append(button);
      stageSequence.append(li);
    }
    if (finalAnswer !== undefined) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'final-answer';
      button.dataset.finalAnswer = finalAnswer;
      button.textContent = `Final answer: ${finalAnswer}`;
      if (isFinalAnswer) button.setAttribute('aria-current', 'step');
      button.addEventListener('click', () => {
        stepIndex = steps.length;
        renderStep();
        stageSequence.querySelector<HTMLButtonElement>('#final-answer')?.focus();
      });
      li.append(button);
      stageSequence.append(li);
    }
    if (isFinalAnswer && problem) content.append(renderFinalAnswer(problem, selected.digitCount, finalAnswer));
    else if (step) content.append(renderInstructionStep(
      step, problem, selected.digitCount, selected.operation,
    ));
    position.textContent = step || isFinalAnswer ? `${stepIndex + 1} / ${screenCount()}` : '';
    back.disabled = stepIndex <= 0;
    next.disabled = stepIndex >= screenCount() - 1;
  }

  function setOpen(value: boolean, moveFocus = false): void {
    open = value;
    walkthrough.hidden = !open;
    help.setAttribute('aria-expanded', String(open));
    // The active step renders the expression while the walkthrough is open.
    expression.hidden = open && currentSteps().length > 0;
    renderStep();
    if (moveFocus) {
      if (open) walkthroughHeading.focus();
      else help.focus();
    }
  }

  function renderLesson(): void {
    title.textContent = selected.title;
    status.textContent = 'Open the walkthrough to explore this example.';
    exampleChoice.hidden = !selected.examples?.length;
    exampleSelect.replaceChildren();
    if (selected.examples?.length) {
      const option = document.createElement('option');
      option.value = 'random';
      option.textContent = `Random: ${randomProblem.operands[0]} × ${randomProblem.operands[1]}`;
      exampleSelect.append(option);
    }
    for (const example of selected.examples ?? []) {
      const option = document.createElement('option');
      option.value = example.id;
      option.textContent = example.title;
      exampleSelect.append(option);
    }
    exampleSelect.value = exampleIndex < 0 ? 'random' : currentExample()?.id ?? '';
    expression.replaceChildren(renderHorizontalExpression(
      currentProblem(), selected.digitCount, selected.operation, null,
    ));
    exampleStatus.hidden = currentProblem() !== null;
    fragment.hidden = !selected.carryFragment;
    fragmentValues.textContent = selected.carryFragment
      ? `${selected.carryFragment.intermediateProduct}: write ${selected.carryFragment.recordDigit}, carry ${selected.carryFragment.carry}`
      : '';
    for (const button of catalog.querySelectorAll<HTMLButtonElement>('[data-lesson-id]')) {
      if (button.dataset.lessonId === selected.id) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    setOpen(false);
  }

  for (const lesson of lessons) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = lesson.title;
    button.dataset.lessonId = lesson.id;
    button.addEventListener('click', () => {
      const target = getLesson(lesson.id);
      if (!target) return;
      const previousProblem = currentProblem();
      selected = target;
      stepIndex = 0;
      exampleIndex = -1;
      randomProblem = generateRandomProblem(selected.operation, selected.digitCount,
        previousProblem?.operation === selected.operation && previousProblem.operands[0].length === selected.digitCount
          ? previousProblem : undefined);
      prepareRandomExample();
      renderLesson();
    }, options);
    catalog.append(button);
  }
  help.addEventListener('click', () => setOpen(!open, true), options);
  function newRandomExample(): void {
    const wasOpen = open;
    randomProblem = generateRandomProblem(selected.operation, selected.digitCount, currentProblem());
    prepareRandomExample();
    exampleIndex = -1;
    stepIndex = 0;
    renderLesson();
    setOpen(wasOpen);
  }
  randomButton.addEventListener('click', () => {
    newRandomExample();
    randomButton.focus();
  }, options);
  exampleSelect.addEventListener('change', () => {
    if (exampleSelect.value === 'random') {
      newRandomExample();
      exampleSelect.focus();
      return;
    }
    const index = selected.examples?.findIndex((example) => example.id === exampleSelect.value) ?? -1;
    if (index < 0) return;
    const wasOpen = open;
    exampleIndex = index;
    stepIndex = 0;
    renderLesson();
    setOpen(wasOpen);
    exampleSelect.focus();
  }, options);
  close.addEventListener('click', () => setOpen(false, true), options);
  walkthrough.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
  }, options);
  back.addEventListener('click', () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderStep();
      if (back.disabled) next.focus();
    }
  }, options);
  next.addEventListener('click', () => {
    if (stepIndex < screenCount() - 1) {
      stepIndex += 1;
      renderStep();
      if (next.disabled) back.focus();
    }
  }, options);
  renderLesson();
  return () => { listeners.abort(); root.replaceChildren(); };
}
