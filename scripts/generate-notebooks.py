import json
import os

os.makedirs('research/notebooks', exist_ok=True)
notebooks = {
    '01_market_data_exploration.ipynb': '01 — Market Data Exploration & Columnar Schema Analysis',
    '02_spread_analysis.ipynb': '02 — Cross-Venue Spatial Spread & Cointegration Analysis',
    '03_opportunity_survival.ipynb': '03 — Arbitrage Opportunity Survival Probability Modeling',
    '04_slippage_analysis.ipynb': '04 — Order-Book Depth Slippage & Price Impact Curve',
    '05_funding_analysis.ipynb': '05 — Perpetual Funding Rate Carry & Basis Convergence',
    '06_backtest_analysis.ipynb': '06 — Historical Backtest Replay & Sharpe Ratio Performance',
}

for fname, title in notebooks.items():
    nb = {
        'cells': [
            {
                'cell_type': 'markdown',
                'metadata': {},
                'source': [
                    f'# ArbNexus Quant Research — {title}\n\n',
                    'This notebook queries synthetic and historical datasets using **Polars**, **DuckDB**, and **PyArrow**.\n\n',
                    '> **Safety Guard**: Zero live order execution; quantitative and historical research only.\n'
                ],
            },
            {
                'cell_type': 'code',
                'execution_count': None,
                'metadata': {},
                'outputs': [],
                'source': [
                    'import polars as pl\n',
                    'import pyarrow as pa\n',
                    'import duckdb\n',
                    'import numpy as np\n',
                    '\n',
                    'print(f"Polars version: {pl.__version__}")\n',
                    'print(f"DuckDB version: {duckdb.__version__}")\n',
                    'con = duckdb.connect(":memory:")\n',
                    'print("Embedded DuckDB analytical session initialized.")\n',
                ],
            },
        ],
        'metadata': {
            'kernelspec': {
                'display_name': 'Python 3',
                'language': 'python',
                'name': 'python3',
            },
            'language_info': {
                'name': 'python',
                'version': '3.14.2',
            },
        },
        'nbformat': 4,
        'nbformat_minor': 5,
    }
    with open(os.path.join('research/notebooks', fname), 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=2)

print('ALL_6_NOTEBOOKS_GENERATED')
