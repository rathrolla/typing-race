import { motion } from 'framer-motion';
import { useState } from 'react';
import type { SoloConfig, SoloDifficulty, SoloMode } from '../hooks/useSoloGame';
import { TypingModePicker } from '../components/TypingModePicker';
import type { TypingMode } from '@typing-race/shared';

interface Props {
  onStart: (config: SoloConfig) => void;
  onBack: () => void;
}

export function SoloSetupScreen({ onStart, onBack }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<SoloMode>('practice');
  const [botCount, setBotCount] = useState<1 | 2 | 3>(2);
  const [difficulty, setDifficulty] = useState<SoloDifficulty>('medium');
  const [typingMode, setTypingMode] = useState<TypingMode>('mixed');

  const handleStart = () => {
    onStart({
      displayName: displayName.trim() || 'Player',
      mode,
      botCount,
      difficulty,
      typingMode,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-lg panel p-8">
        <h2 className="text-2xl font-bold mb-6">Play Solo</h2>

        <div className="space-y-5">
          <input
            className="input-field"
            placeholder="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            autoFocus
          />

          <div>
            <p className="text-sm text-slate-400 mb-2">Mode</p>
            <div className="flex gap-3">
              {(['practice', 'vsComputer'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition-colors ${
                    mode === m
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-arcade-border text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {m === 'practice' ? 'Practice' : 'vs Computer'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'vsComputer' && (
            <>
              <div>
                <p className="text-sm text-slate-400 mb-2">Bots</p>
                <div className="flex gap-3">
                  {([1, 2, 3] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setBotCount(n)}
                      className={`flex-1 py-3 rounded-xl border font-semibold ${
                        botCount === n
                          ? 'border-purple-400 bg-purple-400/10 text-purple-300'
                          : 'border-arcade-border text-slate-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Difficulty</p>
                <div className="flex gap-3">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-3 rounded-xl border font-semibold capitalize ${
                        difficulty === d
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                          : 'border-arcade-border text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-sm text-slate-400 mb-2">Typing style</p>
            <TypingModePicker value={typingMode} onChange={setTypingMode} />
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={onBack}>
              Back
            </button>
            <button className="btn-primary flex-1" onClick={handleStart}>
              Start
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
