import { SECTORS } from '../../data/stocks';

export default function FilterTabs({ activeSector, onSectorChange }) {
  return (
    <div className="filter-tabs" id="filter-tabs" role="group" aria-label="Filter by sector">
      {SECTORS.map((sector) => (
        <button
          key={sector.key}
          className={`filter-tab${activeSector === sector.key ? ' active' : ''}`}
          data-sector={sector.key}
          type="button"
          id={sector.id}
          aria-pressed={activeSector === sector.key}
          onClick={() => onSectorChange(sector.key)}
        >
          {sector.label}
        </button>
      ))}
    </div>
  );
}
