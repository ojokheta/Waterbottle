"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const CARD_W = 320;
const CARD_H = 220;
const STAGE_W = 900;
const STAGE_H = 360;

const ORBIT = 260;
const LEAN = 38;
const DEPTH = 100;
const DEPTH_MAX = 150;
const PULL = 140;
const TOSS = 150;
const MOST = 2;
const BASE = 620;

const ANGLE = [-6, -3, 0, 3, 6];
const PERIOD = [5.2, 6.1, 7.0, 6.4, 5.8];

interface CardItem {
  title1: string;
  title2: string;
  titleBgColor: string;
  bgColor: string;
  imgUrl: string;
  iconColor?: string;
}

const springOf = (tune: number) => ({
  k: 0.08 + (tune / 100) * 0.16,
  d: 0.62 + (tune / 100) * 0.2,
});

function useSpring(target: number, tune = 50, instant = false) {
  const [at, setAt] = useState(target);
  const cur = useRef(target);
  const vel = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (instant) {
      cur.current = target;
      vel.current = 0;
      setAt(target);
      return;
    }
    const { k, d } = springOf(tune);
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      vel.current += (target - cur.current) * k * dt;
      vel.current *= Math.pow(d, dt);
      cur.current += vel.current * dt;
      if (Math.abs(target - cur.current) < 0.02 && Math.abs(vel.current) < 0.02) {
        cur.current = target;
        vel.current = 0;
        setAt(target);
        raf.current = 0;
        return;
      }
      setAt(cur.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [target, tune, instant]);

  return at;
}

const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Spot = { x: number; y: number; s: number; z: number };

const spotOf = (i: number, turn: number, orbit: number, depth: number, N: number): Spot => {
  const th = (i - turn) * ((Math.PI * 2) / N);
  const f = (Math.cos(th) + 1) / 2;
  return {
    x: Math.sin(th) * orbit,
    y: -(1 - f) * LEAN,
    s: mix(1 - clamp(depth, 0, DEPTH_MAX) / 200, 1, f),
    z: Math.round(f * 100),
  };
};

const write = (el: HTMLElement, sp: Spot, angle: number) => {
  el.style.transform = `translate(-50%, -50%) translate(${sp.x.toFixed(2)}px, ${sp.y.toFixed(2)}px) rotate(${angle}deg) scale(${sp.s.toFixed(4)})`;
  el.style.zIndex = String(sp.z);
};

const out = (t: number) => 1 - (1 - t) ** 4;

const rate = (speed: number) => 1.6 - (speed / 100) * 1.2;

function SingleCard({
  card,
  corner,
  sink,
  off,
}: {
  card: CardItem;
  corner: number;
  sink: number;
  off: boolean;
}) {
  const skin = useRef<HTMLDivElement | null>(null);
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const [on, setOn] = useState(false);
  const still = stillness();

  const live = on && !off;
  const sx = useSpring(live ? pt.x : 0, 50, still);
  const sy = useSpring(live ? pt.y : 0, 50, still);
  const lit = useSpring(live ? 1 : 0, 50, still);

  const deep = clamp(sink, 0, 100) / 100;
  const max = deep * 12;
  const rx = -sy * max;
  const ry = sx * max;

  const px = ((sx + 1) / 2) * 100;
  const py = ((sy + 1) / 2) * 100;
  const dark = deep * 0.4 * lit;
  const rim = deep * 0.14 * lit;

  const track = (e: React.PointerEvent) => {
    const el = skin.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    setPt({
      x: clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1),
      y: clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1, 1),
    });
    setOn(true);
  };

  return (
    <div
      ref={skin}
      className="car-card-wrap"
      onPointerMove={track}
      onPointerOut={(e) => {
        const el = skin.current;
        const to = e.relatedTarget as Node | null;
        if (!el || !to || !el.contains(to)) setOn(false);
      }}
      onPointerCancel={() => setOn(false)}
      style={{
        borderRadius: corner,
        transform: `translateZ(${(-8 * deep * lit).toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`,
        boxShadow: "0 14px 34px -12px rgba(var(--shadow-rgb), 0.32)",
      }}
    >
      <div
        className={`grid grid-cols-2 gap-2 px-4 py-8 md:p-8 rounded-[${corner}px] border border-b-4 border-white/10 ${card.bgColor} h-full`}
      >
        <div className="flex flex-col gap-6 justify-between">
          <h2 className={`text-lg md:text-xl font-bold leading-6 ${card.iconColor === "white" ? "text-white" : "text-black"}`}>
            <span className={`px-2 rounded-md ${card.titleBgColor}`}>{card.title1}</span>{" "}
            <br />
            <span className={`px-2 rounded-md ${card.titleBgColor}`}> {card.title2}</span>
          </h2>
          <button
            className={`flex items-center gap-2 justify-self-end ${
              card.iconColor === "white" ? "text-white" : "text-black"
            }`}
          >
            <span>
              <Image
                src={card.iconColor === "black" ? "/btn-icon-b.svg" : "/btn-icon-w.svg"}
                alt="Arrow icon"
                width={28}
                height={28}
                className="w-full h-auto"
              />
            </span>{" "}
            <span className="hidden md:inline-block text-sm">Learn more</span>
          </button>
        </div>
        <div>
          <Image
            src={card.imgUrl}
            alt={`${card.title1} ${card.title2}`}
            width={210}
            height={0}
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
      <span
        className="car-sheen"
        aria-hidden="true"
        style={{
          borderRadius: corner,
          backgroundImage: `radial-gradient(44% 36% at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(9, 14, 28, ${dark.toFixed(3)}) 0%, rgba(9, 14, 28, 0) 100%), radial-gradient(54% 44% at ${(100 - px).toFixed(1)}% ${(100 - py).toFixed(1)}%, rgba(255, 255, 255, ${rim.toFixed(3)}) 0%, rgba(255, 255, 255, 0) 100%)`,
        }}
      />
    </div>
  );
}

export function CardCarousel({
  cards,
  orbit = ORBIT,
  depth = DEPTH,
  corner = 45,
  float = 15,
  sink = 50,
  settle = 50,
  spin = 0,
}: {
  cards: CardItem[];
  orbit?: number;
  depth?: number;
  corner?: number;
  float?: number;
  sink?: number;
  settle?: number;
  spin?: number;
}) {
  const still = stillness();
  const N = cards.length;
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const turn = useRef(0);
  const raf = useRef(0);
  const drag = useRef<{
    x0: number;
    t0: number;
    last: number;
    t: number;
    vx: number;
    moved: boolean;
  } | null>(null);
  const [held, setHeld] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const paint = useCallback(() => {
    if (!isInView && turn.current === 0) return;
    slots.current.forEach((el, i) => {
      if (el) write(el, spotOf(i, turn.current, orbit, depth, N), ANGLE[i % ANGLE.length]);
    });
  }, [orbit, depth, N, isInView]);

  useLayoutEffect(paint, [paint]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    if (!spin || still || held) return;
    let id = 0;
    let prev = 0;
    const step = (t: number) => {
      if (prev) turn.current += ((t - prev) / 1000) * (N / spin);
      prev = t;
      paint();
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [spin, still, held, paint, N]);

  const glide = (to: number) => {
    cancelAnimationFrame(raf.current);
    const from = turn.current;
    if (still || from === to) {
      turn.current = to;
      paint();
      return;
    }
    const ms = BASE * rate(clamp(settle, 0, 100));
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      turn.current = mix(from, to, out(p));
      paint();
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const go = (d: number) => glide(Math.round(turn.current) + d);

  const down = (e: React.PointerEvent) => {
    cancelAnimationFrame(raf.current);
    drag.current = {
      x0: e.clientX,
      t0: turn.current,
      last: e.clientX,
      t: e.timeStamp,
      vx: 0,
      moved: false,
    };
    setHeld(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const move = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const dx = e.clientX - g.x0;
    if (!g.moved && Math.abs(dx) > 3) g.moved = true;

    const dt = Math.max(1, e.timeStamp - g.t);
    g.vx = (g.vx + (e.clientX - g.last) / dt) / 2;
    g.last = e.clientX;
    g.t = e.timeStamp;

    turn.current = g.t0 - dx / PULL;
    paint();
  };

  const up = () => {
    const g = drag.current;
    if (!g) return;
    drag.current = null;
    setHeld(false);
    const carry = clamp((-g.vx * TOSS) / PULL, -MOST, MOST);
    const to = Math.round(turn.current + carry);
    glide(to);
  };

  const key = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    go(d);
  };

  const r = clamp(corner, 0, 45);

  return (
    <div
      ref={containerRef}
      className="car"
      style={{ width: "100%", maxWidth: STAGE_W, height: STAGE_H }}
    >
      <div
        className="car-track"
        data-held={held}
        role="group"
        aria-label="Card carousel"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={key}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            ref={(el) => {
              slots.current[i] = el;
            }}
            className="car-slot"
            style={{ width: CARD_W, height: CARD_H }}
          >
            <div
              className="car-float"
              style={{
                animationName: float <= 0 ? "none" : undefined,
                animationDuration: `${PERIOD[i % PERIOD.length]}s`,
                ["--lift" as string]: `${((clamp(float, 0, 100) / 100) * 14).toFixed(2)}px`,
                ["--sway" as string]: `${((clamp(float, 0, 100) / 100) * 1.2).toFixed(2)}deg`,
              }}
            >
              <SingleCard card={card} corner={r} sink={sink} off={held || still} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardCarousel;
