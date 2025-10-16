"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("@/middleware/errorHandler");
const DatabaseService_1 = require("@/services/DatabaseService");
const AIService_1 = require("@/services/AIService");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
exports.conversationRoutes = router;
const dbService = new DatabaseService_1.DatabaseService();
const aiService = new AIService_1.AIService();
router.post('/message', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { message, conversationId, emotionalContext } = req.body;
    if (!message || !conversationId) {
        throw new errorHandler_1.AppError('Message and conversation ID are required', 400);
    }
    try {
        const userMessage = {
            conversationId,
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        await dbService.saveConversationMessage(userMessage);
        const aiResponse = await aiService.generateConversationResponse({
            message,
            emotionalContext: emotionalContext || {}
        });
        const assistantMessage = {
            conversationId,
            role: 'assistant',
            content: aiResponse.response,
            emotionalContext: JSON.stringify({
                emotionalTone: aiResponse.emotionalTone,
                supportLevel: aiResponse.supportLevel,
                suggestedActions: aiResponse.suggestedActions
            }),
            timestamp: new Date()
        };
        await dbService.saveConversationMessage(assistantMessage);
        logger_1.logger.info(`Conversation response generated for: ${conversationId}`);
        res.json({
            success: true,
            data: {
                response: aiResponse.response,
                suggestedActions: aiResponse.suggestedActions || [],
                emotionalTone: aiResponse.emotionalTone || 'neutral',
                supportLevel: aiResponse.supportLevel || 'medium',
                timestamp: assistantMessage.timestamp
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing conversation message:', error);
        throw new errorHandler_1.AppError('Failed to process conversation message', 500);
    }
}));
router.get('/history/:conversationId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;
    if (!conversationId) {
        throw new errorHandler_1.AppError('Conversation ID is required', 400);
    }
    try {
        const messages = await dbService.getConversationHistory(conversationId, Number(limit));
        res.json({
            success: true,
            data: messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                emotionalContext: msg.emotionalContext ? JSON.parse(msg.emotionalContext) : null,
                timestamp: msg.timestamp
            }))
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting conversation history:', error);
        throw new errorHandler_1.AppError('Failed to get conversation history', 500);
    }
}));
router.get('/insights/:conversationId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { conversationId } = req.params;
    if (!conversationId) {
        throw new errorHandler_1.AppError('Conversation ID is required', 400);
    }
    try {
        const messages = await dbService.getConversationHistory(conversationId);
        if (messages.length === 0) {
            res.json({
                success: true,
                data: {
                    totalMessages: 0,
                    userMessages: 0,
                    assistantMessages: 0,
                    averageSentiment: 'neutral',
                    topics: [],
                    timeSpan: 0
                }
            });
            return;
        }
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        const timeSpan = (firstMessage && lastMessage)
            ? lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()
            : 0;
        const sentiments = assistantMessages
            .map(m => {
            try {
                const context = m.emotionalContext ? JSON.parse(m.emotionalContext) : {};
                return context.emotionalTone || 'neutral';
            }
            catch {
                return 'neutral';
            }
        })
            .filter(Boolean);
        const sentimentCounts = sentiments.reduce((acc, sentiment) => {
            acc[sentiment] = (acc[sentiment] || 0) + 1;
            return acc;
        }, {});
        const averageSentiment = Object.keys(sentimentCounts).reduce((a, b) => sentimentCounts[a] > sentimentCounts[b] ? a : b, 'neutral');
        const topics = userMessages
            .map(m => m.content.toLowerCase())
            .join(' ')
            .split(/\s+/)
            .filter(word => word.length > 4)
            .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        const topTopics = Object.entries(topics)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
        res.json({
            success: true,
            data: {
                totalMessages: messages.length,
                userMessages: userMessages.length,
                assistantMessages: assistantMessages.length,
                averageSentiment,
                topics: topTopics,
                timeSpan: Math.floor(timeSpan / 1000),
                sentimentDistribution: sentimentCounts
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting conversation insights:', error);
        throw new errorHandler_1.AppError('Failed to get conversation insights', 500);
    }
}));
router.delete('/:conversationId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { conversationId } = req.params;
    if (!conversationId) {
        throw new errorHandler_1.AppError('Conversation ID is required', 400);
    }
    try {
        throw new errorHandler_1.AppError('Delete functionality not yet implemented', 501);
    }
    catch (error) {
        logger_1.logger.error('Error deleting conversation:', error);
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        throw new errorHandler_1.AppError('Failed to delete conversation', 500);
    }
}));
//# sourceMappingURL=conversation.js.map