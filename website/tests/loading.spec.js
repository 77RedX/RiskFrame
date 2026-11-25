import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });
const healthy = { status: 'ok', database: 'connected', quant: 'ready', redis: 'memory_fallback' };

test('ready backend and quant do not impose an artificial loading delay', async ({ page }) => {
  await page.route('**/api/health', r => r.fulfill({ json: healthy }));
  await page.goto('http://localhost:3000');
  await expect(page.locator('#calculate-btn')).toBeVisible({ timeout: 2000 });
});

test('backend liveness cannot unlock the app while quant is loading', async ({ page }) => {
  let ready = false;
  let checks = 0;
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/health', r => {
    checks++;
    return r.fulfill({ status: ready ? 200 : 503, json: ready ? healthy : { status: 'degraded', database: 'connected', quant: 'unavailable' } });
  });
  await page.goto('http://localhost:3000');
  await expect.poll(() => checks).toBeGreaterThan(0);
  await expect(page.locator('#calculate-btn')).toHaveCount(0);
  await expect(page.locator('#history-search')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retry Connection' })).toBeVisible();
  ready = true;
  await page.getByRole('button', { name: 'Retry Connection' }).click();
  await expect(page.locator('#calculate-btn')).toBeVisible({ timeout: 3000 });
});

for (const [name, status, body] of [
  ['missing readiness fields', 200, { status: 'ok' }],
  ['quant unavailable despite ok status', 200, { ...healthy, quant: 'unavailable' }],
  ['database unavailable', 200, { ...healthy, database: 'unavailable' }],
  ['error status despite ready body', 503, healthy],
]) {
  test(`readiness rejects ${name} and permits recovery`, async ({ page }) => {
    let ready = false, checks = 0;
    await page.route('**/api/health', r => {
      checks++;
      return r.fulfill({ status: ready ? 200 : status, json: ready ? healthy : body });
    });
    await page.goto('http://localhost:3000');
    await expect.poll(() => checks).toBeGreaterThan(0);
    await expect(page.locator('#calculate-btn')).toHaveCount(0);
    ready = true;
    await page.getByRole('button', { name: 'Retry Connection' }).click();
    await expect(page.locator('#calculate-btn')).toBeVisible();
  });
}

test('slow startup keeps polling past 30 seconds and opens automatically when ready', async ({ page }) => {
  await page.clock.install();
  let ready = false, checks = 0;
  await page.route('**/api/health', r => {
    checks++;
    return r.fulfill({ status: ready ? 200 : 503, json: ready ? healthy : { status: 'degraded', quant: 'unavailable', database: 'connected' } });
  });
  await page.goto('http://localhost:3000');
  await expect.poll(() => checks).toBeGreaterThan(0);
  await page.clock.fastForward(31000);
  await expect(page.locator('.loading-error-msg')).toHaveText('Still waiting for services');
  await expect(page.locator('#calculate-btn')).toHaveCount(0);
  ready = true;
  await page.clock.runFor(3500);
  await expect(page.locator('#calculate-btn')).toBeVisible();
});
