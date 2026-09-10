import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import MetricCards from './MetricCards';
import SharpeBadge from './SharpeBadge';
import BreakdownTable from './BreakdownTable';

export default function Results({ results, isLoading, loadingProgress, loadingStatus, tickers, errorMessage }) {
  const hasResults = results && results.metrics;

  // Build meta string
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const meta = hasResults
    ? `${Object.keys(results.allocation).length} stocks · AI Optimal Allocation · Calculated ${dateStr}`
    : '';

  return (
    <section id="results" aria-labelledby="results-heading">
      <div className="container">
        <div className="fade-up">
          <span className="section-tag" id="results-tag">
            Step 2
          </span>
          <h2 className="section-title" id="results-heading">
            Portfolio <span className="gradient-text">Analysis</span>
          </h2>
          <p className="section-subtitle" id="results-subtitle">
            {errorMessage ? (
              <span style={{ color: 'var(--accent-orange)' }}>
                ⚠️ {errorMessage}
              </span>
            ) : (
              <>
                Select your stocks above and click <strong>Calculate</strong> to fetch live market
                data and compute real portfolio metrics.
              </>
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <LoadingState
            tickers={tickers}
            progress={loadingProgress}
            statusText={loadingStatus}
          />
        )}

        {/* Empty State */}
        {!isLoading && !hasResults && !errorMessage && <EmptyState />}

        {/* Populated Results */}
        {!isLoading && hasResults && (
          <div id="results-populated">
            <MetricCards metrics={results.metrics} />

            <SharpeBadge sharpeRatio={results.metrics.sharpe_ratio} meta={meta} />

            <BreakdownTable data={results} />

            {/* Disclaimer */}
            <p className="metric-disclaimer fade-up" id="results-disclaimer">
              <span aria-hidden="true">⚠️</span>
              Historical data only. Equal-weight portfolio. Not financial advice. Past performance
              does not guarantee future results.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
