"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
const config_1 = require("@/config");
class AIService {
    constructor() {
        this.isHealthy = false;
        this.client = axios_1.default.create({
            baseURL: config_1.config.ai.serviceUrl,
            timeout: config_1.config.ai.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug(`AI Service Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            logger_1.logger.error('AI Service Request Error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug(`AI Service Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            logger_1.logger.error('AI Service Response Error:', error.response?.status, error.message);
            return Promise.reject(error);
        });
    }
    async initialize() {
        try {
            await this.checkHealth();
            logger_1.logger.info('AI Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize AI Service:', error);
            throw error;
        }
    }
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            this.isHealthy = response.status === 200;
            return this.isHealthy;
        }
        catch (error) {
            this.isHealthy = false;
            logger_1.logger.warn('AI Service health check failed:', error);
            return false;
        }
    }
    async detectEmotion(request) {
        try {
            if (!this.isHealthy) {
                throw new Error('AI Service is not healthy');
            }
            const response = await this.client.post('/emotion/detect', request);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Emotion detection failed:', error);
            throw new Error('Failed to detect emotion');
        }
    }
    async processMultimodalEmotion(imageData, audioData, sessionId) {
        try {
            const response = await this.client.post('/emotion/multimodal', {
                imageData,
                audioData,
                sessionId,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Multimodal emotion processing failed:', error);
            throw new Error('Failed to process multimodal emotion');
        }
    }
    async generateConversationResponse(request) {
        try {
            if (!config_1.config.features.enableConversation) {
                throw new Error('Conversation feature is disabled');
            }
            const response = await this.client.post('/conversation/generate', request);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Conversation generation failed:', error);
            throw new Error('Failed to generate conversation response');
        }
    }
    async synthesizeSpeech(request) {
        try {
            if (!config_1.config.features.enableTTS) {
                throw new Error('TTS feature is disabled');
            }
            const response = await this.client.post('/tts/synthesize', request);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Speech synthesis failed:', error);
            throw new Error('Failed to synthesize speech');
        }
    }
    async calculateWellnessScore(emotionHistory, sessionId) {
        try {
            const response = await this.client.post('/wellness/calculate', {
                emotionHistory,
                sessionId,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Wellness score calculation failed:', error);
            throw new Error('Failed to calculate wellness score');
        }
    }
    async detectStressLevel(emotionHistory, audioFeatures) {
        try {
            const response = await this.client.post('/stress/detect', {
                emotionHistory,
                audioFeatures,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Stress detection failed:', error);
            throw new Error('Failed to detect stress level');
        }
    }
    getHealthStatus() {
        return this.isHealthy;
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map