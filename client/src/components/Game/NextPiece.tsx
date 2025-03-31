import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { TETROMINOS } from '@/lib/tetrominos';

interface Props {
  nextPiece: keyof typeof TETROMINOS;
  size?: number;
}

const NextPiece: React.FC<Props> = ({ nextPiece, size = 20 }) => {
  const tetromino = TETROMINOS[nextPiece];
  const width = tetromino.shape[0].length * size;
  const height = tetromino.shape.length * size;
  
  return (
    <div className="next-piece-container">
      <Stage width={width} height={height}>
        <Layer>
          {tetromino.shape.map((row, y) =>
            row.map((cell, x) => {
              if (cell !== 0) {
                return (
                  <Rect
                    key={`${x}-${y}`}
                    x={x * size}
                    y={y * size}
                    width={size - 1}
                    height={size - 1}
                    fill={tetromino.color}
                    stroke="#222"
                    strokeWidth={0.5}
                  />
                );
              }
              return null;
            })
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default NextPiece;
