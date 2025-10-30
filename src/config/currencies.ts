import { Currency, Denomination } from '../domain/Currency';

/**
 * US Dollar denominations in descending order by value
 */
const US_DENOMINATIONS: readonly Denomination[] = [
  { name: 'dollar', valueInCents: 100, symbol: '$' },
  { name: 'quarter', valueInCents: 25, symbol: '¢' },
  { name: 'dime', valueInCents: 10, symbol: '¢' },
  { name: 'nickel', valueInCents: 5, symbol: '¢' },
  { name: 'penny', valueInCents: 1, symbol: '¢' },
] as const;

/**
 * US Dollar currency configuration
 */
export const US_CURRENCY: Currency = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  denominations: US_DENOMINATIONS,
} as const;

/**
 * Euro denominations in descending order by value
 * Example configuration for future extensibility
 */
const EUR_DENOMINATIONS: readonly Denomination[] = [
  { name: 'euro', valueInCents: 100, symbol: '€' },
  { name: '50-cent', valueInCents: 50, symbol: 'c' },
  { name: '20-cent', valueInCents: 20, symbol: 'c' },
  { name: '10-cent', valueInCents: 10, symbol: 'c' },
  { name: '5-cent', valueInCents: 5, symbol: 'c' },
  { name: '2-cent', valueInCents: 2, symbol: 'c' },
  { name: '1-cent', valueInCents: 1, symbol: 'c' },
] as const;

/**
 * Euro currency configuration
 * Example configuration for future extensibility
 */
export const EUR_CURRENCY: Currency = {
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
  denominations: EUR_DENOMINATIONS,
} as const;

/**
 * Registry of available currencies for easy lookup
 */
export const CURRENCY_REGISTRY = {
  USD: US_CURRENCY,
  EUR: EUR_CURRENCY,
} as const;

/**
 * Type for currency codes
 */
export type CurrencyCode = keyof typeof CURRENCY_REGISTRY;

/**
 * Gets a currency by its code
 * @param code The currency code
 * @returns The currency configuration
 * @throws Error if currency code is not found
 */
export function getCurrencyByCode(code: CurrencyCode): Currency {
  const currency = CURRENCY_REGISTRY[code];
  if (!currency) {
    throw new Error(`Unsupported currency code: ${code}`);
  }
  return currency;
}

/**
 * Gets all available currency codes
 * @returns Array of available currency codes
 */
export function getAvailableCurrencyCodes(): CurrencyCode[] {
  return Object.keys(CURRENCY_REGISTRY) as CurrencyCode[];
}
