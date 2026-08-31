import { getSupabase } from "../auth_util";
import { getLocalList, isWriteBlockedError, setLocalList } from "./localUserStore";
import type { Ingredient } from "../types/recipe";

export const INGREDIENT_USAGE_TABLE = "ingredient_usage";

export const INGREDIENT_USAGE_SETUP_SQL = `create table if not exists public.ingredient_usage (
  id bigint generated always as identity primary key,
  username text not null,
  ingredient_name text not null,
  ingredient_key text not null,
  used_at timestamptz not null default now()
);

create index if not exists ingredient_usage_username_used_at_idx
  on public.ingredient_usage (username, used_at desc);

alter table public.ingredient_usage disable row level security;`;

export type IngredientUsageRow = {
  id: number;
  username: string;
  ingredient_name: string;
  ingredient_key: string;
  used_at: string;
};

export type IngredientStat = {
  key: string;
  name: string;
  count: number;
  lastUsedAt: string;
};

export function normalizeIngredientKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isMissingUsageTableError(message: string) {
  return (
    message.includes("ingredient_usage") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find the table"))
  );
}

export async function logIngredientUsage(username: string, ingredients: Ingredient[]) {
  const user = username.trim();
  const rows = ingredients
    .map((item) => ({
      name: item.name.trim(),
      key: normalizeIngredientKey(item.name),
    }))
    .filter((item) => item.key);

  if (!user || rows.length === 0) return;

  const unique = new Map(rows.map((item) => [item.key, item]));
  const payload = [...unique.values()].map((item) => ({
    username: user,
    ingredient_name: item.name,
    ingredient_key: item.key,
  }));

  try {
    const { error } = await getSupabase().from(INGREDIENT_USAGE_TABLE).insert(payload);
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isWriteBlockedError(message) && message !== "Missing Supabase configuration") {
      throw error instanceof Error ? error : new Error(message);
    }

    const now = new Date().toISOString();
    const localRows: IngredientUsageRow[] = payload.map((item, index) => ({
      id: Date.now() + index,
      username: user,
      ingredient_name: item.ingredient_name,
      ingredient_key: item.ingredient_key,
      used_at: now,
    }));
    setLocalList("usage", user, [...localRows, ...getLocalList<IngredientUsageRow>("usage", user)]);
  }
}

export async function fetchIngredientUsage(username: string): Promise<IngredientUsageRow[]> {
  const user = username.trim();

  try {
    const { data, error } = await getSupabase()
      .from(INGREDIENT_USAGE_TABLE)
      .select("id, username, ingredient_name, ingredient_key, used_at")
      .eq("username", user)
      .order("used_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isWriteBlockedError(message) && message !== "Missing Supabase configuration") {
      throw error instanceof Error ? error : new Error(message);
    }
  }

  return getLocalList<IngredientUsageRow>("usage", user);
}

export function aggregateIngredientStats(rows: IngredientUsageRow[]): IngredientStat[] {
  const grouped = new Map<string, IngredientStat>();

  for (const row of rows) {
    const current = grouped.get(row.ingredient_key);
    if (!current) {
      grouped.set(row.ingredient_key, {
        key: row.ingredient_key,
        name: row.ingredient_name,
        count: 1,
        lastUsedAt: row.used_at,
      });
      continue;
    }

    current.count += 1;
    if (row.used_at > current.lastUsedAt) {
      current.lastUsedAt = row.used_at;
      current.name = row.ingredient_name;
    }
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.lastUsedAt === b.lastUsedAt) return b.count - a.count;
    return a.lastUsedAt > b.lastUsedAt ? -1 : 1;
  });
}
