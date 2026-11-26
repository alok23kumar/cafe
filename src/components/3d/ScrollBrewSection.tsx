"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Droplets, Timer, Coffee } from "lucide-react";
import SceneWrapper from "./SceneWrapper";

const BREW_CHAPTERS = [
  {
    step: "01",
    title: "Small-Batch Brass Drum Roasting",
    subtitle: "Chikmagalur & Ratnagiri Estates · 1,350m",
    description:
      "Every Tuesday morning we roast 100% single-origin Indian Arabica in small 12kg batches, unlocking toasted hazelnut, jaggery, and bright stone-fruit sweetness without bitterness.",
    icon: Flame,
  },
  {
    step: "02",
    title: "The 30-Second Aromatic Bloom",
    subtitle: "93°C Filtered Water · Precision Grind",
    description:
      "Freshly ground moments before brewing, the first gentle spiral pour degasses trapped CO2 and releases rich floral aromatics across our terracotta slow bar.",
    icon: Droplets,
  },
  {
    step: "03",
    title: "Hand-Poured V60 Extraction",
    subtitle: "2:45 Brew Curve · Zero Bitterness",
    description:
      "Our baristas pour in concentric stages through a ceramic dripper, balancing crisp bergamot clarity with a velvety caramel finish.",
    icon: Timer,
  },
  {
    step: "04",
    title: "Served Warm at Your Table — Or Fresh to Your Door",
    subtitle: "Dine-In · Express Pickup · Roasted Bean Bags",
    description:
      "Sip in our walnut booths beneath brass pendants, pick up on your morning commute, or spin and order whole-bean bags roasted the very same week.",
    icon: Coffee,
  },
];

export default function ScrollBrewSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;
      const scrolled = -rect.top;
      const ratio = Math.max(0, Math.min(1, scrolled / totalScrollable));
      setProgress(ratio);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const activeChapterIndex = Math.min(
    BREW_CHAPTERS.length - 1,
    Math.floor(progress * BREW_CHAPTERS.length)
  );

  return (
    <section
      ref={sectionRef}
      id="craft-story"
      className="relative border-y border-cafe-border bg-cafe-surface/40 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cafe-accent">
            The Ritual of Craft
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-cafe-cream md:text-5xl">
            From Brass Drum to Ceramic Pour-Over
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cafe-muted md:text-base">
            Scroll through our signature V60 extraction ritual — watch the
            gooseneck kettle pour and the carafe fill in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Sticky 3D Pour-Over Viewport */}
          <div className="lg:sticky lg:top-24 lg:col-span-6">
            <div className="cafe-glow rounded-3xl border border-cafe-border bg-cafe-bg/80 p-3">
              <SceneWrapper
                scene="scroll-brew"
                scrollProgress={progress}
                fallbackImg="https://images.unsplash.com/photo-1545665225-b23b99e4d45e?auto=format&fit=crop&w=1000&q=80"
                alt="Ember & Bean V60 Pour-Over Ritual"
                className="h-[380px] w-full sm:h-[460px]"
              />
              {/* Progress Indicator Bar */}
              <div className="mt-3 flex items-center justify-between px-3 pb-1 text-xs text-cafe-muted">
                <span className="font-mono uppercase tracking-wider text-cafe-accent">
                  Stage {BREW_CHAPTERS[activeChapterIndex].step} / 04
                </span>
                <div className="mx-4 h-1.5 flex-1 overflow-hidden rounded-full bg-cafe-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cafe-terracotta to-cafe-accent transition-all duration-150"
                    style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
                  />
                </div>
                <span className="font-mono">{Math.round(progress * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Narrative Chapters */}
          <div className="space-y-6 lg:col-span-6">
            {BREW_CHAPTERS.map((chapter, idx) => {
              const Icon = chapter.icon;
              const isActive = idx === activeChapterIndex;
              return (
                <div
                  key={chapter.step}
                  className={`rounded-2xl border p-6 transition-all duration-300 md:p-8 ${
                    isActive
                      ? "border-cafe-accent/60 bg-cafe-surface shadow-lg shadow-cafe-accent/5"
                      : "border-cafe-border/70 bg-cafe-bg/50 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold tracking-widest text-cafe-accent">
                      CHAPTER {chapter.step}
                    </span>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                        isActive
                          ? "border-cafe-accent/50 bg-cafe-accent/15 text-cafe-accent"
                          : "border-cafe-border bg-cafe-surface text-cafe-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-semibold text-cafe-cream">
                    {chapter.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-cafe-accent/90">
                    {chapter.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-cafe-muted">
                    {chapter.description}
                  </p>
                </div>
              );
            })}

            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-cafe-accent px-6 py-3.5 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover"
              >
                <span>Explore Full Cafe Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
