import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArbitrageService } from './arbitrage.service';

@ApiTags('Arbitrage Intelligence')
@Controller()
export class ArbitrageController {
  constructor(private readonly arbitrageService: ArbitrageService) {}

  @Get('markets')
  @ApiOperation({ summary: 'Get list of supported markets' })
  getMarkets() {
    return this.arbitrageService.getMarkets();
  }

  @Get('markets/:symbol')
  @ApiOperation({ summary: 'Get market info by symbol' })
  getMarketBySymbol(@Param('symbol') symbol: string) {
    return this.arbitrageService.getMarkets(symbol);
  }

  @Get('orderbooks/:exchange/:symbol')
  @ApiOperation({ summary: 'Get order book snapshot for exchange and symbol' })
  getOrderBook(@Param('exchange') exchange: string, @Param('symbol') symbol: string) {
    return this.arbitrageService.getOrderBook(exchange, symbol);
  }

  @Get('funding')
  @ApiOperation({ summary: 'Get current 8-hour funding rates across exchanges' })
  getFunding() {
    return this.arbitrageService.getFundingRates();
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Get active validated arbitrage opportunities' })
  getOpportunities() {
    return this.arbitrageService.getOpportunities();
  }

  @Get('opportunities/:id')
  @ApiOperation({ summary: 'Get opportunity details by id' })
  getOpportunityById(@Param('id') id: string) {
    return this.arbitrageService.getOpportunities(id);
  }

  @Get('historical-opportunities')
  @ApiOperation({ summary: 'Get historical arbitrage opportunities' })
  getHistoricalOpportunities() {
    return this.arbitrageService.getHistoricalOpportunities();
  }

  @Get('backtests')
  @ApiOperation({ summary: 'Get recent backtesting run results' })
  getBacktests() {
    return this.arbitrageService.getBacktests();
  }

  @Get('strategies')
  @ApiOperation({ summary: 'Get list of supported strategy types' })
  getStrategies() {
    return this.arbitrageService.getStrategies();
  }

  @Get('strategies/triangular')
  @ApiOperation({ summary: 'Get active triangular arbitrage opportunities' })
  getTriangularStrategies() {
    return this.arbitrageService.getTriangularOpportunities();
  }

  @Get('strategies/multi-hop')
  @ApiOperation({ summary: 'Get active multi-hop graph arbitrage opportunities' })
  getMultiHopStrategies() {
    return this.arbitrageService.getMultiHopOpportunities();
  }

  @Get('strategies/funding')
  @ApiOperation({ summary: 'Get active funding rate cash-and-carry & perp-perp opportunities' })
  getFundingStrategies() {
    return this.arbitrageService.getFundingOpportunities();
  }

  @Get('strategies/basis')
  @ApiOperation({ summary: 'Get active spot vs futures basis opportunities' })
  getBasisStrategies() {
    return this.arbitrageService.getBasisOpportunities();
  }

  @Get('strategies/statistical')
  @ApiOperation({ summary: 'Get active statistical mean-reversion opportunities' })
  getStatisticalStrategies() {
    return this.arbitrageService.getStatisticalOpportunities();
  }

  @Get('strategies/pairs')
  @ApiOperation({ summary: 'Get active pairs trading divergence opportunities' })
  getPairsStrategies() {
    return this.arbitrageService.getPairsOpportunities();
  }

  @Get('funding/history')
  @ApiOperation({ summary: 'Get historical funding rate series' })
  getFundingHistory(@Query('symbol') symbol?: string, @Query('exchange') exchange?: string) {
    return this.arbitrageService.getFundingHistory(symbol, exchange);
  }

  @Get('basis/history')
  @ApiOperation({ summary: 'Get historical spot vs futures basis series' })
  getBasisHistory(@Query('symbol') symbol?: string) {
    return this.arbitrageService.getBasisHistory(symbol);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get evaluated multi-hop and cross-venue routes' })
  getRoutes(
    @Query('sourceAsset') sourceAsset?: string,
    @Query('targetAsset') targetAsset?: string,
  ) {
    return this.arbitrageService.getRoutes(sourceAsset, targetAsset);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get evaluated route details by route id' })
  getRouteById(@Param('id') id: string) {
    return this.arbitrageService.getRouteById(id);
  }

  @Get('statistical/spreads')
  @ApiOperation({ summary: 'Get statistical pair spread series and z-scores' })
  getStatisticalSpreads(@Query('pair') pair?: string) {
    return this.arbitrageService.getStatisticalSpreads(pair);
  }

  @Get('pairs')
  @ApiOperation({ summary: 'Get monitored statistical pairs and cointegration metrics' })
  getPairs() {
    return this.arbitrageService.getPairs();
  }

  @Get('research/opportunities')
  @ApiOperation({ summary: 'Query research workspace opportunities with multi-variable filters' })
  getResearchOpportunities(
    @Query('strategy') strategy?: string,
    @Query('venue') venue?: string,
    @Query('minRoi') minRoi?: string,
  ) {
    return this.arbitrageService.getResearchOpportunities({ strategy, venue, minRoi });
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported blockchain networks' })
  getChains() {
    return this.arbitrageService.getChains();
  }

  @Get('dex/pools')
  @ApiOperation({ summary: 'Get normalized DEX pools across EVM and Solana' })
  getDexPools() {
    return this.arbitrageService.getDexPools();
  }

  @Get('dex/quote')
  @ApiOperation({
    summary:
      'Get normalized DEX execution quote across Uniswap, Raydium, Orca, Jupiter, 1inch, LI.FI',
  })
  getDexQuote(
    @Query('chain') chain: string,
    @Query('dex') dex: string,
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string,
    @Query('amountIn') amountIn: string,
  ) {
    return this.arbitrageService.getDexQuote(chain, dex, tokenIn, tokenOut, amountIn);
  }

  @Get('cross-chain/routes')
  @ApiOperation({ summary: 'Get evaluated cross-chain bridge and DEX swap routes' })
  getCrossChainRoutes(
    @Query('sourceChain') sourceChain: string,
    @Query('destChain') destChain: string,
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string,
    @Query('amount') amount: string,
  ) {
    return this.arbitrageService.getCrossChainRoutes(
      sourceChain,
      destChain,
      tokenIn,
      tokenOut,
      amount,
    );
  }

  @Get('dexes')
  @ApiOperation({ summary: 'Get supported decentralized exchanges' })
  getDexes() {
    return this.arbitrageService.getDexes();
  }

  @Get('exchanges')
  @ApiOperation({ summary: 'Get supported centralized exchanges' })
  getExchanges() {
    return this.arbitrageService.getExchanges();
  }

  @Get('exchanges/:id/status')
  @ApiOperation({ summary: 'Get live status and metrics for an exchange connector' })
  getExchangeStatus(@Param('id') id: string) {
    return this.arbitrageService.getExchangeStatus(id);
  }

  @Get('open-interest')
  @ApiOperation({ summary: 'Get perpetual open interest across exchanges' })
  getOpenInterest() {
    return this.arbitrageService.getOpenInterest();
  }

  @Get('market-health')
  @ApiOperation({ summary: 'Get real-time market data pipeline health and latency metrics' })
  getMarketHealth() {
    return this.arbitrageService.getMarketHealth();
  }
}
