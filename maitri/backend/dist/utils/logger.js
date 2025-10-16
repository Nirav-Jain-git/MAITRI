"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("@/config");
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    defaultMeta: { service: 'maitri-backend' },
    transports: [
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
        }),
        new winston_1.default.transports.File({
            filename: './logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: './logs/error.log',
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});
if (config_1.config.env !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map