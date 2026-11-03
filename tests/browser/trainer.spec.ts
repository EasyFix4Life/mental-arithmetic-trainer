import { expect, test, type Page } from '@playwright/test';

type Operation = 'addition' | 'multiplication';
type DigitCount = 1 | 2 | 3;

async function startRound(page: Page, operation: Operation, digits: DigitCount) {
  await page.locator('#operation').selectOption(operation);
  await page.locator('#digit-count').selectOption(String(digits));
  await page.locator('#start').click();
  await expect(page.locator('#setup')).toBeHidden();
  await expect(page.locator('#exercise')).toBeVisible();
  await expect(page.locator('#answer')).toBeFocused();
  await expect(page.locator('#answer')).toHaveValue('');
  await expect(page.locator('#score')).toBeHidden();
  await expect(page.locator('#round-timing')).toBeHidden();
}

async function currentProblem(page: Page, operation: Operation) {
  const left = Number(await page.locator('#left-operand').textContent());
  const right = Number(await page.locator('#right-operand').textContent());
  const answer = String(operation === 'addition' ? left + right : left * right);
  const text = await page.locator('#problem').textContent();
  return { left, right, answer, text };
}

async function pasteText(page: Page, text: string) {
  await page.locator('#answer').evaluate((element, value) => {
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', value);
    element.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: clipboard, bubbles: true, cancelable: true,
    }));
  }, text);
}

async function expectFinished(page: Page, score: number) {
  await expect(page.locator('#score')).toBeVisible();
  await expect(page.locator('#score')).toHaveText(`${score} / 10`);
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#answer')).toBeHidden();
  await expect(page.locator('#live-time')).toBeHidden();
  await expect(page.locator('#previous-time')).toBeHidden();
  await expect(page.locator('#setup')).toBeVisible();
  await expect(page.locator('#start')).toHaveText('Start Another Round');
  await expect(page.locator('#round-timing')).toBeVisible();
  await expect(page.locator('#round-timing dt')).toHaveText([
    'Maximum time', 'Minimum time', 'Average time',
  ]);
  for (const selector of ['#maximum-time', '#minimum-time', '#average-time']) {
    await expect(page.locator(selector)).toHaveText(/^\d+\.\d s$/);
  }
}

async function answerRemaining(
  page: Page,
  operation: Operation,
  count: number,
  correctCount = count,
) {
  for (let index = 0; index < count; index += 1) {
    const problem = await currentProblem(page, operation);
    await expect(page.locator('#answer')).toBeFocused();
    await page.keyboard.type(index < correctCount ? problem.answer : '0'.repeat(problem.answer.length));
    if (index < count - 1) {
      await expect(page.locator('#problem')).not.toHaveText(problem.text ?? '');
      await expect(page.locator('#answer')).toHaveValue('');
      await expect(page.locator('#answer')).toBeFocused();
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('setup contains only the specified choices and waits for manual Start', async ({ page }) => {
  await expect(page.locator('#setup')).toBeVisible();
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#score')).toBeHidden();
  await expect(page.locator('#previous-time')).toBeHidden();
  await expect(page.locator('#round-timing')).toBeHidden();
  await expect(page.locator('#operation option')).toHaveText(['Addition', 'Multiplication']);
  await expect(page.locator('#operation')).toHaveValue('addition');
  await expect(page.locator('#digit-count option')).toHaveText(['2']);
  await expect(page.locator('#digit-count')).toHaveValue('2');
  await expect(page.locator('#start')).toHaveText('Start');
  await expect(page.locator('label[for=operation]')).toContainText('Operation');
  await page.getByLabel('Operation', { exact: true }).selectOption('multiplication');
  await expect(page.locator('#digit-count option')).toHaveText(['1', '2']);
  await expect(page.locator('#digit-count option[value="3"]')).toHaveCount(0);
  await expect(page.locator('label[for=digit-count]')).toContainText('Digits per operand');
  await page.getByLabel('Digits per operand', { exact: true }).selectOption('2');
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('form')).toHaveCount(0);
});

test('multiplication lengths normalize to two-digit addition and its ten-answer round preserves timing', async ({ page }, testInfo) => {
  for (const digits of ['1', '2']) {
    await page.locator('#operation').selectOption('multiplication');
    await expect(page.locator('#digit-count option')).toHaveText(['1', '2']);
    await page.locator('#digit-count').selectOption(digits);
    await page.locator('#operation').selectOption('addition');
    await expect(page.locator('#digit-count option')).toHaveText(['2']);
    await expect(page.locator('#digit-count')).toHaveValue('2');
    await expect(page.locator('#exercise')).toBeHidden();
  }
  const instant = new Date('2026-11-02T16:00:00Z');
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 1_000));
  await page.locator('#start').click();
  for (let index = 0; index < 10; index += 1) {
    const problem = await currentProblem(page, 'addition');
    expect(String(problem.left)).toHaveLength(2);
    expect(String(problem.right)).toHaveLength(2);
    await page.clock.runFor((index + 1) * 100);
    await page.keyboard.type(index < 8 ? problem.answer : '0'.repeat(problem.answer.length));
  }
  await expectFinished(page, 8);
  await expect(page.locator('#minimum-time')).toHaveText('0.1 s');
  await expect(page.locator('#maximum-time')).toHaveText('1.0 s');
  await expect(page.locator('#average-time')).toHaveText('0.5 s');
  await page.locator('#operation').selectOption('multiplication');
  await page.locator('#digit-count').selectOption('2');
  await page.locator('#operation').selectOption('addition');
  await expect(page.locator('#digit-count')).toHaveValue('2');
  await expectFinished(page, 8);
  await expect(page.locator('#average-time')).toHaveText('0.5 s');
  await page.screenshot({ path: `verification/addition-options-${testInfo.project.name}-practice.png`, fullPage: true });
});

for (const operation of ['addition', 'multiplication'] as const) {
  for (const digits of operation === 'addition' ? [2] as const : [1, 2] as const) {
    test(`${operation}, ${digits} digit operands: ten unique problems, automatic scoring and manual restart`, async ({ page }) => {
      await startRound(page, operation, digits);
      const seen = new Set<string>();
      const minimum = digits === 1 ? 1 : 10 ** (digits - 1);
      const maximum = 10 ** digits - 1;

      for (let index = 0; index < 10; index += 1) {
        const problem = await currentProblem(page, operation);
        for (const operand of [problem.left, problem.right]) {
          expect(operand).toBeGreaterThanOrEqual(minimum);
          expect(operand).toBeLessThanOrEqual(maximum);
          expect(String(operand)).toHaveLength(digits);
        }
        await expect(page.locator('#problem')).toContainText(operation === 'addition' ? '+' : '×');
        const pair = [problem.left, problem.right].sort((a, b) => a - b).join(':');
        expect(seen.has(pair), `commutative duplicate at problem ${index + 1}: ${pair}`).toBe(false);
        seen.add(pair);

        await expect(page.locator('#answer')).toHaveValue('');
        await expect(page.locator('#answer')).toBeFocused();
        // Physical digit events, with no Enter, must submit at the expected length.
        await page.keyboard.type(problem.answer);
        if (index < 9) {
          await expect(page.locator('#problem')).not.toHaveText(problem.text ?? '');
          await expect(page.locator('#score')).toBeHidden();
          await expect(page.locator('#previous-time')).toBeVisible();
          await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
          await expect(page.locator('#answer')).toBeFocused();
        }
      }

      expect(seen.size).toBe(10);
      await expectFinished(page, 10);
      // Waiting or changing either setting must leave the completed score in place.
      await page.locator('#operation').selectOption(operation === 'addition' ? 'multiplication' : 'addition');
      await page.locator('#digit-count').selectOption('2');
      await expectFinished(page, 10);
      await page.locator('#start').click();
      await expect(page.locator('#score')).toBeHidden();
      await expect(page.locator('#round-timing')).toBeHidden();
      await expect(page.locator('#previous-time')).toBeHidden();
      await expect(page.locator('#answer')).toHaveValue('');
      await expect(page.locator('#answer')).toBeFocused();
    });
  }
}

test('partial entry, Enter, Backspace, timers and completed-round minimum, maximum and raw-duration average', async ({ page }) => {
  // Playwright's virtual clock controls performance.now and requestAnimationFrame.
  // It allows a direct check that completed tenths are displayed without an early round-up.
  const instant = new Date('2026-10-24T16:00:00Z');
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 1_000));
  await startRound(page, 'multiplication', 2);
  const first = await currentProblem(page, 'multiplication');
  const answerField = page.locator('#answer');

  await expect(page.locator('#live-time')).toHaveText('0.0');
  await page.clock.runFor(99);
  await expect(page.locator('#live-time')).toHaveText('0.0');
  await page.keyboard.type(first.answer.slice(0, -1));
  await page.keyboard.press('Enter');
  await expect(page.locator('#problem')).toHaveText(first.text ?? '');
  await expect(answerField).toHaveValue(first.answer.slice(0, -1));
  await expect(page.locator('#previous-time')).toBeHidden();
  await page.clock.runFor(121);
  await expect(page.locator('#live-time')).toHaveText('0.2');
  await page.keyboard.press('Backspace');
  await expect(answerField).toHaveValue(first.answer.slice(0, -2));
  await expect(page.locator('#problem')).toHaveText(first.text ?? '');
  await page.keyboard.type(first.answer.slice(-2));

  await expect(page.locator('#problem')).not.toHaveText(first.text ?? '');
  await expect(answerField).toHaveValue('');
  await expect(answerField).toBeFocused();
  await expect(page.locator('#live-time')).toHaveText('0.0');
  await expect(page.locator('#previous-time')).toHaveText('0.2');
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('#previous-time')).toHaveAttribute('aria-label', /correct/i);

  await page.clock.runFor(520);
  await expect(page.locator('#live-time')).toHaveText('0.5');
  await expect(page.locator('#previous-time')).toHaveText('0.2');
  const second = await currentProblem(page, 'multiplication');
  await page.keyboard.type('0'.repeat(second.answer.length));
  await expect(page.locator('#problem')).not.toHaveText(second.text ?? '');
  await expect(page.locator('#previous-time')).toHaveText('0.5');
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('#previous-time')).toHaveAttribute('aria-label', /incorrect/i);
  await expect(page.locator('#live-time')).toHaveText('0.0');
  await expect(answerField).toBeFocused();

  // The summary stays absent through nine answers. The repeated 1,499 ms
  // durations below end in 99 ms, so averaging already displayed tenths would
  // incorrectly give 1.1 s instead of the raw-duration average of 1.2 s.
  for (let index = 0; index < 8; index += 1) {
    await expect(page.locator('#round-timing')).toBeHidden();
    const current = await currentProblem(page, 'multiplication');
    await page.clock.runFor(1_499);
    await page.keyboard.type(index < 6 ? current.answer : '0'.repeat(current.answer.length));
  }
  // Include all ten answers, including the three wrong entries, in the result.
  // (220 + 520 + 8 * 1,499) / 10 = 1,273.2 ms, displayed without rounding up.
  // The tenth submission ends immediately and never exposes an eleventh problem.
  await expectFinished(page, 7);
  await expect(page.locator('#minimum-time')).toHaveText('0.2 s');
  await expect(page.locator('#maximum-time')).toHaveText('1.4 s');
  await expect(page.locator('#average-time')).toHaveText('1.2 s');
  await page.clock.runFor(5_000);
  await expectFinished(page, 7);
  await expect(page.locator('#average-time')).toHaveText('1.2 s');

  // Learn and changed setup choices preserve the result until manual restart.
  await page.locator('#mode-learn').click();
  await expect(page.locator('#learn-view')).toBeVisible();
  await page.locator('#mode-practice').click();
  await page.locator('#operation').selectOption('addition');
  await page.locator('#digit-count').selectOption('2');
  await expectFinished(page, 7);
  await expect(page.locator('#minimum-time')).toHaveText('0.2 s');
  await expect(page.locator('#maximum-time')).toHaveText('1.4 s');
  await expect(page.locator('#average-time')).toHaveText('1.2 s');
  await page.screenshot({ path: `verification/${test.info().project.name}-round-timing.png`, fullPage: true });
  await page.locator('#start').click();
  await expect(page.locator('#round-timing')).toBeHidden();
  await expect(page.locator('#score')).toBeHidden();
  await expect(page.locator('#answer')).toBeFocused();
});

test('invalid characters are rejected as a transaction rather than stripped into an answer', async ({ page }) => {
  await startRound(page, 'multiplication', 2);
  const first = await currentProblem(page, 'multiplication');
  const answerField = page.locator('#answer');
  await page.keyboard.type('1');

  for (const invalid of ['1a', '-12', '+12', '1.2', '1 2', '1,2', '１２', '١٢', `${first.answer}x`]) {
    await answerField.fill(invalid);
    await expect(answerField).toHaveValue('1');
    await expect(page.locator('#problem')).toHaveText(first.text ?? '');
    await expect(page.locator('#previous-time')).toBeHidden();
    await expect(answerField).toBeFocused();
  }

  await pasteText(page, `${first.answer}x`);
  await expect(answerField).toHaveValue('1');
  await expect(page.locator('#problem')).toHaveText(first.text ?? '');
  await answerField.fill('');
  await page.keyboard.type(first.answer);
  await expect(page.locator('#problem')).not.toHaveText(first.text ?? '');
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
});

test('leading zeros and atomic overlong input are each wrong and advance exactly once', async ({ page }) => {
  await startRound(page, 'multiplication', 2);
  const first = await currentProblem(page, 'multiplication');
  const answerField = page.locator('#answer');

  await answerField.fill(`0${first.answer.slice(1)}`);
  await expect(page.locator('#problem')).not.toHaveText(first.text ?? '');
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(answerField).toHaveValue('');
  const second = await currentProblem(page, 'multiplication');
  // A paste is one transaction, with a correct prefix that must not be accepted.
  await pasteText(page, `${second.answer}9`);
  await expect(page.locator('#problem')).not.toHaveText(second.text ?? '');
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(answerField).toHaveValue('');
  await expect(answerField).toBeFocused();
  await answerRemaining(page, 'multiplication', 8, 8);
  // An accidental double score or spillover from the overlong transaction changes this result.
  await expectFinished(page, 8);
});

test('a separate physical key after auto-submit starts the next answer under the provisional policy', async ({ page }) => {
  await startRound(page, 'multiplication', 2);
  const first = await currentProblem(page, 'multiplication');
  await page.keyboard.type(first.answer);
  const second = await currentProblem(page, 'multiplication');
  expect(second.text).not.toBe(first.text);
  await page.keyboard.press('7');
  await expect(page.locator('#answer')).toHaveValue('7');
  await expect(page.locator('#problem')).toHaveText(second.text ?? '');
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('#answer')).toBeFocused();
});

test('ten incorrect entries produce zero and Enter cannot submit a completed round', async ({ page }) => {
  await startRound(page, 'addition', 2);
  await answerRemaining(page, 'addition', 10, 0);
  await expectFinished(page, 0);
  // Enter on the document has no form submission or implicit automatic restart.
  await page.locator('body').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('Enter');
  await expectFinished(page, 0);
});

test('specified font, ivory, timer positions and no overflow at the configured viewport', async ({ page }, testInfo) => {
  await startRound(page, 'multiplication', 2);
  const first = await currentProblem(page, 'multiplication');
  await page.keyboard.type(first.answer);

  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(250, 247, 240)');
  const layout = await page.evaluate(() => {
    const rect = (selector: string) => {
      const box = document.querySelector(selector)!.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    };
    const problem = document.querySelector('#problem')!;
    const style = getComputedStyle(problem);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      problem: rect('#problem'),
      answer: rect('#answer'),
      live: rect('#live-time'),
      previous: rect('#previous-time'),
      fontFamily: style.fontFamily,
      fontSize: Number.parseFloat(style.fontSize),
      animation: style.animationName,
      transition: style.transitionDuration,
    };
  });

  expect(layout.fontFamily).toMatch(/^Arial(?:,|$)/);
  expect(layout.fontSize).toBeGreaterThanOrEqual(testInfo.project.name === 'mobile' ? 48 : 72);
  expect(layout.animation).toBe('none');
  expect(layout.transition).toBe('0s');
  expect(layout.scroll.width).toBeLessThanOrEqual(layout.viewport.width);
  expect(layout.scroll.height).toBeLessThanOrEqual(layout.viewport.height);
  for (const box of [layout.problem, layout.answer, layout.live, layout.previous]) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(layout.viewport.width);
    expect(box.bottom).toBeLessThanOrEqual(layout.viewport.height);
  }
  expect(layout.previous.x).toBeLessThan(layout.viewport.width / 4);
  expect(layout.previous.y).toBeLessThan(layout.viewport.height / 4);
  expect(layout.answer.y).toBeGreaterThan(layout.viewport.height / 2);
  expect(layout.live.y).toBeGreaterThan(layout.viewport.height / 2);
  expect(layout.live.right).toBeGreaterThan(layout.viewport.width * 0.75);
  expect(Math.abs((layout.answer.y + layout.answer.height / 2) - (layout.live.y + layout.live.height / 2))).toBeLessThan(30);
  expect(Math.abs(layout.live.x - layout.answer.right)).toBeLessThan(50);
  await expect(page.locator('#answer')).toHaveAttribute('inputmode', 'numeric');
  await expect(page.locator('#answer')).toHaveAttribute('autocomplete', 'off');
  await expect(page.locator('#live-time')).toHaveAttribute('role', 'timer');
  await expect(page.locator('#live-time')).toHaveAttribute('aria-live', 'off');
  await expect(page.locator('#exercise button')).toHaveCount(0);
  await expect(page.locator('#exercise select')).toHaveCount(0);
  await expect(page.locator('#exercise')).not.toContainText(/correct|incorrect|question|progress|hint|review|retry/i);
  await page.screenshot({ path: `verification/${testInfo.project.name}-active.png`, fullPage: true });
});
