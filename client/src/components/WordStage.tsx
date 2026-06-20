import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { WordMesh } from './WordMesh';

export type MotionTier = 'bouncy' | 'orbit' | 'chaos';

export function getMotionTier(wordLength: number): MotionTier {
  if (wordLength <= 5) return 'bouncy';
  if (wordLength <= 8) return 'orbit';
  return 'chaos';
}

interface Props {
  word: string;
  typedLength: number;
  wordLength: number;
  lastKeyCorrect: boolean | null;
  roundComplete: boolean;
  timedOut: boolean;
}

export function WordStage({
  word,
  typedLength,
  wordLength,
  lastKeyCorrect,
  roundComplete,
  timedOut,
}: Props) {
  const tier = getMotionTier(wordLength);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0e1a']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={0.6} color="#a78bfa" />
        <Suspense fallback={null}>
          <WordMesh
            word={word}
            typedLength={typedLength}
            tier={tier}
            lastKeyCorrect={lastKeyCorrect}
            roundComplete={roundComplete}
            timedOut={timedOut}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
