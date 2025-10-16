export interface EmotionDetectionRequest {
    imageData?: string;
    audioData?: string;
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
    audioData: string;
    duration: number;
}
export declare class AIService {
    private client;
    private isHealthy;
    constructor();
    initialize(): Promise<void>;
    checkHealth(): Promise<boolean>;
    detectEmotion(request: EmotionDetectionRequest): Promise<EmotionDetectionResponse>;
    processMultimodalEmotion(imageData: string, audioData: string, sessionId: string): Promise<EmotionDetectionResponse>;
    generateConversationResponse(request: ConversationRequest): Promise<ConversationResponse>;
    synthesizeSpeech(request: TTSRequest): Promise<TTSResponse>;
    calculateWellnessScore(emotionHistory: Array<{
        emotion: string;
        confidence: number;
        timestamp: Date;
    }>, sessionId: string): Promise<{
        overall: number;
        emotional: number;
        physical: number;
        stress: number;
        energy: number;
    }>;
    detectStressLevel(emotionHistory: Array<{
        emotion: string;
        confidence: number;
        timestamp: Date;
    }>, audioFeatures?: any): Promise<{
        stressLevel: 'low' | 'medium' | 'high';
        confidence: number;
        indicators: string[];
    }>;
    getHealthStatus(): boolean;
}
//# sourceMappingURL=AIService.d.ts.map