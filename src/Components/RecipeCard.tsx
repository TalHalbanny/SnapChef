import { useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { RecipeOption } from "../types/recipe";
import { useLanguage } from "../i18n/LanguageContext";

type RecipeCardProps = {
  recipe: RecipeOption;
  index: number;
  onChoose?: (recipe: RecipeOption) => void;
  isChoosing?: boolean;
  showChoose?: boolean;
  showOption?: boolean;
};

function NutritionRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg bg-[var(--snap-bg)] px-3 py-2 text-center">
      <p className="text-xs text-[var(--snap-text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--snap-text)]">
        {value}
        {unit}
      </p>
    </div>
  );
}

export function RecipeCard({
  recipe,
  index,
  onChoose,
  isChoosing = false,
  showChoose = false,
  showOption = true,
}: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  const servingLabel = recipe.servings > 1 ? t("servings") : t("serving");

  return (
    <article className="snap-card-surface overflow-hidden text-start">
      <div className="border-b border-[var(--snap-border)] bg-[var(--snap-primary)]/40 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            {showOption ? (
              <span className="snap-chip">
                {t("option")} {index + 1}
              </span>
            ) : null}
            <h3 className={`${showOption ? "mt-2" : ""} text-lg font-semibold text-[var(--snap-text)]`}>
              {recipe.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--snap-text-muted)]">{recipe.description}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[var(--snap-text-muted)]">
            <Clock size={12} />
            {recipe.prepTime}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <NutritionRow label={t("calories")} value={recipe.nutrition.calories} unit="" />
          <NutritionRow label={t("protein")} value={recipe.nutrition.protein} unit="g" />
          <NutritionRow label={t("carbs")} value={recipe.nutrition.carbs} unit="g" />
          <NutritionRow label={t("fat")} value={recipe.nutrition.fat} unit="g" />
          <NutritionRow label={t("fiber")} value={recipe.nutrition.fiber} unit="g" />
        </div>

        <p className="mt-3 text-xs text-[var(--snap-text-muted)]">
          {t("perServing")} · {recipe.servings} {servingLabel}
        </p>

        {showChoose ? (
          <button
            type="button"
            onClick={() => onChoose?.(recipe)}
            disabled={isChoosing}
            className="snap-btn-primary mt-4"
          >
            {isChoosing ? t("savingRecipe") : t("chooseRecipe")}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--snap-primary)] px-4 py-2.5 text-sm font-medium text-[var(--snap-text)] transition hover:brightness-95"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              {t("hideRecipe")}
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              {t("viewRecipeSteps")}
            </>
          )}
        </button>

        {expanded && (
          <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm text-[var(--snap-text)]">
            {recipe.steps.map((step, stepIndex) => (
              <li key={stepIndex}>{step}</li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
