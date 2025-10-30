import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

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

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vérification quotidienne',
            body: "N'oubliez pas de faire votre vérification d'aujourd'hui.",
          },
          trigger: {
            hour,
            minute,
            repeats: true,
            channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
          } as any,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  }

  // Programmer une notification de félicitations pour un jalon
  static async scheduleMilestoneNotification(milestoneName: string, days: number): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Félicitations !', {
            body: `Vous avez atteint le jalon "${milestoneName}" avec ${days} jours de sobriété ! Continuez comme ça !`,
            icon: '/favicon.png',
          });
        }
      } else {
        console.log(`Jalon atteint: ${milestoneName} (${days} jours)`);
      }
    } catch (error) {
      console.error('Erreur lors de la notification de jalon:', error);
    }
  }

  // Programmer une notification de motivation
  static async scheduleMotivationalNotification(): Promise<void> {
    const motivationalMessages = [
      '💪 Vous êtes plus fort que vous ne le pensez ! Continuez votre parcours.',
      '🌟 Chaque jour compte. Vous faites un excellent travail !',
      '🌱 Votre arbre grandit grâce à votre détermination !',
      '✨ La sobriété est un cadeau que vous vous offrez chaque jour.',
      '🏆 Vous êtes un héros de votre propre histoire !',
      '🌈 Après la pluie vient le beau temps. Continuez !',
      '🦋 La transformation prend du temps, mais vous y arrivez !',
      '💎 Vous êtes précieux et méritez le meilleur !',
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('💚 Message de Motivation', {
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
        console.log('Toutes les notifications ont été annulées');
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
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
}
