import { getSupabase } from "../auth_util";
import { getLocalList, isWriteBlockedError, setLocalList } from "./localUserStore";
import type { RecipeOption } from "../types/recipe";

export const SAVED_RECIPES_TABLE = "saved_recipes";
export const MAX_SAVED_RECIPES = 3;

export const SAVED_RECIPES_SETUP_SQL = `create table if not exists public.saved_recipes (
  id bigint generated always as identity primary key,
  username text not null,
  recipe_title text not null,
  recipe_description text not null default '',
  prep_time text not null default '',
  servings int not null default 1,
  steps jsonb not null default '[]'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  chosen_at timestamptz not null default now()
);

create index if not exists saved_recipes_username_chosen_at_idx
  on public.saved_recipes (username, chosen_at desc);

alter table public.saved_recipes disable row level security;`;

export type SavedRecipeRow = {
  id: number;
  username: string;
  recipe_title: string;
  recipe_description: string;
  prep_time: string;
  servings: number;
  steps: string[];
  nutrition: RecipeOption["nutrition"];
  chosen_at: string;
};

export function isMissingSavedRecipesTableError(message: string) {
  return (
    message.includes("saved_recipes") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find the table"))
  );
}

function parseSteps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((step): step is string => typeof step === "string");
  }
  return [];
}

function parseNutrition(value: unknown): RecipeOption["nutrition"] {
  const nutrition = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    calories: Number(nutrition.calories) || 0,
    protein: Number(nutrition.protein) || 0,
    carbs: Number(nutrition.carbs) || 0,
    fat: Number(nutrition.fat) || 0,
    fiber: Number(nutrition.fiber) || 0,
  };
}

function mapRow(row: Record<string, unknown>): SavedRecipeRow {
  return {
    id: Number(row.id),
    username: String(row.username ?? ""),
    recipe_title: String(row.recipe_title ?? ""),
    recipe_description: String(row.recipe_description ?? ""),
    prep_time: String(row.prep_time ?? ""),
    servings: Number(row.servings) || 1,
    steps: parseSteps(row.steps),
    nutrition: parseNutrition(row.nutrition),
    chosen_at: String(row.chosen_at ?? ""),
  };
}

export function savedRecipeToOption(row: SavedRecipeRow): RecipeOption {
  return {
    id: String(row.id),
    title: row.recipe_title,
    description: row.recipe_description,
    prepTime: row.prep_time,
    servings: row.servings,
    steps: row.steps,
    nutrition: row.nutrition,
  };
}

export async function fetchRecentSavedRecipes(username: string): Promise<SavedRecipeRow[]> {
  const user = username.trim();

  try {
    const { data, error } = await getSupabase()
      .from(SAVED_RECIPES_TABLE)
      .select("*")
      .eq("username", user)
      .order("chosen_at", { ascending: false })
      .limit(MAX_SAVED_RECIPES);

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isWriteBlockedError(message) && message !== "Missing Supabase configuration") {
      throw error instanceof Error ? error : new Error(message);
    }
  }

  return getLocalList<SavedRecipeRow>("recipes", user).slice(0, MAX_SAVED_RECIPES);
}

function saveRecipeLocally(user: string, recipe: RecipeOption): SavedRecipeRow[] {
  const row: SavedRecipeRow = {
    id: Date.now(),
    username: user,
    recipe_title: recipe.title,
    recipe_description: recipe.description,
    prep_time: recipe.prepTime,
    servings: recipe.servings,
    steps: recipe.steps,
    nutrition: recipe.nutrition,
    chosen_at: new Date().toISOString(),
  };

  const next = [row, ...getLocalList<SavedRecipeRow>("recipes", user)].slice(0, MAX_SAVED_RECIPES);
  setLocalList("recipes", user, next);
  return next;
}

export async function saveChosenRecipe(username: string, recipe: RecipeOption): Promise<SavedRecipeRow[]> {
  const user = username.trim();
  if (!user) {
    throw new Error("Missing username");
  }

  try {
    const supabase = getSupabase();
    const { error: insertError } = await supabase.from(SAVED_RECIPES_TABLE).insert({
      username: user,
      recipe_title: recipe.title,
      recipe_description: recipe.description,
      prep_time: recipe.prepTime,
      servings: recipe.servings,
      steps: recipe.steps,
      nutrition: recipe.nutrition,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    const { data: allRows, error: listError } = await supabase
      .from(SAVED_RECIPES_TABLE)
      .select("id")
      .eq("username", user)
      .order("chosen_at", { ascending: false });

    if (listError) {
      throw new Error(listError.message);
    }

    const extraIds = (allRows ?? []).slice(MAX_SAVED_RECIPES).map((row) => row.id);
    if (extraIds.length > 0) {
      const { error: deleteError } = await supabase
        .from(SAVED_RECIPES_TABLE)
        .delete()
        .in("id", extraIds);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    return fetchRecentSavedRecipes(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isWriteBlockedError(message) && message !== "Missing Supabase configuration") {
      throw error instanceof Error ? error : new Error(message);
    }
    return saveRecipeLocally(user, recipe);
  }
}
