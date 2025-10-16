import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const aiService = new AIService();

// Send a message and get AI response
router.post('/message', asyncHandler(async (req: Request, res: Response) => {
  const { message, conversationId, emotionalContext } = req.body;

  if (!message || !conversationId) {
    throw new AppError('Message and conversation ID are required', 400);
  }

  try {
    // Save user message
    const userMessage = {
      conversationId,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    await dbService.saveConversationMessage(userMessage);

    // Get AI response
    const aiResponse = await aiService.generateConversationResponse({
      message,
      emotionalContext: emotionalContext || {}
    });

    // Save AI response
    const assistantMessage = {
      conversationId,
      role: 'assistant' as const,
      content: aiResponse.response,
      emotionalContext: JSON.stringify({
        emotionalTone: aiResponse.emotionalTone,
        supportLevel: aiResponse.supportLevel,
        suggestedActions: aiResponse.suggestedActions
      }),
      timestamp: new Date()
    };

    await dbService.saveConversationMessage(assistantMessage);

    logger.info(`Conversation response generated for: ${conversationId}`);

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
  } catch (error) {
    logger.error('Error processing conversation message:', error);
    throw new AppError('Failed to process conversation message', 500);
  }
}));

// Get conversation history
router.get('/history/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { limit = 50 } = req.query;

  if (!conversationId) {
    throw new AppError('Conversation ID is required', 400);
  }

  try {
    const messages = await dbService.getConversationHistory(
      conversationId,
      Number(limit)
    );

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
  } catch (error) {
    logger.error('Error getting conversation history:', error);
    throw new AppError('Failed to get conversation history', 500);
  }
}));

// Get conversation summary/insights
router.get('/insights/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    throw new AppError('Conversation ID is required', 400);
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

    // Basic sentiment analysis from emotional context
    const sentiments = assistantMessages
      .map(m => {
        try {
          const context = m.emotionalContext ? JSON.parse(m.emotionalContext) : {};
          return context.emotionalTone || 'neutral';
        } catch {
          return 'neutral';
        }
      })
      .filter(Boolean);

    const sentimentCounts = sentiments.reduce((acc: any, sentiment: string) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    const averageSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
      sentimentCounts[a] > sentimentCounts[b] ? a : b, 'neutral'
    );

    // Extract basic topics from user messages (simple keyword extraction)
    const topics = userMessages
      .map(m => m.content.toLowerCase())
      .join(' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .reduce((acc: any, word: string) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    const topTopics = Object.entries(topics)
      .sort(([,a]: any, [,b]: any) => b - a)
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
        timeSpan: Math.floor(timeSpan / 1000), // in seconds
        sentimentDistribution: sentimentCounts
      }
    });
  } catch (error) {
    logger.error('Error getting conversation insights:', error);
    throw new AppError('Failed to get conversation insights', 500);
  }
}));

// Delete conversation
router.delete('/:conversationId', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    throw new AppError('Conversation ID is required', 400);
  }

  try {
    // Note: We'll implement this when we add delete functionality to DatabaseService
    throw new AppError('Delete functionality not yet implemented', 501);
  } catch (error) {
    logger.error('Error deleting conversation:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete conversation', 500);
  }
}));

export { router as conversationRoutes };