export interface EmotionData {
    id?: number;
    sessionId: string;
    emotion: string;
    confidence: number;
    source: 'video' | 'audio' | 'multimodal';
    timestamp: Date;
    facialLandmarks?: string | undefined;
    audioFeatures?: string | undefined;
}
export interface WellnessScore {
    id?: number;
    sessionId: string;
    overall: number;
    emotional: number;
    physical: number;
    stress: number;
    energy: number;
    timestamp: Date;
}
export interface ConversationMessage {
    id?: number;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    emotionalContext?: string;
    timestamp: Date;
}
export interface Session {
    id?: number;
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime?: Date | undefined;
    averageWellness?: number;
    totalInteractions?: number;
    status: 'active' | 'completed' | 'interrupted';
}
export declare class DatabaseService {
    private db;
    initialize(): Promise<void>;
    private createTables;
    private run;
    private get;
    private all;
    createSession(session: Omit<Session, 'id'>): Promise<Session>;
    updateSession(sessionId: string, updates: Partial<Session>): Promise<Session>;
    getSession(sessionId: string): Promise<Session | null>;
    saveEmotionData(emotion: Omit<EmotionData, 'id'>): Promise<number>;
    getEmotionData(sessionId: string, limit?: number): Promise<EmotionData[]>;
    saveWellnessScore(score: Omit<WellnessScore, 'id'>): Promise<number>;
    getWellnessScores(sessionId: string, limit?: number): Promise<WellnessScore[]>;
    saveConversationMessage(message: Omit<ConversationMessage, 'id'>, sessionId?: string): Promise<number>;
    getConversationHistory(conversationId: string, limit?: number): Promise<ConversationMessage[]>;
    getSessionsByUser(userId: string, limit?: number, offset?: number): Promise<Session[]>;
    getActiveSessions(): Promise<Session[]>;
    getEmotionDataBySession(sessionId: string): Promise<EmotionData[]>;
    getWellnessDataBySession(sessionId: string): Promise<WellnessScore[]>;
    getConversationsBySession(sessionId: string): Promise<ConversationMessage[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=DatabaseService.d.ts.map