import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TOTAL_ROUNDS, ROUND_REVEAL_MS, calculateWpm, type PlayerProgress } from '@typing-race/shared';
import { WordStage } from '../components/WordStage';
import { WordDisplay } from '../components/WordDisplay';
import { GraceCountdown } from '../components/GraceCountdown';
import { PlayerAvatar } from '../components/PlayerAvatar';
import type { SoloRacer } from '../lib/botRacer';

export interface RaceRacer {
  id: string;
  name: string;
  color: string;
}

interface Props {
  word: string;
  remainingMs: number;
  roundIndex: number;
  wordLength: number;
  roundStartedAt: number;
  timeoutMs: number;
  racers: RaceRacer[];
  liveProgress: PlayerProgress[];
  playerId: string;
  onProgress: (charsCorrect: number) => void;
  onSubmit: (typed: string, clientElapsedMs: number) => void;
}

export function RaceScreen({
  word,
  remainingMs,
  roundIndex,
  wordLength,
  roundStartedAt,
  timeoutMs: _timeoutMs,
  racers,
  liveProgress,
  playerId,
  onProgress,
  onSubmit,
}: Props) {
  const [typed, setTyped] = useState('');
  const [lastKeyCorrect, setLastKeyCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [graceDone, setGraceDone] = useState(false);
  const [graceMsLeft, setGraceMsLeft] = useState(ROUND_REVEAL_MS);
  const startTimeRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const inGrace = !graceDone;
  const secondsLeft = (remainingMs / 1000).toFixed(1);
  const urgency = remainingMs < 3000 && graceDone;
  const myProgress = liveProgress.find((p) => p.playerId === playerId);
  const elapsed = graceDone ? Date.now() - startTimeRef.current : 0;
  const liveWpm = typed.length > 0 && graceDone ? calculateWpm(typed.length, elapsed) : 0;
  const inputDisabled = submitted || timedOut;
  const inputReadOnly = inGrace;

  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (!input || inputDisabled) return;
    input.focus({ preventScroll: true });
  }, [inputDisabled]);

  useEffect(() => {
    setTyped('');
    setSubmitted(false);
    setRoundComplete(false);
    setTimedOut(false);
    setGraceDone(false);
    setGraceMsLeft(ROUND_REVEAL_MS);
    setLastKeyCorrect(null);

    const t1 = setTimeout(focusInput, 0);
    const t2 = setTimeout(focusInput, 100);

    const graceInterval = setInterval(() => {
      const left = Math.max(0, roundStartedAt - Date.now());
      setGraceMsLeft(left);
      if (left <= 0) {
        setGraceDone(true);
        startTimeRef.current = roundStartedAt;
        clearInterval(graceInterval);
      }
    }, 50);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(graceInterval);
    };
  }, [word, roundStartedAt, focusInput]);

  useEffect(() => {
    if (!graceDone || inputDisabled) return;
    const t1 = setTimeout(focusInput, 0);
    const t2 = setTimeout(focusInput, 50);
    const t3 = setTimeout(focusInput, 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [graceDone, inputDisabled, focusInput]);

  useEffect(() => {
    if (inGrace || inputDisabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.activeElement === inputRef.current) return;
      if (e.key.length === 1) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inGrace, inputDisabled]);

  useEffect(() => {
    if (graceDone && remainingMs <= 0 && !submitted) {
      setTimedOut(true);
    }
  }, [remainingMs, submitted, graceDone]);

  useEffect(() => {
    if (myProgress?.finished) {
      setRoundComplete(true);
      setSubmitted(true);
    }
  }, [myProgress?.finished]);

  const handleChange = useCallback(
    (value: string) => {
      if (inputDisabled || inGrace) return;

      for (let i = 0; i < value.length; i++) {
        if (value[i] !== word[i]) {
          setLastKeyCorrect(false);
          return;
        }
      }

      const prevLen = typed.length;
      setTyped(value);

      if (value.length > prevLen) setLastKeyCorrect(true);

      onProgress(value.length);

      if (value === word) {
        const clientElapsedMs = Date.now() - startTimeRef.current;
        onSubmit(value, clientElapsedMs);
        setSubmitted(true);
        setRoundComplete(true);
      }
    },
    [typed.length, word, inputDisabled, inGrace, onProgress, onSubmit]
  );

  const progressPct = word.length > 0 ? Math.min(100, (typed.length / word.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
      onClick={focusInput}
    >
      <header className="p-4 md:px-8 flex flex-wrap items-center justify-between gap-4 border-b border-arcade-border">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            Round <span className="text-white font-semibold">{roundIndex + 1}</span>/{TOTAL_ROUNDS}
          </span>
          <span className="text-slate-400 text-sm">
            <span className="text-cyan-300 font-semibold">{wordLength}</span> letters
          </span>
        </div>
        <div
          className={`font-mono text-2xl font-bold tabular-nums ${
            urgency ? 'text-red-400 animate-pulse' : 'text-white'
          }`}
        >
          {inGrace ? '—' : `${secondsLeft}s`}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col min-h-[320px] lg:min-h-0">
          <div className="flex-1 relative min-h-[280px]">
            <WordStage
              word={word}
              typedLength={typed.length}
              wordLength={wordLength}
              lastKeyCorrect={lastKeyCorrect}
              roundComplete={roundComplete}
              timedOut={timedOut}
            />
            <WordDisplay word={word} typedLength={typed.length} />
            <GraceCountdown graceMsLeft={graceMsLeft} visible={inGrace} />
          </div>

          <div className="p-4 md:p-8 border-t border-arcade-border">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="h-2 rounded-full bg-arcade-bg overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>

              <input
                ref={inputRef}
                className="input-field text-2xl md:text-3xl text-center py-5"
                value={typed}
                onChange={(e) => handleChange(e.target.value)}
                disabled={inputDisabled}
                readOnly={inputReadOnly}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={inGrace ? 'Get ready...' : 'Type here...'}
                autoFocus
              />

              <div className="flex justify-between text-sm text-slate-400 font-mono">
                <span>Live WPM: <span className="text-cyan-300">{liveWpm}</span></span>
                <span>
                  {submitted ? (
                    <span className="text-green-400">Finished!</span>
                  ) : timedOut ? (
                    <span className="text-red-400">Time&apos;s up!</span>
                  ) : inGrace ? (
                    <span className="text-amber-300">Study the word — {(graceMsLeft / 1000).toFixed(1)}s until go</span>
                  ) : (
                    <span>Type the word exactly (lowercase)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {racers.length > 1 && (
          <aside className="lg:w-72 border-t lg:border-t-0 lg:border-l border-arcade-border p-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Live Race</h3>
            <div className="space-y-3">
              {racers.map((player) => {
                const progress = liveProgress.find((p) => p.playerId === player.id);
                const pct = progress
                  ? Math.round((progress.charsCorrect / wordLength) * 100)
                  : 0;
                return (
                  <div key={player.id} className="panel p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <PlayerAvatar player={player} size="sm" />
                      <span className="text-sm font-medium truncate flex-1">{player.name}</span>
                      {progress?.finished && (
                        <span className="text-xs text-green-400 font-mono">{progress.wpm} WPM</span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-arcade-bg overflow-hidden">
                      <div
                        className="h-full transition-all duration-200"
                        style={{ width: `${pct}%`, backgroundColor: player.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </motion.div>
  );
}

export type { SoloRacer };
