export default function LoadingState({ tickers, progress, statusText }) {
  return (
    <div id="results-loading">
      <div className="loading-card fade-up visible">
        <div className="loading-spinner" aria-hidden="true"></div>
        <div className="loading-text">Fetching live market data…</div>
        <div className="loading-sub" id="loading-sub">
          {statusText}
        </div>
        <div className="loading-progress-wrap">
          <div
            className="loading-progress-bar"
            id="loading-progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="loading-stocks" id="loading-stocks">
          {tickers.join(' · ')}
        </div>
      </div>
    </div>
  );
}
