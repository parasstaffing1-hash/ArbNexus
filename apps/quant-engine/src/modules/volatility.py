"""Volatility estimation models."""
from typing import List
import numpy as np

class VolatilityModels:
    """Historical and intraday range-based volatility estimators."""

    @staticmethod
    def realized_volatility(close_prices: List[float], annualization_factor: float = 365.0 * 24.0) -> float:
        """Calculates annualized standard deviation of log returns."""
        arr = np.array(close_prices, dtype=np.float64)
        if len(arr) < 3:
            return 0.0
        log_returns = np.diff(np.log(arr))
        std = float(np.std(log_returns, ddof=1))
        return std * np.sqrt(annualization_factor)

    @staticmethod
    def parkinson_volatility(highs: List[float], lows: List[float], annualization_factor: float = 365.0) -> float:
        """Parkinson extreme-value volatility based on high/low range:
        sigma^2 = (1 / (4 * ln(2) * N)) * sum(ln(High / Low)^2)
        """
        n = min(len(highs), len(lows))
        if n < 2:
            return 0.0
        h = np.array(highs[:n], dtype=np.float64)
        l = np.array(lows[:n], dtype=np.float64)
        ratios = np.log(h / l)
        term = np.sum(ratios ** 2) / (4.0 * np.log(2.0) * n)
        return float(np.sqrt(term * annualization_factor))

    @staticmethod
    def garman_klass_volatility(
        opens: List[float], highs: List[float], lows: List[float], closes: List[float], annualization_factor: float = 365.0
    ) -> float:
        """Garman-Klass volatility incorporating Open, High, Low, and Close prices."""
        n = min(len(opens), len(highs), len(lows), len(closes))
        if n < 2:
            return 0.0
        o = np.array(opens[:n], dtype=np.float64)
        h = np.array(highs[:n], dtype=np.float64)
        l = np.array(lows[:n], dtype=np.float64)
        c = np.array(closes[:n], dtype=np.float64)

        term1 = 0.5 * (np.log(h / l) ** 2)
        term2 = (2.0 * np.log(2.0) - 1.0) * (np.log(c / o) ** 2)
        gk = np.mean(term1 - term2)
        return float(np.sqrt(max(0.0, gk) * annualization_factor))
