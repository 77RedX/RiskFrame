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
        {isSelected && (
          <svg width="10" height="8" viewBox="0 0 11 9" fill="none">
            <path
              d="M1 4.5L4 7.5L10 1.5"
              stroke="#08080A"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="stock-ticker">{stock.ticker}</div>
      <div className="stock-name">{stock.name}</div>
      <span className={`stock-sector-badge ${badgeClass}`}>{stock.sector}</span>
    </div>
  );
}
