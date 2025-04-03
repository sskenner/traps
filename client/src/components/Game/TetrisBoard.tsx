import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { checkCollision } from '@/lib/gameHelpers';
import { useAudio } from '@/lib/stores/useAudio';
import { useTetris } from '@/lib/stores/useTetris';
import { STAGE_WIDTH, STAGE_HEIGHT } from '@/lib/gameHelpers';

interface Props {
  isMultiplayer?: boolean;
  isOpponent?: boolean;
  onLinesClear?: (lines: number) => void;
}

const TetrisBoard: React.FC<Props> = ({ 
  isMultiplayer = false,
  isOpponent = false,
  onLinesClear 
}) => {
  const { backgroundMusic, playHit, playSuccess } = useAudio();
  const stageRef = useRef<any>(null);
  const CELL_SIZE = isOpponent ? 15 : 30;
  const dropTimeRef = useRef<number>(1000);
  const [dropTime, setDropTime] = useState<number | null>(1000);
  const [gameOver, setGameOver] = useState(false);

  const {
    player,
    stage,
    resetPlayer,
    updatePlayerPos,
    rotatePlayer,
    dropPlayer,
    resetGame,
    gameStarted,
    startGame,
    sweepRows,
    movePlayer,
    setPlayer,
    rows,
    level
  } = useTetris();

  useEffect(() => {
    if (!player.tetromino && gameStarted && !gameOver && !isOpponent) {
      resetPlayer();
    }
  }, [gameStarted, gameOver, isOpponent, player.tetromino, resetPlayer]);

  const movePlayerHorizontal = (dir: number) => {
    if (!gameOver && gameStarted) {
      movePlayer(dir);
    }
  };

  const drop = () => {
    if (!gameOver && gameStarted) {
      dropPlayer();
    }
  };

  const hardDrop = () => {
    if (!gameOver && gameStarted) {
      let newY = player.pos.y;
      while (!checkCollision(player, stage, { x: 0, y: 1, pos: { x: player.pos.x, y: newY } })) {
        newY++;
      }

      if (newY !== player.pos.y) {
        updatePlayerPos({ x: 0, y: newY - player.pos.y - 1, collided: true });
        playHit();
      }
    }
  };

  const keyUp = ({ keyCode }: { keyCode: number }): void => {
    if (!gameStarted || gameOver) return;

    if (keyCode === 40) {
      setDropTime(dropTimeRef.current);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!gameStarted || gameOver) return;

    switch (event.code) {
      case 'ArrowLeft':
        movePlayerHorizontal(-1);
        break;
      case 'ArrowRight':
        movePlayerHorizontal(1);
        break;
      case 'ArrowDown':
        setDropTime(null);
        drop();
        break;
      case 'ArrowUp':
        rotatePlayer(stage);
        break;
      case 'Space':
        event.preventDefault();
        hardDrop();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!isOpponent) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [gameStarted, gameOver, isOpponent]);

  useEffect(() => {
    if (!dropTime) return;

    const interval = setInterval(() => {
      drop();
    }, dropTime);

    return () => {
      clearInterval(interval);
    };
  }, [dropTime, gameStarted, gameOver]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      setDropTime(1000 / (level + 1) + 200); //Restored level-based drop time
    }
  }, [gameStarted, gameOver, level]);


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
    <div className="tetris-board">
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