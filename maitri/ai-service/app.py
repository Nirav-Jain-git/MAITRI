from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from loguru import logger
import asyncio
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

from src.services.emotion_detection import EmotionDetectionService
from src.services.audio_processing import AudioProcessingService
from src.services.conversation_engine import ConversationEngine
from src.services.tts_service import TTSService
from src.services.wellness_calculator import WellnessCalculator
from src.models.schemas import (
    EmotionDetectionRequest,
    EmotionDetectionResponse,
    ConversationRequest,
    ConversationResponse,
    TTSRequest,
    TTSResponse,
    WellnessRequest,
    WellnessResponse,
    HealthResponse
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="MAITRI AI Service",
    description="Local AI microservice for emotion detection, conversation, and wellness analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
emotion_service: Optional[EmotionDetectionService] = None
audio_service: Optional[AudioProcessingService] = None
conversation_service: Optional[ConversationEngine] = None
tts_service: Optional[TTSService] = None
wellness_service: Optional[WellnessCalculator] = None

@app.on_event("startup")
async def startup_event():
    """Initialize all AI services on startup"""
    global emotion_service, audio_service, conversation_service, tts_service, wellness_service
    
    try:
        logger.info("Initializing AI services...")
        
        # Initialize services
        emotion_service = EmotionDetectionService()
        await emotion_service.initialize()
        logger.info("✓ Emotion detection service initialized")
        
        audio_service = AudioProcessingService()
        await audio_service.initialize()
        logger.info("✓ Audio processing service initialized")
        
        conversation_service = ConversationEngine()
        await conversation_service.initialize()
        logger.info("✓ Conversation engine initialized")
        
        tts_service = TTSService()
        await tts_service.initialize()
        logger.info("✓ TTS service initialized")
        
        wellness_service = WellnessCalculator()
        logger.info("✓ Wellness calculator initialized")
        
        logger.info("All AI services initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize AI services: {e}")
        raise e

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI services...")

# Health check endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check"""
    return HealthResponse(
        status="healthy",
        services={
            "emotion_detection": emotion_service is not None,
            "audio_processing": audio_service is not None,
            "conversation": conversation_service is not None,
            "tts": tts_service is not None,
            "wellness": wellness_service is not None,
        },
        version="1.0.0"
    )

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with service status"""
    services_status = {}
    
    if emotion_service:
        services_status["emotion_detection"] = await emotion_service.health_check()
    if audio_service:
        services_status["audio_processing"] = await audio_service.health_check()
    if conversation_service:
        services_status["conversation"] = await conversation_service.health_check()
    if tts_service:
        services_status["tts"] = await tts_service.health_check()
    if wellness_service:
        services_status["wellness"] = wellness_service.health_check()
    
    return {
        "status": "healthy",
        "services": services_status,
        "models_loaded": len([s for s in services_status.values() if s.get("status") == "ready"]),
        "version": "1.0.0"
    }

# Emotion detection endpoints
@app.post("/emotion/detect", response_model=EmotionDetectionResponse)
async def detect_emotion(request: EmotionDetectionRequest):
    """Detect emotion from image or audio data"""
    if not emotion_service:
        raise HTTPException(status_code=503, detail="Emotion detection service not available")
    
    try:
        result = await emotion_service.detect_emotion(
            image_data=request.image_data,
            audio_data=request.audio_data,
            session_id=request.session_id
        )
        return result
    except Exception as e:
        logger.error(f"Emotion detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {str(e)}")

@app.post("/emotion/multimodal", response_model=EmotionDetectionResponse)
async def detect_multimodal_emotion(request: EmotionDetectionRequest):
    """Detect emotion using multimodal fusion (video + audio)"""
    if not emotion_service or not audio_service:
        raise HTTPException(status_code=503, detail="Required services not available")
    
    try:
        result = await emotion_service.detect_multimodal_emotion(
            image_data=request.image_data,
            audio_data=request.audio_data,
            session_id=request.session_id
        )
        return result
    except Exception as e:
        logger.error(f"Multimodal emotion detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Multimodal detection failed: {str(e)}")

# Conversation endpoints
@app.post("/conversation/generate", response_model=ConversationResponse)
async def generate_conversation_response(request: ConversationRequest):
    """Generate contextual conversation response"""
    if not conversation_service:
        raise HTTPException(status_code=503, detail="Conversation service not available")
    
    try:
        response = await conversation_service.generate_response(
            message=request.message,
            emotional_context=request.emotional_context,
            conversation_history=request.conversation_history
        )
        return response
    except Exception as e:
        logger.error(f"Conversation generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Conversation generation failed: {str(e)}")

# TTS endpoints
@app.post("/tts/synthesize", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest):
    """Synthesize speech from text"""
    if not tts_service:
        raise HTTPException(status_code=503, detail="TTS service not available")
    
    try:
        result = await tts_service.synthesize(
            text=request.text,
            emotion=request.emotion,
            speed=request.speed,
            pitch=request.pitch
        )
        return result
    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

# Wellness endpoints
@app.post("/wellness/calculate", response_model=WellnessResponse)
async def calculate_wellness_score(request: WellnessRequest):
    """Calculate wellness score from emotion history"""
    if not wellness_service:
        raise HTTPException(status_code=503, detail="Wellness service not available")
    
    try:
        result = wellness_service.calculate_wellness_score(
            emotion_history=request.emotion_history,
            session_id=request.session_id
        )
        return result
    except Exception as e:
        logger.error(f"Wellness calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Wellness calculation failed: {str(e)}")

@app.post("/stress/detect")
async def detect_stress_level(request: Dict[str, Any]):
    """Detect stress level from emotion and audio data"""
    if not wellness_service:
        raise HTTPException(status_code=503, detail="Wellness service not available")
    
    try:
        result = wellness_service.detect_stress_level(
            emotion_history=request.get("emotion_history", []),
            audio_features=request.get("audio_features")
        )
        return result
    except Exception as e:
        logger.error(f"Stress detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Stress detection failed: {str(e)}")

# Model management endpoints
@app.post("/models/reload")
async def reload_models():
    """Reload all AI models"""
    try:
        if emotion_service:
            await emotion_service.reload_models()
        if audio_service:
            await audio_service.reload_models()
        if conversation_service:
            await conversation_service.reload_models()
        
        return {"status": "success", "message": "Models reloaded successfully"}
    except Exception as e:
        logger.error(f"Model reload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model reload failed: {str(e)}")

@app.get("/models/status")
async def get_models_status():
    """Get status of all loaded models"""
    status = {}
    
    if emotion_service:
        status["emotion"] = emotion_service.get_model_status()
    if audio_service:
        status["audio"] = audio_service.get_model_status()
    if conversation_service:
        status["conversation"] = conversation_service.get_model_status()
    if tts_service:
        status["tts"] = tts_service.get_model_status()
    
    return {"models": status}

if __name__ == "__main__":
    # Configure logging
    logger.add("logs/ai_service.log", rotation="1 day", retention="30 days")
    
    # Run the server
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level="info",
        reload=os.getenv("ENVIRONMENT") == "development"
    )