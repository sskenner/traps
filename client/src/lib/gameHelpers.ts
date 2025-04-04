export const STAGE_WIDTH = 10;
export const STAGE_HEIGHT = 20;

// Create a clean stage (game board)
export const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

// Check for collisions
export const checkCollision = (
  player: any,
  stage: any[][],
  { x: moveX, y: moveY, pos = null }: { x: number; y: number; pos?: { x: number; y: number } | null }
) => {
  // Use provided position or player's current position
  const posX = pos ? pos.x : player.pos.x;
  const posY = pos ? pos.y : player.pos.y;
  
  for (let y = 0; y < player.tetromino.shape.length; y += 1) {
    for (let x = 0; x < player.tetromino.shape[y].length; x += 1) {
      // 1. Check that we're on an actual Tetromino cell
      if (player.tetromino.shape[y][x] !== 0) {
        // 2. Check that our move is inside the game areas height (y)
        // We shouldn't go through the bottom of the play area
        if (
          !stage[y + posY + moveY] ||
          // 3. Check that our move is inside the game areas width (x)
          !stage[y + posY + moveY][x + posX + moveX] ||
          // 4. Check that the cell we're moving to isn't set to clear
          stage[y + posY + moveY][x + posX + moveX][1] !== 'clear'
        ) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Calculate score based on number of rows cleared and level
export const calculateScore = (rowsCleared: number, level: number) => {
  const linePoints = [0, 100, 300, 500, 800]; // Points for 0, 1, 2, 3, or 4 rows
  return linePoints[rowsCleared] * (level + 1);
};
