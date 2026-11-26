"use client";

import { ContactShadows, Environment, PerformanceMonitor } from "@react-three/drei";

interface CafeLightingProps {
  onDecline?: () => void;
  onIncline?: () => void;
  shadowY?: number;
  shadowScale?: number;
  highQuality?: boolean;
}

/**
 * Shared warm physical-cafe lighting rig connecting Ember & Bean's interior
 * (warm walnut, terracotta, brushed brass pendants) into every WebGL scene.
 */
export function CafeLighting({
  onDecline,
  onIncline,
  shadowY = -1.15,
  shadowScale = 6,
  highQuality = true,
}: CafeLightingProps) {
  return (
    <>
      <PerformanceMonitor onDecline={onDecline} onIncline={onIncline} />

      {/* Warm espresso ambient base */}
      <ambientLight intensity={0.42} color="#f5e6d8" />

      {/* Primary pendant key light (#ffdfb8) */}
      <directionalLight
        position={[4, 6, 4]}
        intensity={2.2}
        color="#ffdfb8"
        castShadow={highQuality}
        shadow-mapSize-width={highQuality ? 1024 : 512}
        shadow-mapSize-height={highQuality ? 1024 : 512}
      />

      {/* Brushed brass / terracotta rim light */}
      <spotLight
        position={[-4.5, 3.5, -3.5]}
        angle={0.55}
        penumbra={0.9}
        intensity={2.6}
        color="#d98a4e"
      />

      {/* Soft cream fill light from front-left */}
      <pointLight position={[-3, 1.2, 3.5]} intensity={0.8} color="#f3ece7" />

      {/* Interior reflection map */}
      <Environment preset="apartment" environmentIntensity={highQuality ? 0.65 : 0.4} />

      {/* Soft grounded shadow */}
      <ContactShadows
        position={[0, shadowY, 0]}
        opacity={highQuality ? 0.55 : 0.35}
        scale={shadowScale}
        blur={2.4}
        far={4}
        resolution={highQuality ? 512 : 256}
        color="#090605"
      />
    </>
  );
}
