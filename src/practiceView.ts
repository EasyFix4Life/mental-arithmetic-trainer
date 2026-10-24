import { inputPolicy, insertDigits, isDecimalEntry } from './inputPolicy';
import { RoundController, scoreText } from './roundController';
import { formatTenths } from './timer';
import type { DigitCount, Operation } from './types';

/** The view contains no arithmetic or lesson logic; the controller owns scoring. */
export function mountPracticeView(
  root: HTMLElement,
  controller: RoundController,
  onActiveChange?: (active: boolean) => void,
): () => void {
  root.innerHTML = `
    <section id="setup" class="setup" aria-labelledby="setup-title">
      <h1 id="setup-title">Mental Arithmetic</h1>
      <p id="score" class="score" aria-label="Round score" hidden></p>
      <dl id="round-timing" class="round-timing" aria-label="Round answer times" hidden>
        <div><dt>Maximum time</dt><dd id="maximum-time"></dd></div>
        <div><dt>Minimum time</dt><dd id="minimum-time"></dd></div>
        <div><dt>Average time</dt><dd id="average-time"></dd></div>
      </dl>
      <div class="settings">
        <div class="setting">
          <label for="operation">Operation</label>
          <select id="operation">
            <option value="addition">Addition</option>
            <option value="multiplication">Multiplication</option>
          </select>
        </div>
        <div class="setting">
          <label for="digit-count">Digits per operand</label>
          <select id="digit-count">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
      </div>
      <button id="start" type="button">Start</button>
    </section>
    <section id="exercise" class="exercise" aria-label="Arithmetic practice" hidden>
      <output id="previous-time" class="previous-time" aria-live="off" hidden></output>
      <p id="problem" class="problem" aria-live="polite" aria-atomic="true">
        <span id="left-operand"></span>
        <span id="operator" aria-hidden="true"></span>
        <span id="right-operand"></span>
      </p>
      <div id="answer-area" class="answer-area">
        <input id="answer" class="answer" type="text" inputmode="numeric"
          pattern="[0-9]*" autocomplete="off" autocapitalize="off" spellcheck="false"
          aria-label="Answer" />
        <output id="live-time" class="live-time" role="timer" aria-live="off"
          aria-label="Current elapsed seconds">0.0</output>
      </div>
    </section>
  `;

  const find = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing view element: ${selector}`);
    return element;
  };
  const setup = find('#setup');
  const title = find('#setup-title');
  const exercise = find('#exercise');
  const score = find('#score');
  const roundTiming = find('#round-timing');
  const maximumTime = find('#maximum-time');
  const minimumTime = find('#minimum-time');
  const averageTime = find('#average-time');
  const operation = find<HTMLSelectElement>('#operation');
  const digitCount = find<HTMLSelectElement>('#digit-count');
  const start = find<HTMLButtonElement>('#start');
  const problem = find('#problem');
  const left = find('#left-operand');
  const right = find('#right-operand');
  const operator = find('#operator');
  const answer = find<HTMLInputElement>('#answer');
  const previous = find<HTMLOutputElement>('#previous-time');
  const live = find<HTMLOutputElement>('#live-time');
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let frame = 0;
  let lastAcceptedValue = '';

  // Safari can resize only the visual viewport when the numeric keyboard opens.
  // Keep both corner timers and the answer inside that visible area.
  function syncViewport(): void {
    const viewport = window.visualViewport;
    root.style.setProperty('--practice-height', `${viewport?.height ?? window.innerHeight}px`);
    root.style.setProperty('--practice-top', `${viewport?.offsetTop ?? 0}px`);
  }
  syncViewport();
  window.addEventListener('resize', syncViewport, options);
  window.visualViewport?.addEventListener('resize', syncViewport, options);
  window.visualViewport?.addEventListener('scroll', syncViewport, options);

  function focusAnswer(): void {
    if (controller.snapshot.phase === 'active') answer.focus({ preventScroll: true });
  }

  function tick(): void {
    if (controller.snapshot.phase !== 'active') return;
    const nextTime = formatTenths(controller.elapsed());
    if (live.textContent !== nextTime) live.textContent = nextTime;
    frame = requestAnimationFrame(tick);
  }

  function render(): void {
    cancelAnimationFrame(frame);
    const state = controller.snapshot;
    const active = state.phase === 'active' && state.problem !== null;
    setup.hidden = active;
    exercise.hidden = !active;
    answer.disabled = !active;
    answer.value = '';
    lastAcceptedValue = '';
    live.textContent = '0.0';
    previous.hidden = !active || !state.previous;
    previous.textContent = '';
    const summary = state.phase === 'finished' ? state.timingSummary : null;
    roundTiming.hidden = summary === null;
    maximumTime.textContent = summary ? `${formatTenths(summary.maximumMs)} s` : '';
    minimumTime.textContent = summary ? `${formatTenths(summary.minimumMs)} s` : '';
    averageTime.textContent = summary ? `${formatTenths(summary.averageMs)} s` : '';

    if (active && state.problem) {
      syncViewport();
      const symbol = state.problem.operation === 'addition' ? '+' : '×';
      problem.classList.toggle('vertical-addition', state.problem.operation === 'addition');
      left.textContent = String(state.problem.operands[0]);
      right.textContent = String(state.problem.operands[1]);
      operator.textContent = symbol;
      problem.setAttribute('aria-label', `${state.problem.operands[0]} ${
        state.problem.operation === 'addition' ? 'plus' : 'times'
      } ${state.problem.operands[1]}`);
      answer.dataset.problemId = state.problem.id;
      if (state.previous) {
        const time = formatTenths(state.previous.elapsedMs);
        previous.textContent = time;
        previous.classList.toggle('incorrect', !state.previous.correct);
        previous.setAttribute('aria-label', `Previous answer ${
          state.previous.correct ? 'correct' : 'incorrect'
        }, ${time} seconds`);
      }
      focusAnswer();
      frame = requestAnimationFrame(tick);
    } else {
      delete answer.dataset.problemId;
      const finished = state.phase === 'finished';
      score.hidden = !finished;
      title.hidden = finished;
      score.textContent = finished ? scoreText(state.correctCount) : '';
      start.textContent = finished ? 'Start Another Round' : 'Start';
      if (finished) start.focus({ preventScroll: true });
    }
    onActiveChange?.(active);
  }

  function acceptTransaction(value: string): void {
    const id = answer.dataset.problemId;
    if (!id || controller.snapshot.phase !== 'active') return;
    if (!isDecimalEntry(value)) {
      answer.value = lastAcceptedValue;
      return;
    }
    // The id captures this transaction's owner before an atomic transition.
    // A later, separate event reads the next active problem id.
    answer.value = value;
    lastAcceptedValue = value;
    if (inputPolicy.afterSubmission === 'current-problem' && controller.submit(id, value)) {
      render();
    }
  }

  function insertTransaction(text: string): void {
    const candidate = insertDigits(
      answer.value, text, answer.selectionStart ?? answer.value.length,
      answer.selectionEnd ?? answer.value.length,
    );
    if (candidate !== null) acceptTransaction(candidate);
  }

  start.addEventListener('click', () => {
    controller.start({
      operation: operation.value as Operation,
      digitCount: Number(digitCount.value) as DigitCount,
    });
    render();
  }, options);

  answer.addEventListener('beforeinput', (event: InputEvent) => {
    if (event.data !== null && !isDecimalEntry(event.data)) event.preventDefault();
  }, options);
  answer.addEventListener('input', () => acceptTransaction(answer.value), options);
  answer.addEventListener('paste', (event: ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain');
    if (text !== undefined) insertTransaction(text);
  }, options);
  answer.addEventListener('drop', (event: DragEvent) => {
    event.preventDefault();
    const text = event.dataTransfer?.getData('text/plain');
    if (text !== undefined) insertTransaction(text);
  }, options);
  answer.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter' || (!inputPolicy.allowPartialBackspace && event.key === 'Backspace')) {
      event.preventDefault();
    }
  }, options);
  answer.addEventListener('blur', () => {
    queueMicrotask(() => { if (document.hasFocus()) focusAnswer(); });
  }, options);
  window.addEventListener('focus', focusAnswer, options);
  root.addEventListener('pointerdown', (event: PointerEvent) => {
    if (controller.snapshot.phase === 'active' && event.target !== answer) {
      event.preventDefault();
      focusAnswer();
    }
  }, options);

  render();
  return () => {
    cancelAnimationFrame(frame);
    listeners.abort();
    root.replaceChildren();
  };
}
