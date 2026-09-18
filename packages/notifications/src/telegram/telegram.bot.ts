import { Telegraf } from 'telegraf';
import { ArbitrageOpportunity } from '@arbitrage/shared';

export class TelegramBotService {
  private bot: Telegraf | null = null;

  constructor(token?: string) {
    if (token) {
      this.bot = new Telegraf(token);
      this.setupHandlers();
    }
  }

  private setupHandlers(): void {
    if (!this.bot) return;

    this.bot.command('status', (ctx) => {
      ctx.reply('🟢 Arbitrage Scanner Engine: ONLINE\nMonitoring active pairs across CEX & DEX.');
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(
        'Crypto Arbitrage Intelligence Bot Commands:\n' +
          '/status - Engine health & scan state\n' +
          '/pairs - Active arbitrage markets',
      );
    });
  }

  public async sendAlert(chatId: string, opp: ArbitrageOpportunity): Promise<boolean> {
    if (!this.bot) return false;
    const text =
      `⚡ *ARBITRAGE OPPORTUNITY DETECTED* ⚡\n\n` +
      `Pair: \`${opp.pair}\`\n` +
      `Strategy: \`${opp.strategy}\`\n` +
      `Route: ${opp.sourceExchange} ➔ ${opp.targetExchange}\n` +
      `Buy: \$${opp.buyPrice.toFixed(4)} | Sell: \$${opp.sellPrice.toFixed(4)}\n` +
      `Spread: *${opp.spreadPercent.toFixed(2)}%*\n` +
      `Est. Net Profit: *\$${opp.netProfitUsd.toFixed(2)}*\n` +
      `Confidence: ${(opp.confidenceScore * 100).toFixed(0)}%`;

    try {
      await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return true;
    } catch {
      return false;
    }
  }
}
