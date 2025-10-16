import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface SessionHistory {
  id: string;
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  averageWellness?: number;
  totalInteractions?: number;
  status: 'active' | 'completed' | 'interrupted';
}

interface EmotionHistory {
  id: number;
  emotion: string;
  confidence: number;
  source: 'video' | 'audio' | 'multimodal';
  timestamp: Date;
}

export function HistoryView() {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { userId } = useAppStore();

  useEffect(() => {
    fetchSessionHistory();
  }, [userId]);

  const fetchSessionHistory = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/session/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
        })));
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmotionHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/emotion/history/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setEmotionHistory(data.data.map((emotion: any) => ({
          ...emotion,
          timestamp: new Date(emotion.timestamp),
        })));
      }
    } catch (error) {
      console.error('Error fetching emotion history:', error);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    fetchEmotionHistory(sessionId);
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return 'Ongoing';
    
    const duration = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getWellnessTrend = (score?: number) => {
    if (!score) return { icon: Minus, color: 'text-gray-400', label: 'No data' };
    
    if (score >= 0.7) {
      return { icon: TrendingUp, color: 'text-green-600', label: 'Good' };
    } else if (score >= 0.4) {
      return { icon: Minus, color: 'text-yellow-600', label: 'Moderate' };
    } else {
      return { icon: TrendingDown, color: 'text-red-600', label: 'Needs attention' };
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'bg-yellow-100 text-yellow-800',
      sad: 'bg-blue-100 text-blue-800',
      angry: 'bg-red-100 text-red-800',
      fear: 'bg-purple-100 text-purple-800',
      surprise: 'bg-pink-100 text-pink-800',
      disgust: 'bg-green-100 text-green-800',
      neutral: 'bg-gray-100 text-gray-800',
    };
    return colors[emotion.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <BarChart3 className="mr-2" size={24} />
          Wellness History
        </h2>
        <p className="text-sm text-gray-600">
          Review your wellness journey and progress over time
        </p>
      </div>

      <div className="flex h-full">
        {/* Sessions List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Sessions</h3>
            
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">No sessions yet</p>
                <p className="text-sm text-gray-400">Start your first wellness session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const trend = getWellnessTrend(session.averageWellness);
                  const TrendIcon = trend.icon;
                  
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSessionSelect(session.sessionId)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSession === session.sessionId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {session.startTime.toLocaleDateString()}
                        </span>
                        <span className={`inline-flex items-center ${trend.color}`}>
                          <TrendIcon size={16} />
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          Duration: {formatDuration(session.startTime, session.endTime)}
                        </div>
                        {session.averageWellness && (
                          <div>
                            Wellness: {(session.averageWellness * 100).toFixed(0)}%
                          </div>
                        )}
                        {session.totalInteractions && (
                          <div>
                            Interactions: {session.totalInteractions}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedSession ? (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Session Details</h3>
              
              {emotionHistory.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Emotion Timeline
                    </h4>
                    <div className="space-y-2">
                      {emotionHistory.map((emotion) => (
                        <div
                          key={emotion.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(
                                emotion.emotion
                              )}`}
                            >
                              {emotion.emotion}
                            </span>
                            <span className="text-sm text-gray-600">
                              {emotion.confidence.toFixed(2)} confidence
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {emotion.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Emotion Distribution
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(
                        emotionHistory.reduce((acc, emotion) => {
                          acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([emotion, count]) => {
                        const percentage = (count / emotionHistory.length) * 100;
                        return (
                          <div key={emotion} className="flex items-center space-x-3">
                            <span className="w-16 text-sm text-gray-600 capitalize">
                              {emotion}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No emotion data for this session</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">Select a session to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}