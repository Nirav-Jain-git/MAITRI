import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const aiService = new AIService();

// Detect emotion from image and/or audio data
router.post('/detect', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, imageData, audioData } = req.body;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  if (!imageData && !audioData) {
    throw new AppError('Either image data or audio data is required', 400);
  }

  try {
    // Check if session exists
    const session = await dbService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'active') {
      throw new AppError('Session is not active', 400);
    }

    // Process emotion detection through AI service
    const emotionResult = await aiService.detectEmotion({
      sessionId,
      imageData,
      audioData
    });

    // Save emotion data to database
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

    // If wellness score is provided, save it
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

    logger.info(`Emotion detected for session ${sessionId}: ${emotionResult.emotion} (${emotionResult.confidence})`);

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
  } catch (error) {
    logger.error('Error detecting emotion:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to detect emotion', 500);
  }
}));

// Get emotion history for a session
router.get('/history/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { limit = 100 } = req.query;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
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
  } catch (error) {
    logger.error('Error getting emotion history:', error);
    throw new AppError('Failed to get emotion history', 500);
  }
}));

export { router as emotionRoutes };