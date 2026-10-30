import React from "react";
import Header from "./Header";
import Image from "next/image";
import Reveal from "./Reveal";
import CookedButton from "./CookedButton";

const tapeTickers = [
  "$COOKED",
  "$BTC",
  "$ETH",
  "$BNB",
  "$SOL",
  "$XRP",
  "$DOGE",
  "$AVAX",
];

const tapeSlogans = [
  "STAY COOKED",
  "THE ALGORITHM IS LYING",
  "MEME THE MADNESS",
  "QUESTION THE HYPE",
  "EMBRACE CHAOS",
  "NO FALSE CERTAINTY",
];

type TapeProps = {
  items: string[];
  reverse?: boolean;
  tone?: "solid" | "outline" | "gold";
  duration?: number;
};

/** Seamless infinite strip: the list is rendered twice and slides by exactly half. */
const Tape = ({ items, reverse = false, tone = "outline", duration = 32 }: TapeProps) => {
  const loop = [...items, ...items];

  return (
    <div className="marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className={`marquee-track flex w-max ${reverse ? "marquee-track-reverse" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((item, index) => (
          <span
            key={`${item}-${index}`}
            aria-hidden={index >= items.length}
            className={`mr-3 inline-flex shrink-0 items-center rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider ${
              tone === "solid" && index % items.length === 0
                ? "bg-yellow text-black"
                : tone === "gold"
                  ? "border border-yellow/40 text-yellow"
                  : "border border-white/20 text-white/80"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <div className="px-4">
      <Header />
      <section className="flex justify-between py-12 pb-10 lg:py-16">
        <article className="flex flex-col items-center md:items-start">
          <Reveal as="h1" effect="words" className="font-medium text-4xl/normal md:text-6xl/normal lg:max-w-xl">
            THE ALGORITHM IS LYING.
          </Reveal>
          <Reveal
            as="span"
            effect="fade"
            delay={0.15}
            className="inline-block mt-4 text-sm font-bold uppercase tracking-wider text-yellow"
          >
            WELCOME TO THE KITCHEN 🍳
          </Reveal>
          <div className="lg:hidden mt-9 lg:mt-0">
            <Image
              src={"/speaker.png"}
              alt="speaker image"
              width={560}
              height={0}
              priority
              className="lg:hidden w-auto h-auto"
            />
          </div>
          <Reveal as="p" effect="up" delay={0.1} className="text-lg md:text-xl py-9 lg:max-w-lg">
            The market is cooked. The predictions are cooked. The algorithm is
            cooked.
          </Reveal>
          <Reveal as="p" effect="up" delay={0.16} className="text-lg md:text-xl py-9 lg:max-w-lg">
            Everyone claims to know what happens next. Influencers promise us
            1,000x gains. Gurus tell us when to buy. AI bots generate endless
            predictions, each claiming to have the answer.
          </Reveal>
          <Reveal as="p" effect="up" delay={0.22} className="text-lg md:text-xl py-9 lg:max-w-lg">
            But the market keeps doing the opposite.
          </Reveal>
          <Reveal as="p" effect="up" delay={0.28} className="text-lg md:text-xl py-9 lg:max-w-lg">
            Chaos everywhere. Portfolios bleeding. Red candles across the
            charts. Yet someone is still shouting, &quot;BUY NOW!&quot;
          </Reveal>
          <Reveal as="p" effect="up" delay={0.34} className="text-lg md:text-xl py-9 lg:max-w-lg">
            We&apos;re getting cooked every single day. 💀
          </Reveal>
          <CookedButton className="w-full lg:w-auto lg:self-start">
            Buy $COOKED
          </CookedButton>
        </article>
        <div className="hidden lg:block">
          <Image
            src={"/speaker.png"}
            alt="speaker image"
            width={560}
            height={0}
            priority
            className="w-auto h-auto object-cover"
          />
        </div>
      </section>
      <Reveal as="section" effect="up" delay={0.1} className="flex flex-col gap-3 py-4">
        <Tape items={tapeTickers} tone="solid" duration={34} />
        <Tape items={tapeSlogans} tone="gold" reverse duration={44} />
      </Reveal>
    </div>
  );
};

export default Hero;
