import React, { useEffect, useRef } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const MicListener = ({ isListening, onToggleListening, onTranscriptionComplete }) => {
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const socket = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    socket.current = new WebSocket('ws://localhost:3000');

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcription') {
        onTranscriptionComplete(data.text);
      }
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [onTranscriptionComplete]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('http://localhost:3000/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          onTranscriptionComplete(data.text);
        } catch (error) {
          toast.error('Failed to transcribe audio');
          console.error('Transcription error:', error);
        }
      };

      mediaRecorder.current.start();
      onToggleListening(true);
      toast.success('Started recording');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error('Microphone access error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      onToggleListening(false);
      toast.success('Stopped recording');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Audio Input</h2>
      
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={isListening ? stopRecording : startRecording}
          className={`p-4 rounded-full ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
        >
          {isListening ? (
            <StopIcon className="h-6 w-6" />
          ) : (
            <MicrophoneIcon className="h-6 w-6" />
          )}
        </button>
        
        <span className="text-gray-600">
          {isListening ? 'Recording...' : 'Click to start recording'}
        </span>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>• Make sure your microphone is properly connected</p>
        <p>• Speak clearly and at a normal pace</p>
        <p>• The system will automatically transcribe your speech</p>
      </div>
    </div>
  );
};

export default MicListener; 