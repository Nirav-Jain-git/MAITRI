import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'maitri-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: './logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: './logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production then log to the console with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;