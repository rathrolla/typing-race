import { motion, AnimatePresence } from 'framer-motion';
import { ROUND_REVEAL_MS } from '@typing-race/shared';

interface Props {
  graceMsLeft: number;
  visible: boolean;
}

export function GraceCountdown({ graceMsLeft, visible }: Props) {
  const seconds = Math.max(1, Math.ceil(graceMsLeft / 1000));
  const progress = 1 - graceMsLeft / ROUND_REVEAL_MS;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-arcade-bg/50 backdrop-blur-[2px]" />

          <div className="relative flex flex-col items-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-6">
              Get ready
            </p>

            <div className="relative flex items-center justify-center w-40 h-40 md:w-48 md:h-48">
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-arcade-border"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-amber-400"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
                />
              </svg>

              <AnimatePresence mode="popLayout">
                <motion.span
                  key={seconds}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.3, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="font-mono text-7xl md:text-8xl font-bold text-amber-300 tabular-nums"
                >
                  {seconds}
                </motion.span>
              </AnimatePresence>
            </div>

            <p className="mt-6 text-amber-200/80 text-sm font-medium">
              Typing starts in {(graceMsLeft / 1000).toFixed(1)}s
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
