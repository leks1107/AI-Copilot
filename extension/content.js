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

// Handle audio recording
let mediaRecorder = null;
let audioChunks = [];

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        // Convert audio chunk to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          // Send audio chunk to background script
          chrome.runtime.sendMessage({
            type: 'audio-chunk',
            audio: base64Audio
          });
        };
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.start(1000); // Record in 1-second chunks
    console.log('Recording started');
  } catch (error) {
    console.error('Error starting recording:', error);
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    audioChunks = [];
    console.log('Recording stopped');
  }
};

// Initialize WebSocket connection through background script
chrome.runtime.sendMessage({ type: 'start-socket' }, (response) => {
  if (response.status === 'connected') {
    startRecording();
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