import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import MetricCards from './MetricCards';
import SharpeBadge from './SharpeBadge';
import BreakdownTable from './BreakdownTable';

export default function Results({ results, isLoading, loadingProgress, loadingStatus, tickers, errorMessage }) {
  const hasResults = results && results.metrics;

  const dateStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const meta = hasResults
    ? `${Object.keys(results.allocation).length} Assets // SLSQP Optimal Solution // Solved ${dateStr}`
    : '';

  return (
    <section id="results" aria-labelledby="results-heading">
      <div className="container">
        <div className="fade-up">
          <span className="section-tag" id="results-tag">
            Step 02 // Quantitative Analytics
          </span>
          <h2 className="section-title" id="results-heading">
            Portfolio <span className="gradient-text">Frontier &amp; Metrics</span>
          </h2>
          <p className="section-subtitle" id="results-subtitle">
            {errorMessage ? (
              <span style={{ color: 'var(--risk-coral)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
                </svg>
                {errorMessage}
              </span>
            ) : (
              <>
                Mathematical optimization results combining forward convolutional predictions with constrained Sharpe maximization.
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

            {/* Regulatory Disclaimer */}
            <p className="metric-disclaimer fade-up" id="results-disclaimer">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.7" fill="currentColor"/>
              </svg>
              <span>
                Quantitative model output for academic research and portfolio architecture. Not investment advice. Past performance does not guarantee future capital appreciation.
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
