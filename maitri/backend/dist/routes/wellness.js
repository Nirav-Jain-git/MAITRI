"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wellnessRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("@/middleware/errorHandler");
const DatabaseService_1 = require("@/services/DatabaseService");
const AIService_1 = require("@/services/AIService");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
exports.wellnessRoutes = router;
const dbService = new DatabaseService_1.DatabaseService();
const aiService = new AIService_1.AIService();
router.get('/score/:sessionId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    try {
        const wellnessScores = await dbService.getWellnessScores(sessionId, 5);
        if (wellnessScores.length === 0) {
            throw new errorHandler_1.AppError('No wellness data found for this session', 404);
        }
        const currentScore = wellnessScores[0];
        let trends = null;
        if (wellnessScores.length > 1) {
            const previousScore = wellnessScores[1];
            const change = currentScore.overall - previousScore.overall;
            trends = {
                trend: change > 0.1 ? 'improving' : change < -0.1 ? 'declining' : 'stable',
                recentScore: currentScore.overall,
                previousScore: previousScore.overall,
                change: Number(change.toFixed(2))
            };
        }
        const recommendations = generateRecommendations(currentScore);
        res.json({
            success: true,
            data: {
                overall: currentScore.overall,
                emotional: currentScore.emotional,
                physical: currentScore.physical,
                stress: currentScore.stress,
                energy: currentScore.energy,
                timestamp: currentScore.timestamp,
                trends,
                recommendations
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting wellness score:', error);
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        throw new errorHandler_1.AppError('Failed to get wellness score', 500);
    }
}));
router.get('/history/:sessionId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { limit = 100 } = req.query;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    try {
        const wellnessHistory = await dbService.getWellnessScores(sessionId, Number(limit));
        res.json({
            success: true,
            data: wellnessHistory.map(score => ({
                id: score.id,
                overall: score.overall,
                emotional: score.emotional,
                physical: score.physical,
                stress: score.stress,
                energy: score.energy,
                timestamp: score.timestamp
            }))
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting wellness history:', error);
        throw new errorHandler_1.AppError('Failed to get wellness history', 500);
    }
}));
router.post('/calculate/:sessionId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        throw new errorHandler_1.AppError('Session ID is required', 400);
    }
    try {
        const emotionHistory = await dbService.getEmotionData(sessionId, 20);
        if (emotionHistory.length === 0) {
            throw new errorHandler_1.AppError('No emotion data found for wellness calculation', 404);
        }
        const wellnessScore = await aiService.calculateWellnessScore(emotionHistory.map(e => ({
            emotion: e.emotion,
            confidence: e.confidence,
            timestamp: e.timestamp
        })), sessionId);
        const wellnessRecord = {
            sessionId,
            overall: wellnessScore.overall,
            emotional: wellnessScore.emotional,
            physical: wellnessScore.physical,
            stress: wellnessScore.stress,
            energy: wellnessScore.energy,
            timestamp: new Date()
        };
        await dbService.saveWellnessScore(wellnessRecord);
        logger_1.logger.info(`Wellness score calculated for session ${sessionId}: ${wellnessScore.overall}`);
        res.json({
            success: true,
            data: {
                ...wellnessScore,
                timestamp: wellnessRecord.timestamp
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating wellness score:', error);
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        throw new errorHandler_1.AppError('Failed to calculate wellness score', 500);
    }
}));
function generateRecommendations(score) {
    const recommendations = [];
    if (score.overall >= 0.8) {
        recommendations.push("Keep doing what makes you happy!");
        recommendations.push("Maintain your current positive activities");
    }
    else if (score.overall >= 0.6) {
        recommendations.push("You're doing well! Consider some relaxation exercises");
        recommendations.push("Try to maintain a regular sleep schedule");
    }
    else if (score.overall >= 0.4) {
        recommendations.push("Take some time for self-care activities");
        recommendations.push("Consider talking to someone you trust");
    }
    else {
        recommendations.push("Focus on basic self-care: sleep, nutrition, and hydration");
        recommendations.push("Consider reaching out to a mental health professional");
    }
    if (score.stress > 0.7) {
        recommendations.push("Practice deep breathing or meditation");
        recommendations.push("Take regular breaks throughout your day");
    }
    if (score.energy < 0.4) {
        recommendations.push("Ensure you're getting adequate rest");
        recommendations.push("Consider light physical activity or stretching");
    }
    return recommendations;
}
//# sourceMappingURL=wellness.js.map