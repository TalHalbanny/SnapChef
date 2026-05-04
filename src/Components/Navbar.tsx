import snapchefLogo from "../assets/snapchef_logo.png";

export function Navbar() {
  return (
    <nav
      className="mx-auto grid w-full max-w-5xl grid-cols-3 items-center rounded-2xl px-6 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
      style={{ backgroundColor: "#C5D89D" }}>
      <img
        src={snapchefLogo}
        alt="SnapChef"
        className="h-auto w-28 shrink-0 object-contain sm:w-32 md:w-36"
      />

      <div className="justify-self-center flex items-center gap-6 text-[#89986D]">
      </div>

      <div className="justify-self-end flex items-center gap-2 text-black">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 20C4.8 16.8 7.6 15 12 15C16.4 15 19.2 16.8 20 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-medium text-[#89986D]">username</span>
      </div>
    </nav>
  );
}
