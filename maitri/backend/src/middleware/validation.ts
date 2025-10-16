import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Basic validation middleware
export const validateBody = (schema: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
          }

          if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters long`);
          }

          if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
            errors.push(`${field} cannot exceed ${rules.maxLength} characters`);
          }

          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
          }

          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
          }
        }
      }

      if (errors.length > 0) {
        throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = req.params[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} parameter is required`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} parameter format is invalid`);
          }
        }
      }

      if (errors.length > 0) {
        throw new AppError(`Parameter validation failed: ${errors.join(', ')}`, 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = req.query[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} query parameter is required`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (rules.type === 'number') {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`${field} must be a valid number`);
            } else {
              req.query[field] = numValue as any;
            }
          }

          if (rules.min && Number(value) < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }

          if (rules.max && Number(value) > rules.max) {
            errors.push(`${field} cannot exceed ${rules.max}`);
          }
        }
      }

      if (errors.length > 0) {
        throw new AppError(`Query validation failed: ${errors.join(', ')}`, 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  sessionId: {
    required: true,
    type: 'string',
    pattern: /^session_\d+$/
  },
  userId: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  conversationId: {
    required: true,
    type: 'string',
    pattern: /^conv_\d+$/
  },
  limit: {
    required: false,
    type: 'number',
    min: 1,
    max: 1000
  },
  offset: {
    required: false,
    type: 'number',
    min: 0
  }
};