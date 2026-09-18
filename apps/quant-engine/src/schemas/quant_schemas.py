"""Pydantic schemas for Quantitative API endpoints."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "arbnexus-quant-engine"
    version: str = "1.0.0"
    python_version: str

class ReadyResponse(BaseModel):
    ready: bool
    components: Dict[str, str]

class TradeSizeOptimizationRequest(BaseModel):
    spread_bps: float = Field(..., description="Observed gross spread in basis points")
    fee_bps: float = Field(..., description="Total round-trip trading and transfer fees in basis points")
    depth_limit_usd: float = Field(..., description="Available book liquidity limit in USD")
    alpha_decay: float = Field(default=0.05, description="Expected market impact parameter")

class TradeSizeOptimizationResponse(BaseModel):
    optimal_size_usd: float
    expected_profit_usd: float
    expected_roi_bps: float
    status: str

class CointegrationRequest(BaseModel):
    series_a: List[float] = Field(..., description="Price timeseries for Asset A")
    series_b: List[float] = Field(..., description="Price timeseries for Asset B")
    significance_level: float = Field(default=0.05, description="p-value threshold")

class CointegrationResponse(BaseModel):
    is_cointegrated: bool
    p_value: float
    hedge_ratio: float
    half_life_periods: float
    latest_z_score: float
