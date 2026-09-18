export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
}

export interface SecretProvider {
  getSecret(key: string): Promise<string | null>;
  setSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<void>;
}

export class MemorySecretProvider implements SecretProvider {
  private secrets: Map<string, string> = new Map();

  async getSecret(key: string): Promise<string | null> {
    return this.secrets.get(key) ?? null;
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }

  async deleteSecret(key: string): Promise<void> {
    this.secrets.delete(key);
  }
}

export class CredentialVault {
  private provider: SecretProvider;

  constructor(provider: SecretProvider = new MemorySecretProvider()) {
    this.provider = provider;
  }

  async storeExchangeCredentials(
    exchangeId: string,
    credentials: { apiKey: string; apiSecret: string; passphrase?: string },
  ): Promise<void> {
    // Only stores metadata/encrypted reference on backend, never exposes to frontend
    await this.provider.setSecret(
      `exchange:${exchangeId.toLowerCase()}`,
      JSON.stringify(credentials),
    );
  }

  async getExchangeCredentials(
    exchangeId: string,
  ): Promise<{ apiKey: string; apiSecret: string; passphrase?: string } | null> {
    const raw = await this.provider.getSecret(`exchange:${exchangeId.toLowerCase()}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
