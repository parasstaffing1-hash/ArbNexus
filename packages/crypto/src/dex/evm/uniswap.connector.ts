import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { Pool, Route, Trade } from '@uniswap/v3-sdk';

export interface UniswapPoolConfig {
  tokenA: Token;
  tokenB: Token;
  fee: number;
  sqrtPriceX96: string;
  liquidity: string;
  tick: number;
}

export class UniswapConnector {
  public createPool(config: UniswapPoolConfig): Pool {
    return new Pool(
      config.tokenA,
      config.tokenB,
      config.fee,
      config.sqrtPriceX96,
      config.liquidity,
      config.tick,
    );
  }

  public createRoute(pools: Pool[], inToken: Token, outToken: Token): Route<Token, Token> {
    return new Route([pools[0], ...pools.slice(1)], inToken, outToken);
  }

  public async getExactInTrade(
    route: Route<Token, Token>,
    amountIn: CurrencyAmount<Token>,
  ): Promise<Trade<Token, Token, TradeType.EXACT_INPUT>> {
    return Trade.exactIn(route, amountIn);
  }

  public calculateSlippageTolerance(slippageBps: number): Percent {
    return new Percent(slippageBps, 10000);
  }
}
