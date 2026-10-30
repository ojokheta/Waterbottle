import Image from "next/image";
import React from "react";

export interface TeamCardProps {
  imageUrl: string;
  name: string;
  position: string;
  experience: string;
}

const TeamCard = ({ imageUrl, name, position, experience }: TeamCardProps) => {
  return (
    <div className="border border-b-8 border-white/20 rounded-[45px] px-5 sm:px-9 py-10">
      <div className="border-b-2 pb-7 border-white/10 flex gap-3 md:gap-4 items-end">
        <div>
          <Image
            src={imageUrl}
            alt={`Image of ${name}`}
            width={102}
            height={102}
            className="w-full h-auto"
          />
        </div>
        <div>
          <p className="font-medium text-base">{name}</p>
          <p className="text-sm leading-tight">{position}</p>
        </div>
        <div className="self-start justify-self-end ml-auto">
          <Image
            src={"/linkedin.svg"}
            alt="Linkedin Icon"
            width={34}
            height={34}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="pt-7">{experience}</div>
    </div>
  );
};

export default TeamCard;
