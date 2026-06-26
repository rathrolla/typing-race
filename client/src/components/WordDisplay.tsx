interface Props {
  word: string;
  typedLength: number;
  isParagraph?: boolean;
}

export function WordDisplay({ word, typedLength, isParagraph = false }: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4 md:px-10">
      <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
        {isParagraph ? 'Type this paragraph' : 'Type this word'}
      </p>
      <div
        className={`font-mono font-bold select-none max-w-4xl text-center ${
          isParagraph
            ? 'text-lg sm:text-xl md:text-2xl leading-relaxed tracking-normal whitespace-pre-wrap break-words'
            : 'text-4xl sm:text-5xl md:text-6xl tracking-wider'
        }`}
        aria-label={`Text to type: ${word}`}
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
                    ? 'text-cyan-300 underline decoration-cyan-400/50 underline-offset-4'
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
