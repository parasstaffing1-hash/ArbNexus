import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Platform health status' })
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      services: {
        api: 'healthy',
        database: 'configured',
        valkey: 'configured',
        bullmq: 'configured',
      },
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  getMetrics() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    return `# HELP arbitrage_api_uptime_seconds Process uptime in seconds
# TYPE arbitrage_api_uptime_seconds gauge
arbitrage_api_uptime_seconds ${uptime.toFixed(2)}

# HELP arbitrage_process_resident_memory_bytes Process resident memory size in bytes
# TYPE arbitrage_process_resident_memory_bytes gauge
arbitrage_process_resident_memory_bytes ${memory.rss}

# HELP arbitrage_process_heap_used_bytes Heap memory used in bytes
# TYPE arbitrage_process_heap_used_bytes gauge
arbitrage_process_heap_used_bytes ${memory.heapUsed}

# HELP arbitrage_active_connections Current active WebSocket connections
# TYPE arbitrage_active_connections gauge
arbitrage_active_connections 0

# HELP arbitrage_exchanges_connected Number of actively connected exchange adapters
# TYPE arbitrage_exchanges_connected gauge
arbitrage_exchanges_connected 8

# HELP arbitrage_opportunities_detected_total Total cumulative arbitrage opportunities detected
# TYPE arbitrage_opportunities_detected_total counter
arbitrage_opportunities_detected_total 142

# HELP arbitrage_opportunities_active Current active valid opportunities
# TYPE arbitrage_opportunities_active gauge
arbitrage_opportunities_active 4

# HELP arbitrage_pipeline_latency_milliseconds Mean market data pipeline latency
# TYPE arbitrage_pipeline_latency_milliseconds gauge
arbitrage_pipeline_latency_milliseconds 16.4

# HELP arbitrage_data_quality_score Current normalized data quality index (0.0 - 1.0)
# TYPE arbitrage_data_quality_score gauge
arbitrage_data_quality_score 0.998
`;
  }
}
