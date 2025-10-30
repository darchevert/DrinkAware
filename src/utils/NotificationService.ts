import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
          title: '🌱 Vérification Quotidienne',
          body: 'Comment vous sentez-vous aujourd\'hui ? N\'oubliez pas de faire votre vérification !',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Notification quotidienne programmée');
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  }

  // Programmer une notification de félicitations pour un jalon
  static async scheduleMilestoneNotification(milestoneName: string, days: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Félicitations !',
          body: `Vous avez atteint le jalon "${milestoneName}" avec ${days} jours de sobriété ! Continuez comme ça !`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Notification immédiate
      });
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💚 Message de Motivation',
          body: randomMessage,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          seconds: 60 * 60 * 24, // Dans 24 heures
        },
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
}
