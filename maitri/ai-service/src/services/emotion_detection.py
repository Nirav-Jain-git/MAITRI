import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
from torch.nn import functional as F
from typing import List, Dict, Any, Optional, Tuple
import base64
from PIL import Image
import io
from loguru import logger
import asyncio
from datetime import datetime

from ..models.schemas import (
    EmotionDetectionResponse,
    FacialLandmarks,
    EmotionClassification,
    ModelStatus
)

class EmotionCNN(nn.Module):
    """Lightweight CNN for emotion classification from facial features"""
    
    def __init__(self, num_classes=7):
        super(EmotionCNN, self).__init__()
        
        # Feature extraction layers
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        
        # Classifier layers
        self.fc1 = nn.Linear(128 * 6 * 6, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, num_classes)
        
    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        
        x = x.view(-1, 128 * 6 * 6)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        
        return F.softmax(x, dim=1)

class MultimodalFusionNet(nn.Module):
    """Multimodal fusion network for combining visual and audio features"""
    
    def __init__(self, visual_dim=512, audio_dim=128, num_classes=7):
        super(MultimodalFusionNet, self).__init__()
        
        # Feature processing
        self.visual_encoder = nn.Linear(visual_dim, 256)
        self.audio_encoder = nn.Linear(audio_dim, 256)
        
        # Fusion layers
        self.fusion_layer = nn.Linear(512, 256)
        self.classifier = nn.Linear(256, num_classes)
        
        self.dropout = nn.Dropout(0.3)
        
    def forward(self, visual_features, audio_features):
        # Encode features
        visual_encoded = F.relu(self.visual_encoder(visual_features))
        audio_encoded = F.relu(self.audio_encoder(audio_features))
        
        # Concatenate features
        fused_features = torch.cat([visual_encoded, audio_encoded], dim=1)
        
        # Final classification
        fused = F.relu(self.fusion_layer(fused_features))
        fused = self.dropout(fused)
        output = self.classifier(fused)
        
        return F.softmax(output, dim=1)

class EmotionDetectionService:
    """Service for emotion detection from visual and multimodal input"""
    
    EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # MediaPipe components
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Models
        self.emotion_model: Optional[EmotionCNN] = None
        self.multimodal_model: Optional[MultimodalFusionNet] = None
        
        # MediaPipe processors
        self.face_detection = None
        self.face_mesh = None
        
        self.model_status = {
            "emotion_cnn": ModelStatus(
                model_name="emotion_cnn",
                status="not_loaded",
                version="1.0.0",
                last_updated=datetime.now()
            ),
            "multimodal_fusion": ModelStatus(
                model_name="multimodal_fusion", 
                status="not_loaded",
                version="1.0.0",
                last_updated=datetime.now()
            )
        }
    
    async def initialize(self):
        """Initialize all models and components"""
        try:
            logger.info("Initializing emotion detection service...")
            
            # Initialize MediaPipe
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=0, min_detection_confidence=0.5
            )
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            
            # Load or initialize emotion models
            await self._load_emotion_model()
            await self._load_multimodal_model()
            
            logger.info("Emotion detection service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize emotion detection service: {e}")
            raise
    
    async def _load_emotion_model(self):
        """Load or create emotion classification model"""
        try:
            self.emotion_model = EmotionCNN(num_classes=len(self.EMOTIONS))
            
            # Try to load pre-trained weights
            model_path = "models/emotion_cnn.pth"
            if torch.cuda.is_available():
                try:
                    self.emotion_model.load_state_dict(torch.load(model_path))
                    logger.info("Loaded pre-trained emotion model")
                except FileNotFoundError:
                    logger.warning("Pre-trained emotion model not found, using randomly initialized weights")
            else:
                try:
                    self.emotion_model.load_state_dict(torch.load(model_path, map_location='cpu'))
                    logger.info("Loaded pre-trained emotion model (CPU)")
                except FileNotFoundError:
                    logger.warning("Pre-trained emotion model not found, using randomly initialized weights")
            
            self.emotion_model.to(self.device)
            self.emotion_model.eval()
            
            self.model_status["emotion_cnn"].status = "loaded"
            self.model_status["emotion_cnn"].last_updated = datetime.now()
            
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            self.model_status["emotion_cnn"].status = "error"
            raise
    
    async def _load_multimodal_model(self):
        """Load or create multimodal fusion model"""
        try:
            self.multimodal_model = MultimodalFusionNet(num_classes=len(self.EMOTIONS))
            
            # Try to load pre-trained weights
            model_path = "models/multimodal_fusion.pth"
            try:
                if torch.cuda.is_available():
                    self.multimodal_model.load_state_dict(torch.load(model_path))
                else:
                    self.multimodal_model.load_state_dict(torch.load(model_path, map_location='cpu'))
                logger.info("Loaded pre-trained multimodal model")
            except FileNotFoundError:
                logger.warning("Pre-trained multimodal model not found, using randomly initialized weights")
            
            self.multimodal_model.to(self.device)
            self.multimodal_model.eval()
            
            self.model_status["multimodal_fusion"].status = "loaded"
            self.model_status["multimodal_fusion"].last_updated = datetime.now()
            
        except Exception as e:
            logger.error(f"Failed to load multimodal model: {e}")
            self.model_status["multimodal_fusion"].status = "error"
            raise
    
    def _decode_base64_image(self, image_data: str) -> np.ndarray:
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            return np.array(image)
            
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            raise ValueError("Invalid image data")
    
    def _extract_facial_landmarks(self, image: np.ndarray) -> Optional[FacialLandmarks]:
        """Extract facial landmarks using MediaPipe"""
        try:
            # Convert BGR to RGB if necessary
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image
            
            results = self.face_mesh.process(rgb_image)
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0]
                
                # Extract landmark coordinates
                h, w = image.shape[:2]
                landmark_points = []
                visibility_scores = []
                
                for landmark in landmarks.landmark:
                    x = landmark.x * w
                    y = landmark.y * h
                    landmark_points.append([x, y])
                    visibility_scores.append(landmark.visibility if hasattr(landmark, 'visibility') else 1.0)
                
                # Calculate bounding box
                x_coords = [p[0] for p in landmark_points]
                y_coords = [p[1] for p in landmark_points]
                
                bbox = {
                    'x': min(x_coords),
                    'y': min(y_coords),
                    'width': max(x_coords) - min(x_coords),
                    'height': max(y_coords) - min(y_coords)
                }
                
                return FacialLandmarks(
                    landmarks=landmark_points,
                    visibility=visibility_scores,
                    bounding_box=bbox
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to extract facial landmarks: {e}")
            return None
    
    def _preprocess_face_for_emotion(self, image: np.ndarray, landmarks: FacialLandmarks) -> torch.Tensor:
        """Preprocess face region for emotion classification"""
        try:
            # Extract face region using bounding box
            bbox = landmarks.bounding_box
            x, y = int(bbox['x']), int(bbox['y'])
            w, h = int(bbox['width']), int(bbox['height'])
            
            # Add padding
            padding = 20
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image.shape[1] - x, w + 2 * padding)
            h = min(image.shape[0] - y, h + 2 * padding)
            
            # Crop face region
            face_region = image[y:y+h, x:x+w]
            
            # Resize to model input size
            face_resized = cv2.resize(face_region, (48, 48))
            
            # Convert to grayscale
            if len(face_resized.shape) == 3:
                face_gray = cv2.cvtColor(face_resized, cv2.COLOR_RGB2GRAY)
            else:
                face_gray = face_resized
            
            # Normalize
            face_normalized = face_gray.astype(np.float32) / 255.0
            
            # Convert to tensor
            face_tensor = torch.from_numpy(face_normalized).unsqueeze(0).unsqueeze(0)  # [1, 1, 48, 48]
            
            return face_tensor.to(self.device)
            
        except Exception as e:
            logger.error(f"Failed to preprocess face: {e}")
            raise
    
    async def _classify_emotion(self, face_tensor: torch.Tensor) -> EmotionClassification:
        """Classify emotion from preprocessed face tensor"""
        try:
            with torch.no_grad():
                predictions = self.emotion_model(face_tensor)
                probabilities = predictions.cpu().numpy()[0]
                
                # Get emotion with highest probability
                emotion_idx = np.argmax(probabilities)
                emotion = self.EMOTIONS[emotion_idx]
                confidence = float(probabilities[emotion_idx])
                
                # Create probability dictionary
                emotion_probs = {
                    self.EMOTIONS[i]: float(probabilities[i])
                    for i in range(len(self.EMOTIONS))
                }
                
                return EmotionClassification(
                    emotion=emotion,
                    confidence=confidence,
                    probabilities=emotion_probs
                )
                
        except Exception as e:
            logger.error(f"Failed to classify emotion: {e}")
            raise
    
    async def detect_emotion(
        self,
        image_data: Optional[str] = None,
        audio_data: Optional[str] = None,
        session_id: str = ""
    ) -> EmotionDetectionResponse:
        """Detect emotion from image data"""
        
        if not image_data:
            raise ValueError("Image data is required for emotion detection")
        
        try:
            # Decode image
            image = self._decode_base64_image(image_data)
            
            # Extract facial landmarks
            landmarks = self._extract_facial_landmarks(image)
            if not landmarks:
                return EmotionDetectionResponse(
                    emotion="neutral",
                    confidence=0.5,
                    source="video",
                    facial_landmarks=None,
                    audio_features=None
                )
            
            # Preprocess face for emotion classification
            face_tensor = self._preprocess_face_for_emotion(image, landmarks)
            
            # Classify emotion
            emotion_result = await self._classify_emotion(face_tensor)
            
            return EmotionDetectionResponse(
                emotion=emotion_result.emotion,
                confidence=emotion_result.confidence,
                source="video",
                facial_landmarks=landmarks.landmarks,
                audio_features=None
            )
            
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}")
            raise
    
    async def detect_multimodal_emotion(
        self,
        image_data: str,
        audio_data: str,
        session_id: str
    ) -> EmotionDetectionResponse:
        """Detect emotion using multimodal fusion"""
        
        try:
            # Process visual features
            image = self._decode_base64_image(image_data)
            landmarks = self._extract_facial_landmarks(image)
            
            if not landmarks:
                # Fallback to audio-only detection
                return EmotionDetectionResponse(
                    emotion="neutral",
                    confidence=0.5,
                    source="audio",
                    facial_landmarks=None,
                    audio_features=None
                )
            
            # Extract visual features (simplified - would use proper feature extraction)
            visual_features = torch.randn(1, 512).to(self.device)  # Placeholder
            audio_features = torch.randn(1, 128).to(self.device)   # Placeholder
            
            # Classify using multimodal model
            with torch.no_grad():
                predictions = self.multimodal_model(visual_features, audio_features)
                probabilities = predictions.cpu().numpy()[0]
                
                emotion_idx = np.argmax(probabilities)
                emotion = self.EMOTIONS[emotion_idx]
                confidence = float(probabilities[emotion_idx])
            
            return EmotionDetectionResponse(
                emotion=emotion,
                confidence=confidence,
                source="multimodal",
                facial_landmarks=landmarks.landmarks,
                audio_features=None
            )
            
        except Exception as e:
            logger.error(f"Multimodal emotion detection failed: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        return {
            "status": "ready" if self.emotion_model and self.multimodal_model else "not_ready",
            "models_loaded": {
                "emotion_cnn": self.emotion_model is not None,
                "multimodal_fusion": self.multimodal_model is not None,
                "mediapipe": self.face_detection is not None and self.face_mesh is not None
            },
            "device": str(self.device)
        }
    
    def get_model_status(self) -> Dict[str, ModelStatus]:
        """Get status of all models"""
        return self.model_status
    
    async def reload_models(self):
        """Reload all models"""
        await self._load_emotion_model()
        await self._load_multimodal_model()