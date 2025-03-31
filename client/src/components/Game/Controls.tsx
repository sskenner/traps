import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAudio } from '@/lib/stores/useAudio';

interface Props {
  onStartGame: () => void;
  onResetGame: () => void;
  gameStarted: boolean;
  gameOver: boolean;
}

const Controls: React.FC<Props> = ({ 
  onStartGame, 
  onResetGame,
  gameStarted,
  gameOver
}) => {
  const { isMuted, toggleMute } = useAudio();

  return (
    <Card className="w-full">
      <CardHeader className="p-4">
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="tetris" 
              onClick={onStartGame}
              disabled={gameStarted && !gameOver}
            >
              {!gameStarted || gameOver ? 'Start Game' : 'Game Running'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onResetGame}
              disabled={!gameStarted}
            >
              Reset Game
            </Button>
          </div>
          
          <Button
            variant={isMuted ? 'outline' : 'secondary'}
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute Sound' : 'Mute Sound'}
          </Button>
          
          <div className="mt-2">
            <h3 className="text-sm font-semibold mb-2">Keyboard Controls:</h3>
            <ul className="text-xs space-y-1">
              <li>← → : Move left/right</li>
              <li>↓ : Move down</li>
              <li>↑ : Rotate</li>
              <li>Space : Hard drop</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Controls;
