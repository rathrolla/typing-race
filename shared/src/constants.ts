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
