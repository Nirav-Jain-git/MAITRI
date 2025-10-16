"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emotionRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("@/middleware/errorHandler");
const DatabaseService_1 = require("@/services/DatabaseService");
const AIService_1 = require("@/services/AIService");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
exports.emotionRoutes = router;
const dbService = new DatabaseService_1.DatabaseService();
const aiService = new AIService_1.AIService();
router.post('/detect', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, imageData, audioData } = req.body;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    if (!imageData && !audioData) {
        throw new errorHandler_1.AppError('Either image data or audio data is required', 400);
    }
    try {
        const session = await dbService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError('Session not found', 404);
        }
        if (session.status !== 'active') {
            throw new errorHandler_1.AppError('Session is not active', 400);
        }
        const emotionResult = await aiService.detectEmotion({
            sessionId,
            imageData,
            audioData
        });
        const emotionRecord = {
            sessionId,
            emotion: emotionResult.emotion,
            confidence: emotionResult.confidence,
            source: emotionResult.source,
            facialLandmarks: emotionResult.facialLandmarks ? JSON.stringify(emotionResult.facialLandmarks) : undefined,
            audioFeatures: emotionResult.audioFeatures ? JSON.stringify(emotionResult.audioFeatures) : undefined,
            timestamp: new Date()
        };
        await dbService.saveEmotionData(emotionRecord);
        if (emotionResult.wellnessScore) {
            const wellnessRecord = {
                sessionId,
                overall: emotionResult.wellnessScore.overall,
                emotional: emotionResult.wellnessScore.emotional,
                physical: emotionResult.wellnessScore.physical,
                stress: emotionResult.wellnessScore.stress,
                energy: emotionResult.wellnessScore.energy,
                timestamp: new Date()
            };
            await dbService.saveWellnessScore(wellnessRecord);
        }
        logger_1.logger.info(`Emotion detected for session ${sessionId}: ${emotionResult.emotion} (${emotionResult.confidence})`);
        res.json({
            success: true,
            data: {
                emotion: emotionResult.emotion,
                confidence: emotionResult.confidence,
                source: emotionResult.source,
                facialLandmarks: emotionResult.facialLandmarks,
                audioFeatures: emotionResult.audioFeatures,
                timestamp: emotionRecord.timestamp
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error detecting emotion:', error);
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        throw new errorHandler_1.AppError('Failed to detect emotion', 500);
    }
}));
router.get('/history/:sessionId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { limit = 100 } = req.query;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    try {
        const emotions = await dbService.getEmotionData(sessionId, Number(limit));
        res.json({
            success: true,
            data: emotions.map(emotion => ({
                id: emotion.id,
                emotion: emotion.emotion,
                confidence: emotion.confidence,
                source: emotion.source,
                timestamp: emotion.timestamp
            }))
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting emotion history:', error);
        throw new errorHandler_1.AppError('Failed to get emotion history', 500);
    }
}));
//# sourceMappingURL=emotion.js.map