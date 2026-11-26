"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CafeLighting } from "./CafeLighting";
import { ProceduralPourOver } from "./models/ProceduralModels";
import { GltfPlugInModel } from "./models/GltfPlugInModel";

interface ScrollBrewCanvasProps {
  progress: number;
  customModelUrl?: string | null;
}

export default function ScrollBrewCanvas({
  progress,
  customModelUrl,
}: ScrollBrewCanvasProps) {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [highQuality, setHighQuality] = useState(true);

  return (
    <Canvas
      dpr={dpr}
      shadows={highQuality}
      camera={{ position: [0, 0.45, 4.4], fov: 36 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="h-full w-full"
    >
      <CafeLighting
        shadowY={-1.15}
        shadowScale={5.5}
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

      {customModelUrl ? (
        <GltfPlugInModel
          url={customModelUrl}
          scale={1.1}
          position={[0, -0.45, 0]}
          rotation={[0, -0.45 + progress * Math.PI * 1.15, 0]}
        />
      ) : (
        <ProceduralPourOver progress={progress} />
      )}
    </Canvas>
  );
}
