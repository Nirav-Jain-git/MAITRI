"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("@/middleware/errorHandler");
const DatabaseService_1 = require("@/services/DatabaseService");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
exports.sessionRoutes = router;
const dbService = new DatabaseService_1.DatabaseService();
router.post('/start', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        throw new errorHandler_1.AppError('User ID is required', 400);
    }
    try {
        const sessionId = `session_${Date.now()}`;
        const startTime = new Date();
        const session = await dbService.createSession({
            sessionId,
            userId,
            startTime,
            status: 'active'
        });
        logger_1.logger.info(`Session started: ${sessionId} for user: ${userId}`);
        res.status(201).json({
            success: true,
            data: {
                sessionId: session.sessionId,
                userId: session.userId,
                startTime: session.startTime,
                status: session.status
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting session:', error);
        throw new errorHandler_1.AppError('Failed to start session', 500);
    }
}));
router.post('/end/:sessionId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    try {
        const session = await dbService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError('Session not found', 404);
        }
        if (session.status !== 'active') {
            throw new errorHandler_1.AppError('Session is not active', 400);
        }
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 1000);
        const [emotionData, wellnessData, conversationData] = await Promise.all([
            dbService.getEmotionDataBySession(sessionId),
            dbService.getWellnessDataBySession(sessionId),
            dbService.getConversationsBySession(sessionId)
        ]);
        const averageWellness = wellnessData.length > 0
            ? wellnessData.reduce((sum, item) => sum + item.overall, 0) / wellnessData.length
            : 0;
        const totalInteractions = conversationData.length;
        const updatedSession = await dbService.updateSession(sessionId, {
            endTime,
            status: 'completed',
            averageWellness: Number(averageWellness.toFixed(2)),
            totalInteractions
        });
        logger_1.logger.info(`Session ended: ${sessionId}, duration: ${duration}s`);
        res.json({
            success: true,
            data: {
                sessionId: updatedSession.sessionId,
                endTime: updatedSession.endTime,
                duration,
                averageWellness: updatedSession.averageWellness,
                totalInteractions: updatedSession.totalInteractions
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error ending session:', error);
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        throw new errorHandler_1.AppError('Failed to end session', 500);
    }
}));
router.get('/:sessionId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    try {
        const session = await dbService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError('Session not found', 404);
        }
        res.json({
            success: true,
            data: session
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting session:', error);
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        throw new errorHandler_1.AppError('Failed to get session', 500);
    }
}));
router.get('/user/:userId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    if (!userId) {
        throw new errorHandler_1.AppError('User ID is required', 400);
    }
    try {
        const sessions = await dbService.getSessionsByUser(userId, Number(limit), Number(offset));
        res.json({
            success: true,
            data: sessions
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting user sessions:', error);
        throw new errorHandler_1.AppError('Failed to get user sessions', 500);
    }
}));
router.get('/active/all', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const activeSessions = await dbService.getActiveSessions();
        res.json({
            success: true,
            data: activeSessions
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting active sessions:', error);
        throw new errorHandler_1.AppError('Failed to get active sessions', 500);
    }
}));
//# sourceMappingURL=session.js.map