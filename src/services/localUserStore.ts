const SAVED_RECIPES_KEY = "snapchef_saved_recipes";
const INGREDIENT_USAGE_KEY = "snapchef_ingredient_usage";

function readStore<T>(key: string): Record<string, T[]> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, T[]>;
  } catch {
    return {};
  }
}

function writeStore<T>(key: string, value: Record<string, T[]>) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function isWriteBlockedError(message: string) {
  return (
    message.includes("row-level security") ||
    message.includes("42501") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  );
}

export function getLocalList<T>(key: "recipes" | "usage", username: string): T[] {
  const storeKey = key === "recipes" ? SAVED_RECIPES_KEY : INGREDIENT_USAGE_KEY;
  return readStore<T>(storeKey)[username.trim()] ?? [];
}

export function setLocalList<T>(key: "recipes" | "usage", username: string, rows: T[]) {
  const storeKey = key === "recipes" ? SAVED_RECIPES_KEY : INGREDIENT_USAGE_KEY;
  const store = readStore<T>(storeKey);
  store[username.trim()] = rows;
  writeStore(storeKey, store);
}
