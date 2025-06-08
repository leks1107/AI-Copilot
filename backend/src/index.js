require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { OpenAI } = require('openai');
const winston = require('winston');
const TranscriptionServer = require('./ws/transcription');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize WebSocket servers
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Initialize transcription server
const transcriptionServer = new TranscriptionServer(httpServer);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData } = req.body;
    // TODO: Implement audio transcription using Whisper API
    res.json({ text: 'Transcribed text will appear here' });
  } catch (error) {
    logger.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/api/buildPrompt', async (req, res) => {
  try {
    const { transcript, resume, context } = req.body;
    // TODO: Implement prompt building logic
    res.json({ prompt: 'Generated prompt will appear here' });
  } catch (error) {
    logger.error('Prompt building error:', error);
    res.status(500).json({ error: 'Failed to build prompt' });
  }
});

app.post('/api/getAnswer', async (req, res) => {
  try {
    const { prompt } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI interview assistant helping the user with their interview." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    res.json({ answer: completion.choices[0].message.content });
  } catch (error) {
    logger.error('GPT API error:', error);
    res.status(500).json({ error: 'Failed to get answer from GPT' });
  }
});

app.post('/api/uploadResume', async (req, res) => {
  try {
    const { resumeData } = req.body;
    // TODO: Implement resume parsing and storage
    res.json({ message: 'Resume uploaded successfully' });
  } catch (error) {
    logger.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.on('audioData', async (data) => {
    try {
      // Handle real-time audio data
      // TODO: Implement real-time audio processing
    } catch (error) {
      logger.error('WebSocket audio processing error:', error);
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 