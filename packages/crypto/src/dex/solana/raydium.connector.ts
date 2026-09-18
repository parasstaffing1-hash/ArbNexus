import { Connection, PublicKey } from '@solana/web3.js';
import { Raydium } from '@raydium-io/raydium-sdk-v2';

export interface RaydiumConnectorConfig {
  connection: Connection;
  owner?: PublicKey;
}

export class RaydiumConnector {
  private raydiumInstance: Raydium | null = null;

  constructor(private config: RaydiumConnectorConfig) {}

  public async initialize(): Promise<Raydium> {
    if (!this.raydiumInstance) {
      this.raydiumInstance = await Raydium.load({
        connection: this.config.connection,
        owner: this.config.owner,
      });
    }
    return this.raydiumInstance;
  }

  public async getPoolInfo(poolId: string) {
    const raydium = await this.initialize();
    return raydium.api.fetchPoolById({ ids: poolId });
  }
}
