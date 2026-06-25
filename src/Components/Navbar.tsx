import { LogOut } from "lucide-react";
import snapchefLogo from "../assets/snapchef_logo.png";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "../i18n/LanguageContext";

type NavbarProps = {
  userName: string;
  onLogout: () => void;
};

export function Navbar({ userName, onLogout }: NavbarProps) {
  const { t } = useLanguage();

  return (
    <nav className="snap-card mx-auto grid w-full max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-3 sm:px-6 sm:py-4">
      <img
        src={snapchefLogo}
        alt="SnapChef"
        className="h-auto w-20 shrink-0 object-contain sm:w-32 md:w-36"
      />

      <div className="justify-self-center">
        <LanguageToggle />
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 sm:flex">
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

        <button
          type="button"
          onClick={onLogout}
          className="snap-btn-secondary !w-auto !px-2.5 !py-1.5 !text-xs"
          aria-label={t("logout")}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">{t("logout")}</span>
        </button>
      </div>
    </nav>
  );
}
