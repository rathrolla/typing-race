import { motion } from 'framer-motion';
import type { PlayerStanding } from '@typing-race/shared';
import { PlayerAvatar } from '../components/PlayerAvatar';

interface Props {
  standings: PlayerStanding[];
  onPlayAgain?: () => void;
  onLeave: () => void;
  title?: string;
}

const podiumHeights = ['h-36', 'h-28', 'h-20'];
const podiumOrder = [1, 0, 2];

export function PodiumScreen({
  standings,
  onPlayAgain,
  onLeave,
  title = 'Race Complete!',
}: Props) {
  const top3 = standings.slice(0, 3);
  const orderedPodium = podiumOrder.map((i) => top3[i]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-6 md:p-10"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-bold mb-2"
          >
            {title}
          </motion.h1>
          {standings[0] && (
            <p className="text-xl text-slate-300">
              Champion:{' '}
              <span style={{ color: standings[0].color }} className="font-bold">
                {standings[0].name}
              </span>
            </p>
          )}
        </div>

        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-16">
            {orderedPodium.map((player, visualIdx) => {
              const actualRank = top3.indexOf(player!) + 1;
              const heightClass = podiumHeights[visualIdx];
              return (
                <motion.div
                  key={player!.playerId}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: visualIdx * 0.15, type: 'spring' }}
                  className="flex flex-col items-center"
                >
                  <PlayerAvatar
                    player={{ name: player!.name, color: player!.color }}
                    size="lg"
                  />
                  <p className="mt-2 font-semibold" style={{ color: player!.color }}>
                    {player!.name}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    {player!.roundWins} wins · {player!.avgWpm} WPM
                  </p>
                  <div
                    className={`w-24 md:w-32 ${heightClass} rounded-t-xl flex items-center justify-center font-bold text-2xl`}
                    style={{
                      backgroundColor: `${player!.color}30`,
                      borderTop: `3px solid ${player!.color}`,
                    }}
                  >
                    {actualRank}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="panel overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-arcade-border text-slate-400 text-sm">
                <th className="p-4">#</th>
                <th className="p-4">Player</th>
                <th className="p-4">Round Wins</th>
                <th className="p-4">Avg WPM</th>
                <th className="p-4">Fastest</th>
                <th className="p-4">Finished</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.playerId} className="border-b border-arcade-border/50 hover:bg-white/5">
                  <td className="p-4 font-mono text-slate-400">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar player={s} size="sm" />
                      <span style={{ color: s.color }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono">{s.roundWins}</td>
                  <td className="p-4 font-mono">{s.avgWpm}</td>
                  <td className="p-4 font-mono text-slate-400">
                    {s.fastestWordMs != null ? `${(s.fastestWordMs / 1000).toFixed(2)}s` : '—'}
                  </td>
                  <td className="p-4 font-mono text-slate-400">{s.totalFinished}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-4 mt-10">
          {onPlayAgain && (
            <button className="btn-primary" onClick={onPlayAgain}>
              Play Again
            </button>
          )}
          <button className="btn-secondary" onClick={onLeave}>
            Back to Menu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
