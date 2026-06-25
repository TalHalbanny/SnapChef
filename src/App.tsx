import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Navbar } from "./Components/Navbar";
import { RecipeCard } from "./Components/RecipeCard";
import { IngredientsList } from "./Components/IngredientsList";
import { LanguageToggle } from "./Components/LanguageToggle";
import { PhotoPreview } from "./Components/PhotoPreview";
import { StepIndicator } from "./Components/StepIndicator";
import CameraPhoto from "./Components/CameraPhoto";import snapchefLogo from "./assets/snapchef_logo.png";
import { authService } from "./auth_util";
import { analyzeIngredients, searchRecipesFromIngredients } from "./services/ingredientAnalysis";
import { useLanguage } from "./i18n/LanguageContext";
import type { AnalysisResult, Ingredient } from "./types/recipe";

function translateAuthError(message: string, t: ReturnType<typeof useLanguage>["t"]) {
  if (message.includes("already registered")) return t("userExists");
  if (message.includes("Invalid email")) return t("invalidCredentials");
  return message;
}

function App() {
  const { t, language } = useLanguage();
  // registry states.
  const [regUserName, setRegUserName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // login states 
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  // navigation flag states. 
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); 
  const [showFields, setShowFields] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [GetImage, setImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);

  // handle register function
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
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
      const message = err instanceof Error ? err.message : t("unknownError");
      alert(translateAuthError(message, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { user } = await authService.login({
        email: loginEmail,
        password: password
      });
      setCurrentUserName(user.user_metadata.display_name);
      setHasEnteredDashboard(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("unknownError");
      alert(`${t("loginFailed")}: ${translateAuthError(message, t)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await authService.demoLogin();
      setCurrentUserName(t("demoUserName"));
      setHasEnteredDashboard(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setHasEnteredDashboard(false);
    setCurrentUserName("");
    setImage(null);
    setAnalysisResult(null);
    setIngredients([]);
    setShowFields(false);
    setIsRegistering(false);
  };

  //Analyze and get recipe from Gemini Flash API

  const analyzeImageAndGetRecipe = async () => {
    if (!GetImage) {
      alert(t("takePhotoFirst"));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeIngredients(GetImage, language);
      setAnalysisResult(result);
      setIngredients(result.ingredients);
    } catch (err: unknown) {
      console.error("Error analyzing image:", err);
      const message = err instanceof Error ? err.message : t("unknownError");
      alert(`${t("errorAnalyzing")}: ${message}`);
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
      const message = err instanceof Error ? err.message : t("unknownError");
      alert(`${t("errorAnalyzing")}: ${message}`);
    } finally {
      setIsSearchingRecipes(false);
    }
  };

  if (!hasEnteredDashboard) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="absolute top-4 end-4">
          <LanguageToggle />
        </div>
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
            <>
              {!showFields ? (
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-sm text-[var(--snap-text-muted)]">{t("signInPrompt")}</p>
                  <button type="button" onClick={() => setShowFields(true)} className="snap-btn-primary mt-2">
                    {t("signIn")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={isSubmitting}
                    className="snap-btn-secondary"
                  >
                    {isSubmitting ? t("entering") : t("continueAsDemo")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-sm text-[var(--snap-accent-mid)] hover:underline font-medium mt-2 block mx-auto"
                  >
                    {t("noAccountRegister")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block text-sm font-medium text-[var(--snap-text-muted)]">{t("emailAddress")}</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="your@email.com"
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
                      className="snap-input mt-2"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !loginEmail.trim() || !password.trim()}
                    className="snap-btn-primary mt-2"
                  >
                    {isSubmitting ? t("connecting") : t("enterSnapChef")}
                  </button>

                  <div className="flex flex-col gap-2 mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowFields(false)}
                      className="text-xs text-[var(--snap-accent-mid)] underline opacity-70 block mx-auto"
                    >
                      {t("goBack")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegistering(true)}
                      className="text-xs text-[var(--snap-accent-mid)] hover:underline font-medium block mx-auto"
                    >
                      {t("needAccountRegister")}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>      </div>
    );
  }

  const activeStep = analysisResult ? "results" : GetImage ? "analyze" : "capture";

  return (
    <div className="w-full px-4 pb-8 pt-6 sm:px-8">
      <Navbar userName={currentUserName} onLogout={handleLogout} />

      <main className="mx-auto mt-6 w-full max-w-5xl space-y-8">
        <StepIndicator
          activeStep={activeStep}
          hasPhoto={Boolean(GetImage)}
          hasResults={Boolean(analysisResult)}
        />

        <section className="mx-auto flex w-full max-w-lg flex-col gap-4">
          {GetImage ? (
            <PhotoPreview imageUrl={GetImage} onRetake={() => setImage(null)} />
          ) : (
            <CameraPhoto onPhotoTaken={setImage} />
          )}

          <button
            onClick={analyzeImageAndGetRecipe}
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
        </section>

        {!analysisResult && !isAnalyzing && !GetImage && (
          <section className="snap-card-surface mx-auto max-w-lg p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--snap-primary)] text-[var(--snap-accent-mid)]">
              <Sparkles size={22} />
            </div>
            <h2 className="text-lg font-semibold">{t("emptyStateTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--snap-text-muted)]">{t("emptyStateHint")}</p>
          </section>
        )}

        {analysisResult && (
          <section className="grid gap-6 text-start md:grid-cols-2">
            <IngredientsList
              ingredients={ingredients}
              onChange={setIngredients}
              onSearchRecipes={handleSearchRecipes}
              isSearching={isSearchingRecipes}
            />

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{t("recipeIdeas")}</h2>
                <p className="text-sm text-[var(--snap-text-muted)]">
                  {t("dishesYouCanMake", { count: analysisResult.recipes.length })}
                </p>
              </div>

              {analysisResult.recipes.map((recipe, index) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;