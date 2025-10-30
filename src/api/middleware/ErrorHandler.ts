import { Request, Response, NextFunction } from 'express';
import { CashRegisterError } from '../../domain/Currency';

export class ErrorHandler {
  static handleError(error: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error('Request error:', error.message, `${req.method} ${req.url}`);

    if (error instanceof CashRegisterError) {
      const statusCode = ErrorHandler.getStatusCodeForCashRegisterError(error.code);
      res.status(statusCode).json({
        error: error.message,
        code: error.code,
        details: ErrorHandler.getErrorDetails(error),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.message });
      return;
    }

    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({ error: 'Invalid JSON in request body', code: 'INVALID_JSON' });
      return;
    }

    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
  }

  static handleNotFound(req: Request, res: Response): void {
    res.status(404).json({
      error: `Route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
      availableRoutes: ['POST /api/v1/change/batch', 'GET /health'],
    });
  }

  private static getStatusCodeForCashRegisterError(code: string): number {
    switch (code) {
      case 'INSUFFICIENT_PAYMENT':
      case 'INVALID_AMOUNT':
        return 422; // Unprocessable Entity
      case 'FILE_NOT_FOUND':
      case 'CURRENCY_NOT_FOUND':
        return 404; // Not Found
      case 'INVALID_ARGUMENTS':
      case 'CSV_PARSING_ERROR':
        return 400; // Bad Request
      case 'FILE_PROCESSING_ERROR':
        return 500; // Internal Server Error
      default:
        return 500;
    }
  }

  private static getErrorDetails(error: CashRegisterError): Record<string, unknown> | undefined {
    const details: Record<string, unknown> = {};
    const errorWithDetails = error as CashRegisterError & {
      amountOwed?: number;
      amountPaid?: number;
      filePath?: string;
      lineNumber?: number;
      line?: string;
    };

    if ('amountOwed' in errorWithDetails && 'amountPaid' in errorWithDetails) {
      details['amountOwed'] = errorWithDetails.amountOwed;
      details['amountPaid'] = errorWithDetails.amountPaid;
    }
    if ('filePath' in errorWithDetails) {
      details['filePath'] = errorWithDetails.filePath;
    }
    if ('lineNumber' in errorWithDetails && 'line' in errorWithDetails) {
      details['lineNumber'] = errorWithDetails.lineNumber;
      details['line'] = errorWithDetails.line;
    }
    return Object.keys(details).length > 0 ? details : undefined;
  }
}
