import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

// Game constants
const STAGE_WIDTH = 10;
const STAGE_HEIGHT = 20;
const CELL_SIZE = 30;

// Tetromino shapes and colors
const TETROMINOS = {
  I: {
    shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    color: '#00f0f0', // Cyan
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    color: '#0000f0', // Blue
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    color: '#f0a000', // Orange
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: '#f0f000', // Yellow
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    color: '#00f000', // Green
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    color: '#a000f0', // Purple
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    color: '#f00000', // Red
  },
};

type TetrominoType = keyof typeof TETROMINOS;

// Create an empty stage
const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    Array(STAGE_WIDTH).fill(0)
  );

// Get a random tetromino
const randomTetromino = () => {
  const tetrominos = Object.keys(TETROMINOS) as TetrominoType[];
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

const SimpleTetris: React.FC = () => {
  // State
  const [stage, setStage] = useState(createStage());
  const [currentTetromino, setCurrentTetromino] = useState(randomTetromino());
  const [nextTetromino, setNextTetromino] = useState(randomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);

  // Helper function to check collisions
  const checkCollision = (x: number, y: number, matrix: number[][]) => {
    // Check if piece is inside the game boundaries (sides and bottom)
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        // Skip empty cells (zeros)
        if (matrix[row][col] === 0) continue;

        // Calculate the position of the cell in the stage
        const stageX = x + col;
        const stageY = y + row;

        // Check if we're outside the game area or there's a collision with an existing piece
        if (
          stageX < 0 ||
          stageX >= STAGE_WIDTH ||
          stageY >= STAGE_HEIGHT ||
          (stageY >= 0 && stage[stageY][stageX] !== 0)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // Update the game stage
  const updateStage = () => {
    // Copy the stage - keep settled cells (2) but clear active cells (1)
    const newStage = stage.map(row =>
      row.map(cell => (cell === 1 ? 0 : cell))
    );

    // Draw the current tetromino on the stage
    currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
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

    // Check if we've collided with something below us
    if (checkCollision(position.x, position.y + 1, currentTetromino.shape)) {
      // Check for game over - we need more accurate detection
      // Game is over if any part of the tetromino is above the game board when it gets locked in place

      // First check if we're trying to place a tetromino at the top of the board
      const isAtTopOfBoard = position.y <= 1;

      // If we're at the top and there's already a collision with existing blocks
      // then we have a game over situation
      if (isAtTopOfBoard) {
        // Check if the current tetromino overlaps with any existing blocks on the board
        let hasExistingBlocksAtCollision = false;

        // Check each cell of the current tetromino
        currentTetromino.shape.forEach((row, y) => {
          row.forEach((value, x) => {
            // Only check filled cells
            if (value !== 0) {
              const boardY = position.y + y;
              const boardX = position.x + x;

              // If this cell is on the board
              if (
                boardY >= 0 &&
                boardY < STAGE_HEIGHT &&
                boardX >= 0 &&
                boardX < STAGE_WIDTH
              ) {
                // And there's already a merged piece there (value 2)
                if (newStage[boardY][boardX] === 2) {
                  hasExistingBlocksAtCollision = true;
                }
              }
            }
          });
        });

        // If we found an overlap with existing blocks at the top
        if (hasExistingBlocksAtCollision) {
          console.log('Game Over! Collision at top of board');
          setGameOver(true);
          setDropTime(null);
          return;
        }
      }

      // Merge the tetromino into the stage
      const mergedStage = newStage.map((row, y) =>
        row.map((cell, x) => {
          // Check if we're drawing an active tetromino cell here
          const isTetroCell =
            position.y <= y &&
            y < position.y + currentTetromino.shape.length &&
            position.x <= x &&
            x < position.x + currentTetromino.shape[0].length &&
            currentTetromino.shape[y - position.y][x - position.x] !== 0;

          // If it's a tetromino cell and not already filled, set it to 2 (merged)
          return isTetroCell ? 2 : cell;
        })
      );

      // Check for completed rows
      let rowsCleared = 0;
      const clearedStage = mergedStage.map(row => {
        // If every cell in the row is not empty
        if (row.every(cell => cell !== 0)) {
          rowsCleared += 1;
          // Return an empty row
          return Array(STAGE_WIDTH).fill(0);
        }
        return row;
      });

      // Calculate score
      if (rowsCleared > 0) {
        setScore(prev => prev + rowsCleared * 100 * (level + 1));
        setRows(prev => prev + rowsCleared);

        // Increase level for every 10 rows cleared
        if ((rows + rowsCleared) >= (level + 1) * 10) {
          setLevel(prev => prev + 1);
          setDropTime(1000 / (level + 2) + 200);
        }
      }

      // Get a new tetromino and reset position
      setCurrentTetromino(nextTetromino);
      getNewTetromino();


      // Calculate position based on tetromino width to center it
      const tetrominoWidth = nextTetromino.shape[0].length;
      const startX = Math.floor((STAGE_WIDTH - tetrominoWidth) / 2);

      // Set the position
      setPosition({ x: startX, y: 0 });

      // Update the stage with cleared rows
      setStage(clearedStage);
    } else {
      // Simply update the stage
      setStage(newStage);
    }
  };

  const getNewTetromino = () => {
    const newPiece = nextTetromino;
    const pieceWidth = newPiece.shape[0].length;
    const startX = Math.floor((STAGE_WIDTH - pieceWidth) / 2);

    setCurrentTetromino(newPiece);
    setNextTetromino(randomTetromino());
    setPosition({ x: startX, y: 0 });
  };

  // Move the tetromino
  const moveTetromino = (x: number, y: number) => {
    if (!checkCollision(position.x + x, position.y + y, currentTetromino.shape)) {
      setPosition(prev => ({ x: prev.x + x, y: prev.y + y }));
    }
  };

  // Rotate the tetromino
  const rotateTetromino = () => {
    // Create a deep copy of the tetromino shape
    const clonedShape = JSON.parse(JSON.stringify(currentTetromino.shape));

    // Get dimensions
    const rows = clonedShape.length;
    const cols = clonedShape[0].length;

    // Create a new 2D array for the rotated shape
    const rotated: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));

    // Perform the rotation transformation
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // 90-degree clockwise rotation: [y][x] -> [x][rows-1-y]
        rotated[x][rows - 1 - y] = clonedShape[y][x];
      }
    }

    console.log('Rotating tetromino', { original: clonedShape, rotated });

    // Wall kick: try to adjust position if rotation would cause collision
    let adjustedX = position.x;
    let adjustedY = position.y;

    // Basic wall kicks - try positions: original, left, right, up
    const possibleAdjustments = [
      { x: 0, y: 0 },   // Original position
      { x: -1, y: 0 },  // Left
      { x: 1, y: 0 },   // Right
      { x: 0, y: -1 },  // Up
      { x: -2, y: 0 },  // Far left
      { x: 2, y: 0 },   // Far right
    ];

    // Find a position where the rotated piece doesn't collide
    let canRotate = false;
    for (const adjustment of possibleAdjustments) {
      const newX = position.x + adjustment.x;
      const newY = position.y + adjustment.y;

      if (!checkCollision(newX, newY, rotated)) {
        adjustedX = newX;
        adjustedY = newY;
        canRotate = true;
        break;
      }
    }

    // Apply the rotation if possible
    if (canRotate) {
      setCurrentTetromino({ ...currentTetromino, shape: rotated });
      setPosition({ x: adjustedX, y: adjustedY });
    }
  };

  // Hard drop - move the tetromino all the way down
  const hardDrop = () => {
    let newY = position.y;

    // Find the lowest valid position
    while (!checkCollision(position.x, newY + 1, currentTetromino.shape)) {
      newY += 1;
    }

    // Create a new stage
    const newStage = stage.map(row => [...row]);

    // Check if placing piece at new position would cause game over
    let wouldCauseGameOver = false;
    currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (newY + y < 2 && newStage[newY + y][position.x + x] === 2) {
            wouldCauseGameOver = true;
          }
        }
      });
    });

    if (wouldCauseGameOver) {
      return; // Don't allow the hard drop if it would cause immediate game over
    }

    // Update position and merge the piece
    setPosition(prev => ({ ...prev, y: newY }));
    
    // Merge the tetromino at its final position
    currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const finalY = newY + y;
          if (finalY >= 0 && finalY < STAGE_HEIGHT) {
            newStage[finalY][position.x + x] = 2;
          }
        }
      });
    });

    // Update stage
    setStage(newStage);

    // Spawn new piece with proper positioning
    const nextPiece = nextTetromino;
    const newNextPiece = randomTetromino();
    setCurrentTetromino(nextPiece);
    setNextTetromino(newNextPiece);
    
    // Calculate center position for new piece
    const tetrominoWidth = nextPiece.shape[0].length;
    const startX = Math.floor((STAGE_WIDTH - tetrominoWidth) / 2);
    setPosition({ x: startX, y: 0 });
  };

  // Start the game
  const startGame = () => {
    // Reset all game state
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);

    // Get initial tetrominos
    const firstTetromino = randomTetromino();
    const secondTetromino = randomTetromino();

    // Set tetrominos
    setCurrentTetromino(firstTetromino);
    setNextTetromino(secondTetromino);

    // Calculate initial position based on tetromino width
    // This ensures the piece is centered
    const tetrominoWidth = firstTetromino.shape[0].length;
    const startX = Math.floor((STAGE_WIDTH - tetrominoWidth) / 2);

    // Start with the tetromino fully visible on the board
    setPosition({ x: startX, y: 0 });

    // Reset game state
    setGameOver(false);
    setGameStarted(true);
    setDropTime(1000);

    console.log('Game started with', firstTetromino);
  };

  // Update game - main game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = setInterval(() => {
        updateStage();
      }, 100);

      return () => clearInterval(gameLoop);
    }
  }, [gameStarted, gameOver, stage, position, currentTetromino]);

  // Auto drop the tetromino
  useEffect(() => {
    if (dropTime && gameStarted && !gameOver) {
      const dropTimer = setInterval(() => {
        moveTetromino(0, 1);
      }, dropTime);

      return () => clearInterval(dropTimer);
    }
  }, [dropTime, gameStarted, gameOver, position, currentTetromino.shape]);

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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, position, currentTetromino.shape]);

  // Render functions
  const renderStage = () => (
    stage.map((row, y) =>
      row.map((cell, x) => (
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
    )
  );

  const renderNextTetromino = () => (
    <Stage width={120} height={120}>
      <Layer>
        {nextTetromino.shape.map((row, y) =>
          row.map((cell, x) =>
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
          )
        )}
      </Layer>
    </Stage>
  );

  // Render the component
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

export default SimpleTetris;