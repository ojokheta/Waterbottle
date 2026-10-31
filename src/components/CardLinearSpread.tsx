"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type CardLinearSpreadProps = {
  children: ReactNode;
  /** Distance the outermost card travels on hover, in pixels. */
  gap?: number;
  hoverIntensity?: number;
  layers?: number;
  className?: string;
  layerClassName?: string;
};

const spring = { type: "spring", stiffness: 180, damping: 23, mass: 0.8 } as const;

export default function CardLinearSpread({
  children,
  gap = 90,
  hoverIntensity = 1,
  layers = 5,
  className = "",
  layerClassName = "rounded-[45px] border border-b-8 border-white/20 bg-black",
}: CardLinearSpreadProps) {
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const center = Math.floor(layers / 2);
  const active = isHovered && !reduceMotion;
  const distances = Array.from({ length: layers }, (_, i) => i - center);

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") setIsHovered(true);
  };

  return (
    <div
      onPointerEnter={onPointerEnter}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsHovered(false);
        }
      }}
      style={{ zIndex: isHovered ? 10 : 1 }}
      className={`relative ${className}`}
    >
      {distances
        .filter((distance) => distance !== 0)
        .map((distance) => (
          <motion.div
            key={distance}
            aria-hidden="true"
            animate={{
              x: active
                ? distance * (gap / center) * hoverIntensity
                : 0,
            }}
            transition={spring}
            style={{ zIndex: 3 - Math.abs(distance) }}
            className={`absolute inset-0 ${layerClassName}`}
          />
        ))}
      <motion.div
        animate={{ scale: active ? 1.05 : 1 }}
        transition={spring}
        className="relative z-[4] h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
