import { useCallback, useEffect, useRef, useState } from 'react';

/** Original spy-thriller loop (Web Audio) — not copyrighted material. */
function startSynthSpyTheme(ctx: AudioContext, master: GainNode): () => void {
  const tempo = 168;
  const beat = 60 / tempo;
  const fifth = beat / 5; // 5/4 spy feel
  let step = 0;
  let intervalId: ReturnType<typeof setInterval>;

  const melody = [329.63, 392.0, 493.88, 392.0, 329.63, 293.66, 329.63, 392.0, 493.88, 587.33];

  const playNote = (freq: number, start: number, dur: number, type: OscillatorType, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  };

  const tick = () => {
    const now = ctx.currentTime;
    const phase = step % 10;

    if (phase === 0) {
      playNote(82.41, now, fifth * 0.9, 'sawtooth', 0.08);
      playNote(melody[Math.floor(step / 10) % melody.length], now, fifth * 0.85, 'square', 0.06);
    } else if (phase === 2) {
      playNote(110.0, now, fifth * 0.5, 'triangle', 0.05);
    } else if (phase === 4) {
      playNote(melody[(Math.floor(step / 10) + 3) % melody.length], now, fifth * 0.7, 'square', 0.05);
    }

    step += 1;
  };

  intervalId = setInterval(tick, fifth * 1000);

  return () => clearInterval(intervalId);
}

export function useVictoryMusic(active: boolean) {
  const [muted, setMuted] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active || muted) {
      stop();
      return;
    }

    const tryMp3 = () => {
      const audio = new Audio('/sounds/victory-theme.mp3');
      audio.loop = true;
      audio.volume = 0.4;
      audioRef.current = audio;
      return audio.play();
    };

    tryMp3()
      .catch(() => {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(ctx.destination);
        const stopSynth = startSynthSpyTheme(ctx, master);
        cleanupRef.current = () => {
          stopSynth();
          void ctx.close();
        };
      })
      .catch(() => {
        /* autoplay blocked until user interaction */
      });

    return stop;
  }, [active, muted, stop]);

  return { muted, setMuted, stop };
}
