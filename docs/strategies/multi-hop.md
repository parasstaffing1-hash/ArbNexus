# Multi-Hop Graph Arbitrage Specification

## 1. Overview

The Multi-Hop Graph Arbitrage Engine extends triangular cycle discovery into 4-hop and 5-hop pathways across heterogeneous venues (CEX ↔ DEX ↔ Cross-Chain Bridges).

## 2. Graph Algorithms & Pruning

Path traversal uses depth-limited Depth-First Search (DFS) with pruning to prevent combinatorial explosion:

1. **Liquidity Hurdle:** Drops edges with liquidity below \$25,000 USD.
2. **Fee Hurdle:** Drops edges with fee exceeding 40 bps.
3. **Data Freshness:** Drops quotes with age $> 30,000\text{ ms}$.
4. **Intermediate Loss Pruning:** Aborts candidate paths if cumulative multiplier drops below $0.97$.

## 3. Mathematical Formula

$$\text{Net Multiplier} = \prod_{i=1}^{k} \left[ R_i \cdot (1 - f_i) \cdot (1 - s_i) \right]$$
$$\text{Net Profit} = C_0 \cdot (\text{Net Multiplier} - 1) - \sum_{i=1}^{k} \text{Gas}_i$$

## 4. Route Hashing & Deduplication

Every route is uniquely identified by its canonical topological hash:
$$\text{RouteHash} = \text{SHA256}\left(\bigcup_{i=1}^k (A_{i-1} \to A_i @ V_i @ C_i)\right)$$

## 5. Safety & Zero-Execution

Execution remains disabled (`ENABLE_EXECUTION=false`).
