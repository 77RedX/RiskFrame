import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });

test('copilot treats raw HTML as text while preserving supported formatting', async ({ page }) => {
  await page.route('**/api/health', r => r.fulfill({ json: { status: 'ok' } }));
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
