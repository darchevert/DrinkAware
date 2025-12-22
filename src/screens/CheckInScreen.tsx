import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { DailyCheck, ConsumptionLevel, Milestone } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';
import { useT, useLanguage } from '../i18n/i18n';
import { useTheme } from '../theme/Theme';
import { triggerImpact, triggerSelection } from '../utils/Haptics';
import { WidgetService } from '../utils/WidgetService';

interface CheckInScreenProps {
  navigation: any;
  route: {
    params?: {
      date?: string;
    };
  };
}

export default function CheckInScreen({ navigation, route }: CheckInScreenProps) {
  const t = useT();
  const { language } = useLanguage();
  const { colors, mode } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedConsumptionLevel, setSelectedConsumptionLevel] = useState<ConsumptionLevel | null>(null);
  const [showConsumptionOptions, setShowConsumptionOptions] = useState(false);
  const [detailedConsumptionEnabled, setDetailedConsumptionEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const DETAILED_CONSUMPTION_KEY = 'detailed_consumption_enabled';

  // Calculs proportionnels identiques aux modales
  const computedModalWidth = Math.min(Math.max(windowWidth * 0.9, 280), 520);
  const modalPadding = Math.max(windowWidth * 0.05, 16);
  const buttonPadding = Math.max(windowWidth * 0.04, 12);
  const fontSizeTitle = Math.max(windowWidth * 0.045, 18);
  const fontSizeText = Math.max(windowWidth * 0.038, 15);
  const fontSizeDate = Math.max(windowWidth * 0.035, 14);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDate = route.params?.date || getTodayString();

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const existingCheck = dailyChecks.find(c => c && c.date === selectedDate);
    navigation.setOptions({
      title: existingCheck ? t('calendar.editCheck') : t('calendar.addCheck'),
    });
  }, [dailyChecks, selectedDate, navigation, t]);

  const loadData = async () => {
    try {
      const checks = await StorageService.loadDailyChecks();
      setDailyChecks(checks || []);
      const detailedPref = await AsyncStorage.getItem(DETAILED_CONSUMPTION_KEY);
      setDetailedConsumptionEnabled(detailedPref === 'true');

      // Pré-remplir les notes et le niveau de consommation s'il y en a déjà
      const existingCheck = checks?.find(check => check.date === selectedDate);
      if (existingCheck) {
        setNotes(existingCheck.notes || '');
        setSelectedConsumptionLevel(existingCheck.consumptionLevel ?? null);
      } else {
        setNotes('');
        setSelectedConsumptionLevel(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsumptionLevelSelect = async (level: ConsumptionLevel) => {
    triggerSelection();
    setSelectedConsumptionLevel(level);
    setShowConsumptionOptions(false);
    // Valider directement avec le niveau sélectionné
    await handleCheckSubmit(false, level);
  };

  const handleCheckSubmit = async (sober: boolean, consumptionLevel?: ConsumptionLevel) => {
    triggerImpact();

    try {
      const check: DailyCheck = {
        date: selectedDate,
        sober,
        notes: notes.trim() || undefined,
        consumptionLevel: sober ? undefined : (consumptionLevel || selectedConsumptionLevel || undefined),
      };

      // Sauvegarder la vérification
      await StorageService.saveDailyCheck(check);
      
      // Recalculer et mettre à jour les statistiques, puis détecter un nouveau challenge atteint pour cette date
      const updatedData = await StorageService.recalculateStatistics();
      if (updatedData && sober) {
        try {
          const newlyAchieved = (updatedData.milestones || []).find((m: any) => Boolean(m.achieved) && m.achievedDate === selectedDate);
          if (newlyAchieved) {
            // Poser un flag pour l'écran d'accueil si l'utilisateur y revient
            // Envoyer une notification de challenge
            const milestoneName = getLocalizedMilestoneName(newlyAchieved);
            await NotificationService.scheduleMilestoneNotification(milestoneName, newlyAchieved.daysRequired);
          }
        } catch {}
      }
      
      // Si pas de challenge, jouer l'animation de succès simple
      if (sober && updatedData) {
        const todayStr = getTodayString();
        const newlyAchieved = (updatedData.milestones || []).find((m: any) => Boolean(m.achieved) && m.achievedDate === selectedDate);
        if (!newlyAchieved && selectedDate === todayStr) {
        }
      }
      
      // Mettre à jour le widget
      await WidgetService.updateWidgetAfterCheck();
      
      // Retourner à l'écran précédent
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert(t('common.error'), '');
    }
  };

  const getLocalizedMilestoneName = (m: Milestone) => {
    const idToKey: Record<string, string> = {
      '1': 'milestones.m1_name', '2': 'milestones.m2_name', '3': 'milestones.m3_name', '4': 'milestones.m4_name',
      '5': 'milestones.m5_name', '6': 'milestones.m6_name', '7': 'milestones.m7_name', '8': 'milestones.m8_name',
      '9': 'milestones.m9_name', '10': 'milestones.m10_name', '11': 'milestones.m11_name', '12': 'milestones.m12_name',
      '13': 'milestones.m13_name', '14': 'milestones.m14_name', '15': 'milestones.m15_name', '16': 'milestones.m16_name',
      '17': 'milestones.m17_name', '18': 'milestones.m18_name', '19': 'milestones.m19_name', '20': 'milestones.m20_name',
      '21': 'milestones.m21_name', '22': 'milestones.m22_name', '23': 'milestones.m23_name', '24': 'milestones.m24_name',
      '25': 'milestones.m25_name', '26': 'milestones.m26_name', '27': 'milestones.m27_name', '28': 'milestones.m28_name',
      '29': 'milestones.m29_name', '30': 'milestones.m30_name',
    };
    const key = idToKey[m.id];
    return key ? t(key as any) : m.name;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const existingCheck = dailyChecks.find(c => c && c.date === selectedDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={Boolean(true)}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, { padding: modalPadding }]}>
            <Text style={[styles.title, { color: colors.text, fontSize: fontSizeTitle, marginBottom: modalPadding * 0.5 }]}>
              {existingCheck ? t('calendar.editCheck') : t('calendar.addCheck')}
            </Text>
            <Text style={[styles.date, { color: colors.mutedText, fontSize: fontSizeDate, marginBottom: modalPadding }]}>
              {formatDate(selectedDate)}
            </Text>

            {existingCheck && (() => {
              const isSober = Boolean(existingCheck.sober);
              let statusColor = '#4CAF50'; // Vert par défaut pour sobre
              let statusBgColor = mode === 'dark' ? '#1f3a23' : '#e8f5e9';
              let statusIcon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';
              let statusText = t('calendar.sober');
              
              if (!isSober) {
                if (detailedConsumptionEnabled && existingCheck.consumptionLevel) {
                  switch (existingCheck.consumptionLevel) {
                    case 'single_drink':
                      statusColor = '#FFC107'; // Jaune
                      statusBgColor = mode === 'dark' ? '#3d2f1f' : '#fff8e1';
                      statusIcon = 'wine';
                      statusText = t('daily.singleDrink');
                      break;
                    case 'multiple_drinks':
                      statusColor = '#FF9800'; // Orange
                      statusBgColor = mode === 'dark' ? '#3d2a1f' : '#fff3e0';
                      statusIcon = 'beer';
                      statusText = t('daily.multipleDrinks');
                      break;
                    case 'too_much':
                      statusColor = '#f44336'; // Rouge
                      statusBgColor = mode === 'dark' ? '#3d1f1f' : '#ffebee';
                      statusIcon = 'warning';
                      statusText = t('daily.tooMuch');
                      break;
                    default:
                      statusColor = '#f44336';
                      statusBgColor = mode === 'dark' ? '#3d1f1f' : '#ffebee';
                      statusIcon = 'close-circle';
                      statusText = t('calendar.consumed');
                  }
                } else {
                  statusColor = '#f44336'; // Rouge
                  statusBgColor = mode === 'dark' ? '#3d1f1f' : '#ffebee';
                  statusIcon = 'close-circle';
                  statusText = t('calendar.consumed');
                }
              }
              
              return (
                <View style={[
                  styles.currentStatus,
                  { 
                    backgroundColor: statusBgColor,
                    borderColor: statusColor,
                    borderWidth: 2,
                    padding: modalPadding,
                    marginBottom: modalPadding,
                    shadowColor: statusColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                ]}>
                  <View style={styles.currentStatusContent}>
                    <Ionicons name={statusIcon} size={Math.max(windowWidth * 0.06, 24)} color={statusColor} />
                    <Text style={[styles.currentStatusText, { color: colors.text, fontSize: fontSizeText }]}>
                      {t('calendar.currentStatusLabel')}: <Text style={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</Text>
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Section notes */}
            <View style={[styles.notesSection, { marginBottom: modalPadding }]}>
              <Text style={[styles.notesLabel, { color: colors.text, fontSize: fontSizeText, marginBottom: modalPadding * 0.5 }]}>
                {t('calendar.notesLabel')}
              </Text>
              <TextInput
                style={[styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card, padding: modalPadding * 0.75, fontSize: fontSizeText }]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('calendar.addNotesPlaceholder')}
                placeholderTextColor={colors.mutedText}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {detailedConsumptionEnabled ? (
              <>
                <View style={[styles.buttonsContainer, { marginBottom: modalPadding, gap: modalPadding * 0.5 }]}>
                  <TouchableOpacity 
                    style={[styles.button, styles.soberButton, { paddingVertical: buttonPadding, paddingHorizontal: buttonPadding * 1.5 }]} 
                    onPress={() => handleCheckSubmit(true)}
                  >
                    <Ionicons name="checkmark-circle" size={Math.max(windowWidth * 0.06, 22)} color="#fff" />
                    <Text style={[styles.buttonText, { fontSize: fontSizeText }]}>{t('calendar.sober')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.button, styles.consumedButton, { paddingVertical: buttonPadding, paddingHorizontal: buttonPadding * 1.5 }]} 
                    onPress={() => {
                      triggerSelection();
                      setShowConsumptionOptions(true);
                    }}
                  >
                    <Ionicons name="close-circle" size={Math.max(windowWidth * 0.06, 22)} color="#fff" />
                    <Text style={[styles.buttonText, { fontSize: fontSizeText }]}>{t('calendar.consumed')}</Text>
                  </TouchableOpacity>
                </View>

                {showConsumptionOptions && (
                  <>
                    <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: fontSizeText, marginTop: modalPadding * 0.5, marginBottom: modalPadding * 0.75 }]}>
                      {t('daily.consumptionLevelSubtitle')}
                    </Text>
                    <View style={[styles.consumptionOptionsContainer, { marginBottom: modalPadding, gap: modalPadding * 0.75 }]}>
                      {[
                        {
                          key: 'single_drink' as ConsumptionLevel,
                          icon: 'wine-outline' as keyof typeof Ionicons.glyphMap,
                          label: t('daily.singleDrink'),
                          description: t('daily.singleDrinkDesc'),
                        },
                        {
                          key: 'multiple_drinks' as ConsumptionLevel,
                          icon: 'beer-outline' as keyof typeof Ionicons.glyphMap,
                          label: t('daily.multipleDrinks'),
                          description: t('daily.multipleDrinksDesc'),
                        },
                        {
                          key: 'too_much' as ConsumptionLevel,
                          icon: 'warning-outline' as keyof typeof Ionicons.glyphMap,
                          label: t('daily.tooMuch'),
                          description: t('daily.tooMuchDesc'),
                        },
                      ].map(option => {
                        const isSelected = selectedConsumptionLevel === option.key;
                        // Couleurs selon le niveau de consommation
                        let optionColor = '#f44336'; // Rouge par défaut
                        let optionColorLight = '#ffebee'; // Rouge clair
                        let optionColorDark = '#3d1f1f'; // Rouge foncé pour dark mode
                        
                        if (option.key === 'single_drink') {
                          optionColor = '#FFC107'; // Jaune
                          optionColorLight = '#fff8e1'; // Jaune clair
                          optionColorDark = '#3d2f1f'; // Jaune foncé pour dark mode
                        } else if (option.key === 'multiple_drinks') {
                          optionColor = '#FF9800'; // Orange
                          optionColorLight = '#fff3e0'; // Orange clair
                          optionColorDark = '#3d2a1f'; // Orange foncé pour dark mode
                        }
                        
                        const iconSize = Math.max(windowWidth * 0.05, 20);
                        const iconContainerSize = Math.max(windowWidth * 0.1, 40);
                        
                        return (
                          <TouchableOpacity
                            key={option.key}
                            style={[
                              styles.consumptionOptionButton,
                              {
                                borderColor: isSelected ? optionColor : colors.border,
                                borderWidth: isSelected ? 2 : 1,
                                backgroundColor: isSelected
                                  ? (mode === 'dark' ? optionColorDark : optionColorLight)
                                  : colors.card,
                                padding: modalPadding * 0.75,
                                marginBottom: modalPadding * 0.5,
                                minHeight: Math.max(windowWidth * 0.15, 60),
                              },
                            ]}
                            onPress={() => handleConsumptionLevelSelect(option.key)}
                          >
                            <View
                              style={[
                                styles.consumptionOptionIcon,
                                { 
                                  backgroundColor: isSelected ? optionColor : (mode === 'dark' ? '#2A2A2A' : '#f0f0f0'),
                                  width: iconContainerSize,
                                  height: iconContainerSize,
                                  borderRadius: iconContainerSize / 2,
                                  marginRight: modalPadding * 0.75,
                                },
                              ]}
                            >
                              <Ionicons
                                name={option.icon}
                                size={iconSize}
                                color={isSelected ? '#fff' : colors.text}
                              />
                            </View>
                            <View style={styles.consumptionOptionTexts}>
                              <Text style={[styles.consumptionOptionTitle, { color: colors.text, fontSize: fontSizeText }]}>
                                {option.label}
                              </Text>
                              <Text style={[styles.consumptionOptionSubtitle, { color: colors.mutedText, fontSize: fontSizeText * 0.85 }]}>
                                {option.description}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={[styles.buttonsContainer, { marginBottom: modalPadding }]}>
                <TouchableOpacity 
                  style={[styles.button, styles.soberButton]} 
                  onPress={() => handleCheckSubmit(true)}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.buttonText}>{t('calendar.sober')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.consumedButton]} 
                  onPress={() => handleCheckSubmit(false)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                  <Text style={styles.buttonText}>{t('calendar.consumed')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  date: {
    textAlign: 'center',
  },
  currentStatus: {
    borderRadius: 12,
  },
  currentStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currentStatusText: {
    textAlign: 'center',
  },
  notesSection: {
  },
  notesLabel: {
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 80,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  consumptionOptionsContainer: {
  },
  consumptionOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    width: '100%',
  },
  consumptionOptionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  consumptionOptionTexts: {
    flex: 1,
    minWidth: 0,
  },
  consumptionOptionTitle: {
    fontWeight: '600',
    marginBottom: 4,
    flexShrink: 1,
  },
  consumptionOptionSubtitle: {
    flexShrink: 1,
  },
});

