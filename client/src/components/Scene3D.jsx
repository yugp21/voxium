import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, Points, PointMaterial } from "@react-three/drei";
import { COLORS } from "../constants/theme";

// Generated once, at module load time — completely outside any component
// or hook body, so it's not part of React's render phase at all. This is
// the actual fix: useMemo's callback still technically runs during render,
// so react-hooks/purity correctly flagged Math.random() there too. These
// positions never need to vary between renders or instances anyway.
const PARTICLE_COUNT = 400;
const PARTICLE_POSITIONS = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  PARTICLE_POSITIONS[i * 3] = (Math.random() - 0.5) * 12;
  PARTICLE_POSITIONS[i * 3 + 1] = (Math.random() - 0.5) * 12;
  PARTICLE_POSITIONS[i * 3 + 2] = (Math.random() - 0.5) * 12;
}

// A field of drifting points in 3D space — replaces the old flat CSS
// "particles" (which were just 2D divs faking depth with opacity).
// These actually exist in 3D and respond to camera perspective.
const ParticleField = () => {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <Points ref={ref} positions={PARTICLE_POSITIONS} stride={3}>
      <PointMaterial
        transparent
        color={COLORS.accent2}
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
};

// The centerpiece — a slowly rotating wireframe icosahedron, gently
// bobbing via drei's <Float>. This is the actual "3D element" — real
// geometry rendered by WebGL, not a CSS transform pretending to be one.
const WireframeCore = () => {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.08;
      ref.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <Icosahedron ref={ref} args={[1.6, 1]}>
        <meshBasicMaterial color={COLORS.accent} wireframe transparent opacity={0.35} />
      </Icosahedron>
      <Icosahedron args={[1.15, 0]}>
        <meshBasicMaterial color={COLORS.accent2} wireframe transparent opacity={0.2} />
      </Icosahedron>
    </Float>
  );
};

// Full-bleed background scene. Pointer-events disabled so it never
// intercepts clicks on the real UI sitting on top of it.
const Scene3D = ({ height = "100%", showCore = true }) => (
  <div style={{ position: "absolute", inset: 0, height, pointerEvents: "none", zIndex: 0 }}>
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        {showCore && <WireframeCore />}
        <ParticleField />
      </Suspense>
    </Canvas>
  </div>
);

export default Scene3D;