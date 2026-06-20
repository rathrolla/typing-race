import fallbackWords from './fallback-words.json';

const usedWords = new Set<string>();

function pickFallback(length: number): string {
  const words = (fallbackWords as Record<string, string[]>)[String(length)] ?? [];
  const available = words.filter((w) => !usedWords.has(w));
  const pool = available.length > 0 ? available : words;
  const word = pool[Math.floor(Math.random() * pool.length)] ?? 'word';
  usedWords.add(word);
  return word;
}

export async function fetchWord(length: number): Promise<string> {
  const fallback = () => pickFallback(length);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const url = `https://random-word-api.ververak.eu/api?words=5&length=${length}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const words = (await res.json()) as string[];
      const valid = words.find(
        (w) => w.length === length && /^[a-z]+$/i.test(w) && !usedWords.has(w.toLowerCase())
      );
      if (valid) {
        const word = valid.toLowerCase();
        usedWords.add(word);
        return word;
      }
    }
  } catch {
    // use fallback
  }

  return fallback();
}

export function resetWordCache(): void {
  usedWords.clear();
}
