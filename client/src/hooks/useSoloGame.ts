import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ROUND_LENGTHS,
  TOTAL_ROUNDS,
  ROUND_REVEAL_MS,
  calculateWpm,
  computeStandings,
  getTimeoutMs,
  PLAYER_COLORS,
  rankRoundResults,
  type GameOverPayload,
  type PlayerProgress,
  type RoundEndPayload,
  type RoundResult,
} from '@typing-race/shared';
import {
  createBots,
  planBotRound,
  getBotProgress,
  type BotRoundPlan,
  type SoloDifficulty,
  type SoloRacer,
} from '../lib/botRacer';
import { fetchWord, resetWordCache } from '../lib/fetchWord';

export const HUMAN_ID = 'human';

export type SoloMode = 'practice' | 'vsComputer';

export interface SoloConfig {
  displayName: string;
  mode: SoloMode;
  botCount: 1 | 2 | 3;
  difficulty: SoloDifficulty;
}

export interface SoloGameState {
  status: 'idle' | 'loading' | 'playing' | 'interstitial' | 'finished';
  config: SoloConfig | null;
  racers: SoloRacer[];
  roundIndex: number;
  word: string | null;
  wordLength: number;
  remainingMs: number;
  roundStartedAt: number;
  timeoutMs: number;
  liveProgress: PlayerProgress[];
  lastRoundResult: RoundEndPayload | null;
  gameOver: GameOverPayload | null;
}

const initialState: SoloGameState = {
  status: 'idle',
  config: null,
  racers: [],
  roundIndex: 0,
  word: null,
  wordLength: 0,
  remainingMs: 0,
  roundStartedAt: 0,
  timeoutMs: 0,
  liveProgress: [],
  lastRoundResult: null,
  gameOver: null,
};

export function useSoloGame() {
  const [state, setState] = useState<SoloGameState>(initialState);
  const roundStartedAtRef = useRef(0);
  const endsAtRef = useRef(0);
  const botPlansRef = useRef<BotRoundPlan[]>([]);
  const progressRef = useRef<Map<string, PlayerProgress>>(new Map());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interstitialRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundResultsRef = useRef<RoundResult[]>([]);
  const racersRef = useRef<SoloRacer[]>([]);
  const configRef = useRef<SoloConfig | null>(null);
  const currentWordRef = useRef<string | null>(null);
  const roundIndexRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    if (interstitialRef.current) clearTimeout(interstitialRef.current);
    tickRef.current = null;
    endTimeoutRef.current = null;
    interstitialRef.current = null;
  }, []);

  const endRound = useCallback(
    (roundIndex: number) => {
      const word = currentWordRef.current;
      const wordLength = ROUND_LENGTHS[roundIndex];
      if (!word) return;

      clearTimers();

      const elapsed = Date.now() - roundStartedAtRef.current;
      for (const plan of botPlansRef.current) {
        const botProg = getBotProgress(plan, elapsed, wordLength, roundStartedAtRef.current);
        const existing = progressRef.current.get(plan.racerId);
        if (existing && !existing.finished && botProg.finished) {
          progressRef.current.set(plan.racerId, botProg);
        } else if (existing && !existing.finished) {
          progressRef.current.set(plan.racerId, {
            ...existing,
            charsCorrect: botProg.charsCorrect,
            finished: false,
            finishTimeMs: null,
            wpm: null,
          });
        }
      }

      const rankings = rankRoundResults(
        racersRef.current.map((r) => ({ id: r.id, name: r.name, color: r.color })),
        progressRef.current,
        wordLength,
        roundStartedAtRef.current,
        endsAtRef.current
      );

      const result: RoundResult = { roundIndex, wordLength, word, rankings };
      roundResultsRef.current.push(result);
      const standings = computeStandings(
        racersRef.current.map((r) => ({ id: r.id, name: r.name, color: r.color })),
        roundResultsRef.current
      );

      setState((s) => ({
        ...s,
        status: 'interstitial',
        word: null,
        lastRoundResult: { result, standings },
        liveProgress: [...progressRef.current.values()],
      }));

      interstitialRef.current = setTimeout(() => {
        void startRoundRef.current(roundIndex + 1);
      }, 2500);
    },
    [clearTimers]
  );

  const startRoundRef = useRef<(index: number) => Promise<void>>(async () => {});

  const checkRoundComplete = useCallback(
    (roundIndex: number) => {
      const allDone = [...progressRef.current.values()].every((p) => p.finished);
      if (allDone) endRound(roundIndex);
    },
    [endRound]
  );

  const startRound = useCallback(
    async (roundIndex: number, config: SoloConfig, racers: SoloRacer[]) => {
      if (roundIndex >= TOTAL_ROUNDS) {
        clearTimers();
        const standings = computeStandings(
          racers.map((r) => ({ id: r.id, name: r.name, color: r.color })),
          roundResultsRef.current
        );
        setState((s) => ({
          ...s,
          status: 'finished',
          word: null,
          gameOver: { standings, roundResults: roundResultsRef.current },
          lastRoundResult: null,
        }));
        return;
      }

      const wordLength = ROUND_LENGTHS[roundIndex];
      const word = await fetchWord(wordLength);
      const timeoutMs = getTimeoutMs(wordLength);
      const revealedAt = Date.now();
      const startedAt = revealedAt + ROUND_REVEAL_MS;
      const endsAt = startedAt + timeoutMs;

      roundStartedAtRef.current = startedAt;
      endsAtRef.current = endsAt;
      currentWordRef.current = word;
      roundIndexRef.current = roundIndex;

      progressRef.current = new Map(
        racers.map((r) => [
          r.id,
          {
            playerId: r.id,
            charsCorrect: 0,
            finished: false,
            finishTimeMs: null,
            wpm: null,
          },
        ])
      );

      botPlansRef.current =
        config.mode === 'vsComputer'
          ? racers
              .filter((r) => r.isBot)
              .map((bot) => planBotRound(bot, wordLength, timeoutMs, config.difficulty))
          : [];

      setState((s) => ({
        ...s,
        status: 'playing',
        roundIndex,
        word,
        wordLength,
        remainingMs: timeoutMs,
        roundStartedAt: startedAt,
        timeoutMs,
        liveProgress: [...progressRef.current.values()],
        lastRoundResult: null,
      }));

      tickRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.max(0, now - roundStartedAtRef.current);
        const remainingMs =
          now < roundStartedAtRef.current
            ? timeoutMs
            : Math.max(0, endsAtRef.current - now);

        if (now >= roundStartedAtRef.current) {
          for (const plan of botPlansRef.current) {
            const botProg = getBotProgress(
              plan,
              elapsed,
              wordLength,
              roundStartedAtRef.current
            );
            const existing = progressRef.current.get(plan.racerId);
            if (existing && !existing.finished) {
              progressRef.current.set(plan.racerId, botProg);
              if (botProg.finished) checkRoundComplete(roundIndex);
            }
          }
        }

        setState((s) =>
          s.status === 'playing'
            ? { ...s, remainingMs, liveProgress: [...progressRef.current.values()] }
            : s
        );
      }, 100);

      endTimeoutRef.current = setTimeout(
        () => endRound(roundIndex),
        ROUND_REVEAL_MS + timeoutMs
      );
    },
    [clearTimers, endRound, checkRoundComplete]
  );

  startRoundRef.current = async (roundIndex: number) => {
    const config = configRef.current;
    if (!config) return;
    await startRound(roundIndex, config, racersRef.current);
  };

  const startGame = useCallback(
    async (config: SoloConfig) => {
      clearTimers();
      resetWordCache();
      roundResultsRef.current = [];

      const human: SoloRacer = {
        id: HUMAN_ID,
        name: config.displayName.trim().slice(0, 20) || 'Player',
        color: PLAYER_COLORS[0],
        isBot: false,
      };

      const bots = config.mode === 'vsComputer' ? createBots(config.botCount) : [];
      const racers = [human, ...bots];
      racersRef.current = racers;
      configRef.current = config;

      setState({
        ...initialState,
        status: 'loading',
        config,
        racers,
      });

      await startRound(0, config, racers);
    },
    [clearTimers, startRound]
  );

  const updateProgress = useCallback(
    (charsCorrect: number) => {
      const entry = progressRef.current.get(HUMAN_ID);
      if (!entry || entry.finished) return;
      entry.charsCorrect = charsCorrect;
      setState((s) => ({ ...s, liveProgress: [...progressRef.current.values()] }));
    },
    []
  );

  const submitWord = useCallback(
    (typed: string, clientElapsedMs: number) => {
      const entry = progressRef.current.get(HUMAN_ID);
      if (!entry || entry.finished || !currentWordRef.current) return;
      if (typed.trim().toLowerCase() !== currentWordRef.current) return;

      const finishTimeMs = roundStartedAtRef.current + Math.min(
        clientElapsedMs,
        endsAtRef.current - roundStartedAtRef.current
      );
      const elapsed = finishTimeMs - roundStartedAtRef.current;

      entry.finished = true;
      entry.finishTimeMs = finishTimeMs;
      entry.charsCorrect = currentWordRef.current.length;
      entry.wpm = calculateWpm(currentWordRef.current.length, elapsed);

      setState((s) => ({ ...s, liveProgress: [...progressRef.current.values()] }));
      checkRoundComplete(roundIndexRef.current);
    },
    [checkRoundComplete]
  );

  const reset = useCallback(() => {
    clearTimers();
    racersRef.current = [];
    roundResultsRef.current = [];
    configRef.current = null;
    currentWordRef.current = null;
    setState(initialState);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { state, startGame, updateProgress, submitWord, reset };
}

export type { SoloDifficulty } from '../lib/botRacer';
