import { expect, test } from '@playwright/test';

const releaseBase = 'https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases/download/v1.1.1/';
const releaseFile = (name: string) => `${releaseBase}Mental-Arithmetic-1.1.1-${name}`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('website offers clearly named, platform-specific public release downloads', async ({ page }) => {
  const section = page.getByRole('region', { name: 'Download Apps', exact: true });
  await expect(section).toBeVisible();
  await expect(section.locator('.download-card h3')).toHaveText(['macOS', 'Windows', 'Android', 'iPhone & iPad']);
  await expect(section.locator('.download-card')).toHaveCount(4);

  const platforms = [
    {
      title: 'macOS', requirements: /Apple silicon.*macOS 13 or later/,
      links: [
        ['Download macOS app (.dmg)', 'macOS-arm64.dmg'],
        ['macOS app ZIP alternative', 'macOS-arm64.zip'],
      ],
    },
    {
      title: 'Windows', requirements: /Windows 10 and 11.*64-bit \(x64\)/,
      links: [
        ['Download Windows installer (.exe)', 'Windows-x64-Setup.exe'],
        ['Windows app ZIP alternative', 'Windows-x64.zip'],
      ],
    },
    {
      title: 'Android', requirements: /Android 8 or later/,
      links: [['Download Android app (.apk)', 'Android.apk']],
    },
    {
      title: 'iPhone & iPad', requirements: /Development files for Xcode on a Mac/,
      links: [
        ['Download iOS unsigned Xcode archive', 'iOS-unsigned-archive.zip'],
        ['Download iOS simulator app', 'iOS-Simulator-app.zip'],
        ['Download iOS source (all-platforms ZIP)', 'all-platforms-source.zip'],
      ],
    },
  ];

  for (const platform of platforms) {
    const card = section.getByRole('article', { name: platform.title, exact: true });
    await expect(card).toContainText(platform.requirements);
    for (const [label, file] of platform.links) {
      const link = card.getByRole('link', { name: label, exact: true });
      await expect(link).toHaveAttribute('href', releaseFile(file!));
      await expect(link).toBeVisible();
    }
  }
  const ios = section.getByRole('article', { name: 'iPhone & iPad', exact: true });
  await expect(ios).toContainText('The device archive is unsigned and cannot be installed directly.');
  await expect(ios).toContainText('An App Store download is not available yet.');
  await expect(ios.getByRole('link', { name: /install|app store/i })).toHaveCount(0);
  await expect(section.getByRole('link', { name: 'Download Web files (.zip)', exact: true }))
    .toHaveAttribute('href', releaseFile('Web.zip'));
  await expect(section.getByRole('link', { name: 'Download all-platforms source (.zip)', exact: true }))
    .toHaveAttribute('href', releaseFile('all-platforms-source.zip'));
  await expect(section.getByRole('link', { name: 'View all releases', exact: true }))
    .toHaveAttribute('href', 'https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases');

  // Check rendered destinations without downloading the installers in a browser.
  const urls = await section.getByRole('link').evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).href),
  );
  expect(urls).toHaveLength(11);
  expect(urls.every((url) => url.startsWith('https://github.com/EasyFix4Life/mental-arithmetic-trainer/releases'))).toBe(true);
  expect(urls.some((url) => /127\.0\.0\.1|localhost|file:\/\//.test(url))).toBe(false);
});

test('Download Apps is keyboard reachable and scrolls to a named section from either mode', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Modes', exact: true });
  const link = navigation.getByRole('link', { name: 'Download Apps', exact: true });
  await expect(link).toHaveAttribute('href', '#app-downloads');
  await page.locator('#mode-practice').focus();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#app-downloads$/);
  await expect(page.locator('#app-downloads')).toBeFocused();
  await expect(page.locator('#app-downloads-title')).toBeInViewport();
  await expect(page.locator('#practice-view')).toBeVisible();
  await expect(page.locator('#learn-view')).toBeHidden();

  await page.locator('#mode-learn').click();
  await expect(page.locator('#learn-view')).toBeVisible();
  await expect(page.locator('#practice-view')).toBeHidden();
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#app-downloads-title')).toBeInViewport();
  await expect(page.locator('#learn-view')).toBeVisible();
  await expect(page.locator('#practice-view')).toBeHidden();
});

test('platform cards and navigation fit desktop and 390/280-pixel phones without overlap', async ({ page }, testInfo) => {
  for (const width of [1280, 390, 280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#download-apps-link').click();
    await expect(page.locator('#app-downloads-title')).toBeInViewport();
    const layout = await page.evaluate(() => {
      const bounds = (element: Element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, height: box.height };
      };
      return {
        scrollWidth: document.documentElement.scrollWidth,
        cards: [...document.querySelectorAll('.download-card')].map(bounds),
        links: [...document.querySelectorAll('#app-downloads a, #mode-navigation > *')].map(bounds),
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(width);
    for (const box of [...layout.cards, ...layout.links]) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.height).toBeGreaterThan(0);
    }
    for (let first = 0; first < layout.cards.length; first += 1) {
      for (let second = first + 1; second < layout.cards.length; second += 1) {
        const a = layout.cards[first]!;
        const b = layout.cards[second]!;
        expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
      }
    }
    if (width < 700) {
      for (let index = 1; index < layout.cards.length; index += 1) {
        expect(layout.cards[index]!.top).toBeGreaterThanOrEqual(layout.cards[index - 1]!.bottom);
      }
    }
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(232, 215, 181)');
    if ((testInfo.project.name === 'desktop' && width === 1280)
      || (testInfo.project.name === 'mobile' && width < 700)) {
      await page.screenshot({ path: `verification/downloads-${testInfo.project.name}-${width}.png`, fullPage: true });
    }
  }
});

test('downloads hide throughout a ten-answer round and return with correct score and timing', async ({ page }) => {
  const instant = new Date('2026-11-02T16:00:00Z');
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(new Date(instant.getTime() + 1_000));
  await page.locator('#download-apps-link').click();
  await page.locator('#operation').selectOption('multiplication');
  await page.locator('#digit-count').selectOption('3');
  await page.locator('#start').click();

  const durations = [120, 230, 340, 450, 560, 670, 780, 890, 1000, 1110];
  for (let index = 0; index < durations.length; index += 1) {
    await expect(page.locator('#mode-navigation')).toBeHidden();
    await expect(page.locator('#download-apps-link')).toBeHidden();
    await expect(page.locator('#app-downloads')).toBeHidden();
    await expect(page.locator('#round-timing')).toBeHidden();
    await expect(page.locator('#answer')).toBeFocused();
    const left = Number(await page.locator('#left-operand').textContent());
    const right = Number(await page.locator('#right-operand').textContent());
    const answer = String(left * right);
    await page.clock.runFor(durations[index]!);
    if (index === 0) {
      await page.keyboard.type(answer.slice(0, -1));
      await page.keyboard.press('Enter');
      await expect(page.locator('#answer')).toHaveValue(answer.slice(0, -1));
      await expect(page.locator('#live-time')).toHaveText('0.1');
      await page.keyboard.type(answer.slice(-1));
      await expect(page.locator('#previous-time')).toHaveText('0.1');
      await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(0, 0, 0)');
    } else if (index === 1) {
      await page.keyboard.type('0'.repeat(answer.length));
      await expect(page.locator('#previous-time')).toHaveText('0.2');
      await expect(page.locator('#previous-time')).toHaveCSS('color', 'rgb(176, 0, 0)');
    } else {
      await page.keyboard.type(answer);
    }
  }

  await expect(page.locator('#score')).toHaveText('9 / 10');
  await expect(page.locator('#maximum-time')).toHaveText('1.1 s');
  await expect(page.locator('#minimum-time')).toHaveText('0.1 s');
  await expect(page.locator('#average-time')).toHaveText('0.6 s');
  await expect(page.locator('#mode-navigation')).toBeVisible();
  await expect(page.locator('#download-apps-link')).toBeVisible();
  await expect(page.locator('#app-downloads')).toBeVisible();
  await expect(page.locator('#exercise')).toBeHidden();
  await expect(page.locator('#start')).toHaveText('Start Another Round');
  await page.locator('#download-apps-link').click();
  await expect(page.locator('#app-downloads-title')).toBeInViewport();
  await page.locator('#mode-learn').click();
  await page.locator('#mode-practice').click();
  await expect(page.locator('#score')).toHaveText('9 / 10');
  await expect(page.locator('#average-time')).toHaveText('0.6 s');
  await expect(page.locator('#exercise')).toBeHidden();
  await page.locator('#start').click();
  await expect(page.locator('#app-downloads')).toBeHidden();
  await expect(page.locator('#score')).toBeHidden();
  await expect(page.locator('#round-timing')).toBeHidden();
  await expect(page.locator('#answer')).toHaveValue('');
  await expect(page.locator('#answer')).toBeFocused();
});

test('production view excludes download controls from native app origins and the default mount', async ({ page }) => {
  const mounts = await page.evaluate(async () => {
    const viewPath = '/src/view.ts';
    const controllerPath = '/src/roundController.ts';
    const downloadsPath = '/src/downloadsView.ts';
    const [{ mountView }, { RoundController }, { shouldShowWebsiteDownloads }] = await Promise.all([
      import(viewPath), import(controllerPath), import(downloadsPath),
    ]);
    const root = document.querySelector<HTMLElement>('#app')!;
    const origins = [
      { protocol: 'app:', hostname: 'trainer', website: false },
      { protocol: 'https:', hostname: 'appassets.androidplatform.net', website: false },
      { protocol: 'file:', hostname: '', website: false },
      { protocol: 'capacitor:', hostname: 'localhost', website: false },
      { protocol: 'https:', hostname: 'whoami.school', website: true },
      { protocol: 'http:', hostname: '127.0.0.1', website: true },
    ];
    const result = origins.map((origin) => {
      const enabled = shouldShowWebsiteDownloads(origin);
      const unmount = mountView(root, new RoundController(), { showDownloads: enabled });
      const mounted = {
        origin, enabled,
        downloads: root.querySelectorAll('#app-downloads').length,
        navigationLinks: root.querySelectorAll('#download-apps-link').length,
        practiceVisible: !root.querySelector<HTMLElement>('#practice-view')!.hidden,
      };
      unmount();
      return mounted;
    });
    const unmountDefault = mountView(root, new RoundController());
    const defaultDownloads = root.querySelectorAll('#app-downloads, #download-apps-link').length;
    unmountDefault();
    return { origins: result, defaultDownloads };
  });
  expect(mounts.defaultDownloads).toBe(0);
  for (const mount of mounts.origins) {
    expect(mount.enabled, `${mount.origin.protocol}//${mount.origin.hostname}`).toBe(mount.origin.website);
    expect(mount.downloads).toBe(Number(mount.origin.website));
    expect(mount.navigationLinks).toBe(Number(mount.origin.website));
    expect(mount.practiceVisible).toBe(true);
  }
});
