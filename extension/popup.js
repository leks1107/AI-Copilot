let isRecording = false;

// Get DOM elements
const toggleButton = document.getElementById('toggleButton');
const statusText = document.getElementById('status');
const languageSelect = document.getElementById('language');
const fontSizeSelect = document.getElementById('fontSize');

// Load saved settings
chrome.storage.local.get(['language', 'fontSize'], (result) => {
  if (result.language) {
    languageSelect.value = result.language;
  }
  if (result.fontSize) {
    fontSizeSelect.value = result.fontSize;
  }
});

// Save settings when changed
languageSelect.addEventListener('change', () => {
  chrome.storage.local.set({ language: languageSelect.value });
});

fontSizeSelect.addEventListener('change', () => {
  chrome.storage.local.set({ fontSize: fontSizeSelect.value });
});

// Toggle recording
toggleButton.addEventListener('click', () => {
  isRecording = !isRecording;
  
  if (isRecording) {
    chrome.runtime.sendMessage({ type: 'startRecording' });
    toggleButton.textContent = 'Stop Recording';
    toggleButton.classList.remove('start-button');
    toggleButton.classList.add('stop-button');
    statusText.textContent = 'Recording...';
  } else {
    chrome.runtime.sendMessage({ type: 'stopRecording' });
    toggleButton.textContent = 'Start Recording';
    toggleButton.classList.remove('stop-button');
    toggleButton.classList.add('start-button');
    statusText.textContent = 'Ready to start';
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'recordingError') {
    statusText.textContent = 'Error: ' + request.error;
    isRecording = false;
    toggleButton.textContent = 'Start Recording';
    toggleButton.classList.remove('stop-button');
    toggleButton.classList.add('start-button');
  }
}); 