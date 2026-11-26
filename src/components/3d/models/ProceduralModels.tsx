"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { HeroDrinkId, TableZone } from "@/types/database";

// =============================================================================
// 1. Procedural Hero Drink Cup (Espresso / Iced Latte / Ceremonial Matcha)
//    High-craft PBR fallback until custom `coffee-cup.glb` is dropped into public/models/
// =============================================================================

const DRINK_VISUALS: Record<
  HeroDrinkId,
  {
    cupColor: string;
    liquidColor: string;
    foamColor: string;
    isIced: boolean;
    cupRoughness: number;
    accentColor: string;
  }
> = {
  espresso: {
    cupColor: "#1e1714",
    liquidColor: "#2c170d",
    foamColor: "#b8743c",
    isIced: false,
    cupRoughness: 0.34,
    accentColor: "#d98a4e",
  },
  "iced-latte": {
    cupColor: "#e6d8cc",
    liquidColor: "#c89668",
    foamColor: "#f3ece7",
    isIced: true,
    cupRoughness: 0.14,
    accentColor: "#d98a4e",
  },
  matcha: {
    cupColor: "#26211e",
    liquidColor: "#5e8349",
    foamColor: "#8eb074",
    isIced: true,
    cupRoughness: 0.42,
    accentColor: "#7ea463",
  },
};

const FLOATING_BEANS: Array<{
  pos: [number, number, number];
  rot: [number, number, number];
  speed: number;
  phase: number;
}> = [
  { pos: [-1.45, 0.55, -0.35], rot: [0.4, 0.8, 0.2], speed: 1.1, phase: 0.2 },
  { pos: [1.38, 0.72, -0.2], rot: [-0.3, 0.4, 0.9], speed: 0.9, phase: 1.7 },
  { pos: [-1.15, -0.45, 0.55], rot: [0.9, -0.2, 0.5], speed: 1.25, phase: 2.9 },
  { pos: [1.22, -0.32, 0.48], rot: [0.2, 1.1, -0.6], speed: 1.0, phase: 4.1 },
  { pos: [0.35, 1.15, -0.65], rot: [0.7, 0.3, 0.4], speed: 0.85, phase: 5.2 },
];

export function ProceduralHeroCup({ drink }: { drink: HeroDrinkId }) {
  const groupRef = useRef<THREE.Group>(null);
  const beansRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);
  const visual = DRINK_VISUALS[drink];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Subtle cursor parallax + gentle breathing float
      const targetRotY = state.pointer.x * 0.45 + Math.sin(t * 0.45) * 0.12;
      const targetRotX = -state.pointer.y * 0.2 + 0.14;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        Math.min(1, delta * 4)
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        Math.min(1, delta * 4)
      );
      groupRef.current.position.y = Math.sin(t * 1.3) * 0.06;
    }

    if (beansRef.current) {
      beansRef.current.children.forEach((bean, idx) => {
        const meta = FLOATING_BEANS[idx];
        if (!meta) return;
        bean.position.y = meta.pos[1] + Math.sin(t * meta.speed + meta.phase) * 0.12;
        bean.rotation.x += delta * 0.35 * meta.speed;
        bean.rotation.y += delta * 0.45 * meta.speed;
      });
    }

    if (steamRef.current) {
      steamRef.current.children.forEach((wisp, idx) => {
        const cycle = (t * 0.55 + idx * 0.33) % 1;
        wisp.position.y = 0.65 + cycle * 0.85;
        wisp.position.x = Math.sin(t * 1.8 + idx * 2) * 0.08;
        const scale = 0.65 + cycle * 0.6;
        wisp.scale.set(scale, scale, scale);
        const mat = (wisp as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.opacity = Math.sin(cycle * Math.PI) * 0.22;
        }
      });
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {/* Brushed Brass Saucer */}
        <mesh position={[0, -0.78, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.18, 0.88, 0.08, 48]} />
          <meshStandardMaterial
            color="#c6864c"
            metalness={0.78}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, -0.72, 0]} receiveShadow>
          <cylinderGeometry args={[0.64, 0.6, 0.04, 40]} />
          <meshStandardMaterial color="#15100e" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Cup Body (Glass tumbler for Iced Latte, Artisan Ceramic for Espresso/Matcha) */}
        {visual.isIced && drink === "iced-latte" ? (
          <>
            {/* Glass Tumbler */}
            <mesh position={[0, 0.02, 0]} castShadow>
              <cylinderGeometry args={[0.72, 0.54, 1.48, 48, 1, true]} />
              <meshPhysicalMaterial
                color="#f7efe8"
                transparent
                opacity={0.34}
                roughness={0.08}
                metalness={0.05}
                transmission={0.65}
                thickness={0.18}
              />
            </mesh>
            {/* Milk Base Layer */}
            <mesh position={[0, -0.24, 0]}>
              <cylinderGeometry args={[0.62, 0.51, 0.88, 40]} />
              <meshStandardMaterial color="#eadccf" roughness={0.28} />
            </mesh>
            {/* Caramel & Espresso Swirl Layer */}
            <mesh position={[0, 0.34, 0]}>
              <cylinderGeometry args={[0.68, 0.62, 0.42, 40]} />
              <meshStandardMaterial color={visual.liquidColor} roughness={0.22} />
            </mesh>
            {/* Brass Straw */}
            <mesh position={[0.2, 0.55, 0.08]} rotation={[0.08, 0, -0.18]}>
              <cylinderGeometry args={[0.036, 0.036, 1.85, 16]} />
              <meshStandardMaterial color="#d98a4e" metalness={0.88} roughness={0.2} />
            </mesh>
            {/* Translucent Ice Cubes */}
            {[
              [-0.18, 0.48, 0.14, 0.3],
              [0.16, 0.52, -0.15, -0.5],
              [-0.02, 0.42, -0.22, 0.7],
            ].map(([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]} rotation={[r, r * 0.7, 0.2]}>
                <boxGeometry args={[0.24, 0.24, 0.24]} />
                <meshPhysicalMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.58}
                  roughness={0.06}
                  metalness={0.05}
                />
              </mesh>
            ))}
          </>
        ) : (
          <>
            {/* Matte Ceramic Mug */}
            <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.74, 0.56, 1.32, 48]} />
              <meshStandardMaterial
                color={visual.cupColor}
                roughness={visual.cupRoughness}
                metalness={0.08}
              />
            </mesh>
            {/* Brushed Brass Rim Band */}
            <mesh position={[0, 0.61, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.73, 0.028, 16, 48]} />
              <meshStandardMaterial
                color={visual.accentColor}
                metalness={0.82}
                roughness={0.24}
              />
            </mesh>
            {/* Handle */}
            <mesh position={[0.76, -0.04, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <torusGeometry args={[0.32, 0.068, 16, 32, Math.PI]} />
              <meshStandardMaterial
                color={visual.cupColor}
                roughness={visual.cupRoughness}
                metalness={0.08}
              />
            </mesh>
            {/* Liquid Surface + Crema/Matcha Foam */}
            <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.69, 40]} />
              <meshStandardMaterial color={visual.liquidColor} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0.535, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 0.58, 36]} />
              <meshStandardMaterial
                color={visual.foamColor}
                roughness={0.55}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Latte Art Heart Rosette */}
            <mesh position={[0, 0.542, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.18, 24]} />
              <meshStandardMaterial color="#f3ece7" roughness={0.7} />
            </mesh>
          </>
        )}

        {/* Rising Warm Steam Wisps (Hot Espresso) */}
        {!visual.isIced && (
          <group ref={steamRef}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[0, 0.7 + i * 0.25, 0]}>
                <sphereGeometry args={[0.16, 16, 16]} />
                <meshStandardMaterial
                  color="#f3ece7"
                  transparent
                  opacity={0.14}
                  roughness={1}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* Orbiting Roasted Coffee Beans */}
      <group ref={beansRef}>
        {FLOATING_BEANS.map((b, idx) => (
          <mesh key={idx} position={b.pos} rotation={b.rot} castShadow>
            <capsuleGeometry args={[0.075, 0.11, 8, 16]} />
            <meshStandardMaterial color="#3b2012" roughness={0.48} metalness={0.06} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// =============================================================================
// 2. Procedural 3D Coffee Bean Bag with Live Dynamic Label Texture Swap
// =============================================================================

interface ProceduralBeanBagProps {
  variantLabel: string;
  accentColorHex: string;
  textureUrl?: string | null;
}

function createRoastLabelTexture(
  variantLabel: string,
  accentColorHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Rich warm paper label card
    ctx.fillStyle = "#191310";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer brushed brass border
    ctx.strokeStyle = accentColorHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Accent header band
    ctx.fillStyle = accentColorHex;
    ctx.fillRect(36, 42, canvas.width - 72, 92);

    ctx.fillStyle = "#120e0c";
    ctx.font = "bold 24px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("EMBER & BEAN ROASTERY", canvas.width / 2, 82);

    ctx.font = "600 15px sans-serif";
    ctx.fillText("SINGLE-ORIGIN INDIAN ARABICA", canvas.width / 2, 114);

    // Origin badge
    ctx.fillStyle = "#f3ece7";
    ctx.font = "bold 36px Georgia, serif";
    const words = variantLabel.split(" ");
    const line1 = words.slice(0, 2).join(" ");
    const line2 = words.slice(2).join(" ");
    ctx.fillText(line1, canvas.width / 2, 235);
    if (line2) {
      ctx.font = "500 26px Georgia, serif";
      ctx.fillStyle = accentColorHex;
      ctx.fillText(line2, canvas.width / 2, 280);
    }

    // Divider line
    ctx.strokeStyle = "rgba(243, 236, 231, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 330);
    ctx.lineTo(canvas.width - 80, 330);
    ctx.stroke();

    // Tasting profile pills
    ctx.fillStyle = "#b8a99e";
    ctx.font = "500 19px sans-serif";
    ctx.fillText("SMALL BATCH • BRASS DRUM ROASTED", canvas.width / 2, 385);
    ctx.fillStyle = "#f3ece7";
    ctx.font = "600 22px monospace";
    ctx.fillText("ALTITUDE 1,350M • WASHED", canvas.width / 2, 435);

    // Bottom roast emblem circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 525, 42, 0, Math.PI * 2);
    ctx.strokeStyle = accentColorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = accentColorHex;
    ctx.font = "bold 18px monospace";
    ctx.fillText("100%", canvas.width / 2, 522);
    ctx.font = "500 13px sans-serif";
    ctx.fillText("ARABICA", canvas.width / 2, 542);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function ProceduralBeanBag({
  variantLabel,
  accentColorHex,
}: ProceduralBeanBagProps) {
  const bagRef = useRef<THREE.Group>(null);

  const labelTexture = useMemo(
    () => createRoastLabelTexture(variantLabel, accentColorHex),
    [variantLabel, accentColorHex]
  );

  useEffect(() => {
    return () => {
      labelTexture.dispose();
    };
  }, [labelTexture]);

  useFrame((state) => {
    if (bagRef.current) {
      bagRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
    }
  });

  return (
    <group ref={bagRef} position={[0, -0.05, 0]}>
      {/* Main Matte Espresso Kraft Pouch */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.38, 2.02, 0.62]} />
        <meshStandardMaterial color="#1f1815" roughness={0.76} metalness={0.05} />
      </mesh>

      {/* Side Gusset Accents */}
      <mesh position={[-0.7, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 1.98, 0.44]} />
        <meshStandardMaterial color={accentColorHex} roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0.7, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 1.98, 0.44]} />
        <meshStandardMaterial color={accentColorHex} roughness={0.55} metalness={0.2} />
      </mesh>

      {/* Top Folded Crimp Seal */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[1.42, 0.24, 0.14]} />
        <meshStandardMaterial color="#17110e" roughness={0.68} />
      </mesh>

      {/* Brushed Brass Tin-Tie Clip */}
      <mesh position={[0, 0.96, 0.09]}>
        <boxGeometry args={[1.44, 0.07, 0.06]} />
        <meshStandardMaterial color={accentColorHex} metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Front Roast Label Card (Dynamic Texture!) */}
      <mesh position={[0, -0.04, 0.316]}>
        <planeGeometry args={[1.08, 1.38]} />
        <meshStandardMaterial map={labelTexture} roughness={0.45} metalness={0.08} />
      </mesh>

      {/* Back Matte Info Panel + Degassing Valve */}
      <mesh position={[0, 0.32, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.04, 24]} />
        <meshStandardMaterial color="#d98a4e" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.12, -0.316]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.02, 1.25]} />
        <meshStandardMaterial map={labelTexture} roughness={0.5} />
      </mesh>
    </group>
  );
}

// =============================================================================
// 3. Procedural Pour-Over Craft Story Scene (Animated by Scroll Progress 0..1)
// =============================================================================

export function ProceduralPourOver({ progress }: { progress: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const kettleRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const liquidRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const smooth = Math.min(1, delta * 5);

    if (rootRef.current) {
      // Gentle orbital showcase across scroll chapters
      const targetRotY = -0.45 + progress * Math.PI * 1.15;
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        targetRotY,
        smooth
      );
    }

    if (kettleRef.current) {
      // Kettle enters and tilts during bloom & pour phases (progress 0.25 -> 0.85)
      const pourFactor = THREE.MathUtils.clamp((progress - 0.2) / 0.55, 0, 1);
      const targetTilt = pourFactor * 0.42;
      const targetX = THREE.MathUtils.lerp(1.55, 0.95, pourFactor);
      const targetY = THREE.MathUtils.lerp(1.35, 1.12, pourFactor);
      kettleRef.current.rotation.z = THREE.MathUtils.lerp(
        kettleRef.current.rotation.z,
        targetTilt,
        smooth
      );
      kettleRef.current.position.x = THREE.MathUtils.lerp(
        kettleRef.current.position.x,
        targetX,
        smooth
      );
      kettleRef.current.position.y = THREE.MathUtils.lerp(
        kettleRef.current.position.y,
        targetY,
        smooth
      );
    }

    if (streamRef.current) {
      const pouring = progress > 0.28 && progress < 0.88;
      streamRef.current.visible = pouring;
    }

    if (liquidRef.current) {
      const fillScale = THREE.MathUtils.clamp((progress - 0.3) / 0.65, 0.08, 1);
      liquidRef.current.scale.y = THREE.MathUtils.lerp(
        liquidRef.current.scale.y,
        fillScale,
        smooth
      );
      liquidRef.current.position.y = -0.82 + fillScale * 0.34;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.15, 0]}>
      {/* Walnut Wood Pour-Over Stand Base */}
      <mesh position={[0, -0.96, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.14, 1.2]} />
        <meshStandardMaterial color="#3b261d" roughness={0.62} />
      </mesh>
      {/* Brushed Brass Vertical Post */}
      <mesh position={[-0.65, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 1.72, 20]} />
        <meshStandardMaterial color="#d98a4e" metalness={0.85} roughness={0.22} />
      </mesh>
      {/* Brass Dripper Ring Holder */}
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.032, 16, 36]} />
        <meshStandardMaterial color="#d98a4e" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[-0.36, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, 0.58, 12]} />
        <meshStandardMaterial color="#d98a4e" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Terracotta Ceramic V60 Cone */}
      <mesh position={[0, 0.64, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.56, 0.72, 36, 1, true]} />
        <meshStandardMaterial
          color="#a44d34"
          roughness={0.48}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Coffee Grounds Bed Inside Cone */}
      <mesh position={[0, 0.56, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 24]} />
        <meshStandardMaterial color="#2b170e" roughness={0.92} />
      </mesh>

      {/* Glass Carafe Server */}
      <mesh position={[0, -0.42, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.54, 0.92, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#f8f2ec"
          transparent
          opacity={0.32}
          roughness={0.08}
          transmission={0.68}
          thickness={0.14}
        />
      </mesh>
      {/* Filling Amber Coffee Inside Carafe */}
      <mesh ref={liquidRef} position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.4, 0.49, 0.66, 32]} />
        <meshStandardMaterial color="#35190d" roughness={0.14} />
      </mesh>

      {/* Pouring Water / Brew Stream */}
      <mesh ref={streamRef} position={[0.04, 0.85, 0]} visible={false}>
        <cylinderGeometry args={[0.018, 0.012, 0.65, 12]} />
        <meshPhysicalMaterial
          color="#e8d8c8"
          transparent
          opacity={0.75}
          roughness={0.05}
        />
      </mesh>

      {/* Brushed Brass Gooseneck Kettle */}
      <group ref={kettleRef} position={[1.4, 1.25, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.32, 0.42, 0.64, 32]} />
          <meshStandardMaterial color="#211a17" roughness={0.38} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.26, 0.32, 0.08, 24]} />
          <meshStandardMaterial color="#d98a4e" metalness={0.85} roughness={0.22} />
        </mesh>
        {/* Gooseneck Spout */}
        <mesh position={[-0.48, -0.02, 0]} rotation={[0, 0, -0.78]}>
          <cylinderGeometry args={[0.025, 0.04, 0.72, 14]} />
          <meshStandardMaterial color="#d98a4e" metalness={0.85} roughness={0.22} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 4. Procedural Cafe Zone Mini-Diorama (For /reserve Table Selection)
// =============================================================================

export function ProceduralCafeZone({ zone }: { zone: TableZone }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetRot =
      zone === "indoor" ? 0.35 : zone === "patio" ? -0.55 : 0.0;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRot + Math.sin(state.clock.elapsedTime * 0.4) * 0.06,
      Math.min(1, delta * 3.5)
    );
  });

  const floorColor =
    zone === "indoor" ? "#2e1f18" : zone === "patio" ? "#3a2b22" : "#1c1512";
  const accentColor =
    zone === "indoor" ? "#d98a4e" : zone === "patio" ? "#5f8c55" : "#c66b3d";

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      {/* Floor Platform */}
      <mesh position={[0, -0.45, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.2, 0.14, 48]} />
        <meshStandardMaterial color={floorColor} roughness={0.75} />
      </mesh>

      {/* Back Architectural Wall / Arch */}
      <mesh position={[0, 0.55, -1.25]} receiveShadow>
        <boxGeometry args={[2.8, 1.9, 0.16]} />
        <meshStandardMaterial
          color={zone === "patio" ? "#8c4a32" : "#4a2c20"}
          roughness={0.82}
        />
      </mesh>

      {/* Zone-specific furniture */}
      {zone === "bar" ? (
        <>
          {/* Espresso Bar Counter */}
          <mesh position={[0, 0.18, -0.15]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.92, 0.65]} />
            <meshStandardMaterial color="#3b261d" roughness={0.45} />
          </mesh>
          {/* Brass Countertop */}
          <mesh position={[0, 0.66, -0.15]}>
            <boxGeometry args={[2.46, 0.06, 0.72]} />
            <meshStandardMaterial color="#d98a4e" metalness={0.78} roughness={0.25} />
          </mesh>
          {/* Two Bar Stools */}
          {[-0.65, 0.65].map((x) => (
            <group key={x} position={[x, -0.05, 0.65]}>
              <mesh position={[0, 0.36, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.08, 24]} />
                <meshStandardMaterial color="#a44d34" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.0, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.72, 12]} />
                <meshStandardMaterial color="#d98a4e" metalness={0.85} roughness={0.25} />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <>
          {/* Walnut Bistro Table */}
          <mesh position={[0, 0.22, 0.1]} castShadow receiveShadow>
            <cylinderGeometry args={[0.72, 0.72, 0.08, 36]} />
            <meshStandardMaterial color="#4a2e20" roughness={0.42} />
          </mesh>
          <mesh position={[0, -0.08, 0.1]}>
            <cylinderGeometry args={[0.06, 0.12, 0.62, 16]} />
            <meshStandardMaterial color="#d98a4e" metalness={0.82} roughness={0.25} />
          </mesh>
          {/* Two Chairs / Booth Seating */}
          {[-0.95, 0.95].map((x) => (
            <group key={x} position={[x, -0.08, 0.1]}>
              <mesh position={[0, 0.06, 0]} castShadow>
                <boxGeometry args={[0.46, 0.1, 0.48]} />
                <meshStandardMaterial color={accentColor} roughness={0.65} />
              </mesh>
              <mesh position={[x > 0 ? 0.2 : -0.2, 0.36, 0]} castShadow>
                <boxGeometry args={[0.08, 0.56, 0.48]} />
                <meshStandardMaterial color={accentColor} roughness={0.65} />
              </mesh>
            </group>
          ))}
          {/* Mini Coffee Cup on Table */}
          <mesh position={[0.18, 0.34, 0.12]} castShadow>
            <cylinderGeometry args={[0.09, 0.07, 0.14, 18]} />
            <meshStandardMaterial color="#f3ece7" roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Hanging Warm Brass Pendant Lamp */}
      <mesh position={[0, 1.38, 0.1]}>
        <coneGeometry args={[0.28, 0.26, 24]} />
        <meshStandardMaterial
          color="#d98a4e"
          metalness={0.85}
          roughness={0.2}
          emissive="#d98a4e"
          emissiveIntensity={0.35}
        />
      </mesh>
      <pointLight position={[0, 1.15, 0.1]} intensity={1.8} color="#ffdfb8" distance={5} />
    </group>
  );
}
