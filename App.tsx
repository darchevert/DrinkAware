import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/i18n/i18n';
import { ThemeProvider, useTheme } from './src/theme/Theme';
import { NotificationService } from './src/utils/SimpleNotificationService';

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  useEffect(() => {
    let subscription: Notifications.Subscription | null = null;
    
    const setupNotificationHandler = async () => {
      try {
        if (Platform.OS !== 'web') {
          // Configurer le handler de notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
              shouldShowAlert: Boolean(true),
              shouldPlaySound: Boolean(true),
              shouldSetBadge: Boolean(false),
              ...(Platform.OS === 'android' ? {
                shouldShowBanner: Boolean(true),
                shouldShowList: Boolean(true),
              } : {
                shouldShowBanner: Boolean(false),
                shouldShowList: Boolean(false),
              }),
      }),
    });

          // Écouter les notifications reçues pour reprogrammer la suivante
          subscription = Notifications.addNotificationReceivedListener(async (notification) => {
            try {
              // Vérifier si c'est une notification quotidienne (en vérifiant le titre)
              const title = notification.request.content.title;
              const dailyTitle = await NotificationService.getDailyTitle();
              
              // Si c'est la notification quotidienne, reprogrammer pour le jour suivant
              if (title === dailyTitle) {
                const time = await AsyncStorage.getItem('daily_reminder_time');
                const enabled = await AsyncStorage.getItem('notifications_enabled');
                
                if (time && enabled === 'true') {
                  const [h, m] = time.split(':').map(Number);
                  if (!Number.isNaN(h) && !Number.isNaN(m)) {
                    console.log('[Notifications] Notification quotidienne reçue, reprogrammation pour demain...');
                    await NotificationService.scheduleDailyNotification(h, m);
                  }
                }
              }
            } catch (error) {
              console.error('[Notifications] Erreur lors de la reprogrammation:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la configuration des notifications:', error);
      }
    };
    
    setupNotificationHandler();
    
    // Nettoyer l'abonnement au démontage
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
    <ThemeProvider>
      <LanguageProvider>
        <AppNavigator />
        <ThemedStatusBar />
      </LanguageProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
