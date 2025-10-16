# MAITRI - AI Wellness Assistant 🧘‍♀️

> **Local-First AI Wellness Assistant** - Real-time emotion detection, adaptive conversations, and wellness monitoring that runs entirely offline.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)

## 🌟 Features

- **🎭 Real-time Emotion Detection** - Facial expression and voice analysis using MediaPipe and PyTorch
- **💬 Adaptive Conversation Engine** - Context-aware supportive dialogue system
- **📊 Wellness Scoring** - Multi-dimensional health metrics tracking
- **🔒 Privacy-First** - Runs completely offline, no data leaves your device
- **⚡ Real-time Processing** - WebSocket-based live monitoring
- **🐳 Easy Deployment** - One-command Docker setup
- **📱 Responsive UI** - Modern React interface with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Service    │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (SQLite)      │
                    └─────────────────┘
```

### Tech Stack

**Frontend:**
- React 18.2.0 with TypeScript
- Vite 4.4.5 (build tool)
- Tailwind CSS 3.3.3
- MediaPipe (real-time video processing)
- Socket.IO (WebSocket communication)
- Zustand (state management)

**Backend:**
- Node.js 18+ with Express 4.18.2
- SQLite3 5.1.6 (local database)
- Socket.IO 4.7.2 (real-time communication)
- Winston (logging)

**AI Service:**
- Python 3.11
- FastAPI 0.104.1
- PyTorch 2.1.0 (neural networks)
- MediaPipe 0.10.7 (facial analysis)
- librosa 0.10.1 (audio processing)
- OpenCV 4.8.1 (computer vision)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Volume persistence

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (Recommended)
  - [Download Docker Desktop](https://docker.com/products/docker-desktop)
- **OR Local Development:**
  - Node.js 18+ ([Download](https://nodejs.org))
  - Python 3.11+ ([Download](https://python.org))
  - npm or yarn

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd maitri

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000

### Option 2: Local Development

#### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

#### 2. AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage Guide

### Starting a Wellness Session

1. **Launch the Application**
   - Open your browser to http://localhost:3000
   - Allow camera and microphone permissions when prompted

2. **Begin Monitoring**
   - Click "Start Session" to begin wellness monitoring
   - The system will analyze your facial expressions and voice in real-time
   - View your wellness score and emotion trends on the dashboard

3. **Interactive Chat**
   - Use the chat interface to have supportive conversations
   - The AI adapts responses based on your current emotional state
   - Receive personalized wellness recommendations

### Key Features Explained

#### 🎭 Emotion Detection
- **Facial Analysis**: Uses MediaPipe to detect 7 basic emotions
- **Voice Analysis**: Processes audio features (MFCCs, pitch, energy)
- **Real-time Updates**: Continuous monitoring via webcam/microphone

#### 📊 Wellness Scoring
- **Overall Score**: Composite wellness metric (0-1 scale)
- **Sub-scores**: Emotional, physical, stress, and energy levels
- **Trend Analysis**: Historical progression and recommendations

#### 💬 Conversation Engine
- **Context-Aware**: Responses adapt to current emotional state
- **Supportive**: Designed for mental health and wellness support
- **Personalized**: Learns from your interaction patterns

## 🛠️ Development

### Project Structure

```
maitri/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── models/          # Database models
│   │   └── middleware/      # Express middleware
│   └── package.json
├── ai-service/              # Python AI microservice
│   ├── services/            # AI processing services
│   │   ├── emotion_detection.py
│   │   ├── audio_processing.py
│   │   ├── conversation_engine.py
│   │   ├── tts_service.py
│   │   └── wellness_calculator.py
│   ├── models/              # Pre-trained AI models
│   └── requirements.txt
├── docs/                    # Documentation
│   └── API.md              # API documentation
├── docker-compose.yml       # Container orchestration
└── README.md               # This file
```

### Local Development Commands

#### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
```

#### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

#### AI Service
```bash
cd ai-service
python app.py        # Start development server
pytest tests/        # Run tests
pylint services/     # Lint code
```

### Environment Variables

Create `.env` files in each service directory:

**backend/.env**
```env
NODE_ENV=development
PORT=5000
DB_PATH=./data/database.sqlite
LOG_LEVEL=info
AI_SERVICE_URL=http://localhost:8000
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**ai-service/.env**
```env
ENVIRONMENT=development
PORT=8000
LOG_LEVEL=info
MODEL_PATH=./models
```

## 🔧 Configuration

### Model Configuration

MAITRI uses several AI models that can be configured:

#### Emotion Detection Models
- **Facial**: Pre-trained CNN for facial expression recognition
- **Audio**: MLP classifier for voice emotion detection
- **Fusion**: Ensemble approach for multimodal emotion detection

#### Conversation Engine
- **Response Generation**: Rule-based system with emotion-aware templates
- **Context Maintenance**: Session-based conversation memory
- **Wellness Integration**: Responses influenced by wellness scores

### Performance Tuning

#### CPU Optimization
```python
# ai-service/config.py
PYTORCH_CPU_ONLY = True
MEDIAFACE_CPU_THREADS = 4
AUDIO_BUFFER_SIZE = 1024
```

#### Memory Management
```javascript
// backend/config.js
DB_POOL_SIZE = 10
SOCKET_MAX_CONNECTIONS = 100
LOG_ROTATION_SIZE = '10m'
```

## 📊 API Documentation

Complete API documentation is available at [docs/API.md](docs/API.md).

### Key Endpoints

- **Health**: `GET /api/health` - Service status
- **Sessions**: `POST /api/session/start` - Start monitoring
- **Emotions**: `POST /api/emotion/detect` - Process emotion data
- **Wellness**: `GET /api/wellness/score/:sessionId` - Get wellness metrics
- **Chat**: `POST /api/conversation/message` - Send chat message

### WebSocket Events

- **emotion-data** - Real-time emotion submission
- **emotion-result** - Emotion detection results
- **conversation-message** - Chat message exchange
- **wellness-update** - Wellness score updates

## 🐳 Docker Details

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React web interface |
| Backend | 5000 | API server and WebSocket |
| AI Service | 8000 | Machine learning processing |

### Docker Commands

```bash
# Build specific service
docker compose build frontend

# View service logs
docker compose logs -f backend

# Execute commands in container
docker compose exec backend npm run test

# Scale services
docker compose up --scale ai-service=2

# Remove all containers and volumes
docker compose down -v
```

### Data Persistence

Data is persisted using Docker volumes:
- **Database**: `maitri_db_data` (SQLite database)
- **Models**: `maitri_models` (AI model files)
- **Logs**: `maitri_logs` (Application logs)

## 🔒 Privacy & Security

### Data Privacy
- **Local Processing**: All AI inference happens on your device
- **No External Calls**: No data transmitted to external services
- **Temporary Storage**: Session data can be cleared at any time
- **User Control**: Complete control over data retention

### Security Features
- **Input Validation**: All API endpoints validate input data
- **Error Handling**: Sanitized error responses
- **CORS Protection**: Configured for local development
- **Rate Limiting**: Built-in protection against abuse

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI service tests
cd ai-service
pytest

# Integration tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Test Coverage

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API and service interaction testing
- **E2E Tests**: Full application workflow testing

## 🐛 Troubleshooting

### Common Issues

#### Camera/Microphone Access
```
Error: getUserMedia() not supported or permission denied
```
**Solution**: Ensure HTTPS or localhost, grant browser permissions

#### Docker Build Failures
```
Error: failed to solve: process "/bin/sh -c pip install -r requirements.txt" did not complete successfully
```
**Solution**: Check internet connection, try `docker compose build --no-cache`

#### AI Service Not Responding
```
Error: AI service unavailable
```
**Solution**: Check AI service logs, ensure Python dependencies installed

### Performance Issues

#### High CPU Usage
- Reduce video frame rate in MediaPipe configuration
- Lower audio sampling rate
- Disable unused AI features

#### Memory Leaks
- Monitor Docker container memory usage
- Restart services periodically in production
- Check for unclosed database connections

### Debug Mode

Enable debug logging:

```bash
# Backend
LOG_LEVEL=debug npm run dev

# AI Service
LOG_LEVEL=DEBUG python app.py

# Frontend (browser console)
localStorage.setItem('debug', 'maitri:*')
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Setup

```bash
# Install pre-commit hooks
npm install -g pre-commit
pre-commit install

# Run linting
npm run lint:all

# Run tests before committing
npm run test:all
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MediaPipe Team** - For excellent real-time ML frameworks
- **PyTorch Community** - For powerful deep learning tools
- **React Team** - For the amazing frontend framework
- **Open Source Community** - For countless helpful libraries

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/username/maitri/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/maitri/discussions)

---

<div align="center">
  <p><strong>Built with ❤️ for mental health and wellness</strong></p>
  <p><em>MAITRI - Your Personal AI Wellness Companion</em></p>
</div>