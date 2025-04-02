import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MultiplayerGame from './MultiplayerGame';

interface Room {
  id: string;
  players: string[];
}

interface Props {
  onBack: () => void;
}

const MultiplayerLobby: React.FC<Props> = ({ onBack }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    let ws: WebSocket;
    
    try {
      // Construct WebSocket URL based on environment
      const isProduction = window.location.hostname === 'traps2.replit.app';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = isProduction ? '' : ':5000';
      const wsUrl = `${wsProtocol}//${wsHost}${wsPort}/ws`;
      console.log('Connecting to WebSocket at:', wsUrl);
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to game server. Please try again later.');
      };
      
      ws.onmessage = (event) => {
        handleSocketMessage(event);
      };
      
      setSocket(ws);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to connect to game server. Please try again later.');
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);
  
  // Handle socket messages
  const handleSocketMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'rooms_list':
          setAvailableRooms(message.rooms);
          break;
          
        case 'join_success':
          setJoinedRoom(message.room);
          break;
          
        case 'room_update':
          if (message.players.length > 1) {
            // Find opponent (player who is not the current user)
            const opponentName = message.players.find((p: string) => p !== username);
            setOpponent(opponentName || null);
          } else {
            setOpponent(null);
          }
          break;
          
        case 'error':
          setError(message.message);
          setTimeout(() => setError(null), 5000);
          break;
      }
    } catch (error) {
      console.error('Error parsing socket message:', error);
    }
  };
  
  // Create a new room
  const createRoom = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    
    if (socket) {
      const roomToCreate = roomId || generateRoomId();
      socket.send(JSON.stringify({
        type: 'create_room',
        username,
        room: roomToCreate
      }));
      
      setRoomId(roomToCreate);
    }
  };
  
  // Join an existing room
  const joinRoom = (roomToJoin: string) => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    
    if (socket) {
      socket.send(JSON.stringify({
        type: 'join_room',
        username,
        room: roomToJoin
      }));
    }
  };
  
  // Request available rooms
  const refreshRooms = () => {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'list_rooms'
      }));
    }
  };
  
  // Leave the current room
  const leaveRoom = () => {
    if (socket && joinedRoom) {
      socket.send(JSON.stringify({
        type: 'leave_room',
        username,
        room: joinedRoom
      }));
      
      setJoinedRoom(null);
      setOpponent(null);
    }
  };
  
  // Generate a random room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  
  // Refresh room list when connected
  useEffect(() => {
    if (connected) {
      refreshRooms();
      
      // Set up interval to refresh rooms
      const interval = setInterval(refreshRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [connected]);
  
  // If we're in a game, show the game component
  if (joinedRoom) {
    return (
      <MultiplayerGame
        socket={socket}
        roomId={joinedRoom}
        username={username}
        opponent={opponent}
        onExit={leaveRoom}
      />
    );
  }
  
  // Otherwise show the lobby UI
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tetris Multiplayer Lobby</CardTitle>
          <CardDescription>Play against other players online</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-4">
            <div 
              className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm">
              {connected ? 'Connected to server' : 'Disconnected'}
            </span>
          </div>
          
          {/* User Info */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!!joinedRoom}
              className="flex-1"
            />
          </div>
          
          {/* Create Room */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Create a Room</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Room ID (optional)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="tetris" 
                onClick={createRoom}
                disabled={!connected || !username}
              >
                Create
              </Button>
            </div>
          </div>
          
          {/* Available Rooms */}
          <div className="pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Join a Room</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRooms}
                disabled={!connected}
              >
                Refresh
              </Button>
            </div>
            
            {availableRooms.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No rooms available. Create one to start playing!
              </div>
            ) : (
              <div className="space-y-2">
                {availableRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">{room.id}</div>
                      <div className="text-sm text-gray-500">
                        Players: {room.players.length}/2
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => joinRoom(room.id)}
                      disabled={!connected || !username || room.players.length >= 2}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Back Button */}
          <div className="pt-4">
            <Button variant="outline" onClick={onBack}>
              Back to Main Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiplayerLobby;
