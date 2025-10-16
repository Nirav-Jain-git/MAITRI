import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotionalContext?: {
    emotionalTone?: string;
    supportLevel?: 'low' | 'medium' | 'high';
    suggestedActions?: string[];
  };
}

export function ConversationView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentEmotion, wellnessScore, isSessionActive } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isSessionActive) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response (replace with actual API call)
    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: `conv_${Date.now()}`,
          emotionalContext: {
            currentEmotion: currentEmotion?.emotion,
            wellnessScore: wellnessScore?.overall,
            recentEmotions: [currentEmotion?.emotion || 'neutral'],
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
          emotionalContext: {
            emotionalTone: data.data.emotionalTone,
            supportLevel: data.data.supportLevel,
            suggestedActions: data.data.suggestedActions,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm here to listen and support you. How are you feeling right now?",
        timestamp: new Date(),
        emotionalContext: {
          emotionalTone: 'compassionate',
          supportLevel: 'medium',
        },
      };

      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSupportLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Wellness Conversation
        </h2>
        <p className="text-sm text-gray-600">
          Share your thoughts and feelings in a safe space
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Start a conversation about your wellness journey
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Share how you're feeling</p>
              <p>• Discuss your stress levels</p>
              <p>• Get personalized wellness tips</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-75">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.emotionalContext?.supportLevel && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getSupportLevelColor(
                        message.emotionalContext.supportLevel
                      )}`}
                    >
                      {message.emotionalContext.supportLevel} support
                    </span>
                  )}
                </div>
                {message.emotionalContext?.suggestedActions && (
                  <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-20">
                    <p className="text-xs opacity-75 mb-1">Suggestions:</p>
                    <ul className="text-xs space-y-1">
                      {message.emotionalContext.suggestedActions.slice(0, 2).map((action, index) => (
                        <li key={index} className="opacity-90">
                          • {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        {!isSessionActive && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Start a wellness session to begin conversation
            </p>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={!isSessionActive}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={2}
            />
          </div>
          
          <button
            onClick={toggleRecording}
            disabled={!isSessionActive}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isSessionActive}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}