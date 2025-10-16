import { useEffect, useRef } from 'react';
import { Camera, Mic, Play, Square, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { WellnessChart } from './WellnessChart';
import { EmotionIndicator } from './EmotionIndicator';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { useAudioProcessing } from '../hooks/useAudioProcessing';

export function Dashboard() {
  const {
    sessionId,
    isSessionActive,
    startSession,
    endSession,
    currentEmotion,
    currentWellnessScore,
    wellnessHistory,
    alerts,
    isVideoActive,
    isAudioActive,
    isMicrophonePermissionGranted,
    isCameraPermissionGranted,
    setVideoActive,
    setAudioActive,
  } = useAppStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { startDetection, stopDetection, isDetecting, results, error: mediaError } = useMediaPipe();
  const { startRecording, stopRecording, isRecording, audioFeatures, voiceAnalysis } = useAudioProcessing();

  const handleStartSession = async () => {
    try {
      startSession();
      
      if (isCameraPermissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setVideoActive(true);
          await startDetection();
        }
      }

      if (isMicrophonePermissionGranted) {
        await startRecording();
        setAudioActive(true);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleEndSession = () => {
    endSession();
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setVideoActive(false);
    }

    stopRecording();
    stopDetection();
    setAudioActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your emotional and physical well-being in real-time</p>
        </div>

        <div className="flex items-center space-x-4">
          {!isSessionActive ? (
            <button
              onClick={handleStartSession}
              className="btn btn-primary px-6 py-3 h-auto"
              disabled={!isCameraPermissionGranted && !isMicrophonePermissionGranted}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Session
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="btn bg-red-600 text-white hover:bg-red-700 px-6 py-3 h-auto"
            >
              <Square className="w-5 h-5 mr-2" />
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-4">
          {alerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'high' ? 'bg-red-50 border-red-400 text-red-700' :
              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
              'bg-blue-50 border-blue-400 text-blue-700'
            }`}>
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p className="font-medium">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Live Video Analysis</h2>
              <div className="flex items-center space-x-2">
                <Camera className={`w-5 h-5 ${isVideoActive ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${isVideoActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {isVideoActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              
              {!isVideoActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Camera {isCameraPermissionGranted ? 'ready' : 'permission required'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="space-y-6">
          {/* Emotion Indicator */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Current Emotion</h3>
            <EmotionIndicator 
              emotions={currentEmotion ? [{
                label: currentEmotion.emotion,
                confidence: currentEmotion.confidence
              }] : []} 
            />
          </div>

          {/* Audio Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Audio Analysis</h3>
              <div className="flex items-center space-x-2">
                <Mic className={`w-5 h-5 ${isAudioActive ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${isAudioActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {isAudioActive ? 'Listening' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {isAudioActive && (
              <div className="space-y-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <p className="text-sm text-gray-600">Analyzing speech patterns and tone</p>
              </div>
            )}
          </div>

          {/* Wellness Score */}
          {currentWellnessScore && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Wellness Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall</span>
                  <span className="font-semibold">{Math.round(currentWellnessScore.overall * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Emotional</span>
                  <span className="font-semibold">{Math.round(currentWellnessScore.emotional * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Physical</span>
                  <span className="font-semibold">{Math.round(currentWellnessScore.physical * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stress Level</span>
                  <span className="font-semibold">{Math.round((1 - currentWellnessScore.stress) * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wellness Chart */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Wellness Trends</h2>
        <WellnessChart data={wellnessHistory} />
      </div>
    </div>
  );
}