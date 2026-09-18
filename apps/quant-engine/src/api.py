"""FastAPI Application for ArbNexus Quantitative Analytics Service."""
import sys
import polars as pl
import duckdb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.schemas.quant_schemas import (
    HealthResponse,
    ReadyResponse,
    TradeSizeOptimizationRequest,
    TradeSizeOptimizationResponse,
    CointegrationRequest,
    CointegrationResponse,
)
from src.modules.optimization import PortfolioOptimization
from src.modules.pairs import PairsTradingAnalysis

app = FastAPI(
    title="ArbNexus Quant Engine API",
    description="High-performance quantitative research, statistical arbitrage, and optimization API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Liveness probe reporting process status."""
    return HealthResponse(python_version=sys.version.split()[0])

@app.get("/ready", response_model=ReadyResponse)
def readiness_check():
    """Readiness probe validating high-performance components."""
    components = {}

    # Check Polars
    try:
        df = pl.DataFrame({"a": [1, 2]})
        components["polars"] = "ready"
    except Exception as e:
        components["polars"] = f"error: {e}"

    # Check DuckDB
    try:
        con = duckdb.connect(":memory:")
        res = con.execute("SELECT 1").fetchone()
        components["duckdb"] = "ready" if res[0] == 1 else "error"
    except Exception as e:
        components["duckdb"] = f"error: {e}"

    # Check NATS availability
    try:
        import nats
        components["nats_py"] = "ready"
    except ImportError:
        components["nats_py"] = "missing"

    # Check ClickHouse Connect availability
    try:
        import clickhouse_connect
        components["clickhouse_connect"] = "ready"
    except ImportError:
        components["clickhouse_connect"] = "missing"

    is_ready = all(status == "ready" for status in components.values())
    return ReadyResponse(ready=is_ready, components=components)

@app.post("/quant/optimize-size", response_model=TradeSizeOptimizationResponse)
def optimize_trade_size(req: TradeSizeOptimizationRequest):
    """Calculate optimal executable trade size given depth, spread, and market impact."""
    try:
        result = PortfolioOptimization.optimize_trade_size(
            spread_bps=req.spread_bps,
            fee_bps=req.fee_bps,
            depth_limit_usd=req.depth_limit_usd,
        )
        return TradeSizeOptimizationResponse(
            optimal_size_usd=result["optimal_size_usd"],
            expected_profit_usd=result["expected_profit_usd"],
            expected_roi_bps=result["expected_roi_bps"],
            status="optimal",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/quant/cointegration", response_model=CointegrationResponse)
def test_cointegration(req: CointegrationRequest):
    """Perform Engle-Granger two-step cointegration and calculate half-life."""
    try:
        result = PairsTradingAnalysis.test_cointegration(req.series_a, req.series_b)
        return CointegrationResponse(
            is_cointegrated=result["is_cointegrated"],
            p_value=result["p_value"],
            hedge_ratio=result["hedge_ratio"],
            half_life_periods=result["half_life_periods"],
            latest_z_score=result["latest_z_score"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
