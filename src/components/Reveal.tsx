"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type RevealEffect = "up" | "fade" | "scale" | "words" | "children";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Element to render — keep the original tag so the layout never changes. */
  as?: ElementType;
  /** "words" splits a plain string into per-word spans, "children" staggers direct children. */
  effect?: RevealEffect;
  delay?: number;
  stagger?: number;
  y?: number;
  duration?: number;
};

/** The loading screen flips this once its sequence has finished. */
const readReady = () =>
  typeof document !== "undefined" &&
  document.documentElement.dataset.siteReady === "true";

const useSiteReady = () => {
  const [ready, setReady] = useState(readReady);

  useEffect(() => {
    if (ready) return;
    const onReady = () => setReady(true);
    window.addEventListener("site:ready", onReady);
    return () => window.removeEventListener("site:ready", onReady);
  }, [ready]);

  return ready;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-triggered reveal. Content stays fully visible until the loading screen
 * finishes, so a failed animation can never leave the page blank.
 */
const Reveal = ({
  children,
  className,
  as,
  effect = "up",
  delay = 0,
  stagger = 0.08,
  y = 28,
  duration = 0.8,
}: RevealProps) => {
  const root = useRef<HTMLElement>(null);
  const ready = useSiteReady();
  const Tag = (as ?? "div") as ElementType;
  const split = effect === "words" && typeof children === "string";
  const words = split ? (children as string).split(/\s+/).filter(Boolean) : [];

  useLayoutEffect(() => {
    const el = root.current;
    if (!ready || !el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const targets: Element | Element[] =
        effect === "children"
          ? Array.from(el.children)
          : effect === "words"
            ? Array.from(el.querySelectorAll<HTMLElement>(".reveal-word"))
            : el;

      if (Array.isArray(targets) && targets.length === 0) return;

      gsap.fromTo(
        targets,
        {
          autoAlpha: 0,
          y: effect === "scale" ? 0 : y,
          scale: effect === "scale" ? 0.92 : 1,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration,
          delay,
          ease: "power3.out",
          stagger: effect === "children" || effect === "words" ? stagger : 0,
          immediateRender: true,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [ready, effect, delay, stagger, y, duration]);

  return (
    <Tag ref={root} className={className}>
      {split
        ? words.map((word, index) => (
            <span key={`${word}-${index}`} className="reveal-word inline-block">
              {word}
              {index < words.length - 1 ? " " : ""}
            </span>
          ))
        : children}
    </Tag>
  );
};

export default Reveal;
