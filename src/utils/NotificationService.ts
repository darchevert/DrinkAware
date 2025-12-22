// DÉSACTIVÉ TEMPORAIREMENT - expo-notifications cause des erreurs sur Expo Go
// Tout le code est commenté pour être réactivé plus tard avec un développement build

/*
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, SupportedLanguage } from '../i18n/translations';

// Note: Le handler de notifications est configuré dans App.tsx
// pour éviter les conflits et les erreurs de type

export class NotificationService {
  // Demander les permissions de notification
  static async requestPermissions(): Promise<boolean> {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return false;
      }
      
      return true;
    } else {
      console.log('Les notifications ne fonctionnent que sur un appareil physique');
      return false;
    }
  }

  // Programmer une notification quotidienne
  static async scheduleDailyNotification(): Promise<void> {
    try {
      // Annuler les notifications existantes
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Programmer la notification quotidienne à 20h
      await Notifications.scheduleNotificationAsync({
        content: {
          title: await NotificationService.getDailyTitle(),
          body: await NotificationService.getDailyBody(),
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        } as any,
      });

      console.log('Notification quotidienne programmée');
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  }

  // Programmer une notification de félicitations pour un challenge
  static async scheduleMilestoneNotification(milestoneName: string, days: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: await NotificationService.getMilestoneTitle(),
          body: await NotificationService.getMilestoneBody(milestoneName, days),
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Notification immédiate
      });
    } catch (error) {
      console.error('Erreur lors de la notification de challenge:', error);
    }
  }

  // Programmer une notification de motivation
  static async scheduleMotivationalNotification(): Promise<void> {
    const randomMessage = await NotificationService.getRandomMotivationalMessage();

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: await NotificationService.getMotivationalTitle(),
          body: randomMessage,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          seconds: 60 * 60 * 24, // Dans 24 heures
          repeats: false,
        } as any,
      });
    } catch (error) {
      console.error('Erreur lors de la notification de motivation:', error);
    }
  }

  // Annuler toutes les notifications
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }

  // Obtenir le token de notification (pour les notifications push futures)
  static async getNotificationToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Les notifications push ne fonctionnent que sur un appareil physique');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token de notification:', error);
      return null;
    }
  }

  // Initialiser le service de notifications
  static async initialize(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (hasPermission) {
        await this.scheduleDailyNotification();
        console.log('Service de notifications initialisé');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  }

  // Helpers pour choisir la langue des notifications
  private static async getLang(): Promise<SupportedLanguage> {
    const stored = await AsyncStorage.getItem('app_language');
    if (stored === 'fr' || stored === 'en') return stored;
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
      return locale.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    } catch {
      return 'en';
    }
  }

  private static async getDailyTitle() {
    const lang = await this.getLang();
    return translations[lang].notifications.dailyTitle;
  }
  private static async getDailyBody() {
    const lang = await this.getLang();
    return translations[lang].notifications.dailyBody;
  }
  private static async getMilestoneTitle() {
    const lang = await this.getLang();
    return translations[lang].notifications.milestoneTitle;
  }
  private static async getMilestoneBody(name: string, days: number) {
    const lang = await this.getLang();
    const tmpl = translations[lang].notifications.milestoneBody;
    return tmpl.replace('{{name}}', name).replace('{{days}}', String(days));
  }
  private static async getMotivationalTitle() {
    const lang = await this.getLang();
    return translations[lang].notifications.motivationalTitle;
  }
  private static async getRandomMotivationalMessage() {
    const lang = await this.getLang();
    const list = translations[lang].notifications.messages;
    return list[Math.floor(Math.random() * list.length)];
  }
}
*/

// Stub pour éviter les erreurs d'import
export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    console.log('Notifications désactivées - requestPermissions appelé');
    return false;
  }
  static async scheduleDailyNotification(_hour?: number, _minute?: number): Promise<void> {
    console.log('Notifications désactivées - scheduleDailyNotification appelé');
  }
  static async scheduleMilestoneNotification(_milestoneName: string, _days: number): Promise<void> {
    console.log('Notifications désactivées - scheduleMilestoneNotification appelé');
  }
  static async scheduleMotivationalNotification(): Promise<void> {
    console.log('Notifications désactivées - scheduleMotivationalNotification appelé');
  }
  static async cancelAllNotifications(): Promise<void> {
    console.log('Notifications désactivées - cancelAllNotifications appelé');
  }
  static async getNotificationToken(): Promise<string | null> {
    return null;
  }
  static async initialize(): Promise<boolean> {
    console.log('Notifications désactivées - initialize appelé');
    return false;
  }
}
