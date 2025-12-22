import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SOBRIETY_DATA: 'sobriety_data',
  DAILY_CHECKS: 'daily_checks',
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

  // Normaliser les booléens dans les données (convertir les chaînes 'true'/'false' en booléens)
  private static normalizeBooleans(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeBooleans(item));
    }
    if (typeof obj === 'object') {
      const normalized: any = {};
      for (const key in obj) {
        if (obj[key] === 'true') {
          normalized[key] = true;
        } else if (obj[key] === 'false') {
          normalized[key] = false;
        } else if (typeof obj[key] === 'object') {
          normalized[key] = this.normalizeBooleans(obj[key]);
        } else {
          normalized[key] = obj[key];
        }
      }
      return normalized;
    }
    return obj;
  }

  // Charger les données de sobriété
  static async loadSobrietyData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SOBRIETY_DATA);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return this.normalizeBooleans(parsed);
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
      if (!data) return [];
      const parsed = JSON.parse(data);
      return this.normalizeBooleans(parsed);
    } catch (error) {
      console.error('Erreur lors du chargement des vérifications quotidiennes:', error);
      return [];
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
        if (!byDate[startKey] || !Boolean(byDate[startKey].sober)) {
          currentStreak = 0;
        } else {
          // Remonter jour par jour
          currentStreak = 1;
          lastCheckDate = startKey;
          while (true) {
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
            if (byDate[key] && Boolean(byDate[key].sober)) {
              currentStreak += 1;
              lastCheckDate = key;
              cursor = prev;
            } else {
              break;
            }
          }
        }
      }

      totalDays = allChecks.filter(c => Boolean(c.sober)).length;

      const existingData = await this.loadSobrietyData();
      if (!existingData) return null;

      const updatedData = {
        ...existingData,
        currentStreak,
        totalDays,
        lastCheckDate,
      };

      // Mettre à jour startDate : lendemain du dernier jour de consommation, ou premier jour sobre
      try {
        if (allChecks.length > 0) {
          // Trier par date décroissante pour trouver la dernière consommation
          const sortedChecksDesc = [...allChecks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Trouver le dernier jour avec consommation
          const lastConsumptionCheck = sortedChecksDesc.find((c: any) => !Boolean(c.sober));
          
          let startDateStr: string;
          
          if (lastConsumptionCheck) {
            // Si il y a eu une consommation, prendre le lendemain du dernier jour de consommation
            const lastConsumptionDate = new Date(lastConsumptionCheck.date);
            lastConsumptionDate.setDate(lastConsumptionDate.getDate() + 1);
            startDateStr = `${lastConsumptionDate.getFullYear()}-${String(lastConsumptionDate.getMonth() + 1).padStart(2, '0')}-${String(lastConsumptionDate.getDate()).padStart(2, '0')}`;
          } else {
            // Sinon, prendre le premier jour sobre (trier par date croissante)
            const sortedChecksAsc = [...allChecks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const firstSoberCheck = sortedChecksAsc.find((c: any) => Boolean(c.sober));
            if (firstSoberCheck) {
              startDateStr = firstSoberCheck.date;
            } else {
              // Fallback: utiliser lastCheckDate si calculé, sinon la première date
              startDateStr = lastCheckDate || allChecks[0].date;
            }
          }
          
          // Créer la date de début à 00:00:00
          const startDateObj = new Date(startDateStr);
          const startOfDay = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate(), 0, 0, 0, 0);
          const computedStartIso = startOfDay.toISOString();
          
          // Mettre à jour startDate
          updatedData.startDate = computedStartIso;
        }
      } catch (e) {
        console.warn('Recalculate: mise à jour startDate (début série) ignorée:', e);
      }

      // Mettre à jour les challenges
      if (Array.isArray(updatedData.milestones)) {
        updatedData.milestones = updatedData.milestones.map((m: any) => {
          if (!Boolean(m.achieved) && currentStreak >= m.daysRequired) {
            return { ...m, achieved: true, achievedDate: lastCheckDate };
          }
          return m;
        });
      }

      await this.saveSobrietyData(updatedData);

      return updatedData;
    } catch (error) {
      console.error('Erreur lors du recalcul des statistiques:', error);
      return null;
    }
  }
}
