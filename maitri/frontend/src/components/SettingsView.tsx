import { useState } from 'react';
import { Settings, Camera, Mic, Bell, Shield, Download, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function SettingsView() {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stressAlertsEnabled, setStressAlertsEnabled] = useState(true);
  const [dataRetention, setDataRetention] = useState('30'); // days

  const { isSessionActive, endSession } = useAppStore();

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // TODO: Implement data clearing
      console.log('Clearing all data...');
    }
  };

  const handleExportData = async () => {
    // TODO: Implement data export
    console.log('Exporting data...');
  };

  const handleEndSession = () => {
    if (isSessionActive && window.confirm('Are you sure you want to end the current session?')) {
      endSession();
    }
  };

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Settings className="mr-2" size={24} />
          Settings
        </h2>
        <p className="text-sm text-gray-600">
          Configure your wellness monitoring preferences
        </p>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Device Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Device Permissions</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Camera className="text-gray-600" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Camera Access</p>
                  <p className="text-sm text-gray-600">
                    Required for facial emotion detection
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cameraEnabled}
                  onChange={(e) => setCameraEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${
                  cameraEnabled ? 'peer-checked:bg-blue-600' : ''
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                    cameraEnabled ? 'translate-x-5' : ''
                  }`}></div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="text-gray-600" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Microphone Access</p>
                  <p className="text-sm text-gray-600">
                    Required for voice emotion detection
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={microphoneEnabled}
                  onChange={(e) => setMicrophoneEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${
                  microphoneEnabled ? 'peer-checked:bg-blue-600' : ''
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                    microphoneEnabled ? 'translate-x-5' : ''
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="text-gray-600" size={20} />
                <div>
                  <p className="font-medium text-gray-900">General Notifications</p>
                  <p className="text-sm text-gray-600">
                    Session reminders and wellness tips
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${
                  notificationsEnabled ? 'peer-checked:bg-blue-600' : ''
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : ''
                  }`}></div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="text-gray-600" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Stress Alerts</p>
                  <p className="text-sm text-gray-600">
                    Notifications when high stress is detected
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={stressAlertsEnabled}
                  onChange={(e) => setStressAlertsEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${
                  stressAlertsEnabled ? 'peer-checked:bg-blue-600' : ''
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                    stressAlertsEnabled ? 'translate-x-5' : ''
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">Data Retention</p>
                <select
                  value={dataRetention}
                  onChange={(e) => setDataRetention(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
              <p className="text-sm text-gray-600">
                How long to keep your wellness data stored locally
              </p>
            </div>

            <button
              onClick={handleExportData}
              className="flex items-center justify-center w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="mr-2" size={16} />
              Export My Data
            </button>

            <button
              onClick={handleClearData}
              className="flex items-center justify-center w-full p-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="mr-2" size={16} />
              Clear All Data
            </button>
          </div>
        </div>

        {/* Session Management */}
        {isSessionActive && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Current Session</h3>
            
            <button
              onClick={handleEndSession}
              className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              End Current Session
            </button>
          </div>
        )}

        {/* Privacy Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Privacy & Security</h3>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Local Processing</h4>
            <p className="text-sm text-blue-800 mb-3">
              All your data is processed locally on your device. No personal information 
              is sent to external servers.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Emotion detection runs on your device</li>
              <li>• Conversation data stays private</li>
              <li>• No data transmitted over the internet</li>
              <li>• Full control over your information</li>
            </ul>
          </div>
        </div>

        {/* About */}
        <div className="space-y-4 pb-6">
          <h3 className="text-lg font-medium text-gray-900">About MAITRI</h3>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>MAITRI</strong> - Your Personal AI Wellness Assistant
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Version 1.0.0
            </p>
            <p className="text-sm text-gray-600">
              Built with privacy-first AI technology for mental health and wellness support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}