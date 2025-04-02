import { useState, useCallback } from 'react';
import { TETROMINOS, randomTetromino, TetrominoType } from '../tetrominos';
import { STAGE_WIDTH, STAGE_HEIGHT, createStage, checkCollision } from '../gameHelpers';

export const useTetris = () => {
  // Stage (game board)
  const [stage, setStage] = useState(createStage());

  // Score, rows, and level
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);

  // Player state
  const [player, setPlayer] = useState({
    pos: { x: STAGE_WIDTH / 2 - 1, y: 0 },
    tetromino: TETROMINOS['I'].shape,
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

  // Drop player one row
  const dropPlayer = () => {
    updatePlayerPos({ x: 0, y: 1, collided: false });
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
    if (!gameStarted) return;

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
  }, [stage, player, resetPlayer, sweepRows, gameStarted]);

  // Start the game
  const startGame = () => {
    // Reset everything
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);
    resetPlayer();
    setGameStarted(true);
  };

  // Reset the game
  const resetGame = () => {
    setStage(createStage());
    setScore(0);
    setRows(0);
    setLevel(0);
    setGameStarted(false);
    setPlayer({
      pos: { x: 0, y: 0 },
      tetromino: TETROMINOS['I'].shape,
      collided: false,
    });
    setNextPiece('I');
  };

  // Update game state
  useCallback(() => {
    if (gameStarted) {
      updateStage();
    }
  }, [gameStarted, updateStage]);

  const movePlayer = (dir: number) => {
    const collision = checkCollision(player.pos.x + dir, player.pos.y, player.tetromino);
    if (collision === 'gameover') {
      setGameStarted(false);
    } else if (!collision) {
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
    setNextPiece
  };
};