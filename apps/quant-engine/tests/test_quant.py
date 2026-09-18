"""Unit and property-based tests for Quant Engine using Pytest and Hypothesis."""
import pytest
import numpy as np
from hypothesis import given, settings, strategies as st
from src.modules.data_processing import QuantDataProcessor
from src.modules.statistics import QuantStats
from src.modules.timeseries import TimeSeriesAnalysis
from src.modules.pairs import PairsTradingAnalysis
from src.modules.volatility import VolatilityModels
from src.modules.optimization import PortfolioOptimization

def test_polars_data_processing():
    trades = [
        {"id": "1", "exchange": "binance", "symbol": "BTC/USDT", "price": 65000.0, "amount": 1.0, "cost": 65000.0, "side": "buy", "timestamp": 1000},
        {"id": "2", "exchange": "bybit", "symbol": "BTC/USDT", "price": 65100.0, "amount": 0.5, "cost": 32550.0, "side": "sell", "timestamp": 1001},
    ]
    df = QuantDataProcessor.trades_to_polars(trades)
    assert df.shape[0] == 2
    arrow_tbl = QuantDataProcessor.polars_to_arrow(df)
    assert arrow_tbl.num_rows == 2

def test_statistics_and_correlation():
    a = [10.0, 11.0, 12.0, 13.0, 14.0]
    b = [20.0, 22.0, 24.0, 26.0, 28.0]
    corr_matrix = QuantStats.correlation_matrix({"A": a, "B": b})
    assert "A" in corr_matrix and "B" in corr_matrix
    assert pytest.approx(corr_matrix["A"]["B"], 0.01) == 1.0

def test_volatility_models():
    closes = [100.0, 102.0, 101.0, 103.0, 105.0, 104.0, 106.0]
    vol = VolatilityModels.realized_volatility(closes)
    assert vol > 0

    highs = [102.0, 103.0, 104.0, 106.0, 107.0]
    lows = [99.0, 100.0, 101.0, 102.0, 103.0]
    p_vol = VolatilityModels.parkinson_volatility(highs, lows)
    assert p_vol > 0

def test_optimization():
    res = PortfolioOptimization.optimize_trade_size(spread_bps=30.0, fee_bps=10.0, depth_limit_usd=100000.0)
    assert res["optimal_size_usd"] > 0
    assert res["expected_profit_usd"] > 0

@settings(deadline=None)
@given(st.lists(st.floats(min_value=1.0, max_value=10000.0), min_size=20, max_size=50))
def test_hypothesis_rolling_zscore_properties(prices):
    """Property-based test: rolling Z-score must never produce NaN or infinite values on finite positive prices."""
    zscores = QuantStats.rolling_zscore(prices, window=10)
    assert len(zscores) == len(prices)
    for z in zscores:
        assert not np.isnan(z)
        assert not np.isinf(z)
