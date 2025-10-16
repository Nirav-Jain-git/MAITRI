import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { DatabaseService } from './services/DatabaseService';
import { SocketService } from './services/SocketService';
import { AIService } from './services/AIService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

// Import routes
import { healthRoutes } from './routes/health';
import { emotionRoutes } from './routes/emotion';
import { wellnessRoutes } from './routes/wellness';
import { conversationRoutes } from './routes/conversation';
import { sessionRoutes } from './routes/session';

class App {
  private app: express.Application;
  private server: any;
  private io: Server;
  private databaseService: DatabaseService;
  private socketService: SocketService;
  private aiService: AIService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.frontend.url,
        methods: ['GET', 'POST'],
      },
    });

    this.databaseService = new DatabaseService();
    this.aiService = new AIService();
    this.socketService = new SocketService(this.io, this.aiService);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.frontend.url,
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for production
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/emotion', emotionRoutes);
    this.app.use('/api/wellness', wellnessRoutes);
    this.app.use('/api/conversation', conversationRoutes);
    this.app.use('/api/session', sessionRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await this.databaseService.initialize();
      logger.info('Database initialized successfully');

      // Initialize AI service
      await this.aiService.initialize();
      logger.info('AI service initialized successfully');

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        logger.info(`Environment: ${config.env}`);
      });

      // Setup socket handlers
      this.socketService.setupHandlers();
      logger.info('Socket.IO service initialized');

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.databaseService.close();
      this.server.close();
      logger.info('Server stopped gracefully');
    } catch (error) {
      logger.error('Error stopping server:', error);
      throw error;
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

if (require.main === module) {
  app.start();
}

export default app;