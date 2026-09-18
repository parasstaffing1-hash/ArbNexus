# Data Quality Engine & Anomaly Detection

## 1. Quality Philosophy

Garbage in equals garbage out. In cryptocurrency markets, exchange feeds regularly suffer from stale cache hits, dropped packets, crossed books, and timestamp clock drift. The `@arbitrage/data-quality` engine acts as an inline firewall before market data reaches detection algorithms.

```
Raw Ticks / Depth Updates
           │
           ▼
┌────────────────────────────────────────┐
│      Data Quality Validation Layer     │
│  - Zero / Negative Price Check         │
│  - Crossed Order-Book Detection        │
│  - Sequence Gap Identification         │
│  - CRC32 Checksum Verification         │
│  - Timestamp Clock Drift Filter        │
│  - Extreme Price Jump Anomaly Filter   │
└────────────────────────────────────────┘
           │
           ▼
Assigned Data Quality Status:
[ VALID | STALE | SUSPICIOUS | INVALID | MISSING ]
```

---

## 2. Validation Rules & Rejection Thresholds

| Rule ID  | Name               | Description                                                                        | Action on Failure                              |
| :------- | :----------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------- |
| `DQ-001` | Non-Positive Value | Bid, ask, last price, or volume $\le 0$.                                           | Drop update; mark `INVALID`.                   |
| `DQ-002` | Crossed Book       | Best Bid $\ge$ Best Ask on the _same_ venue ($P_{\text{bid}} \ge P_{\text{ask}}$). | Invalidate book; trigger REST snapshot.        |
| `DQ-003` | Sequence Gap       | Incoming sequence $\ne \text{expected sequence}$.                                  | Queue delta; trigger buffer resync.            |
| `DQ-004` | CRC32 Checksum     | Calculated CRC32 $\ne$ venue checksum header.                                      | Drop entire book; force full REST rebuild.     |
| `DQ-005` | Timestamp Drift    | $                                                                                  | T_{\text{ingest}} - T_{\text{exchange}}        | > 10{,}000\text{ ms}$. | Flag `SUSPICIOUS`; log clock drift warning. |
| `DQ-006` | Stale Mark         | No update received for $> 30{,}000\text{ ms}$.                                     | Mark `STALE`; expire associated opportunities. |
| `DQ-007` | Price Jump Anomaly | Price moves $> 25\%$ in a single millisecond tick.                                 | Flag `SUSPICIOUS`; isolate from detectors.     |

---

## 3. Data Quality Status Taxonomy

- **`VALID`**: All sanity, sequence, and spread checks passed. Full clearance for opportunity detection.
- **`STALE`**: Stream has paused or heartbeats are delayed. Opportunities marked stale and unexecutable.
- **`SUSPICIOUS`**: Unusually wide spread, clock drift, or extreme spike. Quarantined for 3 confirmation ticks.
- **`INVALID`**: Crossed book, negative price, or corrupted packet. Completely rejected.
- **`MISSING`**: No depth or quote available for instrument on target venue.
