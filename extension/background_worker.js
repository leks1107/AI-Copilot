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

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
}); 