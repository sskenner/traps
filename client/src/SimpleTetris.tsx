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
  const [position, setPosition] = useState({ x: Math.floor(STAGE_WIDTH / 2) - 2, y: -2 });
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);

  // Helper function to check collisions
  const checkCollision = (x: number, y: number, matrix: number[][]) => {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 0) continue;
        const stageX = x + col;
        const stageY = y + row;
        if (stageX < 0 || stageX >= STAGE_WIDTH || stageY >= STAGE_HEIGHT) {
          return true;
        }
        if (stageY >= 0 && stage[stageY] && stage[stageY][stageX] === 2) {
          if (y <= 0) {
            return true;
          }
          return true;
        }
      }
    }
    return false;
  };

  // Update the game stage
  const updateStage = () => {
    const newStage = stage.map(row =>
      row.map(cell => (cell === 1 ? 0 : cell))
    );

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

    if (checkCollision(position.x, position.y + 1, currentTetromino.shape)) {
      if (position.y <= 1) {
        setGameOver(true);
        setDropTime(null);
        return;
      }

      currentTetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            if (position.y + y >= 0 && position.y + y < STAGE_HEIGHT) {
              newStage[position.y + y][position.x + x] = 2;
            }
          }
        });
      });

      let rowsCleared = 0;
      for (let y = STAGE_HEIGHT - 1; y >= 0; y--) {
        if (newStage[y].every(cell => cell === 2)) {
          rowsCleared++;
          newStage.splice(y, 1);
          newStage.unshift(Array(STAGE_WIDTH).fill(0));
        }
      }

      if (rowsCleared > 0) {
        setScore(prev => prev + rowsCleared * 100 * (level + 1));
        setRows(prev => {
          const newRows = prev + rowsCleared;
          if (newRows >= (level + 1) * 10) {
            setLevel(l => l + 1);
            setDropTime(1000 / (level + 2) + 200);
          }
          return newRows;
        });
      }

      setCurrentTetromino(nextTetromino);
      setNextTetromino(randomTetromino());
      setPosition({
        x: Math.floor(STAGE_WIDTH / 2) - 2,
        y: 0
      });
    }

    setStage(newStage);
  };

  // Move the tetromino
  const moveTetromino = (x: number, y: number) => {
    if (!checkCollision(position.x + x, position.y + y, currentTetromino.shape)) {
      setPosition(prev => ({ x: prev.x + x, y: prev.y + y }));
    }
  };

  // Rotate the tetromino
  const rotateTetromino = () => {
    const matrix = currentTetromino.shape;
    const rotated = matrix[0].map((_, i) =>
      matrix.map(row => row[i]).reverse()
    );

    if (!checkCollision(position.x, position.y, rotated)) {
      setCurrentTetromino({ ...currentTetromino, shape: rotated });
    }
  };

  // Hard drop
  const hardDrop = () => {
    let newY = position.y;
    while (!checkCollision(position.x, newY + 1, currentTetromino.shape)) {
      newY++;
    }
    setPosition(prev => ({ ...prev, y: newY }));
  };

  // Start the game
  const startGame = () => {
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);
    setCurrentTetromino(randomTetromino());
    setNextTetromino(randomTetromino());
    setPosition({ x: Math.floor(STAGE_WIDTH / 2) - 2, y: 0 });
    setGameOver(false);
    setGameStarted(true);
    setDropTime(1000);
  };

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = setInterval(() => {
        updateStage();
      }, 50);
      return () => clearInterval(gameLoop);
    }
  }, [gameStarted, gameOver, position, currentTetromino]);

  // Auto drop
  useEffect(() => {
    if (dropTime && gameStarted && !gameOver) {
      const dropTimer = setInterval(() => {
        moveTetromino(0, 1);
      }, dropTime);
      return () => clearInterval(dropTimer);
    }
  }, [dropTime, gameStarted, gameOver]);

  // Keyboard controls
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
  }, [gameStarted, gameOver]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-900">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-blue-400 text-center">TETRIS</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="tetris-board bg-gray-800 p-2 rounded-lg">
          <Stage width={STAGE_WIDTH * CELL_SIZE} height={STAGE_HEIGHT * CELL_SIZE}>
            <Layer>
              {stage.map((row, y) =>
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
              )}
            </Layer>
          </Stage>
        </div>

        <div className="w-64 flex flex-col gap-4">
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

          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">Next Piece</h2>
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
          </div>

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