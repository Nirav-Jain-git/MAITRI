import { useAppStore } from '../store/useAppStore';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function Header({ 
  title = "MAITRI", 
  showBackButton = false, 
  onBack,
  actions 
}: HeaderProps) {
  const { user, isConnected } = useAppStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg 
                className="w-5 h-5 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            {/* Logo */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              {user && (
                <p className="text-xs text-gray-500">Welcome, {user.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {actions}
          
          {/* User Menu */}
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}