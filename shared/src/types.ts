export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type MaxPlayers = number;
export type TypingMode = 'mixed' | 'uppercase' | 'lowercase' | 'paragraph';

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  ready: boolean;
  connected: boolean;
}

export interface PlayerProgress {
  playerId: string;
  charsCorrect: number;
  finished: boolean;
  finishTimeMs: number | null;
  wpm: number | null;
}

export interface CurrentRound {
  roundIndex: number;
  wordLength: number;
  word: string;
  startedAt: number;
  endsAt: number;
  timeoutMs: number;
}

export interface RoundPlayerResult {
  playerId: string;
  name: string;
  color: string;
  finished: boolean;
  finishTimeMs: number | null;
  wpm: number | null;
  rank: number;
}

export interface RoundResult {
  roundIndex: number;
  wordLength: number;
  word: string;
  rankings: RoundPlayerResult[];
}

export interface PlayerStanding {
  playerId: string;
  name: string;
  color: string;
  roundWins: number;
  avgWpm: number;
  fastestWordMs: number | null;
  totalFinished: number;
}

export interface RoomState {
  roomCode: string;
  maxPlayers: MaxPlayers;
  typingMode: TypingMode;
  hostId: string;
  status: RoomStatus;
  players: Player[];
  currentRound: CurrentRound | null;
  roundResults: RoundResult[];
  liveProgress: PlayerProgress[];
  finalStandings: PlayerStanding[] | null;
}

export interface ClientRoomState extends Omit<RoomState, 'currentRound'> {
  currentRound: Omit<CurrentRound, 'word'> & { word?: string } | null;
  playerId: string | null;
}

export function sanitizeRoomForClient(
  room: RoomState,
  playerId: string | null,
  revealWord = false
): ClientRoomState {
  const { currentRound, ...rest } = room;
  return {
    ...rest,
    playerId,
    currentRound: currentRound
      ? {
          roundIndex: currentRound.roundIndex,
          wordLength: currentRound.wordLength,
          startedAt: currentRound.startedAt,
          endsAt: currentRound.endsAt,
          timeoutMs: currentRound.timeoutMs,
          ...(revealWord ? { word: currentRound.word } : {}),
        }
      : null,
  };
}
