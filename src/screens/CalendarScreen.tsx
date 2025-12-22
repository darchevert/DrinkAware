import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SobrietyData, DailyCheck, Milestone, ConsumptionLevel } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';
import { useT, useLanguage } from '../i18n/i18n';
import { useTheme } from '../theme/Theme';
import { translations } from '../i18n/translations';
import { triggerImpact, triggerSelection } from '../utils/Haptics';

interface CalendarScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calcul de la taille des jours : largeur écran - padding content (20*2) - padding monthContainer (20*2) - marges entre jours (1*2*7) / 7 jours
const DAY_SIZE = Math.max(35, Math.floor((SCREEN_WIDTH - 40 - 40 - 14) / 7)); // Minimum 35px pour les petits écrans

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const t = useT();
  const { language } = useLanguage();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarMonths, setCalendarMonths] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number } | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [detailedConsumptionEnabled, setDetailedConsumptionEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const DETAILED_CONSUMPTION_KEY = 'detailed_consumption_enabled';
  
  const closeCheckModal = () => {
    setSelectedDate('');
  };

  useEffect(() => {
    // Initialiser avec le mois actuel
    const today = new Date();
    setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() + 1 });
    loadStartDate();
    loadData();
  }, []);

  const loadStartDate = async () => {
    try {
      const sobrietyData = await StorageService.loadSobrietyData();
      if (sobrietyData && sobrietyData.startDate) {
        setStartDate(new Date(sobrietyData.startDate));
      } else {
        // Si pas de date d'initialisation, utiliser aujourd'hui
        setStartDate(new Date());
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la date d\'initialisation:', error);
      setStartDate(new Date());
    }
  };

  useEffect(() => {
    if (currentMonth) {
      loadCalendarMonth(currentMonth.year, currentMonth.month);
    }
  }, [currentMonth]);

  // Recharger les données quand l'écran devient actif (après réinitialisation)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const checks = await StorageService.loadDailyChecks();
      setDailyChecks(checks || []);
      const detailedPref = await AsyncStorage.getItem(DETAILED_CONSUMPTION_KEY);
      setDetailedConsumptionEnabled(detailedPref === 'true');
    } catch (error) {
      console.error('Erreur lors du chargement des vérifications:', error);
      setDailyChecks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarMonth = async (year: number, month: number) => {
    try {
      const monthData = await generateCalendarMonth(year, month);
      setCalendarMonths([monthData]);
    } catch (error) {
      console.error('Erreur lors du chargement du mois:', error);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString: string) => {
    // Éviter les problèmes de fuseau horaire en créant la date explicitement
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 car les mois commencent à 0
    
    console.log('formatDate - Input:', dateString, 'Parsed:', {year, month, day}, 'Date object:', date);
    
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateStatus = (date: string) => {
    const check = dailyChecks.find(c => c.date === date);
    if (!check) return 'none';
    return Boolean(check.sober) ? 'sober' : 'consumed';
  };

  const getDateStatusColor = (date: string) => {
    const check = dailyChecks.find(c => c.date === date);
    if (!check) return '#e0e0e0';
    if (Boolean(check.sober)) return '#4CAF50';
    
    // Si l'option de consommation détaillée est désactivée, tout en rouge
    if (!detailedConsumptionEnabled) {
      return '#f44336';
    }
    
    // Couleurs selon le niveau de consommation (seulement si l'option est activée)
    if (check.consumptionLevel) {
      switch (check.consumptionLevel) {
        case 'single_drink': return '#FFC107'; // Jaune
        case 'multiple_drinks': return '#FF9800'; // Orange
        case 'too_much': return '#f44336'; // Rouge
        default: return '#f44336';
      }
    }
    // Par défaut, rouge si consommation sans niveau spécifié
    return '#f44336';
  };

  const getDateStatusIcon = (date: string) => {
    const status = getDateStatus(date);
    switch (status) {
      case 'sober': return 'checkmark-circle';
      case 'consumed': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  const generateCalendarMonth = async (year: number, month: number) => {
    const today = new Date();
    const todayString = getTodayString();
    
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const monthDate = new Date(year, month - 1, 1); // month - 1 car les mois commencent à 0
    const monthName = monthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    
    // Premier jour du mois
    const firstDay = new Date(year, month - 1, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month, 0);
    
    // Trouver le lundi de la première semaine
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Dimanche = 0, donc -6 pour aller au lundi précédent
    startDate.setDate(firstDay.getDate() + mondayOffset);
    
    // Trouver le dimanche de la dernière semaine
    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    endDate.setDate(lastDay.getDate() + sundayOffset);
    
    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = getDateString(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month - 1;
      const isToday = dateString === todayString;
      
      currentWeek.push({
        date: dateString,
        day: currentDate.getDate(),
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isCurrentMonth,
        isToday,
        dayOfWeek: currentDate.getDay()
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      name: monthName,
      weeks,
      year,
      month
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!currentMonth) return;
    
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    
    // Limite minimale : 1 an avant aujourd'hui
    const minYear = todayYear - 1;
    
    let newYear = currentMonth.year;
    let newMonth = currentMonth.month;
    
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      
      // Empêcher la navigation avant 1 an avant aujourd'hui
      if (newYear < minYear || (newYear === minYear && newMonth < todayMonth)) {
        return;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
      
      // Empêcher la navigation au-delà du mois courant
      if (newYear > todayYear || (newYear === todayYear && newMonth > todayMonth)) {
        return;
      }
    }
    
    setCurrentMonth({ year: newYear, month: newMonth });
  };

  const handleDateSelect = (date: string) => {
    try {
      triggerSelection();
    } catch (error) {
      // Ignorer les erreurs haptics
    }
    const today = getTodayString();
    
    // Empêcher la sélection des jours futurs
    if (date > today) {
      Alert.alert(
        t('calendar.futureDateTitle'),
        t('calendar.futureDateMsg'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    setSelectedDate(date);
    navigation.navigate('CheckIn', { date });
  };

  const updateStatistics = async () => {
    try {
      await StorageService.recalculateStatistics();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
  };

  const getLocalizedMilestoneName = (m: Milestone) => {
    const idToKey: Record<string, string> = {
      '1': 'milestones.m1_name','2': 'milestones.m2_name','3': 'milestones.m3_name','4': 'milestones.m4_name',
      '5': 'milestones.m5_name','6': 'milestones.m6_name','7': 'milestones.m7_name','8': 'milestones.m8_name',
      '9': 'milestones.m9_name','10': 'milestones.m10_name','11': 'milestones.m11_name','12': 'milestones.m12_name',
      '13': 'milestones.m13_name','14': 'milestones.m14_name','15': 'milestones.m15_name','16': 'milestones.m16_name',
      '17': 'milestones.m17_name','18': 'milestones.m18_name','19': 'milestones.m19_name','20': 'milestones.m20_name',
      '21': 'milestones.m21_name','22': 'milestones.m22_name','23': 'milestones.m23_name','24': 'milestones.m24_name',
      '25': 'milestones.m25_name','26': 'milestones.m26_name','27': 'milestones.m27_name','28': 'milestones.m28_name',
      '29': 'milestones.m29_name','30': 'milestones.m30_name',
    };
    const key = idToKey[m.id];
    return key ? t(key as any) : m.name;
  };

  const getLocalizedMilestoneDesc = (id: string) => {
    const idToKey: Record<string, string> = {
      '1': 'milestones.m1_desc','2': 'milestones.m2_desc','3': 'milestones.m3_desc','4': 'milestones.m4_desc',
      '5': 'milestones.m5_desc','6': 'milestones.m6_desc','7': 'milestones.m7_desc','8': 'milestones.m8_desc',
      '9': 'milestones.m9_desc','10': 'milestones.m10_desc','11': 'milestones.m11_desc','12': 'milestones.m12_desc',
      '13': 'milestones.m13_desc','14': 'milestones.m14_desc','15': 'milestones.m15_desc','16': 'milestones.m16_desc',
      '17': 'milestones.m17_desc','18': 'milestones.m18_desc','19': 'milestones.m19_desc','20': 'milestones.m20_desc',
      '21': 'milestones.m21_desc','22': 'milestones.m22_desc','23': 'milestones.m23_desc','24': 'milestones.m24_desc',
      '25': 'milestones.m25_desc','26': 'milestones.m26_desc','27': 'milestones.m27_desc','28': 'milestones.m28_desc',
      '29': 'milestones.m29_desc','30': 'milestones.m30_desc',
    };
    const key = idToKey[id];
    return key ? t(key as any) : '';
  };

  const handleDeleteCheck = () => {
    triggerSelection();
    if (!selectedDate) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    triggerImpact();
    try {
      await StorageService.deleteDailyCheck(selectedDate);
      await updateStatistics(); // Mettre à jour les statistiques
      await loadData();
      closeCheckModal();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const cancelDelete = () => {
    triggerSelection();
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

          // Les mois du calendrier sont maintenant chargés dans l'état calendarMonths

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView 
        style={[styles.scrollView, { marginTop: insets.top }]} 
        showsVerticalScrollIndicator={Boolean(false)}
        contentContainerStyle={{ paddingTop: 20 }}
        {...(Platform.OS === 'ios' && { contentInsetAdjustmentBehavior: 'automatic' })}
        scrollIndicatorInsets={{ top: 0 }}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{t('calendar.historyTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{t('calendar.historySubtitle')}</Text>


          {calendarMonths.map((month, monthIndex) => {
            const today = new Date();
            const todayYear = today.getFullYear();
            const todayMonth = today.getMonth() + 1;
            
            // Limites : 1 an avant aujourd'hui (pas de navigation après le mois courant)
            const minYear = todayYear - 1;
            
            // Vérifier si on peut naviguer vers le mois suivant (jusqu'au mois courant inclus)
            let canNavigateNext = false;
            if (currentMonth) {
              // Simuler le mois suivant
              let nextMonth = currentMonth.month + 1;
              let nextYear = currentMonth.year;
              if (nextMonth > 12) {
                nextMonth = 1;
                nextYear++;
              }
              // Vérifier si le mois suivant ne dépasse pas le mois courant
              canNavigateNext = Boolean(nextYear < todayYear || (nextYear === todayYear && nextMonth <= todayMonth));
            }
            
            // Vérifier si on peut naviguer vers le mois précédent (min 1 an avant aujourd'hui)
            let canNavigatePrev = false;
            if (currentMonth) {
              // Simuler le mois précédent
              let prevMonth = currentMonth.month - 1;
              let prevYear = currentMonth.year;
              if (prevMonth < 1) {
                prevMonth = 12;
                prevYear--;
              }
              // Vérifier si le mois précédent est dans les limites
              canNavigatePrev = Boolean(prevYear > minYear || (prevYear === minYear && prevMonth >= todayMonth));
            }
            
            return (
              <View key={`${month.year}-${month.month}`} style={[styles.monthContainer, { backgroundColor: colors.card }]}>
                <View style={styles.monthHeader}>
                  <TouchableOpacity
                    onPress={() => navigateMonth('prev')}
                    style={[styles.navButton, !canNavigatePrev && styles.navButtonDisabled]}
                    disabled={!Boolean(canNavigatePrev)}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={24} 
                      color={canNavigatePrev ? colors.primary : colors.mutedText} 
                    />
                  </TouchableOpacity>
                  <Text style={[styles.monthTitle, { color: colors.text }]}>{month.name}</Text>
                  <TouchableOpacity
                    onPress={() => navigateMonth('next')}
                    style={[styles.navButton, !canNavigateNext && styles.navButtonDisabled]}
                    disabled={!Boolean(canNavigateNext)}
                  >
                    <Ionicons 
                      name="chevron-forward" 
                      size={24} 
                      color={canNavigateNext ? colors.primary : colors.mutedText} 
                    />
                  </TouchableOpacity>
                </View>
              
              {/* En-têtes des jours */}
              <View style={styles.weekHeader}>
                {translations[language].calendar.weekdayHeaders.map((day: string, index: number) => (
                  <Text key={index} style={styles.dayHeader}>{day}</Text>
                ))}
              </View>
              
              {/* Semaines du mois */}
              {month.weeks.map((week: any, weekIndex: number) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((day: any, dayIndex: number) => {
                    const today = getTodayString();
                    const isFutureDay = Boolean(day.date > today);
                    
                    return (
                      <TouchableOpacity
                        key={day.date}
                        style={[
                          styles.calendarDay,
                          day.isToday && styles.todayDay,
                          !day.isCurrentMonth && styles.otherMonthDay,
                          isFutureDay && styles.futureDay,
                          { backgroundColor: isFutureDay 
                            ? '#f0f0f0' 
                            : (day.isCurrentMonth ? getDateStatusColor(day.date) : '#f8f8f8') 
                          }
                        ]}
                        onPress={() => handleDateSelect(day.date)}
                        disabled={Boolean(isFutureDay)}
                      >
                        <Ionicons
                          name={getDateStatusIcon(day.date) as any}
                          size={16}
                          color={isFutureDay 
                            ? '#ccc' 
                            : (day.isCurrentMonth 
                              ? (day.isToday ? '#fff' : (getDateStatus(day.date) === 'none' ? '#666' : '#fff'))
                              : '#ccc'
                            )
                          }
                        />
                        <Text style={[
                          styles.dayNumber,
                          { 
                            color: isFutureDay 
                              ? '#ccc' 
                              : (day.isCurrentMonth 
                                ? (day.isToday ? '#fff' : (getDateStatus(day.date) === 'none' ? '#666' : '#fff'))
                                : '#ccc'
                              )
                          }
                        ]}>
                          {day.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              </View>
            );
          })}

          <View style={[styles.legend, { backgroundColor: colors.card }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>{t('calendar.sober')}</Text>
            </View>
            {detailedConsumptionEnabled ? (
              <>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
                  <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>{t('daily.singleDrink')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                  <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>{t('daily.multipleDrinks')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
                  <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>{t('daily.tooMuch')}</Text>
                </View>
              </>
            ) : (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
                <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>{t('calendar.consumed')}</Text>
              </View>
            )}
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e0e0e0' }]} />
              <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>{t('calendar.unchecked')}</Text>
            </View>
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
  },
  content: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  monthContainer: {
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 0,
    width: '100%',
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
    textAlign: 'center',
    minWidth: 0,
    maxWidth: DAY_SIZE,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 0,
    width: '100%',
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: DAY_SIZE,
    maxHeight: DAY_SIZE,
    minWidth: 35,
    minHeight: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  futureDay: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    rowGap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
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
    padding: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  animationModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minWidth: 280,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  soberButton: {
    backgroundColor: '#4CAF50',
  },
  consumedButton: {
    backgroundColor: '#f44336',
  },
  validateButton: {
    backgroundColor: '#4CAF50',
    marginTop: 10,
  },
  validateButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  selectedStatusButton: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 14,
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  deleteConfirmButton: {
    backgroundColor: '#f44336',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
