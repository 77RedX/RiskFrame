import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import routes from '../../server/src/routes/optimize.routes.js';
import axios from '../../server/node_modules/axios/index.js';
const require = createRequire(new URL('../../server/package.json', import.meta.url));
const express = require('express');
test.use({ channel: 'msedge' });

test('malformed quant results surface an error; retry renders a valid result', async ({ page }) => {
  const post = axios.post;
  let valid = false, calls = 0;
  axios.post = async (_url, body) => {
    calls++;
    return { data: valid ? {
      allocation: Object.fromEntries(body.tickers.map(t => [t, 0.25])),
      ai_predictions: Object.fromEntries(body.tickers.map(t => [t, 0.1])),
      metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 },
    } : { allocation: {}, metrics: {} } };
  };
  const app = express(); app.use(express.json()); app.use('/api', routes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    await page.route('**/api/live', r => r.fulfill({ json: { status: 'ok' } }));
    await page.route('**/api/auth/me', r => r.fulfill({ status: 401, json: {} }));
    await page.route('**/api/optimize', async route => {
      await route.fulfill({ response: await route.fetch({ url: `http://127.0.0.1:${server.address().port}/api/optimize` }) });
    });
    await page.goto('http://localhost:3000');
    for (const ticker of ['AAPL', 'MSFT', 'NVDA', 'AMZN']) await page.locator(`.stock-card[data-ticker="${ticker}"]`).click();
    await page.locator('#calculate-btn').click();
    await expect(page.locator('#results')).toContainText('Quant engine unavailable');
    await expect(page.locator('#results-populated')).toHaveCount(0);
    await expect(page.locator('#results')).not.toContainText('NaN');
    valid = true;
    await page.locator('#calculate-btn').click();
    await expect(page.locator('#results-populated')).toBeVisible();
    await expect(page.locator('#breakdown-tbody tr')).toHaveCount(4);
    expect(calls).toBe(2);
  } finally { axios.post = post; await new Promise(resolve => server.close(resolve)); }
});
