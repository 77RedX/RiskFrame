export default function SelectedPreview({ selected, onRemove }) {
  return (
    <div className="selected-preview fade-up" id="selected-preview" aria-label="Selected stocks">
      <div className="selected-preview-inner" id="selected-preview-inner">
        {selected.size === 0 ? (
          <span className="preview-placeholder" id="preview-placeholder">
            No stocks selected yet — click any card below to add it to your portfolio.
          </span>
        ) : (
          Array.from(selected).map((ticker) => (
            <div className="preview-chip" key={ticker}>
              {ticker}
              <button
                className="preview-chip-remove"
                aria-label={`Remove ${ticker}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(ticker);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
