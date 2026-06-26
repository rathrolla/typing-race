export const ROUND_LENGTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const PARAGRAPH_CHAR_LENGTHS = [80, 100, 120, 140, 160, 180, 200, 220, 240, 260] as const;
export const TOTAL_ROUNDS = ROUND_LENGTHS.length;

export const TYPING_MODE_OPTIONS = [
  { id: 'mixed', label: 'Mixed case', description: 'Random capitals and lowercase' },
  { id: 'uppercase', label: 'ALL CAPS', description: 'Every letter uppercase' },
  { id: 'lowercase', label: 'lowercase', description: 'Every letter lowercase' },
  { id: 'paragraph', label: 'Paragraph', description: 'Type full sentences' },
] as const satisfies ReadonlyArray<{ id: import('./types.js').TypingMode; label: string; description: string }>;

export function getRoundLengths(mode: import('./types.js').TypingMode): readonly number[] {
  return mode === 'paragraph' ? PARAGRAPH_CHAR_LENGTHS : ROUND_LENGTHS;
}

export function getTotalRounds(mode: import('./types.js').TypingMode): number {
  return getRoundLengths(mode).length;
}

export const ROUND_REVEAL_MS = 2000;

export function getTimeoutMs(wordLength: number, mode?: import('./types.js').TypingMode): number {
  if (mode === 'paragraph') return 5000 + wordLength * 100;
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
