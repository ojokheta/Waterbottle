"use client";

import { useState } from "react";

export default function Accordion() {
  const [activeSection, setActiveSection] = useState<number | null>(1);

  const toggleSection = (section: number) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <section className="pt-24 sm:pt-36 px-4">
      <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start sm:gap-10">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-sm">
          MISSION
        </h2>
        <p className="max-w-xs">
          We don&apos;t predict the market. We meme the madness.
        </p>
      </div>
      <div
        className={`${
          activeSection === 1
            ? "bg-yellow text-black border-black/10"
            : "bg-dark text-white border-white/10"
        } border border-b-4 px-8 sm:px-[60px] py-3 rounded-[45px] mt-4 sm:mt-16`}
      >
        <div
          className="flex justify-between items-center py-7 cursor-pointer"
          onClick={() => toggleSection(1)}
        >
          <h3 className="flex font-medium">
            <span className="text-3xl sm:text-6xl mr-3 sm:mr-6 font-extrabold">
              01
            </span>{" "}
            <span className="text-xl sm:text-3xl self-center">
              {" "}
              Our Mission
            </span>
          </h3>
          <div className="flex justify-center items-center text-2xl border rounded-full w-10 h-10 bg-white text-black">
            <span className="text-4xl"> {activeSection === 1 ? "−" : "+"}</span>
          </div>
        </div>
        {activeSection === 1 && (
          <div className="py-7 border-t">
            <p>
              To build $COOKED into a recognizable, crypto-native meme brand
              powered by creativity, humor, and community participation. Our
              mission isn&apos;t to predict the next market move or promise anyone
              financial freedom. It&apos;s to create an original story, a recognizable
              identity, and a community people want to be part of. Through
              memes, satire, and community-driven content, we&apos;re turning the
              shared chaos of crypto into a movement. We don&apos;t predict the
              market. We meme the madness.
            </p>
          </div>
        )}
      </div>

      <div
        className={`${
          activeSection === 2
            ? "bg-yellow text-black border-black/10"
            : "bg-dark text-white border-white/10"
        } border border-b-4 px-8 sm:px-[60px] py-3 rounded-[45px] mt-4 sm:mt-8`}
      >
        <div
          className="flex justify-between items-center py-7 cursor-pointer"
          onClick={() => toggleSection(2)}
        >
          <h3 className="flex font-medium">
            <span className="text-3xl sm:text-6xl mr-3 sm:mr-6 font-extrabold">
              02
            </span>{" "}
            <span className="text-xl sm:text-3xl self-center">
              {" "}
              Tokenomics
            </span>
          </h3>
          <div className="flex justify-center items-center text-2xl border rounded-full w-10 h-10 bg-white text-black">
            <span className="text-4xl"> {activeSection === 2 ? "−" : "+"}</span>
          </div>
        </div>
        {activeSection === 2 && (
          <div className="py-7 border-t">
            <ul className="list-disc pl-6 space-y-2">
              <li>Token name: COOKED</li>
              <li>Ticker: $COOKED</li>
              <li>Network: BNB Chain</li>
              <li>Total supply: 1,000,000,000 (1 billion)</li>
              <li>Contract address: Coming soon</li>
              <li>Buy tax: 3%</li>
              <li>Sell tax: 3%</li>
              <li>Liquidity: will be locked after launch</li>
              <li>
                Token allocation: 75% liquidity pool, 25% team and marketing
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}