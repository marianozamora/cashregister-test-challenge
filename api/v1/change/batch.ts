import { VercelRequest, VercelResponse } from '@vercel/node';
import { ChangeCalculator } from '../../../src/domain/ChangeCalculator';
import { getCurrencyByCode, CurrencyCode } from '../../../src/config/currencies';
import { SpecialRuleConfig } from '../../../src/domain/Currency';

interface BatchTransaction {
  amountOwed: number;
  amountPaid: number;
}

interface BatchRequest {
  transactions: BatchTransaction[];
  currency?: string;
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { transactions, currency = 'USD' }: BatchRequest = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      res.status(400).json({ error: 'transactions array is required' });
      return;
    }

    if (transactions.length === 0) {
      res.status(400).json({ error: 'At least one transaction is required' });
      return;
    }

    const currencyConfig = getCurrencyByCode(currency as CurrencyCode);
    const specialRuleConfig: SpecialRuleConfig = {
      divisor: 3,
      description: 'Use random denominations when change is divisible by 3',
    };

    const calculator = new ChangeCalculator(currencyConfig, specialRuleConfig);

    const results = transactions.map((transaction, index) => {
      try {
        const result = calculator.calculateChange(transaction.amountOwed, transaction.amountPaid);
        return {
          index,
          success: true,
          ...result,
        };
      } catch (error) {
        return {
          index,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          totalChangeInCents: 0,
          formattedOutput: '',
        };
      }
    });

    const summary = {
      totalTransactions: transactions.length,
      successfulTransactions: results.filter((r) => r.success).length,
      failedTransactions: results.filter((r) => !r.success).length,
      totalChangeInCents: results.reduce((sum, r) => sum + r.totalChangeInCents, 0),
      currency,
    };

    res.status(200).json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    console.error('Batch change calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
