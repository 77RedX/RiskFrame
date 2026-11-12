import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

test('no invented model signals appear before a calculation', async ({ page }) => {
  await page.route('**/api/health', r => r.fulfill({ json: { status: 'ok' } }));
  await page.goto('http://localhost:3000');
  await expect(page.locator('#calculate-btn')).toBeVisible();
  await expect(page.locator('.buy-card')).toHaveCount(0);
  await expect(page.locator('#optimal-signals')).toContainText('Run an optimization');
});

test('portfolio quotes come from the dated price response', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/health', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: 'test', name: 'Test User', holdings: [{ ticker: 'AAPL', shares: 1, avgBuyPrice: 200 }], cashBalance: 0 } } }));
  await page.route('**/api/prices?*', r => r.fulfill({ json: { dates: ['2026-11-10', '2026-11-11'], prices: [320, 321.25], source: 'historical-close' } }));
  await page.goto('http://localhost:3000');
  await expect(page.locator('.portfolio-table')).toContainText('$321.25');
  await expect(page.locator('#my-portfolio')).toContainText('2026-11-11');
  await expect(page.locator('.port-live-dot')).not.toHaveText('LIVE');
});
