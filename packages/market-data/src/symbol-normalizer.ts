import { MarketType } from './types';

export interface CanonicalSymbolInfo {
  canonical: string; // e.g. 'BTC/USDT'
  base: string; // 'BTC'
  quote: string; // 'USDT'
  marketType: MarketType;
  exchangeNative: string;
  instrumentId: string; // e.g. 'binance:BTC/USDT:SPOT'
}

export class SymbolNormalizer {
  private static readonly QUOTES = ['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'EUR', 'BTC', 'ETH'];

  /**
   * Normalizes an exchange-native symbol and exchange ID into a canonical instrument representation.
   */
  public static normalize(exchange: string, rawSymbol: string): CanonicalSymbolInfo {
    const clean = rawSymbol.toUpperCase().trim();
    let marketType: MarketType = 'SPOT';

    // Detect derivative / perpetual / future markers
    if (
      clean.includes('SWAP') ||
      clean.includes('PERP') ||
      clean.endsWith('-P') ||
      clean.includes(':USDT') ||
      clean.includes(':USDC')
    ) {
      marketType = 'PERPETUAL';
    } else if (/\d{6}/.test(clean) || clean.includes('FUTURE')) {
      marketType = 'FUTURE';
    } else if (clean.includes('-C-') || clean.includes('-P-')) {
      marketType = 'OPTION';
    }

    // Strip common contract suffixes for base/quote parsing
    let coreSymbol = clean
      .replace('-SWAP', '')
      .replace('-PERP', '')
      .replace('.PERP', '')
      .replace(':USDT', '')
      .replace(':USDC', '');

    let base = '';
    let quote = '';

    if (coreSymbol.includes('/')) {
      const parts = coreSymbol.split('/');
      base = parts[0];
      quote = parts[1];
    } else if (coreSymbol.includes('-')) {
      const parts = coreSymbol.split('-');
      base = parts[0];
      quote = parts[1];
    } else if (coreSymbol.includes('_')) {
      const parts = coreSymbol.split('_');
      base = parts[0];
      quote = parts[1];
    } else {
      // Direct concatenated (e.g. BTCUSDT)
      for (const q of this.QUOTES) {
        if (coreSymbol.endsWith(q) && coreSymbol.length > q.length) {
          base = coreSymbol.slice(0, coreSymbol.length - q.length);
          quote = q;
          break;
        }
      }
      if (!base) {
        base = coreSymbol;
        quote = 'USDT';
      }
    }

    const canonical = `${base}/${quote}`;
    const instrumentId = `${exchange.toLowerCase()}:${canonical}:${marketType}`;

    return {
      canonical,
      base,
      quote,
      marketType,
      exchangeNative: rawSymbol,
      instrumentId,
    };
  }

  /**
   * Converts canonical symbol into exchange-specific format.
   */
  public static toExchangeNative(
    exchange: string,
    canonical: string,
    marketType: MarketType = 'SPOT',
  ): string {
    const [base, quote] = canonical.split('/');
    const ex = exchange.toLowerCase();

    if (marketType === 'PERPETUAL') {
      switch (ex) {
        case 'binance':
          return `${base}${quote}`;
        case 'bybit':
          return `${base}${quote}`;
        case 'okx':
          return `${base}-${quote}-SWAP`;
        case 'bitget':
          return `${base}${quote}_UMCBL`;
        case 'kucoin':
          return `${base}${quote}M`;
        case 'gate':
          return `${base}_${quote}`;
        case 'mexc':
          return `${base}_${quote}`;
        case 'hyperliquid':
          return base;
        default:
          return `${base}-${quote}-SWAP`;
      }
    }

    // Default SPOT mappings
    switch (ex) {
      case 'binance':
        return `${base}${quote}`;
      case 'bybit':
        return `${base}${quote}`;
      case 'okx':
        return `${base}-${quote}`;
      case 'bitget':
        return `${base}${quote}_SPBL`;
      case 'kucoin':
        return `${base}-${quote}`;
      case 'gate':
        return `${base}_${quote}`;
      case 'mexc':
        return `${base}${quote}`;
      case 'hyperliquid':
        return `${base}/USDC`;
      default:
        return `${base}/${quote}`;
    }
  }
}
