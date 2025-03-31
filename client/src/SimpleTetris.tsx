import React, { useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { TETROMINOS, randomTetromino, TetrominoType } from './lib/tetrominos';
import { STAGE_WIDTH, STAGE_HEIGHT, createStage, checkCollision } from './lib/gameHelpers';

// Simple Tetris Game with no WebSocket connections
const SimpleTetris: React.FC = () => {
  const [stage, setStage] = useState(createStage());
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0] as TetrominoType,
    collided: false,
  });
  const [dropTime, setDropTime] = useState<number | null>(1000);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [nextPiece, setNextPiece] = useState<keyof typeof TETROMINOS>('I');
  const [gameStarted, setGameStarted] = useState(false);
  
  const CELL_SIZE = 30;
  
  // Reset player
  const resetPlayer = useCallback(() => {
    console.log('Resetting player');
    const newTetromino = randomTetromino();
    
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetromino: TETROMINOS[nextPiece] as TetrominoType,
      collided: false,
    });
    
    setNextPiece(newTetromino);
  }, [nextPiece]);
  
  // Start the game
  const startGame = () => {
    console.log('Starting game');
    // Reset everything
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);
    resetPlayer();
    setGameStarted(true);
    setGameOver(false);
    setDropTime(1000);
  };
  
  // Update player position
  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: (prev.pos.x + x), y: (prev.pos.y + y) },
      collided,
    }));
  };
  
  // Rotate a tetromino
  const rotate = (matrix: any[][], dir: number) => {
    // Transpose rows to columns
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map(col => col[index])
    );
    
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotatedTetro.map(row => row.reverse());
    return rotatedTetro.reverse();
  };
  
  // Rotate player tetromino
  const rotatePlayer = (stage: any[][]) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape, 1);
    
    // Check for collisions when rotating
    const pos = clonedPlayer.pos.x;
    let offset = 1;
    
    // Adjust position if tetromino is outside the stage boundary after rotation
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      
      // If offset gets too big, rotation is not possible at current position
      if (offset > clonedPlayer.tetromino.shape[0].length) {
        rotate(clonedPlayer.tetromino.shape, -1); // Rotate back
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    
    setPlayer(clonedPlayer);
  };
  
  // Calculate score when rows are cleared
  const calcScore = useCallback((rowsCleared: number) => {
    const linePoints = [0, 100, 300, 500, 800];
    const points = linePoints[rowsCleared] * (level + 1);
    setScore(prev => prev + points);
    setRows(prev => prev + rowsCleared);
  }, [level]);
  
  // Sweep completed rows
  const sweepRows = useCallback(() => {
    let rowsCleared = 0;
    
    setStage(prevStage => {
      return prevStage.reduce((newStage, row) => {
        // If row has no empty cells (all cells have values)
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          rowsCleared += 1;
          // Add an empty row at the top
          newStage.unshift(new Array(prevStage[0].length).fill([0, 'clear']));
          return newStage;
        }
        newStage.push(row);
        return newStage;
      }, [] as any[][]);
    });
    
    if (rowsCleared > 0) {
      calcScore(rowsCleared);
    }
    
    return rowsCleared;
  }, [calcScore]);
  
  // Drop the player piece one row
  const drop = () => {
    // Increase level when player has cleared 10 rows
    if (rows > (level + 1) * 10) {
      setDropTime(1000 / (level + 2) + 200);
      setLevel(prev => prev + 1);
    }
    
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Game over if collided at the top
      if (player.pos.y < 1) {
        console.log('GAME OVER');
        setGameOver(true);
        setDropTime(null);
      }
      
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };
  
  // User keyboard controls
  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
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
  };
  
  // Drop player on keypress
  const dropPlayer = () => {
    drop();
  };
  
  // Update game stage
  const updateStage = useCallback(() => {
    if (!gameStarted) return;
    
    // First flush the stage
    const newStage = stage.map(row =>
      row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
    );
    
    // Then draw the tetromino
    player.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newStage[y + player.pos.y][x + player.pos.x] = [
            value,
            `${player.collided ? 'merged' : 'clear'}`,
          ];
        }
      });
    });
    
    // Then check if we collided
    if (player.collided) {
      resetPlayer();
      sweepRows();
    }
    
    setStage(newStage);
  }, [gameStarted, player, resetPlayer, stage, sweepRows]);
  
  // Auto drop the tetromino
  useEffect(() => {
    let dropTimer: NodeJS.Timeout | null = null;
    
    if (dropTime && gameStarted && !gameOver) {
      dropTimer = setInterval(() => {
        drop();
      }, dropTime);
    }
    
    return () => {
      if (dropTimer) clearInterval(dropTimer);
    };
  }, [dropTime, gameStarted, gameOver]);
  
  // Update the game stage
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = setInterval(() => {
        updateStage();
      }, 100);
      
      return () => {
        clearInterval(gameLoop);
      };
    }
  }, [gameStarted, gameOver, updateStage]);
  
  // Handle keyboard input for player controls
  useEffect(() => {
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
  }, [gameStarted, gameOver, stage]);
  
  // Render the next piece display
  const renderNextPiece = () => {
    const tetromino = TETROMINOS[nextPiece];
    return (
      <div className="next-piece-container">
        <Stage width={100} height={100}>
          <Layer>
            {tetromino.shape.map((row, y) =>
              row.map((cell, x) => (
                cell !== 0 && (
                  <Rect
                    key={`next-${x}-${y}`}
                    x={30 + x * 20}
                    y={30 + y * 20}
                    width={19}
                    height={19}
                    fill={tetromino.color}
                    stroke="#666"
                    strokeWidth={0.5}
                  />
                )
              ))
            )}
          </Layer>
        </Stage>
      </div>
    );
  };
  
  // Render the game stage
  const renderStage = () => {
    return stage.map((row, y) =>
      row.map((cell, x) => (
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
      ))
    );
  };
  
  // Render the active tetromino
  const renderTetromino = () => {
    return player.tetromino.shape.map((row, y) =>
      row.map((cell, x) => (
        cell !== 0 && (
          <Rect
            key={`player-${x}-${y}`}
            x={(player.pos.x + x) * CELL_SIZE}
            y={(player.pos.y + y) * CELL_SIZE}
            width={CELL_SIZE - 1}
            height={CELL_SIZE - 1}
            fill={player.tetromino.color}
            stroke="#666"
            strokeWidth={0.5}
          />
        )
      ))
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-900">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-blue-400 text-center">TETRIS</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="tetris-board">
          <Stage width={STAGE_WIDTH * CELL_SIZE} height={STAGE_HEIGHT * CELL_SIZE}>
            <Layer>
              {renderStage()}
              {player.tetromino && renderTetromino()}
            </Layer>
          </Stage>
        </div>
        
        <div className="w-64 flex flex-col gap-4">
          {/* Score */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">Score</h2>
            <p className="text-2xl text-yellow-400">{score}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div>
                <p className="text-sm text-gray-400">Rows</p>
                <p className="text-lg text-white">{rows}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Level</p>
                <p className="text-lg text-white">{level}</p>
              </div>
            </div>
          </div>
          
          {/* Next Piece */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">Next Piece</h2>
            {renderNextPiece()}
          </div>
          
          {/* Controls */}
          <div className="flex flex-col gap-2">
            {!gameStarted ? (
              <button 
                onClick={startGame}
                className="py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start Game
              </button>
            ) : (
              <button 
                onClick={() => setGameOver(true)}
                className="py-3 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                End Game
              </button>
            )}
            
            {/* Game Controls */}
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">Controls</h3>
              <p className="text-sm text-gray-300">← → : Move left/right</p>
              <p className="text-sm text-gray-300">↑ : Rotate</p>
              <p className="text-sm text-gray-300">↓ : Move down</p>
              <p className="text-sm text-gray-300">Space : Hard drop</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Game Over</h2>
            <div className="mb-6">
              <p className="text-xl text-gray-300">Score: <span className="text-yellow-400">{score}</span></p>
              <p className="text-xl text-gray-300">Level: <span className="text-blue-400">{level}</span></p>
              <p className="text-xl text-gray-300">Rows Cleared: <span className="text-green-400">{rows}</span></p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="flex-1 py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTetris;