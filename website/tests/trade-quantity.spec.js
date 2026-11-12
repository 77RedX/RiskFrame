import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

let account;
test.beforeEach(async ({ page }) => {
  account = { _id: 'quantity-test', name: 'Test User', holdings: [{ ticker: 'AAPL', shares: 2, avgBuyPrice: 90 }], cashBalance: 250 };
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: account } }));
  await page.route('**/api/prices?*', r => r.fulfill({ json: { dates: ['2026-11-11', '2026-11-12'], prices: [99, 100] } }));
  await page.goto('http://localhost:3000');
});

test('excessive sale is invalid before submission and increments stop at ownership', async ({ page }) => {
  let writes = 0;
  await page.route('**/api/auth/portfolio', r => { writes++; return r.abort(); });
  await page.locator('.btn-holding-sell').click();
  const quantity = page.locator('#trade-quantity');
  await expect(quantity).toHaveAttribute('max', '2');
  await quantity.fill('3');
  await expect(page.locator('.trade-execute-btn')).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('own 2');
  await quantity.fill('1');
  await page.getByRole('button', { name: '+5', exact: true }).click();
  await expect(quantity).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Increase shares' })).toBeDisabled();
  expect(writes).toBe(0);
});

test('fractional, blank and exponential drafts never become a different executable order', async ({ page }) => {
  await page.locator('.btn-holding-buy').click();
  const quantity = page.locator('#trade-quantity');
  for (const draft of ['1.5', '', '1e0']) {
    await quantity.fill(draft);
    await expect(quantity).toHaveValue(draft);
    await expect(page.locator('.trade-execute-btn')).toBeDisabled();
  }
  await quantity.fill('3');
  await expect(page.getByRole('alert')).toContainText('afford 2');
  await page.getByRole('button', { name: /MAX/ }).click();
  await expect(quantity).toHaveValue('2');
  await expect(page.locator('.trade-execute-btn')).toBeEnabled();
  await expect(page.getByRole('dialog')).not.toContainText('Groww/Zerodha');
  await expect(page.getByRole('button', { name: /Intraday|Delivery/ })).toHaveCount(0);
});

test('proposal sell mode with no holdings has no executable quantity', async ({ page }) => {
  await page.route('**/api/optimize', r => r.fulfill({ json: { allocation: { MSFT: 1 }, ai_predictions: {}, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 } } }));
  await page.locator('.btn-optimize-signals').click();
  await page.locator('.btn-zerodha-buy').click();
  await page.locator('.trade-tab-btn.sell').click();
  await expect(page.locator('#trade-quantity')).toHaveValue('0');
  await expect(page.locator('.trade-execute-btn')).toBeDisabled();
  await expect(page.getByRole('button', { name: /MAX/ })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('do not own');
});

test('pending order controls freeze and a server conflict leaves the ledger intact', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/auth/portfolio', async r => { await pending; await r.fulfill({ status: 409, json: { error: 'Account changed. Reload before retrying.' } }); });
  await page.locator('.btn-holding-sell').click();
  await page.locator('#trade-quantity').fill('1');
  await page.locator('.trade-execute-btn').click();
  try {
    await expect(page.locator('#trade-quantity')).toBeDisabled();
    await expect(page.locator('.trade-tab-btn.buy')).toBeDisabled();
    await expect(page.getByRole('button', { name: '+5', exact: true })).toBeDisabled();
  } finally { release(); }
  await expect(page.getByRole('alert')).toContainText('Account changed');
  await expect(page.locator('#my-portfolio')).toContainText('Cash: $250.00');
  await expect(page.locator('#trade-quantity')).toBeEnabled();
});

test('confirmed partial sale and liquidation survive reload', async ({ page }) => {
  await page.route('**/api/auth/portfolio', async r => {
    const { operation, shares } = r.request().postDataJSON();
    expect(operation).toBe('sell'); expect(shares).toBeLessThanOrEqual(account.holdings[0].shares);
    account = { ...account, cashBalance: account.cashBalance + shares * 100, holdings: account.holdings[0].shares === shares ? [] : [{ ...account.holdings[0], shares: account.holdings[0].shares - shares }] };
    await r.fulfill({ json: account });
  });
  for (const cash of ['$350.00', '$450.00']) {
    await page.locator('.btn-holding-sell').click();
    await page.locator('#trade-quantity').fill('1');
    await page.locator('.trade-execute-btn').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#my-portfolio')).toContainText(`Cash: ${cash}`);
  }
  await page.reload();
  await expect(page.locator('#my-portfolio')).toContainText('No Active Stock Holdings Found');
  await expect(page.locator('#my-portfolio')).toContainText('Cash: $450.00');
});
