import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioFeatures {
  volume: number;
  pitch?: number;
  mfcc?: number[];
  spectralCentroid?: number;
  zeroCrossingRate?: number;
  spectralRolloff?: number;
  tempo?: number;
  energy?: number;
}

interface VoiceAnalysis {
  emotionalState?: {
    arousal: number; // 0-1, low to high energy
    valence: number; // 0-1, negative to positive
    dominance?: number; // 0-1, submissive to dominant
  };
  stressLevel?: number; // 0-1
  confidence?: number; // 0-1
  clarity?: number; // 0-1, speech clarity
}

interface UseAudioProcessingOptions {
  sampleRate?: number;
  bufferSize?: number;
  enableVoiceAnalysis?: boolean;
  enableNoiseReduction?: boolean;
  onAudioFeatures?: (features: AudioFeatures) => void;
  onVoiceAnalysis?: (analysis: VoiceAnalysis) => void;
  onVolumeChange?: (volume: number) => void;
}

interface UseAudioProcessingReturn {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioFeatures: AudioFeatures | null;
  voiceAnalysis: VoiceAnalysis | null;
  volume: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isSupported: boolean;
}

export function useAudioProcessing(options: UseAudioProcessingOptions = {}): UseAudioProcessingReturn {
  const {
    sampleRate = 44100,
    bufferSize = 4096,
    enableVoiceAnalysis = true,
    enableNoiseReduction = false,
    onAudioFeatures,
    onVoiceAnalysis,
    onVolumeChange
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout>();

  const isSupported = Boolean(
    window.AudioContext || 
    (window as any).webkitAudioContext
  );

  // Initialize audio context
  const initializeAudioContext = useCallback(async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = bufferSize;
      analyserRef.current.smoothingTimeConstant = 0.8;

      return true;
    } catch (err) {
      setError('Failed to initialize audio context');
      return false;
    }
  }, [bufferSize]);

  // Process audio data
  const processAudioData = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);
    analyser.getFloatFrequencyData(frequencyData);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const calculatedVolume = Math.min(1, rms * 10); // Scale and clamp

    setVolume(calculatedVolume);
    onVolumeChange?.(calculatedVolume);

    // Calculate basic audio features
    const features: AudioFeatures = {
      volume: calculatedVolume
    };

    // Calculate spectral centroid (brightness)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert from dB
      const frequency = (i * sampleRate) / (2 * frequencyData.length);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    if (magnitudeSum > 0) {
      features.spectralCentroid = weightedSum / magnitudeSum;
    }

    // Calculate zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < dataArray.length; i++) {
      if ((dataArray[i] - 128) * (dataArray[i - 1] - 128) < 0) {
        zeroCrossings++;
      }
    }
    features.zeroCrossingRate = zeroCrossings / dataArray.length;

    // Calculate energy
    features.energy = frequencyData.reduce((sum, val) => sum + Math.pow(10, val / 10), 0) / frequencyData.length;

    setAudioFeatures(features);
    onAudioFeatures?.(features);

    // Voice analysis (simplified)
    if (enableVoiceAnalysis && calculatedVolume > 0.01) {
      const analysis: VoiceAnalysis = {
        emotionalState: {
          arousal: Math.min(1, calculatedVolume * 2), // Higher volume = higher arousal
          valence: 0.5 + (features.spectralCentroid || 0) / 8000 * 0.5 // Brighter = more positive
        },
        stressLevel: Math.min(1, (features.zeroCrossingRate || 0) * 10), // More variation = more stress
        confidence: Math.min(1, calculatedVolume * 1.5),
        clarity: 1 - (features.zeroCrossingRate || 0) * 5 // Less variation = clearer speech
      };

      setVoiceAnalysis(analysis);
      onVoiceAnalysis?.(analysis);
    }
  }, [sampleRate, enableVoiceAnalysis, onAudioFeatures, onVoiceAnalysis, onVolumeChange]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      if (!isSupported) {
        throw new Error('Audio processing not supported in this browser');
      }

      // Initialize audio context
      const initialized = await initializeAudioContext();
      if (!initialized) return;

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          echoCancellation: true,
          noiseSuppression: enableNoiseReduction,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // Connect microphone to analyser
      if (audioContextRef.current && analyserRef.current) {
        microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
        microphoneRef.current.connect(analyserRef.current);
      }

      setIsRecording(true);
      setIsProcessing(true);

      // Start processing audio data
      processingIntervalRef.current = setInterval(processAudioData, 100); // Process every 100ms

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audio recording');
    }
  }, [isSupported, initializeAudioContext, sampleRate, enableNoiseReduction, processAudioData]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);

    // Clear processing interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setVolume(0);
    setAudioFeatures(null);
    setVoiceAnalysis(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isProcessing,
    error,
    audioFeatures,
    voiceAnalysis,
    volume,
    startRecording,
    stopRecording,
    isSupported
  };
}