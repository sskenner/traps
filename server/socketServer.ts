import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { randomUUID } from 'crypto';
import { log } from './vite'; // Import the log function for consistent logging

interface Room {
  id: string;
  players: string[];
  sockets: Map<string, WebSocket>;
}

class SocketServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  
  constructor(server: Server) {
    // Configure WebSocket server with path matching our endpoint
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true,
      perMessageDeflate: false // Disable per-message deflate to reduce latency
    });
    
    const isDev = process.env.NODE_ENV !== 'production';
    const wsProtocol = isDev ? 'ws' : 'wss';
    const wsHost = isDev ? '0.0.0.0:5000' : 'traps2.replit.app';
    
    log(`WebSocket server created and listening on path: /ws`, 'websocket');
    log(`WebSocket URL: ${wsProtocol}://${wsHost}/ws`, 'websocket');
    this.setupWebSocketServer();
  }
  
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      log('New WebSocket client connected', 'websocket');
      log(`Connection from: ${req.url || 'unknown'}`, 'websocket');
      
      // Send the initial rooms list
      this.sendRoomsList(ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          log(`Received message: ${JSON.stringify(data)}`, 'websocket');
          this.handleMessage(ws, data);
        } catch (error) {
          log(`Error parsing message: ${error}`, 'websocket');
        }
      });
      
      ws.on('close', () => {
        log('Client disconnected', 'websocket');
        this.handleClientDisconnect(ws);
      });
      
      ws.on('error', (error) => {
        log(`WebSocket error: ${error}`, 'websocket');
      });
    });
    
    this.wss.on('error', (error) => {
      log(`WebSocket server error: ${error}`, 'websocket');
    });
    
    log('WebSocket server initialized', 'websocket');
  }
  
  private handleMessage(ws: WebSocket, data: any) {
    console.log('Handling WebSocket message:', data.type);
    
    switch (data.type) {
      case 'list_rooms':
        this.sendRoomsList(ws);
        break;
        
      case 'create_room':
        this.createRoom(ws, data.room, data.username);
        break;
        
      case 'join_room':
        this.joinRoom(ws, data.room, data.username);
        break;
        
      case 'leave_room':
        this.leaveRoom(ws, data.room, data.username);
        break;
        
      case 'request_start':
        this.handleGameStart(data.room);
        break;
        
      case 'game_update':
      case 'garbage_lines':
        // Forward these messages to all clients in the room
        this.broadcastToRoom(data.room, data);
        break;
    }
  }
  
  private sendRoomsList(ws: WebSocket) {
    const roomsList = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      players: room.players
    }));
    
    ws.send(JSON.stringify({
      type: 'rooms_list',
      rooms: roomsList
    }));
  }
  
  private createRoom(ws: WebSocket, roomId: string, username: string) {
    // Generate a room ID if not provided
    const id = roomId || this.generateRoomId();
    
    // Check if room already exists
    if (this.rooms.has(id)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room already exists'
      }));
      return;
    }
    
    // Create the room
    const room: Room = {
      id,
      players: [username],
      sockets: new Map([[username, ws]])
    };
    
    this.rooms.set(id, room);
    
    // Send success response
    ws.send(JSON.stringify({
      type: 'join_success',
      room: id
    }));
    
    // Update room info
    this.broadcastRoomUpdate(id);
    
    // Broadcast updated rooms list to all clients
    this.broadcastRoomsList();
  }
  
  private joinRoom(ws: WebSocket, roomId: string, username: string) {
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room does not exist'
      }));
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Check if room is full
    if (room.players.length >= 2) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room is full'
      }));
      return;
    }
    
    // Check if username is already in room
    if (room.players.includes(username)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Username already in use in this room'
      }));
      return;
    }
    
    // Add player to room
    room.players.push(username);
    room.sockets.set(username, ws);
    
    // Send success response
    ws.send(JSON.stringify({
      type: 'join_success',
      room: roomId
    }));
    
    // Update room info
    this.broadcastRoomUpdate(roomId);
    
    // Broadcast updated rooms list to all clients
    this.broadcastRoomsList();
  }
  
  private leaveRoom(ws: WebSocket, roomId: string, username: string) {
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Remove player from room
    room.players = room.players.filter(p => p !== username);
    room.sockets.delete(username);
    
    // Notify others in the room
    this.broadcastToRoom(roomId, {
      type: 'player_left',
      username
    });
    
    // Remove room if empty
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else {
      // Update room info
      this.broadcastRoomUpdate(roomId);
    }
    
    // Broadcast updated rooms list to all clients
    this.broadcastRoomsList();
  }
  
  private handleGameStart(roomId: string) {
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Only start if there are 2 players
    if (room.players.length === 2) {
      // Start a 3 second countdown
      this.broadcastToRoom(roomId, {
        type: 'game_start',
        countdown: 3
      });
    }
  }
  
  private broadcastToRoom(roomId: string, data: any) {
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Send message to all clients in room
    room.sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    });
  }
  
  private broadcastRoomUpdate(roomId: string) {
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Send room info to all clients in room
    this.broadcastToRoom(roomId, {
      type: 'room_update',
      room: roomId,
      players: room.players
    });
  }
  
  private broadcastRoomsList() {
    const roomsList = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      players: room.players
    }));
    
    // Send to all connected clients
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'rooms_list',
          rooms: roomsList
        }));
      }
    });
  }
  
  private handleClientDisconnect(ws: WebSocket) {
    // Find and remove client from all rooms
    this.rooms.forEach((room, roomId) => {
      let username = null;
      
      // Find the username associated with this socket
      room.sockets.forEach((socket, user) => {
        if (socket === ws) {
          username = user;
        }
      });
      
      // If found, remove from room
      if (username) {
        this.leaveRoom(ws, roomId, username);
      }
    });
  }
  
  private generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export default SocketServer;