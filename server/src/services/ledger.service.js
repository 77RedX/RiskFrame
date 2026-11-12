import { z } from 'zod';

export const PortfolioOperationSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('deposit'), amount: z.number().finite().min(100).max(10000000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Use cent amounts') }).strict(),
  z.object({ operation: z.enum(['buy', 'sell']), ticker: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/), shares: z.number().int().positive().max(1000000) }).strict(),
]);

function invalid(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function cents(value) {
  const result = Math.round(value * 100);
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(result)) invalid('Invalid account or order amount');
  return result;
}

export function applyPortfolioOperation(user, operation, quote) {
  operation = PortfolioOperationSchema.parse(operation);
  const cash = cents(user.cashBalance);
  if (operation.operation === 'deposit') {
    const balance = cash + cents(operation.amount);
    if (!Number.isSafeInteger(balance)) invalid('Cash balance exceeds supported range');
    user.cashBalance = balance / 100;
    return;
  }
  const { ticker, shares } = operation;
  const date = quote?.dates?.at(-1);
  const age = Date.now() - Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(age) || age < 0 || age > 7 * 86400000) invalid('A closing price from the past seven days is required', 503);
  const price = cents(quote?.prices?.at(-1));
  const total = price * shares;
  if (!price || !Number.isSafeInteger(total)) invalid('Invalid order value');
  const index = user.holdings.findIndex(h => h.ticker === ticker);
  const holding = user.holdings[index];
  if (operation.operation === 'buy') {
    if (total > cash) invalid('Insufficient simulated cash');
    if (holding) {
      const quantity = holding.shares + shares;
      holding.avgBuyPrice = (holding.avgBuyPrice * holding.shares + total / 100) / quantity;
      holding.shares = quantity;
    } else user.holdings.push({ ticker, name: ticker, shares, avgBuyPrice: price / 100 });
    user.cashBalance = (cash - total) / 100;
  } else {
    if (!holding || shares > holding.shares) invalid('Insufficient shares');
    if (!Number.isSafeInteger(cash + total)) invalid('Cash balance exceeds supported range');
    holding.shares -= shares;
    if (!holding.shares) user.holdings.splice(index, 1);
    user.cashBalance = (cash + total) / 100;
  }
  user.trades = [{ type: operation.operation.toUpperCase(), ticker, shares, price: price / 100, total: total / 100, quoteDate: date, timestamp: new Date().toISOString(), simulated: true }, ...(user.trades || [])].slice(0, 50);
}
