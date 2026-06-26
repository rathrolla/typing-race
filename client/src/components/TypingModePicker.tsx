import { TYPING_MODE_OPTIONS, type TypingMode } from '@typing-race/shared';

interface Props {
  value: TypingMode;
  onChange: (mode: TypingMode) => void;
  disabled?: boolean;
}

export function TypingModePicker({ value, onChange, disabled = false }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {TYPING_MODE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          className={`text-left p-3 rounded-xl border transition-colors ${
            value === option.id
              ? 'border-cyan-400 bg-cyan-400/10'
              : disabled
                ? 'border-arcade-border text-slate-600 cursor-not-allowed'
                : 'border-arcade-border text-slate-400 hover:border-slate-500'
          }`}
        >
          <span className={`block font-semibold text-sm ${value === option.id ? 'text-cyan-300' : ''}`}>
            {option.label}
          </span>
          <span className="block text-xs mt-1 opacity-80">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
