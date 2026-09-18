import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ARBITRAGE_RISK_ANALYSIS_SYSTEM_PROMPT } from '../prompts/arbitrage.prompts';
import { ArbitrageOpportunity } from '@arbitrage/shared';

export interface ArbitrageAiAssessment {
  approved: boolean;
  riskScore: number;
  reasoning: string[];
  recommendedMaxSizeUsd: number;
}

export class ArbitrageLangChainAgent {
  private promptTemplate: ChatPromptTemplate;

  constructor() {
    this.promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', ARBITRAGE_RISK_ANALYSIS_SYSTEM_PROMPT],
      ['user', 'Evaluate the following arbitrage opportunity: {opportunityJson}'],
    ]);
  }

  public async formatOpportunityPrompt(opportunity: ArbitrageOpportunity): Promise<string> {
    const formatted = await this.promptTemplate.format({
      opportunityJson: JSON.stringify(opportunity, null, 2),
    });
    return formatted;
  }

  public assessOpportunityHeuristic(opportunity: ArbitrageOpportunity): ArbitrageAiAssessment {
    const isSpreadSufficient = opportunity.spreadPercent > 0.5;
    const isProfitableAfterFees = opportunity.netProfitUsd > 10;
    const approved = isSpreadSufficient && isProfitableAfterFees;

    return {
      approved,
      riskScore: approved ? 0.2 : 0.85,
      reasoning: [
        `Spread is ${opportunity.spreadPercent.toFixed(2)}%`,
        `Net profit estimate is $${opportunity.netProfitUsd.toFixed(2)}`,
        `Confidence score from detector: ${opportunity.confidenceScore}`,
      ],
      recommendedMaxSizeUsd: approved ? 5000 : 0,
    };
  }
}
