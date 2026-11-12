import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

test.beforeEach(async ({ page }) => {
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/prices?*', r => r.fulfill({ json: { dates: ['2026-11-11', '2026-11-12'], prices: [99, 100] } }));
  await page.route('**/api/optimize', r => r.fulfill({ json: { allocation: { AAPL: 0.5, MSFT: 0.5 }, ai_predictions: { AAPL: 0, MSFT: 0.1 }, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 } } }));
});

test('visible capital default and selected styling match whole-share sizing', async ({ page }) => {
  let writes = 0;
  await page.route('**/api/auth/portfolio', r => { writes++; return r.abort(); });
  await page.goto('http://localhost:3000');
  const selected = page.locator('.cap-chip[aria-pressed="true"]');
  await expect(selected).toHaveText('$15k');
  await expect(page.locator('.capital-label')).toContainText('$15,000');
  await page.locator('.btn-optimize-signals').click();
  await expect(page.locator('.buy-card').first()).toContainText('Hypothetical order: 75 whole shares');
  await page.getByRole('button', { name: '$25k', exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(selected).toHaveCount(1);
  await expect(selected).toHaveText('$25k');
  await expect(page.locator('.capital-label')).toContainText('$25,000');
  await expect(page.locator('.buy-card').first()).toContainText('Hypothetical order: 125 whole shares');
  await expect.poll(async () => {
    const on = await selected.evaluate(e => getComputedStyle(e).borderColor);
    const off = await page.locator('.cap-chip[aria-pressed="false"]').first().evaluate(e => getComputedStyle(e).borderColor);
    return on !== off;
  }).toBe(true);
  expect(writes).toBe(0);
});

test('zero-share sizing and unavailable quotes remain explicit', async ({ page }) => {
  await page.route('**/api/prices?ticker=MSFT', r => r.fulfill({ status: 503, json: { error: 'Quote unavailable' } }));
  await page.route('**/api/optimize', r => r.fulfill({ json: { allocation: { AAPL: 0.00001, MSFT: 0.99999 }, ai_predictions: {}, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 } } }));
  await page.goto('http://localhost:3000');
  await page.locator('.btn-optimize-signals').click();
  await expect(page.locator('.buy-card').filter({ hasText: 'AAPL' })).toContainText('Hypothetical order: 0 whole shares');
  await expect(page.locator('.buy-card').filter({ hasText: 'MSFT' })).toContainText('Unavailable');
});

test('guest proposals use the available width and separate stock names from metrics', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.locator('.btn-optimize-signals').click();
  const columns = page.locator('.signals-columns-layout');
  const buy = page.locator('.buy-col');
  await expect(buy).toBeVisible();
  expect((await buy.boundingBox()).width).toBeGreaterThan((await columns.boundingBox()).width * 0.95);
  await expect(page.locator('.buy-card').first().locator('dl')).toContainText('Target weight');
  await expect(page.locator('.buy-card').first().locator('.card-header')).toHaveCSS('display', 'flex');
  await page.locator('#optimal-signals').getByRole('button', { name: 'Sign in to paper trade' }).click();
  await expect(page.getByRole('dialog', { name: 'RiskFrame account' })).toBeVisible();
});

test('signed-in proposals explain an empty sell list', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: 'empty', name: 'Empty account', holdings: [], cashBalance: 0 } } }));
  await page.goto('http://localhost:3000');
  await page.locator('.btn-optimize-signals').click();
  await expect(page.locator('.sell-col')).toContainText('No owned holdings have a low target allocation');
  await expect(page.locator('.sell-card')).toHaveCount(0);
});
