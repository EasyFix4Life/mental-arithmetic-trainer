import { expect, test, type Page } from '@playwright/test';

const titles = [
  'Single-digit addition', 'Single-digit multiplication', 'Two-digit addition', 'Two-digit multiplication',
  'Three-digit addition', 'Three-digit multiplication',
];
const lessonIds = ['addition-1', 'multiplication-1', 'addition-2', 'multiplication-2', 'addition-3', 'multiplication-3'];

async function openLearn(page: Page, lessonId?: string) {
  await page.locator('#mode-learn').click();
  await expect(page.locator('#learn-view')).toBeVisible();
  await expect(page.locator('#practice-view')).toBeHidden();
  if (lessonId) await page.locator(`[data-lesson-id="${lessonId}"]`).click();
}

async function openWalkthrough(page: Page) {
  await page.locator('#lesson-help').click();
  await expect(page.locator('#walkthrough')).toBeVisible();
  await expect(page.locator('#lesson-help')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#walkthrough-heading')).toBeFocused();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('both modes are accessible and all six lessons follow the original order plus three-digit extensions', async ({ page }) => {
  await expect(page.locator('#mode-navigation')).toBeVisible();
  await expect(page.locator('#mode-learn')).toHaveAccessibleName('Learn');
  await expect(page.locator('#mode-practice')).toHaveAccessibleName('Practice');
  await expect(page.locator('#practice-view')).toBeVisible();
  await expect(page.locator('#learn-view')).toBeHidden();
  await openLearn(page);
  await expect(page.locator('#lesson-catalog [data-lesson-id]')).toHaveText(titles);
  expect(await page.locator('#lesson-catalog [data-lesson-id]').evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).dataset.lessonId),
  )).toEqual(lessonIds);
  await expect(page.locator('#learn-view')).not.toContainText(/children|age track/i);
  await page.locator('#mode-practice').click();
  await expect(page.locator('#practice-view')).toBeVisible();
  await expect(page.locator('#learn-view')).toBeHidden();
  await expect(page.locator('#setup')).toBeVisible();
});

test('addition is stacked and multiplication is horizontal, with large Arial operands on sepia', async ({ page }, testInfo) => {
  await openLearn(page);
  for (let index = 0; index < lessonIds.length; index += 1) {
    await page.locator(`[data-lesson-id="${lessonIds[index]}"]`).click();
    await expect(page.locator('#lesson-title')).toHaveText(titles[index]!);
    const expression = page.locator('#learn-view .learn-expression').first();
    await expect(expression).toBeVisible();
    await expect(expression).toContainText(index % 2 === 0 ? '+' : '×');
    const layout = await expression.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        display: style.display, direction: style.flexDirection,
        font: style.fontFamily, fontSize: Number.parseFloat(style.fontSize),
        children: [...element.children].map((child) => {
          const box = child.getBoundingClientRect();
          return { left: box.left, right: box.right, midY: box.y + box.height / 2 };
        }),
      };
    });
    expect(layout.font).toMatch(/^Arial(?:,|$)/);
    expect(layout.fontSize).toBeGreaterThanOrEqual(testInfo.project.name === 'mobile' ? 40 : 48);
    if (index % 2 === 0) {
      expect(layout.display).toBe('grid');
      expect(layout.children).toHaveLength(4);
      expect(layout.children[0]!.midY).toBeLessThan(layout.children[2]!.midY);
      expect(Math.abs(layout.children[0]!.right - layout.children[2]!.right)).toBeLessThan(2);
      expect(layout.children[1]!.right).toBeLessThanOrEqual(layout.children[2]!.left);
    } else {
      expect(layout.display).toBe('flex');
      expect(layout.direction).toBe('row');
      expect(layout.children).toHaveLength(3);
      expect(layout.children[0]!.right).toBeLessThanOrEqual(layout.children[1]!.left);
      expect(layout.children[1]!.right).toBeLessThanOrEqual(layout.children[2]!.left);
      expect(Math.abs(layout.children[0]!.midY - layout.children[2]!.midY)).toBeLessThan(2);
    }
    await expect(expression.locator('[data-digit-ref]')).toHaveCount((Math.floor(index / 2) + 1) * 2);
    await expect(expression.locator('.digit-highlight')).toHaveCount(0);
  }
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(232, 215, 181)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('circled question mark supports keyboard activation, named walkthrough and focus return', async ({ page }) => {
  await openLearn(page, 'multiplication-2');
  const help = page.locator('#lesson-help');
  await expect(help).toHaveText('?');
  await expect(help).toHaveAccessibleName('Open instructional walkthrough');
  await expect(help).toHaveAttribute('aria-controls', 'walkthrough');
  await expect(help).toHaveAttribute('aria-expanded', 'false');
  const circle = await help.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return { border: Number.parseFloat(style.borderTopWidth), radius: style.borderRadius, width: box.width, height: box.height };
  });
  expect(circle.border).toBeGreaterThan(0);
  expect(circle.radius).not.toBe('0px');
  expect(Math.abs(circle.width - circle.height)).toBeLessThan(2);
  await help.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#walkthrough')).toBeVisible();
  await expect(page.locator('#walkthrough')).toHaveAttribute('aria-labelledby', 'walkthrough-heading');
  await expect(page.locator('#walkthrough-heading')).toBeFocused();
  await page.locator('#close-walkthrough').click();
  await expect(page.locator('#walkthrough')).toBeHidden();
  await expect(help).toHaveAttribute('aria-expanded', 'false');
  await expect(help).toBeFocused();
});

test('all six lessons have complete instructions and a correct final answer', async ({ page }) => {
  await openLearn(page);
  for (const [index, id] of lessonIds.entries()) {
    await page.locator(`[data-lesson-id="${id}"]`).click();
    const values = (await page.locator('#lesson-expression .learn-operand').allTextContents()).map(Number);
    const answer = String(index % 2 === 0 ? values[0]! + values[1]! : values[0]! * values[1]!);
    await openWalkthrough(page);
    await expect(page.locator('#walkthrough-status')).toBeHidden();
    await expect(page.locator('#walkthrough .step-operation')).toBeVisible();
    await expect(page.locator('#walkthrough .digit-highlight').first()).toBeVisible();
    await expect(page.locator('#step-next')).toBeVisible();
    await page.locator('#final-answer').click();
    await expect(page.locator('.final-answer-value')).toHaveText(answer);
    await expect(page.locator('#step-next')).toBeDisabled();
    await page.locator('#close-walkthrough').click();
  }
});

test('all six lessons open with random in-range operands and can request another example without starting Practice', async ({ page }) => {
  // A constant RNG exercises the bounded immediate-repeat fallback as well as
  // ordinary generation; the UI must never hang or repeat a commuted pair.
  await page.evaluate(() => { Math.random = () => 0; });
  await openLearn(page);
  for (const [index, id] of lessonIds.entries()) {
    await page.locator(`[data-lesson-id="${id}"]`).click();
    const button = page.locator('#random-example');
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName('New random example');
    if (id === 'multiplication-2') await expect(page.locator('#worked-example')).toHaveValue('random');
    let previousKey: string | undefined;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const operands = await page.locator('#lesson-expression .learn-operand').allTextContents();
      expect(operands).toHaveLength(2);
      const values = operands.map(Number);
      const digits = Math.floor(index / 2) + 1;
      const minimum = digits === 1 ? 1 : 10 ** (digits - 1);
      const maximum = 10 ** digits - 1;
      for (const value of values) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(minimum);
        expect(value).toBeLessThanOrEqual(maximum);
      }
      const key = values.sort((left, right) => left - right).join(':');
      expect(key).not.toBe(previousKey);
      previousKey = key;
      await expect(page.locator('#lesson-expression .digit-highlight')).toHaveCount(0);
      await expect(page.locator('#example-status')).toBeHidden();
      await expect(page.locator('#walkthrough')).toBeHidden();
      await button.click();
    }
    await openWalkthrough(page);
    await expect(page.locator('#walkthrough-status')).toBeHidden();
    await expect(page.locator('#walkthrough .step-operation')).toBeVisible();
    await page.locator('#close-walkthrough').click();
  }
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#score')).toBeHidden();
  await expect(page.locator('#live-time')).toBeHidden();
  await expect(page.locator('#live-time')).toHaveText('0.0');
  await expect(page.locator('#previous-time')).toBeHidden();

  // Reselecting the lesson must exclude the example currently displayed,
  // including a confirmed example selected after a different random one.
  await page.locator('[data-lesson-id="multiplication-2"]').click();
  await page.locator('#worked-example').selectOption('18-times-18');
  await expect(page.locator('#lesson-expression .learn-expression')).toHaveAccessibleName('18 times 18');
  await page.evaluate(() => { Math.random = () => (18 - 10 + 0.25) / 90; });
  await page.locator('[data-lesson-id="multiplication-2"]').click();
  await expect(page.locator('#worked-example')).toHaveValue('random');
  await expect(page.locator('#lesson-expression .learn-expression')).not.toHaveAccessibleName('18 times 18');
});

test('a random asymmetric example applies First, Inside, Outside and Last with both carries and its final answer', async ({ page }, testInfo) => {
  await openLearn(page);
  await page.evaluate(() => {
    const draws = [(98 - 10 + 0.25) / 90, (87 - 10 + 0.25) / 90];
    Math.random = () => draws.shift() ?? 0;
  });
  await page.locator('[data-lesson-id="multiplication-2"]').click();
  await expect(page.locator('#worked-example')).toHaveValue('random');
  await expect(page.locator('#lesson-expression .learn-expression')).toHaveAccessibleName('98 times 87');
  await openWalkthrough(page);

  const operations = ['9 × 8', '9 × 7', '8 × 8 = 64; 63 + 64', '8 × 7', '127 + 5', '72 + 13'];
  const intermediate = ['72', '63', '127', '56', '132', '85'];
  const stages = ['First', 'Inside', 'Outside', 'Last', 'Last', 'Last'];
  const pairs = [['left:0', 'right:0'], ['left:0', 'right:1'], ['left:1', 'right:0'], ['left:1', 'right:1']];
  for (let index = 0; index < operations.length; index += 1) {
    await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText(stages[index]!);
    await expect(page.locator('#walkthrough .step-operation')).toHaveAccessibleName(operations[index]!);
    await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText(intermediate[index]!);
    await expect(page.locator('#step-position')).toHaveText(`${index + 1} / 7`);
    if (index < 4) expect(await page.locator('#walkthrough .digit-highlight').evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).dataset.digitRef),
    )).toEqual(pairs[index]);
    if (index === 3) {
      await expect(page.locator('#walkthrough .carry-out')).toHaveText('5');
      await expect(page.locator('#walkthrough .carry-to-step')).toContainText('127');
    }
    if (index === 4) {
      await expect(page.locator('#walkthrough .carry-in')).toHaveText('5');
      await expect(page.locator('#walkthrough .carry-out')).toHaveText('13');
      await expect(page.locator('#walkthrough .carry-to-step')).toContainText('72');
      await page.screenshot({ path: `verification/${testInfo.project.name}-learn-random-carry.png`, fullPage: true });
    }
    if (index === 5) {
      await expect(page.locator('#walkthrough .carry-in')).toHaveText('13');
      await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('8526');
    }
    await page.locator('#step-next').click();
  }
  await expect(page.locator('#stage-sequence button')).toHaveText([
    'First', 'Inside', 'Outside', 'Last', 'Final answer: 8526',
  ]);
  await expect(page.locator('#final-answer')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#walkthrough .learn-expression')).toHaveAccessibleName('98 times 87 equals 8526');
  await expect(page.locator('#step-position')).toHaveText('7 / 7');
  await expect(page.locator('#step-next')).toBeDisabled();
  await page.screenshot({ path: `verification/${testInfo.project.name}-learn-random.png`, fullPage: true });

  // Changing from a completed trace to a new random problem keeps the open
  // walkthrough but returns to First and clears the old final-answer screen.
  await page.locator('#random-example').click();
  await expect(page.locator('#walkthrough')).toBeVisible();
  await expect(page.locator('#worked-example')).toHaveValue('random');
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('First');
  await expect(page.locator('#step-position')).toHaveText(/^1 \/ /);
  await expect(page.locator('#walkthrough .final-answer-value')).toHaveCount(0);
  await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
  await expect(page.locator('#walkthrough .learn-expression')).not.toHaveAccessibleName(/^98 times 87/);
  await page.locator('#close-walkthrough').click();
  await page.locator('#random-example').click();
  await expect(page.locator('#walkthrough')).toBeHidden();
  await expect(page.locator('#lesson-expression')).toBeVisible();
  await expect(page.locator('#live-time')).toBeHidden();
  await expect(page.locator('#live-time')).toHaveText('0.0');
});

test('confirmed 12 × 12 walkthrough uses exact digit pairs and resolves the middle sum to 144', async ({ page }) => {
  await openLearn(page, 'multiplication-2');
  await expect(page.locator('#worked-example')).toBeVisible();
  await expect(page.locator('#worked-example option')).toHaveText([
    /^Random: \d{2} × \d{2}$/, '12 × 12 — no carrying', '18 × 18 — carrying',
  ]);
  await page.locator('#worked-example').selectOption('12-times-12');
  expect(await page.locator('#learn-view').innerText()).not.toMatch(/pending|not yet recovered|fragment|structural preview/i);
  await expect(page.locator('#example-status')).toBeHidden();
  await expect(page.locator('#carry-fragment')).toBeHidden();
  await openWalkthrough(page);
  const stages = ['First', 'Inside', 'Outside', 'Last'];
  const pairs = [['left:0', 'right:0'], ['left:0', 'right:1'], ['left:1', 'right:0'], ['left:1', 'right:1']];
  const calculations = ['1 × 1', '1 × 2', '2 × 1 = 2; 2 + 2', '2 × 2'];
  const intermediate = ['1', '2', '4', '4'];
  const answers = ['1□□', '1□□', '14□', '144'];
  await expect(page.locator('#walkthrough [data-stage-name]')).toHaveText(stages);
  await expect(page.locator('#learn-view')).not.toContainText(/\b(?:FIOL|FOIL|FEAL)\b/);
  for (let index = 0; index < stages.length; index += 1) {
    await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText(stages[index]!);
    await expect(page.locator('#walkthrough [aria-current="step"]')).toHaveAttribute('data-stage-name', stages[index]!);
    expect(await page.locator('#walkthrough .digit-highlight').evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).dataset.digitRef),
    )).toEqual(pairs[index]);
    await expect(page.locator('#walkthrough .step-operation')).toHaveAccessibleName(calculations[index]!);
    await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText(intermediate[index]!);
    await expect(page.locator('#walkthrough .step-result-digits')).toHaveText(answers[index]!);
    await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
    await expect(page.locator('#step-position')).toHaveText(`${index + 1} / 5`);
    if (index === 0) await expect(page.locator('#step-back')).toBeDisabled();
    if (index < stages.length - 1) {
      await page.locator('#step-next').click();
      await expect(page.locator('#step-next')).toBeFocused();
    }
  }
  await expect(page.locator('#stage-sequence button')).toHaveText([...stages, 'Final answer: 144']);
  await expect(page.locator('#step-next')).toBeEnabled();
  await page.locator('#step-next').click();
  await expect(page.locator('#step-position')).toHaveText('5 / 5');
  await expect(page.locator('#final-answer')).toHaveText('Final answer: 144');
  await expect(page.locator('#final-answer')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#walkthrough [data-stage-name][aria-current]')).toHaveCount(0);
  await expect(page.locator('#walkthrough .final-answer-value')).toHaveText('144');
  await expect(page.locator('#walkthrough .learn-expression')).toHaveAccessibleName('12 times 12 equals 144');
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveCount(0);
  await expect(page.locator('#step-next')).toBeDisabled();
  await expect(page.locator('#step-back')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('Last');
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('144');
  await expect(page.locator('#final-answer')).not.toHaveAttribute('aria-current');
  await expect(page.locator('#step-next')).toBeEnabled();
  await page.locator('#step-back').click();
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('Outside');
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('14□');
  await expect(page.locator('#step-back')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('Inside');
  await page.keyboard.press('Enter');
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('First');
  await expect(page.locator('#step-next')).toBeFocused();
  await expect(page.locator('#step-back')).toBeDisabled();
  await page.locator('[data-stage-name="Outside"]').click();
  await expect(page.locator('[data-stage-name="Outside"]')).toBeFocused();
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('Outside');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-stage-name="Outside"]')).toBeFocused();
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('Outside');
});

test('confirmed 18 × 18 trace carries 6 into 16, then 2 into First, to complete 324', async ({ page }, testInfo) => {
  await openLearn(page, 'multiplication-2');
  await page.locator('#worked-example').selectOption('18-times-18');
  await openWalkthrough(page);
  const stages = ['First', 'Inside', 'Outside', 'Last', 'Last', 'Last'];
  const pairs = [
    ['left:0', 'right:0'], ['left:0', 'right:1'], ['left:1', 'right:0'], ['left:1', 'right:1'],
  ];
  const calculations = ['1 × 1', '1 × 8', '8 × 1 = 8; 8 + 8', '8 × 8', '16 + 6', '1 + 2'];
  const intermediate = ['1', '8', '16', '64', '22', '3'];
  await expect(page.locator('#walkthrough [data-stage-name]')).toHaveText(['First', 'Inside', 'Outside', 'Last']);
  for (let index = 0; index < 6; index += 1) {
    await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText(stages[index]!);
    await expect(page.locator('#walkthrough [aria-current="step"]')).toHaveAttribute('data-stage-name', stages[index]!);
    await expect(page.locator('#step-position')).toHaveText(`${index + 1} / 7`);
    await expect(page.locator('#walkthrough .step-operation')).toHaveAccessibleName(calculations[index]!);
    await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText(intermediate[index]!);
    const expression = page.locator('#walkthrough .learn-expression');
    await expect(expression).toHaveAccessibleName(/^18 times 18/);
    if (index < 4) {
      expect(await expression.locator('.digit-highlight').evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).dataset.digitRef),
      )).toEqual(pairs[index]);
    }
    if (index < 3) {
      await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
      const result = page.locator('#walkthrough .step-result-digits');
      if (await result.count()) await expect(result).toHaveText('□□□');
    }
    if (index === 3) {
      await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('□□4');
      await expect(page.locator('#walkthrough .carry-out')).toHaveText('6');
      await expect(page.locator('#walkthrough .carry-to-step')).toContainText(/middle|16/i);
      await expect(page.locator('#walkthrough .carry-in')).toHaveCount(0);
    }
    if (index === 4) {
      await expect(page.locator('#walkthrough .step-label')).toHaveText('Carry to the middle');
      await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('□24');
      await expect(page.locator('#walkthrough .carry-in')).toHaveText('6');
      await expect(page.locator('#walkthrough .carry-out')).toHaveText('2');
      await expect(page.locator('#walkthrough .carry-to-step')).toContainText(/first|1/i);
    }
    if (index === 5) {
      await expect(page.locator('#walkthrough .step-label')).toHaveText('Complete the answer');
      await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('324');
      await expect(page.locator('#walkthrough .carry-in')).toHaveText('2');
      await expect(page.locator('#walkthrough .carry-out')).toHaveCount(0);
    }
    if (index < 5) await page.locator('#step-next').click();
  }
  await expect(page.locator('#stage-sequence button')).toHaveText(['First', 'Inside', 'Outside', 'Last', 'Final answer: 324']);
  await expect(page.locator('#step-next')).toBeEnabled();
  await page.locator('#step-next').click();
  await expect(page.locator('#step-position')).toHaveText('7 / 7');
  await expect(page.locator('#final-answer')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#walkthrough .final-answer-value')).toHaveText('324');
  await expect(page.locator('#walkthrough .learn-expression')).toHaveAccessibleName('18 times 18 equals 324');
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveCount(0);
  await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
  await expect(page.locator('#step-next')).toBeDisabled();
  await expect(page.locator('#step-back')).toBeFocused();
  await page.screenshot({ path: `verification/${testInfo.project.name}-learn-confirmed.png`, fullPage: true });
  await page.locator('#step-back').click();
  await expect(page.locator('#step-position')).toHaveText('6 / 7');
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('324');
  await expect(page.locator('[data-stage-name="Last"]')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#final-answer')).not.toHaveAttribute('aria-current');
  await page.locator('#step-back').click();
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('□24');
  await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText('22');
  await expect(page.locator('#walkthrough .step-label')).toHaveText('Carry to the middle');
  await page.locator('#step-back').click();
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('□□4');
  await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText('64');
  await expect(page.locator('#walkthrough .carry-in')).toHaveCount(0);
  await page.locator('#step-back').click();
  await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText('16');
  await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
  await page.locator('[data-stage-name="Last"]').click();
  await expect(page.locator('#step-position')).toHaveText('4 / 7');
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('□□4');
});

test('changing confirmed examples resets the walkthrough and clears future digits and carries', async ({ page }) => {
  await openLearn(page, 'multiplication-2');
  await page.locator('#worked-example').selectOption('18-times-18');
  await openWalkthrough(page);
  await page.locator('#final-answer').click();
  await expect(page.locator('#final-answer')).toBeFocused();
  await expect(page.locator('#walkthrough .final-answer-value')).toHaveText('324');
  await page.keyboard.press('Space');
  await expect(page.locator('#final-answer')).toBeFocused();
  await expect(page.locator('#step-position')).toHaveText('7 / 7');
  await page.locator('#worked-example').selectOption('12-times-12');
  await expect(page.locator('#walkthrough')).toBeVisible();
  await expect(page.locator('#step-position')).toHaveText('1 / 5');
  await expect(page.locator('#walkthrough .learn-expression')).toHaveAccessibleName(/^12 times 12/);
  await expect(page.locator('#walkthrough .step-result-digits')).toHaveText('1□□');
  await expect(page.locator('#walkthrough .final-answer-value')).toHaveCount(0);
  await expect(page.locator('#final-answer')).toHaveText('Final answer: 144');
  await expect(page.locator('#final-answer')).not.toHaveAttribute('aria-current');
  await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
  await expect(page.locator('#walkthrough .step-label')).toHaveCount(0);
  await page.locator('#worked-example').selectOption('18-times-18');
  await expect(page.locator('#step-position')).toHaveText('1 / 7');
  await expect(page.locator('#walkthrough .learn-expression')).toHaveAccessibleName(/^18 times 18/);
  await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
  await expect(page.locator('#step-back')).toBeDisabled();
  await expect(page.locator('#step-next')).toBeEnabled();
  await page.locator('#worked-example').selectOption('random');
  await expect(page.locator('#walkthrough')).toBeVisible();
  await expect(page.locator('#walkthrough .instruction-step h3').first()).toHaveText('First');
  await expect(page.locator('#step-position')).toHaveText(/^1 \/ /);
  await expect(page.locator('#walkthrough .carry-visualizer')).toHaveCount(0);
  await expect(page.locator('#worked-example option[value="12-times-12"]')).toHaveText('12 × 12 — no carrying');
  await expect(page.locator('#worked-example option[value="18-times-18"]')).toHaveText('18 × 18 — carrying');
});

test('Learn never starts a practice timer or score; completed scores survive Learn and practice keeps immediate no-review progression', async ({ page }) => {
  await openLearn(page, 'multiplication-2');
  await openWalkthrough(page);
  await page.locator('#step-next').click();
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#live-time')).toBeHidden();
  await expect(page.locator('#previous-time')).toBeHidden();
  await expect(page.locator('#score')).toBeHidden();
  await page.keyboard.type('1234567890');
  await expect(page.locator('#walkthrough .instruction-step h3')).toHaveText('Inside');
  await expect(page.locator('#live-time')).toHaveText('0.0');
  await page.locator('#mode-practice').click();
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#score')).toBeHidden();
  await page.locator('#operation').selectOption('addition');
  await page.locator('#digit-count').selectOption('2');
  await page.locator('#start').click();
  await expect(page.locator('#mode-navigation')).toBeHidden();
  await expect(page.locator('#learn-view')).toBeHidden();
  await expect(page.locator('#exercise button')).toHaveCount(0);
  await expect(page.locator('#exercise')).not.toContainText(/walkthrough|hint|review|retry|step/i);
  for (let index = 0; index < 10; index += 1) {
    const before = await page.locator('#problem').textContent();
    const left = Number(await page.locator('#left-operand').textContent());
    const right = Number(await page.locator('#right-operand').textContent());
    const answer = String(left + right);
    await page.keyboard.type(index === 0 ? '0'.repeat(answer.length) : answer);
    if (index < 9) {
      await expect(page.locator('#problem')).not.toHaveText(before ?? '');
      await expect(page.locator('#answer')).toHaveValue('');
      await expect(page.locator('#answer')).toBeFocused();
      await expect(page.locator('#previous-time')).toHaveCSS('color', index === 0 ? 'rgb(176, 0, 0)' : 'rgb(0, 0, 0)');
    }
  }
  await expect(page.locator('#score')).toHaveText('9 / 10');
  await expect(page.locator('#score')).toBeVisible();
  await expect(page.locator('#mode-navigation')).toBeVisible();
  await openLearn(page);
  await expect(page.locator('#score')).toBeHidden();
  await expect(page.locator('#live-time')).toBeHidden();
  await page.locator('#mode-practice').click();
  await expect(page.locator('#score')).toHaveText('9 / 10');
  await expect(page.locator('#score')).toBeVisible();
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#start')).toHaveText('Start Another Round');
});

test('generic renderer highlights only supplied references and displays verified products, sums, carries and progressive digits', async ({ page }) => {
  // TEST-ONLY arithmetic trace: exercises generic rendering with ordinary arithmetic.
  // It is not an owner-authored lesson, and is never inserted into production data.
  const fixture = {
    example: { operands: ['28', '38'], operation: 'multiplication' },
    steps: [
      { id: 'test-product', highlightedDigitRefs: ['left:1', 'right:1'], operationDisplay: '8 × 8', intermediateResult: '64', carryOut: '6', carryToStepId: 'test-sum', visibleResultDigits: '4' },
      { id: 'test-product-two', highlightedDigitRefs: ['left:0', 'right:1'], operationDisplay: '2 × 8', intermediateResult: '16', visibleResultDigits: '4' },
      { id: 'test-product-three', highlightedDigitRefs: ['left:1', 'right:0'], operationDisplay: '8 × 3', intermediateResult: '24', visibleResultDigits: '4' },
      { id: 'test-sum', highlightedDigitRefs: ['left:0', 'right:1', 'left:1', 'right:0'], operationDisplay: '16 + 24 + 6', intermediateResult: '46', carryIn: '6', carryFromStepId: 'test-product', carryOut: '4', carryToStepId: 'test-final', visibleResultDigits: '64' },
      { id: 'test-final', highlightedDigitRefs: ['left:0', 'right:0'], operationDisplay: '2 × 3 + 4', intermediateResult: '10', carryIn: '4', carryFromStepId: 'test-sum', visibleResultDigits: '1064' },
    ],
  };
  expect(8 * 8).toBe(64);
  expect(2 * 8).toBe(16);
  expect(8 * 3).toBe(24);
  expect(16 + 24 + 6).toBe(46);
  expect(2 * 3 + 4).toBe(10);
  expect(28 * 38).toBe(1064);
  const selectedLabels = [
    '28 times 38. Selected digits: left operand, position 2, digit 8; right operand, position 2, digit 8.',
    '28 times 38. Selected digits: left operand, position 1, digit 2; right operand, position 2, digit 8.',
    '28 times 38. Selected digits: left operand, position 2, digit 8; right operand, position 1, digit 3.',
    '28 times 38. Selected digits: left operand, position 1, digit 2; left operand, position 2, digit 8; right operand, position 1, digit 3; right operand, position 2, digit 8.',
    '28 times 38. Selected digits: left operand, position 1, digit 2; right operand, position 1, digit 3.',
  ];

  for (let index = 0; index < fixture.steps.length; index += 1) {
    const step = fixture.steps[index]!;
    await page.evaluate(async ({ example, step }) => {
      const modulePath = '/src/learn/instructionStepRenderer.ts';
      const { renderInstructionStep } = await import(/* @vite-ignore */ modulePath);
      document.querySelector('#renderer-test-fixture')?.remove();
      const mount = document.createElement('section');
      mount.id = 'renderer-test-fixture';
      mount.append(renderInstructionStep(step, example, 2, 'multiplication'));
      document.body.append(mount);
    }, { example: fixture.example, step });
    const rendered = page.locator('#renderer-test-fixture');
    await expect(rendered.locator('.learn-expression')).toHaveAccessibleName(selectedLabels[index]!);
    await expect(rendered.locator('[data-digit-ref]')).toHaveCount(4);
    expect(await rendered.locator('.digit-highlight').evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).dataset.digitRef).sort(),
    )).toEqual([...step.highlightedDigitRefs].sort());
    const highlighted = rendered.locator('.digit-highlight').first();
    const nonColorEmphasis = await highlighted.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.textDecorationLine.includes('underline') || Number.parseFloat(style.borderBottomWidth) > 0 || style.outlineStyle !== 'none' || Number.parseInt(style.fontWeight, 10) >= 700;
    });
    expect(nonColorEmphasis).toBe(true);
    await expect(rendered.locator('.step-operation')).toHaveAccessibleName(step.operationDisplay);
    await expect(rendered.locator('.step-intermediate-result')).toHaveText(step.intermediateResult);
    await expect(rendered.locator('.step-result-digits')).toHaveText(step.visibleResultDigits);
    if ('carryOut' in step && step.carryOut) await expect(rendered.locator('.carry-out')).toHaveText(step.carryOut);
    if ('carryIn' in step && step.carryIn) await expect(rendered.locator('.carry-in')).toHaveText(step.carryIn);
    if ('carryToStepId' in step && step.carryToStepId) await expect(rendered.locator('.carry-to-step')).toHaveText(step.carryToStepId);
    if ('carryFromStepId' in step && step.carryFromStepId) await expect(rendered.locator('.carry-from-step')).toHaveText(step.carryFromStepId);
  }
});

test('addition uses the same renderer without forced multiplication stage names or implied carries', async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = '/src/learn/instructionStepRenderer.ts';
    const { renderInstructionStep } = await import(/* @vite-ignore */ modulePath);
    const mount = document.createElement('section');
    mount.id = 'renderer-test-fixture';
    mount.append(renderInstructionStep({
      id: 'test-addition', highlightedDigitRefs: ['left:0', 'right:0'],
      operationDisplay: '1 + 3', intermediateResult: '4', visibleResultDigits: '4',
    }, { operands: ['12', '34'], operation: 'addition' }, 2, 'addition'));
    document.body.append(mount);
  });
  const rendered = page.locator('#renderer-test-fixture');
  await expect(rendered.locator('.learn-expression')).toContainText('+');
  await expect(rendered.locator('h3')).toHaveCount(0);
  await expect(rendered.locator('.carry-visualizer')).toHaveCount(0);
  await expect(rendered.locator('.step-operation')).toHaveAccessibleName('1 + 3');
  await expect(rendered.locator('.step-intermediate-result')).toHaveText('4');
  await expect(rendered.locator('.learn-expression')).toHaveAccessibleName(
    '12 plus 34. Selected digits: top operand, position 1, digit 1; bottom operand, position 1, digit 3.',
  );

  // An unresolved mapping and an explicit empty/unknown selection must each
  // remain unselected, with no falsely announced positions or fallback pair.
  for (const highlightedDigitRefs of [null, [], ['left:9', 'right:100']]) {
    await page.evaluate(async (references) => {
      const modulePath = '/src/learn/instructionStepRenderer.ts';
      const { renderInstructionStep } = await import(/* @vite-ignore */ modulePath);
      document.querySelector('#renderer-test-fixture')!.replaceChildren(renderInstructionStep({
        id: 'test-unselected', highlightedDigitRefs: references,
      }, { operands: ['12', '34'], operation: 'addition' }, 2, 'addition'));
    }, highlightedDigitRefs);
    await expect(rendered.locator('.learn-expression')).toHaveAccessibleName('12 plus 34');
    await expect(rendered.locator('[data-digit-ref]')).toHaveCount(4);
    await expect(rendered.locator('.digit-highlight')).toHaveCount(0);
    await expect(rendered.locator('.digit-selection-pending')).toHaveCount(highlightedDigitRefs === null ? 1 : 0);
  }
});


test('58 above 67 resolves carries to 125 using stacked sums', async ({ page }, testInfo) => {
  await openLearn(page);
  await page.evaluate(() => {
    const draws = [(58 - 10 + 0.25) / 90, (67 - 10 + 0.25) / 90];
    Math.random = () => draws.shift() ?? 0;
  });
  await page.locator('[data-lesson-id="addition-2"]').click();
  await expect(page.locator('#lesson-expression .learn-expression')).toHaveAccessibleName('58 plus 67');
  await openWalkthrough(page);
  for (const [index, operation] of ['5 + 6', '8 + 7', '11 + 1'].entries()) {
    await expect(page.locator('#walkthrough .step-operation')).toHaveAccessibleName(operation);
    await expect(page.locator('#walkthrough .vertical-calculation')).toBeVisible();
    await expect(page.locator('#step-position')).toHaveText(`${index + 1} / 4`);
    await page.locator('#step-next').click();
  }
  await expect(page.locator('.final-answer-value')).toHaveText('125');
  const boxes = await page.locator('.final-answer-expression .learn-operand').evaluateAll(elements => elements.map(element => {
    const b=element.getBoundingClientRect(); return {top:b.top,right:b.right};
  }));
  expect(boxes[0]!.top).toBeLessThan(boxes[1]!.top);
  expect(Math.abs(boxes[0]!.right-boxes[1]!.right)).toBeLessThan(2);
  const resultRight = await page.locator('.final-answer-value').evaluate(e => e.getBoundingClientRect().right);
  expect(Math.abs(boxes[0]!.right-resultRight)).toBeLessThan(2);
  await page.screenshot({ path: `verification/${testInfo.project.name}-addition-final.png`, fullPage: true });
});

test('three-digit multiplication preserves the nine terms and resolves 123 times 456 to 56088', async ({ page }, testInfo) => {
  await openLearn(page);
  await page.evaluate(() => {
    const draws = [(123 - 100 + 0.25) / 900, (456 - 100 + 0.25) / 900];
    Math.random = () => draws.shift() ?? 0;
  });
  await page.locator('[data-lesson-id="multiplication-3"]').click();
  await openWalkthrough(page);
  const operations = ['1 × 4', '1 × 5 + 2 × 4', '1 × 6 + 3 × 4 + 2 × 5', '2 × 6 + 3 × 5', '3 × 6', '27 + 1', '28 + 2', '13 + 3', '4 + 1'];
  const intermediates = ['4','13','28','27','18','28','30','16','5'];
  for (const [index, operation] of operations.entries()) {
    await expect(page.locator('#walkthrough .step-operation')).toHaveAccessibleName(operation);
    await expect(page.locator('#walkthrough .step-intermediate-result')).toHaveText(intermediates[index]!);
    await page.locator('#step-next').click();
  }
  await expect(page.locator('#stage-sequence button')).toHaveText(['Step 1','Step 2','Step 3','Step 4','Step 5','Final answer: 56088']);
  await expect(page.locator('.final-answer-value')).toHaveText('56088');
  await expect(page.locator('#step-next')).toBeDisabled();
  await page.screenshot({ path: `verification/${testInfo.project.name}-three-digit-final.png`, fullPage: true });
});
