import { ChangeCalculator } from '../../src/domain/ChangeCalculator';
import { ChangeStrategyFactory } from '../../src/domain/ChangeStrategy';
import { SpecialRuleConfig, InsufficientPaymentError, InvalidAmountError } from '../../src/domain/Currency';
import { US_CURRENCY } from '../../src/config/currencies';

describe('ChangeCalculator', () => {
  let calculator: ChangeCalculator;
  let mockStrategyFactory: jest.Mocked<ChangeStrategyFactory>;

  const specialRuleConfig: SpecialRuleConfig = {
    divisor: 3,
    description: 'Test rule for divisible by 3',
  };

  beforeEach(() => {
    mockStrategyFactory = {
      getStrategy: jest.fn(),
      addStrategy: jest.fn(),
    } as unknown as jest.Mocked<ChangeStrategyFactory>;

    calculator = new ChangeCalculator(US_CURRENCY, specialRuleConfig, mockStrategyFactory);
  });

  describe('constructor', () => {
    it('should create calculator with provided dependencies', () => {
      expect(calculator.getCurrency()).toBe(US_CURRENCY);
      expect(calculator.getSpecialRuleConfig()).toBe(specialRuleConfig);
    });

    it('should create calculator with default strategy factory when none provided', () => {
      const defaultCalculator = new ChangeCalculator(US_CURRENCY, specialRuleConfig);
      expect(defaultCalculator).toBeInstanceOf(ChangeCalculator);
    });
  });

  describe('calculateChange', () => {
    beforeEach(() => {
      const mockStrategy = {
        calculateChange: jest.fn().mockReturnValue({
          totalChangeInCents: 88,
          denominations: new Map([
            ['quarter', 3],
            ['dime', 1],
            ['penny', 3],
          ]),
          formattedOutput: '3 quarters,1 dime,3 pennies',
        }),
        shouldApply: jest.fn(),
      };
      mockStrategyFactory.getStrategy.mockReturnValue(mockStrategy);
    });

    it('should calculate change successfully', () => {
      const result = calculator.calculateChange(212, 300);

      expect(result.totalChangeInCents).toBe(88);
      expect(result.formattedOutput).toBe('3 quarters,1 dime,3 pennies');
      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          amountOwedInCents: 212,
          amountPaidInCents: 300,
          changeInCents: 88,
        }),
        specialRuleConfig
      );
    });

    it('should handle exact payment (no change)', () => {
      const result = calculator.calculateChange(100, 100);

      expect(result.totalChangeInCents).toBe(0);
      expect(result.denominations.size).toBe(0);
      expect(result.formattedOutput).toBe('');
      expect(mockStrategyFactory.getStrategy).not.toHaveBeenCalled();
    });

    it('should throw InsufficientPaymentError when payment is less than amount owed', () => {
      expect(() => {
        calculator.calculateChange(300, 200);
      }).toThrow(InsufficientPaymentError);
    });

    it('should throw InvalidAmountError for negative amount owed', () => {
      expect(() => {
        calculator.calculateChange(-100, 200);
      }).toThrow(InvalidAmountError);
    });

    it('should throw InvalidAmountError for negative amount paid', () => {
      expect(() => {
        calculator.calculateChange(100, -200);
      }).toThrow(InvalidAmountError);
    });
  });

  describe('processTransactions', () => {
    beforeEach(() => {
      const mockStrategy = {
        calculateChange: jest.fn(),
        shouldApply: jest.fn(),
      };

      // Mock different responses for different amounts
      mockStrategy.calculateChange
        .mockReturnValueOnce({
          totalChangeInCents: 88,
          denominations: new Map([
            ['quarter', 3],
            ['dime', 1],
            ['penny', 3],
          ]),
          formattedOutput: '3 quarters,1 dime,3 pennies',
        })
        .mockReturnValueOnce({
          totalChangeInCents: 3,
          denominations: new Map([['penny', 3]]),
          formattedOutput: '3 pennies',
        })
        .mockReturnValueOnce({
          totalChangeInCents: 167,
          denominations: new Map([
            ['dollar', 1],
            ['quarter', 2],
            ['dime', 1],
            ['nickel', 1],
            ['penny', 2],
          ]),
          formattedOutput: '1 dollar,2 quarters,1 dime,1 nickel,2 pennies',
        });

      mockStrategyFactory.getStrategy.mockReturnValue(mockStrategy);
    });

    it('should process multiple transactions', () => {
      const transactions: [number, number][] = [
        [2.12, 3.0],
        [1.97, 2.0],
        [3.33, 5.0],
      ];

      const results = calculator.processTransactions(transactions);

      expect(results).toHaveLength(3);
      expect(results[0]).toBe('3 quarters,1 dime,3 pennies');
      expect(results[1]).toBe('3 pennies');
      expect(results[2]).toBe('1 dollar,2 quarters,1 dime,1 nickel,2 pennies');
    });

    it('should handle empty transaction list', () => {
      const results = calculator.processTransactions([]);
      expect(results).toEqual([]);
    });

    it('should convert dollar amounts to cents correctly', () => {
      const transactions: [number, number][] = [[1.5, 2.0]];

      calculator.processTransactions(transactions);

      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          amountOwedInCents: 150,
          amountPaidInCents: 200,
          changeInCents: 50,
        }),
        specialRuleConfig
      );
    });
  });

  describe('getCurrency', () => {
    it('should return the configured currency', () => {
      expect(calculator.getCurrency()).toBe(US_CURRENCY);
    });
  });

  describe('getSpecialRuleConfig', () => {
    it('should return the configured special rule', () => {
      expect(calculator.getSpecialRuleConfig()).toBe(specialRuleConfig);
    });
  });
});
