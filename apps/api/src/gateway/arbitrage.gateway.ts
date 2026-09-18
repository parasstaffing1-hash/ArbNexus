import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ArbitrageOpportunity } from '@arbitrage/shared';
import { OrderBook, FundingRate, Ticker } from '@arbitrage/market-data';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/arbitrage',
})
export class ArbitrageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ArbitrageGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_pairs')
  handleSubscribePairs(client: Socket, pairs: string[]) {
    pairs.forEach((p) => client.join(`pair:${p}`));
    return { status: 'subscribed', pairs };
  }

  @SubscribeMessage('subscribe_orderbook')
  handleSubscribeOrderBook(client: Socket, payload: { exchange: string; symbol: string }) {
    const room = `orderbook:${payload.exchange}:${payload.symbol}`;
    client.join(room);
    return { status: 'subscribed', room };
  }

  @SubscribeMessage('subscribe_funding')
  handleSubscribeFunding(client: Socket) {
    client.join('funding_rates');
    return { status: 'subscribed', channel: 'funding_rates' };
  }

  @SubscribeMessage('subscribe_exchange_status')
  handleSubscribeExchangeStatus(client: Socket) {
    client.join('exchange_status');
    return { status: 'subscribed', channel: 'exchange_status' };
  }

  // Advanced Strategy Subscriptions
  @SubscribeMessage('subscribe_triangular')
  handleSubscribeTriangular(client: Socket) {
    client.join('arbitrage:triangular');
    return { status: 'subscribed', channel: '/ws/arbitrage/triangular' };
  }

  @SubscribeMessage('subscribe_multihop')
  handleSubscribeMultihop(client: Socket) {
    client.join('arbitrage:multihop');
    return { status: 'subscribed', channel: '/ws/arbitrage/multihop' };
  }

  @SubscribeMessage('subscribe_funding_strategy')
  handleSubscribeFundingStrategy(client: Socket) {
    client.join('arbitrage:funding');
    return { status: 'subscribed', channel: '/ws/arbitrage/funding' };
  }

  @SubscribeMessage('subscribe_basis')
  handleSubscribeBasis(client: Socket) {
    client.join('arbitrage:basis');
    return { status: 'subscribed', channel: '/ws/arbitrage/basis' };
  }

  @SubscribeMessage('subscribe_statistical')
  handleSubscribeStatistical(client: Socket) {
    client.join('arbitrage:statistical');
    return { status: 'subscribed', channel: '/ws/arbitrage/statistical' };
  }

  @SubscribeMessage('subscribe_pairs_strategy')
  handleSubscribePairsStrategy(client: Socket) {
    client.join('arbitrage:pairs');
    return { status: 'subscribed', channel: '/ws/arbitrage/pairs' };
  }

  public broadcastOpportunity(opportunity: ArbitrageOpportunity | any) {
    if (this.server) {
      this.server.emit('opportunity', opportunity);
      this.server.emit('/ws/opportunities', opportunity);

      // Strategy specific routing
      if (opportunity.strategy_type === 'TRIANGULAR') {
        this.broadcastTriangular(opportunity);
      } else if (opportunity.strategy_type === 'MULTI_HOP') {
        this.broadcastMultihop(opportunity);
      } else if (
        opportunity.strategy_type === 'FUNDING' ||
        opportunity.strategy_type === 'PERP_PERP'
      ) {
        this.broadcastFundingStrategy(opportunity);
      } else if (opportunity.strategy_type === 'BASIS') {
        this.broadcastBasis(opportunity);
      } else if (opportunity.strategy_type === 'STATISTICAL') {
        this.broadcastStatistical(opportunity);
      } else if (opportunity.strategy_type === 'PAIRS') {
        this.broadcastPairs(opportunity);
      }
    }
  }

  public broadcastTriangular(opportunity: any) {
    if (this.server) {
      this.server.to('arbitrage:triangular').emit('opportunity:triangular', opportunity);
      this.server.emit('/ws/arbitrage/triangular', opportunity);
    }
  }

  public broadcastMultihop(opportunity: any) {
    if (this.server) {
      this.server.to('arbitrage:multihop').emit('opportunity:multihop', opportunity);
      this.server.emit('/ws/arbitrage/multihop', opportunity);
    }
  }

  public broadcastFundingStrategy(opportunity: any) {
    if (this.server) {
      this.server.to('arbitrage:funding').emit('opportunity:funding', opportunity);
      this.server.emit('/ws/arbitrage/funding', opportunity);
    }
  }

  public broadcastBasis(opportunity: any) {
    if (this.server) {
      this.server.to('arbitrage:basis').emit('opportunity:basis', opportunity);
      this.server.emit('/ws/arbitrage/basis', opportunity);
    }
  }

  public broadcastStatistical(opportunity: any) {
    if (this.server) {
      this.server.to('arbitrage:statistical').emit('opportunity:statistical', opportunity);
      this.server.emit('/ws/arbitrage/statistical', opportunity);
    }
  }

  public broadcastPairs(opportunity: any) {
    if (this.server) {
      this.server.to('arbitrage:pairs').emit('opportunity:pairs', opportunity);
      this.server.emit('/ws/arbitrage/pairs', opportunity);
    }
  }

  public broadcastTicker(ticker: Ticker) {
    if (this.server) {
      this.server.to(`pair:${ticker.symbol}`).emit('ticker', ticker);
      this.server.emit('/ws/market', ticker);
    }
  }

  public broadcastOrderBook(orderBook: OrderBook) {
    if (this.server) {
      const room = `orderbook:${orderBook.exchange}:${orderBook.symbol}`;
      this.server.to(room).emit('orderbook', orderBook);
      this.server.emit('/ws/orderbook', orderBook);
    }
  }

  public broadcastFunding(funding: FundingRate) {
    if (this.server) {
      this.server.to('funding_rates').emit('funding', funding);
      this.server.emit('/ws/funding', funding);
    }
  }

  public broadcastExchangeStatus(status: any) {
    if (this.server) {
      this.server.to('exchange_status').emit('exchange_status', status);
      this.server.emit('/ws/exchange-status', status);
    }
  }
}
