import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, SupportedLanguage } from '../i18n/translations';

// Service de notifications simplifié qui fonctionne sur toutes les plateformes
export class NotificationService {
  // Demander les permissions de notification
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Sur le web, utiliser les notifications du navigateur
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          return true;
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      }
      return false;
    }
    
    // Mobile: demander les permissions via Expo Notifications
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const request = await Notifications.requestPermissionsAsync();
    return request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  // Programmer une notification quotidienne à une heure donnée (heure/minute en locale)
  static async scheduleDailyNotification(hour: number = 20, minute: number = 0): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Sur le web, programmer une notification simple
        if ('Notification' in window && Notification.permission === 'granted') {
          // Note: Les notifications web programmées nécessitent un service worker
          // Ici, on journalise l'horaire configuré
          const hh = String(hour).padStart(2, '0');
          const mm = String(minute).padStart(2, '0');
          console.log(`Notification quotidienne programmée pour ${hh}:${mm}`);
        }
      } else {
        // Android: s'assurer qu'un canal existe
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('daily-reminder', {
            name: 'Rappel quotidien',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        // Annuler les rappel(s) existant(s) et programmer le nouveau
        const all = await Notifications.getAllScheduledNotificationsAsync();
        await Promise.all(all.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));

        // Calculer la prochaine occurrence de l'heure programmée
        const now = new Date();
        const targetTime = new Date();
        // Utiliser setHours avec l'heure locale pour garantir la précision
        targetTime.setHours(Number(hour), Number(minute), 0, 0);
        targetTime.setMilliseconds(0);

        // Si l'heure programmée est déjà passée aujourd'hui, programmer pour demain à la même heure
        // Utiliser une marge de sécurité de 5 secondes pour éviter le déclenchement immédiat
        // si l'utilisateur programme exactement à l'heure actuelle
        const safetyMargin = 5 * 1000; // 5 secondes en millisecondes
        const isTimePassed = targetTime.getTime() <= now.getTime() + safetyMargin;
        
        if (isTimePassed) {
          // Si l'heure est passée, programmer pour demain à la même heure
          targetTime.setDate(targetTime.getDate() + 1);
        }

        const title = await NotificationService.getDailyTitle();
        const body = await NotificationService.getDailyBody();

        // Programmer UNE SEULE notification pour la prochaine occurrence de l'heure
        // La notification sera reprogrammée après chaque déclenchement via le listener
        console.log(`[Notifications] Programmation d'une notification pour: ${targetTime.toLocaleString('fr-FR')} (${hour}:${String(minute).padStart(2, '0')})`);
        
        try {
          // S'assurer que la date est bien formatée pour le trigger
          // Le trigger attend un objet Date
          const triggerDate = new Date(targetTime);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
            },
            trigger: {
              date: triggerDate,
              channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
            },
          });
          
          console.log(`[Notifications] Notification programmée avec succès pour: ${triggerDate.toLocaleString('fr-FR')} (heure choisie: ${hour}:${String(minute).padStart(2, '0')}, maintenant: ${now.toLocaleString('fr-FR')})`);
        } catch (error) {
          console.error(`[Notifications] Erreur lors de la programmation de la notification:`, error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  }

  // Programmer une notification de félicitations pour un challenge
  static async scheduleMilestoneNotification(milestoneName: string, days: number): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Félicitations !', {
            body: `Vous avez atteint le challenge "${milestoneName}" avec ${days} jours de sobriété ! Continuez comme ça !`,
            icon: '/favicon.png',
          });
        }
      } else {
        // Mobile: envoyer une notification immédiate
        const lang = await this.getLang();
        const title = translations[lang].notifications.milestoneTitle || '🎉 Félicitations !';
        const body = (translations[lang].notifications.milestoneBody || 'Vous avez atteint le challenge "{{name}}" avec {{days}} jours de sobriété !')
          .replace('{{name}}', milestoneName)
          .replace('{{days}}', String(days));
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: Boolean(true),
            ...(Platform.OS === 'android' && {
              priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
          },
          trigger: null, // Notification immédiate
        });
      }
    } catch (error) {
      console.error('Erreur lors de la notification de challenge:', error);
    }
  }

  // Programmer une notification de motivation
  static async scheduleMotivationalNotification(): Promise<void> {
    const randomMessage = await this.getRandomMotivationalMessage();

    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(await this.getMotivationalTitle(), {
            body: randomMessage,
            icon: '/favicon.png',
          });
        }
      } else {
        console.log('Message de motivation:', randomMessage);
      }
    } catch (error) {
      console.error('Erreur lors de la notification de motivation:', error);
    }
  }

  // Annuler toutes les notifications
  static async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications annulées');
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('[Notifications] Toutes les notifications ont été annulées');
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }

  // Vérifier les notifications programmées (utile pour le débogage)
  static async getScheduledNotifications(): Promise<any[]> {
    try {
      if (Platform.OS === 'web') {
        return [];
      } else {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`[Notifications] ${notifications.length} notifications programmées`);
        if (notifications.length > 0) {
          const firstNotification = notifications[0];
          if (firstNotification.trigger && 'date' in firstNotification.trigger) {
            const date = new Date(firstNotification.trigger.date as number);
            console.log(`[Notifications] Prochaine notification: ${date.toLocaleString('fr-FR')}`);
          }
        }
        return notifications;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Obtenir le token de notification
  static async getNotificationToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return 'web-notification-token';
      } else {
        return 'mobile-notification-token';
      }
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
        // Ne programme pas d'heure par défaut ici; Settings l'initialise
        console.log('Service de notifications initialisé');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  }

  // Helpers (mêmes signatures que NotificationService)
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
  static async getDailyTitle() {
    const lang = await this.getLang();
    return translations[lang].notifications.dailyTitle;
  }
  private static async getDailyBody() {
    const lang = await this.getLang();
    return translations[lang].notifications.dailyBody;
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
