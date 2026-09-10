import { SECTORS } from '../../data/stocks';

export default function FilterTabs({ activeSector, onSectorChange }) {
  return (
    <div className="filter-tabs" id="filter-tabs" role="tablist" aria-label="Filter by sector">
      {SECTORS.map((sector) => (
        <button
          key={sector.key}
          className={`filter-tab${activeSector === sector.key ? ' active' : ''}`}
          data-sector={sector.key}
          role="tab"
          id={sector.id}
          aria-selected={activeSector === sector.key}
          onClick={() => onSectorChange(sector.key)}
        >
          {sector.label}
        </button>
      ))}
    </div>
  );
}
