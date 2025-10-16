import { create } from 'zustand';
import { EmotionData, WellnessScore, ConversationContext, SystemAlert, UserPreferences, SessionData } from '@/types';

interface AppState {
  // Current session data
  currentEmotion: EmotionData | null;
  currentWellnessScore: WellnessScore | null;
  isSessionActive: boolean;
  sessionId: string | null;
  
  // Real-time data
  isVideoActive: boolean;
  isAudioActive: boolean;
  isMicrophonePermissionGranted: boolean;
  isCameraPermissionGranted: boolean;
  
  // Conversation
  currentConversation: ConversationContext | null;
  isConversationActive: boolean;
  
  // Alerts and notifications
  alerts: SystemAlert[];
  unreadAlerts: number;
  
  // User preferences
  preferences: UserPreferences;
  
  // Historical data
  recentSessions: SessionData[];
  wellnessHistory: WellnessScore[];
  
  // UI state
  activeTab: 'dashboard' | 'conversation' | 'history' | 'settings';
  isLoading: boolean;
  error: string | null;
  
  // Connection state
  isConnected: boolean;
  
  // User data
  user: {
    id: string;
    name: string;
    email?: string;
  } | null;
  
  // Additional properties for components
  wellnessScore: number;
}

interface AppActions {
  // Session management
  startSession: () => void;
  endSession: () => void;
  updateCurrentEmotion: (emotion: EmotionData) => void;
  updateWellnessScore: (score: WellnessScore) => void;
  
  // Media permissions
  setVideoActive: (active: boolean) => void;
  setAudioActive: (active: boolean) => void;
  setMicrophonePermission: (granted: boolean) => void;
  setCameraPermission: (granted: boolean) => void;
  
  // Conversation
  startConversation: () => void;
  endConversation: () => void;
  updateConversation: (conversation: ConversationContext) => void;
  
  // Alerts
  addAlert: (alert: SystemAlert) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // History
  addSession: (session: SessionData) => void;
  addWellnessScore: (score: WellnessScore) => void;
  
  // UI
  setActiveTab: (tab: AppState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultPreferences: UserPreferences = {
  audioEnabled: true,
  videoEnabled: true,
  alertsEnabled: true,
  voiceEnabled: true,
  sensitivity: 'medium',
  privacyMode: false,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Initial state
  currentEmotion: null,
  currentWellnessScore: null,
  isSessionActive: false,
  sessionId: null,
  isVideoActive: false,
  isAudioActive: false,
  isMicrophonePermissionGranted: false,
  isCameraPermissionGranted: false,
  currentConversation: null,
  isConversationActive: false,
  alerts: [],
  unreadAlerts: 0,
  preferences: defaultPreferences,
  recentSessions: [],
  wellnessHistory: [],
  activeTab: 'dashboard',
  isLoading: false,
  error: null,
  isConnected: false,
  user: null,
  wellnessScore: 0,

  // Actions
  startSession: () => {
    const sessionId = `session_${Date.now()}`;
    set({
      isSessionActive: true,
      sessionId,
      currentEmotion: null,
      currentWellnessScore: null,
      error: null,
    });
  },

  endSession: () => {
    const state = get();
    if (state.isSessionActive && state.sessionId) {
      // Create session summary
      const session: SessionData = {
        id: state.sessionId,
        startTime: new Date(parseInt(state.sessionId.split('_')[1])),
        endTime: new Date(),
        wellnessScores: state.wellnessHistory.filter(
          score => score.timestamp >= new Date(parseInt(state.sessionId!.split('_')[1]))
        ),
        emotions: [],
        interactions: state.currentConversation?.messages.length || 0,
        averageWellness: state.wellnessHistory.length > 0 
          ? state.wellnessHistory.reduce((sum, score) => sum + score.overall, 0) / state.wellnessHistory.length
          : 0,
      };

      set({
        isSessionActive: false,
        sessionId: null,
        recentSessions: [session, ...state.recentSessions.slice(0, 9)], // Keep last 10 sessions
        isConversationActive: false,
        currentConversation: null,
      });
    }
  },

  updateCurrentEmotion: (emotion) => {
    set({ currentEmotion: emotion });
  },

  updateWellnessScore: (score) => {
    set(state => ({
      currentWellnessScore: score,
      wellnessHistory: [score, ...state.wellnessHistory.slice(0, 99)], // Keep last 100 scores
    }));
  },

  setVideoActive: (active) => set({ isVideoActive: active }),
  setAudioActive: (active) => set({ isAudioActive: active }),
  setMicrophonePermission: (granted) => set({ isMicrophonePermissionGranted: granted }),
  setCameraPermission: (granted) => set({ isCameraPermissionGranted: granted }),

  startConversation: () => {
    const conversationId = `conv_${Date.now()}`;
    const conversation: ConversationContext = {
      id: conversationId,
      userId: 'user_1', // In a real app, this would be dynamic
      messages: [],
      emotionalState: [],
      wellnessHistory: [],
      startTime: new Date(),
      lastActivity: new Date(),
    };

    set({
      isConversationActive: true,
      currentConversation: conversation,
    });
  },

  endConversation: () => {
    set({
      isConversationActive: false,
      currentConversation: null,
    });
  },

  updateConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  addAlert: (alert) => {
    set(state => ({
      alerts: [alert, ...state.alerts.slice(0, 19)], // Keep last 20 alerts
      unreadAlerts: state.unreadAlerts + 1,
    }));
  },

  acknowledgeAlert: (alertId) => {
    set(state => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
      unreadAlerts: Math.max(0, state.unreadAlerts - 1),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [], unreadAlerts: 0 });
  },

  updatePreferences: (newPreferences) => {
    set(state => ({
      preferences: { ...state.preferences, ...newPreferences },
    }));
  },

  addSession: (session) => {
    set(state => ({
      recentSessions: [session, ...state.recentSessions.slice(0, 9)],
    }));
  },

  addWellnessScore: (score) => {
    set(state => ({
      wellnessHistory: [score, ...state.wellnessHistory.slice(0, 99)],
    }));
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));