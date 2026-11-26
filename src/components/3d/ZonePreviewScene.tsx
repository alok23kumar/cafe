"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { TableZone } from "@/types/database";
import { CafeLighting } from "./CafeLighting";
import { ProceduralCafeZone } from "./models/ProceduralModels";

export default function ZonePreviewScene({ zone }: { zone: TableZone }) {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [highQuality, setHighQuality] = useState(true);

  return (
    <Canvas
      dpr={dpr}
      shadows={highQuality}
      camera={{ position: [0.3, 1.45, 4.2], fov: 38 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="h-full w-full cursor-grab active:cursor-grabbing"
    >
      <CafeLighting
        shadowY={-0.88}
        shadowScale={6}
        highQuality={highQuality}
        onDecline={() => {
          setDpr([1, 1.25]);
          setHighQuality(false);
        }}
        onIncline={() => {
          setDpr([1, 2]);
          setHighQuality(true);
        }}
      />

      <ProceduralCafeZone zone={zone} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.15}
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
