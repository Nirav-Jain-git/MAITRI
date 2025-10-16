from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request models
class EmotionDetectionRequest(BaseModel):
    image_data: Optional[str] = Field(None, description="Base64 encoded image data")
    audio_data: Optional[str] = Field(None, description="Base64 encoded audio data")
    session_id: str = Field(..., description="Session identifier")

class ConversationRequest(BaseModel):
    message: str = Field(..., description="User message")
    emotional_context: Optional[Dict[str, Any]] = Field(None, description="Current emotional context")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous conversation history")

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    emotion: Optional[str] = Field("neutral", description="Emotional tone")
    speed: Optional[float] = Field(1.0, description="Speech speed multiplier")
    pitch: Optional[float] = Field(1.0, description="Pitch multiplier")

class WellnessRequest(BaseModel):
    emotion_history: List[Dict[str, Any]] = Field(..., description="Historical emotion data")
    session_id: str = Field(..., description="Session identifier")

# Response models
class EmotionDetectionResponse(BaseModel):
    emotion: str = Field(..., description="Detected emotion")
    confidence: float = Field(..., description="Confidence score (0-1)")
    source: str = Field(..., description="Detection source: video, audio, or multimodal")
    facial_landmarks: Optional[List[List[float]]] = Field(None, description="Facial landmark coordinates")
    audio_features: Optional[Dict[str, Any]] = Field(None, description="Extracted audio features")
    wellness_score: Optional[Dict[str, float]] = Field(None, description="Calculated wellness metrics")
    timestamp: datetime = Field(default_factory=datetime.now, description="Detection timestamp")

class ConversationResponse(BaseModel):
    response: str = Field(..., description="Generated response")
    suggested_actions: Optional[List[str]] = Field(None, description="Suggested wellness actions")
    emotional_tone: str = Field(..., description="Emotional tone of response")
    support_level: str = Field(..., description="Level of support: low, medium, high")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

class TTSResponse(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio data")
    duration: float = Field(..., description="Audio duration in seconds")
    sample_rate: int = Field(default=22050, description="Audio sample rate")
    format: str = Field(default="wav", description="Audio format")

class WellnessResponse(BaseModel):
    overall: float = Field(..., description="Overall wellness score (0-1)")
    emotional: float = Field(..., description="Emotional wellness score (0-1)")
    physical: float = Field(..., description="Physical wellness score (0-1)")
    stress: float = Field(..., description="Stress level (0-1, higher is more stressed)")
    energy: float = Field(..., description="Energy level (0-1)")
    trends: Optional[Dict[str, Any]] = Field(None, description="Wellness trends over time")
    recommendations: Optional[List[str]] = Field(None, description="Wellness recommendations")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status")
    services: Dict[str, bool] = Field(..., description="Individual service status")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")

# Internal data models
class AudioFeatures(BaseModel):
    mfccs: List[float] = Field(..., description="Mel-frequency cepstral coefficients")
    pitch: float = Field(..., description="Fundamental frequency")
    energy: float = Field(..., description="Signal energy")
    spectral_centroid: float = Field(..., description="Spectral centroid")
    zero_crossing_rate: float = Field(..., description="Zero crossing rate")
    spectral_rolloff: float = Field(..., description="Spectral rolloff")
    chroma: List[float] = Field(..., description="Chroma features")

class FacialLandmarks(BaseModel):
    landmarks: List[List[float]] = Field(..., description="2D facial landmark coordinates")
    visibility: List[float] = Field(..., description="Landmark visibility scores")
    bounding_box: Dict[str, float] = Field(..., description="Face bounding box")

class EmotionClassification(BaseModel):
    emotion: str = Field(..., description="Detected emotion class")
    confidence: float = Field(..., description="Classification confidence")
    probabilities: Dict[str, float] = Field(..., description="All emotion probabilities")

class ConversationContext(BaseModel):
    user_id: str = Field(..., description="User identifier")
    session_id: str = Field(..., description="Session identifier")
    conversation_id: str = Field(..., description="Conversation identifier")
    emotional_state: str = Field(..., description="Current emotional state")
    wellness_score: float = Field(..., description="Current wellness score")
    interaction_count: int = Field(default=0, description="Number of interactions")
    last_topics: List[str] = Field(default_factory=list, description="Recent conversation topics")
    support_level: str = Field(default="medium", description="Required support level")

class ModelStatus(BaseModel):
    model_name: str = Field(..., description="Model identifier")
    status: str = Field(..., description="Model status: loaded, loading, error")
    version: str = Field(..., description="Model version")
    last_updated: datetime = Field(..., description="Last update timestamp")
    memory_usage: Optional[float] = Field(None, description="Memory usage in MB")
    inference_time: Optional[float] = Field(None, description="Average inference time in ms")