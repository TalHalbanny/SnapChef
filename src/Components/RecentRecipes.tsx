import { ChefHat } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import { useLanguage } from "../i18n/LanguageContext";
import { savedRecipeToOption, type SavedRecipeRow } from "../services/savedRecipes";

type RecentRecipesProps = {
  recipes: SavedRecipeRow[];
};

export function RecentRecipes({ recipes }: RecentRecipesProps) {
  const { t } = useLanguage();

  return (
    <div className="snap-card-surface w-full p-4">
      <h2 className="text-center text-lg font-semibold">{t("recentChosenRecipes")}</h2>
      <p className="mt-1 text-center text-sm text-[var(--snap-text-muted)]">
        {t("recentChosenRecipesHint")}
      </p>

      {recipes.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-2 text-center">
          <ChefHat className="text-[var(--snap-accent-mid)]" size={22} />
          <p className="text-sm text-[var(--snap-text-muted)]">{t("noChosenRecipesYet")}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {recipes.map((row, index) => (
            <RecipeCard
              key={row.id}
              recipe={savedRecipeToOption(row)}
              index={index}
              showOption={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
