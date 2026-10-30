import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

const MobileMenu = () => {
  return (
    <Menu as="div" className="relative lg:hidden">
      <MenuButton
        aria-label="Menu"
        className="flex items-center px-3 py-2 border border-white/40 rounded focus:outline-none data-[hover]:border-yellow data-[open]:border-yellow data-[open]:border-2 data-[focus]:outline-2 data-[focus]:outline-yellow"
      >
        <svg
          className="fill-current h-5 w-5"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Menu"
          aria-hidden="true"
        >
          <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
        </svg>
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className="w-52 mt-2 p-1 origin-top-right rounded-xl border border-white/20 bg-dark text-white text-sm/6 transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        <MenuItem>
          <a
            className="block data-[focus]:bg-yellow/30 data-[focus]:font-bold rounded-lg py-1.5 px-3"
            href="#!"
          >
            About Us
          </a>
        </MenuItem>
        <MenuItem>
          <a
            className="block data-[focus]:bg-yellow/30 data-[focus]:font-bold rounded-lg py-1.5 px-3"
            href="#!"
          >
            Services
          </a>
        </MenuItem>
        <MenuItem>
          <a
            className="block data-[focus]:bg-yellow/30 data-[focus]:font-bold rounded-lg py-1.5 px-3"
            href="#!"
          >
            Use Cases
          </a>
        </MenuItem>
        <MenuItem>
          <a
            className="block data-[focus]:bg-yellow/30 data-[focus]:font-bold rounded-lg py-1.5 px-3"
            href="#!"
          >
            Pricing
          </a>
        </MenuItem>
        <MenuItem>
          <a
            className="block data-[focus]:bg-yellow/30 data-[focus]:font-bold rounded-lg py-1.5 px-3"
            href="#!"
          >
            Blog
          </a>
        </MenuItem>
        <MenuItem>
          <button className="w-full border border-white/40 mt-1.5 py-3 px-6 rounded-md data-[focus]:bg-yellow data-[focus]:text-black data-[focus]:font-medium transition-all">
            Request a quote
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default MobileMenu;
