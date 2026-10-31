import React from "react";
import CookedButton from "./CookedButton";
import {
  TELEGRAM_URL,
  TelegramIcon,
  X_URL,
  XIcon,
} from "./social-links";

const socialLinks = [
  { href: X_URL, label: "Follow $COOKED on X", Icon: XIcon },
  { href: TELEGRAM_URL, label: "Join $COOKED on Telegram", Icon: TelegramIcon },
];

const SocialLinks = ({ className = "" }: { className?: string }) => (
  <div className={`flex gap-3 ${className}`}>
    {socialLinks.map(({ href, label, Icon }) => (
      <a
        key={href}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="text-white transition-colors hover:text-yellow"
      >
        <Icon className="w-[30px] h-[30px]" />
      </a>
    ))}
  </div>
);

const Footer = () => {
  return (
    <footer className="mt-32 lg:mt-36 bg-dark lg:rounded-t-[45px] px-4 lg:px-[60px] pt-[55px] pb-[50px]">
      <section className="flex flex-col lg:flex-row gap-12 justify-between items-center lg:items-end">
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7.0099 2.05941L14 0L11.9604 7.0099L14 14L7.0099 11.9604L0 14L2.05941 7.0099L0 0L7.0099 2.05941Z"
              fill="#FFD500"
            />
          </svg>
          <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-yellow">
            $COOKED
          </span>
        </div>
        <nav className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8 list-none">
          <li className="group block ">
            <a
              href="#!"
              className="group-hover:text-yellow transition-all delay-200 flex hover:underline text-gray"
            >
              About us
            </a>
          </li>
          <li className="group block ">
            <a
              href="#!"
              className="group-hover:text-yellow transition-all delay-200 flex hover:underline text-gray"
            >
              Services
            </a>
          </li>
          <li className="group block ">
            <a
              href="#!"
              className="group-hover:text-yellow transition-all delay-200 flex hover:underline text-gray"
            >
              Use Cases
            </a>
          </li>
          <li className="group block ">
            <a
              href="#!"
              className="group-hover:text-yellow transition-all delay-200 flex hover:underline text-gray"
            >
              Pricing
            </a>
          </li>
          <li className="group block ">
            <a
              href="#!"
              className="group-hover:text-yellow transition-all delay-200 flex hover:underline text-gray"
            >
              Blog
            </a>
          </li>
        </nav>

        {/* Social links for large screen devices */}
        <SocialLinks className="hidden lg:flex" />
      </section>
      <section className="flex flex-col gap-10 lg:gap-3 lg:flex-row justify-between mt-[66px]">
        {/* Contact details intentionally left blank; the column keeps the layout. */}
        <div className="hidden lg:block" aria-hidden="true" />
        <div className="bg-[#1F1F1F] px-10 py-14 rounded-[14px]">
          <form className="flex flex-col md:flex-row gap-5">
            <input
              type="email"
              placeholder="Email"
              className="bg-transparent px-4 xl:px-9 py-3 md:py-5 rounded-[14px] border border-white text-white w-full"
            />
            <CookedButton className="w-full">
              Subscribe to news
            </CookedButton>
          </form>
        </div>
      </section>

      {/* Social links for small screen devices */}
      <SocialLinks className="lg:hidden justify-center mt-10" />

      <hr className="mt-10 lg:mt-[50px] border-white/20" />
      <div className="mt-10 lg:mt-[50px] flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-8  text-white">
        <p className="text-white">
          &copy; {new Date().getFullYear()} $COOKED. All Rights Reserved.
        </p>

        <a
          href="#!"
          className="flex hover:underline transition-all duration-300"
        >
          Privacy Policy
        </a>
      </div>
    </footer>
  );
};

export default Footer;
