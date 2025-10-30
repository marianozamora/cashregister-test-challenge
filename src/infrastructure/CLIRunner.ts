import { FileProcessor } from './FileProcessor';
import { ChangeCalculator } from '../domain/ChangeCalculator';
import { Currency, SpecialRuleConfig, CashRegisterError } from '../domain/Currency';

/**
 * Configuration for the CLI application
 */
export interface CLIConfig {
  readonly currency: Currency;
  readonly specialRuleConfig: SpecialRuleConfig;
}

/**
 * Main CLI runner that orchestrates the cash register operations
 */
export class CLIRunner {
  private readonly fileProcessor: FileProcessor;
  private readonly changeCalculator: ChangeCalculator;

  constructor(config: CLIConfig, fileProcessor?: FileProcessor) {
    this.fileProcessor = fileProcessor ?? new FileProcessor();
    this.changeCalculator = new ChangeCalculator(config.currency, config.specialRuleConfig);
  }

  /**
   * Runs the cash register application
   * @param inputFilePath Path to input CSV file
   * @param outputFilePath Path to output file
   * @returns Promise that resolves when processing is complete
   */
  async run(inputFilePath: string, outputFilePath: string): Promise<void> {
    try {
      console.log(`Reading transactions from: ${inputFilePath}`);

      // Validate input file exists
      if (!(await this.fileProcessor.fileExists(inputFilePath))) {
        throw new CashRegisterError(`Input file does not exist: ${inputFilePath}`, 'FILE_NOT_FOUND');
      }

      // Read and parse transactions
      const transactions = await this.fileProcessor.readTransactionsFromCSV(inputFilePath);
      console.log(`Found ${transactions.length} transactions to process`);

      // Process transactions
      const results = this.changeCalculator.processTransactions(transactions);

      // Write results
      await this.fileProcessor.writeResultsToFile(outputFilePath, results);
      console.log(`Results written to: ${outputFilePath}`);
    } catch (error) {
      this.handleError(error as Error);
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Handles and logs errors appropriately
   * @param error The error to handle
   */
  private handleError(error: Error): void {
    if (error instanceof CashRegisterError) {
      console.error(`Cash Register Error [${error.code}]: ${error.message}`);
    } else {
      console.error(`Unexpected Error: ${error.message}`);
    }

    // Log stack trace in development
    if (process.env['NODE_ENV'] === 'development') {
      console.error(error.stack);
    }
  }

  /**
   * Validates command line arguments
   * @param args Command line arguments
   * @returns Validated input and output file paths
   */
  static validateArgs(args: string[]): { inputFile: string; outputFile: string } {
    if (args.length < 2) {
      throw new CashRegisterError('Usage: cash-register <input-file> <output-file>', 'INVALID_ARGUMENTS');
    }

    const [inputFile, outputFile] = args;

    if (!inputFile || !outputFile) {
      throw new CashRegisterError('Both input and output file paths are required', 'INVALID_ARGUMENTS');
    }

    return { inputFile, outputFile };
  }
}
