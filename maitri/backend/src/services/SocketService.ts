import { Server } from 'socket.io';
import { AIService } from './AIService';
import { logger } from '../utils/logger';

export class SocketService {
  private io: Server;
  private aiService: AIService;

  constructor(io: Server, aiService: AIService) {
    this.io = io;
    this.aiService = aiService;
  }

  public setupHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle emotion data from client
      socket.on('emotion-data', async (data) => {
        try {
          // Process emotion data with AI service
          const result = await this.aiService.detectEmotion(data);
          
          // Broadcast to client
          socket.emit('emotion-result', result);
          
          // Broadcast to other clients in the same session if needed
          socket.to(data.sessionId).emit('emotion-update', result);
        } catch (error) {
          logger.error('Error processing emotion data:', error);
          socket.emit('error', { message: 'Failed to process emotion data' });
        }
      });

      // Handle conversation messages
      socket.on('conversation-message', async (data) => {
        try {
          const response = await this.aiService.generateConversationResponse(data);
          socket.emit('conversation-response', response);
        } catch (error) {
          logger.error('Error generating conversation response:', error);
          socket.emit('error', { message: 'Failed to generate response' });
        }
      });

      // Handle session events
      socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        logger.info(`Client ${socket.id} joined session ${sessionId}`);
      });

      socket.on('leave-session', (sessionId) => {
        socket.leave(sessionId);
        logger.info(`Client ${socket.id} left session ${sessionId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }
}