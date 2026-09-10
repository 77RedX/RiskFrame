export default function LoadingState({ tickers, progress, statusText }) {
  return (
    <div id="results-loading">
      <div className="loading-card fade-up visible">
        <div className="loading-radar" aria-hidden="true"></div>
        <div className="loading-text">Executing Quantitative Inference Engine</div>
        <div className="loading-sub" id="loading-sub">
          {statusText || 'Synchronizing with Neural Weights & Database Cache…'}
        </div>
        <div className="loading-progress-wrap">
          <div
            className="loading-progress-bar"
            id="loading-progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="loading-stocks" id="loading-stocks" style={{ color: '#C5A880', letterSpacing: '0.05em' }}>
          {tickers.join('  //  ')}
        </div>
      </div>
    </div>
  );
}
