"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/**
 * Self-hosted Draco decoder directory (copied from node_modules/three/examples/jsm/libs/draco/).
 * Prevents external CDN outages from breaking 3D model loading.
 */
export const DRACO_DECODER_PATH = "/draco/";

interface GltfPlugInModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Optional texture URL to swap onto meshes matching `labelMeshKeyword` */
  textureOverrideUrl?: string | null;
  /** Case-insensitive mesh name substring to receive label textures (default: "label") */
  labelMeshKeyword?: string;
}

/**
 * Plug-and-play GLTF/GLB loader backed by self-hosted Draco decoding.
 * Clones the scene so multiple viewers stay isolated, swaps label textures
 * dynamically when provided, and disposes cloned resources on unmount.
 */
export function GltfPlugInModel({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  textureOverrideUrl,
  labelMeshKeyword = "label",
}: GltfPlugInModelProps) {
  const gltf = useGLTF(url, DRACO_DECODER_PATH);

  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    if (!textureOverrideUrl) return;
    let disposed = false;
    const loader = new THREE.TextureLoader();

    loader.load(
      textureOverrideUrl,
      (loadedTex) => {
        if (disposed) {
          loadedTex.dispose();
          return;
        }
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        loadedTex.flipY = false;

        clonedScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.name.toLowerCase().includes(labelMeshKeyword.toLowerCase())) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && "map" in mat) {
                mat.map = loadedTex;
                mat.needsUpdate = true;
              }
            }
          }
        });
      },
      undefined,
      () => {
        // Silently ignore missing optional texture file
      }
    );

    return () => {
      disposed = true;
    };
  }, [clonedScene, textureOverrideUrl, labelMeshKeyword]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
}
