import { Languages } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`snap-btn-secondary !w-auto !py-1.5 !text-xs sm:!text-sm ${className}`}
      aria-label={language === "en" ? t("switchToHebrew") : t("switchToEnglish")}
    >
      <Languages size={16} />
      <span>{language === "en" ? t("switchToHebrew") : t("switchToEnglish")}</span>
    </button>
  );
}
