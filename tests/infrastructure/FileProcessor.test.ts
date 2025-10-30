import { promises as fs } from 'fs';
import { FileProcessor, FileProcessingError, CSVParsingError } from '../../src/infrastructure/FileProcessor';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
  constants: {
    R_OK: 4,
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('FileProcessor', () => {
  let fileProcessor: FileProcessor;

  beforeEach(() => {
    fileProcessor = new FileProcessor();
    jest.clearAllMocks();
  });

  describe('readTransactionsFromCSV', () => {
    it('should parse valid CSV content', async () => {
      const csvContent = '2.12,3.00\n1.97,2.00\n3.33,5.00';
      mockFs.readFile.mockResolvedValue(csvContent);

      const result = await fileProcessor.readTransactionsFromCSV('/test/input.csv');

      expect(result).toEqual([
        [2.12, 3.0],
        [1.97, 2.0],
        [3.33, 5.0],
      ]);
      expect(mockFs.readFile).toHaveBeenCalledWith('/test/input.csv', 'utf-8');
    });

    it('should handle CSV with whitespace', async () => {
      const csvContent = ' 2.12 , 3.00 \n 1.97 , 2.00 \n  \n 3.33 , 5.00 ';
      mockFs.readFile.mockResolvedValue(csvContent);

      const result = await fileProcessor.readTransactionsFromCSV('/test/input.csv');

      expect(result).toEqual([
        [2.12, 3.0],
        [1.97, 2.0],
        [3.33, 5.0],
      ]);
    });

    it('should throw FileProcessingError when file cannot be read', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(fileProcessor.readTransactionsFromCSV('/test/missing.csv')).rejects.toThrow(FileProcessingError);
    });

    it('should throw CSVParsingError for invalid number of columns', async () => {
      const csvContent = '2.12,3.00,extra\n1.97';
      mockFs.readFile.mockResolvedValue(csvContent);

      await expect(fileProcessor.readTransactionsFromCSV('/test/input.csv')).rejects.toThrow(CSVParsingError);
    });

    it('should throw CSVParsingError for invalid numbers', async () => {
      const csvContent = '2.12,abc\n1.97,2.00';
      mockFs.readFile.mockResolvedValue(csvContent);

      await expect(fileProcessor.readTransactionsFromCSV('/test/input.csv')).rejects.toThrow(CSVParsingError);
    });

    it('should throw CSVParsingError for negative amounts', async () => {
      const csvContent = '-2.12,3.00\n1.97,2.00';
      mockFs.readFile.mockResolvedValue(csvContent);

      await expect(fileProcessor.readTransactionsFromCSV('/test/input.csv')).rejects.toThrow(CSVParsingError);
    });

    it('should throw CSVParsingError for too many decimal places', async () => {
      const csvContent = '2.123,3.00\n1.97,2.00';
      mockFs.readFile.mockResolvedValue(csvContent);

      await expect(fileProcessor.readTransactionsFromCSV('/test/input.csv')).rejects.toThrow(CSVParsingError);
    });

    it('should throw CSVParsingError for missing values', async () => {
      const csvContent = ',3.00\n1.97,2.00';
      mockFs.readFile.mockResolvedValue(csvContent);

      await expect(fileProcessor.readTransactionsFromCSV('/test/input.csv')).rejects.toThrow(CSVParsingError);
    });

    it('should handle empty file', async () => {
      mockFs.readFile.mockResolvedValue('');

      const result = await fileProcessor.readTransactionsFromCSV('/test/empty.csv');
      expect(result).toEqual([]);
    });
  });

  describe('writeResultsToFile', () => {
    it('should write results to file', async () => {
      const results = ['3 quarters,1 dime,3 pennies', '3 pennies', '1 dollar,1 quarter'];

      await fileProcessor.writeResultsToFile('/test/output.txt', results);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/output.txt',
        '3 quarters,1 dime,3 pennies\n3 pennies\n1 dollar,1 quarter',
        'utf-8'
      );
    });

    it('should handle empty results', async () => {
      await fileProcessor.writeResultsToFile('/test/output.txt', []);

      expect(mockFs.writeFile).toHaveBeenCalledWith('/test/output.txt', '', 'utf-8');
    });

    it('should throw FileProcessingError when write fails', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      await expect(fileProcessor.writeResultsToFile('/test/output.txt', ['test'])).rejects.toThrow(FileProcessingError);
    });
  });

  describe('fileExists', () => {
    it('should return false when file does not exist', async () => {
      mockFs.access.mockImplementation(() => Promise.reject(new Error('File not found')));

      const result = await fileProcessor.fileExists('/test/missing.csv');

      expect(result).toBe(false);
    });
  });

  describe('Error classes', () => {
    describe('FileProcessingError', () => {
      it('should create error with file path and cause', () => {
        const cause = new Error('Original error');
        const error = new FileProcessingError('Test message', '/test/file.csv', cause);

        expect(error.message).toBe('Test message');
        expect(error.code).toBe('FILE_PROCESSING_ERROR');
        expect(error.filePath).toBe('/test/file.csv');
        expect(error.cause).toBe(cause);
      });
    });

    describe('CSVParsingError', () => {
      it('should create error with line details', () => {
        const error = new CSVParsingError('Invalid format', 5, '2.12,abc');

        expect(error.message).toBe('Invalid format');
        expect(error.code).toBe('CSV_PARSING_ERROR');
        expect(error.lineNumber).toBe(5);
        expect(error.line).toBe('2.12,abc');
      });
    });
  });
});
