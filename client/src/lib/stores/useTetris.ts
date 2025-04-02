import { useState, useCallback, useEffect } from 'react';
import { TETROMINOS, randomTetromino, TetrominoType } from '../tetrominos';
import { STAGE_WIDTH, STAGE_HEIGHT, createStage, checkCollision } from '../gameHelpers';

export const useTetris = () => {
  // Stage (game board)
  const [stage, setStage] = useState(createStage());

  // Score, rows, and level
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false); // Added game over state
  const [dropTime, setDropTime] = useState(null); //Added dropTime state

  // Game state
  const [gameStarted, setGameStarted] = useState(false);

  // Player state
  const [player, setPlayer] = useState({
    pos: { x: Math.floor(STAGE_WIDTH / 2) - 2, y: 0 },
    tetromino: TETROMINOS['I'].shape,
    color: TETROMINOS['I'].color,
    collided: false,
  });

  // Next piece
  const [nextPiece, setNextPiece] = useState<keyof typeof TETROMINOS>('I');

  // Reset player position and get new tetromino
  const resetPlayer = useCallback(() => {
    const tetromino = randomTetromino();
    const startY = tetromino.shape.length === 4 ? -2 : -1; // Adjust Y based on piece height
    const startX = STAGE_WIDTH / 2 - Math.floor(tetromino.shape[0].length / 2);

    // Check if spawn position is blocked
    const isBlocked = tetromino.shape.some((row, y) =>
      row.some((cell, x) => {
        const boardY = startY + y;
        if (cell !== 0 && boardY >= 0) {
          return stage[boardY] && stage[boardY][startX + x] !== 0;
        }
        return false;
      })
    );

    if (isBlocked) {
      setGameStarted(false); // End the game
      setGameOver(true); // Set game over
      return;
    }

    setPlayer({
      pos: { x: startX, y: startY },
      tetromino: tetromino.shape,
      collided: false
    });

    setNextPiece(tetromino.type);
  }, [stage]);

  // Calculate score when rows are cleared
  const calcScore = useCallback((rowsCleared: number) => {
    const linePoints = [0, 100, 300, 500, 800]; // Points for 0, 1, 2, 3, or 4 rows
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

  // Update player position
  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    if (!player.tetromino || !player.pos) {
      console.warn('Invalid player state during position update');
      return;
    }

    const newPos = { x: player.pos.x + x, y: player.pos.y + y };
    const hasCollision = checkCollision(player, stage, { x, y });

    if (!hasCollision) {
      console.log('Moving piece to:', newPos);
      setPlayer(prev => ({
        ...prev,
        pos: newPos,
        collided,
      }));
    } else if (y > 0) { // Only set collided if moving downward
      console.log('Collision detected during downward movement');
      setPlayer(prev => ({
        ...prev,
        collided: true,
      }));
      // Force stage update on collision
      updateStage();
    }
  };

  // Rotate tetromino
  const rotate = (matrix: any[][], dir: number) => {
    // Make rows become columns (transpose)
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map(col => col[index])
    );

    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotatedTetro.map(row => row.reverse());
    return rotatedTetro.reverse();
  };

  // Rotate player tetromino
  const rotatePlayer = (stage: any[][]) => {
    if (!gameStarted || gameOver) return;

    const clonedPlayer = JSON.parse(JSON.stringify(player));

    // Rotate matrix
    const matrix = clonedPlayer.tetromino;
    const rotated = matrix[0].map((_, i) =>
      matrix.map(row => row[i]).reverse()
    );

    // Wall kick offsets to try
    const kicks = [
      { x: 0, y: 0 },   // Original position
      { x: -1, y: 0 },  // Left
      { x: 1, y: 0 },   // Right
      { x: 0, y: -1 },  // Up
      { x: 0, y: 1 },   // Down
    ];

    // Try each offset until we find a valid position
    for (const kick of kicks) {
      const testPos = {
        x: clonedPlayer.pos.x + kick.x,
        y: clonedPlayer.pos.y + kick.y
      };

      if (!checkCollision({ ...clonedPlayer, tetromino: rotated }, stage, { x: 0, y: 0, pos: testPos })) {
        setPlayer({
          ...player,
          tetromino: rotated,
          pos: testPos
        });
        return;
      }
    }
  };

  // Drop player one row
  const dropPlayer = () => {
    if (!gameStarted || gameOver) return;

    const collision = checkCollision(player, stage, { x: 0, y: 1 });
    if (!collision) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Has collided
      if (player.pos.y < 1) {
        // Game Over
        setGameStarted(false);
        setGameOver(true);
        return;
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
      // Generate new piece
      resetPlayer();
    }
  };

  // Add garbage lines from opponent
  const addGarbageLines = (numLines: number) => {
    setStage(prevStage => {
      // Create new empty stage
      const newStage = [...prevStage.map(row => [...row])];

      // Shift all existing blocks up by the number of lines
      for (let y = 0; y < STAGE_HEIGHT - numLines; y++) {
        for (let x = 0; x < STAGE_WIDTH; x++) {
          // Move each cell up by numLines
          newStage[y][x] = prevStage[y + numLines][x];
        }
      }

      // Add blank lines at the bottom
      for (let i = 0; i < numLines; i++) {
        const y = STAGE_HEIGHT - i - 1;

        // Create a completely blank line at the bottom
        for (let x = 0; x < STAGE_WIDTH; x++) {
          newStage[y][x] = [0, 'clear'];
        }
      }

      return newStage;
    });

    console.log(`Added ${numLines} blank rows at the bottom, pushing everything up`);
  };

  // Update stage
  const updateStage = useCallback(() => {
    if (!gameStarted || gameOver) return;

    console.log('Updating stage with player:', player);

    // First flush the stage
    const newStage = stage.map(row =>
      row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
    );

    // Ensure player position is valid
    if (!player.tetromino || !player.pos) {
      console.warn('Invalid player state:', player);
      return;
    }

    // Then draw the tetromino
    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const yPos = y + player.pos.y;
          const xPos = x + player.pos.x;
          if (yPos >= 0 && yPos < STAGE_HEIGHT && xPos >= 0 && xPos < STAGE_WIDTH) {
            newStage[yPos][xPos] = [
              player.collided ? 2 : 1,
              player.color
            ];
          }
        }
      });
    });

    // Then check if we collided
    if (player.collided) {
      resetPlayer();
      sweepRows();
    }

    setStage(newStage);
  }, [stage, player, resetPlayer, sweepRows, gameStarted, gameOver]);

  // Start the game
  const startGame = () => {
    console.log("Starting game...");
    // Reset everything
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);
    setGameStarted(true);
    setGameOver(false); // Reset game over state
    setDropTime(1000); // Set initial drop time

    // Initialize first piece
    const firstType = randomTetromino();
    const firstPiece = TETROMINOS[firstType];
    const startX = STAGE_WIDTH / 2 - Math.floor(firstPiece.shape[0].length / 2);

    setPlayer({
      pos: { x: startX, y: 0 },
      tetromino: firstPiece.shape,
      color: firstPiece.color,
      collided: false
    });

    // Generate and set next piece
    const nextType = randomTetromino();
    setNextPiece(nextType);

    // Force immediate stage update
    setStage(createStage());

    // Force stage update after a brief delay to ensure state is updated
    setTimeout(() => {
      updateStage();
    }, 0);
  };

  // Reset the game
  const resetGame = () => {
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);
    setGameStarted(false);
    setGameOver(false); // Reset game over state
    setPlayer({
      pos: { x: 0, y: 0 },
      tetromino: TETROMINOS[0],
      collided: false,
    });
    setNextPiece('I');
  };

  // Update game state
  useEffect(() => {
    if (gameStarted && !gameOver && dropTime !== null) {
      const intervalId = setInterval(() => {
        dropPlayer();
      }, dropTime);

      return () => clearInterval(intervalId);
    }
  }, [gameStarted, gameOver, dropPlayer, dropTime]);


  useEffect(() => {
    if (rows >= (level + 1) * 10) {
      setLevel(prev => prev + 1);
      // Increase speed with each level
      setDropTime(Math.max(100, 1000 - (level * 100))); // Speeds up more gradually
    }
  }, [rows, level]);

  const movePlayer = (dir: number) => {
    if (!player.tetromino || !gameStarted || gameOver) return;

    const collision = checkCollision(player, stage, { x: dir, y: 0 });
    if (!collision) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y }
      }));
    }
  };


  return {
    player,
    stage,
    setStage,
    score,
    rows,
    level,
    nextPiece,
    gameStarted,
    updatePlayerPos,
    resetPlayer,
    rotatePlayer,
    dropPlayer,
    startGame,
    resetGame,
    updateStage,
    sweepRows,
    addGarbageLines,
    movePlayer,
    setScore,
    setLevel,
    setRows,
    setNextPiece,
    gameOver,
    setGameOver //Added gameOver setter
  };
};