"use client";

import React, { Component, Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Zap } from "lucide-react";
import { useCafeStore } from "@/store/useCafeStore";
import type { TableZone } from "@/types/database";

// =============================================================================
// Dynamic SSR-Disabled 3D Scene Imports (Never bundle WebGL in Server Components)
// =============================================================================

const HeroCupScene = dynamic(() => import("./HeroCupScene"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

const BeanBagViewer = dynamic(() => import("./BeanBagViewer"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

const ScrollBrewCanvas = dynamic(() => import("./ScrollBrewCanvas"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

const ZonePreviewScene = dynamic(() => import("./ZonePreviewScene"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

function SceneSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center rounded-2xl bg-cafe-surface/60">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cafe-muted">
        <Sparkles className="h-4 w-4 text-cafe-accent" />
        <span>Loading 3D Craft...</span>
      </div>
    </div>
  );
}

// =============================================================================
// React Error Boundary for WebGL Context / Shader / Asset Failures
// =============================================================================

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    // Gracefully degrades to fallback image without crashing the storefront
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// =============================================================================
// Unified SceneWrapper Component
// =============================================================================

export type SceneKind = "hero-cup" | "bean-bag" | "scroll-brew" | "zone-preview";

export interface SceneWrapperProps {
  scene: SceneKind;
  fallbackImg: string;
  alt: string;
  className?: string;
  /** Optional scene-specific props */
  scrollProgress?: number;
  variantLabel?: string;
  accentColorHex?: string;
  textureUrl?: string | null;
  customModelUrl?: string | null;
  zone?: TableZone;
  /** Show interactive Lite/3D pill in corner */
  showModeBadge?: boolean;
}

export default function SceneWrapper({
  scene,
  fallbackImg,
  alt,
  className = "h-[420px] w-full",
  scrollProgress = 0,
  variantLabel,
  accentColorHex,
  textureUrl,
  customModelUrl,
  zone = "indoor",
  showModeBadge = true,
}: SceneWrapperProps) {
  const isLiteMode = useCafeStore((s) => s.isLiteMode);
  const toggleLiteMode = useCafeStore((s) => s.toggleLiteMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const [inViewport, setInViewport] = useState(scene === "hero-cup");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Respect OS-level prefers-reduced-motion accessibility preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Viewport-aware WebGL mounting to prevent exceeding browser active WebGL context limits
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setInViewport(entry.isIntersecting);
        }
      },
      { rootMargin: "220px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shouldRender2DFallback = isLiteMode || prefersReducedMotion;

  const fallbackElement = (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-cafe-border bg-cafe-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallbackImg}
        alt={alt}
        className="h-full w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cafe-bg/70 via-transparent to-transparent" />
    </div>
  );

  const renderScene = () => {
    switch (scene) {
      case "hero-cup":
        return <HeroCupScene customModelUrl={customModelUrl} />;
      case "bean-bag":
        return (
          <BeanBagViewer
            variantLabel={variantLabel}
            accentColorHex={accentColorHex}
            textureUrl={textureUrl}
            customModelUrl={customModelUrl}
          />
        );
      case "scroll-brew":
        return (
          <ScrollBrewCanvas
            progress={scrollProgress}
            customModelUrl={customModelUrl}
          />
        );
      case "zone-preview":
        return <ZonePreviewScene zone={zone} />;
      default:
        return fallbackElement;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {shouldRender2DFallback ? (
        fallbackElement
      ) : inViewport ? (
        <WebGLErrorBoundary fallback={fallbackElement}>
          <Suspense fallback={fallbackElement}>{renderScene()}</Suspense>
        </WebGLErrorBoundary>
      ) : (
        fallbackElement
      )}

      {showModeBadge && (
        <button
          type="button"
          onClick={() => toggleLiteMode()}
          title={
            isLiteMode
              ? "Switch back to Interactive 3D"
              : "Switch to Fast 2D Lite Mode"
          }
          className="cafe-glass absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide text-cafe-cream transition hover:border-cafe-accent/60 hover:text-cafe-accent"
        >
          {isLiteMode ? (
            <>
              <Sparkles className="h-3.5 w-3.5 text-cafe-accent" />
              <span>Enable 3D</span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 text-cafe-accent" />
              <span>3D Live · Fast Mode</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
