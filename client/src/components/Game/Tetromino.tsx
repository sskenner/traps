import React from 'react';
import { Rect, Group } from 'react-konva';
import { TetrominoType } from '@/lib/tetrominos';

interface Props {
  tetromino: TetrominoType;
  position: { x: number; y: number };
  cellSize: number;
}

const Tetromino: React.FC<Props> = ({ tetromino, position, cellSize }) => {
  const { shape, color } = tetromino;
  
  return (
    <Group x={position.x * cellSize} y={position.y * cellSize}>
      {shape.map((row, y) =>
        row.map((cell, x) => {
          if (cell !== 0) {
            return (
              <Rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={color}
                stroke="#222"
                strokeWidth={0.5}
              />
            );
          }
          return null;
        })
      )}
    </Group>
  );
};

export default Tetromino;
