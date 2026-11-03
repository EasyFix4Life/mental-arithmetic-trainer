import { expect, test, type Page } from '@playwright/test';

const names = ['First', 'Inside', 'Outside', 'Last'];
const ink = ['rgb(18, 108, 112)', 'rgb(117, 80, 147)', 'rgb(117, 80, 147)', 'rgb(136, 90, 21)'];
const fills = ['rgb(226, 241, 239)', 'rgb(238, 229, 244)', 'rgb(238, 229, 244)', 'rgb(246, 236, 216)'];

async function openNamedStages(page: Page) {
  await page.locator('#mode-learn').click();
  await page.locator('[data-lesson-id="multiplication-2"]').click();
  await page.locator('#worked-example').selectOption('18-times-18');
  await page.locator('#lesson-help').click();
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('named stages form one enclosed product with a distinct middle sum and a separate final answer', async ({ page }) => {
  await openNamedStages(page);
  await expect(page.locator('#stage-sequence')).toHaveAttribute('data-grouped', 'true');
  await expect(page.locator('#stage-product-group [data-stage-name]')).toHaveText(names);
  await expect(page.locator('#stage-middle-group [data-stage-name]')).toHaveText(['Inside', 'Outside']);
  await expect(page.locator('#stage-middle-group')).toHaveAccessibleName('Middle contribution: Inside plus Outside');
  await expect(page.locator('#stage-product-group')).toHaveAttribute('role', 'group');
  await expect(page.locator('#stage-product-group')).toHaveAccessibleName('First and middle contribution and Last');
  await expect(page.locator('#stage-product-group .stage-flow-connection')).toHaveText(['&', '&']);
  await expect(page.locator('#stage-sequence')).not.toContainText(/[→↓]/);
  await expect(page.locator('#stage-middle-group')).toHaveAttribute('role', 'group');
  await expect(page.locator('#stage-middle-plus')).toHaveText('+');
  await expect(page.locator('#stage-equals')).toHaveText('=');
  await expect(page.locator('#stage-product-group #stage-equals, #stage-product-group #final-answer')).toHaveCount(0);
  await expect(page.locator('#stage-sequence button')).toHaveText([...names, 'Final Answer: 324']);
  for (const id of ['stage-connection-first', 'stage-connection-last', 'stage-middle-plus', 'stage-equals']) {
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-hidden', 'true');
    expect(await page.locator(`#${id}`).getAttribute('tabindex')).toBeNull();
  }
  for (const [index, name] of names.entries()) {
    const button = page.locator(`#stage-sequence [data-stage-name="${name}"]`);
    await expect(button).toHaveCSS('font-weight', '700');
    await expect(button).toHaveCSS('border-top-width', '2px');
    await expect(button).toHaveCSS('color', ink[index]!);
    await expect(button).toHaveCSS('background-color', fills[index]!);
    await expect(button).toHaveCSS('padding', '8.5px');
  }
  await page.locator('[data-stage-name="Outside"]').hover();
  await expect(page.locator('[data-stage-name="Outside"]')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.locator('[data-stage-name="First"]')).toHaveCSS('text-decoration-line', 'underline');
  await expect(page.locator('#final-answer')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('#final-answer')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const first = page.locator('#stage-sequence [data-stage-name="First"]');
  await first.focus();
  for (const name of ['Inside', 'Outside', 'Last']) {
    await page.keyboard.press('Tab');
    await expect(page.locator(`#stage-sequence [data-stage-name="${name}"]`)).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(page.locator('#final-answer')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#walkthrough .final-answer-value')).toHaveText('324');
  await expect(page.locator('#final-answer')).toHaveAttribute('aria-current', 'step');
  await page.locator('[data-stage-name="Inside"]').click();
  await expect(page.locator('#walkthrough .step-operation')).toHaveAccessibleName('8 × 1');
  await expect(page.locator('[data-stage-name="Inside"]')).toHaveCSS('text-decoration-line', 'underline');
  await expect(page.locator('[data-stage-name="Outside"]')).toHaveCSS('font-weight', '700');
});

test('grouped equation reflows as intact units at narrow, tablet and desktop widths with doubled text', async ({ page }, info) => {
  for (const width of [280, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const textScale of [1, 2]) {
      await page.reload();
      await page.evaluate(scale => { document.documentElement.style.fontSize = `${17 * scale}px`; }, textScale);
      await openNamedStages(page);
      await expect(page.locator('#stage-product-group .stage-flow-connection')).toHaveText(['&', '&']);
      await expect(page.locator('#stage-sequence')).not.toContainText(/[→↓]/);
      for (const id of ['stage-connection-first', 'stage-connection-last']) {
        await expect(page.locator(`#${id}`)).toHaveCSS('transform', 'none');
        await expect(page.locator(`#${id}`)).toHaveCSS('writing-mode', 'horizontal-tb');
      }
      const geometry = await page.locator('#stage-sequence').evaluate(sequence => {
        const selectors = ['#stage-product-group', '#stage-middle-group', '#stage-middle-plus', '#stage-equals', '#final-answer', ...['First', 'Inside', 'Outside', 'Last'].map(name => `[data-stage-name="${name}"]`)];
        return {
          viewport: innerWidth, scroll: document.documentElement.scrollWidth,
          boxes: selectors.map(selector => ({ selector, box: sequence.querySelector(selector)!.getBoundingClientRect().toJSON() })),
          words: [...sequence.querySelectorAll<HTMLElement>('[data-stage-name]')].map(button => {
            const range = document.createRange(); range.selectNodeContents(button);
            return { label: button.textContent, fragments: range.getClientRects().length };
          }),
        };
      });
      expect(geometry.scroll, JSON.stringify({ width, textScale, geometry })).toBeLessThanOrEqual(width);
      for (const { box } of geometry.boxes) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
      expect(geometry.words.every(word => word.fragments === 1)).toBe(true);
      const middle = geometry.boxes.find(e => e.selector === '#stage-middle-group')!.box;
      for (const name of ['Inside', 'Outside']) {
        const box = geometry.boxes.find(e => e.selector === `[data-stage-name="${name}"]`)!.box;
        expect(box.left).toBeGreaterThan(middle.left);
        expect(box.right).toBeLessThan(middle.right);
        expect(box.top).toBeGreaterThan(middle.top);
        expect(box.bottom).toBeLessThan(middle.bottom);
      }
      if (width === 1280 && textScale === 1) {
        const product = geometry.boxes.find(e => e.selector === '#stage-product-group')!.box;
        const equals = geometry.boxes.find(e => e.selector === '#stage-equals')!.box;
        const final = geometry.boxes.find(e => e.selector === '#final-answer')!.box;
        expect(product.right).toBeLessThan(equals.left);
        expect(equals.right).toBeLessThan(final.left);
        expect(Math.abs((product.top + product.height / 2) - (final.top + final.height / 2))).toBeLessThan(2);
      }
      await page.locator('#stage-middle-group').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `verification/ampersand-stages-${info.project.name}-${width}-text${textScale * 100}.png`, fullPage: false });
    }
  }
});

test('numbered lessons retain their own navigation and Practice remains outside the instructional palette', async ({ page }) => {
  await page.locator('#mode-learn').click();
  for (const id of ['multiplication-1']) {
    await page.locator(`[data-lesson-id="${id}"]`).click();
    await page.locator('#lesson-help').click();
    await expect(page.locator('#stage-product-group, #stage-middle-group, #stage-equals')).toHaveCount(0);
    expect(await page.locator('#stage-sequence [data-stage-name]').allTextContents()).not.toContain('Inside');
    await expect(page.locator('#stage-sequence [data-stage-name]').first()).toHaveText('Step 1');
  }
  for (const id of ['addition-1', 'addition-2', 'addition-3', 'multiplication-3']) await expect(page.locator(`[data-lesson-id="${id}"]`)).toHaveCount(0);
  await page.locator('#mode-practice').click();
  await page.locator('#start').click();
  const answer = String(Number(await page.locator('#left-operand').textContent()) + Number(await page.locator('#right-operand').textContent()));
  await page.keyboard.type('0'.repeat(answer.length));
  await expect(page.locator('#previous-status')).toBeVisible();
  const colors = await page.locator('#practice-view').evaluate(root => [...root.querySelectorAll('*')].filter(e => e.getClientRects().length).flatMap(e => {
    const style = getComputedStyle(e); return [style.color, style.backgroundColor, style.borderTopColor];
  }));
  expect([...new Set(colors)].every(color => ['rgb(0, 0, 0)', 'rgb(255, 255, 255)', 'rgb(250, 247, 240)', 'rgba(0, 0, 0, 0)'].includes(color))).toBe(true);
  await expect(page.locator('#previous-time')).toHaveText(/^\d+\.\d$/);
});
