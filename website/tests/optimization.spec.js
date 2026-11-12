import { test, expect } from '@playwright/test';

test.use({ channel: 'msedge' });
const basket = ['AAPL', 'MSFT', 'NVDA', 'AMZN'];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/live', route => route.fulfill({ json: { status: 'ok' } }));
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

test('changing selected stocks invalidates displayed results', async ({ page }) => {
  await intercept(page);
  await select(page);
  await page.locator('#calculate-btn').click();
  await expect(page.locator('#results-populated')).toBeVisible();
  await page.locator('.stock-card[data-ticker="MSFT"]').click();
  await expect(page.locator('#results-populated')).toHaveCount(0);
});

test('late response cannot restore results for an obsolete selection', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/optimize', async route => {
    await pending;
    await route.fulfill({ json: { allocation: { AAPL: 1 }, ai_predictions: { AAPL: 0.1 }, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 } } });
  });
  await select(page);
  await page.locator('#calculate-btn').click();
  await expect(page.locator('#results-loading')).toBeVisible();
  await page.locator('.stock-card[data-ticker="MSFT"]').click();
  const response = page.waitForResponse(r => r.url().includes('/api/optimize'));
  release(); await response;
  await expect(page.locator('#results-populated')).toHaveCount(0);
  await expect(page.locator('#results-loading')).toHaveCount(0);
});

test('per-run exposure and zero risk-free rate reach the optimizer', async ({ page }) => {
  await page.locator('#max-asset-weight').fill('20');
  await page.locator('#risk-free-rate').fill('0');
  let body;
  await page.route('**/api/optimize', async route => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { allocation: Object.fromEntries(body.tickers.map(t => [t, 0.2])), ai_predictions: {}, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.5 }, applied_settings: { max_weight: 0.2, risk_free_rate: 0 } } });
  });
  await select(page);
  await page.locator('#calculate-btn').click();
  await expect(page.locator('#results')).toContainText('Select at least 5 stocks');
  expect(body).toBeUndefined();
  await page.locator('.stock-card[data-ticker="GOOGL"]').click();
  await page.locator('#calculate-btn').click();
  await expect(page.locator('#results-populated')).toBeVisible();
  expect(body.max_weight).toBe(0.2);
  expect(body.risk_free_rate).toBe(0);
  await expect(page.locator('#results')).toContainText('0.00% annual risk-free rate');
});

test('zero model weight is never replaced by a default buy allocation', async ({ page }) => {
  await page.route('**/api/optimize', route => route.fulfill({ json: { allocation: { AAPL: 0, MSFT: 0.35, NVDA: 0.35, AMZN: 0.3 }, ai_predictions: { AAPL: 0, MSFT: 0, NVDA: 0, AMZN: 0 }, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 } } }));
  await select(page);
  await page.locator('#calculate-btn').click();
  await expect(page.locator('#results-populated')).toBeVisible();
  await expect(page.locator('.buy-card').filter({ has: page.locator('.card-ticker', { hasText: /^AAPL$/ }) })).toHaveCount(0);
  await expect(page.locator('.buy-card').filter({ has: page.locator('.card-ticker', { hasText: /^MSFT$/ }) })).toContainText('+0%');
});
