import React, { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const MicStreamer = ({ onTranscript, onGptResponse }) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize WebSocket connection
  const initWebSocket = () => {
    wsRef.current = new WebSocket(`ws://${window.location.hostname}:8000/ws/transcription`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.event) {
        case 'transcript':
          onTranscript(data.text);
          break;
        case 'gpt_response':
          onGptResponse(data.text);
          break;
        case 'error':
          setError(data.error);
          toast.error(data.error);
          break;
        case 'status':
          setIsConnected(data.status === 'connected');
          break;
        default:
          console.log('Unknown event type:', data.event);
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 1 second
      setTimeout(initWebSocket, 1000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      toast.error('Connection error');
    };
  };

  // Initialize audio processing
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isListening || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert to 16kHz PCM
        const pcmData = downsampleBuffer(inputData, audioContext.sampleRate, 16000);
        
        // Convert to base64
        const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(pcmData.buffer)));

        // Send to WebSocket
        wsRef.current.send(JSON.stringify({
          event: 'audio_chunk',
          audio: base64Data
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (error) {
      console.error('Error initializing audio:', error);
      setError('Failed to access microphone');
      toast.error('Microphone access denied');
    }
  };

  // Downsample audio to 16kHz
  const downsampleBuffer = (buffer, sampleRate, targetSampleRate) => {
    if (sampleRate === targetSampleRate) return buffer;

    const ratio = sampleRate / targetSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.floor(i * ratio)];
    }

    return result;
  };

  // Start listening
  const startListening = async () => {
    if (!wsRef.current) {
      initWebSocket();
    }
    
    if (!audioContextRef.current) {
      await initAudio();
    }

    setIsListening(true);
    toast.success('Started listening');
  };

  // Stop listening
  const stopListening = () => {
    setIsListening(false);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    toast.success('Stopped listening');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Audio Input</h2>
      
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-4 rounded-full ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
          disabled={!isConnected}
        >
          {isListening ? (
            <StopIcon className="h-6 w-6" />
          ) : (
            <MicrophoneIcon className="h-6 w-6" />
          )}
        </button>
        
        <div className="flex flex-col">
          <span className="text-gray-600">
            {isListening ? 'Recording...' : 'Click to start recording'}
          </span>
          <span className="text-sm text-gray-500">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>• Make sure your microphone is properly connected</p>
        <p>• Speak clearly and at a normal pace</p>
        <p>• The system will automatically transcribe your speech</p>
      </div>
    </div>
  );
};

export default MicStreamer; 