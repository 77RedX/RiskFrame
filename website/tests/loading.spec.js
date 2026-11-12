import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

test('healthy backend does not impose an artificial loading delay', async ({ page }) => {
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.goto('http://localhost:3000');
  await expect(page.locator('#calculate-btn')).toBeVisible({ timeout: 2000 });
});

test('unavailable backend offers retry and recovers', async ({ page }) => {
  let ready = false;
  await page.route('**/api/live', r => r.fulfill({ status: ready ? 200 : 503, json: { status: ready ? 'ok' : 'unavailable' } }));
  await page.goto('http://localhost:3000');
  await expect(page.getByRole('button', { name: 'Retry Connection' })).toBeVisible();
  ready = true;
  await page.getByRole('button', { name: 'Retry Connection' }).click();
  await expect(page.locator('#calculate-btn')).toBeVisible({ timeout: 3000 });
});
