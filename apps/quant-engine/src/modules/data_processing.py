"""High performance data processing adapter using Polars, PyArrow, and DuckDB."""
from typing import List, Dict, Any, Optional
import polars as pl
import pyarrow as pa
import duckdb
import os

class QuantDataProcessor:
    """Provides high performance columnar processing for tick, trade, and orderbook data."""

    @staticmethod
    def trades_to_polars(trades: List[Dict[str, Any]]) -> pl.DataFrame:
        """Converts raw trade records into a high-performance Polars DataFrame."""
        if not trades:
            return pl.DataFrame({
                "id": [],
                "exchange": [],
                "symbol": [],
                "price": [],
                "amount": [],
                "cost": [],
                "side": [],
                "timestamp": [],
            }, schema={
                "id": pl.Utf8,
                "exchange": pl.Utf8,
                "symbol": pl.Utf8,
                "price": pl.Float64,
                "amount": pl.Float64,
                "cost": pl.Float64,
                "side": pl.Utf8,
                "timestamp": pl.Int64,
            })

        return pl.DataFrame(trades)

    @staticmethod
    def polars_to_arrow(df: pl.DataFrame) -> pa.Table:
        """Converts a Polars DataFrame into an Apache Arrow Table for zero-copy IPC."""
        return df.to_arrow()

    @staticmethod
    def query_parquet_with_duckdb(parquet_glob: str, sql_query: str) -> pl.DataFrame:
        """Executes an analytical DuckDB SQL query against partitioned Parquet datasets."""
        con = duckdb.connect(database=":memory:")
        # Register view
        try:
            con.execute(f"CREATE VIEW market_data AS SELECT * FROM read_parquet('{parquet_glob}')")
            arrow_table = con.execute(sql_query).arrow()
            return pl.from_arrow(arrow_table)
        except Exception:
            # Return empty dataframe if path does not yet exist
            return pl.DataFrame()
        finally:
            con.close()
