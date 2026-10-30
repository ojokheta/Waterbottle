import React from "react";
import MobileMenu from "./MobileMenu";

const Header = () => {
  return (
    <header className="flex justify-between items-center">
      <div className="w-[220px] h-[56px] flex items-center">
        <a href="#" className="flex items-center gap-2">
          <svg
            width="26"
            height="26"
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
        </a>
      </div>
      <nav>
        <ul className="hidden lg:flex p-4 gap-x-1 items-center">
          <li>
            <a
              href="#!"
              className="py-2 px-4 rounded-md hover:bg-yellow hover:text-black hover:font-bold transition-all"
            >
              About us
            </a>
          </li>
          <li>
            <a
              href="#!"
              className="py-2 px-4 rounded-md hover:bg-yellow hover:text-black hover:font-bold transition-all"
            >
              Services
            </a>
          </li>
          <li>
            <a
              href="#!"
              className="py-2 px-4 rounded-md hover:bg-yellow hover:text-black hover:font-bold transition-all"
            >
              Use Cases
            </a>
          </li>
          <li>
            <a
              href="#!"
              className="py-2 px-4 rounded-md hover:bg-yellow hover:text-black hover:font-bold transition-all"
            >
              Pricing
            </a>
          </li>
          <li>
            <a
              href="#!"
              className="py-2 px-4 rounded-md hover:bg-yellow hover:text-black hover:font-bold transition-all"
            >
              Blog
            </a>
          </li>
          <li>
            <a href="#!">
              <button className="border border-white/40 py-3 px-6 rounded-md hover:font-medium hover:bg-yellow hover:text-black hover:border-yellow transition-all">
                Request a quote
              </button>
            </a>
          </li>
        </ul>
        <MobileMenu />
      </nav>
    </header>
  );
};

export default Header;
