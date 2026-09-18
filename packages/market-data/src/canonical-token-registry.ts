export interface CanonicalToken {
  asset_id: string; // e.g. "USDC:ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  symbol: string; // e.g. "USDC"
  chain: string; // e.g. "ethereum"
  contract_address: string; // address or mint pubkey
  decimals: number; // e.g. 6
  name: string; // e.g. "USD Coin"
  canonical_group?: string; // e.g. "USDC" for cross-chain equivalence grouping
  coingecko_id?: string;
  is_stablecoin?: boolean;
}

export class CanonicalTokenRegistry {
  private static instance: CanonicalTokenRegistry;
  private tokens: Map<string, CanonicalToken> = new Map(); // asset_id -> token
  private chainSymbolIndex: Map<string, string> = new Map(); // "chain:symbol" -> asset_id
  private chainAddressIndex: Map<string, string> = new Map(); // "chain:address" -> asset_id
  private groupIndex: Map<string, string[]> = new Map(); // group -> asset_ids

  private constructor() {
    this.seedCanonicalTokens();
  }

  public static getInstance(): CanonicalTokenRegistry {
    if (!CanonicalTokenRegistry.instance) {
      CanonicalTokenRegistry.instance = new CanonicalTokenRegistry();
    }
    return CanonicalTokenRegistry.instance;
  }

  public registerToken(token: CanonicalToken): void {
    this.tokens.set(token.asset_id, token);

    const csKey = `${token.chain.toLowerCase()}:${token.symbol.toUpperCase()}`;
    this.chainSymbolIndex.set(csKey, token.asset_id);

    const caKey = `${token.chain.toLowerCase()}:${token.contract_address.toLowerCase()}`;
    this.chainAddressIndex.set(caKey, token.asset_id);

    if (token.canonical_group) {
      const groupKey = token.canonical_group.toUpperCase();
      const existing = this.groupIndex.get(groupKey) || [];
      if (!existing.includes(token.asset_id)) {
        existing.push(token.asset_id);
        this.groupIndex.set(groupKey, existing);
      }
    }
  }

  public getToken(assetId: string): CanonicalToken | undefined {
    return this.tokens.get(assetId);
  }

  public findToken(chain: string, symbolOrAddress: string): CanonicalToken | undefined {
    const c = chain.toLowerCase();
    const s = symbolOrAddress.toUpperCase();
    const bySymbol = this.chainSymbolIndex.get(`${c}:${s}`);
    if (bySymbol) return this.tokens.get(bySymbol);

    const byAddr = this.chainAddressIndex.get(`${c}:${symbolOrAddress.toLowerCase()}`);
    if (byAddr) return this.tokens.get(byAddr);

    return undefined;
  }

  public getCrossChainEquivalents(canonicalGroup: string): CanonicalToken[] {
    const assetIds = this.groupIndex.get(canonicalGroup.toUpperCase()) || [];
    return assetIds.map((id) => this.tokens.get(id)!).filter(Boolean);
  }

  public getAllTokens(): CanonicalToken[] {
    return Array.from(this.tokens.values());
  }

  public getStablecoins(): CanonicalToken[] {
    return this.getAllTokens().filter((t) => t.is_stablecoin);
  }

  private seedCanonicalTokens() {
    const list: CanonicalToken[] = [
      // Ethereum (Chain 1)
      {
        asset_id: 'USDC:ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        chain: 'ethereum',
        contract_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        name: 'USD Coin',
        canonical_group: 'USDC',
        is_stablecoin: true,
      },
      {
        asset_id: 'USDT:ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        chain: 'ethereum',
        contract_address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        name: 'Tether USD',
        canonical_group: 'USDT',
        is_stablecoin: true,
      },
      {
        asset_id: 'DAI:ethereum:0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI',
        chain: 'ethereum',
        contract_address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        name: 'Dai Stablecoin',
        canonical_group: 'DAI',
        is_stablecoin: true,
      },
      {
        asset_id: 'PYUSD:ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
        symbol: 'PYUSD',
        chain: 'ethereum',
        contract_address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
        decimals: 6,
        name: 'PayPal USD',
        canonical_group: 'PYUSD',
        is_stablecoin: true,
      },
      {
        asset_id: 'WETH:ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        chain: 'ethereum',
        contract_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        name: 'Wrapped Ether',
        canonical_group: 'ETH',
      },
      {
        asset_id: 'WBTC:ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        symbol: 'WBTC',
        chain: 'ethereum',
        contract_address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
        name: 'Wrapped BTC',
        canonical_group: 'BTC',
      },

      // Arbitrum One (Chain 42161)
      {
        asset_id: 'USDC:arbitrum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        symbol: 'USDC',
        chain: 'arbitrum',
        contract_address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        name: 'USD Coin',
        canonical_group: 'USDC',
        is_stablecoin: true,
      },
      {
        asset_id: 'USDT:arbitrum:0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        symbol: 'USDT',
        chain: 'arbitrum',
        contract_address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6,
        name: 'Tether USD',
        canonical_group: 'USDT',
        is_stablecoin: true,
      },
      {
        asset_id: 'WETH:arbitrum:0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        symbol: 'WETH',
        chain: 'arbitrum',
        contract_address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        decimals: 18,
        name: 'Wrapped Ether',
        canonical_group: 'ETH',
      },

      // Base (Chain 8453)
      {
        asset_id: 'USDC:base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        chain: 'base',
        contract_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        name: 'USD Coin',
        canonical_group: 'USDC',
        is_stablecoin: true,
      },
      {
        asset_id: 'WETH:base:0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        chain: 'base',
        contract_address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        name: 'Wrapped Ether',
        canonical_group: 'ETH',
      },

      // Solana (Chain 101)
      {
        asset_id: 'USDC:solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        chain: 'solana',
        contract_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        name: 'USD Coin',
        canonical_group: 'USDC',
        is_stablecoin: true,
      },
      {
        asset_id: 'USDT:solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        chain: 'solana',
        contract_address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6,
        name: 'Tether USD',
        canonical_group: 'USDT',
        is_stablecoin: true,
      },
      {
        asset_id: 'SOL:solana:So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        chain: 'solana',
        contract_address: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        name: 'Wrapped SOL',
        canonical_group: 'SOL',
      },
    ];

    for (const t of list) {
      this.registerToken(t);
    }
  }
}
