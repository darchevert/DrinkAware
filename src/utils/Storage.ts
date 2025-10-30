import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SOBRIETY_DATA: 'sobriety_data',
  DAILY_CHECKS: 'daily_checks',
  CHARACTER_STATE: 'character_state',
};

export class StorageService {
  // Sauvegarder les données de sobriété
  static async saveSobrietyData(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SOBRIETY_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de sobriété:', error);
    }
  }

  // Charger les données de sobriété
  static async loadSobrietyData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SOBRIETY_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors du chargement des données de sobriété:', error);
      return null;
    }
  }

  // Sauvegarder les vérifications quotidiennes
  static async saveDailyCheck(check: any): Promise<void> {
    try {
      const existingChecks = await this.loadDailyChecks();
      const checkIndex = existingChecks.findIndex(c => c.date === check.date);
      
      if (checkIndex >= 0) {
        // Mettre à jour une vérification existante
        existingChecks[checkIndex] = check;
      } else {
        // Ajouter une nouvelle vérification
        existingChecks.push(check);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHECKS, JSON.stringify(existingChecks));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la vérification quotidienne:', error);
    }
  }

  // Charger les vérifications quotidiennes
  static async loadDailyChecks(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHECKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des vérifications quotidiennes:', error);
      return [];
    }
  }

  // Sauvegarder l'état du personnage
  static async saveCharacterState(state: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHARACTER_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état du personnage:', error);
    }
  }

  // Supprimer une vérification quotidienne
  static async deleteDailyCheck(date: string): Promise<void> {
    try {
      const existingChecks = await this.loadDailyChecks();
      const updatedChecks = existingChecks.filter(c => c.date !== date);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHECKS, JSON.stringify(updatedChecks));
    } catch (error) {
      console.error('Erreur lors de la suppression de la vérification quotidienne:', error);
    }
  }

  // Charger l'état du personnage
  static async loadCharacterState(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHARACTER_STATE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état du personnage:', error);
      return null;
    }
  }

  // Recalculer les statistiques (série actuelle, total) à partir des vérifications
  static async recalculateStatistics(): Promise<any | null> {
    try {
      const allChecks = await this.loadDailyChecks();

      // Trier par date croissante
      allChecks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentStreak = 0;
      let totalDays = 0;
      let lastCheckDate = '';

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Trouver l'index de la vérification la plus récente (aujourd'hui si présent, sinon la dernière)
      let checkIndex = allChecks.findIndex(c => c.date === todayStr);
      if (checkIndex === -1) {
        checkIndex = allChecks.length - 1;
      }

      // Compter la série actuelle en exigeant des jours consécutifs (gère les trous du calendrier)
      if (allChecks.length > 0) {
        const byDate: Record<string, any> = {};
        for (const c of allChecks) byDate[c.date] = c;

        // point de départ: aujourd'hui si entré, sinon dernière date en base
        const startDateForStreak = checkIndex >= 0 ? allChecks[checkIndex].date : allChecks[allChecks.length - 1].date;
        let cursor = new Date(startDateForStreak);

        // si le jour de départ n'est pas sobre -> streak 0
        const startKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        if (!byDate[startKey] || !byDate[startKey].sober) {
          currentStreak = 0;
        } else {
          // Remonter jour par jour
          currentStreak = 1;
          lastCheckDate = startKey;
          while (true) {
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
            if (byDate[key] && byDate[key].sober) {
              currentStreak += 1;
              lastCheckDate = key;
              cursor = prev;
            } else {
              break;
            }
          }
        }
      }

      totalDays = allChecks.filter(c => c.sober).length;

      const existingData = await this.loadSobrietyData();
      if (!existingData) return null;

      const updatedData = {
        ...existingData,
        currentStreak,
        totalDays,
        lastCheckDate,
      };

      // Mettre à jour startDate sur le début de la série actuelle (00:00 du jour de départ)
      try {
        if (currentStreak > 0 && allChecks.length > 0) {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          // Trouver l'index du dernier jour pris en compte (aujourd'hui si présent, sinon le dernier en base)
          let endIndex = allChecks.findIndex((c: any) => c.date === todayStr);
          if (endIndex === -1) endIndex = allChecks.length - 1;

          // Début de la série actuelle = lastCheckDate calculé ci-dessus
          const startDateObj = new Date(lastCheckDate || allChecks[endIndex].date);
          const startOfDay = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate(), 0, 0, 0, 0);
          const computedStartIso = startOfDay.toISOString();

          // Si une consommation a été enregistrée aujourd'hui, on garde la précision déjà stockée
          const hasConsumptionToday = allChecks.some((c: any) => c.date === todayStr && !c.sober);

          if (!hasConsumptionToday) {
            // Toujours aligner sur le début de la série actuelle, même après une réinitialisation manuelle
            updatedData.startDate = computedStartIso;
          }
        }
      } catch (e) {
        console.warn('Recalculate: mise à jour startDate (début série) ignorée:', e);
      }

      // Mettre à jour les jalons
      if (Array.isArray(updatedData.milestones)) {
        updatedData.milestones = updatedData.milestones.map((m: any) => {
          if (!m.achieved && currentStreak >= m.daysRequired) {
            return { ...m, achieved: true, achievedDate: lastCheckDate };
          }
          return m;
        });
      }

      await this.saveSobrietyData(updatedData);

      // Mettre à jour le personnage selon la série
      const characterState = await this.loadCharacterState();
      if (characterState) {
        const newLevel = Math.floor(currentStreak / 10) + 1;
        const newGrowthStage = Math.min(Math.floor(currentStreak / 7), 9);
        const updatedCharacter = { ...characterState, level: newLevel, growthStage: newGrowthStage };
        await this.saveCharacterState(updatedCharacter);
      }

      return updatedData;
    } catch (error) {
      console.error('Erreur lors du recalcul des statistiques:', error);
      return null;
    }
  }
}
