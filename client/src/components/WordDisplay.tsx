interface Props {
  word: string;
  typedLength: number;
}

export function WordDisplay({ word, typedLength }: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4">
      <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Type this word</p>
      <div
        className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider select-none"
        aria-label={`Word to type: ${word}`}
      >
        {word.split('').map((letter, i) => {
          const isTyped = i < typedLength;
          return (
            <span
              key={`${letter}-${i}`}
              className={
                isTyped
                  ? 'text-green-400'
                  : i === typedLength
                    ? 'text-cyan-300 underline decoration-cyan-400/50 underline-offset-8'
                    : 'text-white'
              }
            >
              {letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}
