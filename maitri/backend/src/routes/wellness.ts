import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const aiService = new AIService();

// Get current wellness score for a session
router.get('/score/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  try {
    // Get the most recent wellness scores
    const wellnessScores = await dbService.getWellnessScores(sessionId, 5);
    
    if (wellnessScores.length === 0) {
      throw new AppError('No wellness data found for this session', 404);
    }

    const currentScore = wellnessScores[0]!; // We know this exists due to length check
    
    // Calculate trends if we have multiple scores
    let trends = null;
    if (wellnessScores.length > 1) {
      const previousScore = wellnessScores[1]!; // We know this exists due to length check
      const change = currentScore.overall - previousScore.overall;
      
      trends = {
        trend: change > 0.1 ? 'improving' : change < -0.1 ? 'declining' : 'stable',
        recentScore: currentScore.overall,
        previousScore: previousScore.overall,
        change: Number(change.toFixed(2))
      };
    }

    // Generate recommendations based on scores
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
  } catch (error) {
    logger.error('Error getting wellness score:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get wellness score', 500);
  }
}));

// Get wellness score history for a session
router.get('/history/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { limit = 100 } = req.query;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
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
  } catch (error) {
    logger.error('Error getting wellness history:', error);
    throw new AppError('Failed to get wellness history', 500);
  }
}));

// Calculate wellness score from emotion history
router.post('/calculate/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  try {
    // Get recent emotion data
    const emotionHistory = await dbService.getEmotionData(sessionId, 20);
    
    if (emotionHistory.length === 0) {
      throw new AppError('No emotion data found for wellness calculation', 404);
    }

    // Calculate wellness score using AI service
    const wellnessScore = await aiService.calculateWellnessScore(
      emotionHistory.map(e => ({
        emotion: e.emotion,
        confidence: e.confidence,
        timestamp: e.timestamp
      })),
      sessionId
    );

    // Save the calculated wellness score
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

    logger.info(`Wellness score calculated for session ${sessionId}: ${wellnessScore.overall}`);

    res.json({
      success: true,
      data: {
        ...wellnessScore,
        timestamp: wellnessRecord.timestamp
      }
    });
  } catch (error) {
    logger.error('Error calculating wellness score:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to calculate wellness score', 500);
  }
}));

// Helper function to generate recommendations
function generateRecommendations(score: any): string[] {
  const recommendations: string[] = [];

  if (score.overall >= 0.8) {
    recommendations.push("Keep doing what makes you happy!");
    recommendations.push("Maintain your current positive activities");
  } else if (score.overall >= 0.6) {
    recommendations.push("You're doing well! Consider some relaxation exercises");
    recommendations.push("Try to maintain a regular sleep schedule");
  } else if (score.overall >= 0.4) {
    recommendations.push("Take some time for self-care activities");
    recommendations.push("Consider talking to someone you trust");
  } else {
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

export { router as wellnessRoutes };