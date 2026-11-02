import React from "react";
import CardLinearSpread from "./CardLinearSpread";
import TeamCard, { TeamCardProps } from "./TeamCard";
import { X_URL } from "./social-links";
import CookedButton from "./CookedButton";

const Team = () => {
  return (
    <section className="pt-24 md:pt-36 px-4 w-full max-w-5xl mx-auto overflow-x-clip">
      <div className="flex flex-col md:flex-row text-center md:text-start items-center gap-5 md:gap-10">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-md">COMMUNITY</h2>
        <p className="max-w-md">
          The influencers have their theories. The algorithms have their
          predictions. Reality has other plans.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pt-8 md:pt-16">
        {CommunityDetails.map((det, idx) => (
          <CardLinearSpread key={idx} className="h-full" gap={36}>
            <TeamCard {...det} />
          </CardLinearSpread>
        ))}
      </div>
      <div className="sm:justify-self-end mt-10">
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <CookedButton className="w-full">
            Join the Kitchen
          </CookedButton>
        </a>
      </div>
    </section>
  );
};

const CommunityDetails: TeamCardProps[] = [
  {
    imageUrl: "/john.png",
    name: "Question the Hype",
    position: "Community Value",
    experience:
      "We're building a community that questions the hype, creates the memes, and keeps the $COOKED story alive.",
  },
  {
    imageUrl: "/emily.png",
    name: "The Kitchen is Open",
    position: "Community Value",
    experience:
      "The next chapter is ours to cook. 🍳🔥 $COOKED — THE ALGORITHM IS LYING.",
  },
  {
    imageUrl: "/sarah.png",
    name: "Build Together",
    position: "Community Value",
    experience:
      "Through memes, satire, and community-driven content, we're turning the shared chaos of crypto into a movement.",
  },
];

export default Team;