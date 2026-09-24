import { useEffect, useState } from "react";
import { BarChart3, LogOut, Sparkles, ArrowLeft } from "lucide-react";
import { Navbar } from "./Components/Navbar";
import { RecipeCard } from "./Components/RecipeCard";
import { IngredientsList } from "./Components/IngredientsList";
import { PhotoPreview } from "./Components/PhotoPreview";
import { StepIndicator } from "./Components/StepIndicator";
import { StatisticsPage } from "./Components/StatisticsPage";
import { RecentRecipes } from "./Components/RecentRecipes";
import CameraPhoto from "./Components/CameraPhoto";
import snapchefLogo from "./assets/snapchef_logo.png";
import { authService } from "./auth_util";
import {
  analyzeIngredients,
  isGeminiQuotaError,
  isGeminiUnavailableError,
  searchRecipesFromIngredients,
} from "./services/ingredientAnalysis";
import { logIngredientUsage } from "./services/ingredientStats";
import {
  fetchRecentSavedRecipes,
  isMissingSavedRecipesTableError,
  saveChosenRecipe,
  type SavedRecipeRow,
} from "./services/savedRecipes";
import { useLanguage } from "./i18n/LanguageContext";
import type { AnalysisResult, Ingredient, RecipeOption } from "./types/recipe";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function translateAuthError(message: string, t: ReturnType<typeof useLanguage>["t"]) {
  if (message.includes("already registered")) return t("userExists");
  if (message.includes("Invalid email") || message.includes("Invalid username")) {
    return t("invalidCredentials");
  }
  if (message.includes("Missing Firebase") || message.includes("Missing Supabase")) {
    return t("missingFirebaseConfig");
  }
  if (
    message.includes("row-level security") ||
    message.includes("42501") ||
    message.includes("permission-denied") ||
    message.includes("Missing or insufficient permissions")
  ) {
    return t("rlsBlocked");
  }
  if (/failed to fetch|networkerror|load failed|err_name_not_resolved/i.test(message)) {
    return t("firebaseUnreachable");
  }
  return message;
}

function App() {
  const { t, language } = useLanguage();
  // registry states.
  const [regUserName, setRegUserName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // login states 
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");

  // navigation flag states. 
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentPage, setCurrentPage] = useState<"home" | "stats">("home");
  const [isRegistering, setIsRegistering] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const [GetImage, setImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState<SavedRecipeRow[]>([]);
  const [choosingRecipeId, setChoosingRecipeId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    if (hasEnteredDashboard) return;

    authService.ensureAdminUser().catch((err: unknown) => {
      const message = getErrorMessage(err, t("unknownError"));
      setAuthError(translateAuthError(message, t));
    });
  }, [hasEnteredDashboard, t]);

  useEffect(() => {
    if (!hasEnteredDashboard || !currentUserName) return;

    fetchRecentSavedRecipes(currentUserName).then(setRecentRecipes).catch((err: unknown) => {
      console.error("Error loading saved recipes:", err);
    });
  }, [hasEnteredDashboard, currentUserName]);

  // handle register function
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setAuthError("");
    try {
      await authService.register({
        userName: regUserName,
        email: regEmail,
        password: regPassword
      });
      alert(t("accountCreated"));
      setIsRegistering(false);
      setRegUserName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err: unknown) {
      const message = getErrorMessage(err, t("unknownError"));
      setAuthError(translateAuthError(message, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setAuthError("");
    try {
      const { user } = await authService.login({
        username: loginUsername,
        password: password
      });
      setCurrentUserName(user.user_metadata.display_name);
      setCurrentPage("home");
      setHasEnteredDashboard(true);
    } catch (err: unknown) {
      const message = getErrorMessage(err, t("unknownError"));
      setAuthError(`${t("loginFailed")}: ${translateAuthError(message, t)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setHasEnteredDashboard(false);
    setCurrentUserName("");
    setCurrentPage("home");
    setImage(null);
    setAnalysisResult(null);
    setIngredients([]);
    setRecentRecipes([]);
    setIsRegistering(false);
  };

  const getAnalysisErrorMessage = (err: unknown) => {
    if (isGeminiQuotaError(err)) {
      return t("quotaExceeded");
    }
    if (isGeminiUnavailableError(err)) {
      return t("geminiUnavailable");
    }
    return err instanceof Error ? err.message : t("unknownError");
  };

  const handleChooseRecipe = async (recipe: RecipeOption) => {
    if (choosingRecipeId) return;

    const usedIngredients = ingredients.filter((item) => item.name.trim());
    setChoosingRecipeId(recipe.id);
    try {
      const saved = await saveChosenRecipe(currentUserName, recipe);
      setRecentRecipes(saved);
      setAnalysisResult((prev) => (prev ? { ...prev, recipes: [] } : prev));

      try {
        await logIngredientUsage(currentUserName, usedIngredients);
      } catch (usageError: unknown) {
        console.error("Error saving ingredient usage:", usageError);
        const message = getErrorMessage(usageError, t("unknownError"));
        alert(`${t("usageSaveError")}: ${translateAuthError(message, t)}`);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, t("unknownError"));
      if (isMissingSavedRecipesTableError(message)) {
        alert(`${t("recipeSaveError")}\n\n${message}`);
      } else {
        alert(`${t("recipeSaveError")}: ${translateAuthError(message, t)}`);
      }
    } finally {
      setChoosingRecipeId(null);
    }
  };

  const analyzeImageAndGetRecipe = async () => {
    if (!GetImage) {
      alert(t("takePhotoFirst"));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError("");

    try {
      const result = await analyzeIngredients(GetImage, language);
      setAnalysisResult(result);
      setIngredients(result.ingredients);
    } catch (err: unknown) {
      console.error("Error analyzing image:", err);
      const message = getAnalysisErrorMessage(err);
      setAnalysisError(`${t("errorAnalyzing")}: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearchRecipes = async () => {
    const validIngredients = ingredients.filter((item) => item.name.trim());

    if (validIngredients.length === 0) {
      alert(t("noIngredients"));
      return;
    }

    setIsSearchingRecipes(true);

    try {
      const recipes = await searchRecipesFromIngredients(validIngredients, language);
      setAnalysisResult({ ingredients: validIngredients, recipes });
    } catch (err: unknown) {
      console.error("Error searching recipes:", err);
      alert(`${t("errorAnalyzing")}: ${getAnalysisErrorMessage(err)}`);
    } finally {
      setIsSearchingRecipes(false);
    }
  };

  if (!hasEnteredDashboard) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <section className="snap-card flex w-full max-w-md flex-col p-6">
          <img
            src={snapchefLogo}
            alt="SnapChef"
            className="mx-auto mb-4 h-auto w-28 shrink-0 object-contain sm:w-36"
          />
          {/* Register Stage */}
          {isRegistering ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-center text-[var(--snap-text)]">{t("createAccount")}</h2>
                <p className="text-sm text-[var(--snap-text-muted)] text-center">{t("joinCommunity")}</p>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder={t("chooseUsername")}
                    value={regUserName}
                    onChange={(e) => setRegUserName(e.target.value)}
                    className="snap-input"
                    required
                  />
                  <input
                    type="email"
                    placeholder={t("emailAddress")}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="snap-input"
                    required
                  />
                  <input
                    type="password"
                    placeholder={t("choosePassword")}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="snap-input"
                    required
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="snap-btn-primary mt-2">
                  {isSubmitting ? t("creatingAccount") : t("signUp")}
                </button>

                {authError ? (
                  <p className="text-center text-sm font-medium text-red-700">{authError}</p>
                ) : null}

                <button
                  type="button"
                  onClick={() => { if (!isSubmitting) setIsRegistering(false); }}
                  className="text-xs text-[var(--snap-accent-mid)] underline mt-2 mx-auto block"
                >
                  {t("backToLogin")}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-in fade-in duration-300">
              <p className="text-sm text-[var(--snap-text-muted)] text-center">{t("signInPrompt")}</p>

              <div>
                <label className="block text-sm font-medium text-[var(--snap-text-muted)]">{t("username")}</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={t("username")}
                  autoComplete="username"
                  className="snap-input mt-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--snap-text-muted)]">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("password")}
                  autoComplete="current-password"
                  className="snap-input mt-2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !loginUsername.trim() || !password.trim()}
                className="snap-btn-primary mt-2"
              >
                {isSubmitting ? t("connecting") : t("signIn")}
              </button>

              {authError ? (
                <p className="text-center text-sm font-medium text-red-700">{authError}</p>
              ) : null}

              <button
                type="button"
                onClick={() => { if (!isSubmitting) setIsRegistering(true); }}
                className="text-sm text-[var(--snap-accent-mid)] hover:underline font-medium mt-2 block mx-auto"
              >
                {t("noAccountRegister")}
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  const activeStep = analysisResult ? "results" : GetImage ? "analyze" : "capture";

  return (
    <div className="w-full px-4 pb-8 pt-6 sm:px-8">
      <Navbar
        userName={currentUserName}
        onNavigateHome={() => setCurrentPage("home")}
      />

      <div className="mx-auto mt-3 flex w-full max-w-5xl items-center">
        {currentPage === "stats" ? (
          <button
            type="button"
            onClick={() => setCurrentPage("home")}
            className="snap-btn-secondary !w-auto !px-3 !py-1.5 !text-sm"
            aria-label={t("goBack")}
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            {t("goBack")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentPage("stats")}
            className="snap-btn-secondary !w-auto !px-3 !py-1.5 !text-sm"
            aria-label={t("statistics")}
          >
            <BarChart3 size={16} />
            {t("statistics")}
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="ms-auto snap-btn-secondary !w-auto !px-3 !py-1.5 !text-sm"
          aria-label={t("logout")}
        >
          <LogOut size={16} />
          {t("logout")}
        </button>
      </div>

      <main className="mx-auto mt-6 w-full max-w-5xl space-y-8">
        {currentPage === "stats" ? (
          <StatisticsPage username={currentUserName} />
        ) : (
          <>
        <StepIndicator
          activeStep={activeStep}
          hasPhoto={Boolean(GetImage)}
          hasResults={Boolean(analysisResult)}
        />

        <section className="mx-auto flex w-full max-w-lg flex-col gap-4">
          {!analysisResult && !isAnalyzing && !GetImage && (
            <div className="snap-card-surface p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--snap-primary)] text-[var(--snap-accent-mid)]">
                <Sparkles size={22} />
              </div>
              <h2 className="text-lg font-semibold">{t("emptyStateTitle")}</h2>
              <p className="mt-2 text-sm text-[var(--snap-text-muted)]">{t("emptyStateHint")}</p>
            </div>
          )}

          {GetImage ? (
            <PhotoPreview imageUrl={GetImage} onRetake={() => setImage(null)} />
          ) : (
            <CameraPhoto onPhotoTaken={setImage} />
          )}

          <button
            type="button"
            onClick={() => void analyzeImageAndGetRecipe()}
            disabled={isAnalyzing || !GetImage}
            className="snap-btn-primary py-3.5 text-base"
          >
            {isAnalyzing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("identifyingIngredients")}
              </>
            ) : (
              t("analyzeIngredients")
            )}
          </button>

          {analysisError ? (
            <p className="text-center text-sm font-medium text-red-700">{analysisError}</p>
          ) : null}
        </section>

        {analysisResult && (
          <section className="grid gap-6 text-start md:grid-cols-2">
            <IngredientsList
              ingredients={ingredients}
              onChange={setIngredients}
              onSearchRecipes={handleSearchRecipes}
              isSearching={isSearchingRecipes}
            />

            {analysisResult.recipes.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("recipeIdeas")}</h2>
                  <p className="text-sm text-[var(--snap-text-muted)]">
                    {t("dishesYouCanMake", { count: analysisResult.recipes.length })}
                  </p>
                </div>

                {analysisResult.recipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    showChoose
                    onChoose={handleChooseRecipe}
                    isChoosing={choosingRecipeId === recipe.id}
                  />
                ))}
              </div>
            ) : (
              <div className="snap-card-surface p-5 text-center">
                <h2 className="text-lg font-semibold">{t("recipeSaved")}</h2>
                <p className="mt-2 text-sm text-[var(--snap-text-muted)]">{t("recipeMovedToRecent")}</p>
              </div>
            )}
          </section>
        )}

        <RecentRecipes recipes={recentRecipes} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;