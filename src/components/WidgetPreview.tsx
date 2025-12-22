import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/Theme';
import { useT } from '../i18n/i18n';
import { StorageService } from '../utils/Storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WIDGET_WIDTH = Math.min(SCREEN_WIDTH * 0.7, 200);

export default function WidgetPreview() {
  const { colors, mode } = useTheme();
  const t = useT();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasUncheckedDays, setHasUncheckedDays] = useState(false);

  useEffect(() => {
    loadWidgetData();
  }, []);

  const loadWidgetData = async () => {
    try {
      const dailyChecks = await StorageService.loadDailyChecks();
      if (dailyChecks && dailyChecks.length > 0) {
        // Calculer la série actuelle (simplifié)
        const sortedChecks = [...dailyChecks].sort((a, b) => b.date.localeCompare(a.date));
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        for (const check of sortedChecks) {
          if (check.sober) {
            streak++;
          } else {
            break;
          }
        }
        
        setCurrentStreak(streak);

        // Vérifier les jours non vérifiés (7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const checkedDates = new Set(dailyChecks.map(c => c.date));
        let unchecked = false;
        
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          if (!checkedDates.has(dateStr)) {
            unchecked = true;
            break;
          }
        }
        
        setHasUncheckedDays(unchecked);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du widget:', error);
    }
  };

  return (
    <View
      style={[
        styles.widgetContainer,
        {
          width: WIDGET_WIDTH,
          backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
          borderColor: mode === 'dark' ? colors.border : '#E0E0E0',
        },
      ]}
    >
      {/* Titre */}
      <Text style={[styles.widgetTitle, { color: colors.primary }]}>DrinkAware</Text>

      {/* Nombre de jours */}
      <Text style={[styles.widgetStreakNumber, { color: mode === 'dark' ? colors.text : '#333333' }]}>
        {currentStreak}
      </Text>

      {/* Label */}
      <Text style={[styles.widgetStreakLabel, { color: mode === 'dark' ? colors.mutedText : '#666666' }]}>
        {t('widgetTutorial.previewLabel')}
      </Text>

      {/* Indicateur de jours non vérifiés */}
      {hasUncheckedDays && (
        <View style={styles.widgetWarningContainer}>
          <Ionicons name="warning" size={14} color="#FF9800" />
          <Text style={styles.widgetWarningText}>{t('widgetTutorial.previewWarning')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  widgetStreakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  widgetStreakLabel: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  widgetWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  widgetWarningText: {
    fontSize: 10,
    color: '#FF9800',
  },
});

