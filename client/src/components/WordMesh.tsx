import { Text, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MotionTier } from './WordStage';

interface Props {
  word: string;
  typedLength: number;
  tier: MotionTier;
  lastKeyCorrect: boolean | null;
  roundComplete: boolean;
  timedOut: boolean;
}

export function WordMesh({
  word,
  typedLength,
  tier,
  lastKeyCorrect,
  roundComplete,
  timedOut,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);
  const hopRef = useRef(0);
  const meltRef = useRef(0);
  const spinRef = useRef(0);
  const wobbleRef = useRef(Math.random() * Math.PI * 2);

  const letters = useMemo(() => word.split(''), [word]);
  const spacing = 0.55;
  const totalWidth = (letters.length - 1) * spacing;
  const startX = -totalWidth / 2;

  useEffect(() => {
    if (lastKeyCorrect === false) shakeRef.current = 1;
    if (lastKeyCorrect === true) hopRef.current = 1;
  }, [lastKeyCorrect, typedLength]);

  useEffect(() => {
    if (roundComplete) spinRef.current = 1;
    if (timedOut) meltRef.current = 1;
  }, [roundComplete, timedOut]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.elapsedTime;

    shakeRef.current = Math.max(0, shakeRef.current - delta * 4);
    hopRef.current = Math.max(0, hopRef.current - delta * 3);
    if (roundComplete) spinRef.current = Math.min(1, spinRef.current + delta * 2);
    if (timedOut) meltRef.current = Math.min(1, meltRef.current + delta * 0.8);

    let baseY = 0;
    let baseRotX = 0;
    let baseRotY = 0;
    let baseRotZ = 0;
    let scaleY = 1;
    let opacity = 1;

    if (tier === 'bouncy') {
      baseY = Math.abs(Math.sin(t * 3)) * 0.4;
      baseRotZ = Math.sin(t * 2) * 0.05;
    } else if (tier === 'orbit') {
      baseRotY = t * 0.4;
      baseY = Math.sin(t * 1.5) * 0.2;
    } else {
      baseRotX = Math.sin(t * 1.2) * 0.3;
      baseRotY = t * 0.8;
      baseRotZ = Math.cos(t * 0.9) * 0.2 + Math.sin(t * 3 + wobbleRef.current) * 0.1;
    }

    const shake = shakeRef.current;
    const hop = hopRef.current;
    group.position.y = baseY + hop * 0.5 + Math.sin(t * 50) * shake * 0.08;
    group.position.x = Math.sin(t * 60) * shake * 0.12;
    group.rotation.x = baseRotX;
    group.rotation.y = baseRotY + spinRef.current * Math.PI * 2 * (roundComplete ? 1 : 0);
    group.rotation.z = baseRotZ + Math.sin(t * 80) * shake * 0.15;

    if (timedOut) {
      scaleY = 1 - meltRef.current * 0.8;
      opacity = 1 - meltRef.current;
      group.position.y -= meltRef.current * 1.5;
    }

    group.scale.set(
      roundComplete ? 1 + spinRef.current * 0.15 : 1,
      scaleY,
      roundComplete ? 1 + spinRef.current * 0.15 : 1
    );

    group.children.forEach((child, i) => {
      if (child instanceof THREE.Group) {
        const letterMesh = child.children[0];
        if (letterMesh && 'material' in letterMesh) {
          const mat = (letterMesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat) mat.opacity = opacity;
        }
      }

      if (tier === 'bouncy') {
        child.position.y = Math.abs(Math.sin(t * 4 + i * 0.5)) * 0.15;
      } else if (tier === 'orbit') {
        child.position.y = Math.sin(t * 2 + i * 0.8) * 0.12;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {letters.map((letter, i) => {
        const isTyped = i < typedLength;
        const color = isTyped
          ? word[i] === word.slice(0, typedLength)[i]
            ? '#4ade80'
            : '#f87171'
          : '#e2e8f0';

        return (
          <group key={`${letter}-${i}`} position={[startX + i * spacing, 0, 0]}>
            <Text
              fontSize={0.7}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#0a0e1a"
              characters="abcdefghijklmnopqrstuvwxyz"
            >
              {letter}
            </Text>
          </group>
        );
      })}

      {lastKeyCorrect === true && (
        <Sparkles count={30} scale={3} size={2} speed={2} color="#22d3ee" />
      )}

      {roundComplete && (
        <Sparkles count={80} scale={5} size={3} speed={3} color="#a78bfa" />
      )}
    </group>
  );
}
