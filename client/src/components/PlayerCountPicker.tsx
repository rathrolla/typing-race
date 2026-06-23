import { PLAYER_COUNT_OPTIONS } from '@typing-race/shared';

interface Props {
  value: number;
  onChange: (count: number) => void;
  minAllowed?: number;
  compact?: boolean;
}

export function PlayerCountPicker({ value, onChange, minAllowed = 2, compact = false }: Props) {
  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-4 gap-2'}>
      {PLAYER_COUNT_OPTIONS.map((n) => {
        const disabled = n < minAllowed;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`${compact ? 'px-3 py-2 text-sm' : 'py-3 text-sm md:text-base'} rounded-xl border font-semibold transition-colors ${
              value === n
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                : disabled
                  ? 'border-arcade-border text-slate-600 cursor-not-allowed'
                  : 'border-arcade-border text-slate-400 hover:border-slate-500'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
