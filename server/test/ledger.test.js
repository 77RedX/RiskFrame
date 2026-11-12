import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPortfolioOperation } from '../src/services/ledger.service.js';
import { User } from '../src/models/User.js';
const quote = () => ({ dates: [new Date().toISOString().slice(0, 10)], prices: [33.33] });

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
