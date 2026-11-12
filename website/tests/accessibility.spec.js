import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

test('account dialog has labels, traps focus, closes on Escape and restores focus', async ({ page }) => {
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.goto('http://localhost:3000');
  const opener = page.locator('#navbar').getByRole('button', { name: 'Sign In', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'RiskFrame account' });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Close account dialog' });
  await expect(close).toBeFocused();
  await expect(dialog.getByLabel('Email Address')).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Create one now' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});
