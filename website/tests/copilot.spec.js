import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

test('copilot treats raw HTML as text while preserving supported formatting', async ({ page }) => {
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/agent/chat', r => r.fulfill({ json: { reply: '**Safe bold**\n<img src="data:," onerror="window.auditInjected=true">\n&lt;script&gt;alert(1)&lt;/script&gt;', toolCalls: [] } }));
  await page.goto('http://localhost:3000');
  await page.locator('.agent-toggle-btn').click();
  await page.locator('.agent-input-form input').fill('<svg onload="window.auditInjected=true">');
  await page.locator('.agent-input-form input').press('Enter');
  await expect(page.locator('.agent-text').last()).toContainText('Safe bold');
  await expect(page.locator('.agent-text').last().locator('strong')).toHaveText('Safe bold');
  await expect(page.locator('.agent-text img, .agent-text svg, .agent-text script')).toHaveCount(0);
  expect(await page.evaluate(() => window.auditInjected)).toBeUndefined();
  await expect(page.locator('.agent-text').last()).toContainText('<img');
});

test('logout clears private conversation and discards a pending account reply', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'account-token'));
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: '000000000000000000000001', name: 'First account', holdings: [], cashBalance: 0 } } }));
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let calls = 0;
  await page.route('**/api/agent/chat', async r => {
    if (++calls === 1) return r.fulfill({ json: { reply: 'PRIVATE_ACCOUNT_HISTORY', sessionId: '000000000000000000000002' } });
    await pending;
    await r.fulfill({ json: { reply: 'LATE_PRIVATE_REPLY', sessionId: '000000000000000000000002' } });
  });
  await page.goto('http://localhost:3000');
  await expect(page.locator('#nav-signout-btn')).toBeVisible();
  await page.locator('.agent-toggle-btn').click();
  await page.getByRole('textbox', { name: 'Message the copilot' }).fill('Show my saved portfolios');
  await page.locator('.agent-input-form button').click();
  await expect(page.locator('.agent-messages-container')).toContainText('PRIVATE_ACCOUNT_HISTORY');
  await page.getByRole('textbox', { name: 'Message the copilot' }).fill('Another private request');
  await page.locator('.agent-input-form button').click();
  await expect(page.locator('.agent-message.loading')).toBeVisible();
  await page.locator('#nav-signout-btn').click();
  const response = page.waitForResponse(r => r.url().includes('/api/agent/chat'));
  release(); await response;
  if (!(await page.locator('.agent-drawer').isVisible())) await page.locator('.agent-toggle-btn').click();
  await expect(page.locator('.agent-messages-container')).not.toContainText('PRIVATE_ACCOUNT_HISTORY');
  await expect(page.locator('.agent-messages-container')).not.toContainText('LATE_PRIVATE_REPLY');
  await expect(page.getByRole('textbox', { name: 'Message the copilot' })).toBeEnabled();
});

test('portfolio permission starts a fresh owned conversation and resets on logout', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rf_auth_token', 'test-token'));
  await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { _id: 'privacy-owner', name: 'Privacy account', holdings: [], cashBalance: 0 } } }));
  const requests = [];
  await page.route('**/api/agent/chat', r => {
    requests.push(r.request().postDataJSON());
    return r.fulfill({ json: { reply: 'Previous context marker', sessionId: '000000000000000000000002', toolCalls: [] } });
  });
  await page.goto('http://localhost:3000');
  await expect(page.locator('#nav-signout-btn')).toBeVisible();
  await page.locator('.agent-toggle-btn').click();
  const permission = page.getByRole('checkbox', { name: 'Allow saved portfolio context with Groq' });
  await expect(permission).not.toBeChecked();
  await page.getByRole('textbox', { name: 'Message the copilot' }).fill('Hello');
  await page.locator('.agent-input-form button').click();
  await expect(page.locator('.agent-messages-container')).toContainText('Previous context marker');
  expect(requests[0].includePortfolioContext).toBe(false);
  await permission.check();
  await expect(page.locator('.agent-messages-container')).not.toContainText('Previous context marker');
  await page.getByRole('textbox', { name: 'Message the copilot' }).fill('Show my saved strategies');
  await page.locator('.agent-input-form button').click();
  await expect(page.locator('.agent-messages-container')).toContainText('Previous context marker');
  expect(requests[1].sessionId).toBeNull(); expect(requests[1].includePortfolioContext).toBe(true);
  await page.locator('#nav-signout-btn').click();
  await page.locator('.agent-toggle-btn').click();
  await expect(permission).toHaveCount(0);
  await expect(page.locator('.agent-messages-container')).not.toContainText('Previous context marker');
});
