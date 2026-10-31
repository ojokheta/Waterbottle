import Image from "next/image";
import React from "react";
import { TELEGRAM_URL } from "./social-links";

const CaseStudies = () => {
  return (
    <section className="pt-24 md:pt-36 px-4">
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center gap-5 sm:gap-10">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-md">
          JOIN THE MOVEMENT
        </h2>
        <p className="max-w-lg">
          The influencers have their theories. The algorithms have their
          predictions. Reality has other plans.
        </p>
      </div>
      <div className="mt-8 lg:mt-16 lg:bg-dark lg:py-[70px] lg:px-[60px] lg:rounded-[45px] flex flex-wrap lg:flex-nowrap gap-8 lg:gap-16">
        <article className="bg-dark p-10 rounded-[45px] lg:bg-none lg:p-0 lg:rounded-none flex flex-col items-start gap-5 border-r-2 lg:pr-16 border-gray">
          <p className="text-gray text-sm">
            We&apos;re building a community that questions the hype, creates the
            memes, and keeps the $COOKED story alive. This is more than a joke
            about bad predictions.
          </p>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow flex items-center"
          >
            Join Us
            <Image
              src={"/arrow-icon.svg"}
              alt="arrow icon"
              width={15}
              height={15}
              className="ml-2 w-auto h-auto"
            />{" "}
          </a>
        </article>
        <article className="bg-dark p-10 rounded-[45px] lg:bg-none lg:p-0 lg:rounded-none flex flex-col items-start gap-5 lg:pr-16 border-r-2 border-gray">
          <p className="text-gray text-sm">
            A shared experience for everyone who has ever trusted the hype,
            chased the pump, bought the top, or watched a winning trade turn
            red. We don&apos;t need to pretend we know the future.
          </p>
          <button className="text-yellow flex items-center">
            Embrace Chaos
            <Image
              src={"/arrow-icon.svg"}
              alt="arrow icon"
              width={15}
              height={15}
              className="ml-2 w-auto h-auto"
            />{" "}
          </button>
        </article>
        <article className="bg-dark p-10 rounded-[45px] lg:bg-none lg:p-0 lg:rounded-none flex flex-col items-start gap-5">
          <p className="text-gray text-sm">
            The kitchen is open. The next chapter is ours to cook. 🍳🔥
            $COOKED — THE ALGORITHM IS LYING.
          </p>
          <button className="text-yellow flex items-center">
            Meme the Madness
            <Image
              src={"/arrow-icon.svg"}
              alt="arrow icon"
              width={15}
              height={15}
              className="ml-2 w-auto h-auto"
            />{" "}
          </button>
        </article>
      </div>
    </section>
  );
};

export default CaseStudies;
