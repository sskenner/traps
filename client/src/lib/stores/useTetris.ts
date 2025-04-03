import { create } from 'zustand';
import { STAGE_WIDTH, STAGE_HEIGHT, createStage, checkCollision, ROWPOINTS } from '../gameHelpers';
import { TETROMINOS, randomTetromino } from '../tetrominos';

interface PlayerState {
  pos: {
    x: number;
    y: number;
  };
  tetromino: number[][];
  collided: boolean;
  tetrominoName: string;
}

interface TetrisState {
  stage: any[][];
  player: PlayerState;
  gameStarted: boolean;
  score: number;
  rows: number;
  level: number;
  nextPiece: string;
}

interface TetrisStore extends TetrisState {
  updateStage: (newStage?: any[][]) => void;
  movePlayer: (dir: number) => void;
  resetPlayer: () => void;
  rotatePlayer: (stage: any[][]) => void;
  dropPlayer: () => void;
  startGame: () => void;
  resetGame: () => void;
  setGameStarted: (started: boolean) => void;
  setPlayer: (playerUpdate: Partial<PlayerState>) => void;
  sweepRows: (stage: any[][]) => number;
  updatePlayerPos: ({ x, y, collided }: { x: number; y: number; collided: boolean }) => void;
  setScore: (score: number) => void;
  setLevel: (level: number) => void;
  setRows: (rows: number) => void;
  setNextPiece: (piece: string) => void;
  addGarbageLines: (numLines: number) => void;
}

const createPlayer = (): PlayerState => ({
  pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
  tetromino: TETROMINOS[randomTetromino()].shape,
  collided: false,
  tetrominoName: randomTetromino()
});

export const useTetris = create<TetrisStore>((set, get) => ({
  stage: createStage(),
  player: createPlayer(),
  gameStarted: false,
  score: 0,
  rows: 0,
  level: 0,
  nextPiece: 'I',

  updateStage: (newStage) => {
    if (newStage) {
      set({ stage: newStage });
      return;
    }

    const { player, stage } = get();

    const newStageState = stage.map(row =>
      row.map(cell => (cell[0] === 1 ? [0, 'clear'] : cell))
    );

    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const stageY = player.pos.y + y;
          const stageX = player.pos.x + x;
          if (stageY >= 0 && stageY < STAGE_HEIGHT && stageX >= 0 && stageX < STAGE_WIDTH) {
            newStageState[stageY][stageX] = [
              value,
              player.collided ? 'merged' : 'clear',
            ];
          }
        }
      });
    });

    set({ stage: newStageState });
  },

  movePlayer: (dir: number) => {
    const { player, stage } = get();
    if (!checkCollision(player, stage, { x: dir, y: 0, pos: { x: player.pos.x + dir, y: player.pos.y } })) {
      set(state => ({
        player: {
          ...state.player,
          pos: { ...state.player.pos, x: state.player.pos.x + dir }
        }
      }));
    }
  },

  setPlayer: (playerUpdate) => {
    set(state => ({
      player: { ...state.player, ...playerUpdate }
    }));
  },

  resetPlayer: () => {
    const newPlayer = createPlayer();
    set(state => ({
      player: newPlayer,
      nextPiece: randomTetromino()
    }));
  },

  rotatePlayer: (stage) => {
    const { player } = get();
    const pos = player.pos;
    const matrix = player.tetromino.map((_, index) =>
      player.tetromino.map(col => col[index]).reverse()
    );

    if (!checkCollision(player, stage, { x: 0, y: 0, pos })) {
      set(state => ({
        player: {
          ...state.player,
          tetromino: matrix
        }
      }));
    }
  },

  dropPlayer: () => {
    const { player, stage, updatePlayerPos } = get();
    if (!checkCollision(player, stage, { x: 0, y: 1, pos: { x: player.pos.x, y: player.pos.y + 1 } })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        set({ gameStarted: false });
        return;
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  },

  updatePlayerPos: ({ x, y, collided }) => {
    set(state => ({
      player: {
        ...state.player,
        pos: { x: state.player.pos.x + x, y: state.player.pos.y + y },
        collided
      }
    }));
  },

  sweepRows: (stage) => {
    const newStage = stage.reduce((acc, row) => {
      if (row.every(cell => cell[0] !== 0)) {
        acc.unshift(new Array(STAGE_WIDTH).fill([0, 'clear']));
        return acc;
      }
      acc.push(row);
      return acc;
    }, [] as any[][]);

    if (stage.length - newStage.length > 0) {
      const clearedRows = stage.length - newStage.length;
      set(state => ({
        score: state.score + ROWPOINTS[clearedRows - 1] * (state.level + 1),
        rows: state.rows + clearedRows,
        level: Math.floor((state.rows + clearedRows) / 10)
      }));
      return clearedRows;
    }
    return 0;
  },

  startGame: () => {
    set({
      stage: createStage(),
      gameStarted: true,
      score: 0,
      rows: 0,
      level: 0,
      player: createPlayer(),
      nextPiece: randomTetromino()
    });
  },

  resetGame: () => {
    set({
      stage: createStage(),
      gameStarted: false,
      score: 0,
      rows: 0,
      level: 0,
      player: createPlayer(),
      nextPiece: randomTetromino()
    });
  },

  setGameStarted: (started) => set({ gameStarted: started }),
  setScore: (score) => set({ score }),
  setLevel: (level) => set({ level }),
  setRows: (rows) => set({ rows }),
  setNextPiece: (piece) => set({ nextPiece: piece }),

  addGarbageLines: (numLines) => {
    set(state => {
      const newStage = state.stage.slice(numLines);
      for (let i = 0; i < numLines; i++) {
        const garbageLine = new Array(STAGE_WIDTH).fill([2, 'merged']);
        const holePosition = Math.floor(Math.random() * STAGE_WIDTH);
        garbageLine[holePosition] = [0, 'clear'];
        newStage.push(garbageLine);
      }
      return { stage: newStage };
    });
  }
}));