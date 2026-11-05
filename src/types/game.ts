export type GamePhase = 'LOBBY' | 'SELECTING_WORD' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';

export interface AvatarConfig {
  color: string;
  eyes: number; // 0 - 5
  mouth: number; // 0 - 5
}

export interface PlayerData {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isHost: boolean;
  score: number;
  hasGuessedCorrectly: boolean;
  isDrawing: boolean;
  isReady: boolean;
  isBot?: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number; // in seconds
  wordCount: number; // 1 - 5 words to choose from
  hintsCount: number; // 0 - 5
  wordCategory: string; // 'all' | 'animals' | 'food' | 'objects' | 'actions'
  customWords: string[];
}

export interface StrokePoint {
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
}

export interface DrawStroke {
  id: string;
  color: string;
  size: number;
  isEraser: boolean;
  points: StrokePoint[];
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  text: string;
  type: 'chat' | 'guess' | 'correct' | 'close' | 'system' | 'leave';
  timestamp: number;
}

export interface RoomState {
  id: string;
  name: string;
  isPrivate: boolean;
  settings: RoomSettings;
  phase: GamePhase;
  currentRound: number;
  currentDrawerId: string | null;
  drawerName: string | null;
  wordToGuess: string; // blanked out for non-drawers unless round ended
  revealedHints: string; // e.g. "c _ t"
  wordLength: number;
  timeLeft: number;
  players: PlayerData[];
  wordOptions?: string[]; // only sent to active drawer
  roundWinnerInfo?: {
    word: string;
    pointsEarned: { [playerId: string]: number };
  };
  winner?: {
    player: PlayerData;
    leaderboard: PlayerData[];
  };
}
