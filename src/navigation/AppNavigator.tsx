import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DailyCheckScreen from '../screens/DailyCheckScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CheckInScreen from '../screens/CheckInScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WidgetTutorialScreen from '../screens/WidgetTutorialScreen';
import { OnboardingService } from '../utils/OnboardingService';
import { useT } from '../i18n/i18n';
import { useTheme } from '../theme/Theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const t = useT();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 56 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Accueil" 
        component={HomeScreen}
        options={{ 
          title: t('tabs.homeTitle' as any),
          tabBarLabel: t('tabs.homeLabel' as any),
          tabBarIcon: ({ focused, color, size }) => {
            // Utiliser une icône sûre disponible partout et varier uniquement la couleur
            const iconColor = focused ? colors.primary : colors.mutedText;
            const iconSize = size || 24;
            return (
              <Ionicons name={"home-outline" as keyof typeof Ionicons.glyphMap} size={iconSize} color={iconColor} />
            );
          },
        }}
      />
      <Tab.Screen 
        name="Calendrier" 
        component={CalendarScreen}
        options={{ 
          title: t('tabs.calendarTitle' as any),
          tabBarLabel: t('tabs.calendarLabel' as any),
          tabBarIcon: ({ focused, color, size }) => {
            const iconColor = focused ? colors.primary : colors.mutedText;
            return (
              <Ionicons 
                name={focused ? 'calendar' : 'calendar-outline'} 
                size={size} 
                color={iconColor} 
              />
            );
          },
        }}
      />
      <Tab.Screen 
        name="Statistiques" 
        component={StatsScreen}
        options={{ 
          title: t('tabs.statsTitle' as any),
          tabBarLabel: t('tabs.statsLabel' as any),
          tabBarIcon: ({ focused, color, size }) => {
            const iconColor = focused ? colors.primary : colors.mutedText;
            return (
              <Ionicons 
                name={focused ? 'stats-chart' : 'stats-chart-outline'} 
                size={size} 
                color={iconColor} 
              />
            );
          },
        }}
      />
      <Tab.Screen 
        name="Paramètres" 
        component={SettingsScreen}
        options={{ 
          title: t('tabs.settingsTitle' as any),
          tabBarLabel: t('tabs.settingsLabel' as any),
          tabBarIcon: ({ focused, color, size }) => {
            const iconColor = focused ? colors.primary : colors.mutedText;
            return (
              <Ionicons 
                name={focused ? 'settings' : 'settings-outline'} 
                size={size} 
                color={iconColor} 
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const t = useT();
  const { colors } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Vérifier l'onboarding périodiquement pour détecter les changements depuis SettingsScreen
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showOnboarding) {
        checkOnboardingStatus();
      }
    }, 500); // Vérifier toutes les 500ms
    
    return () => clearInterval(interval);
  }, [showOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompleted = await OnboardingService.hasCompletedOnboarding();
      if (!hasCompleted) {
        setIsFirstLaunch(true);
        setShowOnboarding(true);
      } else {
        setIsFirstLaunch(false);
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'onboarding:', error);
      setIsFirstLaunch(false);
      setShowOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await OnboardingService.markOnboardingAsCompleted();
    setShowOnboarding(false);
  };

  // Afficher un loader pendant la vérification
  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Si l'onboarding doit être affiché, le rendre directement sans NavigationContainer
  if (showOnboarding) {
    return <OnboardingScreen navigation={null} onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="DailyCheck" 
          component={DailyCheckScreen}
          options={{ 
            title: t('tabs.dailyCheckTitle' as any),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="CheckIn" 
          component={CheckInScreen}
          options={{ 
            title: t('calendar.addCheck' as any),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="WidgetTutorial" 
          component={WidgetTutorialScreen}
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
