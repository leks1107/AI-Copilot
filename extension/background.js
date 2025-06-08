// Handle microphone access
let mediaRecorder = null;
let audioChunks = [];

// Initialize WebSocket connection
let ws = null;

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'start-socket') {
    // Initialize WebSocket connection
    ws = new WebSocket('ws://localhost:8000/ws/transcription');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      sendResponse({ status: 'connected' });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Forward the message to content script
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'answer',
          payload: data
        });
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      sendResponse({ status: 'error', error: 'WebSocket connection failed' });
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      sendResponse({ status: 'disconnected' });
    };

    return true; // Keep the message channel open for async response
  }

  if (message.type === 'stop-socket') {
    if (ws) {
      ws.close();
      ws = null;
    }
    sendResponse({ status: 'stopped' });
  }

  if (message.type === 'audio-chunk') {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'audio_chunk',
        audio: message.audio
      }));
    }
  }
});

// Start recording
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      try {
        const response = await fetch(`http://${window.location.hostname}:8000/api/transcribe`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        
        // Send transcription to GPT
        const gptResponse = await fetch(`http://${window.location.hostname}:8000/api/getAnswer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: data.text }),
        });
        const gptData = await gptResponse.json();

        // Send answer to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateAnswer',
            text: gptData.answer,
          });
        });
      } catch (error) {
        console.error('Error processing audio:', error);
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
};

// Stop recording
const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'startRecording') {
    startRecording();
  } else if (request.type === 'stopRecording') {
    stopRecording();
  }
});

// Initialize WebSocket connection
connectWebSocket(); 