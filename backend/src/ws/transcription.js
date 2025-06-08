const WebSocket = require('ws');
const buildPrompt = require('../utils/buildPrompt');
const getAnswer = require('../utils/getAnswer');

class TranscriptionServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/transcription' });
    this.assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
    
    // Store resume data and active connections
    this.resumeMap = new Map();
    this.activeConnections = new Map();
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected to transcription server');
      const clientId = this.generateClientId();
      this.activeConnections.set(clientId, ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.event === 'audio_chunk') {
            // Initialize AssemblyAI WebSocket if not exists
            if (!this.activeConnections.get(clientId).assemblyAIWs) {
              this.activeConnections.get(clientId).assemblyAIWs = 
                await this.connectToAssemblyAI(ws, clientId);
            }
            
            // Forward audio chunk to AssemblyAI
            this.activeConnections.get(clientId).assemblyAIWs.send(JSON.stringify({
              audio_data: data.audio
            }));
          } else if (data.event === 'resume_upload') {
            // Store resume data for this client
            this.resumeMap.set(clientId, data.resume);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          this.sendError(ws, 'Failed to process message');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected:', clientId);
        this.cleanupConnection(clientId);
      });
    });
  }

  async connectToAssemblyAI(clientWs, clientId) {
    const assemblyAIWs = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000', {
      headers: {
        'Authorization': this.assemblyAIKey
      }
    });

    assemblyAIWs.on('open', () => {
      console.log('Connected to AssemblyAI for client:', clientId);
      this.sendStatus(clientWs, 'connected');
    });

    assemblyAIWs.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.message_type === 'FinalTranscript') {
          // Get resume data for this client
          const resumeData = this.resumeMap.get(clientId);
          
          try {
            // Build prompt and get GPT-4 response
            const prompt = buildPrompt(message.text, resumeData);
            const answer = await getAnswer(prompt);

            // Send answer to client
            clientWs.send(JSON.stringify({
              event: 'answer_ready',
              text: answer
            }));
          } catch (error) {
            console.error('Error getting GPT response:', error);
            this.sendError(clientWs, 'Failed to get GPT response');
          }
        }
      } catch (error) {
        console.error('Error processing AssemblyAI message:', error);
        this.sendError(clientWs, 'Failed to process transcription');
      }
    });

    assemblyAIWs.on('error', (error) => {
      console.error('AssemblyAI WebSocket error:', error);
      this.sendError(clientWs, 'AssemblyAI connection error');
    });

    assemblyAIWs.on('close', () => {
      console.log('AssemblyAI connection closed for client:', clientId);
      this.sendStatus(clientWs, 'disconnected');
    });

    return assemblyAIWs;
  }

  cleanupConnection(clientId) {
    const connection = this.activeConnections.get(clientId);
    if (connection) {
      if (connection.assemblyAIWs) {
        connection.assemblyAIWs.close();
      }
      this.activeConnections.delete(clientId);
      this.resumeMap.delete(clientId);
    }
  }

  sendError(ws, message) {
    ws.send(JSON.stringify({
      event: 'error',
      text: message
    }));
  }

  sendStatus(ws, status) {
    ws.send(JSON.stringify({
      event: 'status',
      status: status
    }));
  }

  generateClientId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

module.exports = TranscriptionServer; 