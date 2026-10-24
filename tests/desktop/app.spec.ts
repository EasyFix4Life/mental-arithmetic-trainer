import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { expect, test as base } from '@playwright/test';
import { _electron, type ElectronApplication, type Page } from 'playwright';

const require = createRequire(import.meta.url);
const appUrl = 'app://trainer/index.html';
type Operation = 'addition' | 'multiplication';
type DigitCount = 1 | 2 | 3;

/**
 * By default this launches the source shell against dist/. Set DESKTOP_EXECUTABLE
 * to the packaged macOS binary to run the same checks against the deliverable.
 * No development server is started, imported, or required by this suite.
 */
const test = base.extend<{ desktop: ElectronApplication; window: Page }>({
  desktop: async ({}, use) => {
    const environment = Object.fromEntries(Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ));
    delete environment.ELECTRON_RUN_AS_NODE;
    const app = await _electron.launch({
      executablePath: process.env.DESKTOP_EXECUTABLE || require('electron'),
      args: process.env.DESKTOP_EXECUTABLE ? [] : [resolve('.')],
      cwd: process.cwd(),
      env: environment,
      timeout: 20_000,
    });
    try {
      await use(app);
    } finally {
      await app.close();
    }
  },
  window: async ({ desktop }, use) => {
    const window = await desktop.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await expect(window.locator('#setup')).toBeVisible();
    await use(window);
  },
});

async function problem(window: Page, operation: Operation) {
  const left = Number(await window.locator('#left-operand').textContent());
  const right = Number(await window.locator('#right-operand').textContent());
  const answer = String(operation === 'addition' ? left + right : left * right);
  return { left, right, answer, text: (await window.locator('#problem').textContent()) ?? '' };
}

async function expectVerticalAddition(window: Page, selector: string, final = false) {
  const layout = await window.locator(selector).evaluate((element, hasResult) => {
    const top = element.querySelector('[data-side="left"]')!.getBoundingClientRect();
    const bottom = element.querySelector('[data-side="right"]')!.getBoundingClientRect();
    const rule = element.querySelector('.addition-rule')!.getBoundingClientRect();
    const result = hasResult ? element.querySelector('.final-answer-value')!.getBoundingClientRect() : null;
    return { top: { bottom: top.bottom, right: top.right },
      bottom: { top: bottom.top, bottom: bottom.bottom, right: bottom.right },
      rule: { top: rule.top, bottom: rule.bottom }, result: result ? { top: result.top, right: result.right } : null };
  }, final);
  expect(layout.top.bottom).toBeLessThanOrEqual(layout.bottom.top + 1);
  expect(Math.abs(layout.top.right - layout.bottom.right)).toBeLessThanOrEqual(1);
  expect(layout.rule.top).toBeGreaterThanOrEqual(layout.bottom.bottom - 1);
  if (layout.result) {
    expect(layout.result.top).toBeGreaterThanOrEqual(layout.rule.bottom - 1);
    expect(Math.abs(layout.result.right - layout.bottom.right)).toBeLessThanOrEqual(1);
  }
}

async function startRound(window: Page, operation: Operation, digits: DigitCount) {
  await window.locator('#operation').selectOption(operation);
  await window.locator('#digit-count').selectOption(String(digits));
  await window.locator('#start').click();
  await expect(window.locator('#exercise')).toBeVisible();
  await expect(window.locator('#answer')).toBeFocused();
  await expect(window.locator('#mode-navigation')).toBeHidden();
  await expect(window.locator('#round-timing')).toBeHidden();
}

test('the native shell loads offline production assets with an isolated renderer and faithful layout', async ({ desktop, window }) => {
  expect(window.url()).toBe(appUrl);
  expect(await desktop.evaluate(({ app }) => app.isPackaged)).toBe(Boolean(process.env.DESKTOP_EXECUTABLE));
  const windows = await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map((nativeWindow) => {
    // Electron exposes this read-only runtime inspection API internally; its
    // current declaration file omits it, so keep the type boundary here.
    const preferences = (nativeWindow.webContents as unknown as {
      getLastWebPreferences(): Record<string, unknown>;
    }).getLastWebPreferences();
    return {
      title: nativeWindow.getTitle(),
      nodeIntegration: preferences.nodeIntegration,
      contextIsolation: preferences.contextIsolation,
      sandbox: preferences.sandbox,
      webSecurity: preferences.webSecurity,
      webviewTag: preferences.webviewTag,
      preload: preferences.preload || '',
    };
  }));
  expect(windows).toEqual([{
    title: 'Mental Arithmetic', nodeIntegration: false, contextIsolation: true,
    sandbox: true, webSecurity: true, webviewTag: false, preload: '',
  }]);
  expect(await window.evaluate(() => {
    const global = globalThis as unknown as Record<string, unknown>;
    return ['require', 'process', 'Buffer'].map((name) => typeof global[name]);
  })).toEqual(['undefined', 'undefined', 'undefined']);
  const resources = await window.evaluate(() => ({
    // Chromium does not necessarily publish Resource Timing entries for custom
    // schemes. The resolved production imports plus working UI/styles provide
    // the stable evidence that the app loads its local bundle.
    scripts: [...document.querySelectorAll<HTMLScriptElement>('script[src]')].map((element) => element.src),
    styles: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((element) => element.href),
    observed: performance.getEntriesByType('resource').map((entry) => entry.name),
  }));
  expect(resources.scripts).toHaveLength(1);
  expect(resources.styles).toHaveLength(1);
  expect(resources.scripts[0]).toMatch(/^app:\/\/trainer\/assets\/.+\.js$/);
  expect(resources.styles[0]).toMatch(/^app:\/\/trainer\/assets\/.+\.css$/);
  expect(resources.observed.every((url) => url.startsWith('app://trainer/'))).toBe(true);
  await expect(window.locator('#operation option')).toHaveText(['Addition', 'Multiplication']);
  await expect(window.locator('#digit-count option')).toHaveText(['1', '2', '3']);
  await expect(window.locator('html')).toHaveCSS('background-color', 'rgb(232, 215, 181)');
  await startRound(window, 'multiplication', 3);
  const first = await problem(window, 'multiplication');
  await window.keyboard.type(first.answer);
  await expect(window.locator('#previous-time')).toBeVisible();
  const layout = await window.evaluate(() => {
    const rectangle = (selector: string) => {
      const box = document.querySelector(selector)!.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
    };
    const style = getComputedStyle(document.querySelector('#problem')!);
    return {
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      font: style.fontFamily, size: Number.parseFloat(style.fontSize),
      previous: rectangle('#previous-time'), answer: rectangle('#answer'), live: rectangle('#live-time'),
    };
  });
  expect(layout.font).toMatch(/^Arial(?:,|$)/);
  expect(layout.size).toBeGreaterThanOrEqual(72);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  expect(layout.previous.x).toBeLessThan(layout.width / 4);
  expect(layout.previous.y).toBeLessThan(layout.height / 4);
  expect(layout.answer.y).toBeGreaterThan(layout.height / 2);
  expect(layout.live.x).toBeGreaterThan(layout.answer.right);
  expect(layout.live.right).toBeLessThanOrEqual(layout.width);
  expect(Math.abs(layout.live.x - layout.answer.right)).toBeLessThan(50);
  await window.screenshot({ path: 'verification/desktop-practice-app.png', fullPage: true });
});

test('Learn preserves lesson order, authored digit selections, carry sequence and the final answer after Last', async ({ window }) => {
  await window.locator('#mode-learn').click();
  await expect(window.locator('#lesson-catalog [data-lesson-id]')).toHaveText([
    'Single-digit addition', 'Single-digit multiplication', 'Two-digit addition', 'Two-digit multiplication',
    'Three-digit addition', 'Three-digit multiplication',
  ]);
  await window.locator('[data-lesson-id="multiplication-2"]').click();
  await window.locator('#worked-example').selectOption('12-times-12');
  await window.locator('#lesson-help').click();
  await expect(window.locator('#walkthrough-heading')).toBeFocused();
  const pairs = [['left:0', 'right:0'], ['left:0', 'right:1'], ['left:1', 'right:0'], ['left:1', 'right:1']];
  const twelveDigits = ['1□□', '1□□', '14□', '144'];
  const twelveResults = ['1', '2', '4', '4'];
  for (let index = 0; index < pairs.length; index += 1) {
    expect(await window.locator('#walkthrough .digit-highlight').evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).dataset.digitRef),
    )).toEqual(pairs[index]);
    await expect(window.locator('#walkthrough .step-intermediate-result')).toHaveText(twelveResults[index]!);
    await expect(window.locator('#walkthrough .step-result-digits')).toHaveText(twelveDigits[index]!);
    await expect(window.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
    await window.locator('#step-next').click();
  }
  await expect(window.locator('#stage-sequence button')).toHaveText(['First', 'Inside', 'Outside', 'Last', 'Final answer: 144']);
  await expect(window.locator('#walkthrough .learn-expression')).toHaveAccessibleName('12 times 12 equals 144');
  await expect(window.locator('#step-next')).toBeDisabled();

  await window.locator('#worked-example').selectOption('18-times-18');
  const stages = ['First', 'Inside', 'Outside', 'Last', 'Last', 'Last'];
  const results = ['1', '8', '16', '64', '22', '3'];
  const digits = ['□□□', '□□□', '□□□', '□□4', '□24', '324'];
  for (let index = 0; index < stages.length; index += 1) {
    await expect(window.locator('#walkthrough .instruction-step h3').first()).toHaveText(stages[index]!);
    await expect(window.locator('#step-position')).toHaveText(`${index + 1} / 7`);
    await expect(window.locator('#walkthrough .step-intermediate-result')).toHaveText(results[index]!);
    await expect(window.locator('#walkthrough .step-result-digits')).toHaveText(digits[index]!);
    if (index < 4) {
      expect(await window.locator('#walkthrough .digit-highlight').evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).dataset.digitRef),
      )).toEqual(pairs[index]);
    }
    if (index === 3) {
      await expect(window.locator('#walkthrough .carry-out')).toHaveText('6');
      await expect(window.locator('#walkthrough .carry-to-step')).toContainText('Inside + Outside (16)');
    }
    if (index === 4) {
      await expect(window.locator('#walkthrough .step-operation')).toHaveAccessibleName('16 + 6');
      await expect(window.locator('#walkthrough .carry-in')).toHaveText('6');
      await expect(window.locator('#walkthrough .carry-out')).toHaveText('2');
      await expect(window.locator('#walkthrough .carry-to-step')).toContainText('First (1)');
    }
    if (index === 5) {
      await expect(window.locator('#walkthrough .step-operation')).toHaveAccessibleName('1 + 2');
      await expect(window.locator('#walkthrough .carry-in')).toHaveText('2');
      await expect(window.locator('#walkthrough .carry-out')).toHaveCount(0);
    }
    await window.locator('#step-next').click();
  }
  await expect(window.locator('#stage-sequence button')).toHaveText(['First', 'Inside', 'Outside', 'Last', 'Final answer: 324']);
  await expect(window.locator('#final-answer')).toHaveAttribute('aria-current', 'step');
  await expect(window.locator('#walkthrough .learn-expression')).toHaveAccessibleName('18 times 18 equals 324');
  await expect(window.locator('#step-position')).toHaveText('7 / 7');
  await expect(window.locator('#step-next')).toBeDisabled();
  await expect(window.locator('#live-time')).toBeHidden();
  await window.screenshot({ path: 'verification/desktop-app.png', fullPage: true });
  await window.locator('#step-back').click();
  await expect(window.locator('#walkthrough .step-result-digits')).toHaveText('324');
  await expect(window.locator('[data-stage-name="Last"]')).toHaveAttribute('aria-current', 'step');
});

test('native Learn provides full random instruction in all six lessons and preserves the confirmed multiplication carry method', async ({ window }) => {
  await window.locator('#mode-learn').click();
  for (const [lesson, operation, digits] of [
    ['addition-1', 'addition', 1], ['multiplication-1', 'multiplication', 1],
    ['addition-2', 'addition', 2], ['multiplication-2', 'multiplication', 2],
    ['addition-3', 'addition', 3], ['multiplication-3', 'multiplication', 3],
  ] as const) {
    await window.locator(`[data-lesson-id="${lesson}"]`).click();
    await expect(window.locator('#random-example')).toHaveAccessibleName('New random example');
    const firstOperands = await window.locator('#lesson-expression .learn-operand').allTextContents();
    const firstKey = firstOperands.map(Number).sort((left, right) => left - right).join(':');
    for (const operand of firstOperands.map(Number)) {
      expect(operand).toBeGreaterThanOrEqual(digits === 1 ? 1 : 10 ** (digits - 1));
      expect(operand).toBeLessThanOrEqual(10 ** digits - 1);
    }
    if (operation === 'addition') await expectVerticalAddition(window, '#lesson-expression .learn-expression');
    await window.locator('#random-example').click();
    const secondOperands = await window.locator('#lesson-expression .learn-operand').allTextContents();
    expect(secondOperands.map(Number).sort((left, right) => left - right).join(':')).not.toBe(firstKey);
    const [left, right] = secondOperands.map(Number) as [number, number];
    const answer = String(operation === 'addition' ? left + right : left * right);
    await window.locator('#lesson-help').click();
    await expect(window.locator('#walkthrough-status')).toBeHidden();
    await expect(window.locator('#walkthrough .step-operation')).toBeVisible();
    await expect(window.locator('#step-position')).toHaveText(/^1 \/ (?:[2-9]|[1-9][0-9]+)$/);
    await window.locator('#final-answer').click();
    await expect(window.locator('#walkthrough .learn-expression')).toHaveAccessibleName(
      `${left} ${operation === 'addition' ? 'plus' : 'times'} ${right} equals ${answer}`,
    );
    await expect(window.locator('#step-next')).toBeDisabled();
    if (operation === 'addition') await expectVerticalAddition(window, '#walkthrough .learn-expression', true);
    await window.locator('#close-walkthrough').click();
  }

  await window.locator('[data-lesson-id="multiplication-2"]').click();
  await window.locator('#worked-example').selectOption('18-times-18');
  await window.evaluate(() => { Math.random = () => (18 - 10 + 0.25) / 90; });
  await window.locator('[data-lesson-id="multiplication-2"]').click();
  await expect(window.locator('#worked-example')).toHaveValue('random');
  await expect(window.locator('#lesson-expression .learn-expression')).not.toHaveAccessibleName('18 times 18');

  await window.evaluate(() => {
    const draws = [(98 - 10 + 0.25) / 90, (87 - 10 + 0.25) / 90];
    Math.random = () => draws.shift() ?? 0;
  });
  await window.locator('[data-lesson-id="multiplication-2"]').click();
  await expect(window.locator('#worked-example')).toHaveValue('random');
  await expect(window.locator('#lesson-expression .learn-expression')).toHaveAccessibleName('98 times 87');
  await window.locator('#lesson-help').click();
  const operations = ['9 × 8', '9 × 7', '8 × 8 = 64; 63 + 64', '8 × 7', '127 + 5', '72 + 13'];
  const results = ['72', '63', '127', '56', '132', '85'];
  for (let index = 0; index < operations.length; index += 1) {
    await expect(window.locator('#walkthrough .step-operation')).toHaveAccessibleName(operations[index]!);
    await expect(window.locator('#walkthrough .step-intermediate-result')).toHaveText(results[index]!);
    await expect(window.locator('#step-position')).toHaveText(`${index + 1} / 7`);
    if (index === 3) await expect(window.locator('#walkthrough .carry-out')).toHaveText('5');
    if (index === 4) {
      await expect(window.locator('#walkthrough .carry-in')).toHaveText('5');
      await expect(window.locator('#walkthrough .carry-out')).toHaveText('13');
    }
    if (index === 5) {
      await expect(window.locator('#walkthrough .carry-in')).toHaveText('13');
      await expect(window.locator('#walkthrough .step-result-digits')).toHaveText('8526');
    }
    await window.locator('#step-next').click();
  }
  await expect(window.locator('#stage-sequence button')).toHaveText([
    'First', 'Inside', 'Outside', 'Last', 'Final answer: 8526',
  ]);
  await expect(window.locator('#final-answer')).toHaveAttribute('aria-current', 'step');
  await expect(window.locator('#walkthrough .learn-expression')).toHaveAccessibleName('98 times 87 equals 8526');
  await expect(window.locator('#step-next')).toBeDisabled();
  await window.screenshot({ path: 'verification/desktop-app-learn-random.png', fullPage: true });
  await window.locator('#random-example').click();
  await expect(window.locator('#walkthrough')).toBeVisible();
  await expect(window.locator('#walkthrough .instruction-step h3').first()).toHaveText('First');
  await expect(window.locator('#step-position')).toHaveText(/^1 \/ /);
  await expect(window.locator('#walkthrough .final-answer-value')).toHaveCount(0);
  await expect(window.locator('#walkthrough .learn-expression')).not.toHaveAccessibleName(/^98 times 87/);
  await expect(window.locator('#live-time')).toBeHidden();
  await expect(window.locator('#live-time')).toHaveText('0.0');
  await expect(window.locator('#score')).toBeHidden();
});

test('Practice keeps input and live timers, then shows all ten raw answer times as minimum, maximum and average', async ({ window }) => {
  const instant = new Date('2026-10-24T16:00:00Z');
  await window.clock.install({ time: instant });
  await window.clock.pauseAt(new Date(instant.getTime() + 1_000));
  await startRound(window, 'multiplication', 3);
  const first = await problem(window, 'multiplication');
  await expect(window.locator('#live-time')).toHaveText('0.0');
  await window.clock.runFor(220);
  await window.keyboard.type(first.answer.slice(0, -1));
  await window.keyboard.press('Enter');
  await expect(window.locator('#problem')).toHaveText(first.text);
  await expect(window.locator('#answer')).toHaveValue(first.answer.slice(0, -1));
  await expect(window.locator('#live-time')).toHaveText('0.2');
  await window.keyboard.press('Backspace');
  await expect(window.locator('#answer')).toHaveValue(first.answer.slice(0, -2));
  await window.keyboard.type(first.answer.slice(-2));
  await expect(window.locator('#problem')).not.toHaveText(first.text);
  await expect(window.locator('#previous-time')).toHaveText('0.2');
  await expect(window.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(window.locator('#live-time')).toHaveText('0.0');

  const second = await problem(window, 'multiplication');
  await window.clock.runFor(530);
  await window.keyboard.type('0'.repeat(second.answer.length));
  await expect(window.locator('#problem')).not.toHaveText(second.text);
  await expect(window.locator('#previous-time')).toHaveText('0.5');
  await expect(window.locator('#previous-time')).toHaveCSS('color', 'rgb(176, 0, 0)');
  await expect(window.locator('#answer')).toHaveValue('');
  await expect(window.locator('#answer')).toBeFocused();
  await expect(window.locator('#exercise')).not.toContainText(/review|retry|hint|walkthrough/i);
  for (let index = 0; index < 8; index += 1) {
    await expect(window.locator('#round-timing')).toBeHidden();
    const current = await problem(window, 'multiplication');
    await window.clock.runFor(1_499);
    await window.keyboard.type(current.answer);
  }
  await expect(window.locator('#score')).toHaveText('9 / 10');
  await expect(window.locator('#score')).toBeVisible();
  await expect(window.locator('#exercise')).toBeHidden();
  await expect(window.locator('#live-time')).toBeHidden();
  await expect(window.locator('#previous-time')).toBeHidden();
  await expect(window.locator('#start')).toHaveText('Start Another Round');
  await expect(window.locator('#round-timing')).toBeVisible();
  await expect(window.locator('#round-timing dt')).toHaveText([
    'Maximum time', 'Minimum time', 'Average time',
  ]);
  // Include the wrong answer's 530 ms. The exact mean is 1,274.2 ms;
  // averaging displayed tenths would give 1.1 s, and omitting wrong answers
  // would give 1.3 s. Only the raw mean of all ten should display 1.2 s.
  await expect(window.locator('#minimum-time')).toHaveText('0.2 s');
  await expect(window.locator('#maximum-time')).toHaveText('1.4 s');
  await expect(window.locator('#average-time')).toHaveText('1.2 s');
  await window.screenshot({ path: 'verification/desktop-app-round-timing.png', fullPage: true });
  await window.clock.runFor(3_000);
  await expect(window.locator('#exercise')).toBeHidden();
  await expect(window.locator('#average-time')).toHaveText('1.2 s');
  await window.locator('#mode-learn').click();
  await expect(window.locator('#learn-view')).toBeVisible();
  await window.locator('#mode-practice').click();
  await expect(window.locator('#score')).toHaveText('9 / 10');
  await expect(window.locator('#round-timing')).toBeVisible();
  await expect(window.locator('#minimum-time')).toHaveText('0.2 s');
  await expect(window.locator('#maximum-time')).toHaveText('1.4 s');
  await expect(window.locator('#average-time')).toHaveText('1.2 s');
  await window.locator('#start').click();
  await expect(window.locator('#score')).toBeHidden();
  await expect(window.locator('#round-timing')).toBeHidden();
  await expect(window.locator('#previous-time')).toBeHidden();
  await expect(window.locator('#answer')).toBeFocused();
});

test('all six Practice configurations produce ten unique in-range problems and a score out of ten', async ({ window }) => {
  for (const operation of ['addition', 'multiplication'] as const) {
    for (const digits of [1, 2, 3] as const) {
      await startRound(window, operation, digits);
      if (operation === 'addition') {
        await expect(window.locator('#problem')).toHaveClass(/vertical-addition/);
        const columns = await window.evaluate(() => {
          const top = document.querySelector('#left-operand')!.getBoundingClientRect();
          const bottom = document.querySelector('#right-operand')!.getBoundingClientRect();
          return { topBottom: top.bottom, bottomTop: bottom.top, topRight: top.right, bottomRight: bottom.right };
        });
        expect(columns.topBottom).toBeLessThanOrEqual(columns.bottomTop + 1);
        expect(Math.abs(columns.topRight - columns.bottomRight)).toBeLessThanOrEqual(1);
      }
      const seen = new Set<string>();
      const minimum = digits === 1 ? 1 : 10 ** (digits - 1);
      const maximum = 10 ** digits - 1;
      for (let index = 0; index < 10; index += 1) {
        const current = await problem(window, operation);
        for (const operand of [current.left, current.right]) {
          expect(operand).toBeGreaterThanOrEqual(minimum);
          expect(operand).toBeLessThanOrEqual(maximum);
        }
        const key = [current.left, current.right].sort((left, right) => left - right).join(':');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        await window.keyboard.type(current.answer);
        if (index < 9) {
          await expect(window.locator('#problem')).not.toHaveText(current.text);
          await expect(window.locator('#answer')).toHaveValue('');
          await expect(window.locator('#answer')).toBeFocused();
        }
      }
      expect(seen.size).toBe(10);
      await expect(window.locator('#score')).toHaveText('10 / 10');
      await expect(window.locator('#exercise')).toBeHidden();
      await expect(window.locator('#start')).toHaveText('Start Another Round');
      await expect(window.locator('#round-timing')).toBeVisible();
    }
  }
});
