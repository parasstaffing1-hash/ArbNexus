import { ArbitrageOpportunity } from '@arbitrage/shared';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
  footer?: { text: string };
}

export class DiscordWebhookService {
  constructor(private webhookUrl?: string) {}

  public async sendEmbed(embed: DiscordEmbed): Promise<boolean> {
    if (!this.webhookUrl) return false;
    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async sendOpportunityAlert(opp: ArbitrageOpportunity): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: `🚨 Arbitrage Opportunity: ${opp.pair}`,
      description: `Cross-venue spread detected between **${opp.sourceExchange}** and **${opp.targetExchange}**`,
      color: 0x10b981, // Emerald green
      fields: [
        { name: 'Strategy', value: opp.strategy, inline: true },
        { name: 'Spread', value: `${opp.spreadPercent.toFixed(2)}%`, inline: true },
        { name: 'Est. Net Profit', value: `$${opp.netProfitUsd.toFixed(2)}`, inline: true },
        { name: 'Buy Price', value: `$${opp.buyPrice.toFixed(4)}`, inline: true },
        { name: 'Sell Price', value: `$${opp.sellPrice.toFixed(4)}`, inline: true },
        { name: 'Min Capital', value: `$${opp.minCapitalUsd.toFixed(2)}`, inline: true },
      ],
      timestamp: new Date(opp.detectedAt).toISOString(),
      footer: { text: 'Crypto Arbitrage Intelligence Engine' },
    };

    return this.sendEmbed(embed);
  }
}
