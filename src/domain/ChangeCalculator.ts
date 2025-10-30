import {
  Currency,
  ChangeResult,
  Transaction,
  SpecialRuleConfig,
  InsufficientPaymentError,
  InvalidAmountError,
} from './Currency';
import { ChangeStrategyFactory } from './ChangeStrategy';

export class ChangeCalculator {
  private readonly strategyFactory: ChangeStrategyFactory;

  constructor(
    private readonly currency: Currency,
    private readonly specialRuleConfig: SpecialRuleConfig,
    strategyFactory?: ChangeStrategyFactory
  ) {
    this.strategyFactory = strategyFactory ?? new ChangeStrategyFactory();
  }

  calculateChange(amountOwedInCents: number, amountPaidInCents: number): ChangeResult {
    this.validateAmounts(amountOwedInCents, amountPaidInCents);
    const changeInCents = amountPaidInCents - amountOwedInCents;

    if (changeInCents === 0) {
      return { totalChangeInCents: 0, denominations: new Map(), formattedOutput: '' };
    }

    const transaction: Transaction = {
      amountOwedInCents,
      amountPaidInCents,
      changeInCents,
    };

    const strategy = this.strategyFactory.getStrategy(transaction, this.specialRuleConfig);
    return strategy.calculateChange(transaction, this.currency);
  }

  /**
   * Processes multiple transactions from parsed CSV data
   * @param transactions Array of [amountOwed, amountPaid] pairs
   * @returns Array of formatted change results
   */
  processTransactions(transactions: [number, number][]): string[] {
    return transactions.map(([amountOwed, amountPaid]) => {
      const result = this.calculateChange(
        Math.round(amountOwed * 100), // Convert to cents
        Math.round(amountPaid * 100) // Convert to cents
      );
      return result.formattedOutput;
    });
  }

  /**
   * Gets the current currency configuration
   */
  getCurrency(): Currency {
    return this.currency;
  }

  /**
   * Gets the current special rule configuration
   */
  getSpecialRuleConfig(): SpecialRuleConfig {
    return this.specialRuleConfig;
  }

  private validateAmounts(amountOwed: number, amountPaid: number): void {
    if (amountOwed < 0) {
      throw new InvalidAmountError(amountOwed);
    }

    if (amountPaid < 0) {
      throw new InvalidAmountError(amountPaid);
    }

    if (amountPaid < amountOwed) {
      throw new InsufficientPaymentError(amountOwed, amountPaid);
    }
  }
}
