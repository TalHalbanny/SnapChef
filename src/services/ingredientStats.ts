import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { COLLECTIONS, getDb, isFirebaseConfigured } from "../firebase";
import { getLocalList, setLocalList } from "./localUserStore";
import type { Ingredient } from "../types/recipe";

export type IngredientUsageRow = {
  id: string;
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
  return message.includes("ingredient_usage");
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
  const now = new Date().toISOString();
  const payload = [...unique.values()];

  if (isFirebaseConfigured()) {
    await Promise.all(
      payload.map((item) =>
        addDoc(collection(getDb(), COLLECTIONS.ingredientUsage), {
          username: user,
          ingredient_name: item.name,
          ingredient_key: item.key,
          used_at: serverTimestamp(),
        }),
      ),
    );
    return;
  }

  const localRows: IngredientUsageRow[] = payload.map((item, index) => ({
    id: String(Date.now() + index),
    username: user,
    ingredient_name: item.name,
    ingredient_key: item.key,
    used_at: now,
  }));
  setLocalList("usage", user, [...localRows, ...getLocalList<IngredientUsageRow>("usage", user)]);
}

export async function fetchIngredientUsage(username: string): Promise<IngredientUsageRow[]> {
  const user = username.trim();

  if (isFirebaseConfigured()) {
    const snap = await getDocs(
      query(collection(getDb(), COLLECTIONS.ingredientUsage), where("username", "==", user)),
    );
    const remote = snap.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        username: String(data.username ?? user),
        ingredient_name: String(data.ingredient_name ?? ""),
        ingredient_key: String(data.ingredient_key ?? ""),
        used_at: toIsoDate(data.used_at),
      };
    });

    const local = getLocalList<IngredientUsageRow>("usage", user);
    const remoteKeys = new Set(remote.map((row) => `${row.ingredient_key}|${row.used_at}`));
    const missing = local.filter((row) => !remoteKeys.has(`${row.ingredient_key}|${row.used_at}`));
    if (missing.length > 0) {
      await Promise.all(
        missing.map((row) =>
          addDoc(collection(getDb(), COLLECTIONS.ingredientUsage), {
            username: user,
            ingredient_name: row.ingredient_name,
            ingredient_key: row.ingredient_key,
            used_at: row.used_at,
          }),
        ),
      );
      return fetchIngredientUsage(user);
    }

    return remote;
  }

  return getLocalList<IngredientUsageRow>("usage", user).map((row) => ({
    ...row,
    id: String(row.id),
  }));
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
