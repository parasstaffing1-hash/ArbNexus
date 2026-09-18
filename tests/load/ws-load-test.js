import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:4000/ws/market';

export default function () {
  const url = WS_URL;
  const params = { tags: { my_tag: 'market_stream' } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      // Subscribe to simulated ticker feed
      socket.send(JSON.stringify({ event: 'subscribe', topic: 'market.ticker.binance.btc_usdt' }));
    });

    socket.on('message', (data) => {
      check(data, {
        'received message': (d) => d.length > 0,
      });
    });

    socket.on('close', () => {});
    socket.setTimeout(() => {
      socket.close();
    }, 25000);
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
