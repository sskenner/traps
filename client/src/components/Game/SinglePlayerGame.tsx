
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
    updateStage,
    updatePlayerPos,
    dropPlayer
  } = useTetris();
  
  const [gameOver, setGameOver] = useState(false);
  
  // Effect to update the game stage and handle piece falling
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const dropTime = 1000 - (level * 50); // Decrease interval as level increases
      
      const gameLoop = setInterval(() => {
        dropPlayer();
        updateStage();
      }, dropTime);
      
      return () => {
        clearInterval(gameLoop);
      };
    }
  }, [gameStarted, gameOver, level, dropPlayer, updateStage]);
  
  // Effect to check for game over
  useEffect(() => {
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
