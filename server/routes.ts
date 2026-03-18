import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { translationService } from "./services/translation";
import { speechRecognitionService } from "./services/speechRecognition";
import { signalingMessageSchema, translationMessageSchema, insertCallSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // REST API Routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertCallSessionSchema.parse(req.body);
      const session = await storage.createCallSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getCallSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  app.post("/api/sessions/:id/end", async (req, res) => {
    try {
      const session = await storage.updateCallSession(req.params.id, {
        status: "ended",
        endedAt: new Date(),
      });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      
      if (!translationService.isConfigured()) {
        return res.status(503).json({ error: "Translation service not configured" });
      }

      const result = await translationService.translateText(text, targetLanguage, sourceLanguage);
      res.json(result);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  app.post("/api/speech-to-text", async (req, res) => {
    try {
      const { transcript, languageCode, confidence } = req.body;
      
      if (!speechRecognitionService.isConfigured()) {
        return res.status(503).json({ error: "Speech recognition service not configured" });
      }

      const result = await speechRecognitionService.recognizeSpeech(transcript, languageCode, confidence);
      res.json(result);
    } catch (error) {
      console.error("Speech recognition error:", error);
      res.status(500).json({ error: "Speech recognition failed" });
    }
  });

  app.get("/api/twilio-token", async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return res.status(503).json({ error: "Twilio not configured" });
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
      }
    );

    const data = await response.json();
    res.json({ iceServers: data.ice_servers });
  } catch (error) {
    console.error("Twilio token error:", error);
    res.status(500).json({ error: "Failed to get TURN credentials" });
  }
});

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      services: {
        translation: translationService.isConfigured(),
        speechRecognition: speechRecognitionService.isConfigured(),
      }
    });
  });

  // WebSocket Server for WebRTC signaling and real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections by room
  const rooms = new Map<string, Set<WebSocket>>();
  const connectionRooms = new Map<WebSocket, string>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle signaling messages (WebRTC)
        if (message.type === 'signaling') {
          const signalingMsg = signalingMessageSchema.parse(message.data);
          handleSignalingMessage(ws, signalingMsg);
        }
        
        // Handle translation messages
        else if (message.type === 'translation') {
          const translationMsg = translationMessageSchema.parse(message.data);
          await handleTranslationMessage(ws, translationMsg);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      // Clean up room connections
      const roomId = connectionRooms.get(ws);
      console.log(`🔌 WebSocket closing for room: ${roomId || 'unknown'}`);
      
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          room.delete(ws);
          console.log(`👋 User left room ${roomId}. Remaining participants: ${room.size}`);
          
          if (room.size === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
          } else {
            // Notify other participants that someone left
            broadcastToRoom(roomId, {
              type: 'signaling',
              data: {
                type: 'leave-room',
                roomId,
                senderId: 'system',
                data: null,
              }
            }, ws);
          }
        }
        connectionRooms.delete(ws);
      }
      console.log(`📊 After close - Active rooms: ${rooms.size}`);
    });
  });

  function handleSignalingMessage(ws: WebSocket, message: any) {
    const { roomId, type } = message;

    if (type === 'join-room') {
      console.log(`🚪 User joining room: ${roomId}`);
      
      // Add connection to room
      if (!rooms.has(roomId)) {
        console.log(`📦 Creating new room: ${roomId}`);
        rooms.set(roomId, new Set());
      }
      
      const room = rooms.get(roomId)!;
      const isFirstParticipant = room.size === 0;
      const role = isFirstParticipant ? 'caller' : 'callee';
      
      room.add(ws);
      connectionRooms.set(ws, roomId);
      
      console.log(`👤 Assigned role: ${role}, Room now has ${room.size} participant(s)`);
      console.log(`📊 Active rooms: ${rooms.size}, Total connections: ${connectionRooms.size}`);
      
      // Send role assignment to the joining user
      ws.send(JSON.stringify({
        type: 'signaling',
        data: {
          type: 'room-joined',
          roomId,
          role: role,
          participantCount: room.size
        }
      }));
      
      // Notify others in the room that someone joined
      broadcastToRoom(roomId, { 
        type: 'signaling', 
        data: {
          type: 'participant-joined',
          roomId,
          participantCount: room.size
        }
      }, ws);
      
      console.log(`✅ Room join complete for ${roomId}`);
    } else {
      // Forward signaling messages to other participants in the room
      console.log(`📶 Forwarding signaling message: ${message.type} in room ${roomId}`);
      broadcastToRoom(roomId, { type: 'signaling', data: message }, ws);
    }
  }

  async function handleTranslationMessage(ws: WebSocket, message: any) {
    try {
      console.log('📨 Received translation message:', JSON.stringify(message, null, 2));
      const { type, data, sessionId, speakerId } = message;

      if (type === 'speech-start') {
        // Broadcast that someone started speaking
        // Use sessionId as roomId since they match
        const roomId = sessionId;
        if (rooms.has(roomId)) {
          broadcastToRoom(roomId, { type: 'translation', data: message }, ws);
        }
      } else if (type === 'speech-end') {
        // Process speech recognition and translation
        console.log('🎯 Processing speech-end with data:', data);
        const { text: transcript, sourceLanguage, targetLanguage, speechCode, confidence } = data;
        
        if (!speechRecognitionService.isConfigured() || !translationService.isConfigured()) {
          ws.send(JSON.stringify({
            type: 'translation',
            data: {
              type: 'error',
              message: 'Translation services not configured'
            }
          }));
          return;
        }

        // Use the languages from the message, with fallbacks
        const srcLang = sourceLanguage || 'en';
        const tgtLang = targetLanguage || 'vi';
        
        console.log(`🌐 Translating from ${srcLang} to ${tgtLang}`);

        try {
          // Validate speech recognition result (transcript comes from browser)
          const speechResult = await speechRecognitionService.recognizeSpeech(transcript, speechCode || 'en-US', confidence);
          
          if (speechResult.transcript) {
            // Translate the recognized text using the specified languages
            const translationResult = await translationService.translateText(
              speechResult.transcript, 
              tgtLang, 
              srcLang
            );
            console.log('✅ Translation completed:', translationResult.translatedText);

            // Store translation in database
            console.log('💾 Storing translation in database');
            await storage.createTranslation({
              sessionId,
              originalText: speechResult.transcript,
              translatedText: translationResult.translatedText,
              sourceLanguage: srcLang,
              targetLanguage: tgtLang,
              speakerId: speakerId,
            });

            // Broadcast translation result to all participants
            // Use sessionId as roomId since they match
            const roomId = sessionId;
            if (rooms.has(roomId)) {
              const resultMessage = {
                type: 'translation',
                data: {
                  type: 'translation-result',
                  originalText: speechResult.transcript,
                  translatedText: translationResult.translatedText,
                  sourceLanguage: srcLang,
                  targetLanguage: tgtLang,
                  confidence: speechResult.confidence,
                  speakerId: speakerId,
                }
              };
              
              console.log('📡 Broadcasting translation result:', JSON.stringify(resultMessage, null, 2));
              broadcastToRoom(roomId, resultMessage);
              
              // Also send directly to the sender to ensure they see their own translation
              ws.send(JSON.stringify(resultMessage));
              console.log('✅ Translation broadcast completed');
            } else {
              console.error('❌ No room found for session:', sessionId);
            }
          }
        } catch (error) {
          console.error('Translation processing error:', error);
          ws.send(JSON.stringify({
            type: 'translation',
            data: {
              type: 'error',
              message: 'Failed to process speech and translation'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Translation message handling error:', error);
    }
  }

  function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const room = rooms.get(roomId);
    if (room) {
      room.forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  return httpServer;
}
