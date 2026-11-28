import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

test.describe('iSharp Academy Public, Auth Guards, Responsive & Perf E2E', () => {
  test('renders public pages without console/hydration errors, broken images, or eager ExcelJS', async ({
    page,
  }) => {
    const routes = ['/', '/login', '/administration', '/register', '/demo-test'];

    for (const route of routes) {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const jsUrls: string[] = [];

      const onConsole = (msg: { type: () => string; text: () => string }) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Standalone Next.js E2E without NestJS API on 3001 returns 503 on /api/* backend proxies
          if (text.includes('503 (Service Unavailable)')) {
            return;
          }
          consoleErrors.push(text);
        }
      };
      const onPageError = (err: Error) => pageErrors.push(err.message);
      const onResponse = (res: { url: () => string }) => {
        if (res.url().endsWith('.js')) jsUrls.push(res.url());
      };

      page.on('console', onConsole);
      page.on('pageerror', onPageError);
      page.on('response', onResponse);

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      expect(pageErrors, `Uncaught page errors on ${route}`).toEqual([]);
      expect(consoleErrors, `Console errors on ${route}`).toEqual([]);
      expect(
        jsUrls.some((u) => u.includes('0_kac8o7ap509')),
        `ExcelJS chunk must not load eagerly on ${route}`,
      ).toBe(false);

      const brokenImages = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.getAttribute('src')),
      );
      expect(brokenImages, `Broken images on ${route}`).toEqual([]);

      const perf = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter((r) => r.name.endsWith('.js'));
        const totalJsBytes = jsResources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as Array<{ startTime: number }>;
        const clsEntries = performance.getEntriesByType('layout-shift') as unknown as Array<{ value: number; hadRecentInput: boolean }>;
        const cls = clsEntries.filter((e) => !e.hadRecentInput).reduce((s, e) => s + e.value, 0);
        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        return {
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
          loadMs: nav ? Math.round(nav.loadEventEnd) : 0,
          lcpMs: lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : null,
          cls: Number(cls.toFixed(4)),
          requestCount: resources.length,
          jsCount: jsResources.length,
          totalJsKB: Math.round(totalJsBytes / 1024),
          usedJsHeapMB: mem ? Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1)) : null,
        };
      });
      console.log(`PERF ${route}:`, JSON.stringify(perf));

      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('response', onResponse);
    }
  });

  test('enforces auth redirects on /admin, /dashboard/student, and /plans', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/administration/);

    await page.goto('/dashboard/student');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/plans');
    await expect(page).toHaveURL(/\/login/);
  });

  test('validates interactive forms and keyboard navigation on /login, /administration, and /register', async ({
    page,
  }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.goto('/administration');
    const adminEmail = page.locator('input[type="email"], input[name="email"]').first();
    await expect(adminEmail).toBeVisible();

    await page.goto('/register');
    const registerHeading = page.locator('h1, h2').first();
    await expect(registerHeading).toBeVisible();
  });

  for (const vp of VIEWPORTS) {
    test(`responsive layout check at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ['/', '/login', '/register', '/demo-test']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(250);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(
          overflow.scrollWidth,
          `Horizontal overflow on ${route} at ${vp.width}px`,
        ).toBeLessThanOrEqual(overflow.innerWidth + 1);
      }
    });
  }
});
