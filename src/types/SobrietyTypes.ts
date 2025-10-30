export interface SobrietyData {
  startDate: string; // Date de début de la sobriété
  currentStreak: number; // Nombre de jours consécutifs actuels
  totalDays: number; // Nombre total de jours de sobriété
  lastCheckDate: string; // Dernière vérification quotidienne
  milestones: Milestone[]; // Jalons atteints
  characterLevel: number; // Niveau du personnage/arbre
  characterType: 'tree' | 'pet'; // Type de personnage
}

export interface Milestone {
  id: string;
  name: string;
  daysRequired: number;
  achieved: boolean;
  achievedDate?: string;
  description: string;
}

export interface DailyCheck {
  date: string;
  sober: boolean;
  notes?: string;
}

export interface CharacterState {
  level: number;
  type: 'tree' | 'pet';
  growthStage: number; // Étape de croissance (0-10)
  unlockedFeatures: string[];
}
