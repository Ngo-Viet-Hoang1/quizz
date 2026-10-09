import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics', // Prometheus scrape endpoint
      defaultMetrics: { enabled: true }, // Node.js heap, GC, Event Loop lag
    }),
  ],
  providers: [
    makeGaugeProvider({ name: 'ws_connections_active', help: 'Active WebSocket connections' }),
    makeGaugeProvider({ name: 'mongodb_pool_used', help: 'MongoDB pool connections in use' }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency',
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    }),
    makeGaugeProvider({ name: 'bullmq_queue_depth', help: 'BullMQ pending jobs' }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
