import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import MicStreamer from './components/MicStreamer';
import AnswerOverlay from './components/AnswerOverlay';
import ResumeUploader from './components/ResumeUploader';
import Settings from './components/Settings';

function App() {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [resumeData, setResumeData] = useState(null);
  const [settings, setSettings] = useState({
    language: 'en',
    stealthMode: true,
    fontSize: 'medium'
  });

  const handleTranscript = (text) => {
    console.log('Transcript:', text);
    // You can add additional processing here if needed
  };

  const handleGptResponse = (text) => {
    setCurrentAnswer(text);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          AI Interview Copilot
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ResumeUploader onResumeUpload={setResumeData} />
            <Settings settings={settings} onSettingsChange={setSettings} />
          </div>

          <div className="space-y-6">
            <MicStreamer
              onTranscript={handleTranscript}
              onGptResponse={handleGptResponse}
            />
          </div>
        </div>

        <AnswerOverlay
          answer={currentAnswer}
          settings={settings}
          isVisible={!!currentAnswer}
        />
      </main>
    </div>
  );
}

export default App; 