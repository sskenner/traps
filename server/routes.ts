import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import SocketServer from "./socketServer";
import { setupGameServer } from "./gameServer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const socketServer = new SocketServer(httpServer);
  
  // Setup game server
  setupGameServer(app);
  
  // WebSocket upgrade endpoint
  app.get('/ws', (req: Request, res: Response) => {
    // This endpoint will be upgraded by the WebSocket server
    // We'll return a simple message if the WebSocket upgrade doesn't happen
    res.status(426).send('Upgrade Required');
  });
  
  // API routes
  app.get('/api/status', (req, res) => {
    res.json({ status: 'online' });
  });
  
  return httpServer;
}
