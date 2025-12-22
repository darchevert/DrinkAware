import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { SobrietyData, Milestone, DailyCheck, ConsumptionLevel } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';
import FadeInView, { SlideInView, BounceInView, PulseView } from '../components/Animations';
import { useT, useLanguage } from '../i18n/i18n';
import { translations } from '../i18n/translations';
import { buildDefaultMilestones } from '../utils/milestones';
import { useTheme } from '../theme/Theme';
import { ShareService } from '../utils/ShareService';
import { triggerImpact, triggerSelection } from '../utils/Haptics';
import { WidgetService } from '../utils/WidgetService';

interface HomeScreenProps {
  navigation: any;
}

// Milestones seront construits dynamiquement via i18n

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const t = useT();
  const { language } = useLanguage();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const defaultMilestones = React.useMemo(() => buildDefaultMilestones(t), [t]);
  const [sobrietyData, setSobrietyData] = useState<SobrietyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayCheck, setTodayCheck] = useState<DailyCheck | null>(null);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [detailedConsumptionEnabled, setDetailedConsumptionEnabled] = useState(false);
  const [showDailyCheckModal, setShowDailyCheckModal] = useState(false);

  const DETAILED_CONSUMPTION_KEY = 'detailed_consumption_enabled';

  const DAILY_MESSAGES: string[] = translations[language].home.dailyMessages as unknown as string[];

  const getDailyMessage = () => {
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const index = daysSinceEpoch % DAILY_MESSAGES.length;
    return DAILY_MESSAGES[index];
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  const getStartDate = () => {
    if (!dailyChecks || dailyChecks.length === 0) return '';
    
    // Trouver la date la plus ancienne parmi toutes les vérifications
    const sortedChecks = [...dailyChecks].sort((a, b) => a.date.localeCompare(b.date));
    const oldestCheck = sortedChecks[0];
    
    if (oldestCheck) {
      const startDate = new Date(oldestCheck.date);
      const locale = language === 'fr' ? 'fr-FR' : 'en-US';
      return startDate.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    return '';
  };

  const renderCircularProgress = (
    value: number,
    max: number,
    label: string,
    color: string,
    size: number,
  ) => {
    const strokeWidth = 6;
    const padding = strokeWidth + 4;
    const radius = (size - padding * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const strokeDashoffset = circumference * (1 - progress);
    const center = size / 2;

    // Couleur de fond du cercle (plus claire)
    const bgColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    // Formater la valeur (pour les années, on peut avoir plus de 2 chiffres)
    const displayValue = value > 99 ? String(value) : String(value).padStart(2, '0');
    
    // Calculer la taille de police en fonction de la taille du cercle et du nombre de chiffres
    const textSize = size < 60 ? 16 : size < 70 ? 18 : size < 80 ? 20 : 22;
    const labelSize = size < 60 ? 8 : size < 70 ? 9 : 10;

    return (
      <View key={label} style={[styles.circularProgressContainer, { width: size }]}>
        <View style={{ width: size, height: size, position: 'relative' }}>
          <Svg width={size} height={size} style={styles.circularProgressSvg}>
            {/* Cercle de fond */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={bgColor}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Cercle de progression */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>
          {/* Nombre au centre */}
          <View style={[styles.circularProgressTextContainer, { width: size, height: size }]}>
            <Text 
              style={[
                styles.circularProgressValue, 
                { 
                  color: colors.text, 
                  fontSize: textSize,
                  lineHeight: textSize * 1.2,
                }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {displayValue}
            </Text>
          </View>
        </View>
        {/* Label en dessous du cercle */}
        <View style={{ marginTop: 6, alignItems: 'center', width: '100%' }}>
          <Text 
            style={[
              styles.circularProgressLabel, 
              { 
                color: colors.mutedText, 
                fontSize: labelSize,
              }
            ]}
          >
            {label.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const initialize = async () => {
      await loadData();
      await initializeNotifications();
      // Vérifier la popup au chargement initial après que les données soient chargées
      await checkAndShowDailyCheckModal();
    };
    initialize();
  }, []);

  // Recharger les données quand l'utilisateur revient sur cet écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      loadData();
      // Vérifier et afficher la popup de vérification quotidienne à chaque retour sur l'écran
      checkAndShowDailyCheckModal();
      // Nettoyer les flags d'animation s'ils existent (plus utilisés)
      try {
          await AsyncStorage.removeItem('PLAY_MILESTONE_ANIM');
            await AsyncStorage.removeItem('PLAY_SUCCESS_ANIM');
      } catch {}
    });
    return unsubscribe;
  }, [navigation]);

  // Calculer le temps écoulé depuis la dernière consommation (mis à jour en temps réel)
  const [elapsed, setElapsed] = useState({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  const calculateElapsed = () => {
    if (!sobrietyData?.startDate) {
      return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const startDate = new Date(sobrietyData.startDate);

    const now = new Date();
    const diff = now.getTime() - startDate.getTime();

    if (diff < 0) {
      return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { years, days, hours, minutes, seconds };
  };

  // Mise à jour en temps réel
  useEffect(() => {
    if (!sobrietyData?.startDate) return;

    // Calculer immédiatement
    setElapsed(calculateElapsed());

    // Mettre à jour chaque seconde
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [sobrietyData?.startDate]);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  };

  const checkAndShowDailyCheckModal = async () => {
    try {
      // Recharger les données pour être sûr d'avoir les dernières vérifications
      const checks = await StorageService.loadDailyChecks();
      const today = getTodayString();
      const todayCheckData = checks.find(check => check.date === today);
      
      // Si la vérification n'a pas été faite aujourd'hui
      if (!todayCheckData) {
        const lastShownDate = await AsyncStorage.getItem('daily_check_modal_shown_date');
        
        // Si on n'a pas encore montré la popup aujourd'hui, l'afficher
        if (lastShownDate !== today) {
          // Utiliser setTimeout pour s'assurer que le chargement est terminé
          setTimeout(() => {
            setShowDailyCheckModal(true);
            AsyncStorage.setItem('daily_check_modal_shown_date', today);
          }, 500);
        }
      } else {
        // Si la vérification a été faite, s'assurer que la popup est fermée
        setShowDailyCheckModal(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la popup quotidienne:', error);
    }
  };

  const loadData = async () => {
    try {
      const data = await StorageService.loadSobrietyData();
      const checks = await StorageService.loadDailyChecks();
      const detailedPref = await AsyncStorage.getItem(DETAILED_CONSUMPTION_KEY);
      
      setDailyChecks(checks || []);
      setDetailedConsumptionEnabled(detailedPref === 'true');
      
      // Toujours recalculer pour garantir la cohérence des compteurs
      await StorageService.recalculateStatistics();
      const refreshedData = await StorageService.loadSobrietyData();

      if (refreshedData) {
        setSobrietyData(refreshedData);
      } else {
        // Initialiser les données par défaut
        const defaultData: SobrietyData = {
          startDate: new Date().toISOString(),
          currentStreak: 0,
          totalDays: 0,
          lastCheckDate: '',
          milestones: defaultMilestones,
        };
        setSobrietyData(defaultData);
        await StorageService.saveSobrietyData(defaultData);
      }

      // Vérifier s'il y a une vérification pour aujourd'hui
      const today = getTodayString();
      console.log('HomeScreen - Date d\'aujourd\'hui:', today);
      const todayCheckData = checks.find(check => check.date === today);
      setTodayCheck(todayCheckData || null);

      // Mettre à jour le widget
      await WidgetService.updateWidget();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheck = () => {
    triggerImpact();
    setShowDailyCheckModal(false);
    const today = getTodayString();
    navigation.navigate('CheckIn', { date: today });
  };
  
  const handleSkipDailyCheck = () => {
    triggerSelection();
    setShowDailyCheckModal(false);
  };

  const getProgressPercentage = () => {
    if (!sobrietyData) return 0;
    const nextMilestone = sobrietyData.milestones.find(m => !Boolean(m.achieved));
    if (!nextMilestone) return 100;
    return Math.min((sobrietyData.currentStreak / nextMilestone.daysRequired) * 100, 100);
  };

  const getNextMilestone = () => {
    if (!sobrietyData) return null;
    return sobrietyData.milestones.find(m => !Boolean(m.achieved));
  };

  const getLocalizedMilestoneName = (m: Milestone) => {
    // Map by id when possible
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
      '10': 'milestones.m10_name',
      '11': 'milestones.m11_name',
      '12': 'milestones.m12_name',
      '13': 'milestones.m13_name',
      '14': 'milestones.m14_name',
      '15': 'milestones.m15_name',
      '16': 'milestones.m16_name',
      '17': 'milestones.m17_name',
      '18': 'milestones.m18_name',
      '19': 'milestones.m19_name',
      '20': 'milestones.m20_name',
      '21': 'milestones.m21_name',
      '22': 'milestones.m22_name',
      '23': 'milestones.m23_name',
      '24': 'milestones.m24_name',
      '25': 'milestones.m25_name',
      '26': 'milestones.m26_name',
      '27': 'milestones.m27_name',
      '28': 'milestones.m28_name',
      '29': 'milestones.m29_name',
      '30': 'milestones.m30_name',
    };
    const key = idToKey[m.id];
    return key ? t(key as any) : m.name;
  };

  const getLocalizedMilestoneDesc = (id: string) => {
    const idToKey: Record<string, string> = {
      '1': 'milestones.m1_desc', '2': 'milestones.m2_desc', '3': 'milestones.m3_desc', '4': 'milestones.m4_desc',
      '5': 'milestones.m5_desc', '6': 'milestones.m6_desc', '7': 'milestones.m7_desc', '8': 'milestones.m8_desc',
      '9': 'milestones.m9_desc', '10': 'milestones.m10_desc', '11': 'milestones.m11_desc', '12': 'milestones.m12_desc',
      '13': 'milestones.m13_desc', '14': 'milestones.m14_desc', '15': 'milestones.m15_desc', '16': 'milestones.m16_desc',
      '17': 'milestones.m17_desc', '18': 'milestones.m18_desc', '19': 'milestones.m19_desc', '20': 'milestones.m20_desc',
      '21': 'milestones.m21_desc', '22': 'milestones.m22_desc', '23': 'milestones.m23_desc', '24': 'milestones.m24_desc',
      '25': 'milestones.m25_desc', '26': 'milestones.m26_desc', '27': 'milestones.m27_desc', '28': 'milestones.m28_desc',
      '29': 'milestones.m29_desc', '30': 'milestones.m30_desc',
    };
    const key = idToKey[id];
    return key ? t(key as any) : '';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
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

  const nextMilestone = getNextMilestone();
  const progressPercentage = getProgressPercentage();
  const dailyMessage = getDailyMessage();
  const getNextMilestoneDate = () => {
    if (!sobrietyData) return '';
    const m = nextMilestone;
    if (!m) return '';
    const remaining = Math.max(0, m.daysRequired - sobrietyData.currentStreak);
    const target = new Date();
    target.setDate(target.getDate() + remaining);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return target.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView 
        style={[styles.scrollView, { marginTop: insets.top }]} 
        showsVerticalScrollIndicator={Boolean(false)}
        contentContainerStyle={{ 
          paddingBottom: 80 + Math.max(insets.bottom, 8),
          paddingTop: 20, // Padding initial en haut
        }}
        {...(Platform.OS === 'ios' && { contentInsetAdjustmentBehavior: 'automatic' })}
        scrollIndicatorInsets={{ top: 0 }}
      >
        {/* Compteur principal */}
        <BounceInView delay={200}>
          <View style={[styles.counterContainer, { backgroundColor: colors.card }] }>
            <PulseView>
              <Text style={styles.counterNumber}>{sobrietyData.currentStreak}</Text>
            </PulseView>
            <Text style={[styles.counterLabel, { color: colors.mutedText }]}>{t('home.daysOfSobriety')}</Text>
            <View style={styles.totalDaysContainer}>
              <Text style={[styles.totalDays, { color: colors.mutedText }]}>{sobrietyData.totalDays} {t('home.totalDays')}</Text>
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  ShareService.shareStats({
                    currentStreak: sobrietyData.currentStreak,
                    totalDays: sobrietyData.totalDays,
                  }, language);
                }}
                style={styles.shareButtonInline}
              >
                <Ionicons name="share-social" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {getStartDate() && (
              <Text style={[styles.startDate, { color: colors.mutedText }]}>{t('home.since', { date: getStartDate() })}</Text>
            )}
          </View>
        </BounceInView>

        {/* Temps depuis la dernière consommation */}
        <SlideInView direction="up" delay={300}>
          <View style={[styles.elapsedCard, { backgroundColor: colors.card }]}>
            <View style={styles.elapsedHeader}>
              <Text style={[styles.elapsedTitle, { color: colors.text }]}>{t('stats.elapsedSinceLast')}</Text>
            </View>
            <View style={styles.circularProgressRow}>
              {elapsed.years > 0 && renderCircularProgress(
                elapsed.years,
                100,
                t('stats.years'),
                colors.primary,
                Math.min((SCREEN_WIDTH - 60) / 5, 75)
              )}
              {renderCircularProgress(
                elapsed.days,
                365,
                t('stats.days'),
                colors.primary,
                Math.min((SCREEN_WIDTH - 60) / (elapsed.years > 0 ? 5 : 4), 75)
              )}
              {renderCircularProgress(
                elapsed.hours,
                24,
                t('stats.hours'),
                colors.primary,
                Math.min((SCREEN_WIDTH - 60) / (elapsed.years > 0 ? 5 : 4), 75)
              )}
              {renderCircularProgress(
                elapsed.minutes,
                60,
                t('stats.minutes'),
                colors.primary,
                Math.min((SCREEN_WIDTH - 60) / (elapsed.years > 0 ? 5 : 4), 75)
              )}
              {renderCircularProgress(
                elapsed.seconds,
                60,
                t('stats.seconds'),
                colors.primary,
                Math.min((SCREEN_WIDTH - 60) / (elapsed.years > 0 ? 5 : 4), 75)
              )}
            </View>
          </View>
        </SlideInView>

        {/* Barre de progression */}
        <SlideInView direction="up" delay={400}>
          <View style={[styles.progressContainer, { backgroundColor: colors.card }] }>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>{t('home.nextMilestone')}</Text>
              <Text style={styles.progressSubtitle}>
                {nextMilestone ? `${getLocalizedMilestoneName(nextMilestone)} (${nextMilestone.daysRequired} ${t('common.days')})` : t('home.allMilestonesReached')}
              </Text>
            {nextMilestone && (
              <Text style={[styles.startDate, { color: colors.mutedText }]}>le {getNextMilestoneDate()}</Text>
            )}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedText }]}>
              {nextMilestone ? t('home.daysRemaining', { days: nextMilestone.daysRequired - sobrietyData.currentStreak }) : '🎉'}
            </Text>
          </View>
        </SlideInView>

        {/* Section personnage supprimée */}

        {/* Challenges récents */}
        <View style={[styles.milestonesContainer, { backgroundColor: colors.card }] }>
          <View style={styles.milestonesHeader}>
            <Text style={[styles.milestonesTitle, { color: colors.text }]}>{t('home.milestonesTitle')}</Text>
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                ShareService.shareStreak(sobrietyData.currentStreak, language);
              }}
              style={styles.milestoneShareButton}
            >
              <Ionicons name="share-social" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {sobrietyData.milestones
            .filter(m => Boolean(m.achieved))
            .slice(-3)
            .map(milestone => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={[styles.milestoneText, { color: colors.text }]}>{getLocalizedMilestoneName(milestone)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerSelection();
                    ShareService.shareMilestone(getLocalizedMilestoneName(milestone), milestone.daysRequired, language);
                  }}
                  style={styles.milestoneShareButton}
                >
                  <Ionicons name="share-social" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </ScrollView>


      {/* Modal de vérification quotidienne */}
      <Modal
        visible={showDailyCheckModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSkipDailyCheck}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleSkipDailyCheck}
        >
          <TouchableOpacity 
            style={[styles.dailyCheckModalContent, { backgroundColor: colors.card }]} 
            activeOpacity={1}
            onPress={() => {}}
          > 
            <View style={styles.dailyCheckModalHeader}>
              <View style={[styles.dailyCheckIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
              </View>
              <Text style={[styles.dailyCheckModalTitle, { color: colors.text }]}>
                {t('home.dailyCheckReminder')}
                </Text>
              <Text style={[styles.dailyCheckModalText, { color: colors.mutedText }]}>
                {t('home.dailyCheckReminderDesc')}
                </Text>
              </View>
            <View style={styles.dailyCheckModalButtons}>
              <TouchableOpacity 
                style={[styles.dailyCheckModalButton, styles.dailyCheckCancelButton]} 
                onPress={handleSkipDailyCheck}
              >
                <Text style={styles.dailyCheckCancelButtonText}>{t('common.later')}</Text>
          </TouchableOpacity>
        <TouchableOpacity 
                style={[styles.dailyCheckModalButton, styles.dailyCheckConfirmButton, { backgroundColor: colors.primary }]}
          onPress={handleDailyCheck}
        >
                <Text style={styles.dailyCheckConfirmButtonText}>{t('home.dailyCheck')}</Text>
        </TouchableOpacity>
      </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
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
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  counterContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  counterLabel: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  totalDays: {
    fontSize: 14,
    color: '#999',
    lineHeight: 24,
  },
  startDate: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 3,
    fontStyle: 'italic',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  dailyCheckModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dailyCheckModalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dailyCheckIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dailyCheckModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  dailyCheckModalText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  dailyCheckModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dailyCheckModalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCheckCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  dailyCheckConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  dailyCheckCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  dailyCheckConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  adjustTimeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  adjustTimeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  adjustTimePickerContainer: {
    marginBottom: 32,
  },
  adjustTimeModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  adjustTimeModalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustTimeCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  adjustTimeSaveButton: {
    backgroundColor: '#4CAF50',
  },
  adjustTimeCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  adjustTimeSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  milestonesContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    width: '100%',
    position: 'relative',
    height: 24,
  },
  shareButtonInline: {
    padding: 4,
    marginLeft: 8,
  },
  elapsedCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  elapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    width: '100%',
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
  elapsedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  circularProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    marginTop: 10,
    flexWrap: 'nowrap',
    width: '100%',
    maxWidth: '100%',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 0,
  },
  circularProgressSvg: {
    position: 'absolute',
  },
  circularProgressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  circularProgressValue: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  circularProgressLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#f44336',
  },
  saveButton: {
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
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  milestoneText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  milestoneShareButton: {
    padding: 4,
    marginLeft: 8,
  },
  animationModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  modifyButton: {
    backgroundColor: '#2196F3',
  },
  modifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  soberButton: {
    backgroundColor: '#4CAF50',
  },
  consumedButton: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
