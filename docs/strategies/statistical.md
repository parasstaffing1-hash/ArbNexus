# Statistical Mean-Reversion Arbitrage Specification

## 1. Overview

Statistical Arbitrage identifies price dislocations in cointegrated asset pairs through mathematical modeling of the spread dynamics using an Ornstein-Uhlenbeck (OU) mean-reversion process.

## 2. Ornstein-Uhlenbeck Continuous Process

$$dX_t = \theta (\mu - X_t) dt + \sigma dW_t$$

Discretized as:
$$\Delta X_t = a + b X_{t-1} + \epsilon_t$$
Where:

- $\theta = -\frac{\ln(1 + b)}{\Delta t}$ (Mean reversion speed)
- $\tau = \frac{\ln(2)}{\theta}$ (Half-life of mean reversion)
- $\mu = -\frac{a}{b}$ (Equilibrium mean spread)

## 3. Z-Score Deviation Signal

$$Z_t = \frac{S_t - \mu}{\sigma_S}$$

- **Entry Short Spread:** $Z_t \ge +2.0$
- **Entry Long Spread:** $Z_t \le -2.0$
- **Target Exit:** $|Z_t| \le 0.5$
- **Stop Loss:** $|Z_t| \ge 3.5$

## 4. Look-Ahead Bias Prevention

All rolling statistics ($\mu_t, \sigma_t$) are computed strictly over the historical trailing window $[t - W, t)$ without utilizing future information.

## 5. Safety & Zero-Execution

Execution remains disabled (`ENABLE_EXECUTION=false`).
