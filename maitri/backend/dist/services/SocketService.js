"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const logger_1 = require("@/utils/logger");
class SocketService {
    constructor(io, aiService) {
        this.io = io;
        this.aiService = aiService;
    }
    setupHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Client connected: ${socket.id}`);
            socket.on('emotion-data', async (data) => {
                try {
                    const result = await this.aiService.detectEmotion(data);
                    socket.emit('emotion-result', result);
                    socket.to(data.sessionId).emit('emotion-update', result);
                }
                catch (error) {
                    logger_1.logger.error('Error processing emotion data:', error);
                    socket.emit('error', { message: 'Failed to process emotion data' });
                }
            });
            socket.on('conversation-message', async (data) => {
                try {
                    const response = await this.aiService.generateConversationResponse(data);
                    socket.emit('conversation-response', response);
                }
                catch (error) {
                    logger_1.logger.error('Error generating conversation response:', error);
                    socket.emit('error', { message: 'Failed to generate response' });
                }
            });
            socket.on('join-session', (sessionId) => {
                socket.join(sessionId);
                logger_1.logger.info(`Client ${socket.id} joined session ${sessionId}`);
            });
            socket.on('leave-session', (sessionId) => {
                socket.leave(sessionId);
                logger_1.logger.info(`Client ${socket.id} left session ${sessionId}`);
            });
            socket.on('disconnect', () => {
                logger_1.logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=SocketService.js.map