"""Machine Learning wrapper models surrounding the deterministic arbitrage core.
IMPORTANT:
ML predictions provide scoring, classification, and probability bounds ONLY.
ML predictions must NEVER overwrite or mutate deterministic fee or profit calculations.
"""
from typing import Dict, Any, List
import numpy as np

class OpportunitySurvivalModel:
    """Predicts the probability that an arbitrage spread will persist long enough to execute."""

    @staticmethod
    def predict_survival_probability(spread_bps: float, volatility_30d: float, latency_ms: int) -> float:
        # Logistic curve: high volatility & high latency degrade survival
        score = (spread_bps * 0.1) - (volatility_30d * 1.5) - (latency_ms * 0.005)
        prob = 1.0 / (1.0 + np.exp(-score))
        return float(np.clip(prob, 0.05, 0.99))

class FillProbabilityModel:
    """Estimates the probability of limit order execution at the target price."""

    @staticmethod
    def predict_fill_probability(distance_to_mid_bps: float, orderbook_imbalance: float) -> float:
        # Distance to mid decreases fill prob, positive imbalance increases it
        score = 1.0 - (distance_to_mid_bps * 0.15) + (orderbook_imbalance * 0.5)
        prob = 1.0 / (1.0 + np.exp(-score))
        return float(np.clip(prob, 0.1, 0.98))

class SlippageModel:
    """Predicts execution slippage in basis points based on order size and market depth."""

    @staticmethod
    def predict_slippage_bps(order_size_usd: float, depth_usd: float) -> float:
        if depth_usd <= 0:
            return 100.0
        ratio = order_size_usd / depth_usd
        # Non-linear market impact in basis points
        return float(np.clip(100.0 * (ratio ** 0.6), 0.5, 250.0))

class ExecutionDelayModel:
    """Predicts probable network and block inclusion delay in milliseconds."""

    @staticmethod
    def predict_delay_ms(base_gas_gwei: float, network_congestion_score: float) -> int:
        base_ms = 80
        added = int(base_gas_gwei * 1.5 + network_congestion_score * 50)
        return base_ms + added

class AnomalyModel:
    """Detects unusual market spread anomalies using isolation thresholding."""

    @staticmethod
    def is_anomaly(current_spread_bps: float, historical_spreads: List[float]) -> bool:
        if len(historical_spreads) < 10:
            return False
        arr = np.array(historical_spreads)
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return False
        z = abs(current_spread_bps - mean) / std
        return bool(z > 3.5)

class LiquidityModel:
    """Evaluates top-of-book and multi-level liquidity replenishment speed."""

    @staticmethod
    def predict_replenish_rate_usd_per_sec(daily_volume_usd: float) -> float:
        # Estimate passive order replenishment flow
        return float(daily_volume_usd / 86400.0 * 0.05)
