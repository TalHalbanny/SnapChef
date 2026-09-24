import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getRemoteUser } from "../auth_util";
import { COLLECTIONS, getDb, isFirebaseConfigured } from "../firebase";
import { getLocalList, setLocalList } from "./localUserStore";
import type { RecipeOption } from "../types/recipe";

export const MAX_SAVED_RECIPES = 3;

export type SavedRecipeRow = {
  id: string;
  username: string;
  recipe_title: string;
  recipe_description: string;
  prep_time: string;
  servings: number;
  steps: string[];
  nutrition: RecipeOption["nutrition"];
  chosen_at: string;
};

function emptyNutrition(): RecipeOption["nutrition"] {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
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

function parseSteps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((step): step is string => typeof step === "string");
  }
  return [];
}

function toIsoDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date().toISOString();
}

function mapRecipeDoc(id: string, data: Record<string, unknown>, fallbackUsername: string): SavedRecipeRow {
  return {
    id,
    username: String(data.chefUsername ?? fallbackUsername),
    recipe_title: String(data.title ?? ""),
    recipe_description: String(data.description ?? ""),
    prep_time: String(data.prepTime ?? ""),
    servings: Number(data.servings) || 1,
    steps: parseSteps(data.steps),
    nutrition: parseNutrition(data.nutrition) || emptyNutrition(),
    chosen_at: toIsoDate(data.createdAt),
  };
}

export function isMissingSavedRecipesTableError(message: string) {
  return message.includes("recipes") && (message.includes("permission") || message.includes("not found"));
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

function saveRecipeLocally(user: string, recipe: RecipeOption): SavedRecipeRow[] {
  const row: SavedRecipeRow = {
    id: String(Date.now()),
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

async function uploadRecipe(user: string, recipe: RecipeOption, chosenAt?: string) {
  const chef = await getRemoteUser(user);
  if (!chef) {
    throw new Error("User not found in Firebase");
  }

  await addDoc(collection(getDb(), COLLECTIONS.recipes), {
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTime,
    servings: recipe.servings,
    steps: recipe.steps,
    nutrition: recipe.nutrition,
    imageUrl: null,
    chefId: chef.id,
    chefUsername: chef.username,
    createdAt: chosenAt ? new Date(chosenAt) : serverTimestamp(),
  });
}

async function syncLocalRecipesToFirestore(user: string, existing: SavedRecipeRow[]) {
  const local = getLocalList<SavedRecipeRow>("recipes", user).map((row) => ({
    ...row,
    id: String(row.id),
  }));
  if (local.length === 0) {
    return existing;
  }

  const remoteTitles = new Set(existing.map((row) => `${row.recipe_title}|${row.chosen_at}`));
  const missing = local.filter((row) => !remoteTitles.has(`${row.recipe_title}|${row.chosen_at}`));
  for (const row of missing) {
    await uploadRecipe(user, savedRecipeToOption(row), row.chosen_at);
  }

  const next = missing.length > 0 ? await fetchRemoteRecipes(user) : existing;
  await Promise.all(
    next.slice(MAX_SAVED_RECIPES).map((row) => deleteDoc(doc(getDb(), COLLECTIONS.recipes, row.id))),
  );
  return next.slice(0, MAX_SAVED_RECIPES);
}

async function fetchRemoteRecipes(user: string): Promise<SavedRecipeRow[]> {
  const snap = await getDocs(
    query(collection(getDb(), COLLECTIONS.recipes), where("chefUsername", "==", user)),
  );
  return snap.docs
    .map((item) => mapRecipeDoc(item.id, item.data(), user))
    .sort((a, b) => (a.chosen_at < b.chosen_at ? 1 : -1));
}

export async function fetchRecentSavedRecipes(username: string): Promise<SavedRecipeRow[]> {
  const user = username.trim();

  if (isFirebaseConfigured()) {
    try {
      const remote = await fetchRemoteRecipes(user);
      return await syncLocalRecipesToFirestore(user, remote);
    } catch (error) {
      console.error("Error loading recipes from Firestore:", error);
    }
  }

  return getLocalList<SavedRecipeRow>("recipes", user)
    .map((row) => ({ ...row, id: String(row.id) }))
    .slice(0, MAX_SAVED_RECIPES);
}

export async function saveChosenRecipe(username: string, recipe: RecipeOption): Promise<SavedRecipeRow[]> {
  const user = username.trim();
  if (!user) {
    throw new Error("Missing username");
  }

  if (isFirebaseConfigured()) {
    await uploadRecipe(user, recipe);

    const saved = await fetchRemoteRecipes(user);
    await Promise.all(
      saved.slice(MAX_SAVED_RECIPES).map((row) => deleteDoc(doc(getDb(), COLLECTIONS.recipes, row.id))),
    );
    return saved.slice(0, MAX_SAVED_RECIPES);
  }

  return saveRecipeLocally(user, recipe);
}
