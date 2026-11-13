const isRecord = value => value !== null && typeof value === 'object' &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

export function validateQuantResponse(data, tickers, maxWeight) {
  const invalid = () => { throw new Error('Invalid quant response'); };
  const matchesBasket = value => isRecord(value) && Object.keys(value).length === tickers.length &&
    tickers.every(ticker => Object.hasOwn(value, ticker));
  if (!isRecord(data) || !isRecord(data.metrics) || !matchesBasket(data.allocation) ||
      !matchesBasket(data.ai_predictions)) invalid();
  if (!['expected_return', 'volatility', 'sharpe_ratio'].every(field => Number.isFinite(data.metrics[field])) ||
      data.metrics.volatility < 0) invalid();

  // Accommodate solver rounding without repairing invalid allocations.
  const weights = Object.values(data.allocation);
  if (!weights.every(weight => Number.isFinite(weight) && weight >= 0 && weight <= maxWeight + 1e-6) ||
      Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) > 1e-5 ||
      !Object.values(data.ai_predictions).every(Number.isFinite)) invalid();

  if (data.individual_metrics !== undefined) {
    if (!matchesBasket(data.individual_metrics) || !Object.values(data.individual_metrics).every(metrics =>
      isRecord(metrics) && ['historical_return', 'historical_volatility', 'historical_sharpe'].every(field =>
        Number.isFinite(metrics[field])) && metrics.historical_volatility >= 0)) invalid();
  }
  return data;
}
