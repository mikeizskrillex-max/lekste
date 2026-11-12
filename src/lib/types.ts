export type Lang = 'lt' | 'ru';

export type Goal = 'lose' | 'keep' | 'gain' | 'healthy';
export type Sex = 'f' | 'm';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'high';

/** The 14 allergens that EU food law requires to be declared (Regulation 1169/2011, Annex II). */
export const ALLERGENS = [
  'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export type DietType = 'any' | 'vegetarian' | 'vegan' | 'pescatarian' | 'no_pork' | 'no_beef' | 'low_carb';
export type DietFlag = 'meat' | 'pork' | 'beef' | 'poultry' | 'fish' | 'seafood' | 'dairy' | 'egg' | 'animal';
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type Equipment = 'stove' | 'oven' | 'airfryer' | 'multicooker' | 'blender';
export type HealthFlag = 'pregnancy' | 'breastfeeding' | 'diabetes' | 'eating_disorder' | 'other';

export interface QuizAnswers {
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activity: Activity;
  household: number;
  weeklyBudget: number;
  allergens: Allergen[];
  lactoseIntolerant: boolean;
  dietType: DietType;
  /** ingredient ids the user never wants (hard rule) */
  never: string[];
  /** ingredient ids the user prefers less often (soft rule) */
  avoid: string[];
  likedProteins: string[];
  likedCuisines: string[];
  mealsPerDay: 3 | 4 | 5;
  breakfastStyle: 'sweet' | 'savory' | 'none';
  cookingTimeMax: 15 | 30 | 60;
  equipment: Equipment[];
  batchCooking: boolean;
  spice: 0 | 1 | 2;
  stores: string[];
  health: HealthFlag[];
  email: string;
  consentHealth: boolean;
  consentTerms: boolean;
}

export interface Targets {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  /** kg per week, negative = losing */
  pace: number;
}
