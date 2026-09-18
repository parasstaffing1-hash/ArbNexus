"""Optimization routines using SciPy and CVXPY."""
from typing import List, Dict, Any
import numpy as np
from scipy.optimize import minimize

class PortfolioOptimization:
    """Optimal sizing and risk-constrained capital allocation."""

    @staticmethod
    def optimize_trade_size(
        spread_bps: float,
        fee_bps: float,
        depth_limit_usd: float = 100000.0,
        impact_factor: float = 0.000005
    ) -> Dict[str, float]:
        """Maximizes Net Return = S * (Spread - Fee) - impact * S^2 using SciPy."""
        net_margin = (spread_bps - fee_bps) / 10000.0

        if net_margin <= 0:
            return {"optimal_size_usd": 0.0, "expected_profit_usd": 0.0}

        def objective(s):
            # Negative profit to minimize
            size = s[0]
            profit = size * net_margin - impact_factor * (size ** 2)
            return -profit

        res = minimize(
            objective,
            x0=[10000.0],
            bounds=[(0.0, depth_limit_usd)],
            method="L-BFGS-B"
        )

        optimal_size = float(res.x[0]) if res.success else 0.0
        expected_profit = float(-res.fun) if res.success else 0.0

        return {
            "optimal_size_usd": max(0.0, optimal_size),
            "expected_profit_usd": max(0.0, expected_profit),
        }
