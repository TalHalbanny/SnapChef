import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { Language } from "../i18n/translations";
import type { AnalysisResult, RecipeOption, Ingredient } from "../types/recipe";

const DEFAULT_MODEL = "gemini-2.5-flash";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
] as const;

function getApiKey() {
  return import.meta.env.VITE_GEMINI_FLASH_3_KEY?.trim() || "";
}

function getModelName() {
  return import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getModelsToTry() {
  const preferred = getModelName();
  const ordered = [preferred, ...FALLBACK_MODELS.filter((model) => model !== preferred)];
  return [...new Set(ordered)];
}

function createModel(modelName: string) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}

function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|quota|RESOURCE_EXHAUSTED/i.test(message);
}

export function isGeminiQuotaError(error: unknown) {
  return isQuotaError(error);
}

async function generateContentWithFallback(content: string | Part[]) {
  const models = getModelsToTry();
  let lastError: unknown;

  for (const modelName of models) {
    const model = createModel(modelName);
    if (!model) return null;

    try {
      return await model.generateContent(content);
    } catch (error) {
      lastError = error;
      if (!isQuotaError(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}

function getImageMimeType(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/jpeg";
}

function buildAnalysisPrompt(language: Language): string {
  const languageInstruction =
    language === "he"
      ? "Write all text fields (ingredient names, quantities, recipe titles, descriptions, prepTime, steps) in Hebrew."
      : "Write all text fields in English.";

  return `Analyze the food ingredients visible in this image.

Return JSON with this exact structure:
{
  "ingredients": [
    { "name": "ingredient name", "quantity": "estimated amount with unit" }
  ],
  "recipes": [
    {
      "title": "recipe name",
      "description": "one sentence summary",
      "prepTime": "e.g. 25 min",
      "servings": 2,
      "steps": ["step 1", "step 2", "step 3"],
      "nutrition": {
        "calories": 320,
        "protein": 18,
        "carbs": 24,
        "fat": 12,
        "fiber": 5
      }
    }
  ]
}

Rules:
- ${languageInstruction}
- List every ingredient you can identify with a realistic quantity estimate.
- Suggest exactly 3 different recipes that use the detected ingredients.
- Nutrition values are per serving (numbers only, no units in values).
- If an ingredient quantity is unclear, give your best estimate.`;
}

function buildRecipesFromIngredientsPrompt(ingredients: Ingredient[], language: Language): string {
  const languageInstruction =
    language === "he"
      ? "Write all recipe text fields in Hebrew."
      : "Write all recipe text fields in English.";

  const ingredientList = ingredients
    .map((item) => `- ${item.name}: ${item.quantity || "?"}`)
    .join("\n");

  return `Given these ingredients and quantities:
${ingredientList}

Suggest exactly 3 different recipes using these ingredients with the listed amounts.

Return JSON with this exact structure:
{
  "recipes": [
    {
      "title": "recipe name",
      "description": "one sentence summary",
      "prepTime": "e.g. 25 min",
      "servings": 2,
      "steps": ["step 1", "step 2", "step 3"],
      "nutrition": {
        "calories": 320,
        "protein": 18,
        "carbs": 24,
        "fat": 12,
        "fiber": 5
      }
    }
  ]
}

Rules:
- ${languageInstruction}
- Base recipes on the exact ingredients and quantities provided.
- Nutrition values are per serving (numbers only, no units in values).`;
}

function parseJsonResponse<T>(text: string): T {
  const cleanJsonText = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJsonText) as T;
}

function parseRecipesResponse(text: string): Omit<RecipeOption, "id">[] {
  const parsed = parseJsonResponse<{ recipes: Omit<RecipeOption, "id">[] }>(text);
  if (!Array.isArray(parsed.recipes)) {
    throw new Error("Invalid recipes response from Gemini");
  }
  return parsed.recipes;
}

function addRecipeIds(recipes: Omit<RecipeOption, "id">[]): RecipeOption[] {
  return recipes.map((recipe, index) => ({
    ...recipe,
    id: `${Date.now()}-recipe-${index}`,
  }));
}

function parseAnalysisResponse(text: string): Omit<AnalysisResult, "recipes"> & { recipes: Omit<RecipeOption, "id">[] } {
  const parsed = parseJsonResponse<Omit<AnalysisResult, "recipes"> & { recipes: Omit<RecipeOption, "id">[] }>(text);
  if (!Array.isArray(parsed.ingredients) || !Array.isArray(parsed.recipes)) {
    throw new Error("Invalid analysis response from Gemini");
  }
  return parsed;
}

function withIngredientIds(ingredients: Omit<Ingredient, "id">[]): Ingredient[] {
  return ingredients.map((ingredient, index) => ({
    ...ingredient,
    id: `${Date.now()}-ing-${index}`,
  }));
}

function withRecipeIds(data: Omit<AnalysisResult, "recipes"> & { recipes: Omit<RecipeOption, "id">[] }): AnalysisResult {
  return {
    ingredients: withIngredientIds(data.ingredients),
    recipes: data.recipes.map((recipe, index) => ({
      ...recipe,
      id: `${Date.now()}-${index}`,
    })),
  };
}

export function getMockAnalysis(language: Language): AnalysisResult {
  if (language === "he") {
    return {
      ingredients: withIngredientIds([
        { name: "עגבניות", quantity: "3 בינוניות" },
        { name: "ביצים", quantity: "4 גדולות" },
        { name: "בצל", quantity: "1 בינוני" },
        { name: "שמן זית", quantity: "2 כפות" },
        { name: "שום", quantity: "2 שיניים" },
      ]),
      recipes: [
        {
          id: "mock-1",
          title: "שקשוקה קלאסית",
          description: "ביצים על קרשת עגבניות ותבלינים.",
          prepTime: "25 דק'",
          servings: 2,
          steps: [
            "מטגנים בצל ושום בשמן זית עד רכים.",
            "מוסיפים עגבניות קצוצות ומבשלים 10 דקות.",
            "יוצרים שקעים ברוטב ושוברים לתוכם ביצים.",
            "מכסים ומבשלים עד שהחלבון מתקשה. מגישים חם.",
          ],
          nutrition: { calories: 285, protein: 14, carbs: 18, fat: 18, fiber: 4 },
        },
        {
          id: "mock-2",
          title: "מקושקש עגבניות וביצים",
          description: "מנה מהירה עם עגבניות עסיסיות.",
          prepTime: "15 דק'",
          servings: 2,
          steps: [
            "מקציפים ביצים עם קורט מלח.",
            "מטגנים עגבניות עד שמשחררות מיץ.",
            "יוצקים את הביצים ומקשקשים בעדינות.",
            "מתבלים ומגישים על אורז.",
          ],
          nutrition: { calories: 220, protein: 12, carbs: 10, fat: 15, fiber: 2 },
        },
        {
          id: "mock-3",
          title: "חביתת עגבניות",
          description: "חביתה במילוי עגבניות טריות.",
          prepTime: "12 דק'",
          servings: 1,
          steps: [
            "מקציפים ביצים עד קצף.",
            "מבשלים במחבת על אש בינונית.",
            "מוסיפים עגבניות קצוצות וקופפים את החביתה.",
            "מגישים מיד עם טוסט.",
          ],
          nutrition: { calories: 310, protein: 18, carbs: 6, fat: 24, fiber: 1 },
        },
      ],
    };
  }

  return {
    ingredients: withIngredientIds([
      { name: "Tomatoes", quantity: "3 medium" },
      { name: "Eggs", quantity: "4 large" },
      { name: "Onion", quantity: "1 medium" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Garlic", quantity: "2 cloves" },
    ]),
    recipes: [
      {
        id: "mock-1",
        title: "Classic Shakshuka",
        description: "Eggs poached in a spiced tomato and pepper sauce.",
        prepTime: "25 min",
        servings: 2,
        steps: [
          "Sauté onion and garlic in olive oil until soft.",
          "Add chopped tomatoes and simmer 10 minutes.",
          "Make wells in the sauce and crack in the eggs.",
          "Cover and cook until whites are set. Serve hot.",
        ],
        nutrition: { calories: 285, protein: 14, carbs: 18, fat: 18, fiber: 4 },
      },
      {
        id: "mock-2",
        title: "Tomato & Egg Stir-Fry",
        description: "A quick scramble with juicy tomatoes.",
        prepTime: "15 min",
        servings: 2,
        steps: [
          "Beat eggs with a pinch of salt.",
          "Stir-fry tomatoes until they release juices.",
          "Pour in eggs and gently scramble together.",
          "Season and serve over rice.",
        ],
        nutrition: { calories: 220, protein: 12, carbs: 10, fat: 15, fiber: 2 },
      },
      {
        id: "mock-3",
        title: "Garden Tomato Omelette",
        description: "Fluffy omelette filled with fresh tomatoes.",
        prepTime: "12 min",
        servings: 1,
        steps: [
          "Whisk eggs until frothy.",
          "Cook in a non-stick pan over medium heat.",
          "Add diced tomatoes and fold the omelette.",
          "Serve immediately with toast.",
        ],
        nutrition: { calories: 310, protein: 18, carbs: 6, fat: 24, fiber: 1 },
      },
    ],
  };
}

export async function analyzeIngredients(
  imageDataUrl: string,
  language: Language,
): Promise<AnalysisResult> {
  if (!getApiKey()) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAnalysis(language);
  }

  const base64Data = imageDataUrl.split(",")[1];
  if (!base64Data) {
    throw new Error("Invalid image data");
  }

  const result = await generateContentWithFallback([
    { text: buildAnalysisPrompt(language) },
    {
      inlineData: {
        data: base64Data,
        mimeType: getImageMimeType(imageDataUrl),
      },
    },
  ]);

  if (!result) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAnalysis(language);
  }

  const text = result.response.text();
  return withRecipeIds(parseAnalysisResponse(text));
}

export async function searchRecipesFromIngredients(
  ingredients: Ingredient[],
  language: Language,
): Promise<RecipeOption[]> {
  if (!getApiKey()) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAnalysis(language).recipes.map((recipe, index) => ({
      ...recipe,
      id: `${Date.now()}-recipe-${index}`,
    }));
  }

  const result = await generateContentWithFallback(
    buildRecipesFromIngredientsPrompt(ingredients, language),
  );

  if (!result) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAnalysis(language).recipes.map((recipe, index) => ({
      ...recipe,
      id: `${Date.now()}-recipe-${index}`,
    }));
  }

  const text = result.response.text();
  return addRecipeIds(parseRecipesResponse(text));
}
