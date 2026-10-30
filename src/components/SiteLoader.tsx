"use client";

import { useEffect, useRef, useState } from "react";
import { LiquidGlassLogo } from "./liquid-glass-logo";

/**
 * The renderer finishes an `ending="logo"` sequence at its module-private
 * logoFinishTime of 1.8s at speed 1; the exported liquidGlassLogoDuration
 * (3.3s) is the longer wordmark sequence.
 */
const SEQUENCE_SECONDS = 1.8;
const HOLD_SECONDS = 0.5;
const FADE_MS = 500;

type Phase = "playing" | "fading" | "done";

const SiteLoader = () => {
  const [phase, setPhase] = useState<Phase>("playing");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    document.documentElement.dataset.siteReady = "false";
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const finish = () => {
      document.documentElement.dataset.siteReady = "true";
      window.dispatchEvent(new Event("site:ready"));
      document.body.style.overflow = previousOverflow;
    };

    const fadeTimer = window.setTimeout(() => {
      setPhase("fading");
      timers.current.push(window.setTimeout(() => {
        setPhase("done");
        finish();
      }, FADE_MS));
    }, (SEQUENCE_SECONDS + HOLD_SECONDS) * 1000);

    timers.current.push(fadeTimer);

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ease-out ${
        phase === "fading" ? "opacity-0" : "opacity-100"
      }`}
      aria-label="Loading $COOKED"
      aria-busy={phase === "playing"}
    >
      <LiquidGlassLogo
        logo="/logo.svg"
        ending="logo"
        text="$COOKED"
        logoColor="original"
        style={{ height: 480 }}
      />
    </div>
  );
};

export default SiteLoader;
