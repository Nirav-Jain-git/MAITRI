# MAITRI API Documentation

## Overview

MAITRI is a local-first AI wellness assistant that provides real-time emotion detection, wellness monitoring, and supportive conversations. This documentation covers all API endpoints for the MAITRI backend service.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, MAITRI operates in local mode without authentication. All endpoints are publicly accessible on the local network.

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

## Health Endpoints

### GET /health
Check the basic health status of the API.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "services": {
      "database": "ok",
      "ai": "ok"
    },
    "version": "1.0.0",
    "uptime": 3600
  }
}
```

### GET /health/detailed
Get detailed health information including system metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "services": {
      "database": {
        "status": "ok",
        "type": "sqlite3"
      },
      "ai": {
        "status": "ok",
        "features": {
          "emotionDetection": true,
          "conversation": true,
          "tts": true
        }
      }
    },
    "system": {
      "nodeVersion": "v18.0.0",
      "platform": "linux",
      "memory": {
        "rss": 50331648,
        "heapTotal": 20971520,
        "heapUsed": 15728640
      },
      "uptime": 3600
    }
  }
}
```

## Session Endpoints

### POST /session/start
Start a new wellness monitoring session.

**Request Body:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1704110400000",
    "userId": "user_123",
    "startTime": "2024-01-01T12:00:00.000Z",
    "status": "active"
  }
}
```

### POST /session/end/:sessionId
End an active session.

**Parameters:**
- `sessionId` (string): The session identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1704110400000",
    "endTime": "2024-01-01T12:30:00.000Z",
    "duration": 1800,
    "averageWellness": 0.75,
    "totalInteractions": 5
  }
}
```

### GET /session/:sessionId
Get session details and summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1704110400000",
    "userId": "user_123",
    "startTime": "2024-01-01T12:00:00.000Z",
    "endTime": "2024-01-01T12:30:00.000Z",
    "status": "completed",
    "averageWellness": 0.75,
    "totalInteractions": 5
  }
}
```

## Emotion Detection Endpoints

### POST /emotion/detect
Submit image and/or audio data for emotion detection.

**Request Body:**
```json
{
  "sessionId": "session_1704110400000",
  "imageData": "base64_encoded_image_data",
  "audioData": "base64_encoded_audio_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emotion": "happy",
    "confidence": 0.85,
    "source": "multimodal",
    "facialLandmarks": [[x1, y1], [x2, y2], ...],
    "audioFeatures": {
      "mfccs": [1.2, -0.5, ...],
      "pitch": 220.5,
      "energy": 0.75,
      "spectralCentroid": 1500.2,
      "zeroCrossingRate": 0.15
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /emotion/history/:sessionId
Get emotion history for a session.

**Parameters:**
- `sessionId` (string): The session identifier
- `limit` (query, optional): Maximum number of records (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "emotion": "happy",
      "confidence": 0.85,
      "source": "video",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    {
      "id": 2,
      "emotion": "neutral",
      "confidence": 0.92,
      "source": "audio",
      "timestamp": "2024-01-01T12:01:00.000Z"
    }
  ]
}
```

## Wellness Score Endpoints

### GET /wellness/score/:sessionId
Get current wellness score for a session.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": 0.75,
    "emotional": 0.80,
    "physical": 0.70,
    "stress": 0.25,
    "energy": 0.85,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "trends": {
      "trend": "improving",
      "recentScore": 0.75,
      "previousScore": 0.65,
      "change": 0.10
    },
    "recommendations": [
      "Keep doing what makes you happy!",
      "Maintain your current positive activities"
    ]
  }
}
```

### GET /wellness/history/:sessionId
Get wellness score history for a session.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "overall": 0.75,
      "emotional": 0.80,
      "physical": 0.70,
      "stress": 0.25,
      "energy": 0.85,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## Conversation Endpoints

### POST /conversation/message
Send a message and receive an AI-generated response.

**Request Body:**
```json
{
  "message": "I've been feeling overwhelmed lately",
  "conversationId": "conv_1704110400000",
  "emotionalContext": {
    "currentEmotion": "sad",
    "wellnessScore": 0.45,
    "recentEmotions": ["sad", "neutral", "fear"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "I can see you're going through a difficult time. Remember that it's okay to feel overwhelmed, and I'm here to support you.",
    "suggestedActions": [
      "Practice deep breathing exercises",
      "Take regular breaks to reduce stress",
      "Consider mindfulness meditation"
    ],
    "emotionalTone": "compassionate",
    "supportLevel": "high",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /conversation/history/:conversationId
Get conversation history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "role": "user",
      "content": "I've been feeling overwhelmed lately",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "I can see you're going through a difficult time...",
      "emotionalContext": "{\"supportLevel\":\"high\"}",
      "timestamp": "2024-01-01T12:00:05.000Z"
    }
  ]
}
```

## WebSocket Events

MAITRI uses Socket.IO for real-time communication. Connect to:
```
ws://localhost:5000/socket.io
```

### Client Events (Emit)

#### `join-session`
Join a specific session for real-time updates.
```javascript
socket.emit('join-session', sessionId);
```

#### `emotion-data`
Send real-time emotion data for processing.
```javascript
socket.emit('emotion-data', {
  sessionId: 'session_123',
  imageData: 'base64_image',
  audioData: 'base64_audio'
});
```

#### `conversation-message`
Send a conversation message for real-time response.
```javascript
socket.emit('conversation-message', {
  message: 'How are you?',
  conversationId: 'conv_123',
  emotionalContext: { ... }
});
```

### Server Events (Listen)

#### `emotion-result`
Receive emotion detection results.
```javascript
socket.on('emotion-result', (data) => {
  console.log('Emotion detected:', data.emotion);
});
```

#### `emotion-update`
Receive emotion updates for other session participants.
```javascript
socket.on('emotion-update', (data) => {
  console.log('Session emotion update:', data);
});
```

#### `conversation-response`
Receive AI-generated conversation responses.
```javascript
socket.on('conversation-response', (data) => {
  console.log('AI Response:', data.response);
});
```

#### `error`
Receive error notifications.
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

## Rate Limiting

Currently, no rate limiting is implemented for local development. In production deployment, consider implementing rate limiting for:

- Emotion detection: 60 requests per minute
- Conversation: 30 requests per minute
- Wellness calculations: 120 requests per minute

## Data Models

### EmotionData
```typescript
interface EmotionData {
  id?: number;
  sessionId: string;
  emotion: string;
  confidence: number;
  source: 'video' | 'audio' | 'multimodal';
  timestamp: Date;
  facialLandmarks?: number[][];
  audioFeatures?: AudioFeatures;
}
```

### WellnessScore
```typescript
interface WellnessScore {
  id?: number;
  sessionId: string;
  overall: number;
  emotional: number;
  physical: number;
  stress: number;
  energy: number;
  timestamp: Date;
}
```

### ConversationMessage
```typescript
interface ConversationMessage {
  id?: number;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  emotionalContext?: string;
  timestamp: Date;
}
```

### Session
```typescript
interface Session {
  id?: number;
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  averageWellness?: number;
  totalInteractions?: number;
  status: 'active' | 'completed' | 'interrupted';
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## Development Notes

- All timestamps are in ISO 8601 format
- Base64 image data should include proper data URL prefixes
- Audio data should be in WAV format when possible
- Session IDs are generated using timestamp: `session_${Date.now()}`
- Conversation IDs follow the same pattern: `conv_${Date.now()}`