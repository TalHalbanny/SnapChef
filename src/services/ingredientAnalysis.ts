import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Language } from "../i18n/translations";
import type { AnalysisResult, RecipeOption, Ingredient } from "../types/recipe";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_FLASH_3_KEY || "");

function buildAnalysisPrompt(language: Language): string {
  const languageInstruction =
    language === "he"
      ? "Write all text fields (ingredient names, quantities, recipe titles, descriptions, prepTime, steps) in Hebrew."
      : "Write all text fields in English.";

  return `Analyze the food ingredients visible in this image.

Return ONLY valid JSON (no markdown) with this exact structure:
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

Return ONLY valid JSON (no markdown) with this exact structure:
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

function parseRecipesResponse(text: string): Omit<RecipeOption, "id">[] {
  const cleanJsonText = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleanJsonText);
  return parsed.recipes;
}

function addRecipeIds(recipes: Omit<RecipeOption, "id">[]): RecipeOption[] {
  return recipes.map((recipe, index) => ({
    ...recipe,
    id: `${Date.now()}-recipe-${index}`,
  }));
}

function parseAnalysisResponse(text: string): Omit<AnalysisResult, "recipes"> & { recipes: Omit<RecipeOption, "id">[] } {
  const cleanJsonText = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJsonText);
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
          description: "מנה מהירה בסגנון אסיатי עם עגבניות עסיסיות.",
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
          title: "חביתת עגבניות מהגינה",
          description: "חביתה אוורירית במילוי עגבניות טריות.",
          prepTime: "12 דק'",
          servings: 1,
          steps: [
            "מקציפים ביצים עד קצף.",
            "מבשלים במחבת נון-סטיק על אש בינונית.",
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
        description: "A quick Chinese-style scramble with juicy tomatoes.",
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
        description: "Fluffy omelette filled with fresh tomatoes and herbs.",
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
  const apiKey = import.meta.env.VITE_GEMINI_FLASH_3_KEY;

  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAnalysis(language);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const base64Data = imageDataUrl.split(",")[1];

  const result = await model.generateContent([
    buildAnalysisPrompt(language),
    {
      inlineData: {
        data: base64Data,
        mimeType: "image/png",
      },
    },
  ]);

  const text = result.response.text();
  return withRecipeIds(parseAnalysisResponse(text));
}

export async function searchRecipesFromIngredients(
  ingredients: Ingredient[],
  language: Language,
): Promise<RecipeOption[]> {
  const apiKey = import.meta.env.VITE_GEMINI_FLASH_3_KEY;

  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return getMockAnalysis(language).recipes.map((recipe, index) => ({
      ...recipe,
      id: `${Date.now()}-recipe-${index}`,
    }));
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(
    buildRecipesFromIngredientsPrompt(ingredients, language),
  );

  const text = result.response.text();
  return addRecipeIds(parseRecipesResponse(text));
}
