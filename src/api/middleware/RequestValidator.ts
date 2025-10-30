import { Request, Response, NextFunction } from 'express';

interface JSONSchema {
  type: string;
  required?: string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  enum?: unknown[];
  additionalProperties?: boolean;
}

/**
 * Request validation middleware using JSON Schema
 */
export class RequestValidator {
  /**
   * Creates validation middleware for JSON Schema
   */
  static validateSchema(schema: JSONSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validationResult = RequestValidator.validateObject(req.body, schema);

        if (!validationResult.valid) {
          res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationResult.errors,
          });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validates an object against a JSON schema
   */
  private static validateObject(obj: unknown, schema: JSONSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (schema.type === 'object' && (typeof obj !== 'object' || obj === null || Array.isArray(obj))) {
      errors.push(`Expected object, got ${typeof obj}`);
      return { valid: false, errors };
    }

    if (schema.type === 'array' && !Array.isArray(obj)) {
      errors.push(`Expected array, got ${typeof obj}`);
      return { valid: false, errors };
    }

    if (schema.type === 'string' && typeof obj !== 'string') {
      errors.push(`Expected string, got ${typeof obj}`);
      return { valid: false, errors };
    }

    if (schema.type === 'number' && typeof obj !== 'number') {
      errors.push(`Expected number, got ${typeof obj}`);
      return { valid: false, errors };
    }

    if (schema.type === 'integer' && !Number.isInteger(obj as number)) {
      errors.push(`Expected integer, got ${typeof obj}`);
      return { valid: false, errors };
    }

    // Type-specific validations
    if (schema.type === 'object' && obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
      const objRecord = obj as Record<string, unknown>;

      // Required properties
      if (schema.required) {
        for (const required of schema.required) {
          if (!(required in objRecord)) {
            errors.push(`Missing required property: ${required}`);
          }
        }
      }

      // Validate properties
      if (schema.properties) {
        for (const [key, value] of Object.entries(objRecord)) {
          const propertySchema = schema.properties[key];
          if (propertySchema) {
            const propertyResult = RequestValidator.validateObject(value, propertySchema);
            if (!propertyResult.valid) {
              errors.push(...propertyResult.errors.map((err) => `${key}: ${err}`));
            }
          } else if (schema.additionalProperties === false) {
            errors.push(`Additional property not allowed: ${key}`);
          }
        }
      }
    }

    if (schema.type === 'array' && Array.isArray(obj)) {
      // Array length validation
      if (schema.minItems !== undefined && obj.length < schema.minItems) {
        errors.push(`Array must have at least ${schema.minItems} items`);
      }
      if (schema.maxItems !== undefined && obj.length > schema.maxItems) {
        errors.push(`Array must have at most ${schema.maxItems} items`);
      }

      // Validate array items
      if (schema.items) {
        const itemSchema = schema.items;
        obj.forEach((item, index) => {
          const itemResult = RequestValidator.validateObject(item, itemSchema);
          if (!itemResult.valid) {
            errors.push(...itemResult.errors.map((err) => `[${index}]: ${err}`));
          }
        });
      }
    }

    // Number validations
    if (schema.type === 'number' && typeof obj === 'number') {
      if (schema.minimum !== undefined && obj < schema.minimum) {
        errors.push(`Number must be at least ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && obj > schema.maximum) {
        errors.push(`Number must be at most ${schema.maximum}`);
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(obj)) {
      errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates required query parameters
   */
  static validateQueryParams(requiredParams: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const missing = requiredParams.filter((param) => !(param in req.query));

      if (missing.length > 0) {
        res.status(400).json({
          error: `Missing required query parameters: ${missing.join(', ')}`,
          code: 'MISSING_QUERY_PARAMS',
        });
        return;
      }

      next();
    };
  }

  /**
   * Validates path parameters
   */
  static validatePathParams(validations: Record<string, (_value: string) => boolean>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const errors: string[] = [];

      for (const [param, validator] of Object.entries(validations)) {
        const value = req.params[param];
        if (value && !validator(value)) {
          errors.push(`Invalid ${param}: ${value}`);
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          error: 'Path parameter validation failed',
          code: 'INVALID_PATH_PARAMS',
          details: errors,
        });
        return;
      }

      next();
    };
  }
}
