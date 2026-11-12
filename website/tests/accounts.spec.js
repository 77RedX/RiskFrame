import { test, expect } from '@playwright/test';

test.use({ channel: 'msedge' });
const url = process.env.UI_TEST_URL || 'http://localhost:3000';
const user = { _id: '000000000000000000000001', name: 'Test User', email: 'test@example.invalid', holdings: [], cashBalance: 0, preferences: {} };
test.beforeEach(async ({ page }) => {
  await page.route('**/api/health', r => r.fulfill({ json: { status: 'ok' } }));
});

test('signed-out visitor sees no seeded personal portfolio or actions', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_portfolio_holdings_guest', JSON.stringify([{ ticker: 'NVDA', shares: 35, avgBuyPrice: 112.5 }])));
  await page.goto(url);
  await expect(page.locator('#my-portfolio')).toContainText('Sign in to view your portfolio');
  await expect(page.locator('.portfolio-table')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Deposit Cash|Reset Portfolio/ })).toHaveCount(0);
  await expect(page.locator('#nav-portfolio')).toHaveText('My Portfolio');
  await page.locator('#my-portfolio').getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('.auth-modal-content')).toBeVisible();
});

test('empty authenticated ledger stays empty and logout removes account data', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user } }));
  await page.goto(url);
  await expect(page.locator('#my-portfolio')).toContainText('No Active Stock Holdings Found');
  await expect(page.locator('.portfolio-table')).toHaveCount(0);
  await expect(page.locator('#my-portfolio')).toContainText('Cash: $0.00');
  await page.reload();
  await expect(page.locator('.portfolio-table')).toHaveCount(0);
  await page.locator('#nav-signout-btn').click();
  await expect(page.locator('#my-portfolio')).toContainText('Sign in to view your portfolio');
  await expect(page.getByRole('button', { name: /Deposit Cash/ })).toHaveCount(0);
});

test('existing authenticated holdings are preserved', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { ...user, holdings: [{ ticker: 'AAPL', name: 'Apple', shares: 2, avgBuyPrice: 200 }], cashBalance: 123 } } }));
  await page.goto(url);
  await expect(page.locator('.portfolio-table tbody tr')).toHaveCount(1);
  await expect(page.locator('#my-portfolio')).toContainText('Cash: $123.00');
});

test('preferences opened after login show saved account values', async ({ page }) => {
  await page.route('**/api/auth/login', r => r.fulfill({ json: { token: 'test-token', user: { ...user, preferences: { riskTolerance: 'aggressive', maxAssetWeight: 0.2 } } } }));
  await page.goto(url);
  await page.locator('#navbar').getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.locator('.auth-modal-form input[type=email]').fill(user.email);
  await page.locator('.auth-modal-form input[type=password]').fill('test-password');
  await page.locator('.auth-submit-btn').click();
  await page.locator('button[title="Account Details"]').click();
  await page.getByRole('button', { name: /Risk Preferences/ }).click();
  await expect(page.locator('.auth-modal-form select')).toHaveValue('aggressive');
  await expect(page.locator('.auth-modal-form input[type=range]')).toHaveValue('0.2');
});
