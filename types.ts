
export enum BiologicalSex {
  Male = 'Male',
  Female = 'Female'
}

export enum TrainingType {
  Strength = 'Strength',
  Cardio = 'Cardio',
  Crossfit = 'Crossfit',
  Other = 'Other'
}

export enum TrainingIntensity {
  Low = 'Low',
  Moderate = 'Moderate',
  High = 'High'
}

export enum DailyActivityLevel {
  Sedentary = 'Sedentary',
  LightlyActive = 'LightlyActive',
  ModeratelyActive = 'ModeratelyActive',
  VeryActive = 'VeryActive'
}

export enum Goal {
  WeightLoss = 'WeightLoss',
  Maintenance = 'Maintenance',
  MuscleGain = 'MuscleGain'
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
  mealName: string;
  description: string;
  meal_date: string;
  meal_time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface AuthResponse {
  name: string;
  email: string;
  token: string;
}
