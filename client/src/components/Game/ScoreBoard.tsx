import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  score: number;
  rows: number;
  level: number;
  isOpponent?: boolean;
  username?: string;
}

const ScoreBoard: React.FC<Props> = ({ score, rows, level, isOpponent = false, username }) => {
  const scoreCardClass = isOpponent ? 'w-full text-sm' : 'w-full';

  return (
    <Card className={scoreCardClass}>
      <CardHeader className={isOpponent ? 'p-2' : 'p-4'}>
        <CardTitle className={isOpponent ? 'text-lg' : 'text-xl'}>
          {username ? `${username}'s Score` : 'Score'}
        </CardTitle>
      </CardHeader>
      <CardContent className={isOpponent ? 'p-2 pt-0' : 'p-4 pt-0'}>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="font-medium">Score:</span>
            <span className="font-bold">{score}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Lines:</span>
            <span className="font-bold">{rows}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Level:</span>
            <span className="font-bold">{level}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreBoard;
