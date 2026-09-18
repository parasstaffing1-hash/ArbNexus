# Cointegrated Pairs Arbitrage Specification

## 1. Overview

Pairs trading evaluates pairs of economically or structurally linked crypto assets (e.g. $ETH \leftrightarrow stETH$, $SOL \leftrightarrow mSOL$, $BTC \leftrightarrow WBTC$) for stationary cointegration.

## 2. Engle-Granger Two-Step Methodology

### Step 1: Long-Run Equilibrium Estimation (OLS)

$$P_{A,t} = \alpha + \beta P_{B,t} + e_t$$
Where $\beta$ represents the dynamic hedge ratio:
$$\beta = \frac{\text{Cov}(P_A, P_B)}{\text{Var}(P_B)}$$

### Step 2: Residual Stationarity Testing (Dickey-Fuller)

$$\Delta e_t = \gamma e_{t-1} + u_t$$
Test statistic:
$$t = \frac{\hat{\gamma}}{\text{SE}(\hat{\gamma})}$$
Compared against MacKinnon critical values:

- $1\%: -3.90$
- $5\%: -3.34$
- $10\%: -3.04$

If $t < -3.34$, the null hypothesis of non-stationarity is rejected ($p < 0.05$), confirming cointegration.

## 3. Safety & Zero-Execution

Execution remains disabled (`ENABLE_EXECUTION=false`).
