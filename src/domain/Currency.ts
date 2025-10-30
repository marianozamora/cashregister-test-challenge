/**
 * Represents a denomination in a currency system
 */
export interface Denomination {
  readonly name: string;
  readonly valueInCents: number;
  readonly symbol?: string;
}

/**
 * Represents a currency with its denominations
 */
export interface Currency {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly denominations: readonly Denomination[];
}

/**
 * Represents the result of change calculation
 */
export interface ChangeResult {
  readonly totalChangeInCents: number;
  readonly denominations: ReadonlyMap<string, number>;
  readonly formattedOutput: string;
}

/**
 * Represents a transaction requiring change calculation
 */
export interface Transaction {
  readonly amountOwedInCents: number;
  readonly amountPaidInCents: number;
  readonly changeInCents: number;
}

/**
 * Configuration for special change calculation rules
 */
export interface SpecialRuleConfig {
  readonly divisor: number;
  readonly description: string;
}

/**
 * Error types for the domain
 */
export class CashRegisterError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'CashRegisterError';
  }
}

export class InsufficientPaymentError extends CashRegisterError {
  constructor(amountOwed: number, amountPaid: number) {
    super(`Insufficient payment: owed ${amountOwed} cents, paid ${amountPaid} cents`, 'INSUFFICIENT_PAYMENT');
  }
}

export class InvalidAmountError extends CashRegisterError {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be positive.`, 'INVALID_AMOUNT');
  }
}
