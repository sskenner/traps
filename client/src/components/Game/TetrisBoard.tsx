import React, { useEffect, useRef, useState } from 'react';
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
    movePlayer
  } = useTetris();

  // Initialize player
  useEffect(() => {
    if (!player.tetromino && gameStarted && !gameOver && !isOpponent) {
      resetPlayer();
    }
  }, [gameStarted, gameOver, isOpponent, player.tetromino, resetPlayer]);

  // Game Loop
  useEffect(() => {
    let gameLoop: NodeJS.Timeout | null = null;

    if (gameStarted && !gameOver && dropTime !== null && !isOpponent) {
      gameLoop = setInterval(() => {
        dropPlayer();
      }, dropTime);
    }

    return () => {
      if (gameLoop) {
        clearInterval(gameLoop);
      }
    };
  }, [gameStarted, gameOver, dropTime, dropPlayer, isOpponent]);

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
          rotatePlayerPiece();
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
  };

  // Hard drop the player piece to the bottom
  const hardDrop = () => {
    let newY = player.pos.y;
    const playerCopy = JSON.parse(JSON.stringify(player));

    // Find the lowest possible position without collision
    while (!checkCollision(playerCopy, stage, { x: 0, y: 1 })) {
      playerCopy.pos.y += 1;
      newY += 1;
    }

    // Move player to that position and mark as collided
    updatePlayerPos({ x: 0, y: newY - player.pos.y, collided: true });

    if (!isMuted) {
      playHit(); // Play hard drop sound
    }

    // Check for line clears after hard drop
    const clearedRows = sweepRows();
    if (clearedRows > 0) {
      if (!isMuted) {
        playSuccess(); // Play success sound for line clear
      }

      // Notify parent about line clears if in multiplayer
      if (isMultiplayer && onLinesClear) {
        console.log(`Hard drop cleared ${clearedRows} rows, sending to opponent`);
        onLinesClear(clearedRows);
      }
    }
  };

  const renderStage = () => {
    return stage.map((row, y) =>
      row.map((cell, x) => {
        return (
          <Rect
            key={`${x}-${y}`}
            x={x * CELL_SIZE}
            y={y * CELL_SIZE}
            width={CELL_SIZE - 1}
            height={CELL_SIZE - 1}
            fill={cell[0] ? cell[1] : '#111'}
            stroke="#333"
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
          {/* Render the active tetromino */}
          {player.tetromino && (
            <Tetromino 
              tetromino={player.tetromino}
              position={player.pos}
              cellSize={CELL_SIZE}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default TetrisBoard;