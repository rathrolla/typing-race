export const ClientEvents = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  PLAYER_READY: 'player:ready',
  GAME_START: 'game:start',
  ROUND_SUBMIT: 'round:submit',
  PLAYER_PROGRESS: 'player:progress',
  ROOM_SET_MAX_PLAYERS: 'room:setMaxPlayers',
  ROOM_SET_TYPING_MODE: 'room:setTypingMode',
  GAME_PLAY_AGAIN: 'game:playAgain',
} as const;

export const ServerEvents = {
  ROOM_STATE: 'room:state',
  ROUND_START: 'round:start',
  ROUND_TICK: 'round:tick',
  ROUND_END: 'round:end',
  GAME_OVER: 'game:over',
  ERROR: 'error',
} as const;

export interface RoomCreatePayload {
  maxPlayers: number;
  displayName: string;
  sessionId?: string;
}

export interface RoomJoinPayload {
  roomCode: string;
  displayName: string;
  sessionId?: string;
}

export interface PlayerReadyPayload {
  ready: boolean;
}

export interface RoundSubmitPayload {
  typed: string;
  clientElapsedMs: number;
}

export interface PlayerProgressPayload {
  charsCorrect: number;
}

export interface RoundStartPayload {
  roundIndex: number;
  wordLength: number;
  word: string;
  startedAt: number;
  endsAt: number;
  timeoutMs: number;
}

export interface RoundTickPayload {
  remainingMs: number;
  endsAt: number;
}

export interface RoundEndPayload {
  result: import('./types.js').RoundResult;
  standings: import('./types.js').PlayerStanding[];
}

export interface GameOverPayload {
  standings: import('./types.js').PlayerStanding[];
  roundResults: import('./types.js').RoundResult[];
}

export interface ErrorPayload {
  message: string;
}
