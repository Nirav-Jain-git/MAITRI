import librosa
import numpy as np
import torch
import torch.nn as nn
from torch.nn import functional as F
from typing import Dict, List, Any, Optional
import base64
import io
import wave
from loguru import logger
from datetime import datetime

from ..models.schemas import AudioFeatures, ModelStatus

class AudioEmotionCNN(nn.Module):
    """CNN for emotion recognition from audio spectrograms"""
    
    def __init__(self, num_classes=7):
        super(AudioEmotionCNN, self).__init__()
        
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        
        self.fc1 = nn.Linear(128 * 16 * 16, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, num_classes)
        
    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        
        return F.softmax(x, dim=1)

class AudioProcessingService:
    """Service for audio processing and emotion detection"""
    
    EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.audio_model: Optional[AudioEmotionCNN] = None
        self.sample_rate = 22050
        
        self.model_status = ModelStatus(
            model_name="audio_emotion_cnn",
            status="not_loaded",
            version="1.0.0",
            last_updated=datetime.now()
        )
    
    async def initialize(self):
        """Initialize audio processing models"""
        try:
            logger.info("Initializing audio processing service...")
            
            self.audio_model = AudioEmotionCNN(num_classes=len(self.EMOTIONS))
            
            # Try to load pre-trained weights
            try:
                model_path = "models/audio_emotion_cnn.pth"
                if torch.cuda.is_available():
                    self.audio_model.load_state_dict(torch.load(model_path))
                else:
                    self.audio_model.load_state_dict(torch.load(model_path, map_location='cpu'))
                logger.info("Loaded pre-trained audio emotion model")
            except FileNotFoundError:
                logger.warning("Pre-trained audio model not found, using randomly initialized weights")
            
            self.audio_model.to(self.device)
            self.audio_model.eval()
            
            self.model_status.status = "loaded"
            self.model_status.last_updated = datetime.now()
            
            logger.info("Audio processing service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize audio processing service: {e}")
            self.model_status.status = "error"
            raise
    
    def _decode_base64_audio(self, audio_data: str) -> np.ndarray:
        """Decode base64 audio data"""
        try:
            # Remove data URL prefix if present
            if audio_data.startswith('data:audio'):
                audio_data = audio_data.split(',')[1]
            
            # Decode base64
            audio_bytes = base64.b64decode(audio_data)
            
            # Load audio using librosa
            audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=self.sample_rate)
            
            return audio
            
        except Exception as e:
            logger.error(f"Failed to decode audio: {e}")
            raise ValueError("Invalid audio data")
    
    def extract_audio_features(self, audio: np.ndarray) -> AudioFeatures:
        """Extract comprehensive audio features"""
        try:
            # MFCC features
            mfccs = librosa.feature.mfcc(y=audio, sr=self.sample_rate, n_mfcc=13)
            mfcc_mean = np.mean(mfccs, axis=1).tolist()
            
            # Pitch (fundamental frequency)
            pitches, magnitudes = librosa.piptrack(y=audio, sr=self.sample_rate)
            pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0.0
            
            # Energy (RMS)
            energy = np.mean(librosa.feature.rms(y=audio)[0])
            
            # Spectral features
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=self.sample_rate)[0])
            zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(audio)[0])
            spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=self.sample_rate)[0])
            
            # Chroma features
            chroma = librosa.feature.chroma_stft(y=audio, sr=self.sample_rate)
            chroma_mean = np.mean(chroma, axis=1).tolist()
            
            return AudioFeatures(
                mfccs=mfcc_mean,
                pitch=float(pitch),
                energy=float(energy),
                spectral_centroid=float(spectral_centroid),
                zero_crossing_rate=float(zero_crossing_rate),
                spectral_rolloff=float(spectral_rolloff),
                chroma=chroma_mean
            )
            
        except Exception as e:
            logger.error(f"Failed to extract audio features: {e}")
            raise
    
    def _create_spectrogram(self, audio: np.ndarray) -> torch.Tensor:
        """Create mel spectrogram for CNN input"""
        try:
            # Create mel spectrogram
            mel_spec = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sample_rate,
                n_mels=128,
                fmax=8000
            )
            
            # Convert to log scale
            log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
            
            # Normalize
            log_mel_spec = (log_mel_spec - np.mean(log_mel_spec)) / np.std(log_mel_spec)
            
            # Resize to fixed size for CNN
            if log_mel_spec.shape[1] > 128:
                log_mel_spec = log_mel_spec[:, :128]
            else:
                # Pad if too short
                pad_width = 128 - log_mel_spec.shape[1]
                log_mel_spec = np.pad(log_mel_spec, ((0, 0), (0, pad_width)), mode='constant')
            
            # Convert to tensor
            spectrogram_tensor = torch.from_numpy(log_mel_spec).float().unsqueeze(0).unsqueeze(0)
            
            return spectrogram_tensor.to(self.device)
            
        except Exception as e:
            logger.error(f"Failed to create spectrogram: {e}")
            raise
    
    async def detect_emotion_from_audio(self, audio_data: str) -> Dict[str, Any]:
        """Detect emotion from audio data"""
        try:
            # Decode audio
            audio = self._decode_base64_audio(audio_data)
            
            # Extract features
            features = self.extract_audio_features(audio)
            
            # Create spectrogram for CNN
            spectrogram = self._create_spectrogram(audio)
            
            # Predict emotion
            with torch.no_grad():
                predictions = self.audio_model(spectrogram)
                probabilities = predictions.cpu().numpy()[0]
                
                emotion_idx = np.argmax(probabilities)
                emotion = self.EMOTIONS[emotion_idx]
                confidence = float(probabilities[emotion_idx])
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "audio_features": features.dict(),
                "probabilities": {
                    self.EMOTIONS[i]: float(probabilities[i])
                    for i in range(len(self.EMOTIONS))
                }
            }
            
        except Exception as e:
            logger.error(f"Audio emotion detection failed: {e}")
            raise
    
    def detect_speech_patterns(self, audio: np.ndarray) -> Dict[str, Any]:
        """Analyze speech patterns for stress and wellness indicators"""
        try:
            # Voice activity detection using energy
            energy_threshold = np.percentile(librosa.feature.rms(y=audio)[0], 30)
            voice_segments = librosa.feature.rms(y=audio)[0] > energy_threshold
            
            # Speaking rate (rough estimation)
            frame_rate = librosa.frames_to_time(1, sr=self.sample_rate)
            speaking_time = np.sum(voice_segments) * frame_rate
            speaking_rate = len(audio) / self.sample_rate / speaking_time if speaking_time > 0 else 0
            
            # Pitch variation (jitter)
            pitches, _ = librosa.piptrack(y=audio, sr=self.sample_rate)
            valid_pitches = pitches[pitches > 0]
            pitch_variation = np.std(valid_pitches) if len(valid_pitches) > 0 else 0
            
            # Energy variation
            energy = librosa.feature.rms(y=audio)[0]
            energy_variation = np.std(energy)
            
            return {
                "speaking_rate": float(speaking_rate),
                "pitch_variation": float(pitch_variation),
                "energy_variation": float(energy_variation),
                "voice_activity_ratio": float(np.mean(voice_segments))
            }
            
        except Exception as e:
            logger.error(f"Failed to analyze speech patterns: {e}")
            return {}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        return {
            "status": "ready" if self.audio_model else "not_ready",
            "model_loaded": self.audio_model is not None,
            "device": str(self.device)
        }
    
    def get_model_status(self) -> ModelStatus:
        """Get model status"""
        return self.model_status
    
    async def reload_models(self):
        """Reload audio models"""
        await self.initialize()