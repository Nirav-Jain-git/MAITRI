// Data Transfer Objects for API responses

export interface SessionDTO {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  averageWellness?: number;
  totalInteractions?: number;
  status: 'active' | 'completed' | 'interrupted';
}

export interface EmotionDataDTO {
  id?: number;
  sessionId: string;
  emotion: string;
  confidence: number;
  source: 'video' | 'audio' | 'multimodal';
  timestamp: string;
  facialLandmarks?: number[][];
  audioFeatures?: {
    mfccs: number[];
    pitch: number;
    energy: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
  };
}

export interface WellnessScoreDTO {
  id?: number;
  sessionId: string;
  overall: number;
  emotional: number;
  physical: number;
  stress: number;
  energy: number;
  timestamp: string;
  trends?: {
    trend: 'improving' | 'stable' | 'declining';
    recentScore: number;
    previousScore: number;
    change: number;
  };
  recommendations?: string[];
}

export interface ConversationMessageDTO {
  id?: number;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  emotionalContext?: {
    emotionalTone?: string;
    supportLevel?: 'low' | 'medium' | 'high';
    suggestedActions?: string[];
  };
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'warning' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    ai: 'ok' | 'error';
  };
  version: string;
  uptime: number;
}

export interface DetailedHealthStatus extends HealthStatus {
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
    uptime: number;
  };
}

// Request DTOs
export interface StartSessionRequest {
  userId: string;
}

export interface EmotionDetectionRequest {
  sessionId: string;
  imageData?: string;
  audioData?: string;
}

export interface ConversationMessageRequest {
  message: string;
  conversationId: string;
  emotionalContext?: {
    currentEmotion?: string;
    wellnessScore?: number;
    recentEmotions?: string[];
  };
}

// Error DTOs
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// Validation schemas (for future use with validation middleware)
export const SessionValidation = {
  start: {
    userId: { required: true, type: 'string', minLength: 1 }
  }
};

export const EmotionValidation = {
  detect: {
    sessionId: { required: true, type: 'string', minLength: 1 },
    imageData: { required: false, type: 'string' },
    audioData: { required: false, type: 'string' }
  }
};

export const ConversationValidation = {
  message: {
    message: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
    conversationId: { required: true, type: 'string', minLength: 1 }
  }
};