import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TetrisBoard from '../Game/TetrisBoard';
import ScoreBoard from '../Game/ScoreBoard';
import NextPiece from '../Game/NextPiece';
import GameOver from '../Menu/GameOver';
import PlayerBoard from './PlayerBoard';
import { useTetris } from '@/lib/stores/useTetris';
import { useAudio } from '@/lib/stores/useAudio';

interface Props {
  socket: WebSocket | null;
  roomId: string;
  username: string;
  opponent: string | null;
  onExit: () => void;
}

const MultiplayerGame: React.FC<Props> = ({ 
  socket, 
  roomId, 
  username, 
  opponent,
  onExit 
}) => {
  const [opponentData, setOpponentData] = useState({
    stage: [],
    score: 0,
    level: 0,
    rows: 0,
    gameOver: false,
    nextPiece: 'I'
  });
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  
  const { 
    player, 
    stage, 
    score, 
    rows, 
    level, 
    nextPiece,
    startGame: startLocalGame,
    resetGame: resetLocalGame,
    addGarbageLines
  } = useTetris();
  
  const { playHit } = useAudio();
  
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle sending game updates to opponent
  useEffect(() => {
    if (socket && gameStarted && !gameOver) {
      const gameData = {
        type: 'game_update',
        room: roomId,
        username,
        data: {
          stage,
          score,
          level,
          rows,
          gameOver,
          nextPiece
        }
      };
      
      socket.send(JSON.stringify(gameData));
    }
  }, [socket, stage, score, level, rows, gameOver, gameStarted, nextPiece, roomId, username]);
  
  // Handle incoming socket messages
  useEffect(() => {
    if (!socket) return;
    
    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'game_update':
            // Only update if message is from opponent
            if (message.username !== username) {
              setOpponentData(message.data);
              
              // Check if opponent game over
              if (message.data.gameOver && gameStarted && !gameOver) {
                handleWin();
              }
            }
            break;
            
          case 'game_start':
            handleGameStart(message.countdown);
            break;
            
          case 'garbage_lines':
            // Only add garbage if message is from opponent
            if (message.username !== username) {
              addGarbageLines(message.lines);
              playHit();
            }
            break;
            
          case 'player_left':
            if (gameStarted && !gameOver) {
              handleWin();
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing socket message:', error);
      }
    };
    
    socket.addEventListener('message', handleSocketMessage);
    
    return () => {
      socket.removeEventListener('message', handleSocketMessage);
    };
  }, [socket, username, gameStarted, gameOver, playHit, addGarbageLines]);
  
  // Handle countdown for game start
  useEffect(() => {
    if (countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
        
        if (countdown === 1) {
          setGameStarted(true);
          startLocalGame();
        }
      }, 1000);
    }
    
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [countdown, startLocalGame]);
  
  // Request to start the game
  const requestGameStart = () => {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'request_start',
        room: roomId,
        username
      }));
    }
  };
  
  // Handle game start message
  const handleGameStart = (countdownValue: number) => {
    setCountdown(countdownValue);
    resetLocalGame();
  };
  
  // Handle sending garbage lines to opponent
  const handleLinesClear = (lines: number) => {
    if (socket && lines > 1) {
      // Send one less line than cleared (minimum 1)
      const garbageLines = Math.max(1, lines - 1);
      
      socket.send(JSON.stringify({
        type: 'garbage_lines',
        room: roomId,
        username,
        lines: garbageLines
      }));
    }
  };
  
  // Handle local game over
  const handleGameOver = () => {
    setGameOver(true);
    
    if (socket) {
      socket.send(JSON.stringify({
        type: 'game_update',
        room: roomId,
        username,
        data: {
          stage,
          score,
          level,
          rows,
          gameOver: true,
          nextPiece
        }
      }));
    }
  };
  
  // Handle winning the game
  const handleWin = () => {
    setGameOver(true);
    setWinner(username);
  };
  
  // Reset the game
  const resetGame = () => {
    setGameOver(false);
    setWinner(null);
    requestGameStart();
  };
  
  // Exit the game
  const handleExit = () => {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'leave_room',
        room: roomId,
        username
      }));
    }
    
    onExit();
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Game Header */}
      <Card className="mb-4">
        <CardHeader className="py-2">
          <div className="flex justify-between items-center">
            <CardTitle>Multiplayer Tetris</CardTitle>
            <div className="text-sm">
              Room: <span className="font-mono">{roomId}</span>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Countdown Overlay */}
      {countdown > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-6xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}
      
      {/* Game Container */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Player's Game */}
        <div className="flex-1">
          <Card className="mb-4">
            <CardHeader className="py-2">
              <CardTitle>{username} (You)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              <TetrisBoard 
                isMultiplayer={true} 
                onLinesClear={handleLinesClear}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <ScoreBoard score={score} rows={rows} level={level} />
            
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Next Piece</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex justify-center">
                  <NextPiece nextPiece={nextPiece} />
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="tetris" 
                  onClick={requestGameStart}
                  disabled={gameStarted && !gameOver}
                >
                  {!gameStarted || gameOver ? 'Start Game' : 'Playing'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleExit}
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Opponent's Game */}
        <div className="flex-1">
          <Card className="mb-4">
            <CardHeader className="py-2">
              <CardTitle>{opponent || 'Waiting for opponent...'}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              {opponent ? (
                <PlayerBoard
                  stage={opponentData.stage}
                  isOpponent={true}
                />
              ) : (
                <div className="h-[600px] w-full flex items-center justify-center bg-gray-800 text-gray-400">
                  Waiting for opponent to join...
                </div>
              )}
            </CardContent>
          </Card>
          
          {opponent && (
            <div className="grid grid-cols-2 gap-4">
              <ScoreBoard 
                score={opponentData.score} 
                rows={opponentData.rows} 
                level={opponentData.level}
                isOpponent={true}
                username={opponent}
              />
              
              <Card>
                <CardHeader className="p-2">
                  <CardTitle className="text-lg">Next Piece</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 flex justify-center">
                  <NextPiece nextPiece={opponentData.nextPiece as any} size={15} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Game Over Modal */}
      {gameOver && (
        <GameOver
          score={score}
          level={level}
          rows={rows}
          onRestart={resetGame}
          onMainMenu={handleExit}
        />
      )}
      
      {/* Winner Announcement */}
      {winner && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 border-green-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-500">WINNER!</CardTitle>
            </CardHeader>
            
            <CardContent className="flex flex-col gap-4 text-center">
              <p className="text-xl font-semibold">{winner} wins the game!</p>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button variant="tetris" onClick={resetGame}>
                  Play Again
                </Button>
                
                <Button variant="outline" onClick={handleExit}>
                  Exit Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;
