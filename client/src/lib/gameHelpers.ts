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
  if (!player?.tetromino) return true;

  const posX = pos ? pos.x : player.pos.x;
  const posY = pos ? pos.y : player.pos.y;

  for (let y = 0; y < player.tetromino.length; y++) {
    for (let x = 0; x < player.tetromino[y].length; x++) {
      // Check piece cell
      if (player.tetromino[y][x] !== 0) {
        const newX = x + posX + moveX;
        const newY = y + posY + moveY;

        // Check movement inside game width bounds
        if (newX < 0 || newX >= STAGE_WIDTH) return true;

        // Check movement inside game height bounds
        if (newY >= STAGE_HEIGHT) return true;

        // Check collision with existing pieces
        if (newY >= 0) {
          if (!stage[newY] || !stage[newY][newX]) {
            return true;
          }
          if (stage[newY][newX][0] === 2) {
            // Game over check
            if (posY + y <= 1) {
              return true;
            }
            return true;
          }
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