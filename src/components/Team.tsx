import React from "react";
import TeamCard, { TeamCardProps } from "./TeamCard";

const Team = () => {
  return (
    <section className="pt-24 md:pt-36 px-4">
      <div className="flex flex-col md:flex-row text-center md:text-start items-center gap-5 md:gap-10">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-md">COMMUNITY</h2>
        <p className="max-w-md">
          The influencers have their theories. The algorithms have their
          predictions. Reality has other plans.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pt-8 md:pt-16">
        {CommunityDetails.map((det, idx) => (
          <TeamCard key={idx} {...det} />
        ))}
      </div>
      <div className="sm:justify-self-end mt-10">
        <a href="#!" className="block">
          <button className="w-full bg-yellow text-black font-medium px-9 py-5 rounded-[14px]">
            Join the Kitchen
          </button>
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
    imageUrl: "/jane.png",
    name: "Embrace the Chaos",
    position: "Community Value",
    experience:
      "A shared experience for everyone who has ever trusted the hype, chased the pump, bought the top, or watched a winning trade turn red.",
  },
  {
    imageUrl: "/michael.png",
    name: "Meme the Madness",
    position: "Community Value",
    experience:
      "We don't need to pretend we know the future. We're here to embrace the chaos, challenge false certainty, and build something together.",
  },
  {
    imageUrl: "/emily.png",
    name: "The Kitchen is Open",
    position: "Community Value",
    experience:
      "The next chapter is ours to cook. 🍳🔥 $COOKED — THE ALGORITHM IS LYING.",
  },
  {
    imageUrl: "/brian.png",
    name: "No False Certainty",
    position: "Community Value",
    experience:
      "This is more than a joke about bad predictions. It's a movement against fake promises and endless hype.",
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