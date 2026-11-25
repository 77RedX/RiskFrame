import unittest
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from unittest.mock import patch
from types import SimpleNamespace
import numpy as np
import pandas as pd
import torch
from optimizer import calculate_daily_returns, calculate_annualized_covariance, optimize_portfolio


class CovarianceTests(unittest.TestCase):
    def test_missing_ticker_preserves_observed_returns_for_other_assets(self):
        prices = pd.DataFrame({
            'B': [80, 83, 79, np.nan, 84, 86],
            'EMPTY': [np.nan] * 6,
            'A': [50, 49, 51, 52, 55, 54],
        })
        returns = calculate_daily_returns(prices)
        expected = prices[['B', 'A']].pct_change(fill_method=None).dropna()
        pd.testing.assert_frame_equal(returns, expected)
        from sklearn.covariance import LedoitWolf
        cov = calculate_annualized_covariance(returns)
        self.assertEqual(list(cov.columns), ['B', 'A'])
        np.testing.assert_allclose(cov, LedoitWolf().fit(expected).covariance_ * 252)

    def test_empty_or_single_joint_observation_cannot_produce_covariance(self):
        for n in [0, 1]:
            with self.subTest(n=n), self.assertRaises(ValueError):
                calculate_annualized_covariance(pd.DataFrame(np.ones((n, 2))))


class OptimizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch('dataset.download_and_prepare_data', side_effect=RuntimeError('Isolated test: no external data')), redirect_stdout(StringIO()), redirect_stderr(StringIO()):
            import app
        cls.backend = app
        app.BACKEND_READY = True
        app.TICKERS_LIST = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL']
        app.COV_MATRIX = pd.DataFrame(np.eye(5) * 0.04, index=app.TICKERS_LIST, columns=app.TICKERS_LIST)
        app.ANNUAL_MEANS = pd.Series([0.1] * 5, index=app.TICKERS_LIST)
        app.ENGINEERED_FEATURES = pd.DataFrame(np.ones((app.CONFIG['WINDOW_SIZE'], 5 * app.CONFIG['FEATURES_PER_ASSET'])))
        app.HISTORICAL_PRICES = pd.DataFrame(np.ones((2, 5)), columns=app.TICKERS_LIST, index=pd.date_range('2026-11-09', periods=2))
        app.MODEL = lambda _: torch.tensor([[0.01, 0.02, 0.03, 0.04, 0.05]])
        app.refresh_cache_if_needed = lambda: None

    def request(self, **settings):
        return self.backend.app.test_client().post('/api/optimize', json={'tickers': self.backend.TICKERS_LIST, **settings})

    def test_applies_requested_exposure_limit(self):
        r = self.request(max_weight=0.2)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(all(w <= 0.200001 for w in r.json['allocation'].values()))
        self.assertAlmostEqual(sum(r.json['allocation'].values()), 1)

    def test_supported_tickers_match_initialized_engine_universe(self):
        response = self.backend.app.test_client().get('/api/tickers')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['tickers'], self.backend.TICKERS_LIST)

    def test_applies_zero_risk_free_rate(self):
        r = self.request(risk_free_rate=0)
        self.assertEqual(r.status_code, 200)
        m = r.json['metrics']
        self.assertAlmostEqual(m['sharpe_ratio'], m['expected_return'] / m['volatility'])

    def test_missing_price_history_keeps_model_indices_and_healthy_assets_usable(self):
        app = self.backend
        eligible = ['AAPL', 'NVDA', 'GOOGL']
        client = app.app.test_client()
        with patch.object(app, 'COV_MATRIX', app.COV_MATRIX.loc[eligible, eligible]):
            self.assertEqual(client.get('/api/tickers').json['tickers'], eligible)
            self.assertEqual(self.request().status_code, 400)
            result = self.request(tickers=eligible)
            self.assertEqual(result.status_code, 200)
            self.assertAlmostEqual(result.json['ai_predictions']['NVDA'], 0.03 * 252 / 21)
            signals = client.get('/api/signals').json
            self.assertEqual({s['ticker'] for s in signals['buy_signals']}, set(eligible))

    def test_invalid_inputs_are_rejected(self):
        client = self.backend.app.test_client()
        for body in [{'tickers': 'AAPL'}, {'tickers': ['AAPL', 'AAPL']}, {'tickers': ['AAPL', 'FAKE']}, {'tickers': self.backend.TICKERS_LIST, 'max_weight': 0.1}, {'tickers': self.backend.TICKERS_LIST, 'risk_free_rate': 'invalid'}]:
            with self.subTest(body=body):
                self.assertEqual(client.post('/api/optimize', json=body).status_code, 400)

    def test_solver_rejects_infeasible_constraints(self):
        with self.assertRaises(ValueError):
            optimize_portfolio(np.array([0.1, 0.2]), np.eye(2), max_weight=0.35)

    def test_solver_failure_is_not_returned_as_success(self):
        with patch('optimizer.sco.minimize', return_value=SimpleNamespace(success=False, x=np.array([0.5, 0.5]), message='Failed')):
            with self.assertRaises(RuntimeError):
                optimize_portfolio(np.array([0.1, 0.2]), np.eye(2), max_weight=0.5)


if __name__ == '__main__':
    unittest.main()
