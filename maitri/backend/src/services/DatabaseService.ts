import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface EmotionData {
  id?: number;
  sessionId: string;
  emotion: string;
  confidence: number;
  source: 'video' | 'audio' | 'multimodal';
  timestamp: Date;
  facialLandmarks?: string | undefined; // JSON string
  audioFeatures?: string | undefined;   // JSON string
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
  emotionalContext?: string; // JSON string
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

export class DatabaseService {
  private db: sqlite3.Database | null = null;

  public async initialize(): Promise<void> {
    try {
      this.db = new sqlite3.Database(config.database.path);
      
      // Enable WAL mode for better concurrency
      await this.run('PRAGMA journal_mode=WAL');
      await this.run('PRAGMA synchronous=NORMAL');
      await this.run('PRAGMA cache_size=1000');
      await this.run('PRAGMA temp_store=MEMORY');

      await this.createTables();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const tables = [
      `
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT UNIQUE NOT NULL,
          user_id TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          average_wellness REAL,
          total_interactions INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS emotions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          emotion TEXT NOT NULL,
          confidence REAL NOT NULL,
          source TEXT NOT NULL,
          facial_landmarks TEXT,
          audio_features TEXT,
          timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions (session_id)
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS wellness_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          overall_score REAL NOT NULL,
          emotional_score REAL NOT NULL,
          physical_score REAL NOT NULL,
          stress_score REAL NOT NULL,
          energy_score REAL NOT NULL,
          timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions (session_id)
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          emotional_context TEXT,
          timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions (session_id)
        )
      `,
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status)',
      'CREATE INDEX IF NOT EXISTS idx_emotions_session_id ON emotions (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_emotions_timestamp ON emotions (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_wellness_session_id ON wellness_scores (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_wellness_timestamp ON wellness_scores (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations (timestamp)',
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  private run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  private get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  private all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Session operations
  public async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const result = await this.run(
      `INSERT INTO sessions (session_id, user_id, start_time, status)
       VALUES (?, ?, ?, ?)`,
      [session.sessionId, session.userId, session.startTime.toISOString(), session.status]
    );
    
    return {
      id: result.id,
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
      status: session.status
    };
  }

  public async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.endTime) {
      fields.push('end_time = ?');
      values.push(updates.endTime.toISOString());
    }
    if (updates.averageWellness !== undefined) {
      fields.push('average_wellness = ?');
      values.push(updates.averageWellness);
    }
    if (updates.totalInteractions !== undefined) {
      fields.push('total_interactions = ?');
      values.push(updates.totalInteractions);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(sessionId);

      await this.run(
        `UPDATE sessions SET ${fields.join(', ')} WHERE session_id = ?`,
        values
      );
    }

    // Return the updated session
    const updatedSession = await this.getSession(sessionId);
    if (!updatedSession) {
      throw new Error('Session not found after update');
    }
    return updatedSession;
  }

  public async getSession(sessionId: string): Promise<Session | null> {
    const row = await this.get(
      'SELECT * FROM sessions WHERE session_id = ?',
      [sessionId]
    );

    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      averageWellness: row.average_wellness,
      totalInteractions: row.total_interactions,
      status: row.status,
    };
  }

  // Emotion operations
  public async saveEmotionData(emotion: Omit<EmotionData, 'id'>): Promise<number> {
    const result = await this.run(
      `INSERT INTO emotions (session_id, emotion, confidence, source, facial_landmarks, audio_features, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        emotion.sessionId,
        emotion.emotion,
        emotion.confidence,
        emotion.source,
        emotion.facialLandmarks || null,
        emotion.audioFeatures || null,
        emotion.timestamp.toISOString(),
      ]
    );
    return result.id;
  }

  public async getEmotionData(sessionId: string, limit: number = 100): Promise<EmotionData[]> {
    const rows = await this.all(
      `SELECT * FROM emotions WHERE session_id = ? 
       ORDER BY timestamp DESC LIMIT ?`,
      [sessionId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      emotion: row.emotion,
      confidence: row.confidence,
      source: row.source,
      facialLandmarks: row.facial_landmarks,
      audioFeatures: row.audio_features,
      timestamp: new Date(row.timestamp),
    }));
  }

  // Wellness operations
  public async saveWellnessScore(score: Omit<WellnessScore, 'id'>): Promise<number> {
    const result = await this.run(
      `INSERT INTO wellness_scores (session_id, overall_score, emotional_score, physical_score, stress_score, energy_score, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        score.sessionId,
        score.overall,
        score.emotional,
        score.physical,
        score.stress,
        score.energy,
        score.timestamp.toISOString(),
      ]
    );
    return result.id;
  }

  public async getWellnessScores(sessionId: string, limit: number = 100): Promise<WellnessScore[]> {
    const rows = await this.all(
      `SELECT * FROM wellness_scores WHERE session_id = ? 
       ORDER BY timestamp DESC LIMIT ?`,
      [sessionId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      overall: row.overall_score,
      emotional: row.emotional_score,
      physical: row.physical_score,
      stress: row.stress_score,
      energy: row.energy_score,
      timestamp: new Date(row.timestamp),
    }));
  }

  // Conversation operations
  public async saveConversationMessage(message: Omit<ConversationMessage, 'id'>, sessionId?: string): Promise<number> {
    const result = await this.run(
      `INSERT INTO conversations (conversation_id, session_id, role, content, emotional_context, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        message.conversationId,
        sessionId || message.conversationId, // Use sessionId if provided, otherwise conversationId
        message.role,
        message.content,
        message.emotionalContext || null,
        message.timestamp.toISOString(),
      ]
    );
    return result.id;
  }

  public async getConversationHistory(conversationId: string, limit: number = 50): Promise<ConversationMessage[]> {
    const rows = await this.all(
      `SELECT * FROM conversations WHERE conversation_id = ? 
       ORDER BY timestamp ASC LIMIT ?`,
      [conversationId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      emotionalContext: row.emotional_context,
      timestamp: new Date(row.timestamp),
    }));
  }

  // Additional session methods
  public async getSessionsByUser(userId: string, limit: number = 10, offset: number = 0): Promise<Session[]> {
    const rows = await this.all(
      `SELECT * FROM sessions WHERE user_id = ? 
       ORDER BY start_time DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      averageWellness: row.average_wellness,
      totalInteractions: row.total_interactions,
      status: row.status,
    }));
  }

  public async getActiveSessions(): Promise<Session[]> {
    const rows = await this.all(
      `SELECT * FROM sessions WHERE status = 'active' 
       ORDER BY start_time DESC`
    );

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      averageWellness: row.average_wellness,
      totalInteractions: row.total_interactions,
      status: row.status,
    }));
  }

  public async getEmotionDataBySession(sessionId: string): Promise<EmotionData[]> {
    return this.getEmotionData(sessionId);
  }

  public async getWellnessDataBySession(sessionId: string): Promise<WellnessScore[]> {
    return this.getWellnessScores(sessionId);
  }

  public async getConversationsBySession(sessionId: string): Promise<ConversationMessage[]> {
    const rows = await this.all(
      `SELECT * FROM conversations WHERE session_id = ? 
       ORDER BY timestamp ASC`,
      [sessionId]
    );

    return rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      emotionalContext: row.emotional_context,
      timestamp: new Date(row.timestamp),
    }));
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  }
}