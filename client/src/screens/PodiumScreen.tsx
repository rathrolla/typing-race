import { motion } from 'framer-motion';
import type { PlayerStanding } from '@typing-race/shared';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { FallingRibbons, useVictoryConfetti } from '../components/VictoryCelebration';
import { useVictoryMusic } from '../hooks/useVictoryMusic';

interface Props {
  standings: PlayerStanding[];
  onPlayAgain?: () => void;
  onLeave: () => void;
  title?: string;
}

const heightByRank: Record<number, string> = {
  1: 'h-40 md:h-44',
  2: 'h-28 md:h-32',
  3: 'h-20 md:h-24',
};

const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd left to right

export function PodiumScreen({
  standings,
  onPlayAgain,
  onLeave,
  title = 'Race Complete!',
}: Props) {
  const top3 = standings.slice(0, 3);
  const orderedPodium = podiumOrder.map((i) => top3[i]).filter(Boolean);
  const celebrate = standings.length > 0;

  useVictoryConfetti(celebrate);
  const { muted, setMuted, stop } = useVictoryMusic(celebrate);

  const handleLeave = () => {
    stop();
    onLeave();
  };

  const handlePlayAgain = () => {
    stop();
    onPlayAgain?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-6 md:p-10 relative overflow-hidden"
    >
      <FallingRibbons active={celebrate} />

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        className="fixed top-4 right-4 z-50 panel px-3 py-2 text-sm text-slate-300 hover:text-white"
        aria-label={muted ? 'Unmute music' : 'Mute music'}
      >
        {muted ? '🔇 Music off' : '🔊 Music on'}
      </button>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="text-4xl md:text-5xl font-bold mb-2"
          >
            {title}
          </motion.h1>
          {standings[0] && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-slate-300"
            >
              Champion:{' '}
              <span style={{ color: standings[0].color }} className="font-bold">
                {standings[0].name}
              </span>
            </motion.p>
          )}
        </div>

        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-16">
            {orderedPodium.map((player, visualIdx) => {
              const actualRank = top3.indexOf(player!) + 1;
              const heightClass = heightByRank[actualRank] ?? 'h-20';
              return (
                <motion.div
                  key={player!.playerId}
                  initial={{ y: 80, opacity: 0, scale: 0.85 }}
                  animate={{ y: 0, opacity: 1, scale: actualRank === 1 ? 1.05 : 1 }}
                  transition={{ delay: 0.2 + visualIdx * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
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
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    transition={{ delay: 0.45 + visualIdx * 0.12, type: 'spring' }}
                    className={`w-24 md:w-32 ${heightClass} rounded-t-xl flex items-center justify-center font-bold text-2xl shadow-lg`}
                    style={{
                      backgroundColor: `${player!.color}30`,
                      borderTop: `3px solid ${player!.color}`,
                      boxShadow:
                        actualRank === 1 ? `0 0 30px ${player!.color}55` : undefined,
                    }}
                  >
                    {actualRank}
                  </motion.div>
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
            <button className="btn-primary" onClick={handlePlayAgain}>
              Play Again
            </button>
          )}
          <button className="btn-secondary" onClick={handleLeave}>
            Back to Menu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
