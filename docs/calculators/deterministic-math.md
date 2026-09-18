# Deterministic Financial Mathematics & Audit Guarantees

## 1. Principles of ArbNexus Financial Computing

In institutional finance, algorithmic errors resulting from binary floating-point representation (IEEE-754) can cause severe mispricings, negative PnL reporting, and phantom arbitrage opportunities. ArbNexus enforces two inviolable rules across all calculation packages:

```
+-------------------------------------------------------------------------------+
|                       FINANCIAL DETERMINISM RULES                             |
+-------------------------------------------------------------------------------+
|  Rule 1: ZERO NATIVE FLOATS FOR MONEY                                         |
|  All prices, quantities, spreads, fees, and margins MUST be represented       |
|  and calculated using Decimal.js arbitrary-precision arithmetic.              |
|                                                                               |
|  Rule 2: ISOLATION OF HEURISTICS                                              |
|  Statistical forecasts, machine learning scores, and regression models        |
|  are strictly segregated from the deterministic financial accounting layer.    |
+-------------------------------------------------------------------------------+
```

---

## 2. Decimal Configuration & Precision Standards

All calculation modules import configured `Decimal` instances set to 30 significant digits:

```typescript
import Decimal from 'decimal.js';

Decimal.set({
  precision: 30,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -12,
  toExpPos: 24,
});
```

---

## 3. Order-Book Depth-Weighted Execution Simulation

Rather than assuming top-of-book execution, ArbNexus walks the full L2 depth using arbitrary-precision accumulators:

### Algorithm: Depth-Weighted Market Order Fill

Given orderbook levels $L = [(P_1, Q_1), (P_2, Q_2), \dots, (P_n, Q_n)]$ and target notional size $S_{\text{USD}}$:

1. Initialize:
   - Remaining Notional: $R \gets S_{\text{USD}}$
   - Total Base Acquired: $Q_{\text{filled}} \gets 0$
   - Total Cost: $C_{\text{spent}} \gets 0$
2. For each level $(P_i, Q_i)$:
   - Available Notional at Level: $N_i = P_i \times Q_i$
   - If $R \le N_i$:
     - Fill: $\Delta Q = \frac{R}{P_i}$
     - $Q_{\text{filled}} \gets Q_{\text{filled}} + \Delta Q$
     - $C_{\text{spent}} \gets C_{\text{spent}} + R$
     - $R \gets 0$; Break
   - Else:
     - Fill entire level: $Q_{\text{filled}} \gets Q_{\text{filled}} + Q_i$
     - $C_{\text{spent}} \gets C_{\text{spent}} + N_i$
     - $R \gets R - N_i$
3. Compute Effective Price & Slippage:
   - $\text{Average Price} = \frac{C_{\text{spent}}}{Q_{\text{filled}}}$
   - $\text{Slippage (bps)} = \left|\frac{\text{Average Price} - P_1}{P_1}\right| \times 10{,}000$

---

## 4. Complete Mathematical Audit Trail

Every calculator in `packages/calculators` produces an immutable audit record explaining every step:

```typescript
export interface CalculationAuditTrail {
  calculatorName: string;
  inputs: Record<string, string>;
  steps: {
    stepNumber: number;
    description: string;
    formula: string;
    evaluatedValues: string;
    result: string;
  }[];
  finalResult: Record<string, string>;
  isDeterministic: true;
  precisionDigits: number;
}
```

This ensures that any reported net profit figure can be verified step-by-step by risk managers or auditors without black-box opacity.
