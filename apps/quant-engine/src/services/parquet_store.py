"""High-performance analytical storage, Parquet read/write, and DuckDB integration."""
import os
import polars as pl
import pyarrow as pa
import pyarrow.parquet as pq
import duckdb
from typing import List, Dict, Any, Optional

class ParquetStore:
    """Manages Hive-partitioned Parquet files for tick, orderbook, and opportunity data."""

    def __init__(self, base_dir: str = "data/storage"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def write_dataset(self, df: pl.DataFrame, namespace: str, partition_cols: Optional[List[str]] = None) -> str:
        """Write a Polars DataFrame to partitioned Parquet lake."""
        out_dir = os.path.join(self.base_dir, namespace)
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "dataset.parquet")
        
        arrow_table = df.to_arrow()
        if partition_cols:
            pq.write_to_dataset(arrow_table, root_path=out_dir, partition_cols=partition_cols)
        else:
            pq.write_table(arrow_table, out_file)
        return out_dir

    def read_dataset(self, namespace: str) -> pl.DataFrame:
        """Read Parquet dataset directly into a high-speed Polars DataFrame."""
        target_path = os.path.join(self.base_dir, namespace)
        if os.path.isdir(target_path):
            return pl.read_parquet(f"{target_path}/**/*.parquet")
        elif os.path.isfile(target_path):
            return pl.read_parquet(target_path)
        else:
            raise FileNotFoundError(f"Dataset namespace not found: {namespace}")


class DatasetReader:
    """High-speed zero-copy columnar dataset reader."""
    
    @staticmethod
    def read_parquet_arrow(file_path: str) -> pa.Table:
        return pq.read_table(file_path)

    @staticmethod
    def read_parquet_polars(file_path: str) -> pl.DataFrame:
        return pl.read_parquet(file_path)


class DatasetWriter:
    """Vectorized dataset writer using PyArrow and Polars."""

    @staticmethod
    def write_arrow(table: pa.Table, destination_path: str):
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)
        pq.write_table(table, destination_path, compression='zstd')


class HistoricalDataProcessor:
    """Vectorized timeseries and spread calculator using Polars."""

    @staticmethod
    def calculate_spread_series(venue_a_df: pl.DataFrame, venue_b_df: pl.DataFrame) -> pl.DataFrame:
        """Join tick streams and calculate instantaneous gross spread and basis points."""
        joined = venue_a_df.join(venue_b_df, on="timestamp", how="inner", suffix="_b")
        return joined.with_columns([
            (pl.col("bid_b") - pl.col("ask")).alias("raw_spread"),
            ((pl.col("bid_b") - pl.col("ask")) / pl.col("ask") * 10000.0).alias("spread_bps")
        ])


class DuckDBAnalyticsService:
    """Embedded vectorized SQL query engine over in-memory and Parquet datasets."""

    def __init__(self, db_path: str = ":memory:"):
        self.conn = duckdb.connect(db_path)

    def query(self, sql: str) -> List[Dict[str, Any]]:
        df = self.conn.execute(sql).df()
        return df.to_dict(orient="records")

    def register_polars(self, view_name: str, df: pl.DataFrame):
        arrow_table = df.to_arrow()
        self.conn.register(view_name, arrow_table)
