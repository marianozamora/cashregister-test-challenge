import {
  US_CURRENCY,
  EUR_CURRENCY,
  CURRENCY_REGISTRY,
  getCurrencyByCode,
  getAvailableCurrencyCodes,
} from '../../src/config/currencies';

describe('Currency Configuration', () => {
  describe('US_CURRENCY', () => {
    it('should have correct basic properties', () => {
      expect(US_CURRENCY.code).toBe('USD');
      expect(US_CURRENCY.name).toBe('US Dollar');
      expect(US_CURRENCY.symbol).toBe('$');
    });

    it('should have denominations in descending order', () => {
      const values = US_CURRENCY.denominations.map((d) => d.valueInCents);
      expect(values).toEqual([100, 25, 10, 5, 1]);
    });

    it('should have correct denomination names', () => {
      const names = US_CURRENCY.denominations.map((d) => d.name);
      expect(names).toEqual(['dollar', 'quarter', 'dime', 'nickel', 'penny']);
    });

    it('should have proper denomination symbols', () => {
      const symbols = US_CURRENCY.denominations.map((d) => d.symbol);
      expect(symbols).toEqual(['$', '¢', '¢', '¢', '¢']);
    });
  });

  describe('EUR_CURRENCY', () => {
    it('should have correct basic properties', () => {
      expect(EUR_CURRENCY.code).toBe('EUR');
      expect(EUR_CURRENCY.name).toBe('Euro');
      expect(EUR_CURRENCY.symbol).toBe('€');
    });

    it('should have denominations in descending order', () => {
      const values = EUR_CURRENCY.denominations.map((d) => d.valueInCents);
      expect(values).toEqual([100, 50, 20, 10, 5, 2, 1]);
    });

    it('should have correct denomination names', () => {
      const names = EUR_CURRENCY.denominations.map((d) => d.name);
      expect(names).toEqual(['euro', '50-cent', '20-cent', '10-cent', '5-cent', '2-cent', '1-cent']);
    });
  });

  describe('CURRENCY_REGISTRY', () => {
    it('should contain all defined currencies', () => {
      expect(CURRENCY_REGISTRY.USD).toBe(US_CURRENCY);
      expect(CURRENCY_REGISTRY.EUR).toBe(EUR_CURRENCY);
    });

    it('should be properly typed', () => {
      // This test ensures TypeScript compilation works correctly
      const usdCurrency = CURRENCY_REGISTRY.USD;
      const eurCurrency = CURRENCY_REGISTRY.EUR;

      expect(usdCurrency.code).toBe('USD');
      expect(eurCurrency.code).toBe('EUR');
    });
  });

  describe('getCurrencyByCode', () => {
    it('should return correct currency for valid codes', () => {
      expect(getCurrencyByCode('USD')).toBe(US_CURRENCY);
      expect(getCurrencyByCode('EUR')).toBe(EUR_CURRENCY);
    });

    it('should throw error for invalid currency code', () => {
      expect(() => getCurrencyByCode('GBP' as any)).toThrow('Unsupported currency code: GBP');
    });
  });

  describe('getAvailableCurrencyCodes', () => {
    it('should return all available currency codes', () => {
      const codes = getAvailableCurrencyCodes();
      expect(codes).toEqual(['USD', 'EUR']);
    });

    it('should return array with correct typing', () => {
      const codes = getAvailableCurrencyCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });
  });

  describe('Currency immutability', () => {
    it('should have readonly denominations', () => {
      // TypeScript readonly arrays are compile-time checks only
      // In JavaScript, they're still mutable, so we test that the configuration is properly structured
      expect(US_CURRENCY.denominations).toBeDefined();
      expect(Array.isArray(US_CURRENCY.denominations)).toBe(true);
    });

    it('should have properly structured denomination objects', () => {
      const firstDenomination = US_CURRENCY.denominations[0];
      expect(firstDenomination).toHaveProperty('name');
      expect(firstDenomination).toHaveProperty('valueInCents');
      expect(firstDenomination).toHaveProperty('symbol');
    });
  });
});
