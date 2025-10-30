import { VercelRequest, VercelResponse } from '@vercel/node';
import { ChangeCalculator } from '../../../src/domain/ChangeCalculator';
import { getCurrencyByCode, CurrencyCode } from '../../../src/config/currencies';
import { SpecialRuleConfig } from '../../../src/domain/Currency';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amountOwed, amountPaid, currencyCode = 'USD' } = req.body;

    if (!amountOwed || !amountPaid) {
      res.status(400).json({ error: 'amountOwed and amountPaid are required' });
      return;
    }

    if (amountPaid < amountOwed) {
      res.status(400).json({ error: 'Insufficient payment' });
      return;
    }

    const currency = getCurrencyByCode(currencyCode as CurrencyCode);
    const specialRuleConfig: SpecialRuleConfig = {
      divisor: 3,
      description: 'Use random denominations when change is divisible by 3',
    };

    const calculator = new ChangeCalculator(currency, specialRuleConfig);
    const result = calculator.calculateChange(amountOwed, amountPaid);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Calculate change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
