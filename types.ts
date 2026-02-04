
export enum BiologicalSex {
  Male = 'male',
  Female = 'female'
}

export enum TrainingType {
  Strength = 'strength',
  Cardio = 'cardio',
  Sports = 'sports',
  Mixed = 'mixed'
}

export enum TrainingIntensity {
  Low = 'low',
  Moderate = 'moderate',
  High = 'high'
}

export enum DailyActivityLevel {
  Sedentary = 'sedentary',
  Light = 'light',
  Moderate = 'moderate',
  Active = 'active',
  VeryActive = 'very_active'
}

export enum Goal {
  Maintenance = 'maintain',
  MuscleGain = 'gain_muscle',
  WeightLoss = 'lose_fat',
  Performance = 'performance'
}

export interface UserData {
  weightKg: number;
  heightCm: number;
  age: number;
  biologicalSex: BiologicalSex;
  workoutsPerWeek: number;
  trainingType: TrainingType;
  trainingIntensity: TrainingIntensity;
  dailyActivityLevel: DailyActivityLevel;
  goal: Goal;
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
  routineConsistency: number; // 1-10
}

export interface UserInsights {
  target_calories: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  sleep_hours_target: number;
}

export interface Meal {
  mealId: string;
  mealName: string;
  description: string;
  meal_date: string;
  meal_time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  explanation?: string;
  advice?: string;
}

export interface DailyMetrics {
  meal_date: string;
  calories_total: number;
  protein_g_total: number;
  carbs_g_total: number;
  fat_g_total: number;
}

export interface AuthResponse {
  name: string;
  email: string;
  token: string;
}
