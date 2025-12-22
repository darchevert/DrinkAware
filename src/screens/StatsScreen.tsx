import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

import { SobrietyData, DailyCheck } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { useT, useLanguage } from '../i18n/i18n';
import { useTheme } from '../theme/Theme';
import { ShareService } from '../utils/ShareService';
import { triggerSelection, triggerImpact } from '../utils/Haptics';

interface StatsScreenProps {
  navigation: any;
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const t = useT();
  const { language } = useLanguage();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [sobrietyData, setSobrietyData] = useState<SobrietyData | null>(null);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailedConsumptionEnabled, setDetailedConsumptionEnabled] = useState(false);
  const [selectedChartPeriod, setSelectedChartPeriod] = useState<'all' | 'last7Days' | 'last30Days'>('all');
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar'>('pie');
  const [selectedProgressionType, setSelectedProgressionType] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyProgressionOffset, setWeeklyProgressionOffset] = useState(0);
  const [monthlyProgressionOffset, setMonthlyProgressionOffset] = useState(0);
  const [historyDisplayCount, setHistoryDisplayCount] = useState(10);
  const DETAILED_CONSUMPTION_KEY = 'detailed_consumption_enabled';

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand l'utilisateur revient sur cet écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
      // Réinitialiser l'offset pour afficher les 7 dernières semaines et les 6 derniers mois
      setWeeklyProgressionOffset(0);
      setMonthlyProgressionOffset(0);
      // Réinitialiser le nombre de jours affichés dans l'historique
      setHistoryDisplayCount(10);
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      // Toujours recalculer avant de lire pour garantir la cohérence (startDate/streak)
      await StorageService.recalculateStatistics();
      const data = await StorageService.loadSobrietyData();
      const checks = await StorageService.loadDailyChecks();
      const detailedPref = await AsyncStorage.getItem(DETAILED_CONSUMPTION_KEY);
      
      if (data) {
        setSobrietyData(data);
      }
      setDailyChecks(checks || []);
      setDetailedConsumptionEnabled(detailedPref === 'true');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStreakStats = () => {
    if (!dailyChecks || !dailyChecks.length) return { longestStreak: 0, averageStreak: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let streaks: number[] = [];
    
    // Trier les vérifications par date
    const sortedChecks = [...dailyChecks].sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } catch {
        return 0;
      }
    });
    
    for (const check of sortedChecks) {
      if (Boolean(check.sober)) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak);
        }
        currentStreak = 0;
      }
    }
    
    // Ajouter la série actuelle si elle existe
    if (currentStreak > 0) {
      streaks.push(currentStreak);
    }
    
    const averageStreak = streaks.length > 0 
      ? Math.round(streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length)
      : 0;
    
    return { longestStreak, averageStreak };
  };

  const getWeeklyStats = () => {
    if (!dailyChecks || !Array.isArray(dailyChecks)) return { soberDays: 0, totalDays: 0 };
    const last7Days = dailyChecks.slice(-7);
    const soberDays = last7Days.filter(check => check && Boolean(check.sober)).length;
    return { soberDays, totalDays: last7Days.length };
  };

  const getMonthlyStats = () => {
    if (!dailyChecks || !Array.isArray(dailyChecks)) return { soberDays: 0, totalDays: 0 };
    const last30Days = dailyChecks.slice(-30);
    const soberDays = last30Days.filter(check => check && Boolean(check.sober)).length;
    return { soberDays, totalDays: last30Days.length };
  };

  const consumptionStats = useMemo(() => {
    if (!dailyChecks || !Array.isArray(dailyChecks)) {
      return {
        total: 0,
        sober: 0,
        consumed: 0,
        single: 0,
        multiple: 0,
        tooMuch: 0,
        soberPct: 0,
        consumedPct: 0,
        singlePct: 0,
        multiplePct: 0,
        tooMuchPct: 0,
      };
    }
    // Inclure tous les checks (sobres et consommations)
    const allChecks = dailyChecks.filter(check => check);
    const total = allChecks.length;
    const sober = allChecks.filter(check => Boolean(check.sober)).length;
    const consumed = allChecks.filter(check => !Boolean(check.sober)).length;
    const single = allChecks.filter(check => check.consumptionLevel === 'single_drink').length;
    const multiple = allChecks.filter(check => check.consumptionLevel === 'multiple_drinks').length;
    const tooMuch = allChecks.filter(check => check.consumptionLevel === 'too_much').length;
    const percentage = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
    return {
      total,
      sober,
      consumed,
      single,
      multiple,
      tooMuch,
      soberPct: percentage(sober),
      consumedPct: percentage(consumed),
      singlePct: percentage(single),
      multiplePct: percentage(multiple),
      tooMuchPct: percentage(tooMuch),
    };
  }, [dailyChecks]);

  // Statistiques pour les 7 derniers jours
  const consumptionStatsLast7Days = useMemo(() => {
    if (!dailyChecks || !Array.isArray(dailyChecks)) {
      return {
        total: 0,
        sober: 0,
        consumed: 0,
        single: 0,
        multiple: 0,
        tooMuch: 0,
        soberPct: 0,
        consumedPct: 0,
        singlePct: 0,
        multiplePct: 0,
        tooMuchPct: 0,
      };
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    // Filtrer les checks des 7 derniers jours
    const recentChecks = dailyChecks.filter(check => {
      if (!check || !check.date) return false;
      return check.date >= sevenDaysAgoStr;
    });
    
    const total = recentChecks.length;
    const sober = recentChecks.filter(check => Boolean(check.sober)).length;
    const consumed = recentChecks.filter(check => !Boolean(check.sober)).length;
    const single = recentChecks.filter(check => check.consumptionLevel === 'single_drink').length;
    const multiple = recentChecks.filter(check => check.consumptionLevel === 'multiple_drinks').length;
    const tooMuch = recentChecks.filter(check => check.consumptionLevel === 'too_much').length;
    const percentage = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
    
    return {
      total,
      sober,
      consumed,
      single,
      multiple,
      tooMuch,
      soberPct: percentage(sober),
      consumedPct: percentage(consumed),
      singlePct: percentage(single),
      multiplePct: percentage(multiple),
      tooMuchPct: percentage(tooMuch),
    };
  }, [dailyChecks]);

  // Statistiques pour les 30 derniers jours
  const consumptionStatsLast30Days = useMemo(() => {
    if (!dailyChecks || !Array.isArray(dailyChecks)) {
      return {
        total: 0,
        sober: 0,
        consumed: 0,
        single: 0,
        multiple: 0,
        tooMuch: 0,
        soberPct: 0,
        consumedPct: 0,
        singlePct: 0,
        multiplePct: 0,
        tooMuchPct: 0,
      };
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Filtrer les checks des 30 derniers jours
    const recentChecks = dailyChecks.filter(check => {
      if (!check || !check.date) return false;
      return check.date >= thirtyDaysAgoStr;
    });
    
    const total = recentChecks.length;
    const sober = recentChecks.filter(check => Boolean(check.sober)).length;
    const consumed = recentChecks.filter(check => !Boolean(check.sober)).length;
    const single = recentChecks.filter(check => check.consumptionLevel === 'single_drink').length;
    const multiple = recentChecks.filter(check => check.consumptionLevel === 'multiple_drinks').length;
    const tooMuch = recentChecks.filter(check => check.consumptionLevel === 'too_much').length;
    const percentage = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
    
    return {
      total,
      sober,
      consumed,
      single,
      multiple,
      tooMuch,
      soberPct: percentage(sober),
      consumedPct: percentage(consumed),
      singlePct: percentage(single),
      multiplePct: percentage(multiple),
      tooMuchPct: percentage(tooMuch),
    };
  }, [dailyChecks]);

  // Statistiques hebdomadaires (toutes les semaines disponibles depuis le début)
  const allWeeklyProgressionStats = useMemo(() => {
    if (!dailyChecks || !Array.isArray(dailyChecks) || dailyChecks.length === 0) {
      return [];
    }

    const weeks: Array<{ week: string; sober: number; total: number; percentage: number }> = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    // Trouver la première date réelle des données (pas startDate qui peut être recalculé)
    const sortedChecks = [...dailyChecks]
      .filter(check => check && check.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (sortedChecks.length === 0) {
      return [];
    }
    
    const firstCheckDate = new Date(sortedChecks[0].date);
    firstCheckDate.setHours(0, 0, 0, 0);
    
    // Calculer le lundi de la semaine contenant la première date réelle
    const firstWeekStart = new Date(firstCheckDate);
    const dayOfWeek = firstWeekStart.getDay(); // 0 = dimanche, 1 = lundi, etc.
    // Calculer l'offset pour aller au lundi (1 = lundi)
    // Si dimanche (0), on remonte de 6 jours, sinon on calcule l'offset
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstWeekStart.setDate(firstWeekStart.getDate() + mondayOffset);
    firstWeekStart.setHours(0, 0, 0, 0);
    
    // Calculer toutes les semaines depuis le début jusqu'à maintenant (y compris la semaine en cours)
    let currentWeekStart = new Date(firstWeekStart);
    const maxWeeks = 100; // Limite pour éviter les boucles infinies
    
    for (let i = 0; i < maxWeeks; i++) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Inclure toutes les semaines jusqu'à la semaine en cours (même si elle n'est pas terminée)
      // On arrête seulement si le début de la semaine est dans le futur
      if (currentWeekStart > now) {
        break;
      }
      
      // Convertir les dates en format YYYY-MM-DD sans utiliser toISOString (qui peut changer le jour à cause du fuseau horaire)
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const weekStartStr = formatDate(currentWeekStart);
      const weekEndStr = formatDate(weekEnd);
      
      // Filtrer les checks pour cette semaine (comparaison de chaînes de dates au format YYYY-MM-DD)
      // Important : on ne compte que les jours qui sont strictement dans la semaine (lundi à dimanche)
      const weekChecks = dailyChecks.filter(check => {
        if (!check || !check.date) return false;
        // Les dates sont déjà au format YYYY-MM-DD, on peut les comparer directement
        // Vérifier que la date est bien dans la plage [weekStartStr, weekEndStr]
        return check.date >= weekStartStr && check.date <= weekEndStr;
      });
      
      // Compter uniquement les jours uniques (éviter les doublons si plusieurs checks pour le même jour)
      // Utiliser un Map pour garder le dernier état de chaque jour (au cas où il y aurait plusieurs checks)
      const dateToCheck = new Map<string, boolean>();
      weekChecks.forEach(check => {
        if (check.date) {
          // Si plusieurs checks pour le même jour, garder le dernier
          dateToCheck.set(check.date, Boolean(check.sober));
        }
      });
      
      // Vérifier que tous les jours sont bien dans la semaine (sécurité supplémentaire)
      const validDates = Array.from(dateToCheck.keys()).filter(date => {
        return date >= weekStartStr && date <= weekEndStr;
      });
      
      // Compter les jours sobres (uniquement les jours uniques et valides dans la semaine)
      const sober = validDates.filter(date => {
        return dateToCheck.get(date) === true;
      }).length;
      const total = validDates.length; // Nombre de jours uniques avec des données dans cette semaine
      const percentage = total > 0 ? Math.round((sober / total) * 100) : 0;
      
      const weekLabel = `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1}`;
      
      weeks.push({
        week: weekLabel,
        sober,
        total,
        percentage,
      });
      
      // Passer à la semaine suivante
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      
      // Si le début de la prochaine semaine est dans le futur, on arrête après avoir inclus la semaine en cours
      if (currentWeekStart > now) {
        break;
      }
    }
    
    return weeks;
  }, [dailyChecks, sobrietyData]);

  // Extraire les 10 semaines selon l'offset
  // Extraire les 7 semaines selon l'offset (en partant de la fin pour afficher les plus récentes)
  const weeklyProgressionStats = useMemo(() => {
    if (allWeeklyProgressionStats.length === 0) return [];
    
    // Partir de la fin (semaines les plus récentes) et remonter dans le temps
    const totalWeeks = allWeeklyProgressionStats.length;
    const endIndex = totalWeeks - weeklyProgressionOffset;
    const startIndex = Math.max(0, endIndex - 7); // Maximum 7 semaines
    
    const weeks = allWeeklyProgressionStats.slice(startIndex, endIndex);
    return weeks.length > 0 ? weeks : [];
  }, [allWeeklyProgressionStats, weeklyProgressionOffset]);

  // Calculer le pourcentage de sobriété total
  const totalSobrietyPercentage = useMemo(() => {
    if (!dailyChecks || dailyChecks.length === 0) return 0;
    const total = dailyChecks.length;
    const sober = dailyChecks.filter(check => Boolean(check.sober)).length;
    return total > 0 ? Math.round((sober / total) * 100) : 0;
  }, [dailyChecks]);

  // Statistiques mensuelles (tous les mois depuis le premier jour de sobriété)
  const monthlyProgressionStats = useMemo(() => {
    if (!dailyChecks || !Array.isArray(dailyChecks) || dailyChecks.length === 0) {
      return [];
    }

    // Trier les checks par date pour trouver la première date (la plus ancienne)
    const sortedChecks = [...dailyChecks].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date.localeCompare(b.date);
    });

    // Utiliser la première date de check disponible (la plus ancienne) comme point de départ
    const firstCheckDate = sortedChecks.length > 0 && sortedChecks[0].date 
      ? new Date(sortedChecks[0].date) 
      : null;
    if (!firstCheckDate || isNaN(firstCheckDate.getTime())) {
      return [];
    }
    firstCheckDate.setHours(0, 0, 0, 0);

    const months: Array<{ month: string; sober: number; total: number; percentage: number }> = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // Fonction pour formater les dates sans problème de fuseau horaire
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Calculer le premier jour du mois contenant la date de début
    const firstMonthStart = new Date(firstCheckDate.getFullYear(), firstCheckDate.getMonth(), 1);
    firstMonthStart.setHours(0, 0, 0, 0);

    // Calculer tous les mois depuis le début jusqu'à maintenant (y compris le mois en cours)
    let currentMonthStart = new Date(firstMonthStart);
    const maxMonths = 200; // Limite pour éviter les boucles infinies

    for (let i = 0; i < maxMonths; i++) {
      const monthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0, 23, 59, 59, 999);

      // On inclut le mois si son début est avant ou égal à "maintenant"
      if (currentMonthStart > now) {
        break;
      }

      const monthStartStr = formatDate(currentMonthStart);
      const monthEndStr = formatDate(monthEnd);

      // Filtrer les checks pour ce mois
      const monthChecks = dailyChecks.filter(check => {
        if (!check || !check.date) return false;
        return check.date >= monthStartStr && check.date <= monthEndStr;
      });

      // Compter uniquement les jours uniques (éviter les doublons si plusieurs checks pour le même jour)
      const dateToCheck = new Map<string, boolean>();
      monthChecks.forEach(check => {
        if (check.date) {
          // Si plusieurs checks pour le même jour, garder le dernier
          dateToCheck.set(check.date, Boolean(check.sober));
        }
      });

      // Vérifier que tous les jours sont bien dans le mois (sécurité supplémentaire)
      const validDates = Array.from(dateToCheck.keys()).filter(date => {
        return date >= monthStartStr && date <= monthEndStr;
      });

      // Compter les jours sobres (uniquement les jours uniques et valides dans le mois)
      const sober = validDates.filter(date => {
        return dateToCheck.get(date) === true;
      }).length;
      const total = validDates.length; // Nombre de jours uniques avec des données dans ce mois
      const percentage = total > 0 ? Math.round((sober / total) * 100) : 0;

      // Inclure le mois même s'il n'y a pas de données (pour avoir une vue complète depuis le début)
      // Mais on peut aussi filtrer les mois sans données si nécessaire
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthLabel = `${monthNames[currentMonthStart.getMonth()]} ${currentMonthStart.getFullYear().toString().slice(-2)}`;

      months.push({
        month: monthLabel,
        sober,
        total,
        percentage,
      });

      // Passer au mois suivant
      currentMonthStart = new Date(currentMonthStart);
      currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
    }

    return months;
  }, [dailyChecks]);

  // Extraire les 6 mois selon l'offset (en partant de la fin pour afficher les plus récents)
  const monthlyProgressionStatsDisplay = useMemo(() => {
    if (monthlyProgressionStats.length === 0) return [];
    
    // Partir de la fin (mois les plus récents) et remonter dans le temps
    const totalMonths = monthlyProgressionStats.length;
    const endIndex = totalMonths - monthlyProgressionOffset;
    const startIndex = Math.max(0, endIndex - 6); // Maximum 6 mois
    
    const months = monthlyProgressionStats.slice(startIndex, endIndex);
    return months.length > 0 ? months : [];
  }, [monthlyProgressionStats, monthlyProgressionOffset]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sobrietyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const streakStats = getStreakStats();
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const getLocalizedMilestoneName = (m: { id: string; name: string }) => {
    const idToKey: Record<string, string> = {
      '1': 'milestones.m1_name',
      '2': 'milestones.m2_name',
      '3': 'milestones.m3_name',
      '4': 'milestones.m4_name',
      '5': 'milestones.m5_name',
      '6': 'milestones.m6_name',
      '7': 'milestones.m7_name',
      '8': 'milestones.m8_name',
      '9': 'milestones.m9_name',
    };
    const key = idToKey[m.id];
    return key ? t(key as any) : m.name;
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}> 
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={Boolean(false)}
        contentContainerStyle={{ 
          paddingBottom: 120 + (insets.bottom || 0),
          paddingTop: 20,
        }}
        {...(Platform.OS === 'ios' && { contentInsetAdjustmentBehavior: 'automatic' })}
        scrollIndicatorInsets={{ top: 0 }}
      >
        {/* Statistiques principales */}
        <View style={styles.mainStatsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="flame" size={40} color="#FF6B35" />
            <Text style={[styles.statNumber, { color: mode === 'dark' ? '#FFFFFF' : '#333' }]}>{sobrietyData.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText, textAlign: 'center' }]}>{t('stats.currentStreak')}</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar" size={40} color="#4CAF50" />
            <Text style={[styles.statNumber, { color: mode === 'dark' ? '#FFFFFF' : '#333' }]}>{sobrietyData.totalDays}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText, textAlign: 'center' }]}>{t('stats.totalDays')}</Text>
          </View>
        </View>

        {/* Statistiques de consommation - affichées dans les deux modes */}
        <View style={[styles.consumptionStatsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {detailedConsumptionEnabled ? t('stats.consumptionDetailsTitle') : t('stats.consumptionTitle')}
            </Text>
          </View>
          
          {(() => {
              // Sélectionner les stats selon la période choisie
              let currentStats = consumptionStats;
              let periodLabel = '';
              if (selectedChartPeriod === 'last7Days') {
                currentStats = consumptionStatsLast7Days;
                periodLabel = t('stats.last7Days');
              } else if (selectedChartPeriod === 'last30Days') {
                currentStats = consumptionStatsLast30Days;
                periodLabel = t('stats.last30Days');
              } else {
                periodLabel = t('stats.allTime');
              }

              return currentStats.total > 0 ? (
                <>
                  {/* Sélecteur de période */}
                  <View style={styles.chartSelectorContainer}>
                    <TouchableOpacity
                      style={[
                        styles.chartSelectorButton,
                        {
                          borderColor: selectedChartPeriod === 'all' ? colors.primary : colors.border,
                          backgroundColor: selectedChartPeriod === 'all' 
                            ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setSelectedChartPeriod('all');
                      }}
                    >
                      <Text
                        style={[
                          styles.chartSelectorText,
                          { color: selectedChartPeriod === 'all' ? colors.primary : colors.mutedText },
                        ]}
                      >
                        {t('stats.allTime')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.chartSelectorButton,
                        {
                          borderColor: selectedChartPeriod === 'last7Days' ? colors.primary : colors.border,
                          backgroundColor: selectedChartPeriod === 'last7Days' 
                            ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setSelectedChartPeriod('last7Days');
                      }}
                    >
                      <Text
                        style={[
                          styles.chartSelectorText,
                          { color: selectedChartPeriod === 'last7Days' ? colors.primary : colors.mutedText },
                        ]}
                      >
                        {t('stats.last7Days')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.chartSelectorButton,
                        {
                          borderColor: selectedChartPeriod === 'last30Days' ? colors.primary : colors.border,
                          backgroundColor: selectedChartPeriod === 'last30Days' 
                            ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setSelectedChartPeriod('last30Days');
                      }}
                    >
                      <Text
                        style={[
                          styles.chartSelectorText,
                          { color: selectedChartPeriod === 'last30Days' ? colors.primary : colors.mutedText },
                        ]}
                      >
                        {t('stats.last30Days')}
                      </Text>
            </TouchableOpacity>
        </View>

                  {/* Sélecteur de type de graphique */}
                  <View style={styles.chartSelectorContainer}>
                    <TouchableOpacity
                      style={[
                        styles.chartSelectorButton,
                        {
                          borderColor: selectedChartType === 'pie' ? colors.primary : colors.border,
                          backgroundColor: selectedChartType === 'pie' 
                            ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setSelectedChartType('pie');
                      }}
                    >
                      <Text
                        style={[
                          styles.chartSelectorText,
                          { color: selectedChartType === 'pie' ? colors.primary : colors.mutedText },
                        ]}
                      >
                        {t('stats.chartTypePie')}
            </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.chartSelectorButton,
                        {
                          borderColor: selectedChartType === 'bar' ? colors.primary : colors.border,
                          backgroundColor: selectedChartType === 'bar' 
                            ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setSelectedChartType('bar');
                      }}
                    >
                      <Text
                        style={[
                          styles.chartSelectorText,
                          { color: selectedChartType === 'bar' ? colors.primary : colors.mutedText },
                        ]}
                      >
                        {t('stats.chartTypeBar')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Graphique circulaire */}
                  {selectedChartType === 'pie' && (
              <View style={styles.pieChartContainer}>
                <PieChart
                        data={detailedConsumptionEnabled ? [
                    {
                            value: currentStats.sober,
                      color: '#4CAF50',
                      label: t('stats.sober'),
                    },
                    {
                            value: currentStats.single,
                      color: '#FFC107',
                      label: t('daily.singleDrink'),
                    },
                    {
                            value: currentStats.multiple,
                      color: '#FF9800',
                      label: t('daily.multipleDrinks'),
                    },
                    {
                            value: currentStats.tooMuch,
                      color: '#f44336',
                      label: t('daily.tooMuch'),
                    },
                        ] : [
                          {
                            value: currentStats.sober,
                            color: '#4CAF50',
                            label: t('stats.sober'),
                          },
                          {
                            value: currentStats.consumed,
                            color: '#f44336',
                            label: t('stats.consumed'),
                          },
                        ].filter(item => item.value > 0)}
                  size={140}
                />
                <View style={styles.pieChartLegend}>
                        {(() => {
                          const total = currentStats.total;
                          const percentage = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
                          const legendData = detailedConsumptionEnabled ? [
                    {
                      key: 'sober',
                      color: '#4CAF50',
                      label: t('stats.sober'),
                              count: currentStats.sober,
                              percent: percentage(currentStats.sober),
                    },
                    {
                      key: 'single',
                      color: '#FFC107',
                      label: t('daily.singleDrink'),
                              count: currentStats.single,
                              percent: percentage(currentStats.single),
                    },
                    {
                      key: 'multiple',
                      color: '#FF9800',
                      label: t('daily.multipleDrinks'),
                              count: currentStats.multiple,
                              percent: percentage(currentStats.multiple),
                    },
                    {
                      key: 'too_much',
                      color: '#f44336',
                      label: t('daily.tooMuch'),
                              count: currentStats.tooMuch,
                              percent: percentage(currentStats.tooMuch),
                            },
                          ] : [
                            {
                              key: 'sober',
                              color: '#4CAF50',
                              label: t('stats.sober'),
                              count: currentStats.sober,
                              percent: percentage(currentStats.sober),
                            },
                            {
                              key: 'consumed',
                              color: '#f44336',
                              label: t('stats.consumed'),
                              count: currentStats.consumed,
                              percent: percentage(currentStats.consumed),
                            },
                          ];
                          
                          return legendData
                    .map(option => (
                      <View key={option.key} style={styles.pieChartLegendItem}>
                        <View style={[styles.pieChartLegendBadge, { backgroundColor: option.color }]} />
                        <Text style={[styles.pieChartLegendText, { color: colors.text }]}>
                          {option.label}: {option.percent}%
                        </Text>
                      </View>
                            ));
                        })()}
                </View>
              </View>
                  )}

                  {/* Diagramme en barres */}
                  {selectedChartType === 'bar' && (
                    <View style={styles.chartContentContainer}>
                      <BarChart
                        data={detailedConsumptionEnabled ? [
                          {
                            label: t('stats.sober'),
                            value: currentStats.sober,
                            color: '#4CAF50',
                          },
                          {
                            label: t('daily.singleDrink'),
                            value: currentStats.single,
                            color: '#FFC107',
                          },
                          {
                            label: t('daily.multipleDrinks'),
                            value: currentStats.multiple,
                            color: '#FF9800',
                          },
                          {
                            label: t('daily.tooMuch'),
                            value: currentStats.tooMuch,
                            color: '#f44336',
                          },
                        ] : [
                          {
                            label: t('stats.sober'),
                            value: currentStats.sober,
                            color: '#4CAF50',
                          },
                          {
                            label: t('stats.consumed'),
                            value: currentStats.consumed,
                            color: '#f44336',
                          },
                        ].filter(item => item.value > 0)}
                        height={200}
                        showValues={true}
                        textColor={colors.text}
                        labelColor={colors.mutedText}
                      />
                    </View>
                  )}
                </>
            ) : (
              <Text style={[styles.consumptionEmptyText, { color: colors.mutedText }]}>
                {t('stats.consumptionNone')}
              </Text>
              );
            })()}
        </View>

        {/* Progression (hebdomadaire ou mensuelle) */}
        {((allWeeklyProgressionStats.length > 0 && allWeeklyProgressionStats.some(w => w.total > 0)) || 
          (monthlyProgressionStats.length > 0 && monthlyProgressionStats.some(m => m.total > 0))) && (
          <View style={[styles.progressionContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('stats.progression')}
            </Text>
            
            {/* Sélecteur de type de progression */}
            <View style={styles.progressionSelector}>
              <TouchableOpacity
                style={[
                  styles.progressionSelectorButton,
                  {
                    borderColor: selectedProgressionType === 'weekly' ? colors.primary : colors.border,
                    backgroundColor: selectedProgressionType === 'weekly' 
                      ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  triggerSelection();
                  setSelectedProgressionType('weekly');
                }}
              >
                <Text
                  style={[
                    styles.progressionSelectorButtonText,
                    { color: selectedProgressionType === 'weekly' ? colors.primary : colors.mutedText },
                  ]}
                >
                  {t('stats.weeklyProgression')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.progressionSelectorButton,
                  {
                    borderColor: selectedProgressionType === 'monthly' ? colors.primary : colors.border,
                    backgroundColor: selectedProgressionType === 'monthly' 
                      ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  triggerSelection();
                  setSelectedProgressionType('monthly');
                }}
              >
                <Text
                  style={[
                    styles.progressionSelectorButtonText,
                    { color: selectedProgressionType === 'monthly' ? colors.primary : colors.mutedText },
                  ]}
                >
                  {t('stats.monthlyProgression')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progression hebdomadaire */}
            {selectedProgressionType === 'weekly' && allWeeklyProgressionStats.length > 0 && allWeeklyProgressionStats.some(w => w.total > 0) && (
              <>
                <Text style={[styles.progressionSubtitle, { color: colors.mutedText }]}>
                  {t('stats.weeklyProgressionSubtitle')}
                </Text>
                
                {/* Navigation */}
                <View style={styles.weeklyNavigation}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        borderColor: weeklyProgressionOffset + 7 < allWeeklyProgressionStats.length 
                          ? colors.primary 
                          : colors.border,
                        backgroundColor: weeklyProgressionOffset + 7 < allWeeklyProgressionStats.length
                          ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                          : (mode === 'dark' ? colors.card : '#f5f5f5'),
                        opacity: weeklyProgressionOffset + 7 >= allWeeklyProgressionStats.length ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (weeklyProgressionOffset + 7 < allWeeklyProgressionStats.length) {
                        triggerSelection();
                        setWeeklyProgressionOffset(weeklyProgressionOffset + 7);
                      }
                    }}
                    disabled={weeklyProgressionOffset + 7 >= allWeeklyProgressionStats.length}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={weeklyProgressionOffset + 7 < allWeeklyProgressionStats.length ? colors.primary : colors.mutedText}
                    />
                  </TouchableOpacity>
                  
                  <Text style={[styles.navLabel, { color: colors.mutedText }]}>
                    {allWeeklyProgressionStats.length > 0 && (
                      <>
                        {t('stats.weeks')} {Math.max(1, allWeeklyProgressionStats.length - weeklyProgressionOffset - 6)}-{allWeeklyProgressionStats.length - weeklyProgressionOffset}
                      </>
                    )}
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        borderColor: weeklyProgressionOffset > 0 
                          ? colors.primary 
                          : colors.border,
                        backgroundColor: weeklyProgressionOffset > 0
                          ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                          : (mode === 'dark' ? colors.card : '#f5f5f5'),
                        opacity: weeklyProgressionOffset === 0 ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (weeklyProgressionOffset > 0) {
                        triggerSelection();
                        setWeeklyProgressionOffset(Math.max(0, weeklyProgressionOffset - 7));
                      }
                    }}
                    disabled={weeklyProgressionOffset === 0}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={weeklyProgressionOffset > 0 ? colors.primary : colors.mutedText}
                    />
                  </TouchableOpacity>
                </View>

                {weeklyProgressionStats.length > 0 ? (
                  <>
                    <LineChart
                      data={weeklyProgressionStats.map(w => ({
                        label: w.week,
                        value: w.sober,
                      }))}
                      height={220}
                      color="#4CAF50"
                      showDots={true}
                      showGrid={true}
                    />
                    <View style={styles.progressionStats}>
                      <View style={styles.progressionStatItem}>
                        <Text style={[styles.progressionStatLabel, { color: colors.mutedText }]}>
                          {t('stats.averageWeekly')}
                        </Text>
                        <Text style={[styles.progressionStatValue, { color: colors.text }]}>
                          {Math.round(weeklyProgressionStats.reduce((sum, w) => sum + w.sober, 0) / weeklyProgressionStats.length)} {t('stats.days')}
                        </Text>
                      </View>
                      <View style={styles.progressionStatItem}>
                        <Text style={[styles.progressionStatLabel, { color: colors.mutedText }]}>
                          {t('stats.totalSobriety')}
                        </Text>
                        <Text style={[styles.progressionStatValue, { color: colors.text }]}>
                          {totalSobrietyPercentage}%
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.consumptionEmptyText, { color: colors.mutedText }]}>
                    {t('stats.noDataForPeriod')}
                  </Text>
                )}
              </>
            )}

            {/* Progression mensuelle */}
            {selectedProgressionType === 'monthly' && monthlyProgressionStats.length > 0 && monthlyProgressionStats.some(m => m.total > 0) && (
              <>
                <Text style={[styles.progressionSubtitle, { color: colors.mutedText }]}>
                  {t('stats.monthlyProgressionSubtitle')}
                </Text>
                
                {/* Navigation */}
                <View style={styles.weeklyNavigation}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        borderColor: monthlyProgressionOffset + 6 < monthlyProgressionStats.length 
                          ? colors.primary 
                          : colors.border,
                        backgroundColor: monthlyProgressionOffset + 6 < monthlyProgressionStats.length
                          ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                          : (mode === 'dark' ? colors.card : '#f5f5f5'),
                        opacity: monthlyProgressionOffset + 6 >= monthlyProgressionStats.length ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (monthlyProgressionOffset + 6 < monthlyProgressionStats.length) {
                        triggerSelection();
                        setMonthlyProgressionOffset(monthlyProgressionOffset + 6);
                      }
                    }}
                    disabled={monthlyProgressionOffset + 6 >= monthlyProgressionStats.length}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={monthlyProgressionOffset + 6 < monthlyProgressionStats.length ? colors.primary : colors.mutedText}
                    />
                  </TouchableOpacity>
                  
                  <Text style={[styles.navLabel, { color: colors.mutedText }]}>
                    {monthlyProgressionStats.length > 0 && (
                      <>
                        {t('stats.months')} {Math.max(1, monthlyProgressionStats.length - monthlyProgressionOffset - 5)}-{monthlyProgressionStats.length - monthlyProgressionOffset}
                      </>
                    )}
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        borderColor: monthlyProgressionOffset > 0 
                          ? colors.primary 
                          : colors.border,
                        backgroundColor: monthlyProgressionOffset > 0
                          ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                          : (mode === 'dark' ? colors.card : '#f5f5f5'),
                        opacity: monthlyProgressionOffset === 0 ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (monthlyProgressionOffset > 0) {
                        triggerSelection();
                        setMonthlyProgressionOffset(Math.max(0, monthlyProgressionOffset - 6));
                      }
                    }}
                    disabled={monthlyProgressionOffset === 0}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={monthlyProgressionOffset > 0 ? colors.primary : colors.mutedText}
                    />
                  </TouchableOpacity>
                </View>

                {monthlyProgressionStatsDisplay.length > 0 ? (
                  <>
                    <LineChart
                      data={monthlyProgressionStatsDisplay.map(m => ({
                        label: m.month,
                        value: m.sober,
                      }))}
                      height={220}
                      color="#2196F3"
                      showDots={true}
                      showGrid={true}
                    />
                    <View style={styles.progressionStats}>
                      <View style={styles.progressionStatItem}>
                        <Text style={[styles.progressionStatLabel, { color: colors.mutedText }]}>
                          {t('stats.averageMonthly')}
                        </Text>
                        <Text style={[styles.progressionStatValue, { color: colors.text }]}>
                          {Math.round(monthlyProgressionStatsDisplay.reduce((sum, m) => sum + m.sober, 0) / monthlyProgressionStatsDisplay.length)} {t('stats.days')}
                        </Text>
                      </View>
                      <View style={styles.progressionStatItem}>
                        <Text style={[styles.progressionStatLabel, { color: colors.mutedText }]}>
                          {t('stats.bestMonth')}
                        </Text>
                        <Text style={[styles.progressionStatValue, { color: colors.text }]}>
                          {Math.max(...monthlyProgressionStatsDisplay.map(m => m.sober))} {t('stats.days')}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.consumptionEmptyText, { color: colors.mutedText }]}>
                    {t('stats.noDataForPeriod')}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Statistiques détaillées */}
        <View style={[styles.detailedStatsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('stats.detailedStats')}</Text>
          
          <View style={styles.statRow}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <View style={styles.statInfo}>
              <Text style={[styles.statInfoLabel, { color: mode === 'dark' ? '#FFFFFF' : colors.text }]}>{t('stats.longestStreak')}</Text>
              <Text style={styles.statInfoValue}>{streakStats.longestStreak} {t('stats.days')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                ShareService.shareContent({
                  type: 'streak',
                  currentStreak: streakStats.longestStreak,
                  language,
                });
              }}
              style={styles.statShareButton}
            >
              <Ionicons name="share-social" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="trending-up" size={24} color="#2196F3" />
            <View style={styles.statInfo}>
              <Text style={[styles.statInfoLabel, { color: mode === 'dark' ? '#FFFFFF' : colors.text }]}>{t('stats.averageStreak')}</Text>
              <Text style={styles.statInfoValue}>{streakStats.averageStreak} {t('stats.days')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                ShareService.shareContent({
                  type: 'streak',
                  currentStreak: streakStats.averageStreak,
                  language,
                });
              }}
              style={styles.statShareButton}
            >
              <Ionicons name="share-social" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="calendar-outline" size={24} color="#9C27B0" />
            <View style={styles.statInfo}>
              <Text style={[styles.statInfoLabel, { color: mode === 'dark' ? '#FFFFFF' : colors.text }]}>{t('stats.last7Days')}</Text>
              <Text style={styles.statInfoValue}>
                {weeklyStats.soberDays}/{weeklyStats.totalDays} {t('stats.days')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                triggerSelection();
                const message = language === 'fr'
                  ? `📊 ${weeklyStats.soberDays}/${weeklyStats.totalDays} jours de sobriété sur les 7 derniers jours !\n\n#Sobriété #Progression #7Jours`
                  : `📊 ${weeklyStats.soberDays}/${weeklyStats.totalDays} days of sobriety in the last 7 days!\n\n#Sobriety #Progress #7Days`;
                await Share.share({ message, title: language === 'fr' ? 'Partager ma progression' : 'Share my progress' });
              }}
              style={styles.statShareButton}
            >
              <Ionicons name="share-social" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="calendar" size={24} color="#FF9800" />
            <View style={styles.statInfo}>
              <Text style={[styles.statInfoLabel, { color: mode === 'dark' ? '#FFFFFF' : colors.text }]}>{t('stats.last30Days')}</Text>
              <Text style={styles.statInfoValue}>
                {monthlyStats.soberDays}/{monthlyStats.totalDays} {t('stats.days')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                triggerSelection();
                const message = language === 'fr'
                  ? `📊 ${monthlyStats.soberDays}/${monthlyStats.totalDays} jours de sobriété sur les 30 derniers jours !\n\n#Sobriété #Progression #30Jours`
                  : `📊 ${monthlyStats.soberDays}/${monthlyStats.totalDays} days of sobriety in the last 30 days!\n\n#Sobriety #Progress #30Days`;
                await Share.share({ message, title: language === 'fr' ? 'Partager ma progression' : 'Share my progress' });
              }}
              style={styles.statShareButton}
            >
              <Ionicons name="share-social" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Challenges */}
        <View style={[styles.milestonesContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('stats.achievedMilestones')}</Text>
          {sobrietyData.milestones
            .filter(m => Boolean(m.achieved))
            .map(milestone => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneName, { color: mode === 'dark' ? '#FFFFFF' : colors.text }]}>{getLocalizedMilestoneName(milestone as any)}</Text>
                  <Text style={[styles.milestoneDate, { color: colors.mutedText }]}>
                    {milestone.achievedDate
                      ? t('stats.achievedOn', { date: new Date(milestone.achievedDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') })
                      : t('stats.unknownDate')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    triggerSelection();
                    ShareService.shareMilestone(getLocalizedMilestoneName(milestone as any), milestone.daysRequired, language);
                  }}
                  style={styles.milestoneShareButton}
                >
                  <Ionicons name="share-social" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          
          {sobrietyData.milestones.filter(m => Boolean(m.achieved)).length === 0 && (
            <Text style={styles.noMilestonesText}>{t('stats.noMilestones')}</Text>
          )}
        </View>

        {/* Historique récent */}
        <View style={[styles.historyContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('stats.recentHistory')}</Text>
          {dailyChecks.slice(-historyDisplayCount).reverse().map((check, index) => {
            const isSober = Boolean(check.sober);
            let iconColor = isSober ? "#4CAF50" : "#f44336";
            // Si l'option de consommation détaillée est activée, utiliser les couleurs détaillées
            if (Boolean(detailedConsumptionEnabled) && !isSober && check.consumptionLevel) {
              switch (check.consumptionLevel) {
                case 'single_drink': iconColor = '#FFC107'; break;
                case 'multiple_drinks': iconColor = '#FF9800'; break;
                case 'too_much': iconColor = '#f44336'; break;
              }
            }
            return (
              <View key={index} style={styles.historyItem}>
                <Ionicons 
                  name={isSober ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={iconColor} 
                />
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyDate, { color: mode === 'dark' ? '#FFFFFF' : colors.text }]}>
                    {new Date(check.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </Text>
                  <Text style={[styles.historyStatus, { color: colors.mutedText }]}>
                    {check.notes 
                      ? check.notes 
                      : (isSober 
                          ? t('stats.sober') 
                          : (Boolean(detailedConsumptionEnabled) && check.consumptionLevel
                              ? (check.consumptionLevel === 'single_drink'
                                  ? t('daily.singleDrink')
                                  : check.consumptionLevel === 'multiple_drinks'
                                  ? t('daily.multipleDrinks')
                                  : t('daily.tooMuch')
                                )
                              : t('stats.consumption')
                            )
                        )
                    }
                  </Text>
                </View>
              </View>
            );
          })}
          
          {dailyChecks.length === 0 && (
            <Text style={styles.noHistoryText}>{t('stats.noHistory')}</Text>
          )}

          {/* Boutons de navigation */}
          <View style={styles.historyButtonsContainer}>
            {/* Bouton "Voir moins" si il y a plus de 10 éléments affichés */}
            {historyDisplayCount > 10 && (
              <TouchableOpacity
                style={[styles.loadMoreButton, styles.loadLessButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary }]}
                onPress={() => {
                  triggerSelection();
                  setHistoryDisplayCount(10);
                }}
              >
                <Text style={[styles.loadMoreButtonText, { color: colors.primary }]}>{t('stats.seeLess')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Bouton "Voir plus" si il reste des jours à afficher */}
            {dailyChecks.length > historyDisplayCount && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  triggerSelection();
                  setHistoryDisplayCount(prev => Math.min(prev + 10, dailyChecks.length));
                }}
              >
                <Text style={styles.loadMoreButtonText}>{t('stats.seeMore')}</Text>
              </TouchableOpacity>
            )}
            </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailedStatsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elapsedCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
    width: '100%',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
    flexShrink: 0,
  },
  elapsedRow: {
    borderRadius: 12,
    marginVertical: 6,
  },
  elapsedBarBg: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    height: 42,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  elapsedBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  elapsedTextWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  elapsedValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  elapsedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  statInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statInfoLabel: {
    fontSize: 16,
    color: '#333',
  },
  statInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
  },
  milestonesContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  milestoneShareButton: {
    padding: 4,
    marginLeft: 8,
  },
  milestoneInfo: {
    marginLeft: 15,
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  milestoneDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noMilestonesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consumptionStatsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
    flexWrap: 'wrap',
  },
  pieChartLegend: {
    flex: 1,
    gap: 8,
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pieChartLegendBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieChartLegendText: {
    fontSize: 14,
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyInfo: {
    marginLeft: 15,
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  historyStatus: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
    fontStyle: 'italic',
  },
  consumptionSubtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartSelectorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  chartSelectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  chartSelectorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartContentContainer: {
    marginTop: 10,
  },
  progressionSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  progressionSelectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  progressionSelectorButtonText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressionSubtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  progressionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressionStatItem: {
    alignItems: 'center',
  },
  progressionStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressionStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weeklyNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  consumptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  consumptionBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  consumptionInfo: {
    flex: 1,
  },
  consumptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  consumptionValue: {
    fontSize: 14,
    marginTop: 2,
  },
  consumptionEmptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noHistoryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  historyButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  loadMoreButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadLessButton: {
    flex: 1,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
