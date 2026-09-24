import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChefHat } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  aggregateIngredientStats,
  fetchIngredientUsage,
  type IngredientStat,
} from "../services/ingredientStats";

type StatisticsPageProps = {
  username: string;
};

function formatDate(value: string, language: "en" | "he") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function IngredientChart({
  stats,
  selectedKey,
  onSelect,
}: {
  stats: IngredientStat[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const maxCount = Math.max(...stats.map((item) => item.count), 1);

  return (
    <div className="flex flex-col gap-3" role="img" aria-label="ingredient comparison chart">
      {stats.map((item) => {
        const selected = item.key === selectedKey;
        const width = `${Math.max(8, (item.count / maxCount) * 100)}%`;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="flex flex-col gap-1 text-start"
          >
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={`font-medium ${selected ? "text-[var(--snap-accent)]" : ""}`}>
                {item.name}
              </span>
              <span className="text-[var(--snap-text-muted)]">{item.count}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--snap-primary)]/50">
              <div
                className={`h-full rounded-full transition-all ${
                  selected ? "bg-[var(--snap-accent)]" : "bg-[var(--snap-accent-mid)]"
                }`}
                style={{ width }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function StatisticsPage({ username }: StatisticsPageProps) {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recordCount, setRecordCount] = useState(0);
  const [stats, setStats] = useState<IngredientStat[]>([]);
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const rows = await fetchIngredientUsage(username);
        if (cancelled) return;
        const nextStats = aggregateIngredientStats(rows);
        setRecordCount(rows.length);
        setStats(nextStats);
        setSelectedKey(nextStats[0]?.key ?? "");
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : t("unknownError");
        setError(message);
        setRecordCount(0);
        setStats([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [username, t]);

  const selected = useMemo(
    () => stats.find((item) => item.key === selectedKey) ?? stats[0],
    [selectedKey, stats],
  );

  const showChart = recordCount > 1;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <header className="text-center sm:text-start">
        <h1 className="text-2xl font-semibold">{t("statistics")}</h1>
        <p className="mt-1 text-sm text-[var(--snap-text-muted)]">{t("statisticsHint")}</p>
      </header>

      {isLoading ? (
        <div className="snap-card-surface p-6 text-center text-sm text-[var(--snap-text-muted)]">
          {t("loadingStatistics")}
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="snap-card-surface space-y-3 p-6">
          <p className="text-sm font-medium text-red-700">{t("statisticsLoadError")}</p>
          <p className="text-sm text-[var(--snap-text-muted)]">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && stats.length === 0 ? (
        <div className="snap-card-surface p-6 text-center">
          <ChefHat className="mx-auto mb-3 text-[var(--snap-accent-mid)]" size={28} />
          <p className="font-medium">{t("noStatisticsYet")}</p>
          <p className="mt-2 text-sm text-[var(--snap-text-muted)]">{t("noStatisticsHint")}</p>
        </div>
      ) : null}

      {!isLoading && !error && selected ? (
        <div className="snap-card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--snap-text-muted)]">
            {t("recentlyUsed")}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
          <p className="mt-2 text-sm text-[var(--snap-text-muted)]">
            {t("recipeRequestCount", { count: selected.count })}
          </p>
          <p className="text-sm text-[var(--snap-text-muted)]">
            {t("lastUsedAt", { date: formatDate(selected.lastUsedAt, language) })}
          </p>
        </div>
      ) : null}

      {!isLoading && !error && stats.length > 0 ? (
        <div className="snap-card-surface p-5">
          <h2 className="mb-4 text-lg font-semibold">{t("recentIngredients")}</h2>
          <ul className="space-y-2">
            {stats.map((item) => {
              const selectedItem = item.key === selectedKey;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(item.key)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start transition ${
                      selectedItem
                        ? "bg-[var(--snap-primary)]"
                        : "hover:bg-[var(--snap-primary)]/50"
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-[var(--snap-text-muted)]">
                      {t("timesUsed", { count: item.count })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {!isLoading && !error && showChart ? (
        <div className="snap-card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[var(--snap-accent-mid)]" />
            <h2 className="text-lg font-semibold">{t("ingredientComparison")}</h2>
          </div>
          <IngredientChart stats={stats} selectedKey={selectedKey} onSelect={setSelectedKey} />
        </div>
      ) : null}

      {!isLoading && !error && recordCount === 1 ? (
        <p className="text-center text-sm text-[var(--snap-text-muted)]">{t("chartNeedsMoreRecords")}</p>
      ) : null}
    </section>
  );
}
