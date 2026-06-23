export const ROUND_LENGTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const TOTAL_ROUNDS = ROUND_LENGTHS.length;

export const ROUND_REVEAL_MS = 2000;

export function getTimeoutMs(wordLength: number): number {
  return 3000 + wordLength * 800;
}

export const PLAYER_COLORS = [
  '#22d3ee',
  '#a78bfa',
  '#f472b6',
  '#4ade80',
  '#fbbf24',
  '#fb7185',
  '#38bdf8',
  '#c084fc',
] as const;

export const ROOM_CODE_LENGTH = 6;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

export function clampPlayerCount(count: number): number {
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)));
}

export function isValidPlayerCount(count: number): boolean {
  return Number.isInteger(count) && count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}
