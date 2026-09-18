import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 }, // Ramp up to 20 virtual users
    { duration: '30s', target: 20 }, // Hold steady
    { duration: '15s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Markets listing
  const marketsRes = http.get(`${BASE_URL}/arbitrage/markets`);
  check(marketsRes, {
    'markets status is 200': (r) => r.status === 200,
  });

  // 3. Opportunities list
  const oppsRes = http.get(`${BASE_URL}/arbitrage/opportunities`);
  check(oppsRes, {
    'opportunities status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
