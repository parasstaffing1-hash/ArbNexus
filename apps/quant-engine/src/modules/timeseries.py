"""Timeseries analysis and stationarity testing using statsmodels and NumPy."""
from typing import Dict, Any, List
import numpy as np
from statsmodels.tsa.stattools import adfuller

class TimeSeriesAnalysis:
    """Provides stationarity, autocorrelation, and long-memory testing."""

    @staticmethod
    def adf_test(series: List[float]) -> Dict[str, Any]:
        """Performs Augmented Dickey-Fuller (ADF) test for stationarity."""
        arr = np.array(series, dtype=np.float64)
        if len(arr) < 15:
            return {
                "is_stationary": False,
                "p_value": 1.0,
                "adf_statistic": 0.0,
                "critical_values": {},
            }

        try:
            result = adfuller(arr, autolag="AIC")
            return {
                "adf_statistic": float(result[0]),
                "p_value": float(result[1]),
                "is_stationary": bool(result[1] < 0.05),
                "critical_values": {k: float(v) for k, v in result[4].items()},
            }
        except Exception:
            return {
                "is_stationary": False,
                "p_value": 1.0,
                "adf_statistic": 0.0,
                "critical_values": {},
            }

    @staticmethod
    def hurst_exponent(series: List[float], max_lag: int = 20) -> float:
        """Calculates Hurst exponent H.
        H < 0.5: Mean-reverting (arbitrage friendly)
        H = 0.5: Geometric Brownian Motion (random walk)
        H > 0.5: Trending/persistent
        """
        arr = np.array(series, dtype=np.float64)
        if len(arr) < max_lag * 2:
            return 0.5

        lags = range(2, max_lag)
        tau = [np.std(np.subtract(arr[lag:], arr[:-lag])) for lag in lags]
        poly = np.polyfit(np.log(list(lags)), np.log(tau), 1)
        return float(poly[0])
