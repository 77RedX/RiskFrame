import { SECTOR_BADGE } from '../../data/stocks';

export default function StockCard({ stock, isSelected, isDisabled, onToggle }) {
  const badgeClass = SECTOR_BADGE[stock.sector] || 'badge-Macro';

  const className = [
    'stock-card',
    isSelected && 'selected',
    isDisabled && !isSelected && 'disabled',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (isDisabled && !isSelected) return;
    onToggle(stock.ticker);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={className}
      role="listitem"
      data-ticker={stock.ticker}
      data-sector={stock.sector}
      data-name={stock.name.toLowerCase()}
      tabIndex={0}
      aria-label={`${stock.ticker} – ${stock.name}`}
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="stock-check" aria-hidden="true">
        {isSelected ? '✓' : ''}
      </div>
      <div className="stock-ticker">{stock.ticker}</div>
      <div className="stock-name">{stock.name}</div>
      <span className={`stock-sector-badge ${badgeClass}`}>{stock.sector}</span>
    </div>
  );
}
