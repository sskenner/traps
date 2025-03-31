import type { Express } from "express";

export interface GameState {
  score: number;
  level: number;
  lines: number;
  nextPiece: string;
}

export interface ActiveGame {
  id: string;
  player1: string;
  player2: string | null;
  player1State: GameState;
  player2State: GameState | null;
  lastActivity: number;
}

// In-memory storage for game sessions
const activeGames: Map<string, ActiveGame> = new Map();

export function setupGameServer(app: Express) {
  // Create a new game
  app.post('/api/games', (req, res) => {
    const { player1 } = req.body;
    
    if (!player1) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    
    // Generate unique game ID
    const gameId = generateGameId();
    
    // Initialize game state
    const game: ActiveGame = {
      id: gameId,
      player1,
      player2: null,
      player1State: {
        score: 0,
        level: 0,
        lines: 0,
        nextPiece: 'I'
      },
      player2State: null,
      lastActivity: Date.now()
    };
    
    // Store game
    activeGames.set(gameId, game);
    
    // Return game info
    res.status(201).json({ game });
  });
  
  // Join an existing game
  app.post('/api/games/:id/join', (req, res) => {
    const { id } = req.params;
    const { player2 } = req.body;
    
    if (!player2) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    
    // Check if game exists
    if (!activeGames.has(id)) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = activeGames.get(id)!;
    
    // Check if game is already full
    if (game.player2) {
      return res.status(400).json({ error: 'Game is already full' });
    }
    
    // Add player 2
    game.player2 = player2;
    game.player2State = {
      score: 0,
      level: 0,
      lines: 0,
      nextPiece: 'I'
    };
    game.lastActivity = Date.now();
    
    // Return updated game info
    res.json({ game });
  });
  
  // Get game status
  app.get('/api/games/:id', (req, res) => {
    const { id } = req.params;
    
    // Check if game exists
    if (!activeGames.has(id)) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = activeGames.get(id)!;
    
    // Return game info
    res.json({ game });
  });
  
  // Update game state
  app.put('/api/games/:id/state', (req, res) => {
    const { id } = req.params;
    const { player, state } = req.body;
    
    if (!player || !state) {
      return res.status(400).json({ error: 'Player and state are required' });
    }
    
    // Check if game exists
    if (!activeGames.has(id)) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = activeGames.get(id)!;
    
    // Update appropriate player state
    if (player === game.player1) {
      game.player1State = state;
    } else if (player === game.player2) {
      game.player2State = state;
    } else {
      return res.status(400).json({ error: 'Player not in game' });
    }
    
    game.lastActivity = Date.now();
    
    // Return updated game info
    res.json({ game });
  });
  
  // Send garbage lines to opponent
  app.post('/api/games/:id/garbage', (req, res) => {
    const { id } = req.params;
    const { player, lines } = req.body;
    
    if (!player || !lines) {
      return res.status(400).json({ error: 'Player and lines are required' });
    }
    
    // Check if game exists
    if (!activeGames.has(id)) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = activeGames.get(id)!;
    
    // Identify opponent
    let opponent = null;
    if (player === game.player1) {
      opponent = game.player2;
    } else if (player === game.player2) {
      opponent = game.player1;
    } else {
      return res.status(400).json({ error: 'Player not in game' });
    }
    
    if (!opponent) {
      return res.status(400).json({ error: 'No opponent in game' });
    }
    
    game.lastActivity = Date.now();
    
    // In a real implementation, this would trigger an event to the opponent
    // Since we're using WebSockets separately, this is just a placeholder
    res.json({ success: true });
  });
  
  // Clean up inactive games periodically
  setInterval(() => {
    const now = Date.now();
    const MAX_INACTIVE_TIME = 30 * 60 * 1000; // 30 minutes
    
    activeGames.forEach((game, id) => {
      if (now - game.lastActivity > MAX_INACTIVE_TIME) {
        activeGames.delete(id);
      }
    });
  }, 10 * 60 * 1000); // Check every 10 minutes
}

// Generate a random game ID
function generateGameId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}
