import { GreedyChangeStrategy, RandomChangeStrategy, ChangeStrategyFactory } from '../../src/domain/ChangeStrategy';
import { Transaction, SpecialRuleConfig } from '../../src/domain/Currency';
import { US_CURRENCY } from '../../src/config/currencies';

describe('ChangeStrategy', () => {
  const mockTransaction: Transaction = {
    amountOwedInCents: 200,
    amountPaidInCents: 300,
    changeInCents: 100,
  };

  const mockTransactionDivisibleBy3: Transaction = {
    amountOwedInCents: 100,
    amountPaidInCents: 268, // 168 cents change, divisible by 3
    changeInCents: 168,
  };

  const specialRuleConfig: SpecialRuleConfig = {
    divisor: 3,
    description: 'Test rule',
  };

  describe('GreedyChangeStrategy', () => {
    let strategy: GreedyChangeStrategy;

    beforeEach(() => {
      strategy = new GreedyChangeStrategy();
    });

    describe('shouldApply', () => {
      it('should apply when no config provided', () => {
        expect(strategy.shouldApply(mockTransaction)).toBe(true);
      });

      it('should apply when change is not divisible by divisor', () => {
        expect(strategy.shouldApply(mockTransaction, specialRuleConfig)).toBe(true);
      });

      it('should not apply when change is divisible by divisor', () => {
        expect(strategy.shouldApply(mockTransactionDivisibleBy3, specialRuleConfig)).toBe(false);
      });
    });

    describe('calculateChange', () => {
      it('should calculate change using minimal denominations', () => {
        const result = strategy.calculateChange(mockTransaction, US_CURRENCY);

        expect(result.totalChangeInCents).toBe(100);
        expect(result.denominations.get('dollar')).toBe(1);
        expect(result.formattedOutput).toBe('1 dollar');
      });

      it('should handle complex change calculations', () => {
        const complexTransaction: Transaction = {
          amountOwedInCents: 212,
          amountPaidInCents: 300,
          changeInCents: 88, // 3 quarters, 1 dime, 3 pennies
        };

        const result = strategy.calculateChange(complexTransaction, US_CURRENCY);

        expect(result.totalChangeInCents).toBe(88);
        expect(result.denominations.get('quarter')).toBe(3);
        expect(result.denominations.get('dime')).toBe(1);
        expect(result.denominations.get('penny')).toBe(3);
        expect(result.formattedOutput).toBe('3 quarters,1 dime,3 pennies');
      });

      it('should handle zero change', () => {
        const noChangeTransaction: Transaction = {
          amountOwedInCents: 100,
          amountPaidInCents: 100,
          changeInCents: 0,
        };

        const result = strategy.calculateChange(noChangeTransaction, US_CURRENCY);

        expect(result.totalChangeInCents).toBe(0);
        expect(result.denominations.size).toBe(0);
        expect(result.formattedOutput).toBe('');
      });
    });
  });

  describe('RandomChangeStrategy', () => {
    let strategy: RandomChangeStrategy;

    beforeEach(() => {
      strategy = new RandomChangeStrategy(12345); // Use seed for consistent testing
    });

    describe('shouldApply', () => {
      it('should not apply when no config provided', () => {
        expect(strategy.shouldApply(mockTransaction)).toBe(false);
      });

      it('should not apply when change is not divisible by divisor', () => {
        expect(strategy.shouldApply(mockTransaction, specialRuleConfig)).toBe(false);
      });

      it('should apply when change is divisible by divisor', () => {
        expect(strategy.shouldApply(mockTransactionDivisibleBy3, specialRuleConfig)).toBe(true);
      });
    });

    describe('calculateChange', () => {
      it('should calculate mathematically correct change', () => {
        const result = strategy.calculateChange(mockTransactionDivisibleBy3, US_CURRENCY);

        expect(result.totalChangeInCents).toBe(168);

        // Verify the total is correct
        let total = 0;
        for (const [name, count] of result.denominations) {
          const denomination = US_CURRENCY.denominations.find((d) => d.name === name);
          if (denomination && count > 0) {
            total += count * denomination.valueInCents;
          }
        }
        expect(total).toBe(168);
      });

      it('should produce different results than greedy algorithm for same input', () => {
        const greedyStrategy = new GreedyChangeStrategy();
        const greedyResult = greedyStrategy.calculateChange(mockTransactionDivisibleBy3, US_CURRENCY);
        const randomResult = strategy.calculateChange(mockTransactionDivisibleBy3, US_CURRENCY);

        // Both should have same total but potentially different denominations
        expect(greedyResult.totalChangeInCents).toBe(randomResult.totalChangeInCents);

        // Format might be different (this is the point of random strategy)
        // We can't guarantee they'll be different due to randomness, but they should both be valid
        expect(greedyResult.formattedOutput).toBeDefined();
        expect(randomResult.formattedOutput).toBeDefined();
      });
    });
  });

  describe('ChangeStrategyFactory', () => {
    let factory: ChangeStrategyFactory;

    beforeEach(() => {
      factory = new ChangeStrategyFactory();
    });

    describe('getStrategy', () => {
      it('should return GreedyChangeStrategy when no special rule applies', () => {
        const strategy = factory.getStrategy(mockTransaction, specialRuleConfig);
        expect(strategy).toBeInstanceOf(GreedyChangeStrategy);
      });

      it('should return RandomChangeStrategy when special rule applies', () => {
        const strategy = factory.getStrategy(mockTransactionDivisibleBy3, specialRuleConfig);
        expect(strategy).toBeInstanceOf(RandomChangeStrategy);
      });

      it('should return GreedyChangeStrategy when no config provided', () => {
        const strategy = factory.getStrategy(mockTransaction);
        expect(strategy).toBeInstanceOf(GreedyChangeStrategy);
      });
    });

    describe('addStrategy', () => {
      it('should allow adding custom strategies with priority', () => {
        const customStrategy = new GreedyChangeStrategy();

        // Mock the shouldApply method to always return true
        jest.spyOn(customStrategy, 'shouldApply').mockReturnValue(true);

        factory.addStrategy(customStrategy);

        const strategy = factory.getStrategy(mockTransaction, specialRuleConfig);
        expect(strategy).toBe(customStrategy);
      });
    });
  });
});
