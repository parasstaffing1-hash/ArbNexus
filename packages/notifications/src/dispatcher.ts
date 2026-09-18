import { ArbitrageOpportunity } from '@arbitrage/shared';
import { NovuNotificationService } from './novu/novu.service';
import { TelegramBotService } from './telegram/telegram.bot';
import { DiscordWebhookService } from './discord/discord-webhook.service';

export interface DispatcherConfig {
  novuApiKey?: string;
  telegramToken?: string;
  telegramChatId?: string;
  discordWebhookUrl?: string;
}

export class NotificationDispatcher {
  private novu: NovuNotificationService;
  private telegram: TelegramBotService;
  private discord: DiscordWebhookService;

  constructor(private config: DispatcherConfig) {
    this.novu = new NovuNotificationService(config.novuApiKey);
    this.telegram = new TelegramBotService(config.telegramToken);
    this.discord = new DiscordWebhookService(config.discordWebhookUrl);
  }

  public async broadcastOpportunity(opp: ArbitrageOpportunity): Promise<void> {
    const promises: Promise<boolean>[] = [];

    if (this.config.discordWebhookUrl) {
      promises.push(this.discord.sendOpportunityAlert(opp));
    }

    if (this.config.telegramChatId) {
      promises.push(this.telegram.sendAlert(this.config.telegramChatId, opp));
    }

    await Promise.allSettled(promises);
  }
}
