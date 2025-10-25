import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { automation } from "./automation";
import { insertFriendSchema, insertSettingsSchema } from "@shared/schema";
import multer from "multer";
import { vncManager } from "./vnc-manager";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
  });

  // VNC WebSocket proxy server with comprehensive logging
  console.log('[VNC Proxy] Setting up VNC WebSocket server on path /vnc');
  const vncWss = new WebSocketServer({ 
    server: httpServer, 
    path: '/vnc',
    handleProtocols: (protocols, request) => {
      // Convert Set to Array for easier handling
      const protocolsArray = Array.from(protocols);
      console.log('[VNC Proxy] Protocols requested:', protocolsArray);
      // Accept binary subprotocol for noVNC compatibility, or accept any protocol
      if (protocolsArray.includes('binary')) {
        console.log('[VNC Proxy] Accepting binary protocol');
        return 'binary';
      }
      // Accept connection even without binary protocol
      const selectedProtocol = protocolsArray.length > 0 ? protocolsArray[0] : '';
      console.log('[VNC Proxy] Selected protocol:', selectedProtocol || '(none)');
      return selectedProtocol;
    }
  });
  
  vncWss.on('error', (error) => {
    console.error('[VNC Proxy] WebSocket Server error:', error);
  });
  
  vncWss.on('connection', (clientWs, request) => {
    console.log('[VNC Proxy] ✓ Client connected with protocol:', clientWs.protocol);
    console.log('[VNC Proxy] Request URL:', request.url);
    
    // Configure WebSocket for binary frames
    clientWs.binaryType = 'arraybuffer';
    
    if (!vncManager.getIsRunning()) {
      console.error('[VNC Proxy] VNC server not running');
      clientWs.close();
      return;
    }

    // Connect to VNC server
    const net = require('net');
    const vncSocket = new net.Socket();
    const vncPort = vncManager.getVNCPort();

    // Keepalive ping interval
    const pingInterval = setInterval(() => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.ping();
      }
    }, 30000); // Ping every 30 seconds

    vncSocket.connect(vncPort, 'localhost', () => {
      console.log('[VNC Proxy] Connected to VNC server');
    });

    // Forward data from VNC server to client (binary frames)
    vncSocket.on('data', (data: Buffer) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: true });
      }
    });

    // Forward data from client to VNC server (binary frames)
    clientWs.on('message', (data: any, isBinary: boolean) => {
      if (isBinary || Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        vncSocket.write(buffer);
      }
    });

    // Handle disconnections
    vncSocket.on('close', () => {
      console.log('[VNC Proxy] VNC server connection closed');
      clearInterval(pingInterval);
      clientWs.close();
    });

    vncSocket.on('error', (err: Error) => {
      console.error('[VNC Proxy] VNC socket error:', err);
      clearInterval(pingInterval);
      clientWs.close();
    });

    clientWs.on('close', () => {
      console.log('[VNC Proxy] Client disconnected');
      clearInterval(pingInterval);
      vncSocket.destroy();
    });

    clientWs.on('error', (err: Error) => {
      console.error('[VNC Proxy] Client socket error:', err);
      clearInterval(pingInterval);
      vncSocket.destroy();
    });

    clientWs.on('pong', () => {
      console.log('[VNC Proxy] Keepalive pong received');
    });
  });

  // Broadcast function
  function broadcast(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Friends endpoints
  app.get('/api/friends', async (req, res) => {
    try {
      const friends = await storage.getAllFriends();
      res.json(friends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/friends', async (req, res) => {
    try {
      const data = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(data);
      
      // Create initial submission record
      await storage.createSubmission({
        friendId: friend.id,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        logEntries: null,
      });
      
      broadcast('friend_added', friend);
      res.json(friend);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/friends/:id', async (req, res) => {
    try {
      await storage.deleteFriend(req.params.id);
      broadcast('friend_deleted', { id: req.params.id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/friends/import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const content = req.file.buffer.toString('utf-8');
      const usernames = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const imported = [];
      for (const username of usernames) {
        try {
          const friend = await storage.createFriend({ username, profilePictureUrl: null });
          await storage.createSubmission({
            friendId: friend.id,
            status: 'pending',
            startedAt: null,
            completedAt: null,
            errorMessage: null,
            logEntries: null,
          });
          imported.push(friend);
        } catch (error) {
          console.error(`Failed to import ${username}:`, error);
        }
      }

      broadcast('friends_imported', { count: imported.length });
      res.json({ imported: imported.length, friends: imported });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submissions endpoints
  app.get('/api/submissions', async (req, res) => {
    try {
      const friends = await storage.getAllFriends();
      const submissions = [];
      
      for (const friend of friends) {
        const submission = await storage.getSubmissionByFriendId(friend.id);
        if (submission) {
          submissions.push(submission);
        }
      }
      
      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/submissions/:friendId', async (req, res) => {
    try {
      const submission = await storage.getSubmissionByFriendId(req.params.friendId);
      res.json(submission || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Settings endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const data = insertSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateSettings(data);
      broadcast('settings_updated', settings);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Cookies endpoints
  app.delete('/api/cookies', async (req, res) => {
    try {
      await storage.clearCookies();
      broadcast('cookies_cleared', {});
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Processing endpoints
  app.post('/api/process/start', async (req, res) => {
    try {
      const { friendIds } = req.body;
      
      if (!Array.isArray(friendIds) || friendIds.length === 0) {
        return res.status(400).json({ error: 'friendIds must be a non-empty array' });
      }

      if (automation.getIsProcessing()) {
        return res.status(400).json({ error: 'Processing already in progress' });
      }

      // Start processing in background
      automation.processBatch(friendIds, (friendId, status, message) => {
        broadcast('status_update', {
          friendId,
          status,
          message,
          timestamp: new Date().toISOString(),
        });
      }).catch(error => {
        console.error('Batch processing error:', error);
        broadcast('processing_error', { error: error.message });
      });

      res.json({ success: true, message: 'Batch processing started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/process/stop', async (req, res) => {
    try {
      automation.stopProcessing();
      broadcast('processing_stopped', {});
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/process/status', async (req, res) => {
    try {
      const currentFriend = automation.getCurrentFriend();
      res.json({ 
        isProcessing: automation.getIsProcessing(),
        currentFriend: currentFriend ? { 
          id: currentFriend.id, 
          username: currentFriend.username 
        } : null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/process/screenshot', async (req, res) => {
    try {
      const screenshot = await automation.getCurrentScreenshot();
      if (!screenshot) {
        return res.status(404).json({ error: 'No active browser page' });
      }
      res.json({ screenshot: `data:image/png;base64,${screenshot}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/process/vnc-url', async (req, res) => {
    try {
      // Start VNC server on-demand if not already running
      if (!vncManager.getIsRunning()) {
        console.log('[VNC] VNC not running, starting it now...');
        try {
          await vncManager.start();
          console.log('[VNC] VNC server started successfully for on-demand connection');
        } catch (startError: any) {
          console.error('[VNC] Failed to start VNC server:', startError);
          return res.status(500).json({ error: 'Failed to start VNC server: ' + startError.message });
        }
      }
      
      // Build WebSocket URL based on request host
      const protocol = (req.secure || req.get('x-forwarded-proto') === 'https') ? 'wss' : 'ws';
      const host = req.get('host') || 'localhost:5000';
      const wsUrl = `${protocol}://${host}/vnc`;
      
      console.log(`[VNC] Protocol: ${protocol}, Host: ${host}, WebSocket URL: ${wsUrl}`);
      
      res.json({ 
        url: wsUrl,
        isRunning: vncManager.getIsRunning()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/process/manual-submit', async (req, res) => {
    try {
      const success = await automation.manualSubmit();
      broadcast('manual_action', { action: 'submit', success });
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/process/manual-refresh', async (req, res) => {
    try {
      const success = await automation.manualRefresh();
      broadcast('manual_action', { action: 'refresh', success });
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
