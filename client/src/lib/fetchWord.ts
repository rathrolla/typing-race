import {
  applyWordCasing,
  buildParagraph,
  normalizeWordKey,
  type TypingMode,
} from '@typing-race/shared';
import fallbackWords from './fallback-words.json';

const usedWords = new Set<string>();

function pickFallbackWord(length: number): string {
  const words = (fallbackWords as Record<string, string[]>)[String(length)] ?? [];
  const available = words.filter((w) => !usedWords.has(normalizeWordKey(w)));
  const pool = available.length > 0 ? available : words;
  return pool[Math.floor(Math.random() * pool.length)] ?? 'word';
}

async function fetchBaseWord(length: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const url = `https://random-word-api.ververak.eu/api?words=5&length=${length}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const words = (await res.json()) as string[];
      const valid = words.find(
        (w) =>
          w.length === length &&
          /^[a-z]+$/i.test(w) &&
          !usedWords.has(normalizeWordKey(w))
      );
      if (valid) return valid.toLowerCase();
    }
  } catch {
    // use fallback
  }
  return pickFallbackWord(length).toLowerCase();
}

export async function fetchWord(length: number, mode: TypingMode = 'mixed'): Promise<string> {
  const base = await fetchBaseWord(length);
  const word = applyWordCasing(base, mode);
  usedWords.add(normalizeWordKey(word));
  return word;
}

export async function fetchParagraph(targetChars: number, mode: TypingMode): Promise<string> {
  const words: string[] = [];
  let length = 0;

  while (length < targetChars) {
    const wordLen = 3 + Math.floor(Math.random() * 6);
    const base = await fetchBaseWord(wordLen);
    words.push(base);
    length += base.length + (words.length > 1 ? 1 : 0);
  }

  let text = buildParagraph(words, mode);
  if (text.length > targetChars + 30) {
    text = text.slice(0, targetChars).trimEnd();
  }
  usedWords.add(normalizeWordKey(text));
  return text;
}

export async function fetchChallenge(
  roundLength: number,
  mode: TypingMode
): Promise<string> {
  if (mode === 'paragraph') {
    return fetchParagraph(roundLength, mode);
  }
  return fetchWord(roundLength, mode);
}

export function resetWordCache(): void {
  usedWords.clear();
}
