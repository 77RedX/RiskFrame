import unittest
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from unittest.mock import patch
from types import SimpleNamespace
import numpy as np
import pandas as pd
import torch
from optimizer import optimize_portfolio


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

    def test_applies_zero_risk_free_rate(self):
        r = self.request(risk_free_rate=0)
        self.assertEqual(r.status_code, 200)
        m = r.json['metrics']
        self.assertAlmostEqual(m['sharpe_ratio'], m['expected_return'] / m['volatility'])

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
