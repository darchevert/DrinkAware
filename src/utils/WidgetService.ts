import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from './Storage';

/**
 * Service pour mettre à jour le widget Android
 * Note: Nécessite un module natif pour fonctionner
 */
export class WidgetService {
  /**
   * Met à jour le widget avec les données actuelles
   */
  static async updateWidget(): Promise<void> {
    if (Platform.OS !== 'android') {
      return; // Les widgets ne sont disponibles que sur Android
    }

    try {
      // Charger les données
      const sobrietyData = await StorageService.loadSobrietyData();
      const dailyChecks = await StorageService.loadDailyChecks();

      // Sauvegarder dans SharedPreferences pour le widget
      // Note: Cela nécessite un module natif React Native
      // Pour l'instant, on utilise AsyncStorage qui sera synchronisé
      // via un module natif personnalisé
      
      if (sobrietyData && dailyChecks) {
        // Stocker les données pour le widget
        await AsyncStorage.setItem('widget_sobriety_data', JSON.stringify(sobrietyData));
        await AsyncStorage.setItem('widget_daily_checks', JSON.stringify(dailyChecks));
        
        // Appeler le module natif pour mettre à jour le widget
        if (Platform.OS === 'android') {
          try {
            const { NativeModules } = require('react-native');
            if (NativeModules.WidgetModule) {
              NativeModules.WidgetModule.updateWidget(
                JSON.stringify(sobrietyData),
                JSON.stringify(dailyChecks)
              );
            }
          } catch (error) {
            // Le module natif n'est peut-être pas encore disponible
            console.log('Module widget non disponible:', error);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du widget:', error);
    }
  }

  /**
   * Met à jour le widget après une vérification quotidienne
   */
  static async updateWidgetAfterCheck(): Promise<void> {
    await this.updateWidget();
  }
}

