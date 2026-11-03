"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function VantaBackground() {
  useEffect(() => {
    const init = () => {
      const VANTA = (window as any).VANTA;
      if (VANTA && VANTA.NET) {
        VANTA.NET({
          el: "#vanta-bg",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0xa9b347,
          backgroundColor: 0x7031b,
          points: 14.0,
          maxDistance: 25.0,
          spacing: 17.0,
        });
      }
    };
    init();
    const t = setInterval(() => {
      if ((window as any).VANTA) {
        init();
        clearInterval(t);
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Script src="/three.r134.min.js" strategy="beforeInteractive" />
      <Script src="/vanta.net.min.js" strategy="beforeInteractive" />
      <div id="vanta-bg" className="fixed inset-0 z-0" />
    </>
  );
}
