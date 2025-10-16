"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("@/utils/logger");
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    const { statusCode = 500, message, stack } = error;
    logger_1.logger.error({
        statusCode,
        message,
        stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    const response = {
        success: false,
        message: statusCode === 500 ? 'Internal Server Error' : message,
        ...(process.env.NODE_ENV === 'development' && { stack }),
    };
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
const notFound = (req, res, next) => {
    const error = new AppError(`Resource not found - ${req.originalUrl}`, 404);
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map