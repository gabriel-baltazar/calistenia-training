import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Group, type Mesh, type Points } from 'three';
import type { HeroVariant } from './HeroBackground';

export interface Scene3DProps {
  variant: HeroVariant;
  /** inView && documentVisible: fora da tela o frameloop fica em 'never'. */
  active: boolean;
  onContextLost: () => void;
}

interface CoreProps {
  particleCount: number;
  scale: number;
  offsetX: number;
}

const PARTICLE_RADIUS = 6;

/** Pontos distribuídos uniformemente numa esfera de raio PARTICLE_RADIUS. */
function makeParticles(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = PARTICLE_RADIUS * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

/** Núcleo de energia (§13): icosaedro wireframe + núcleo flat + anel + partículas. ~4 draw calls. */
function Core({ particleCount, scale, offsetX }: CoreProps) {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const points = useRef<Points>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const positions = useMemo(() => makeParticles(particleCount), [particleCount]);

  // Parallax só com ponteiro preciso (mouse/trackpad).
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      pointerTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (g) {
      g.rotation.y += 0.15 * delta;
      g.rotation.x = Math.sin(t * 0.3) * 0.2;
      pointer.current.x += (pointerTarget.current.x - pointer.current.x) * 0.05;
      pointer.current.y += (pointerTarget.current.y - pointer.current.y) * 0.05;
      g.position.x = offsetX + pointer.current.x * 0.35;
      g.position.y = pointer.current.y * 0.25;
    }
    if (ring.current) ring.current.rotation.z -= 0.25 * delta;
    if (points.current) points.current.rotation.y += 0.02 * delta;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 4]} color="#F97316" intensity={40} />
      <group ref={group} scale={scale} position={[offsetX, 0, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshBasicMaterial color="#F97316" wireframe transparent opacity={0.35} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshStandardMaterial color="#1C1C21" emissive="#F97316" emissiveIntensity={0.15} flatShading />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
          <torusGeometry args={[2.4, 0.015, 8, 160]} />
          <meshBasicMaterial color="#F97316" />
        </mesh>
      </group>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#FB923C" transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
}

/** Importado só via lazy(() => import('./Scene3D')) pelo HeroBackground. */
export default function Scene3D({ variant, active, onContextLost }: Scene3DProps) {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const particleCount = variant === 'home' ? 150 : isMobile ? 250 : 600;
  const onContextLostRef = useRef(onContextLost);
  useEffect(() => {
    onContextLostRef.current = onContextLost;
  }, [onContextLost]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault();
            onContextLostRef.current();
          },
          { once: true },
        );
      }}
    >
      <Core particleCount={particleCount} scale={variant === 'home' ? 0.7 : 1} offsetX={variant === 'home' ? 0.9 : 0} />
    </Canvas>
  );
}
