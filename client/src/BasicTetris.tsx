import React, { useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

// Constants
const STAGE_WIDTH = 10;
const STAGE_HEIGHT = 20;
const CELL_SIZE = 30;

// Define tetromino types
type TetrominoTypes = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

type TetrominoShape = {
  shape: number[][];
  color: string;
};

// Tetromino shapes and colors
const TETROMINOS: Record<TetrominoTypes, TetrominoShape> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0f0' // Cyan
  },
  J: {
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1]
    ],
    color: '#0000f0' // Blue
  },
  L: {
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0]
    ],
    color: '#f0a000' // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000' // Yellow
  },
  S: {
    shape: [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#00f000' // Green
  },
  T: {
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#a000f0' // Purple
  },
  Z: {
    shape: [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#f00000' // Red
  }
};

// Helper functions
const createStage = (): number[][] => 
  Array.from(Array(STAGE_HEIGHT), () => 
    Array(STAGE_WIDTH).fill(0)
  );

const randomTetromino = (): TetrominoShape => {
  const tetrominos = 'IJLOSTZ';
  const randIndex = Math.floor(Math.random() * tetrominos.length);
  const randTetromino = tetrominos[randIndex] as TetrominoTypes;
  return TETROMINOS[randTetromino];
};

const BasicTetris: React.FC = () => {
  // State
  const [stage, setStage] = useState(createStage());
  const [currentTetromino, setCurrentTetromino] = useState(randomTetromino());
  const [nextTetromino, setNextTetromino] = useState(randomTetromino());
  const [position, setPosition] = useState({ x: STAGE_WIDTH / 2 - 2, y: 0 });
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);
  
  // Get a new tetromino
  const getNewTetromino = useCallback(() => {
    setCurrentTetromino(nextTetromino);
    setNextTetromino(randomTetromino());
    setPosition({ x: STAGE_WIDTH / 2 - 2, y: 0 });
  }, [nextTetromino]);
  
  // Check for collision
  const checkCollision = (x: number, y: number, tetromino: TetrominoShape): boolean => {
    for (let row = 0; row < tetromino.shape.length; row++) {
      for (let col = 0; col < tetromino.shape[row].length; col++) {
        // Check that we're on an actual tetromino cell
        if (tetromino.shape[row][col] !== 0) {
          // Check that our move is inside the game area's height (y)
          // That we're not moving through the bottom of the grid
          if (
            // Below the bottom boundary
            y + row >= STAGE_HEIGHT ||
            // Outside the game area width (x)
            x + col < 0 || x + col >= STAGE_WIDTH ||
            // Check that the cell we're moving to isn't set
            (stage[y + row] && stage[y + row][x + col] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };
  
  // Update the stage with the current tetromino position
  const updateStage = useCallback(() => {
    // Create a clean stage
    const newStage = createStage();
    
    // Draw the stage (static blocks)
    stage.forEach((row: number[], y: number) => {
      row.forEach((cell: number, x: number) => {
        if (cell !== 0) {
          newStage[y][x] = cell;
        }
      });
    });
    
    // Draw the tetromino
    currentTetromino.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          if (
            position.y + y >= 0 && 
            position.y + y < STAGE_HEIGHT && 
            position.x + x >= 0 && 
            position.x + x < STAGE_WIDTH
          ) {
            newStage[position.y + y][position.x + x] = 1;
          }
        }
      });
    });
    
    // Check for collision on the next row
    const hasCollision = checkCollision(position.x, position.y + 1, currentTetromino);
    
    // If collision detected, merge the tetromino with the stage
    if (hasCollision) {
      console.log('Collision detected');
      
      // Game over if collision at the top
      if (position.y <= 1) {
        console.log('GAME OVER');
        setGameOver(true);
        setDropTime(null);
        return;
      }
      
      // Merge the tetromino into the stage
      currentTetromino.shape.forEach((row: number[], y: number) => {
        row.forEach((value: number, x: number) => {
          if (value !== 0) {
            if (
              position.y + y >= 0 && 
              position.y + y < STAGE_HEIGHT && 
              position.x + x >= 0 && 
              position.x + x < STAGE_WIDTH
            ) {
              newStage[position.y + y][position.x + x] = 2; // 2 indicates a merged cell
            }
          }
        });
      });
      
      // Clear completed rows
      let rowsCleared = 0;
      const updatedStage = newStage.map(row => {
        // If every cell in the row is filled
        if (row.every(cell => cell !== 0)) {
          rowsCleared += 1;
          // Return an empty row (will be shifted down)
          return Array(STAGE_WIDTH).fill(0);
        }
        return row;
      });
      
      // If we cleared rows, update the score
      if (rowsCleared > 0) {
        console.log(`Cleared ${rowsCleared} rows`);
        setScore(prev => prev + rowsCleared * 100 * (level + 1));
        setRows(prev => prev + rowsCleared);
        
        // Increase level for every 10 rows cleared
        if (rows + rowsCleared >= (level + 1) * 10) {
          setLevel(prev => prev + 1);
          setDropTime(1000 / (level + 2) + 200);
        }
      }
      
      // Move cleared rows to the top
      const newStageFinal = [];
      for (let i = 0; i < STAGE_HEIGHT; i++) {
        if (i < rowsCleared) {
          newStageFinal.unshift(Array(STAGE_WIDTH).fill(0));
        } else {
          newStageFinal.push(updatedStage[i - rowsCleared] || Array(STAGE_WIDTH).fill(0));
        }
      }
      
      // Get a new tetromino
      getNewTetromino();
      
      // Update the final stage
      setStage(newStageFinal);
      return;
    }
    
    // Just update the stage normally
    setStage(newStage);
  }, [currentTetromino, getNewTetromino, level, position, rows, stage]);
  
  // Move the tetromino
  const moveTetromino = (x: number, y: number) => {
    if (!checkCollision(position.x + x, position.y + y, currentTetromino)) {
      setPosition(prev => ({ x: prev.x + x, y: prev.y + y }));
    }
  };
  
  // Rotate the tetromino
  const rotateTetromino = () => {
    // Clone the tetromino
    const tetromino = JSON.parse(JSON.stringify(currentTetromino));
    
    // Rotate the tetromino shape
    const rotatedShape = tetromino.shape[0].map((_: number, index: number) =>
      tetromino.shape.map((row: number[]) => row[index])
    ).reverse();
    
    tetromino.shape = rotatedShape;
    
    // Check for collisions after rotation
    if (!checkCollision(position.x, position.y, tetromino)) {
      setCurrentTetromino(tetromino);
    }
  };
  
  // Hard drop the tetromino
  const hardDrop = () => {
    let newY = position.y;
    
    // Keep moving down until collision
    while (!checkCollision(position.x, newY + 1, currentTetromino)) {
      newY += 1;
    }
    
    setPosition(prev => ({ ...prev, y: newY }));
  };
  
  // Start game
  const startGame = () => {
    console.log('Starting game');
    setStage(createStage());
    setCurrentTetromino(randomTetromino());
    setNextTetromino(randomTetromino());
    setPosition({ x: STAGE_WIDTH / 2 - 2, y: 0 });
    setScore(0);
    setRows(0);
    setLevel(0);
    setGameOver(false);
    setGameStarted(true);
    setDropTime(1000);
  };
  
  // Update game - main game loop
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
  
  // Auto drop the tetromino
  useEffect(() => {
    let dropTimer: NodeJS.Timeout | null = null;
    
    if (dropTime && gameStarted && !gameOver) {
      dropTimer = setInterval(() => {
        moveTetromino(0, 1);
      }, dropTime);
    }
    
    return () => {
      if (dropTimer) clearInterval(dropTimer);
    };
  }, [dropTime, gameStarted, gameOver]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.code) {
        case 'ArrowLeft':
          moveTetromino(-1, 0);
          break;
        case 'ArrowRight':
          moveTetromino(1, 0);
          break;
        case 'ArrowDown':
          moveTetromino(0, 1);
          break;
        case 'ArrowUp':
          rotateTetromino();
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
  }, [gameStarted, gameOver]);
  
  // Render the game stage
  const renderStage = () => {
    return stage.map((row: number[], y: number) =>
      row.map((cell: number, x: number) => (
        <Rect
          key={`${x}-${y}`}
          x={x * CELL_SIZE}
          y={y * CELL_SIZE}
          width={CELL_SIZE - 1}
          height={CELL_SIZE - 1}
          fill={cell === 0 ? '#111' : cell === 1 ? currentTetromino.color : '#666'}
          stroke="#333"
          strokeWidth={0.5}
        />
      ))
    );
  };
  
  // Render the next tetromino preview
  const renderNextTetromino = () => {
    return (
      <Stage width={120} height={120}>
        <Layer>
          {nextTetromino.shape.map((row: number[], y: number) =>
            row.map((cell: number, x: number) => (
              cell !== 0 && (
                <Rect
                  key={`next-${x}-${y}`}
                  x={30 + x * 20}
                  y={30 + y * 20}
                  width={19}
                  height={19}
                  fill={nextTetromino.color}
                  stroke="#666"
                  strokeWidth={0.5}
                />
              )
            ))
          )}
        </Layer>
      </Stage>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-900">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-blue-400 text-center">TETRIS</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Game Board */}
        <div className="tetris-board bg-gray-800 p-2 rounded-lg">
          <Stage width={STAGE_WIDTH * CELL_SIZE} height={STAGE_HEIGHT * CELL_SIZE}>
            <Layer>
              {renderStage()}
            </Layer>
          </Stage>
        </div>
        
        {/* Game Info & Controls */}
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
            {renderNextTetromino()}
          </div>
          
          {/* Controls */}
          <div className="flex flex-col gap-2">
            {!gameStarted || gameOver ? (
              <button 
                onClick={startGame}
                className="py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {gameOver ? 'Play Again' : 'Start Game'}
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
      {gameOver && gameStarted && (
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

export default BasicTetris;