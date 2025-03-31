import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Instructions from './Instructions';
import { useAudio } from '@/lib/stores/useAudio';

interface Props {
  onStartSinglePlayer: () => void;
  onStartMultiplayer: () => void;
}

const MainMenu: React.FC<Props> = ({ onStartSinglePlayer, onStartMultiplayer }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const { isMuted, toggleMute } = useAudio();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-black">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        {/* Background tetromino pattern SVG */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="tetrominoPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="5" height="5" fill="#FF0000" />
            <rect x="5" y="0" width="5" height="5" fill="#00FF00" />
            <rect x="10" y="0" width="5" height="5" fill="#0000FF" />
            <rect x="0" y="5" width="5" height="5" fill="#FFFF00" />
            <rect x="5" y="5" width="5" height="5" fill="#FF00FF" />
            <rect x="10" y="5" width="5" height="5" fill="#00FFFF" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tetrominoPattern)" />
        </svg>
      </div>

      <Card className="w-full max-w-md mx-4 bg-opacity-90 bg-card">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-4xl font-bold tracking-tight text-blue-500">
            TETRIS
          </CardTitle>
          <CardDescription className="text-lg">
            The Classic Block Stacking Game
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {showInstructions ? (
            <>
              <Instructions />
              <Button variant="tetris" onClick={() => setShowInstructions(false)}>
                Back to Menu
              </Button>
            </>
          ) : (
            <>
              <Button variant="tetris" size="lg" onClick={onStartSinglePlayer} className="text-lg py-6">
                Single Player
              </Button>
              
              <Button variant="tetris" size="lg" onClick={onStartMultiplayer} className="text-lg py-6">
                Multiplayer
              </Button>
              
              <Button variant="outline" onClick={() => setShowInstructions(true)}>
                How to Play
              </Button>
              
              <Button variant={isMuted ? 'outline' : 'secondary'} onClick={toggleMute}>
                {isMuted ? 'Unmute Sound' : 'Mute Sound'}
              </Button>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>Music and sound effects from freesound.org</p>
                <p>© 2023 Tetris Game</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainMenu;
