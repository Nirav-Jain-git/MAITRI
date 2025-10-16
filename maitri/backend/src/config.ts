export interface Config {
  env: string;
  port: number;
  frontend: {
    url: string;
  };
  database: {
    path: string;
  };
  ai: {
    serviceUrl: string;
    timeout: number;
  };
  logging: {
    level: string;
    file: string;
  };
  features: {
    enableTTS: boolean;
    enableEmotionDetection: boolean;
    enableConversation: boolean;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  database: {
    path: process.env.DATABASE_PATH || './data/maitri.db',
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
  features: {
    enableTTS: process.env.ENABLE_TTS !== 'false',
    enableEmotionDetection: process.env.ENABLE_EMOTION_DETECTION !== 'false',
    enableConversation: process.env.ENABLE_CONVERSATION !== 'false',
  },
};