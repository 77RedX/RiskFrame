import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });
test.beforeEach(async ({ page }) => { await page.route('**/api/prices?*', r => r.fulfill({ json: { dates: ['2026-11-10', '2026-11-11'], prices: [320, 321.25] } })); });

test('mobile trade dialog fits the viewport and sits above page controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: 'test', name: 'Test User', holdings: [{ ticker: 'AAPL', shares: 2, avgBuyPrice: 200 }], cashBalance: 1000 } } }));
  await page.goto('http://localhost:3000');
  await page.locator('.btn-holding-buy').first().click();
  const dialog = page.locator('.trade-modal-container');
  const bounds = await dialog.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(667);
  const close = page.getByRole('button', { name: 'Close trade dialog' });
  await close.click();
  await expect(dialog).toHaveCount(0);
});

test('mobile controls never widen the document', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: 'test', name: 'Test User', holdings: [], cashBalance: 0 } } }));
  await page.goto('http://localhost:3000');
  await page.locator('#calculate-btn').waitFor();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
