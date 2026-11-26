"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCafeStore } from "@/store/useCafeStore";
import { CafeLighting } from "./CafeLighting";
import { ProceduralBeanBag } from "./models/ProceduralModels";
import { GltfPlugInModel } from "./models/GltfPlugInModel";

interface BeanBagViewerProps {
  /** Optional explicit overrides (otherwise binds live to Zustand store) */
  variantLabel?: string;
  accentColorHex?: string;
  textureUrl?: string | null;
  customModelUrl?: string | null;
}

export default function BeanBagViewer({
  variantLabel,
  accentColorHex,
  textureUrl,
  customModelUrl,
}: BeanBagViewerProps) {
  const storePreview = useCafeStore((s) => s.beanPreview);
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [highQuality, setHighQuality] = useState(true);

  const activeLabel = variantLabel ?? storePreview.variantLabel;
  const activeColor = accentColorHex ?? storePreview.accentColorHex;
  const activeTexture = textureUrl ?? storePreview.textureUrl;

  return (
    <Canvas
      dpr={dpr}
      shadows={highQuality}
      camera={{ position: [0, 0.2, 4.15], fov: 35 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="h-full w-full cursor-grab active:cursor-grabbing"
    >
      <CafeLighting
        shadowY={-1.12}
        shadowScale={4.5}
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
          position={[0, -0.4, 0]}
          textureOverrideUrl={activeTexture}
        />
      ) : (
        <ProceduralBeanBag
          variantLabel={activeLabel}
          accentColorHex={activeColor}
          textureUrl={activeTexture}
        />
      )}

      {/* CRITICAL: enableZoom={false} so page scrolling is NEVER trapped */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.2}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(Math.PI * 2) / 3.2}
        dampingFactor={0.07}
      />
    </Canvas>
  );
}
