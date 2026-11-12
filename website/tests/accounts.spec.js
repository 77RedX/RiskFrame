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
