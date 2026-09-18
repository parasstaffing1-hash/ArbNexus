"""Pairs trading and cointegration analysis using statsmodels."""
from typing import Dict, Any, List
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import coint

class PairsTradingAnalysis:
    """Cointegration testing and statistical arbitrage pair generation."""

    @staticmethod
    def test_cointegration(prices_a: List[float], prices_b: List[float]) -> Dict[str, Any]:
        """Performs Engle-Granger two-step cointegration test."""
        n = min(len(prices_a), len(prices_b))
        if n < 20:
            return {
                "is_cointegrated": False,
                "p_value": 1.0,
                "hedge_ratio": 1.0,
                "half_life_periods": 0.0,
            }

        a = np.array(prices_a[:n], dtype=np.float64)
        b = np.array(prices_b[:n], dtype=np.float64)

        try:
            # 1. Cointegration score and p-value
            score, p_value, _ = coint(a, b)

            # 2. OLS regression to find hedge ratio: A = alpha + beta * B + eps
            b_const = sm.add_constant(b)
            model = sm.OLS(a, b_const).fit()
            hedge_ratio = float(model.params[1])

            # 3. Calculate spread and Ornstein-Uhlenbeck half-life
            spread = a - hedge_ratio * b
            delta_spread = np.diff(spread)
            lag_spread = spread[:-1]

            ou_model = sm.OLS(delta_spread, sm.add_constant(lag_spread)).fit()
            theta = -float(ou_model.params[1])
            half_life = float(np.log(2) / theta) if theta > 1e-6 else 0.0

            return {
                "is_cointegrated": bool(p_value < 0.05),
                "p_value": float(p_value),
                "coint_score": float(score),
                "hedge_ratio": hedge_ratio,
                "half_life_periods": max(0.0, half_life),
                "spread_mean": float(np.mean(spread)),
                "spread_std": float(np.std(spread)),
            }
        except Exception:
            return {
                "is_cointegrated": False,
                "p_value": 1.0,
                "hedge_ratio": 1.0,
                "half_life_periods": 0.0,
            }
