console.log('AI Interview Copilot content script loaded');

// Create and inject the overlay container
const createOverlay = () => {
  const overlay = document.createElement('div');
  overlay.id = 'ai-interview-copilot-overlay';
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 9999;
    max-width: 300px;
    display: none;
  `;
  document.body.appendChild(overlay);
  return overlay;
};

// Initialize overlay
const overlay = createOverlay();

// Update overlay content
const updateOverlay = (text) => {
  overlay.textContent = text;
  overlay.style.display = 'block';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 5000);
};

// Audio recording functionality
let mediaRecorder = null;
let audioChunks = [];

// Start recording
async function startRecording() {
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

        // Send answer to background script
        chrome.runtime.sendMessage({
          type: 'audio-chunk',
          audio: gptData.answer
        });
      } catch (error) {
        console.error('Error processing audio:', error);
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
}

// Stop recording
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'startRecording') {
    startRecording();
    sendResponse({ status: 'started' });
  } else if (request.type === 'stopRecording') {
    stopRecording();
    sendResponse({ status: 'stopped' });
  }
  return true;
});

// Initialize WebSocket connection with background script when the content script loads
chrome.runtime.sendMessage({ type: 'start-socket' }, (response) => {
  if (response && response.status === 'connected') {
    console.log('WebSocket connection established');
  } else {
    console.error('Failed to establish WebSocket connection:', response);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'answer') {
    updateOverlay(message.payload.text);
  }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
  stopRecording();
  chrome.runtime.sendMessage({ type: 'stop-socket' });
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.code === 'Space') {
    const overlay = document.getElementById('ai-interview-copilot-overlay');
    if (overlay) {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
  }
});

// Initialize
const init = () => {
  createOverlay();
  connectWebSocket();

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'updateAnswer') {
      updateOverlay(request.text);
    }
  });
};

// Start the extension
init(); 