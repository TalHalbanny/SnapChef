import { useLanguage } from "../i18n/LanguageContext";

type Step = "capture" | "analyze" | "results";

type StepIndicatorProps = {
  activeStep: Step;
  hasPhoto: boolean;
  hasResults: boolean;
};

export function StepIndicator({ activeStep, hasPhoto, hasResults }: StepIndicatorProps) {
  const { t } = useLanguage();

  const steps = [
    { id: "capture" as const, label: t("stepCapture"), done: hasPhoto },
    { id: "analyze" as const, label: t("stepAnalyze"), done: hasResults },
    { id: "results" as const, label: t("stepResults"), done: hasResults },
  ];

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isDone = step.done;

        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? "bg-[var(--snap-accent-mid)] text-white"
                    : isActive
                      ? "bg-[var(--snap-primary)] text-[var(--snap-text)] ring-2 ring-[var(--snap-accent-mid)]"
                      : "bg-white/60 text-[var(--snap-text-muted)]"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`text-xs font-medium ${
                  isActive || isDone ? "text-[var(--snap-text)]" : "text-[var(--snap-text-muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mb-4 hidden h-0.5 w-8 sm:block ${
                  isDone ? "bg-[var(--snap-accent-mid)]" : "bg-[var(--snap-border)]"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
