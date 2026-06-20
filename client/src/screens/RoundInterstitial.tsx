import { motion } from 'framer-motion';
import type { RoundEndPayload } from '@typing-race/shared';
import { PlayerAvatar } from '../components/PlayerAvatar';

interface Props {
  result: RoundEndPayload;
}

export function RoundInterstitial({ result }: Props) {
  const winner = result.result.rankings.find((r) => r.rank === 1 && r.finished);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-lg panel p-8 text-center">
        <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Round Complete</p>
        <h2 className="text-3xl font-bold mb-2">
          {result.result.wordLength}-letter word:{' '}
          <span className="text-cyan-300 font-mono">{result.result.word}</span>
        </h2>

        {winner ? (
          <div className="my-8">
            <p className="text-slate-400 mb-4">Round winner</p>
            <div className="flex items-center justify-center gap-4">
              <PlayerAvatar player={winner} size="lg" />
              <div className="text-left">
                <p className="text-xl font-bold" style={{ color: winner.color }}>
                  {winner.name}
                </p>
                <p className="text-slate-400 font-mono text-sm">
                  {(winner.finishTimeMs! / 1000).toFixed(2)}s · {winner.wpm} WPM
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="my-8 text-slate-400">No one finished in time!</p>
        )}

        <div className="space-y-2 text-left">
          {result.result.rankings
            .filter((r) => r.finished)
            .slice(0, 5)
            .map((r) => (
              <div
                key={r.playerId}
                className="flex items-center justify-between px-4 py-2 rounded-lg bg-arcade-bg/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono w-6">#{r.rank}</span>
                  <PlayerAvatar player={r} size="sm" />
                  <span>{r.name}</span>
                </div>
                <span className="font-mono text-sm text-slate-400">
                  {(r.finishTimeMs! / 1000).toFixed(2)}s
                </span>
              </div>
            ))}
        </div>

        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mt-8 text-cyan-400 text-sm"
        >
          Next round starting...
        </motion.p>
      </div>
    </motion.div>
  );
}
