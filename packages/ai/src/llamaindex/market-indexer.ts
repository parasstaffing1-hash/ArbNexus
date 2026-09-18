import { Document, VectorStoreIndex } from 'llamaindex';

export interface TokenSecurityDoc {
  tokenAddress: string;
  symbol: string;
  chain: string;
  auditNotes: string;
}

export class MarketKnowledgeIndexer {
  public async createTokenIndex(docs: TokenSecurityDoc[]): Promise<VectorStoreIndex> {
    const documents = docs.map(
      (doc) =>
        new Document({
          text: `Token: ${doc.symbol} (${doc.tokenAddress}) on ${doc.chain}.\nAudit: ${doc.auditNotes}`,
          metadata: {
            tokenAddress: doc.tokenAddress,
            chain: doc.chain,
            symbol: doc.symbol,
          },
        }),
    );

    return VectorStoreIndex.fromDocuments(documents);
  }
}
