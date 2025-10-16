// Emotion and wellness types
export interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: Date;
  source: 'video' | 'audio' | 'multimodal';
}

export interface WellnessScore {
  overall: number;
  emotional: number;
  physical: number;
  stress: number;
  energy: number;
  timestamp: Date;
}

export interface FaceDetection {
  landmarks: number[][];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  expressions: {
    [emotion: string]: number;
  };
}

export interface PoseDetection {
  landmarks: number[][];
  visibility: number[];
  posture: string;
  confidence: number;
}

export interface AudioFeatures {
  mfccs: number[];
  pitch: number;
  energy: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
}

export interface ConversationContext {
  id: string;
  userId: string;
  messages: ChatMessage[];
  emotionalState: EmotionData[];
  wellnessHistory: WellnessScore[];
  startTime: Date;
  lastActivity: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotionalContext?: EmotionData;
}

export interface SystemAlert {
  id: string;
  type: 'stress' | 'fatigue' | 'emotional_distress' | 'positive_mood';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface UserPreferences {
  audioEnabled: boolean;
  videoEnabled: boolean;
  alertsEnabled: boolean;
  voiceEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  privacyMode: boolean;
}

export interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  wellnessScores: WellnessScore[];
  emotions: EmotionData[];
  interactions: number;
  averageWellness: number;
}