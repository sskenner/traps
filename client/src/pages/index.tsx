import React, { useState, useCallback, useEffect } from 'react';
import { useTetris } from '@/lib/stores/useTetris';
import TetrisBoard from '@/components/Game/TetrisBoard';
import ScoreBoard from '@/components/Game/ScoreBoard';
import NextPiece from '@/components/Game/NextPiece';
import Controls from '@/components/Game/Controls';
import GameOver from '@/components/Menu/GameOver';
import MainMenu from '@/components/Menu/MainMenu';
import MultiplayerLobby from '@/components/Multiplayer/MultiplayerLobby';

enum GameMode {
  MENU,
  SINGLE_PLAYER,
  MULTIPLAYER
}

const HomePage: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MENU);
  const {
    player,
    stage,
    score,
    rows,
    level,
    nextPiece,
    gameStarted,
    startGame,
    resetGame,
    updateStage
  } = useTetris();
  
  const [gameOver, setGameOver] = useState(false);
  
  // Effect to update the game stage
  useEffect(() => {
    if (gameStarted && !gameOver && gameMode === GameMode.SINGLE_PLAYER) {
      const gameLoop = setInterval(() => {
        updateStage();
      }, 100);
      
      return () => {
        clearInterval(gameLoop);
      };
    }
  }, [gameStarted, gameOver, updateStage, gameMode]);
  
  // Effect to check for game over
  useEffect(() => {
    // Check if the player's position is at the top and has collided
    if (player.collided && player.pos.y < 1 && gameStarted) {
      setGameOver(true);
    }
  }, [player, gameStarted]);
  
  // Start a new game
  const handleStartGame = useCallback(() => {
    console.log("Starting game");
    setGameOver(false);
    startGame();
  }, [startGame]);
  
  // Reset the current game
  const handleResetGame = useCallback(() => {
    resetGame();
    setGameOver(false);
  }, [resetGame]);
  
  // Restart after game over
  const handleRestartGame = useCallback(() => {
    resetGame();
    setGameOver(false);
    startGame();
  }, [resetGame, startGame]);
  
  // Return to main menu
  const handleMainMenu = useCallback(() => {
    resetGame();
    setGameOver(false);
    setGameMode(GameMode.MENU);
  }, [resetGame]);
  
  // Start single player mode
  const handleStartSinglePlayer = useCallback(() => {
    console.log("Starting single player mode");
    setGameMode(GameMode.SINGLE_PLAYER);
    resetGame();
  }, [resetGame]);
  
  // Start multiplayer mode
  const handleStartMultiplayer = useCallback(() => {
    console.log("Starting multiplayer mode");
    setGameMode(GameMode.MULTIPLAYER);
    resetGame();
  }, [resetGame]);
  
  // Render the appropriate game mode
  switch (gameMode) {
    case GameMode.MENU:
      return (
        <MainMenu 
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
        />
      );
      
    case GameMode.SINGLE_PLAYER:
      return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black p-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <TetrisBoard />
            </div>
            
            <div className="w-full md:w-64 space-y-4">
              <ScoreBoard score={score} rows={rows} level={level} />
              
              <div className="bg-card p-4 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-2">Next Piece</h3>
                <div className="flex justify-center">
                  <NextPiece nextPiece={nextPiece} />
                </div>
              </div>
              
              <Controls 
                onStartGame={handleStartGame}
                onResetGame={handleResetGame}
                gameStarted={gameStarted}
                gameOver={gameOver}
              />
              
              <button 
                onClick={handleMainMenu} 
                className="w-full py-2 text-sm text-blue-500 hover:text-blue-400"
              >
                Return to Main Menu
              </button>
            </div>
          </div>
          
          {gameOver && (
            <GameOver 
              score={score}
              level={level}
              rows={rows}
              onRestart={handleRestartGame}
              onMainMenu={handleMainMenu}
            />
          )}
        </div>
      );
      
    case GameMode.MULTIPLAYER:
      return <MultiplayerLobby onBack={handleMainMenu} />;
      
    default:
      return null;
  }
};

export default HomePage;
