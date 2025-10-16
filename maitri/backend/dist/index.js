"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const DatabaseService_1 = require("@/services/DatabaseService");
const SocketService_1 = require("@/services/SocketService");
const AIService_1 = require("@/services/AIService");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const config_1 = require("@/config");
const health_1 = require("@/routes/health");
const emotion_1 = require("@/routes/emotion");
const wellness_1 = require("@/routes/wellness");
const conversation_1 = require("@/routes/conversation");
const session_1 = require("@/routes/session");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config_1.config.frontend.url,
                methods: ['GET', 'POST'],
            },
        });
        this.databaseService = new DatabaseService_1.DatabaseService();
        this.aiService = new AIService_1.AIService();
        this.socketService = new SocketService_1.SocketService(this.io, this.aiService);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: config_1.config.frontend.url,
            credentials: true,
        }));
        this.app.use((0, compression_1.default)());
        this.app.use((0, morgan_1.default)('combined', {
            stream: { write: (message) => logger_1.logger.info(message.trim()) },
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.set('trust proxy', 1);
    }
    setupRoutes() {
        this.app.use('/api/health', health_1.healthRoutes);
        this.app.use('/api/emotion', emotion_1.emotionRoutes);
        this.app.use('/api/wellness', wellness_1.wellnessRoutes);
        this.app.use('/api/conversation', conversation_1.conversationRoutes);
        this.app.use('/api/session', session_1.sessionRoutes);
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
                path: req.originalUrl,
            });
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }
    async start() {
        try {
            await this.databaseService.initialize();
            logger_1.logger.info('Database initialized successfully');
            await this.aiService.initialize();
            logger_1.logger.info('AI service initialized successfully');
            this.server.listen(config_1.config.port, () => {
                logger_1.logger.info(`Server running on port ${config_1.config.port}`);
                logger_1.logger.info(`Environment: ${config_1.config.env}`);
            });
            this.socketService.setupHandlers();
            logger_1.logger.info('Socket.IO service initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        try {
            await this.databaseService.close();
            this.server.close();
            logger_1.logger.info('Server stopped gracefully');
        }
        catch (error) {
            logger_1.logger.error('Error stopping server:', error);
            throw error;
        }
    }
    getApp() {
        return this.app;
    }
}
const app = new App();
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    await app.stop();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    await app.stop();
    process.exit(0);
});
if (require.main === module) {
    app.start();
}
exports.default = app;
//# sourceMappingURL=index.js.map