// Game state
export interface GameState {
  stage: Array<Array<[number, string]>>;
  score: number;
  rows: number;
  level: number;
  gameOver: boolean;
  nextPiece: string;
}

// Tetromino movement
export interface Pos {
  x: number;
  y: number;
}

export interface Movement {
  x: number;
  y: number;
  collided: boolean;
}

// Player
export interface Player {
  pos: Pos;
  tetromino: Tetromino;
  collided: boolean;
}

// Tetromino shape
export type Tetromino = {
  shape: Array<Array<number | string>>;
  color: string;
};

// Room
export interface Room {
  id: string;
  players: string[];
}

// WebSocket message types
export enum MessageType {
  ROOMS_LIST = 'rooms_list',
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  JOIN_SUCCESS = 'join_success',
  LEAVE_ROOM = 'leave_room',
  ROOM_UPDATE = 'room_update',
  GAME_START = 'game_start',
  GAME_UPDATE = 'game_update',
  GARBAGE_LINES = 'garbage_lines',
  PLAYER_LEFT = 'player_left',
  ERROR = 'error'
}

// WebSocket messages
export interface RoomsListMessage {
  type: MessageType.ROOMS_LIST;
  rooms: Room[];
}

export interface CreateRoomMessage {
  type: MessageType.CREATE_ROOM;
  username: string;
  room: string;
}

export interface JoinRoomMessage {
  type: MessageType.JOIN_ROOM;
  username: string;
  room: string;
}

export interface JoinSuccessMessage {
  type: MessageType.JOIN_SUCCESS;
  room: string;
}

export interface LeaveRoomMessage {
  type: MessageType.LEAVE_ROOM;
  username: string;
  room: string;
}

export interface RoomUpdateMessage {
  type: MessageType.ROOM_UPDATE;
  room: string;
  players: string[];
}

export interface GameStartMessage {
  type: MessageType.GAME_START;
  countdown: number;
}

export interface GameUpdateMessage {
  type: MessageType.GAME_UPDATE;
  room: string;
  username: string;
  data: GameState;
}

export interface GarbageLinesMessage {
  type: MessageType.GARBAGE_LINES;
  room: string;
  username: string;
  lines: number;
}

export interface PlayerLeftMessage {
  type: MessageType.PLAYER_LEFT;
  username: string;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  message: string;
}

export type WebSocketMessage =
  | RoomsListMessage
  | CreateRoomMessage
  | JoinRoomMessage
  | JoinSuccessMessage
  | LeaveRoomMessage
  | RoomUpdateMessage
  | GameStartMessage
  | GameUpdateMessage
  | GarbageLinesMessage
  | PlayerLeftMessage
  | ErrorMessage;
