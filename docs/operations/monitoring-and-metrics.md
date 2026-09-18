# Prometheus Monitoring & Observability Reference

## 1. Metrics Endpoint Configuration

ArbNexus exposes Prometheus metrics on the NestJS API at:
`GET /api/v1/health/metrics` (or `http://localhost:4000/api/v1/health/metrics`).

Scraping is configured automatically via `infrastructure/monitoring/prometheus.yml` at 15-second intervals.

---

## 2. Core Prometheus Metrics Catalog

| Metric Name                               | Type    | Unit         | Description                                        |
| :---------------------------------------- | :------ | :----------- | :------------------------------------------------- |
| `arbitrage_api_uptime_seconds`            | Gauge   | Seconds      | API process uptime.                                |
| `arbitrage_process_resident_memory_bytes` | Gauge   | Bytes        | Resident Set Size (RSS) memory consumption.        |
| `arbitrage_process_heap_used_bytes`       | Gauge   | Bytes        | Node.js V8 active heap memory.                     |
| `arbitrage_active_connections`            | Gauge   | Count        | Active WebSocket client connections.               |
| `arbitrage_exchanges_connected`           | Gauge   | Count        | Number of connected exchange adapters.             |
| `arbitrage_opportunities_detected_total`  | Counter | Count        | Total cumulative arbitrage candidates detected.    |
| `arbitrage_opportunities_active`          | Gauge   | Count        | Active, valid opportunities currently in memory.   |
| `arbitrage_pipeline_latency_milliseconds` | Gauge   | Milliseconds | End-to-end average pipeline processing latency.    |
| `arbitrage_data_quality_score`            | Gauge   | Ratio (0–1)  | Proportion of market ticks passing quality checks. |

---

## 3. Recommended Prometheus Alert Rules

```yaml
groups:
  - name: arbnexus_alerts
    rules:
      - alert: HighPipelineLatency
        expr: arbitrage_pipeline_latency_milliseconds > 50
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: 'Pipeline latency degraded (> 50ms)'

      - alert: ExchangeDisconnected
        expr: arbitrage_exchanges_connected < 6
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: 'Fewer than 6 exchanges connected'

      - alert: LowDataQuality
        expr: arbitrage_data_quality_score < 0.95
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'Data quality score dropped below 95%'
```

---

## 4. Grafana Dashboards

Grafana is provisioned via Docker Compose on port 3001 with pre-configured dashboard JSONs located in `infrastructure/monitoring/grafana/dashboards/`:

- **Executive Arbitrage Overview**: Live opportunities, net profit distributions, top performing assets, and strategy breakdown.
- **Market Data Health & Latency**: Per-exchange connection state, roundtrip latency, message throughput, sequence gap alerts, and orderbook checksum failures.
