import type { TypingMode } from './types.js';

/** Apply random uppercase letters to a lowercase word (at least one capital for length >= 3). */
export function applyMixedCase(word: string): string {
  const lower = word.toLowerCase();
  if (lower.length <= 2) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  const chars = lower.split('');
  const minCaps = 1;
  const maxCaps = Math.max(minCaps, Math.ceil(chars.length * 0.5));
  const capCount =
    minCaps + Math.floor(Math.random() * (maxCaps - minCaps + 1));

  const indices = new Set<number>();
  while (indices.size < capCount) {
    indices.add(Math.floor(Math.random() * chars.length));
  }

  for (const i of indices) {
    chars[i] = chars[i].toUpperCase();
  }

  return chars.join('');
}

export function applyWordCasing(word: string, mode: TypingMode): string {
  const lower = word.toLowerCase();
  switch (mode) {
    case 'mixed':
      return applyMixedCase(lower);
    case 'uppercase':
      return lower.toUpperCase();
    case 'lowercase':
      return lower;
    case 'paragraph':
      return lower;
  }
}

export function buildParagraph(words: string[], mode: TypingMode): string {
  const cased =
    mode === 'paragraph'
      ? words.map((w) => w.toLowerCase())
      : words.map((w) => applyWordCasing(w, mode));
  return cased.join(' ');
}

export function normalizeWordKey(word: string): string {
  return word.toLowerCase();
}
