import { RotateCcw } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

type PhotoPreviewProps = {
  imageUrl: string;
  onRetake: () => void;
};

export function PhotoPreview({ imageUrl, onRetake }: PhotoPreviewProps) {
  const { t } = useLanguage();

  return (
    <div className="snap-card-surface overflow-hidden p-3">
      <img
        src={imageUrl}
        alt=""
        className="aspect-[4/3] w-full rounded-lg object-cover"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--snap-accent-mid)]">{t("photoReady")}</p>
        <button type="button" onClick={onRetake} className="snap-btn-secondary !w-auto shrink-0">
          <RotateCcw size={16} />
          {t("retakePhoto")}
        </button>
      </div>
    </div>
  );
}
