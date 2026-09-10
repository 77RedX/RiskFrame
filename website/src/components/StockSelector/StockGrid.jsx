import StockCard from './StockCard';

export default function StockGrid({ stocks, selected, isFull, onToggle }) {
  return (
    <div className="stock-grid" id="stock-grid" role="list" aria-label="S&P 500 stock list">
      {stocks.map((stock) => (
        <StockCard
          key={stock.ticker}
          stock={stock}
          isSelected={selected.has(stock.ticker)}
          isDisabled={isFull}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
