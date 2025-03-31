import React, { useState, useEffect, useCallback } from 'react';
import TetrisBoard from './TetrisBoard';
import ScoreBoard from './ScoreBoard';
import NextPiece from './NextPiece';
import Controls from './Controls';
import GameOver from '../Menu/GameOver';
import { useTetris } from '@/lib/stores/useTetris';

interface Props {
  onMainMenu: () => void;
}

const SinglePlayerGame: React.FC<Props> = ({ onMainMenu }) => {
  const {
    player,
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
    if (gameStarted && !gameOver) {
      console.log("Game loop is running");
      const gameLoop = setInterval(() => {
        updateStage();
      }, 100);
      
      return () => {
        clearInterval(gameLoop);
      };
    }
  }, [gameStarted, gameOver, updateStage]);
  
  // Effect to check for game over
  useEffect(() => {
    // Check if the player's position is at the top and has collided
    if (player.collided && player.pos.y < 1 && gameStarted) {
      console.log("Game over detected");
      setGameOver(true);
    }
  }, [player, gameStarted]);
  
  // Start a new game
  const handleStartGame = useCallback(() => {
    console.log("Starting single player game");
    setGameOver(false);
    startGame();
  }, [startGame]);
  
  // Reset the current game
  const handleResetGame = useCallback(() => {
    console.log("Resetting game");
    resetGame();
    setGameOver(false);
  }, [resetGame]);
  
  // Restart after game over
  const handleRestartGame = useCallback(() => {
    console.log("Restarting game after game over");
    resetGame();
    setGameOver(false);
    startGame();
  }, [resetGame, startGame]);
  
  console.log("SinglePlayerGame component rendering, gameStarted:", gameStarted);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <TetrisBoard isMultiplayer={false} isOpponent={false} />
        </div>
        
        <div className="w-full md:w-64 space-y-4">
          <ScoreBoard score={score} rows={rows} level={level} />
          
          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2 text-white">Next Piece</h3>
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
            onClick={onMainMenu} 
            className="w-full py-2 text-sm text-blue-300 hover:text-blue-100"
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
          onMainMenu={onMainMenu}
        />
      )}
    </div>
  );
};

export default SinglePlayerGame;