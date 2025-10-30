import { Currency, ChangeResult, Transaction, SpecialRuleConfig, Denomination } from './Currency';

/**
 * Strategy interface for calculating change with different algorithms
 */
export interface ChangeStrategy {
  /**
   * Calculates change for a given transaction
   * @param transaction The transaction details
   * @param currency The currency system to use
   * @returns The change calculation result
   */
  calculateChange(_transaction: Transaction, _currency: Currency): ChangeResult;

  /**
   * Determines if this strategy should be used for the given transaction
   * @param transaction The transaction details
   * @param config Optional configuration for special rules
   * @returns True if this strategy should be used
   */
  shouldApply(_transaction: Transaction, _config?: SpecialRuleConfig): boolean;
}

/**
 * Standard greedy algorithm - uses minimal number of denominations
 */
export class GreedyChangeStrategy implements ChangeStrategy {
  shouldApply(_transaction: Transaction, _config?: SpecialRuleConfig): boolean {
    if (!_config) {
      return true;
    }
    return _transaction.changeInCents % _config.divisor !== 0;
  }

  calculateChange(transaction: Transaction, currency: Currency): ChangeResult {
    const changeInCents = transaction.changeInCents;
    const denominations = new Map<string, number>();
    let remainingChange = changeInCents;

    // Sort denominations by value (highest first) for greedy algorithm
    const sortedDenominations = [...currency.denominations].sort((a, b) => b.valueInCents - a.valueInCents);

    for (const denomination of sortedDenominations) {
      if (remainingChange >= denomination.valueInCents) {
        const count = Math.floor(remainingChange / denomination.valueInCents);
        denominations.set(denomination.name, count);
        remainingChange -= count * denomination.valueInCents;
      }
    }

    return {
      totalChangeInCents: changeInCents,
      denominations,
      formattedOutput: this.formatOutput(denominations),
    };
  }

  private formatOutput(denominations: Map<string, number>): string {
    const parts: string[] = [];
    for (const [name, count] of denominations) {
      if (count > 0) {
        const pluralName = count === 1 ? name : this.pluralize(name);
        parts.push(`${count} ${pluralName}`);
      }
    }
    return parts.join(',');
  }

  private pluralize(name: string): string {
    if (name === 'penny') {
      return 'pennies';
    }
    return name + 's';
  }
}

/**
 * Random strategy - uses random but mathematically correct denominations
 * Applied when change amount meets special criteria (e.g., divisible by 3)
 * Optimized with caching and improved algorithm
 */
export class RandomChangeStrategy implements ChangeStrategy {
  private readonly maxAttempts = 500; // Reduced from 1000 for better performance
  private readonly cache = new Map<string, Map<string, number>>(); // Cache for successful combinations
  private readonly maxCacheSize = 1000;

  constructor(private readonly randomSeed?: number) {
    if (randomSeed !== undefined) {
      this.setupSeededRandom();
    }
  }

  shouldApply(_transaction: Transaction, _config?: SpecialRuleConfig): boolean {
    if (!_config) {
      return false;
    }
    return _transaction.changeInCents % _config.divisor === 0;
  }

  calculateChange(transaction: Transaction, currency: Currency): ChangeResult {
    const changeInCents = transaction.changeInCents;
    const cacheKey = `${changeInCents}-${currency.code}`;

    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return {
        totalChangeInCents: changeInCents,
        denominations: new Map(cachedResult),
        formattedOutput: this.formatOutput(cachedResult),
      };
    }

    // Try to generate a random combination using optimized algorithm
    const bestResult = this.generateOptimizedRandomCombination(changeInCents, currency);

    // Fallback to greedy if no random solution found
    if (!bestResult) {
      const greedyStrategy = new GreedyChangeStrategy();
      return greedyStrategy.calculateChange(transaction, currency);
    }

    // Cache the successful result
    this.cacheResult(cacheKey, bestResult);

    return {
      totalChangeInCents: changeInCents,
      denominations: bestResult,
      formattedOutput: this.formatOutput(bestResult),
    };
  }

  private generateRandomCombination(changeInCents: number, currency: Currency): Map<string, number> {
    const denominations = new Map<string, number>();
    let remainingChange = changeInCents;

    // Randomly distribute change across denominations
    const sortedDenominations = [...currency.denominations].sort((a, b) => b.valueInCents - a.valueInCents);

    for (let i = 0; i < sortedDenominations.length && remainingChange > 0; i++) {
      const denomination = sortedDenominations[i]!;
      const maxCount = Math.floor(remainingChange / denomination.valueInCents);

      if (maxCount > 0) {
        // For the last denomination, use all remaining change
        if (i === sortedDenominations.length - 1) {
          const count = Math.floor(remainingChange / denomination.valueInCents);
          if (count > 0) {
            denominations.set(denomination.name, count);
            remainingChange -= count * denomination.valueInCents;
          }
        } else {
          // Randomly choose a count between 0 and maxCount
          const randomCount = Math.floor(Math.random() * (maxCount + 1));
          if (randomCount > 0) {
            denominations.set(denomination.name, randomCount);
            remainingChange -= randomCount * denomination.valueInCents;
          }
        }
      }
    }

    return denominations;
  }

  private isValidCombination(denominations: Map<string, number>, targetAmount: number, currency: Currency): boolean {
    let total = 0;

    for (const [name, count] of denominations) {
      const denomination = currency.denominations.find((d) => d.name === name);
      if (!denomination) {
        return false;
      }
      total += count * denomination.valueInCents;
    }

    return total === targetAmount;
  }

  private formatOutput(denominations: Map<string, number>): string {
    const parts: string[] = [];
    for (const [name, count] of denominations) {
      if (count > 0) {
        const pluralName = count === 1 ? name : this.pluralize(name);
        parts.push(`${count} ${pluralName}`);
      }
    }
    return parts.join(',');
  }

  private pluralize(name: string): string {
    if (name === 'penny') {
      return 'pennies';
    }
    return name + 's';
  }

  private setupSeededRandom(): void {
    // Simple seeded random for testing purposes
    let seed = this.randomSeed!;
    Math.random = (): number => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /**
   * Optimized random combination generator with improved algorithm
   */
  private generateOptimizedRandomCombination(changeInCents: number, currency: Currency): Map<string, number> | null {
    const sortedDenominations = [...currency.denominations].sort((a, b) => b.valueInCents - a.valueInCents);

    // Try multiple strategies with different randomization approaches
    const strategies = [
      () => this.generateRandomWithBiasTowardsLarger(changeInCents, sortedDenominations),
      () => this.generateRandomWithUniformDistribution(changeInCents, sortedDenominations),
      () => this.generateRandomWithBiasTowardsSmaller(changeInCents, sortedDenominations),
    ];

    for (const strategy of strategies) {
      for (let attempt = 0; attempt < Math.floor(this.maxAttempts / strategies.length); attempt++) {
        const candidate = strategy();
        if (this.isValidCombination(candidate, changeInCents, currency)) {
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * Generate random combination with bias towards larger denominations
   */
  private generateRandomWithBiasTowardsLarger(
    changeInCents: number,
    sortedDenominations: readonly Denomination[]
  ): Map<string, number> {
    const denominations = new Map<string, number>();
    let remainingChange = changeInCents;

    for (let i = 0; i < sortedDenominations.length && remainingChange > 0; i++) {
      const denomination = sortedDenominations[i]!;
      const maxCount = Math.floor(remainingChange / denomination.valueInCents);

      if (maxCount > 0) {
        // Bias towards using more of larger denominations (60-90% of max)
        const minBias = Math.ceil(maxCount * 0.6);
        const maxBias = Math.ceil(maxCount * 0.9);
        const count = Math.floor(Math.random() * (maxBias - minBias + 1)) + minBias;

        if (count > 0) {
          denominations.set(denomination.name, Math.min(count, maxCount));
          remainingChange -= Math.min(count, maxCount) * denomination.valueInCents;
        }
      }
    }

    return denominations;
  }

  /**
   * Generate random combination with uniform distribution
   */
  private generateRandomWithUniformDistribution(
    changeInCents: number,
    sortedDenominations: readonly Denomination[]
  ): Map<string, number> {
    const denominations = new Map<string, number>();
    let remainingChange = changeInCents;

    for (let i = 0; i < sortedDenominations.length && remainingChange > 0; i++) {
      const denomination = sortedDenominations[i]!;
      const maxCount = Math.floor(remainingChange / denomination.valueInCents);

      if (maxCount > 0) {
        const count = Math.floor(Math.random() * (maxCount + 1));
        if (count > 0) {
          denominations.set(denomination.name, count);
          remainingChange -= count * denomination.valueInCents;
        }
      }
    }

    return denominations;
  }

  /**
   * Generate random combination with bias towards smaller denominations
   */
  private generateRandomWithBiasTowardsSmaller(
    changeInCents: number,
    sortedDenominations: readonly Denomination[]
  ): Map<string, number> {
    const denominations = new Map<string, number>();
    let remainingChange = changeInCents;

    // Work backwards from smallest to largest
    const reversedDenominations = [...sortedDenominations].reverse();

    for (const denomination of reversedDenominations) {
      const maxCount = Math.floor(remainingChange / denomination.valueInCents);

      if (maxCount > 0) {
        // Bias towards using more smaller denominations
        const bias = Math.random() < 0.7; // 70% chance to use more smaller denominations
        const count = bias
          ? Math.floor(Math.random() * maxCount) + Math.floor(maxCount * 0.5)
          : Math.floor(Math.random() * (maxCount + 1));

        const actualCount = Math.min(count, maxCount);
        if (actualCount > 0) {
          denominations.set(denomination.name, actualCount);
          remainingChange -= actualCount * denomination.valueInCents;
        }
      }
    }

    return denominations;
  }

  /**
   * Cache management - stores successful combinations
   */
  private cacheResult(key: string, result: Map<string, number>): void {
    // Implement LRU-style cache by removing oldest entries when at capacity
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value as string;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, new Map(result));
  }

  /**
   * Clear the cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}

/**
 * Factory for creating change strategies
 */
export class ChangeStrategyFactory {
  private readonly strategies: ChangeStrategy[] = [];

  constructor() {
    this.strategies.push(new RandomChangeStrategy());
    this.strategies.push(new GreedyChangeStrategy());
  }

  /**
   * Gets the appropriate strategy for a transaction
   * @param transaction The transaction details
   * @param config Optional configuration for special rules
   * @returns The strategy to use
   */
  getStrategy(transaction: Transaction, config?: SpecialRuleConfig): ChangeStrategy {
    for (const strategy of this.strategies) {
      if (strategy.shouldApply(transaction, config)) {
        return strategy;
      }
    }

    // Default to greedy strategy
    return new GreedyChangeStrategy();
  }

  /**
   * Adds a custom strategy to the factory
   * @param strategy The strategy to add
   */
  addStrategy(strategy: ChangeStrategy): void {
    this.strategies.unshift(strategy); // Add at beginning for priority
  }
}
