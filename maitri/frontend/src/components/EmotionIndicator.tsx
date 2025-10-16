import { useMemo } from 'react';

export interface Emotion {
  label: string;
  confidence: number;
  color?: string;
}

interface EmotionIndicatorProps {
  emotions: Emotion[];
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
  maxEmotions?: number;
}

const emotionColors: Record<string, string> = {
  happy: '#10b981',
  sad: '#3b82f6',
  angry: '#ef4444',
  surprised: '#f59e0b',
  fear: '#8b5cf6',
  disgust: '#84cc16',
  neutral: '#6b7280',
  contempt: '#f97316',
  joy: '#eab308',
  excitement: '#06b6d4',
  calm: '#22c55e',
  stressed: '#dc2626',
  anxious: '#7c3aed',
  confused: '#a855f7',
  focused: '#059669',
  tired: '#64748b'
};

const sizeClasses = {
  sm: {
    container: 'text-xs',
    badge: 'px-2 py-1 text-xs',
    bar: 'h-1'
  },
  md: {
    container: 'text-sm',
    badge: 'px-3 py-1.5 text-sm',
    bar: 'h-2'
  },
  lg: {
    container: 'text-base',
    badge: 'px-4 py-2 text-base',
    bar: 'h-3'
  }
};

export function EmotionIndicator({ 
  emotions = [], 
  size = 'md', 
  showConfidence = true,
  maxEmotions = 3 
}: EmotionIndicatorProps) {
  const topEmotions = useMemo(() => {
    if (!emotions || emotions.length === 0) {
      return [];
    }
    
    return emotions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxEmotions)
      .map(emotion => ({
        ...emotion,
        color: emotion.color || emotionColors[emotion.label.toLowerCase()] || '#6b7280'
      }));
  }, [emotions, maxEmotions]);

  const classes = sizeClasses[size];

  if (emotions.length === 0) {
    return (
      <div className={`text-gray-500 ${classes.container}`}>
        No emotions detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Primary emotion display */}
      {topEmotions.length > 0 && (
        <div className="flex items-center space-x-2">
          <div 
            className={`inline-flex items-center rounded-full font-medium text-white ${classes.badge}`}
            style={{ backgroundColor: topEmotions[0].color }}
          >
            <span className="capitalize">{topEmotions[0].label}</span>
            {showConfidence && (
              <span className="ml-1 opacity-90">
                {Math.round(topEmotions[0].confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Secondary emotions with confidence bars */}
      {topEmotions.length > 1 && (
        <div className="space-y-1">
          {topEmotions.slice(1).map((emotion, index) => (
            <div key={emotion.label} className="flex items-center space-x-2">
              <span className={`min-w-0 flex-1 capitalize text-gray-700 ${classes.container}`}>
                {emotion.label}
              </span>
              
              {showConfidence && (
                <>
                  <div className="flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`${classes.bar} rounded-full transition-all duration-300`}
                      style={{
                        width: `${emotion.confidence * 100}%`,
                        backgroundColor: emotion.color
                      }}
                    />
                  </div>
                  <span className={`text-gray-500 ${classes.container} min-w-0`}>
                    {Math.round(emotion.confidence * 100)}%
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Emotion distribution visualization for multiple emotions */}
      {topEmotions.length > 2 && showConfidence && (
        <div className="mt-3">
          <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
            {topEmotions.map((emotion, index) => (
              <div
                key={emotion.label}
                className="transition-all duration-300"
                style={{
                  width: `${(emotion.confidence / topEmotions.reduce((sum, e) => sum + e.confidence, 0)) * 100}%`,
                  backgroundColor: emotion.color
                }}
                title={`${emotion.label}: ${Math.round(emotion.confidence * 100)}%`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to create emotion objects
export function createEmotion(label: string, confidence: number, color?: string): Emotion {
  return {
    label,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
    color
  };
}

// Predefined emotion sets for common scenarios
export const EmotionPresets = {
  positive: [
    createEmotion('happy', 0.8),
    createEmotion('joy', 0.7),
    createEmotion('excited', 0.6)
  ],
  negative: [
    createEmotion('sad', 0.7),
    createEmotion('angry', 0.5),
    createEmotion('stressed', 0.6)
  ],
  neutral: [
    createEmotion('neutral', 0.9),
    createEmotion('calm', 0.4)
  ],
  mixed: [
    createEmotion('confused', 0.6),
    createEmotion('surprised', 0.5),
    createEmotion('curious', 0.4)
  ]
};