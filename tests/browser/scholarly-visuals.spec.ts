import { expect, test, type Page } from '@playwright/test';

async function multiplication(page: Page, left = 82, right = 76) {
  await page.locator('#mode-learn').click();
  await page.evaluate(({ left, right }) => {
    const draws = [(left - 10 + 0.25) / 90, (right - 10 + 0.25) / 90];
    Math.random = () => draws.shift() ?? 0;
  }, { left, right });
  await page.locator('[data-lesson-id="multiplication-2"]').click();
  await page.locator('#lesson-help').click();
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('scholarly text and Arial mathematics accompany equal Learn stage treatments and authored pair brackets', async ({ page }, info) => {
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(250, 247, 240)');
  await expect(page.locator('body')).toHaveCSS('font-family', /Baskerville/);
  await multiplication(page);
  const colors = ['rgb(18, 108, 112)', 'rgb(117, 80, 147)', 'rgb(117, 80, 147)', 'rgb(136, 90, 21)'];
  const stages = ['First', 'Inside', 'Outside', 'Last'];
  const pairs = [['left:0', 'right:0'], ['left:1', 'right:0'], ['left:0', 'right:1'], ['left:1', 'right:1']];
  for (const [index, stage] of stages.entries()) {
    await page.locator(`#stage-sequence [data-stage-name="${stage}"]`).click();
    await expect(page.locator('#step-content .instruction-step')).toHaveAttribute('data-stage-tone', stage.toLowerCase());
    await expect(page.locator('#step-content h3')).toHaveCSS('color', colors[index]!);
    const button = page.locator(`#stage-sequence [data-stage-name="${stage}"]`);
    await expect(button).toHaveCSS('border-top-width', '2px');
    await expect(button).toHaveCSS('border-top-color', colors[index]!);
    await expect(button).toHaveCSS('text-decoration-line', 'underline');
    await expect(page.locator('#step-content .learn-expression')).toHaveCSS('font-family', /^Arial(?:,|$)/);
    expect(await page.locator('#step-content .digit-highlight').evaluateAll(elements => elements.map(e => (e as HTMLElement).dataset.digitRef))).toEqual(pairs[index]);
    await expect(page.locator('#step-content .digit-highlight').first()).toHaveCSS('color', colors[index]!);
    await expect(page.locator('.digit-pairing-connector path')).toHaveAttribute('d', /^M .+ V .+ H .+ V .+/);
    await expect(page.locator('.digit-pairing-connector path')).toHaveCSS('stroke-width', '2px');
    await expect(page.locator('.digit-pairing-connector path')).toHaveCSS('stroke', colors[index]!);
    await expect(page.locator('.digit-pairing-connector')).toHaveAttribute('aria-hidden', 'true');
    if (stage === 'Inside') await page.screenshot({ path: `verification/scholarly-${info.project.name}-inside.png`, fullPage: true });
  }
});

test('carry routes expose whole authored values, origins and destinations without reconnecting operand digits', async ({ page }, info) => {
  await multiplication(page, 98, 87);
  await page.locator('#stage-sequence [data-stage-name="Last"]').click();
  await expect(page.locator('.carry-route[data-route-kind="out"] .carry-route-origin')).toHaveText('Last');
  await expect(page.locator('.carry-route-value')).toHaveText('5');
  await expect(page.locator('.carry-route-destination')).toHaveText('Inside + Outside (127)');
  await page.locator('#step-next').click();
  await expect(page.locator('.carry-route[data-route-kind="in"] .carry-route-origin')).toHaveText('Last (56)');
  await expect(page.locator('.carry-in')).toHaveText('5');
  await expect(page.locator('.carry-out')).toHaveText('13');
  await expect(page.locator('.carry-route[data-route-kind="out"] .carry-route-destination')).toHaveText('First (72)');
  await expect(page.locator('.carry-route-arrow')).toHaveCount(4);
  await expect(page.locator('.carry-route-arrow')).toHaveText(['→', '→', '→', '→']);
  await expect(page.locator('.result-digit')).toHaveText(['□', '□', '2', '6']);
  await expect(page.locator('.digit-pairing-connector')).toHaveCount(0);
  await page.locator('#step-next').click();
  await expect(page.locator('.carry-in')).toHaveText('13');
  await expect(page.locator('.result-digit')).toHaveText(['8', '5', '2', '6']);
  await expect(page.locator('.digit-pairing-connector')).toHaveCount(0);
  await page.screenshot({ path: `verification/scholarly-${info.project.name}-carry.png`, fullPage: true });
});

test('narrow, tablet and doubled text layouts preserve the remaining lesson bracket geometry and result boxes', async ({ page }, info) => {
  for (const width of [280, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '34px'; });
    await multiplication(page, 98, 87);
    for (const stage of ['Inside', 'Outside', 'Last']) {
      await page.locator(`#stage-sequence [data-stage-name="${stage}"]`).click();
      const fit = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= innerWidth,
        overflowing: [...document.querySelectorAll<HTMLElement>('*')].filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible').map(e => `${e.tagName}.${e.className}#${e.id}`).slice(0, 12) }));
      expect(fit.fits, JSON.stringify({ width, stage, ...fit })).toBe(true);
      const bounds = await page.locator('.digit-pairing-connector').evaluate(e => ({ box: e.getBoundingClientRect().toJSON(), path: e.querySelector('path')!.getBoundingClientRect().toJSON() }));
      expect(bounds.path.left).toBeGreaterThanOrEqual(bounds.box.left - 1);
      expect(bounds.path.right).toBeLessThanOrEqual(bounds.box.right + 1);
      expect(bounds.path.bottom).toBeLessThanOrEqual(bounds.box.bottom + 1);
    }
    await page.locator('#step-next').click();
    const cells = await page.locator('.result-digit').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().toJSON()));
    expect(Math.max(...cells.map(c => c.width)) - Math.min(...cells.map(c => c.width))).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('[data-lesson-id="addition-2"], [data-lesson-id="multiplication-3"]')).toHaveCount(0);
    if (width === 768) await page.screenshot({ path: `verification/scholarly-${info.project.name}-tablet-scaled.png`, fullPage: true });
    await page.locator('#mode-practice').click();
    await page.evaluate(() => { document.documentElement.style.removeProperty('font-size'); });
  }
});

test('Practice uses only monochrome controls and feedback with a separate wrong-answer symbol and unchanged numeric time', async ({ page }, info) => {
  await page.locator('#start').click();
  const answer = String(Number(await page.locator('#left-operand').textContent()) + Number(await page.locator('#right-operand').textContent()));
  await page.keyboard.type('0'.repeat(answer.length));
  await expect(page.locator('#previous-feedback')).toHaveAttribute('data-correct', 'false');
  await expect(page.locator('#previous-status')).toBeVisible();
  await expect(page.locator('#previous-status')).toHaveText('×');
  await expect(page.locator('#previous-time')).toHaveText(/^\d+\.\d$/);
  await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('#previous-feedback')).toHaveCSS('border-top-color', 'rgb(0, 0, 0)');
  await expect(page.locator('#answer')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const colors = await page.locator('#practice-view').evaluate(root => [...root.querySelectorAll('*')].filter(e => e.getClientRects().length).flatMap(e => {
    const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.borderTopColor, s.outlineColor];
  }));
  expect([...new Set(colors)].every(c => ['rgb(0, 0, 0)', 'rgb(255, 255, 255)', 'rgb(250, 247, 240)', 'rgba(0, 0, 0, 0)'].includes(c))).toBe(true);
  await page.screenshot({ path: `verification/scholarly-${info.project.name}-practice-incorrect.png`, fullPage: false });
  const next = String(Number(await page.locator('#left-operand').textContent()) + Number(await page.locator('#right-operand').textContent()));
  await page.keyboard.type(next);
  await expect(page.locator('#previous-feedback')).toHaveAttribute('data-correct', 'true');
  await expect(page.locator('#previous-status')).toBeHidden();
  await expect(page.locator('#previous-time')).toHaveText(/^\d+\.\d$/);
  await expect(page.locator('#answer')).toBeFocused();
});

test('a short landscape keyboard viewport keeps the full problem, input, timers and previous feedback separate', async ({ page }, info) => {
  // Proxy the native Android keyboard's measured visible viewport. Also test a
  // visual viewport shorter than the layout viewport through the existing CSS
  // variable, as Safari can retain its larger layout viewport with a keyboard.
  for (const visualOnly of [false, true]) {
    await page.setViewportSize({ width: 862, height: visualOnly ? 400 : 122 });
    await page.reload();
    await page.locator('#operation').selectOption('multiplication');
    await page.locator('#digit-count').selectOption('2');
    await page.locator('#start').click();
    const first = String(Number(await page.locator('#left-operand').textContent()) * Number(await page.locator('#right-operand').textContent()));
    await page.keyboard.type('0'.repeat(first.length));
    if (visualOnly) await page.locator('#practice-view').evaluate(root => (root as HTMLElement).style.setProperty('--practice-height', '122px'));
    await expect(page.locator('#previous-status')).toBeVisible();
    const boxes = await page.evaluate(() => {
      const rect = (id: string) => document.querySelector(id)!.getBoundingClientRect().toJSON();
      return { problem: rect('#problem'), input: rect('#answer'), live: rect('#live-time'), previous: rect('#previous-feedback') };
    });
    for (const box of Object.values(boxes)) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(862);
      expect(box.bottom).toBeLessThanOrEqual(122);
    }
    const separate = (a: typeof boxes.problem, b: typeof boxes.problem, gap = 4) =>
      a.right + gap <= b.left || b.right + gap <= a.left || a.bottom + gap <= b.top || b.bottom + gap <= a.top;
    expect(separate(boxes.problem, boxes.input, 8)).toBe(true);
    expect(separate(boxes.problem, boxes.live)).toBe(true);
    expect(separate(boxes.problem, boxes.previous)).toBe(true);
    expect(separate(boxes.input, boxes.live)).toBe(true);
    expect(separate(boxes.input, boxes.previous)).toBe(true);
    expect(separate(boxes.live, boxes.previous)).toBe(true);
    const second = String(Number(await page.locator('#left-operand').textContent()) * Number(await page.locator('#right-operand').textContent()));
    await page.keyboard.type(second.slice(0, -1));
    await expect(page.locator('#answer')).toHaveValue(second.slice(0, -1));
    await expect(page.locator('#answer')).toBeFocused();
    await page.screenshot({ path: `verification/scholarly-${info.project.name}-short-keyboard-${visualOnly ? 'visual' : 'layout'}.png`, fullPage: false });
    await page.keyboard.type(second.slice(-1));
    await expect(page.locator('#answer')).toHaveValue('');
    await expect(page.locator('#previous-status')).toBeHidden();
  }
});
