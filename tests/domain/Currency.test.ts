import { CashRegisterError, InsufficientPaymentError, InvalidAmountError } from '../../src/domain/Currency';

describe('Currency Domain Errors', () => {
  describe('CashRegisterError', () => {
    it('should create error with message and code', () => {
      const error = new CashRegisterError('Test message', 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('CashRegisterError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InsufficientPaymentError', () => {
    it('should create error with payment details', () => {
      const error = new InsufficientPaymentError(100, 50);

      expect(error.message).toBe('Insufficient payment: owed 100 cents, paid 50 cents');
      expect(error.code).toBe('INSUFFICIENT_PAYMENT');
      expect(error).toBeInstanceOf(CashRegisterError);
    });
  });

  describe('InvalidAmountError', () => {
    it('should create error with invalid amount', () => {
      const error = new InvalidAmountError(-10);

      expect(error.message).toBe('Invalid amount: -10. Amount must be positive.');
      expect(error.code).toBe('INVALID_AMOUNT');
      expect(error).toBeInstanceOf(CashRegisterError);
    });
  });
});
