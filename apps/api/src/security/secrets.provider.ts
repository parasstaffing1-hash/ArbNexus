import { Injectable, Logger } from '@nestjs/common';

export interface ExchangeApiCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  isTestnet?: boolean;
}

export interface SecretProvider {
  getSecret(key: string): Promise<string | undefined>;
  getExchangeCredentials(exchangeId: string): Promise<ExchangeApiCredentials | null>;
}

@Injectable()
export class CredentialStore implements SecretProvider {
  private readonly logger = new Logger(CredentialStore.name);
  private readonly openBaoAddr = process.env.OPENBAO_ADDR;
  private readonly openBaoToken = process.env.OPENBAO_TOKEN;

  public async getSecret(key: string): Promise<string | undefined> {
    // 1. Check OpenBao / Vault if configured
    if (this.openBaoAddr && this.openBaoToken) {
      try {
        const response = await fetch(`${this.openBaoAddr}/v1/secret/data/${key}`, {
          headers: { 'X-Vault-Token': this.openBaoToken },
        });
        if (response.ok) {
          const data = (await response.json()) as any;
          return data.data?.data?.value;
        }
      } catch {
        this.logger.warn(`OpenBao secret retrieval failed for ${key}, falling back to environment`);
      }
    }

    // 2. Safe local environment fallback
    return process.env[key];
  }

  public async getExchangeCredentials(exchangeId: string): Promise<ExchangeApiCredentials | null> {
    const upper = exchangeId.toUpperCase();
    const apiKey = await this.getSecret(`${upper}_API_KEY`);
    const apiSecret = await this.getSecret(`${upper}_SECRET`);
    const passphrase = await this.getSecret(`${upper}_PASSPHRASE`);

    if (!apiKey || !apiSecret) {
      return null;
    }

    return {
      apiKey,
      apiSecret,
      passphrase,
      isTestnet: process.env.NODE_ENV !== 'production',
    };
  }
}
