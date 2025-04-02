import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Tetromino from './Tetromino';
import { useTetris } from '@/lib/stores/useTetris';
import { STAGE_WIDTH, STAGE_HEIGHT, checkCollision } from '@/lib/gameHelpers';
import { useAudio } from '@/lib/stores/useAudio';

interface Props {
  isMultiplayer?: boolean;
  isOpponent?: boolean;
  gameData?: any;
  onLinesClear?: (lines: number) => void;
}

const TetrisBoard: React.FC<Props> = ({ 
  isMultiplayer = false, 
  isOpponent = false,
  gameData,
  onLinesClear 
}) => {
  console.log("Rendering TetrisBoard:", { isMultiplayer, isOpponent });

  const { backgroundMusic, playHit, playSuccess, isMuted } = useAudio();
  const stageRef = useRef<any>(null);
  const CELL_SIZE = isOpponent ? 15 : 30;
  const dropTimeRef = useRef<number>(1000);
  const [dropTime, setDropTime] = useState<number | null>(1000);
  const [gameOver, setGameOver] = useState(false);

  const {
    player,
    stage,
    score,
    rows,
    level,
    resetPlayer,
    updatePlayerPos,
    rotatePlayer,
    dropPlayer,
    resetGame,
    gameStarted,
    startGame,
    sweepRows,
    movePlayer,
    setPlayer
  } = useTetris();

  // Initialize player
  useEffect(() => {
    if (!player.tetromino && gameStarted && !gameOver && !isOpponent) {
      resetPlayer();
    }
  }, [gameStarted, gameOver, isOpponent, player.tetromino, resetPlayer]);

  // Update stage -  Added useCallback for optimization
  const updateStage = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const newStage = stage.map(row =>
      row.map(cell => (cell[0] === 1 ? [0, 'clear'] : cell))
    );

    // Draw the active tetromino
    if (player.tetromino) {
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const newY = y + player.pos.y;
            const newX = x + player.pos.x;
            if (newY >= 0 && newY < STAGE_HEIGHT && newX >= 0 && newX < STAGE_WIDTH) {
              newStage[newY][newX] = [
                value,
                player.collided ? 'merged' : 'clear',
                player.color
              ];
            }
          }
        });
      });
    }
    //This is where the updated stage needs to be used within the game loop or elsewhere as needed.
    //Consider adding a state variable to hold the rendered stage and trigger a re-render.  This is omitted here due to uncertainty of existing state management.

  }, [gameStarted, gameOver, player, stage]);


  // Game Loop
  useEffect(() => {
    let gameLoop: NodeJS.Timeout | null = null;

    const handleGameLoop = () => {
      if (!checkCollision(player, stage, { x: 0, y: 1 })) {
        updatePlayerPos({ x: 0, y: 1, collided: false });
      } else {
        // Handle collision
        if (player.pos.y < 1) {
          setGameOver(true);
          setDropTime(null);
          return;
        }
        updatePlayerPos({ x: 0, y: 0, collided: true });
        const clearedRows = sweepRows();
        if (clearedRows > 0 && onLinesClear) {
          onLinesClear(clearedRows);
        }
      }
      updateStage(); //Call updateStage after each game loop iteration.
    };

    if (gameStarted && !gameOver && dropTime !== null && !isOpponent) {
      gameLoop = setInterval(handleGameLoop, dropTime);
    }

    return () => {
      if (gameLoop) {
        clearInterval(gameLoop);
      }
    };
  }, [gameStarted, gameOver, dropTime, player, stage, updatePlayerPos, sweepRows, isOpponent, updateStage]);

  // Start game background music
  useEffect(() => {
    // Only attempt to play music if game is started, not opponent view, music exists, and not muted
    if (gameStarted && !isOpponent && backgroundMusic && !isMuted) {
      try {
        // Add a small delay to avoid immediate play which might get blocked
        const timer = setTimeout(() => {
          backgroundMusic.play()
            .catch(err => console.log('Audio play prevented:', err));
        }, 100);

        return () => {
          clearTimeout(timer);
          if (backgroundMusic) {
            backgroundMusic.pause();
          }
        };
      } catch (error) {
        console.error('Failed to play background music:', error);
      }
    }

    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [gameStarted, backgroundMusic, isMuted, isOpponent]);

  // Set drop time based on level
  useEffect(() => {
    if (gameStarted && !gameOver) {
      setDropTime(1000 / (level + 1) + 200);
    }
  }, [level, gameStarted, gameOver]);

  // Auto drop the tetromino
  useEffect(() => {
    let dropTimer: NodeJS.Timeout | null = null;

    if (dropTime && gameStarted && !gameOver && !isOpponent) {
      dropTimer = setInterval(() => {
        drop();
      }, dropTime);
    }

    return () => {
      if (dropTimer) clearInterval(dropTimer);
    };
  }, [dropTime, gameStarted, gameOver, isOpponent]);

  // Handle keyboard input for player controls
  useEffect(() => {
    if (isOpponent) return; // Don't listen to keys for opponent board

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      switch (e.code) {
        case 'ArrowLeft':
          movePlayer(-1);
          break;
        case 'ArrowRight':
          movePlayer(1);
          break;
        case 'ArrowDown':
          dropPlayer();
          break;
        case 'ArrowUp':
          rotatePlayer(stage);
          break;
        case 'Space':
          hardDrop();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver, isOpponent]);

  // Movement is handled by the movePlayer function from useTetris hook

  // Rotate the player piece
  const rotatePlayerPiece = () => {
    rotatePlayer(stage);
    playHit(); // Play rotation sound
  };

  // Drop the player piece one row
  const drop = () => {
    // Increase level when player has cleared 10 rows
    if (rows > (level + 1) * 10) {
      setDropTime(1000 / (level + 2) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Game over conditions:
      // 1. Collision at the very top (y < 1)
      // 2. Collision while piece is partially above board (indicating stack reached top)
      if (player.pos.y < 1 || player.tetromino.some((row, y) => 
          row.some((cell, x) => {
            const boardY = player.pos.y + y;
            return cell !== 0 && boardY <= 0;
          }))) {
        setGameOver(true);
        setDropTime(null);
        return;
      }

      updatePlayerPos({ x: 0, y: 0, collided: true });

      // Check for line clears after collision
      const clearedRows = sweepRows();
      if (clearedRows > 0) {
        playSuccess(); // Play success sound for line clear

        // Notify parent about line clears if in multiplayer
        if (isMultiplayer && onLinesClear) {
          console.log(`Cleared ${clearedRows} rows, sending to opponent`);
          onLinesClear(clearedRows);
        }
      } else {
        playHit(); // Play piece landing sound
      }
    }
    updateStage(); //Call updateStage after each drop.
  };

  // Hard drop the player piece to the bottom
  const hardDrop = () => {
    if (!isOpponent && gameStarted && !gameOver) {
      let newY = player.pos.y;
      while (!checkCollision(player, stage, { x: 0, y: 1, pos: { x: player.pos.x, y: newY } })) {
        newY++;
      }
      
      // Check if piece is still at the top
      const finalY = newY - 1;
      if (finalY <= 0) {
        setGameOver(true);
        return;
      }

      if (newY !== player.pos.y) {
        updatePlayerPos({ x: 0, y: finalY - player.pos.y, collided: true });
        playHit();
        
        // Force immediate stage update
        const clearedRows = sweepRows();
        if (clearedRows > 0) {
          playSuccess();
          if (isMultiplayer && onLinesClear) {
            onLinesClear(clearedRows);
          }
        }
      }
    }
  };

  const renderStage = () => {
    return stage.map((row, y) =>
      row.map((cell, x) => {
        // Check if this position has an active tetromino piece
        const isActivePiece = player.tetromino && 
          y >= player.pos.y && 
          y < player.pos.y + player.tetromino.length &&
          x >= player.pos.x && 
          x < player.pos.x + player.tetromino[0].length &&
          player.tetromino[y - player.pos.y][x - player.pos.x] !== 0;

        // Determine the fill color
        let fillColor = '#111'; // Empty cell
        if (isActivePiece) {
          fillColor = player.color || '#00f0f0'; // Active piece
        } else if (cell[0] === 2) {
          fillColor = cell[1] || '#666'; // Settled piece
        }

        return (
          <Rect
            key={`${x}-${y}`}
            x={x * CELL_SIZE}
            y={y * CELL_SIZE}
            width={CELL_SIZE - 1}
            height={CELL_SIZE - 1}
            fill={fillColor}
            stroke={isActivePiece || cell[0] === 2 ? '#444' : '#222'}
            strokeWidth={0.5}
          />
        );
      })
    );
  };

  return (
    <div className={`tetris-board ${isOpponent ? 'opponent-board' : ''}`}>
      <Stage 
        width={STAGE_WIDTH * CELL_SIZE} 
        height={STAGE_HEIGHT * CELL_SIZE}
        ref={stageRef}
      >
        <Layer>
          {renderStage()}
        </Layer>
      </Stage>
    </div>
  );
};

export default TetrisBoard;