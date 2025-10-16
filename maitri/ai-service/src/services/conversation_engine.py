from typing import Dict, List, Any, Optional
import random
from loguru import logger
from datetime import datetime

from ..models.schemas import ConversationResponse, ConversationContext, ModelStatus

class ConversationEngine:
    """Simple rule-based conversation engine for wellness support"""
    
    def __init__(self):
        self.model_status = ModelStatus(
            model_name="conversation_engine",
            status="not_loaded",
            version="1.0.0",
            last_updated=datetime.now()
        )
        
        # Emotion-based response templates
        self.response_templates = {
            "happy": [
                "I'm so glad to see you're feeling positive! What's been going well for you today?",
                "Your happiness is wonderful to see! Would you like to share what's bringing you joy?",
                "It's beautiful to see you in such good spirits! Keep embracing these positive moments."
            ],
            "sad": [
                "I can see you're going through a difficult time. Remember that it's okay to feel sad, and I'm here to support you.",
                "I'm sorry you're feeling down. Would you like to talk about what's on your mind?",
                "Your feelings are valid, and it's important to acknowledge them. How can I help you feel a little better?"
            ],
            "angry": [
                "I can sense your frustration. Take a deep breath with me. What's causing these strong feelings?",
                "It sounds like something has really upset you. Would it help to talk through what happened?",
                "Your anger is understandable. Let's work together to find healthy ways to process these feelings."
            ],
            "fear": [
                "I can see you're feeling anxious or worried. You're safe here, and we can work through this together.",
                "Fear can be overwhelming, but you don't have to face it alone. What's been causing you concern?",
                "It's natural to feel afraid sometimes. Let's focus on what you can control and take things one step at a time."
            ],
            "neutral": [
                "How are you feeling today? I'm here to listen and support you however you need.",
                "Tell me what's on your mind. I'm here to provide a safe space for you to express yourself.",
                "I'm glad you're here. How has your day been going so far?"
            ],
            "surprise": [
                "You seem surprised! Sometimes unexpected things can catch us off guard. How are you processing this?",
                "Life can be full of surprises. How are you feeling about this unexpected moment?",
                "That must have been quite a surprise! Tell me more about what happened."
            ],
            "disgust": [
                "I can see something has really bothered you. It's okay to feel disgusted by things that don't align with your values.",
                "Sometimes we encounter things that make us feel uncomfortable. How can I help you process these feelings?",
                "Your reaction is completely valid. Let's talk about what's troubling you."
            ]
        }
        
        # Wellness suggestions based on emotional state
        self.wellness_suggestions = {
            "stress": [
                "Try some deep breathing exercises",
                "Take a short walk outside",
                "Practice mindfulness meditation",
                "Listen to calming music",
                "Do some gentle stretching"
            ],
            "low_energy": [
                "Get some natural sunlight",
                "Try light physical activity",
                "Ensure you're staying hydrated",
                "Take short breaks throughout the day",
                "Consider a healthy snack"
            ],
            "positive": [
                "Keep a gratitude journal",
                "Share your positive energy with others",
                "Engage in activities you enjoy",
                "Celebrate your accomplishments",
                "Practice self-care"
            ]
        }
    
    async def initialize(self):
        """Initialize conversation engine"""
        try:
            logger.info("Initializing conversation engine...")
            
            # Load or initialize conversation models (placeholder for future ML models)
            self.model_status.status = "loaded"
            self.model_status.last_updated = datetime.now()
            
            logger.info("Conversation engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize conversation engine: {e}")
            self.model_status.status = "error"
            raise
    
    async def generate_response(
        self,
        message: str,
        emotional_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> ConversationResponse:
        """Generate contextual conversation response"""
        
        try:
            # Determine emotional context
            current_emotion = "neutral"
            wellness_score = 0.5
            support_level = "medium"
            
            if emotional_context:
                current_emotion = emotional_context.get("current_emotion", "neutral")
                wellness_score = emotional_context.get("wellness_score", 0.5)
            
            # Determine support level based on emotion and wellness
            if current_emotion in ["sad", "angry", "fear"] or wellness_score < 0.4:
                support_level = "high"
            elif current_emotion in ["happy", "surprise"] and wellness_score > 0.7:
                support_level = "low"
            
            # Generate appropriate response
            response_text = self._generate_response_text(
                message, current_emotion, conversation_history
            )
            
            # Generate wellness suggestions
            suggestions = self._generate_wellness_suggestions(current_emotion, wellness_score)
            
            # Determine emotional tone of response
            emotional_tone = self._determine_response_tone(current_emotion, support_level)
            
            return ConversationResponse(
                response=response_text,
                suggested_actions=suggestions,
                emotional_tone=emotional_tone,
                support_level=support_level
            )
            
        except Exception as e:
            logger.error(f"Failed to generate conversation response: {e}")
            # Return a safe fallback response
            return ConversationResponse(
                response="I'm here to listen and support you. How are you feeling right now?",
                suggested_actions=["Take a moment to breathe deeply"],
                emotional_tone="supportive",
                support_level="medium"
            )
    
    def _generate_response_text(
        self,
        message: str,
        emotion: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Generate response text based on emotion and context"""
        
        # Check for specific keywords in message
        message_lower = message.lower()
        
        # Crisis keywords - prioritize safety
        crisis_keywords = ["hurt myself", "suicide", "kill", "die", "end it"]
        if any(keyword in message_lower for keyword in crisis_keywords):
            return ("I'm very concerned about you. Please reach out to a mental health professional "
                   "or crisis helpline immediately. Your life has value, and there are people who want to help.")
        
        # Wellness-related keywords
        if any(word in message_lower for word in ["tired", "exhausted", "sleep"]):
            return ("It sounds like you might be feeling tired. Rest is so important for our wellbeing. "
                   "Are you getting enough quality sleep? Sometimes adjusting our sleep routine can make a big difference.")
        
        if any(word in message_lower for word in ["stressed", "overwhelmed", "pressure"]):
            return ("Stress can feel overwhelming, but there are ways to manage it. "
                   "What's been the biggest source of stress for you lately? "
                   "Sometimes breaking things down into smaller, manageable steps can help.")
        
        if any(word in message_lower for word in ["lonely", "alone", "isolated"]):
            return ("Feeling lonely can be really difficult. Remember that reaching out, like you're doing now, "
                   "is a brave step. Connection is important for our wellbeing. "
                   "Is there someone in your life you could reach out to today?")
        
        # Use emotion-based templates
        templates = self.response_templates.get(emotion, self.response_templates["neutral"])
        return random.choice(templates)
    
    def _generate_wellness_suggestions(self, emotion: str, wellness_score: float) -> List[str]:
        """Generate wellness suggestions based on current state"""
        
        suggestions = []
        
        # Emotion-based suggestions
        if emotion in ["sad", "angry", "fear"]:
            suggestions.extend(self.wellness_suggestions["stress"][:2])
        elif wellness_score < 0.4:
            suggestions.extend(self.wellness_suggestions["low_energy"][:2])
        elif emotion == "happy" and wellness_score > 0.7:
            suggestions.extend(self.wellness_suggestions["positive"][:2])
        else:
            # General wellness suggestions
            suggestions.extend([
                "Practice mindful breathing",
                "Take regular breaks",
                "Stay hydrated"
            ])
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    def _determine_response_tone(self, emotion: str, support_level: str) -> str:
        """Determine appropriate emotional tone for response"""
        
        if support_level == "high":
            return "compassionate"
        elif emotion in ["happy", "surprise"]:
            return "encouraging"
        elif emotion in ["sad", "fear"]:
            return "gentle"
        elif emotion == "angry":
            return "calming"
        else:
            return "supportive"
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        return {
            "status": "ready",
            "templates_loaded": len(self.response_templates) > 0,
            "suggestions_loaded": len(self.wellness_suggestions) > 0
        }
    
    def get_model_status(self) -> ModelStatus:
        """Get model status"""
        return self.model_status
    
    async def reload_models(self):
        """Reload conversation models"""
        await self.initialize()