"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useCafeStore } from "@/store/useCafeStore";
import { CafeLighting } from "./CafeLighting";
import { ProceduralHeroCup } from "./models/ProceduralModels";
import { GltfPlugInModel } from "./models/GltfPlugInModel";

interface HeroCupSceneProps {
  /** Optional path to custom .glb model in public/models/ (e.g. '/models/coffee-cup.glb') */
  customModelUrl?: string | null;
}

export default function HeroCupScene({ customModelUrl }: HeroCupSceneProps) {
  const activeHeroDrink = useCafeStore((s) => s.activeHeroDrink);
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [highQuality, setHighQuality] = useState(true);

  return (
    <Canvas
      dpr={dpr}
      shadows={highQuality}
      camera={{ position: [0, 0.45, 4.1], fov: 36 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="h-full w-full"
    >
      <CafeLighting
        shadowY={-0.95}
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
        <GltfPlugInModel url={customModelUrl} scale={1.15} position={[0, -0.35, 0]} />
      ) : (
        <ProceduralHeroCup drink={activeHeroDrink} />
      )}
    </Canvas>
  );
}
