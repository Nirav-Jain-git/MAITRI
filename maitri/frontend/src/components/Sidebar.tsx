import { Home, MessageSquare, BarChart3, Settings, Heart, Activity } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, key: 'dashboard' as const },
  { name: 'Conversation', href: '/conversation', icon: MessageSquare, key: 'conversation' as const },
  { name: 'History', href: '/history', icon: BarChart3, key: 'history' as const },
  { name: 'Settings', href: '/settings', icon: Settings, key: 'settings' as const },
];

export function Sidebar() {
  const { activeTab, setActiveTab, isSessionActive, currentWellnessScore } = useAppStore();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MAITRI</h1>
            <p className="text-sm text-gray-500">AI Wellness Assistant</p>
          </div>
        </div>
      </div>

      {/* Session Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isSessionActive ? 'Session Active' : 'Session Inactive'}
          </span>
        </div>
        
        {currentWellnessScore && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Wellness Score</span>
              <span className={`font-semibold ${
                currentWellnessScore.overall >= 0.7 ? 'text-green-600' :
                currentWellnessScore.overall >= 0.4 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(currentWellnessScore.overall * 100)}%
              </span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  currentWellnessScore.overall >= 0.7 ? 'bg-green-500' :
                  currentWellnessScore.overall >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${currentWellnessScore.overall * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <button
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.key
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>MAITRI v1.0.0</p>
          <p>Local AI Wellness Assistant</p>
        </div>
      </div>
    </div>
  );
}