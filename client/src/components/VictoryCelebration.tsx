import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#4ade80', '#fbbf24', '#fb7185', '#ffffff'];

function burstRibbons() {
  const end = Date.now() + 4500;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 62,
      origin: { x: 0, y: 0.55 },
      colors: COLORS,
      shapes: ['square'],
      flat: true,
      gravity: 0.9,
      scalar: 1.4,
      drift: 0.4,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 62,
      origin: { x: 1, y: 0.55 },
      colors: COLORS,
      shapes: ['square'],
      flat: true,
      gravity: 0.9,
      scalar: 1.4,
      drift: -0.4,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.45 },
    colors: COLORS,
    startVelocity: 38,
  });

  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { y: 0.35 },
      colors: COLORS,
      shapes: ['circle', 'square'],
      scalar: 0.9,
    });
  }, 400);

  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: COLORS,
      flat: true,
      shapes: ['square'],
      scalar: 1.3,
    });
  }, 900);
}

export function useVictoryConfetti(active: boolean) {
  useEffect(() => {
    if (!active) return;
    burstRibbons();
    const t = setTimeout(burstRibbons, 2200);
    return () => clearTimeout(t);
  }, [active]);
}

interface RibbonProps {
  active: boolean;
}

export function FallingRibbons({ active }: RibbonProps) {
  if (!active) return null;

  const ribbons = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 5) % 100}%`,
    delay: (i * 0.15) % 2,
    duration: 2.8 + (i % 5) * 0.3,
    color: COLORS[i % COLORS.length],
    width: 6 + (i % 4) * 2,
    height: 28 + (i % 6) * 8,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {ribbons.map((r) => (
        <span
          key={r.id}
          className="absolute top-0 opacity-80 animate-ribbon-fall"
          style={{
            left: r.left,
            width: r.width,
            height: r.height,
            backgroundColor: r.color,
            animationDelay: `${r.delay}s`,
            animationDuration: `${r.duration}s`,
            transform: `rotate(${r.id % 2 === 0 ? 15 : -15}deg)`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
