import { Connection, PublicKey, Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface SolanaRpcConfig {
  endpoint?: string;
  wsEndpoint?: string;
  commitment?: Commitment;
}

export class SolanaRPCProvider {
  private connection: Connection;

  constructor(config: SolanaRpcConfig = {}) {
    const endpoint =
      config.endpoint || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(endpoint, {
      commitment: config.commitment || 'confirmed',
      wsEndpoint: config.wsEndpoint,
    });
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public async getSlot(): Promise<number> {
    return this.connection.getSlot();
  }

  public async getRecentPrioritizationFees(): Promise<number> {
    try {
      const fees = await this.connection.getRecentPrioritizationFees();
      if (!fees || fees.length === 0) return 0;
      const total = fees.slice(-20).reduce((acc, f) => acc + f.prioritizationFee, 0);
      return Math.round(total / Math.min(fees.length, 20));
    } catch {
      return 1000; // 1000 micro-lamports default fallback
    }
  }
}

export class SolanaAccountProvider {
  constructor(private rpcProvider: SolanaRPCProvider) {}

  public async getBalanceSol(address: string): Promise<number> {
    const pubkey = new PublicKey(address);
    const lamports = await this.rpcProvider.getConnection().getBalance(pubkey);
    return lamports / LAMPORTS_PER_SOL;
  }
}

export class SolanaProvider {
  public readonly rpc: SolanaRPCProvider;
  public readonly account: SolanaAccountProvider;

  constructor(config: SolanaRpcConfig = {}) {
    this.rpc = new SolanaRPCProvider(config);
    this.account = new SolanaAccountProvider(this.rpc);
  }
}
