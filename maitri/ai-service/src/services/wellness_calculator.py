import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from loguru import logger

from ..models.schemas import WellnessResponse

class WellnessCalculator:
    """Service for calculating wellness scores and detecting stress patterns"""
    
    def __init__(self):
        self.emotion_weights = {
            "happy": 1.0,
            "neutral": 0.6,
            "surprise": 0.7,
            "sad": 0.2,
            "angry": 0.1,
            "fear": 0.1,
            "disgust": 0.2
        }
        
        self.stress_indicators = {
            "high_stress_emotions": ["angry", "fear", "disgust"],
            "low_energy_emotions": ["sad", "neutral"],
            "positive_emotions": ["happy", "surprise"]
        }
    
    def calculate_wellness_score(
        self,
        emotion_history: List[Dict[str, Any]],
        session_id: str,
        time_window: int = 300  # 5 minutes in seconds
    ) -> WellnessResponse:
        """Calculate comprehensive wellness score"""
        
        try:
            if not emotion_history:
                return self._default_wellness_response()
            
            # Filter recent emotions within time window
            recent_emotions = self._filter_recent_emotions(emotion_history, time_window)
            
            if not recent_emotions:
                return self._default_wellness_response()
            
            # Calculate component scores
            emotional_score = self._calculate_emotional_score(recent_emotions)
            physical_score = self._calculate_physical_score(recent_emotions)
            stress_score = self._calculate_stress_score(recent_emotions)
            energy_score = self._calculate_energy_score(recent_emotions)
            
            # Calculate overall score
            overall_score = (
                emotional_score * 0.4 +
                physical_score * 0.2 +
                (1 - stress_score) * 0.3 +
                energy_score * 0.1
            )
            
            # Generate trends and recommendations
            trends = self._analyze_trends(emotion_history)
            recommendations = self._generate_recommendations(
                emotional_score, physical_score, stress_score, energy_score
            )
            
            return WellnessResponse(
                overall=float(np.clip(overall_score, 0, 1)),
                emotional=float(np.clip(emotional_score, 0, 1)),
                physical=float(np.clip(physical_score, 0, 1)),
                stress=float(np.clip(stress_score, 0, 1)),
                energy=float(np.clip(energy_score, 0, 1)),
                trends=trends,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Wellness calculation failed: {e}")
            return self._default_wellness_response()
    
    def _filter_recent_emotions(
        self,
        emotion_history: List[Dict[str, Any]],
        time_window: int
    ) -> List[Dict[str, Any]]:
        """Filter emotions within the specified time window"""
        
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(seconds=time_window)
        
        recent_emotions = []
        for emotion_data in emotion_history:
            try:
                timestamp = emotion_data.get('timestamp')
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                elif isinstance(timestamp, datetime):
                    pass
                else:
                    continue  # Skip invalid timestamps
                
                if timestamp >= cutoff_time:
                    recent_emotions.append(emotion_data)
                    
            except Exception:
                continue  # Skip invalid entries
        
        return recent_emotions
    
    def _calculate_emotional_score(self, emotions: List[Dict[str, Any]]) -> float:
        """Calculate emotional wellness score"""
        
        if not emotions:
            return 0.5
        
        total_score = 0
        total_weight = 0
        
        for emotion_data in emotions:
            emotion = emotion_data.get('emotion', 'neutral')
            confidence = emotion_data.get('confidence', 0.5)
            
            emotion_weight = self.emotion_weights.get(emotion, 0.5)
            weighted_score = emotion_weight * confidence
            
            total_score += weighted_score
            total_weight += confidence
        
        return total_score / total_weight if total_weight > 0 else 0.5
    
    def _calculate_physical_score(self, emotions: List[Dict[str, Any]]) -> float:
        """Calculate physical wellness score based on facial and audio indicators"""
        
        # This is a simplified calculation - in a real implementation,
        # you would analyze facial expressions, posture, and voice characteristics
        
        physical_indicators = []
        
        for emotion_data in emotions:
            # Analyze facial landmarks if available
            facial_landmarks = emotion_data.get('facial_landmarks')
            if facial_landmarks:
                # Simplified: check for signs of fatigue or tension
                # In reality, you'd analyze eye openness, mouth position, etc.
                physical_indicators.append(0.7)  # Placeholder
            
            # Analyze audio features if available
            audio_features = emotion_data.get('audio_features')
            if audio_features:
                # Check voice energy and clarity
                energy = audio_features.get('energy', 0.5)
                physical_indicators.append(min(energy * 2, 1.0))
        
        if not physical_indicators:
            return 0.6  # Default assumption
        
        return np.mean(physical_indicators)
    
    def _calculate_stress_score(self, emotions: List[Dict[str, Any]]) -> float:
        """Calculate stress level (0 = no stress, 1 = high stress)"""
        
        if not emotions:
            return 0.3
        
        stress_indicators = []
        
        for emotion_data in emotions:
            emotion = emotion_data.get('emotion', 'neutral')
            confidence = emotion_data.get('confidence', 0.5)
            
            if emotion in self.stress_indicators["high_stress_emotions"]:
                stress_indicators.append(confidence)
            elif emotion in self.stress_indicators["positive_emotions"]:
                stress_indicators.append(0.1)
            else:
                stress_indicators.append(0.3)
        
        return np.mean(stress_indicators)
    
    def _calculate_energy_score(self, emotions: List[Dict[str, Any]]) -> float:
        """Calculate energy level"""
        
        if not emotions:
            return 0.5
        
        energy_indicators = []
        
        for emotion_data in emotions:
            emotion = emotion_data.get('emotion', 'neutral')
            confidence = emotion_data.get('confidence', 0.5)
            
            # Audio features can indicate energy level
            audio_features = emotion_data.get('audio_features')
            if audio_features:
                audio_energy = audio_features.get('energy', 0.5)
                energy_indicators.append(audio_energy)
            
            # Emotion-based energy estimation
            if emotion in ["happy", "surprise", "angry"]:
                energy_indicators.append(0.8)
            elif emotion in ["sad", "fear"]:
                energy_indicators.append(0.3)
            else:
                energy_indicators.append(0.5)
        
        return np.mean(energy_indicators) if energy_indicators else 0.5
    
    def _analyze_trends(self, emotion_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze wellness trends over time"""
        
        if len(emotion_history) < 2:
            return {"trend": "insufficient_data"}
        
        # Simple trend analysis - compare recent vs older emotions
        recent_emotions = emotion_history[:len(emotion_history)//2]
        older_emotions = emotion_history[len(emotion_history)//2:]
        
        recent_score = self._calculate_emotional_score(recent_emotions)
        older_score = self._calculate_emotional_score(older_emotions)
        
        trend_direction = "stable"
        if recent_score > older_score + 0.1:
            trend_direction = "improving"
        elif recent_score < older_score - 0.1:
            trend_direction = "declining"
        
        return {
            "trend": trend_direction,
            "recent_score": recent_score,
            "previous_score": older_score,
            "change": recent_score - older_score
        }
    
    def _generate_recommendations(
        self,
        emotional: float,
        physical: float,
        stress: float,
        energy: float
    ) -> List[str]:
        """Generate personalized wellness recommendations"""
        
        recommendations = []
        
        # Stress-based recommendations
        if stress > 0.7:
            recommendations.extend([
                "Practice deep breathing exercises",
                "Take regular breaks to reduce stress",
                "Consider mindfulness meditation"
            ])
        elif stress > 0.5:
            recommendations.append("Monitor your stress levels and practice relaxation techniques")
        
        # Energy-based recommendations
        if energy < 0.3:
            recommendations.extend([
                "Ensure you're getting adequate sleep",
                "Take short walks to boost energy",
                "Stay hydrated throughout the day"
            ])
        elif energy > 0.8:
            recommendations.append("Channel your high energy into productive activities")
        
        # Emotional recommendations
        if emotional < 0.4:
            recommendations.extend([
                "Reach out to friends or family for support",
                "Engage in activities you enjoy",
                "Consider speaking with a counselor if feelings persist"
            ])
        elif emotional > 0.8:
            recommendations.append("Keep doing what makes you happy!")
        
        # Physical recommendations
        if physical < 0.4:
            recommendations.extend([
                "Ensure you're maintaining good posture",
                "Take breaks from screen time",
                "Consider light physical exercise"
            ])
        
        # Limit to 5 recommendations
        return recommendations[:5] if recommendations else ["Keep monitoring your wellness"]
    
    def detect_stress_level(
        self,
        emotion_history: List[Dict[str, Any]],
        audio_features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Detect current stress level with detailed analysis"""
        
        try:
            recent_emotions = self._filter_recent_emotions(emotion_history, 180)  # 3 minutes
            
            stress_score = self._calculate_stress_score(recent_emotions)
            
            # Determine stress level category
            if stress_score > 0.7:
                level = "high"
            elif stress_score > 0.4:
                level = "medium"
            else:
                level = "low"
            
            # Identify stress indicators
            indicators = []
            for emotion_data in recent_emotions:
                emotion = emotion_data.get('emotion', 'neutral')
                if emotion in self.stress_indicators["high_stress_emotions"]:
                    indicators.append(f"Detected {emotion} emotion")
            
            if audio_features:
                pitch_variation = audio_features.get('pitch_variation', 0)
                if pitch_variation > 50:  # Threshold for high pitch variation
                    indicators.append("High voice pitch variation")
                
                speaking_rate = audio_features.get('speaking_rate', 1.0)
                if speaking_rate > 1.5:
                    indicators.append("Rapid speech pattern")
            
            return {
                "stress_level": level,
                "confidence": float(stress_score),
                "indicators": indicators or ["No specific stress indicators detected"]
            }
            
        except Exception as e:
            logger.error(f"Stress detection failed: {e}")
            return {
                "stress_level": "unknown",
                "confidence": 0.0,
                "indicators": ["Error in stress detection"]
            }
    
    def _default_wellness_response(self) -> WellnessResponse:
        """Return default wellness response when calculation fails"""
        return WellnessResponse(
            overall=0.5,
            emotional=0.5,
            physical=0.5,
            stress=0.3,
            energy=0.5,
            trends={"trend": "no_data"},
            recommendations=["Start monitoring your wellness with MAITRI"]
        )
    
    def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        return {
            "status": "ready",
            "emotion_weights_loaded": len(self.emotion_weights) > 0,
            "stress_indicators_loaded": len(self.stress_indicators) > 0
        }