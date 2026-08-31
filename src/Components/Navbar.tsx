import snapchefLogo from "../assets/snapchef_logo.png";
import { useLanguage } from "../i18n/LanguageContext";

export type AppPage = "home" | "stats";

type NavbarProps = {
  userName: string;
  onNavigateHome: () => void;
};

export function Navbar({ userName, onNavigateHome }: NavbarProps) {
  const { t } = useLanguage();

  return (
    <nav className="snap-card mx-auto grid w-full max-w-5xl grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
      <button
        type="button"
        onClick={onNavigateHome}
        className="justify-self-start bg-transparent p-0"
        aria-label={t("kitchen")}
      >
        <img
          src={snapchefLogo}
          alt="SnapChef"
          className="h-auto w-20 shrink-0 object-contain sm:w-32 md:w-36"
        />
      </button>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-[var(--snap-text-muted)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M4 20C4.8 16.8 7.6 15 12 15C16.4 15 19.2 16.8 20 20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="max-w-[6rem] truncate text-sm font-medium text-[var(--snap-text-muted)] sm:max-w-none">
            {userName}
          </span>
        </div>
      </div>
    </nav>
  );
}
