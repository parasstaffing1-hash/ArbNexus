"""Main entry point for the Quantitative Research Engine."""
import sys
from src.modules.data_processing import QuantDataProcessor
from src.modules.statistics import QuantStats
from src.modules.timeseries import TimeSeriesAnalysis
from src.modules.pairs import PairsTradingAnalysis
from src.modules.volatility import VolatilityModels
from src.modules.optimization import PortfolioOptimization
from src.models.ml_stubs import OpportunitySurvivalModel, FillProbabilityModel, SlippageModel

def run_diagnostics():
    print("====================================================")
    print("[QUANT RESEARCH ENGINE STARTUP DIAGNOSTICS]")
    print("====================================================")

    # 1. Test Polars conversion
    trades = [
        {"id": "t1", "exchange": "binance", "symbol": "BTC/USDT", "price": 67000.0, "amount": 0.5, "cost": 33500.0, "side": "buy", "timestamp": 1720000000},
        {"id": "t2", "exchange": "bybit", "symbol": "BTC/USDT", "price": 67080.0, "amount": 0.5, "cost": 33540.0, "side": "sell", "timestamp": 1720000001},
    ]
    df = QuantDataProcessor.trades_to_polars(trades)
    print(f"[QuantEngine] Polars DataFrame initialized: {df.shape[0]} rows, {df.shape[1]} columns")

    # 2. Test ADF stationarity
    spread_sample = [1.2, 1.1, 1.3, 1.25, 1.15, 1.22, 1.18, 1.24, 1.19, 1.21, 1.23, 1.17, 1.20, 1.22, 1.18, 1.21]
    adf_res = TimeSeriesAnalysis.adf_test(spread_sample)
    print(f"[QuantEngine] ADF Stationarity p-value: {adf_res['p_value']:.4f}, Is Stationary: {adf_res['is_stationary']}")

    # 3. Test Cointegration
    prices_a = [100 + i * 0.5 + (i % 3) * 0.2 for i in range(30)]
    prices_b = [50 + i * 0.25 + (i % 2) * 0.1 for i in range(30)]
    coint_res = PairsTradingAnalysis.test_cointegration(prices_a, prices_b)
    print(f"[QuantEngine] Pairs Cointegration Hedge Ratio: {coint_res['hedge_ratio']:.4f}, Half-Life: {coint_res['half_life_periods']:.2f} periods")

    # 4. Test SciPy Optimization
    opt_res = PortfolioOptimization.optimize_trade_size(spread_bps=25.0, fee_bps=10.0, depth_limit_usd=50000.0)
    print(f"[QuantEngine] SciPy Optimal Size: ${opt_res['optimal_size_usd']:,.2f} | Expected Profit: ${opt_res['expected_profit_usd']:.2f}")

    # 5. Test ML Models
    survival_prob = OpportunitySurvivalModel.predict_survival_probability(spread_bps=15.0, volatility_30d=0.45, latency_ms=80)
    fill_prob = FillProbabilityModel.predict_fill_probability(distance_to_mid_bps=2.0, orderbook_imbalance=0.2)
    print(f"[QuantEngine] ML Opportunity Survival Prob: {survival_prob:.2%}")
    print(f"[QuantEngine] ML Limit Fill Prob: {fill_prob:.2%}")
    print("====================================================")
    print("[OK] QUANT ENGINE INITIALIZATION SUCCESSFUL")
    print("====================================================")

if __name__ == "__main__":
    run_diagnostics()
