// Create and inject the overlay
const createOverlay = () => {
  const overlay = document.createElement('div');
  overlay.id = 'ai-interview-copilot-overlay';
  overlay.className = 'ai-copilot-overlay';
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    max-width: 300px;
    font-family: Arial, sans-serif;
    display: none;
  `;
  document.body.appendChild(overlay);
  return overlay;
};

// Initialize WebSocket connection
let ws = null;
const connectWebSocket = () => {
  ws = new WebSocket('ws://localhost:3000');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'answer') {
      updateOverlay(data.text);
    }
  };

  ws.onclose = () => {
    setTimeout(connectWebSocket, 1000);
  };
};

// Update overlay content
const updateOverlay = (text) => {
  const overlay = document.getElementById('ai-interview-copilot-overlay');
  if (overlay) {
    overlay.textContent = text;
    overlay.style.display = 'block';
  }
};

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