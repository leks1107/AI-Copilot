# AI Interview Copilot

AI-powered real-time interview assistant that helps you excel in your interviews by providing intelligent responses and guidance.

## Features

- 🎤 Real-time audio transcription using AssemblyAI
- 🤖 GPT-4 powered intelligent responses
- 📝 Resume context integration
- 🌐 Multi-language support (EN/RU)
- 🎯 Stealth mode for discreet assistance
- 🎥 Works with major video platforms (Zoom, Meet, Teams)

## Project Structure

```
/ai-interview-copilot/
├── frontend/          # React + Tailwind frontend
│   └── src/
│       ├── components/
│       │   ├── MicStreamer.js    # Real-time audio streaming
│       │   ├── AnswerOverlay.js  # Response display
│       │   ├── ResumeUploader.js # Resume handling
│       │   └── Settings.js       # User preferences
│       └── App.js
│
├── backend/           # Node.js + Express backend
│   └── src/
│       ├── ws/
│       │   └── transcription.js  # WebSocket server for AssemblyAI
│       └── index.js
│
├── extension/         # Chrome Extension
├── .env.example       # Environment variables template
└── docker-compose.yml # Docker configuration
```

## Prerequisites

- Node.js >= 16.x
- npm >= 8.x
- Chrome browser
- OpenAI API key
- AssemblyAI API key

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-interview-copilot.git
cd ai-interview-copilot
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

Required environment variables:
```
OPENAI_API_KEY=your_openai_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
PORT=3000
FRONTEND_URL=http://localhost:3001
```

3. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Extension
cd ../extension
npm install
```

4. Start the development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

5. Load the Chrome Extension:
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the `extension` directory

## Real-time Transcription

The project uses AssemblyAI's real-time transcription API for low-latency speech recognition:

1. Audio is captured from the microphone using Web Audio API
2. Audio is downsampled to 16kHz and converted to PCM
3. Audio chunks are sent via WebSocket to the backend
4. Backend forwards audio to AssemblyAI's WebSocket API
5. Transcriptions are received in real-time (latency < 700ms)
6. Final transcriptions are sent to GPT-4 for response generation

## Usage

1. Upload your resume through the web interface
2. Start your video interview
3. Click the microphone button to start real-time transcription
4. Speak naturally - the system will transcribe and respond in real-time
5. Responses appear in the overlay (toggle with Ctrl+Space)

## Development

- Frontend runs on `http://localhost:3001`
- Backend runs on `http://localhost:3000`
- WebSocket server runs on `ws://localhost:3000/ws/transcription`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 