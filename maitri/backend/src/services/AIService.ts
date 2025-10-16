import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface EmotionDetectionRequest {
  imageData?: string; // Base64 encoded image
  audioData?: string; // Base64 encoded audio
  sessionId: string;
}

export interface EmotionDetectionResponse {
  emotion: string;
  confidence: number;
  source: 'video' | 'audio' | 'multimodal';
  facialLandmarks?: number[][];
  audioFeatures?: {
    mfccs: number[];
    pitch: number;
    energy: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
  };
  wellnessScore?: {
    overall: number;
    emotional: number;
    physical: number;
    stress: number;
    energy: number;
  };
}

export interface ConversationRequest {
  message: string;
  emotionalContext?: {
    currentEmotion: string;
    wellnessScore: number;
    recentEmotions: string[];
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ConversationResponse {
  response: string;
  suggestedActions?: string[];
  emotionalTone: string;
  supportLevel: 'low' | 'medium' | 'high';
}

export interface TTSRequest {
  text: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioData: string; // Base64 encoded audio
  duration: number;
}

export class AIService {
  private client: AxiosInstance;
  private isHealthy: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: config.ai.serviceUrl,
      timeout: config.ai.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`AI Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('AI Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`AI Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('AI Service Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  public async initialize(): Promise<void> {
    try {
      await this.checkHealth();
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      this.isHealthy = response.status === 200;
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      logger.warn('AI Service health check failed:', error);
      return false;
    }
  }

  public async detectEmotion(request: EmotionDetectionRequest): Promise<EmotionDetectionResponse> {
    try {
      if (!this.isHealthy) {
        throw new Error('AI Service is not healthy');
      }

      const response = await this.client.post('/emotion/detect', request);
      return response.data;
    } catch (error) {
      logger.error('Emotion detection failed:', error);
      throw new Error('Failed to detect emotion');
    }
  }

  public async processMultimodalEmotion(
    imageData: string,
    audioData: string,
    sessionId: string
  ): Promise<EmotionDetectionResponse> {
    try {
      const response = await this.client.post('/emotion/multimodal', {
        imageData,
        audioData,
        sessionId,
      });
      return response.data;
    } catch (error) {
      logger.error('Multimodal emotion processing failed:', error);
      throw new Error('Failed to process multimodal emotion');
    }
  }

  public async generateConversationResponse(request: ConversationRequest): Promise<ConversationResponse> {
    try {
      if (!config.features.enableConversation) {
        throw new Error('Conversation feature is disabled');
      }

      const response = await this.client.post('/conversation/generate', request);
      return response.data;
    } catch (error) {
      logger.error('Conversation generation failed:', error);
      throw new Error('Failed to generate conversation response');
    }
  }

  public async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      if (!config.features.enableTTS) {
        throw new Error('TTS feature is disabled');
      }

      const response = await this.client.post('/tts/synthesize', request);
      return response.data;
    } catch (error) {
      logger.error('Speech synthesis failed:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  public async calculateWellnessScore(
    emotionHistory: Array<{ emotion: string; confidence: number; timestamp: Date }>,
    sessionId: string
  ): Promise<{
    overall: number;
    emotional: number;
    physical: number;
    stress: number;
    energy: number;
  }> {
    try {
      const response = await this.client.post('/wellness/calculate', {
        emotionHistory,
        sessionId,
      });
      return response.data;
    } catch (error) {
      logger.error('Wellness score calculation failed:', error);
      throw new Error('Failed to calculate wellness score');
    }
  }

  public async detectStressLevel(
    emotionHistory: Array<{ emotion: string; confidence: number; timestamp: Date }>,
    audioFeatures?: any
  ): Promise<{
    stressLevel: 'low' | 'medium' | 'high';
    confidence: number;
    indicators: string[];
  }> {
    try {
      const response = await this.client.post('/stress/detect', {
        emotionHistory,
        audioFeatures,
      });
      return response.data;
    } catch (error) {
      logger.error('Stress detection failed:', error);
      throw new Error('Failed to detect stress level');
    }
  }

  public getHealthStatus(): boolean {
    return this.isHealthy;
  }
}