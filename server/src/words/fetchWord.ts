import { applyMixedCase, normalizeWordKey } from '@typing-race/shared';
import fallbackWords from './fallback-words.json' with { type: 'json' };

const usedWords = new Set<string>();

function pickFallback(length: number): string {
  const words = (fallbackWords as Record<string, string[]>)[String(length)] ?? [];
  const available = words.filter((w) => !usedWords.has(normalizeWordKey(w)));
  const pool = available.length > 0 ? available : words;
  const base = pool[Math.floor(Math.random() * pool.length)] ?? 'word';
  const word = applyMixedCase(base);
  usedWords.add(normalizeWordKey(word));
  return word;
}

export async function fetchWord(length: number): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://random-word-api.ververak.eu/api?words=5&length=${length}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const words = (await res.json()) as string[];
      const valid = words.find(
        (w) =>
          w.length === length &&
          /^[a-z]+$/i.test(w) &&
          !usedWords.has(normalizeWordKey(w))
      );
      if (valid) {
        const word = applyMixedCase(valid);
        usedWords.add(normalizeWordKey(word));
        return word;
      }
    } catch {
      // fall through to retry
    }
  }
  return pickFallback(length);
}

export function resetWordCache(): void {
  usedWords.clear();
}
