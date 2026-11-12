import { test, expect } from '@playwright/test';

test.use({ channel: 'msedge' });
const basket = ['AAPL', 'MSFT', 'NVDA', 'AMZN'];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: {} }));
  await page.goto('http://localhost:3000');
  await expect(page.locator('#calculate-btn')).toBeVisible();
});

async function select(page) {
  for (const ticker of basket) await page.locator(`.stock-card[data-ticker="${ticker}"]`).click();
}

async function intercept(page) {
  const requests = [];
  await page.route('**/api/optimize', async route => {
    const { tickers } = route.request().postDataJSON();
    requests.push(tickers);
    await route.fulfill({ json: {
      allocation: Object.fromEntries(tickers.map(t => [t, 1 / tickers.length])),
      ai_predictions: Object.fromEntries(tickers.map(t => [t, 0.1])),
      metrics: { expected_return: 0.12, volatility: 0.15, sharpe_ratio: 0.53 },
    } });
  });
  return requests;
}

for (const activation of ['click', 'Enter', 'Space']) {
  test(`selected basket submits via ${activation}`, async ({ page }) => {
    const requests = await intercept(page);
    await expect(page.locator('#calculate-btn')).toBeDisabled();
    await page.locator('.stock-card[data-ticker="AAPL"]').click();
    await expect(page.locator('#calculate-btn')).toBeDisabled();
    await page.locator('.stock-card[data-ticker="AAPL"]').click();
    await select(page);
    const button = page.locator('#calculate-btn');
    if (activation === 'click') await button.click();
    else { await button.focus(); await button.press(activation); }
    await expect(page.locator('#results-populated')).toBeVisible();
    expect(requests).toEqual([basket]);
    await expect(page.locator('#breakdown-tbody tr')).toHaveCount(4);
    await expect(page.locator('#results-metric-grid')).toContainText('Expected Annualized Return');
    await expect(button).toBeEnabled();
  });
}

for (const selected of [false, true]) {
  test(`signals optimization with ${selected ? 'selected' : 'default'} basket`, async ({ page }) => {
    const requests = await intercept(page);
    if (selected) await select(page);
    await page.getByRole('button', { name: /Optimize According to Stocks/ }).click();
    await expect(page.locator('#results-populated')).toBeVisible();
    expect(requests).toEqual([selected ? basket : ['NVDA', 'AAPL', 'MSFT', 'AVGO', 'AMZN', 'LLY', 'GOOGL', 'META']]);
  });
}

test('pending request disables button and failure allows retry', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/optimize', async route => {
    await pending;
    await route.fulfill({ status: 500, json: { error: 'Test optimization failure' } });
  });
  await select(page);
  await page.locator('#calculate-btn').click();
  try {
    await expect(page.locator('#results-loading')).toBeVisible();
    await expect(page.locator('#calculate-btn')).toBeDisabled();
  } finally { release(); }
  await expect(page.locator('#results')).toContainText('Test optimization failure');
  await expect(page.locator('#calculate-btn')).toBeEnabled();
});

test('signals never announce success after a failed optimization', async ({ page }) => {
  await page.route('**/api/optimize', r => r.fulfill({ status: 500, json: { error: 'Solver unavailable' } }));
  await page.getByRole('button', { name: /Optimize According to Stocks/ }).click();
  await expect(page.locator('#results')).toContainText('Solver unavailable');
  await page.waitForTimeout(1500);
  await expect(page.locator('.signals-toast').filter({ hasText: 'Optimization Complete' })).toHaveCount(0);
});
