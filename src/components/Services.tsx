import React from "react";
import CardCarousel from "./CardCarousel";
import Image from "next/image";
import CookedButton from "./CookedButton";
import { X_URL } from "./social-links";

const Services = () => {
  const cards = [
    {
      title1: "Fake",
      title2: "Promises",
      titleBgColor: "bg-yellow",
      bgColor: "bg-dark",
      imgUrl: "/seo.png",
      iconColor: "white",
    },
    {
      title1: "Fake",
      title2: "Certainty",
      titleBgColor: "bg-white",
      bgColor: "bg-yellow",
      imgUrl: "/pay.png",
    },
    {
      title1: "Endless",
      title2: "Predictions",
      titleBgColor: "bg-white",
      bgColor: "bg-dark",
      imgUrl: "/social.png",
      iconColor: "white",
    },
    {
      title1: "We're All",
      title2: "COOKED",
      titleBgColor: "bg-yellow",
      bgColor: "bg-dark",
      imgUrl: "/email-marketing.png",
      iconColor: "white",
    },
  ];

  return (
    <div className="pt-24 md:pt-36 px-4">
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center gap-5 md:gap-10">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-md">WELCOME TO $COOKED</h2>
        <p className="max-w-xl">
          They promised us financial freedom, but showed us only their wins,
          never their losses. They told us to buy and hold while we kept buying
          the top and watching our portfolios turn red.
        </p>
      </div>
      <div className="pt-10 lg:pt-16">
        <CardCarousel cards={cards} orbit={240} float={18} sink={60} settle={55} />
      </div>

      <div className="relative flex justify-between items-center px-8 py-12 md:p-16 rounded-[45px] bg-dark mt-24 lg:mt-36">
        <div className="max-w-md flex flex-col gap-4">
          <h2 className="font-medium text-3xl">
            The market is unpredictable.
          </h2>
          <p>
            Driven by countless forces, including human emotion. No influencer,
            guru, bot, or algorithm can guarantee what happens next. Welcome to
            $COOKED — where we question the hype, laugh at the chaos, and expose
            the absurdity of believing that anyone has the market completely
            figured out.
          </p>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="md:self-start"
          >
            <CookedButton className="w-full md:w-auto">
              Join the Kitchen
            </CookedButton>
          </a>
        </div>
        <div>
          <Image
            src="/stars.png"
            width={350}
            height={200}
            alt="decorative stars"
            className="hidden lg:block absolute -top-6 -bottom-4 right-0 mr-24 w-auto h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Services;
