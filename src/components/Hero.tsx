import React from "react";
import Header from "./Header";
import Image from "next/image";

const Hero = () => {
  return (
    <div className="px-4">
      <Header />
      <section className="flex justify-between py-12 pb-10 lg:py-16">
        <article className="flex flex-col items-center md:items-start">
          <h1 className="font-medium text-4xl/normal md:text-6xl/normal lg:max-w-xl">
            THE ALGORITHM IS LYING.
          </h1>
          <span className="inline-block mt-4 text-sm font-bold uppercase tracking-wider text-yellow">
            WELCOME TO THE KITCHEN 🍳
          </span>
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
          <p className="text-lg md:text-xl py-9 lg:max-w-lg">
            The market is cooked. The predictions are cooked. The algorithm is
            cooked.
          </p>
          <p className="text-lg md:text-xl py-9 lg:max-w-lg">
            Everyone claims to know what happens next. Influencers promise us
            1,000x gains. Gurus tell us when to buy. AI bots generate endless
            predictions, each claiming to have the answer.
          </p>
          <p className="text-lg md:text-xl py-9 lg:max-w-lg">
            But the market keeps doing the opposite.
          </p>
          <p className="text-lg md:text-xl py-9 lg:max-w-lg">
            Chaos everywhere. Portfolios bleeding. Red candles across the
            charts. Yet someone is still shouting, &quot;BUY NOW!&quot;
          </p>
          <p className="text-lg md:text-xl py-9 lg:max-w-lg">
            We&apos;re getting cooked every single day. 💀
          </p>
          <button className="w-full lg:w-auto lg:self-start px-9 py-4 bg-yellow text-black font-medium rounded-xl">
            Buy $COOKED
          </button>
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
      <section className="flex justify-center lg:justify-between flex-wrap gap-x-8 gap-y-3">
        <div>
          <Image
            className="grayscale invert w-full h-auto"
            src={"/amazon.png"}
            alt="amazon logo"
            width={126}
            height={0}
          />
        </div>
        <div>
          <Image
            className="grayscale invert w-full h-auto"
            src={"/dribble.png"}
            alt="dribble logo"
            width={126}
            height={0}
          />
        </div>
        <div>
          <Image
            className="grayscale invert w-full h-auto"
            src={"/hubspot.png"}
            alt="hubspot logo"
            width={126}
            height={0}
          />
        </div>
        <div>
          <Image
            className="grayscale invert w-full h-auto"
            src={"/notion.png"}
            alt="notion logo"
            width={126}
            height={0}
          />
        </div>
        <div>
          <Image
            className="grayscale invert w-full h-auto"
            src={"/netflix.png"}
            alt="netflix logo"
            width={126}
            height={48}
          />
        </div>
        <div>
          <Image
            className="grayscale invert w-full h-auto"
            src={"/zoom.png"}
            alt="zoom logo"
            width={126}
            height={0}
          />
        </div>
      </section>
    </div>
  );
};

export default Hero;
