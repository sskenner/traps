import React, { useState, useCallback } from 'react';
import { useTetris } from '@/lib/stores/useTetris';
import MainMenu from '@/components/Menu/MainMenu';
import MultiplayerLobby from '@/components/Multiplayer/MultiplayerLobby';
import SinglePlayerGame from '@/components/SinglePlayer/SinglePlayerGame'; //Import added


enum GameMode {
  MENU,
  SINGLE_PLAYER,
  MULTIPLAYER
}

const HomePage: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MENU);
  const { resetGame } = useTetris();

  // Return to main menu
  const handleMainMenu = useCallback(() => {
    console.log("Returning to main menu");
    resetGame();
    setGameMode(GameMode.MENU);
  }, [resetGame]);

  // Start single player mode
  const handleStartSinglePlayer = useCallback(() => {
    console.log("Starting single player mode from HomePage");
    setGameMode(GameMode.SINGLE_PLAYER);
    resetGame();
  }, [resetGame]);

  // Start multiplayer mode
  const handleStartMultiplayer = useCallback(() => {
    console.log("Starting multiplayer mode from HomePage");
    resetGame();
    // Use setTimeout to ensure state is cleared before transitioning
    setTimeout(() => {
      setGameMode(GameMode.MULTIPLAYER);
    }, 0);
  }, [resetGame]);

  console.log("Current game mode:", GameMode[gameMode]);

  // Render the appropriate game mode
  switch (gameMode) {
    case GameMode.MENU:
      return (
        <MainMenu 
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
        />
      );
    case GameMode.SINGLE_PLAYER:
      return <SinglePlayerGame onMainMenu={handleMainMenu} />;
    case GameMode.MULTIPLAYER:
      return <MultiplayerLobby onBack={handleMainMenu} />;
    default:
      return null;
  }
};

export default HomePage;