import { Minus, Plus, Trash2 } from "lucide-react";
import type { Ingredient } from "../types/recipe";
import { useLanguage } from "../i18n/LanguageContext";

type IngredientsListProps = {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
  onSearchRecipes: () => void;
  isSearching: boolean;
};

function parseQuantity(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (match) {
    return { amount: parseFloat(match[1]), suffix: match[2] };
  }
  return { amount: 0, suffix: trimmed };
}

function formatQuantity(amount: number, suffix: string) {
  const displayAmount = Number.isInteger(amount) ? amount : amount;
  if (displayAmount <= 0 && !suffix) return "";
  if (suffix) return `${displayAmount} ${suffix}`.trim();
  return String(displayAmount);
}

function adjustQuantity(value: string, delta: number) {
  const { amount, suffix } = parseQuantity(value);
  const next = Math.max(0, amount + delta);

  if (next === 0 && !suffix) return delta > 0 ? "1" : "";
  if (amount === 0 && !suffix && delta > 0) return "1";

  return formatQuantity(next, suffix);
}

export function IngredientsList({
  ingredients,
  onChange,
  onSearchRecipes,
  isSearching,
}: IngredientsListProps) {
  const { t } = useLanguage();

  const updateIngredient = (id: string, field: "name" | "quantity", value: string) => {
    onChange(
      ingredients.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const stepQuantity = (id: string, delta: number) => {
    const item = ingredients.find((ing) => ing.id === id);
    if (!item) return;
    updateIngredient(id, "quantity", adjustQuantity(item.quantity, delta));
  };

  const removeIngredient = (id: string) => {
    onChange(ingredients.filter((item) => item.id !== id));
  };

  const addIngredient = () => {
    onChange([
      ...ingredients,
      {
        id: `${Date.now()}-new`,
        name: "",
        quantity: "1",
      },
    ]);
  };

  return (
    <section className="snap-card p-5 text-start">
      <h2 className="text-lg font-semibold text-[var(--snap-text)]">{t("detectedIngredients")}</h2>
      <p className="mt-1 text-sm text-[var(--snap-text-muted)]">
        {t("itemsIdentified", { count: ingredients.length })}
      </p>
      <p className="mt-1 text-xs text-[var(--snap-text-muted)]/80">{t("editIngredientsHint")}</p>

      <ul className="mt-4 space-y-2">
        {ingredients.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2"
          >
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateIngredient(item.id, "name", e.target.value)}
              placeholder={t("ingredientName")}
              className="snap-input min-w-0 flex-1"
            />

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => stepQuantity(item.id, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--snap-border)] bg-white text-[var(--snap-text)] transition hover:bg-[var(--snap-bg)]"
                aria-label={t("decreaseQuantity")}
              >
                <Minus size={16} />
              </button>
              <input
                type="text"
                value={item.quantity}
                onChange={(e) => updateIngredient(item.id, "quantity", e.target.value)}
                placeholder={t("ingredientQuantity")}
                className="snap-input w-20 text-center sm:w-24"
              />
              <button
                type="button"
                onClick={() => stepQuantity(item.id, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--snap-border)] bg-white text-[var(--snap-text)] transition hover:bg-[var(--snap-bg)]"
                aria-label={t("increaseQuantity")}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeIngredient(item.id)}
              className="shrink-0 rounded-lg p-2 text-red-700 transition hover:bg-red-50"
              aria-label={t("removeIngredient")}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addIngredient}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--snap-accent)]/30 bg-white/50 px-4 py-2 text-sm font-medium text-[var(--snap-text)] transition hover:bg-white/80"
      >
        <Plus size={16} />
        {t("addIngredient")}
      </button>

      <button
        type="button"
        onClick={onSearchRecipes}
        disabled={isSearching}
        className="snap-btn-primary mt-3"
      >
        {isSearching ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t("searchingRecipes")}
          </>
        ) : (
          t("searchRecipesAgain")
        )}
      </button>
    </section>
  );
}
