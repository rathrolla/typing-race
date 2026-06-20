import { calculateWpm, PLAYER_COLORS } from '@typing-race/shared';

export type SoloDifficulty = 'easy' | 'medium' | 'hard';

const BOT_NAMES = ['KeyStorm', 'TypeBot', 'RacerX'] as const;

const WPM_RANGES: Record<SoloDifficulty, [number, number]> = {
  easy: [20, 30],
  medium: [40, 55],
  hard: [65, 85],
};

const VARIANCE: Record<SoloDifficulty, number> = {
  easy: 0.2,
  medium: 0.15,
  hard: 0.1,
};

export interface SoloRacer {
  id: string;
  name: string;
  color: string;
  isBot: boolean;
}

export interface BotRoundPlan {
  racerId: string;
  wpm: number;
  finishTimeMs: number;
  willFinish: boolean;
}

export function createBots(count: 1 | 2 | 3): SoloRacer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${i}`,
    name: BOT_NAMES[i],
    color: PLAYER_COLORS[i + 1],
    isBot: true,
  }));
}

export function planBotRound(
  bot: SoloRacer,
  wordLength: number,
  timeoutMs: number,
  difficulty: SoloDifficulty
): BotRoundPlan {
  const [min, max] = WPM_RANGES[difficulty];
  const baseWpm = min + Math.random() * (max - min);
  const wpm = Math.round(baseWpm * (1 + (Math.random() - 0.5) * VARIANCE[difficulty]) * 10) / 10;
  const finishTimeMs = Math.round(((wordLength / 5) / (wpm / 60)) * 1000);
  const willFinish = finishTimeMs <= timeoutMs;

  return {
    racerId: bot.id,
    wpm,
    finishTimeMs: willFinish ? finishTimeMs : timeoutMs + 1,
    willFinish,
  };
}

export function getBotCharsCorrect(
  plan: BotRoundPlan,
  elapsedMs: number,
  wordLength: number
): number {
  if (!plan.willFinish) {
    return Math.min(wordLength - 1, Math.floor((elapsedMs / plan.finishTimeMs) * wordLength * 0.7));
  }
  if (elapsedMs >= plan.finishTimeMs) return wordLength;
  return Math.min(wordLength, Math.floor((elapsedMs / plan.finishTimeMs) * wordLength));
}

export function getBotProgress(
  plan: BotRoundPlan,
  elapsedMs: number,
  wordLength: number,
  roundStartedAt: number
) {
  const charsCorrect = getBotCharsCorrect(plan, elapsedMs, wordLength);
  const finished = plan.willFinish && elapsedMs >= plan.finishTimeMs;

  return {
    playerId: plan.racerId,
    charsCorrect,
    finished,
    finishTimeMs: finished ? roundStartedAt + plan.finishTimeMs : null,
    wpm: finished ? calculateWpm(wordLength, plan.finishTimeMs) : null,
  };
}
