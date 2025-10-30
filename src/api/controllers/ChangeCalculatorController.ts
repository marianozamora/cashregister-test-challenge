import { Router, Request, Response, NextFunction } from 'express';
import { ChangeCalculator } from '../../domain/ChangeCalculator';
import { CURRENCY_REGISTRY } from '../../config/currencies';
import { SpecialRuleConfig } from '../../domain/Currency';
import { RequestValidator } from '../middleware/RequestValidator';

interface BatchChangeRequest {
  transactions: { amountOwed: number; amountPaid: number }[];
  currency?: string;
  specialRule?: SpecialRuleConfig;
}
export class ChangeCalculatorController {
  static async calculateBatchChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactions, currency = 'USD', specialRule }: BatchChangeRequest = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        res
          .status(400)
          .json({ error: 'Transactions array is required and must not be empty', code: 'INVALID_TRANSACTIONS' });
        return;
      }

      const currencyConfig = CURRENCY_REGISTRY[currency as keyof typeof CURRENCY_REGISTRY];
      if (!currencyConfig) {
        res.status(400).json({ error: `Unsupported currency: ${currency}`, code: 'INVALID_CURRENCY' });
        return;
      }

      const ruleConfig: SpecialRuleConfig = specialRule || {
        divisor: 3,
        description: 'Use random denominations when change is divisible by 3',
      };
      const calculator = new ChangeCalculator(currencyConfig, ruleConfig);
      const results = transactions.map(({ amountOwed, amountPaid }) =>
        calculator.calculateChange(Math.round(amountOwed * 100), Math.round(amountPaid * 100))
      );
      const summary = {
        totalTransactions: transactions.length,
        totalChangeInCents: results.reduce((sum, result) => sum + result.totalChangeInCents, 0),
        currency,
      };

      res.json({ results, summary });
    } catch (error) {
      next(error);
    }
  }

  static getRouter(): Router {
    const router = Router();
    const validateBatchRequest = RequestValidator.validateSchema({
      type: 'object',
      required: ['transactions'],
      properties: {
        transactions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['amountOwed', 'amountPaid'],
            properties: { amountOwed: { type: 'number', minimum: 0 }, amountPaid: { type: 'number', minimum: 0 } },
          },
        },
        currency: { type: 'string', enum: ['USD', 'EUR'] },
      },
    });
    router.post('/batch', validateBatchRequest, this.calculateBatchChange);
    return router;
  }
}
