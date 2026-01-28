
export enum HealthGoal {
  WEIGHT_LOSS = 'Emagrecimento',
  MUSCLE_GAIN = 'Ganho Muscular',
  CUTTING = 'Secar ao Extremo',
  DETOX = 'Desinchar/Detox',
  DIABETES = 'Controle Diabetes',
  HYPERTENSION = 'Hipertenso',
  VEGETARIAN = 'Vegetariano/Vegano',
  LOW_CARB = 'Low Carb',
  KETOGENIC = 'Cetogênica',
  MARMITA = 'Marmitas/Meal Prep',
  GENERAL = 'Alimentação Saudável',
  GLUTEOS_GIGANTES = 'Glúteos Gigantes',
  PERNAS_DEUSES = 'Pernas dos Deuses',
  ABS_ACO = 'Abdômen de Aço',
  COMPETICAO = 'Fisiculturismo/Competição',
  OMBROS_V_TAPER = 'V-Taper (Costas e Ombros)',
  HIIT_NINJA = 'Condicionamento Ninja (HIIT)',
  LEAN_BULK_ADV = 'Lean Bulk Avançado',
  BODY_RECOMP = 'Recompensação Corporal',
  CALORIE_CYCLING = 'Ciclagem de Calorias',
  CARB_CYCLING = 'Carb Cycling',
  LEAN_GAIN = 'Lean Gain'
}

export interface ShapeAnalysisResult {
  overallScore: number;
  title: string;
  stats: {
    definition: number;
    volume: number;
    symmetry: number;
    proportions: number;
  };
  estimatedBodyFat: string;
  muscleTier: string;
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
  coachMessage: string;
  evolutionComparison?: string;
}

export interface WaterStats {
  current: number;
  goal: number;
  lastDrinkDate: string;
  remindersEnabled: boolean;
  reminderIntervalMinutes: number;
}

export interface UserProfile {
  id?: string; // Database UUID
  name: string;
  level: number;
  isPremium?: boolean;
  premiumSince?: string;
  age?: string;
  height?: string;
  weight?: string;
  gender?: string;
  activityLevel?: 'Sedentário' | 'Leve' | 'Moderado' | 'Intenso' | 'Atleta';
  allergies?: string[];
  mealsPerDay?: number;
  routineNotes?: string;
  goal: HealthGoal[];
  favorites: string[];
  customRecipes: Recipe[];
  shoppingList: ShoppingItem[];
  activeChallenge: UserChallengeProgress | null;
  hasOnboarded?: boolean;
  dietPlan?: DietPlan;
  dailyProgress: DailyProgress;
  waterStats: WaterStats;
  lastSpecificWorkout?: SpecificWorkout;
  workoutJourney?: WorkoutJourney;
  shapeHistory?: ShapeRecord[];
  activityHistory?: ActivityRecord[];
  usageStats: UsageStats;
  email?: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  timeMinutes: number;
  calories: number;
  tags: HealthGoal[];
  ingredients: string[];
  steps: string[];
  isQuick: boolean;
  category: string;
  tip?: string;
}

export interface DietPlan {
  calories: number;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  meals: {
    breakfast: MealSuggestion;
    lunch: MealSuggestion;
    snacks: MealSuggestion;
    dinner: MealSuggestion;
  };
  tips: string[];
  duration: string;
  estimatedResult: string;
  waterIntake: string;
  dailyWorkout?: {
    title: string;
    exercises: WorkoutItem[];
  };
}

export interface MealSuggestion {
  description: string;
  recipeIds: string[];
}

export interface WorkoutItem {
  name: string;
  duration: string;
  intensity: string;
  description: string;
}

export interface FoodAnalysis {
  foodName: string;
  portionSize: string;
  calories: number;
  macros: { protein: string; carbs: string; fats: string; };
  benefits: string[];
  suitability: string;
  isHealthy: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  estimatedPrice?: number;
}

export interface SuggestedItem {
  name: string;
  quantity: string;
  estimatedPrice: number;
  category: string;
  reason: string;
}

export interface SmartListResponse {
  items: SuggestedItem[];
  markets: { name: string; type: string; reason: string; }[];
}

export interface UserChallengeProgress {
  challengeId: string;
  startDate: string;
  completedDays: number[];
}

export interface DailyProgress {
  checkInDates: string[];
  currentStreak: number;
  lastCheckIn: string | null;
}

export interface ShapeRecord {
  id: string;
  date: string;
  week: number;
  weight: number;
  photos: { front: string | null; back: string | null; left: string | null; right: string | null };
  analysis: ShapeAnalysisResult;
}

export interface ActivityRecord {
  id: string;
  type: 'run' | 'walk' | 'bike';
  date: string;
  durationSeconds: number;
  distanceKm: number;
  calories: number;
  pace: string;
  kudos: number;
}

export interface UsageStats {
  lastChefGenDate: string;
  chefGenCount: number;
  lastShapeCheckin: string;
  lastWorkoutGenDate: string;
  workoutGenCount: number;
  lastDietGenDate: string;
  dietGenCount: number;
  lastScanDate: string;
  scanCount: number;
  lastListGenDate: string;
  listGenCount: number;
}

export interface SpecificWorkout {
  target: string;
  exercises: WorkoutItem[];
}

export interface WorkoutRoutine {
  key: string;
  title: string;
  exercises: WorkoutItem[];
}

export interface WorkoutPhase {
  levelName: string;
  duration: string;
  description: string;
  schedule: string[];
  detailedRoutines: WorkoutRoutine[];
  totalWeeks: number;
  completedWeeks: number;
  isUnlocked: boolean;
}

export interface WorkoutJourney {
  title: string;
  goal: string;
  totalDuration: string;
  phases: WorkoutPhase[];
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  discount?: string;
}
