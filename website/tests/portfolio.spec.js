import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/health', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: '000000000000000000000001', name: 'Test User', email: 'test@example.invalid', holdings: [], cashBalance: 0, preferences: {} } } }));
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: '+ Deposit Cash', exact: true }).click();
});

test('all deposit presets and custom cents are valid', async ({ page }) => {
  const input = page.locator('.custom-dep');
  for (const amount of ['$5k', '$10k', '$25k', '$50k']) {
    await page.locator('.dep-chip').filter({ hasText: amount }).click();
    expect(await input.evaluate(e => e.checkValidity())).toBe(true);
  }
  await input.fill('100.25');
  expect(await input.evaluate(e => e.checkValidity())).toBe(true);
  await input.fill('99.99');
  expect(await input.evaluate(e => e.checkValidity())).toBe(false);
});
