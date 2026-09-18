"""Quantitative statistics using NumPy and SciPy."""
from typing import List, Dict
import numpy as np

class QuantStats:
    """Core quantitative statistical routines."""

    @staticmethod
    def rolling_zscore(prices: List[float], window: int = 20) -> List[float]:
        """Calculates rolling Z-score over a specified window."""
        arr = np.array(prices, dtype=np.float64)
        if len(arr) < window:
            return [0.0] * len(arr)

        zscores = []
        for i in range(len(arr)):
            if i < window - 1:
                zscores.append(0.0)
            else:
                sub = arr[i - window + 1 : i + 1]
                m = np.mean(sub)
                s = np.std(sub, ddof=1)
                z = (arr[i] - m) / s if s > 1e-12 else 0.0
                zscores.append(float(z))
        return zscores

    @staticmethod
    def correlation_matrix(asset_prices: Dict[str, List[float]]) -> Dict[str, Dict[str, float]]:
        """Calculates pairwise Pearson correlation matrix across multiple crypto assets."""
        keys = list(asset_prices.keys())
        min_len = min(len(asset_prices[k]) for k in keys)
        if min_len < 2 or len(keys) < 2:
            return {k: {k: 1.0} for k in keys}

        data = np.array([asset_prices[k][:min_len] for k in keys], dtype=np.float64)
        # Calculate returns
        returns = np.diff(data, axis=1) / data[:, :-1]
        corr = np.corrcoef(returns)

        result: Dict[str, Dict[str, float]] = {}
        for i, k1 in enumerate(keys):
            result[k1] = {}
            for j, k2 in enumerate(keys):
                result[k1][k2] = float(corr[i, j])
        return result
