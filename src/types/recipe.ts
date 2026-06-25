export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeOption {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  servings: number;
  steps: string[];
  nutrition: Nutrition;
}

export interface AnalysisResult {
  ingredients: Ingredient[];
  recipes: RecipeOption[];
}
