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

  // Identifiant unique pour la notification quotidienne
  private static readonly DAILY_NOTIFICATION_ID = 'daily-reminder-notification';

  // Programmer une notification quotidienne à une heure donnée (heure/minute en locale)
  // forceTomorrow: si true, force la programmation pour demain même si l'heure n'est pas passée
  static async scheduleDailyNotification(hour: number = 20, minute: number = 0, forceTomorrow: boolean = false): Promise<void> {
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

        // IMPORTANT: Annuler TOUTES les notifications existantes avant d'en programmer une nouvelle
        // Cela évite les doublons et les notifications multiples
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('[Notifications] Toutes les notifications précédentes ont été annulées');

        // Vérifier que les notifications sont activées avant de programmer
        const enabled = await AsyncStorage.getItem('notifications_enabled');
        if (enabled !== 'true') {
          console.log('[Notifications] Notifications désactivées, aucune notification programmée');
          return;
        }

        // Calculer la prochaine occurrence de l'heure programmée
        const now = new Date();
        const targetTime = new Date();
        // Utiliser setHours avec l'heure locale pour garantir la précision
        targetTime.setHours(Number(hour), Number(minute), 0, 0);
        targetTime.setMilliseconds(0);

        // Marge de sécurité pour éviter les notifications immédiates (2 minutes)
        // Si l'heure est dans les 2 prochaines minutes, programmer pour demain
        const safetyMargin = 2 * 60 * 1000; // 2 minutes en millisecondes
        
        if (forceTomorrow) {
          // Si forceTomorrow est true, vérifier quand même si l'heure est très proche
          // Si l'heure est dans les 2 prochaines minutes, programmer pour demain
          // Sinon, programmer pour aujourd'hui si l'heure n'est pas passée
          const timeUntilTarget = targetTime.getTime() - now.getTime();
          
          if (timeUntilTarget <= safetyMargin) {
            // L'heure est trop proche, programmer pour demain
            targetTime.setDate(targetTime.getDate() + 1);
            console.log(`[Notifications] forceTomorrow=true et heure trop proche (${Math.round(timeUntilTarget / 1000)}s), programmation pour demain`);
          } else if (timeUntilTarget > 0) {
            // L'heure n'est pas encore passée et n'est pas trop proche, programmer pour aujourd'hui
            console.log(`[Notifications] forceTomorrow=true mais heure suffisamment éloignée (${Math.round(timeUntilTarget / 60000)} min), programmation pour aujourd'hui`);
          } else {
            // L'heure est passée, programmer pour demain
            targetTime.setDate(targetTime.getDate() + 1);
            console.log(`[Notifications] forceTomorrow=true et heure passée, programmation pour demain`);
          }
        } else {
          // Vérifier si l'heure est passée ou trop proche (dans les 2 prochaines minutes)
          const timeUntilTarget = targetTime.getTime() - now.getTime();
          
          if (timeUntilTarget <= safetyMargin) {
            // Si l'heure est passée ou trop proche, programmer pour demain
            targetTime.setDate(targetTime.getDate() + 1);
            console.log(`[Notifications] L'heure est passée ou trop proche (${Math.round(timeUntilTarget / 1000)}s), programmation pour demain`);
          } else {
            // L'heure n'est pas encore passée et n'est pas trop proche, programmer pour aujourd'hui
            console.log(`[Notifications] L'heure n'est pas encore passée (${Math.round(timeUntilTarget / 60000)} min restantes), programmation pour aujourd'hui`);
          }
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
          
          // Utiliser un identifiant unique pour éviter les doublons
          await Notifications.scheduleNotificationAsync({
            identifier: NotificationService.DAILY_NOTIFICATION_ID,
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
          
          // Vérifier qu'une seule notification est programmée
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          console.log(`[Notifications] ${scheduled.length} notification(s) programmée(s) au total`);
          if (scheduled.length > 1) {
            console.warn(`[Notifications] ATTENTION: ${scheduled.length} notifications programmées au lieu d'une seule!`);
          }
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
        // NOTIFICATIONS AUTOMATIQUES À 20H : Programmer automatiquement à 20h
        const enabled = await AsyncStorage.getItem('notifications_enabled');
        if (enabled === null || enabled === 'true') {
          // Si les notifications ne sont pas explicitement désactivées, les programmer à 20h
          await AsyncStorage.setItem('notifications_enabled', 'true');
          await AsyncStorage.setItem('daily_reminder_time', '20:00');
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          if (scheduled.length === 0) {
            console.log('[Notifications] Initialisation : programmation automatique à 20h');
            await this.scheduleDailyNotification(20, 0, false);
          }
        }
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
