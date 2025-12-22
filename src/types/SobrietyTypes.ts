export interface SobrietyData {
  startDate: string; // Date de début de la sobriété
  currentStreak: number; // Nombre de jours consécutifs actuels
  totalDays: number; // Nombre total de jours de sobriété
  lastCheckDate: string; // Dernière vérification quotidienne
  milestones: Milestone[]; // Challenges atteints
}

export interface Milestone {
  id: string;
  name: string;
  daysRequired: number;
  achieved: boolean;
  achievedDate?: string;
  description: string;
}

export type ConsumptionLevel = 'single_drink' | 'multiple_drinks' | 'too_much';

export interface DailyCheck {
  date: string;
  sober: boolean;
  notes?: string;
  consumptionLevel?: ConsumptionLevel;
}
