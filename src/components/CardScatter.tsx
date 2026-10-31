"use client";

import { useEffect, useRef, useState } from "react";
import Card from "./Card";

interface CardScatterProps {
  cards: Array<{
    title1: string;
    title2: string;
    titleBgColor: string;
    bgColor: string;
    imgUrl: string;
    iconColor?: string;
  }>;
}

const CardScatter = ({ cards }: CardScatterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMouseEnter = () => setIsActive(true);
  const handleTouchStart = () => setIsActive(true);

  const getSpacing = () => {
    if (windowWidth < 640) return 55;
    if (windowWidth < 1024) return 85;
    return 130;
  };

  const spacing = getSpacing();

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-6xl h-[340px] sm:h-[380px] md:h-[440px] lg:h-[480px] mx-auto cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
    >
      {cards.map((card, index) => {
        const total = cards.length;
        const centerIndex = (total - 1) / 2;
        const offset = index - centerIndex;
        
        const translateX = isActive ? offset * spacing : offset * 2.5;
        const translateY = isActive ? Math.abs(offset) * (windowWidth < 640 ? 8 : 12) : offset * 1.5;
        const rotate = isActive ? offset * (windowWidth < 640 ? 4 : 5.5) : offset * 1.2;
        const scale = isActive ? 1 : 0.94;

        return (
          <div
            key={index}
            className="absolute top-1/2 left-1/2 w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 transition-all duration-[1000ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] will-change-transform"
            style={{
              transform: isActive
                ? `translateX(calc(-50% + ${translateX}px)) translateY(calc(-50% + ${translateY}px)) rotate(${rotate}deg) scale(${scale})`
                : `translateX(calc(-50% + ${offset * 2}px)) translateY(calc(-50% + ${offset * 1}px)) rotate(${offset * 1}deg) scale(0.93)`,
              zIndex: isActive ? total - Math.abs(offset) : total - index,
              transitionDelay: `${index * 70}ms`,
            }}
          >
            <Card
              title1={card.title1}
              title2={card.title2}
              titleBgColor={card.titleBgColor}
              bgColor={card.bgColor}
              imgUrl={card.imgUrl}
              iconColor={card.iconColor}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CardScatter;
