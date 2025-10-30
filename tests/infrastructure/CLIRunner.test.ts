import { CLIRunner, CLIConfig } from '../../src/infrastructure/CLIRunner';
import { FileProcessor } from '../../src/infrastructure/FileProcessor';
import { CashRegisterError } from '../../src/domain/Currency';
import { US_CURRENCY } from '../../src/config/currencies';

jest.mock('../../src/infrastructure/FileProcessor');

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
};

const MockFileProcessor = FileProcessor as jest.MockedClass<typeof FileProcessor>;

describe('CLIRunner', () => {
  let cliRunner: CLIRunner;
  let mockFileProcessor: jest.Mocked<FileProcessor>;

  const mockConfig: CLIConfig = {
    currency: US_CURRENCY,
    specialRuleConfig: {
      divisor: 3,
      description: 'Test rule',
    },
  };

  beforeEach(() => {
    mockFileProcessor = new MockFileProcessor() as jest.Mocked<FileProcessor>;
    cliRunner = new CLIRunner(mockConfig, mockFileProcessor);
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  describe('run', () => {
    beforeEach(() => {
      mockFileProcessor.fileExists.mockResolvedValue(true);
      mockFileProcessor.readTransactionsFromCSV.mockResolvedValue([
        [2.12, 3.0],
        [1.97, 2.0],
        [3.33, 5.0],
      ]);
      mockFileProcessor.writeResultsToFile.mockResolvedValue();
    });

    it('should process file successfully', async () => {
      await cliRunner.run('/test/input.csv', '/test/output.txt');

      expect(mockFileProcessor.fileExists).toHaveBeenCalledWith('/test/input.csv');
      expect(mockFileProcessor.readTransactionsFromCSV).toHaveBeenCalledWith('/test/input.csv');
      expect(mockFileProcessor.writeResultsToFile).toHaveBeenCalledWith('/test/output.txt', expect.any(Array));
      expect(consoleSpy.log).toHaveBeenCalledWith('Reading transactions from: /test/input.csv');
      expect(consoleSpy.log).toHaveBeenCalledWith('Found 3 transactions to process');
      expect(consoleSpy.log).toHaveBeenCalledWith('Results written to: /test/output.txt');
    });

    it('should throw error when input file does not exist', async () => {
      mockFileProcessor.fileExists.mockResolvedValue(false);

      await expect(cliRunner.run('/test/missing.csv', '/test/output.txt')).rejects.toThrow(CashRegisterError);

      expect(mockFileProcessor.readTransactionsFromCSV).not.toHaveBeenCalled();
    });

    it('should handle file processing errors', async () => {
      const error = new Error('File read error');
      mockFileProcessor.readTransactionsFromCSV.mockRejectedValue(error);

      await expect(cliRunner.run('/test/input.csv', '/test/output.txt')).rejects.toThrow(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('Unexpected Error: File read error');
    });

    it('should handle cash register errors', async () => {
      const error = new CashRegisterError('Domain error', 'DOMAIN_ERROR');
      mockFileProcessor.readTransactionsFromCSV.mockRejectedValue(error);

      await expect(cliRunner.run('/test/input.csv', '/test/output.txt')).rejects.toThrow(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('Cash Register Error [DOMAIN_ERROR]: Domain error');
    });

    it('should log stack trace in development mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const error = new Error('Test error');
      error.stack = 'Test stack trace';
      mockFileProcessor.readTransactionsFromCSV.mockRejectedValue(error);

      await expect(cliRunner.run('/test/input.csv', '/test/output.txt')).rejects.toThrow(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('Test stack trace');

      process.env['NODE_ENV'] = originalEnv;
    });
  });

  describe('validateArgs', () => {
    it('should validate and return correct arguments', () => {
      const args = ['input.csv', 'output.txt'];
      const result = CLIRunner.validateArgs(args);

      expect(result).toEqual({
        inputFile: 'input.csv',
        outputFile: 'output.txt',
      });
    });

    it('should throw error when insufficient arguments provided', () => {
      expect(() => CLIRunner.validateArgs(['input.csv'])).toThrow(CashRegisterError);
    });

    it('should throw error when no arguments provided', () => {
      expect(() => CLIRunner.validateArgs([])).toThrow(CashRegisterError);
    });

    it('should throw error when empty arguments provided', () => {
      expect(() => CLIRunner.validateArgs(['', 'output.txt'])).toThrow(CashRegisterError);
    });
  });

  describe('constructor', () => {
    it('should create CLIRunner with provided file processor', () => {
      const customFileProcessor = new MockFileProcessor();
      const runner = new CLIRunner(mockConfig, customFileProcessor);

      expect(runner).toBeInstanceOf(CLIRunner);
    });

    it('should create CLIRunner with default file processor', () => {
      const runner = new CLIRunner(mockConfig);

      expect(runner).toBeInstanceOf(CLIRunner);
    });
  });
});
