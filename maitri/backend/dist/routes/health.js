"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const AIService_1 = require("@/services/AIService");
const DatabaseService_1 = require("@/services/DatabaseService");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', async (req, res) => {
    try {
        const dbService = new DatabaseService_1.DatabaseService();
        const aiService = new AIService_1.AIService();
        const aiHealthy = await aiService.checkHealth();
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'ok',
                ai: aiHealthy ? 'ok' : 'down',
            },
            version: '1.0.0',
            uptime: process.uptime(),
        };
        const httpStatus = aiHealthy ? 200 : 503;
        res.status(httpStatus).json({
            success: true,
            data: health,
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            message: 'Service unavailable',
            data: {
                status: 'error',
                timestamp: new Date().toISOString(),
            },
        });
    }
});
router.get('/detailed', async (req, res) => {
    try {
        const aiService = new AIService_1.AIService();
        const aiHealthy = await aiService.checkHealth();
        const health = {
            status: aiHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: 'ok',
                    type: 'sqlite3',
                },
                ai: {
                    status: aiHealthy ? 'ok' : 'down',
                    features: {
                        emotionDetection: true,
                        conversation: true,
                        tts: true,
                    },
                },
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
            },
        };
        res.status(aiHealthy ? 200 : 503).json({
            success: true,
            data: health,
        });
    }
    catch (error) {
        logger_1.logger.error('Detailed health check failed:', error);
        res.status(503).json({
            success: false,
            message: 'Service unavailable',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
//# sourceMappingURL=health.js.map