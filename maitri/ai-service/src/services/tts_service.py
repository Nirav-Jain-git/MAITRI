import os
import base64
import io
import subprocess
from typing import Optional, Dict, Any
from loguru import logger
from datetime import datetime
import tempfile

from ..models.schemas import TTSResponse, ModelStatus

class TTSService:
    """Text-to-Speech service using local TTS engines"""
    
    def __init__(self):
        self.model_status = ModelStatus(
            model_name="tts_service",
            status="not_loaded",
            version="1.0.0",
            last_updated=datetime.now()
        )
        
        # Available TTS engines
        self.available_engines = []
        self.default_engine = "espeak"  # Fallback to espeak
    
    async def initialize(self):
        """Initialize TTS service"""
        try:
            logger.info("Initializing TTS service...")
            
            # Check available TTS engines
            self._check_available_engines()
            
            if not self.available_engines:
                logger.warning("No TTS engines available")
                self.model_status.status = "error"
                return
            
            self.model_status.status = "loaded"
            self.model_status.last_updated = datetime.now()
            
            logger.info(f"TTS service initialized with engines: {self.available_engines}")
            
        except Exception as e:
            logger.error(f"Failed to initialize TTS service: {e}")
            self.model_status.status = "error"
            raise
    
    def _check_available_engines(self):
        """Check which TTS engines are available"""
        
        # Check for espeak
        try:
            subprocess.run(["espeak", "--version"], capture_output=True, check=True)
            self.available_engines.append("espeak")
            logger.info("eSpeak TTS engine available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("eSpeak not available")
        
        # Check for festival (if available)
        try:
            subprocess.run(["festival", "--version"], capture_output=True, check=True)
            self.available_engines.append("festival")
            logger.info("Festival TTS engine available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("Festival not available")
        
        # Fallback: create simple TTS using Python libraries
        if not self.available_engines:
            self.available_engines.append("simple")
            logger.info("Using simple TTS fallback")
    
    async def synthesize(
        self,
        text: str,
        emotion: Optional[str] = "neutral",
        speed: Optional[float] = 1.0,
        pitch: Optional[float] = 1.0
    ) -> TTSResponse:
        """Synthesize speech from text"""
        
        try:
            if not self.available_engines:
                raise Exception("No TTS engines available")
            
            # Use the best available engine
            engine = self.available_engines[0] if self.available_engines else "simple"
            
            if engine == "espeak":
                audio_data = await self._synthesize_espeak(text, speed, pitch)
            elif engine == "festival":
                audio_data = await self._synthesize_festival(text, speed, pitch)
            else:
                audio_data = await self._synthesize_simple(text)
            
            return TTSResponse(
                audio_data=audio_data,
                duration=len(text) * 0.1,  # Rough estimation
                sample_rate=22050,
                format="wav"
            )
            
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            raise
    
    async def _synthesize_espeak(self, text: str, speed: float, pitch: float) -> str:
        """Synthesize using eSpeak"""
        try:
            # Create temporary file for output
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Adjust parameters for eSpeak
            speed_param = int(speed * 175)  # eSpeak speed (words per minute)
            pitch_param = int(pitch * 50)   # eSpeak pitch
            
            # Run eSpeak
            cmd = [
                "espeak",
                "-s", str(speed_param),
                "-p", str(pitch_param),
                "-w", temp_path,
                text
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Read and encode audio file
            with open(temp_path, "rb") as audio_file:
                audio_bytes = audio_file.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return audio_base64
            
        except Exception as e:
            logger.error(f"eSpeak synthesis failed: {e}")
            raise
    
    async def _synthesize_festival(self, text: str, speed: float, pitch: float) -> str:
        """Synthesize using Festival"""
        try:
            # Create temporary file for output
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Create Festival script
            festival_script = f'''
                (set! text "{text}")
                (utt.save.wave (utt.synth (eval (list 'Utterance 'Text text))) "{temp_path}")
            '''
            
            # Run Festival
            process = subprocess.Popen(
                ["festival"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=festival_script)
            
            if process.returncode != 0:
                raise Exception(f"Festival failed: {stderr}")
            
            # Read and encode audio file
            with open(temp_path, "rb") as audio_file:
                audio_bytes = audio_file.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Clean up
            os.unlink(temp_path)
            
            return audio_base64
            
        except Exception as e:
            logger.error(f"Festival synthesis failed: {e}")
            raise
    
    async def _synthesize_simple(self, text: str) -> str:
        """Simple TTS fallback (returns empty audio)"""
        logger.warning("Using simple TTS fallback - no actual audio generated")
        
        # Create a simple silent audio file
        # This is a placeholder - in a real implementation, you might use 
        # pyttsx3 or gTTS with offline capabilities
        
        silent_audio = b'\x00' * 1024  # 1KB of silence
        return base64.b64encode(silent_audio).decode('utf-8')
    
    def _adjust_emotion_parameters(self, emotion: str) -> Dict[str, float]:
        """Adjust TTS parameters based on emotion"""
        
        emotion_params = {
            "happy": {"speed": 1.1, "pitch": 1.2},
            "sad": {"speed": 0.8, "pitch": 0.8},
            "angry": {"speed": 1.2, "pitch": 1.1},
            "fear": {"speed": 1.1, "pitch": 1.3},
            "neutral": {"speed": 1.0, "pitch": 1.0},
            "surprise": {"speed": 1.2, "pitch": 1.4},
            "disgust": {"speed": 0.9, "pitch": 0.9}
        }
        
        return emotion_params.get(emotion, emotion_params["neutral"])
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        return {
            "status": "ready" if self.available_engines else "not_ready",
            "available_engines": self.available_engines,
            "default_engine": self.default_engine
        }
    
    def get_model_status(self) -> ModelStatus:
        """Get model status"""
        return self.model_status