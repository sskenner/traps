import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  score: number;
  level: number;
  rows: number;
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOver: React.FC<Props> = ({ score, level, rows, onRestart, onMainMenu }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-red-500">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-500">GAME OVER</CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-4">
          <div className="text-center space-y-2 mb-4">
            <p className="text-xl font-semibold">Final Score: <span className="text-blue-500">{score}</span></p>
            <p>Level Reached: {level}</p>
            <p>Lines Cleared: {rows}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="tetris" onClick={onRestart}>
              Play Again
            </Button>
            
            <Button variant="outline" onClick={onMainMenu}>
              Main Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOver;
