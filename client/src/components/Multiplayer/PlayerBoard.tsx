import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { STAGE_WIDTH, STAGE_HEIGHT } from '@/lib/gameHelpers';

interface Props {
  stage: any[][];
  isOpponent: boolean;
}

const PlayerBoard: React.FC<Props> = ({ stage, isOpponent }) => {
  const CELL_SIZE = isOpponent ? 15 : 30;
  
  // If stage is empty, create an empty stage
  const displayStage = stage && stage.length > 0 ? stage : Array(STAGE_HEIGHT).fill(Array(STAGE_WIDTH).fill([0, 'clear']));
  
  return (
    <div className="player-board">
      <Stage 
        width={STAGE_WIDTH * CELL_SIZE}
        height={STAGE_HEIGHT * CELL_SIZE}
      >
        <Layer>
          {displayStage.map((row, y) =>
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
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default PlayerBoard;
