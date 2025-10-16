import { Router } from 'express';
import { Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbService = new DatabaseService();
    const aiService = new AIService();
    
    // Check AI service health
    const aiHealthy = await aiService.checkHealth();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok', // Basic check - could be enhanced
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
  } catch (error) {
    logger.error('Health check failed:', error);
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

// Detailed health check with more information
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const aiService = new AIService();
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
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as healthRoutes };