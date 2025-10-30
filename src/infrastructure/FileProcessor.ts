import { promises as fs } from 'fs';
import { CashRegisterError } from '../domain/Currency';

export class FileProcessingError extends CashRegisterError {
  public override readonly cause?: Error;
  constructor(
    message: string,
    public readonly filePath: string,
    cause?: Error
  ) {
    super(message, 'FILE_PROCESSING_ERROR');
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export class CSVParsingError extends CashRegisterError {
  constructor(
    message: string,
    public readonly lineNumber: number,
    public readonly line: string
  ) {
    super(message, 'CSV_PARSING_ERROR');
  }
}

export class FileProcessor {
  async readTransactionsFromCSV(filePath: string): Promise<[number, number][]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseCSVContent(content);
    } catch (error) {
      if (error instanceof CSVParsingError) {
        throw error;
      }
      throw new FileProcessingError(`Failed to read file: ${(error as Error).message}`, filePath, error as Error);
    }
  }

  async writeResultsToFile(filePath: string, results: string[]): Promise<void> {
    try {
      await fs.writeFile(filePath, results.join('\n'), 'utf-8');
    } catch (error) {
      throw new FileProcessingError(`Failed to write file: ${(error as Error).message}`, filePath, error as Error);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  private parseCSVContent(content: string): [number, number][] {
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line, i) => {
        try {
          return this.parseCSVLine(line.trim(), i + 1);
        } catch (error) {
          if (error instanceof CSVParsingError) {
            throw error;
          }
          throw new CSVParsingError(`Invalid line format: ${(error as Error).message}`, i + 1, line);
        }
      });
  }

  private parseCSVLine(line: string, lineNumber: number): [number, number] {
    const parts = line.split(',').map((part) => part.trim());
    if (parts.length !== 2) {
      throw new CSVParsingError(`Expected 2 comma-separated values, got ${parts.length}`, lineNumber, line);
    }
    // We know these elements exist because we checked the length above
    const amountOwedStr = parts[0] as string;
    const amountPaidStr = parts[1] as string;
    return [
      this.parseAmount(amountOwedStr, lineNumber, line, 'amount owed'),
      this.parseAmount(amountPaidStr, lineNumber, line, 'amount paid'),
    ];
  }

  private parseAmount(amountStr: string, lineNumber: number, line: string, fieldName: string): number {
    if (!amountStr) {
      throw new CSVParsingError(`Missing ${fieldName}`, lineNumber, line);
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      throw new CSVParsingError(`Invalid ${fieldName}: '${amountStr}' is not a valid number`, lineNumber, line);
    }
    if (amount < 0) {
      throw new CSVParsingError(`Invalid ${fieldName}: '${amountStr}' cannot be negative`, lineNumber, line);
    }
    if (!isFinite(amount)) {
      throw new CSVParsingError(`Invalid ${fieldName}: '${amountStr}' must be a finite number`, lineNumber, line);
    }

    const decimalPlaces = (amountStr.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new CSVParsingError(`Invalid ${fieldName}: '${amountStr}' has too many decimal places`, lineNumber, line);
    }

    return amount;
  }
}
