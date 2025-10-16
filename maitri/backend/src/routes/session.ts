import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();

// Start a new session
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    throw new AppError('User ID is required', 400);
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

    logger.info(`Session started: ${sessionId} for user: ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        userId: session.userId,
        startTime: session.startTime,
        status: session.status
      }
    });
  } catch (error) {
    logger.error('Error starting session:', error);
    throw new AppError('Failed to start session', 500);
  }
}));

// End a session
router.post('/end/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  try {
    const session = await dbService.getSession(sessionId);
    
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'active') {
      throw new AppError('Session is not active', 400);
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 1000);

    // Get session statistics
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

    logger.info(`Session ended: ${sessionId}, duration: ${duration}s`);

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
  } catch (error) {
    logger.error('Error ending session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to end session', 500);
  }
}));

// Get session details
router.get('/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  try {
    const session = await dbService.getSession(sessionId);
    
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get session', 500);
  }
}));

// Get user sessions
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  try {
    const sessions = await dbService.getSessionsByUser(
      userId, 
      Number(limit), 
      Number(offset)
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    throw new AppError('Failed to get user sessions', 500);
  }
}));

// Get active sessions
router.get('/active/all', asyncHandler(async (req: Request, res: Response) => {
  try {
    const activeSessions = await dbService.getActiveSessions();

    res.json({
      success: true,
      data: activeSessions
    });
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    throw new AppError('Failed to get active sessions', 500);
  }
}));

export { router as sessionRoutes };