import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPortfolioOperation } from '../src/services/ledger.service.js';
import { User } from '../src/models/User.js';
const quote = () => ({ dates: [new Date().toISOString().slice(0, 10)], prices: [33.33] });

test('future and stale quotes reject buys and sells without mutating the ledger', () => {
  const originalNow = Date.now;
  try {
    for (const time of ['2026-11-13T00:00:00Z', '2026-11-13T23:59:59Z']) {
      Date.now = () => Date.parse(time);
      for (const operation of ['buy', 'sell']) {
        for (const date of ['2026-11-14', '2026-11-05', 'invalid']) {
          const user = { holdings: [{ ticker: 'AAPL', shares: 2, avgBuyPrice: 10 }], cashBalance: 100, trades: [] };
          const before = structuredClone(user);
          assert.throws(() => applyPortfolioOperation(user, { operation, ticker: 'AAPL', shares: 1 }, { dates: [date], prices: [10] }), /seven days/);
          assert.deepEqual(user, before);
        }
      }
      for (const date of ['2026-11-13', '2026-11-07']) {
        const user = { holdings: [], cashBalance: 100, trades: [] };
        applyPortfolioOperation(user, { operation: 'buy', ticker: 'AAPL', shares: 1 }, { dates: [date], prices: [10] });
        assert.equal(user.cashBalance, 90);
      }
    }
    Date.now = () => Date.parse('2026-11-13T00:00:00Z');
    assert.doesNotThrow(() => applyPortfolioOperation({ holdings: [], cashBalance: 100, trades: [] }, { operation: 'buy', ticker: 'AAPL', shares: 1 }, { dates: ['2026-11-06'], prices: [10] }));
  } finally { Date.now = originalNow; }
});

test('cent-exact deposit, purchase and complete sale preserve a valid empty account', () => {
  const user = { holdings: [], cashBalance: 0, trades: [] };
  applyPortfolioOperation(user, { operation: 'deposit', amount: 100.25 });
  applyPortfolioOperation(user, { operation: 'buy', ticker: 'AAPL', shares: 3 }, quote());
  assert.equal(user.cashBalance, 0.26);
  assert.equal(user.holdings[0].shares, 3);
  applyPortfolioOperation(user, { operation: 'sell', ticker: 'AAPL', shares: 3 }, quote());
  assert.equal(user.cashBalance, 100.25);
  assert.deepEqual(user.holdings, []);
  assert.equal(user.trades.length, 2);
});

test('invalid operations, insufficient funds/shares and stale quotes do not mutate balances', () => {
  for (const operation of [{ operation: 'deposit', amount: -100 }, { operation: 'deposit', amount: 100.001 }, { operation: 'buy', ticker: 'AAPL', shares: 1.5 }, { operation: 'buy', ticker: 'AAPL', shares: 10 }, { operation: 'sell', ticker: 'AAPL', shares: 1 }]) {
    const user = { holdings: [], cashBalance: 100, trades: [] };
    assert.throws(() => applyPortfolioOperation(user, operation, quote()));
    assert.equal(user.cashBalance, 100);
    assert.deepEqual(user.holdings, []);
  }
  assert.throws(() => applyPortfolioOperation({ holdings: [], cashBalance: 100 }, { operation: 'buy', ticker: 'AAPL', shares: 1 }, { dates: ['2000-01-01'], prices: [1] }), /seven days/);
  assert.equal(User.schema.options.optimisticConcurrency, true);
});
