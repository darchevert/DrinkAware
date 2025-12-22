import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimeWheelPicker from '../components/TimeWheelPicker';

import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';
import { OnboardingService } from '../utils/OnboardingService';
import { useLanguage, useT } from '../i18n/i18n';
import { buildDefaultMilestones } from '../utils/milestones';
import { useTheme } from '../theme/Theme';
import { triggerSelection } from '../utils/Haptics';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const { mode, setMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reminderHour, setReminderHour] = useState<number>(20);
  const [reminderMinute, setReminderMinute] = useState<number>(0);
  // Variables temporaires pour le modal (non sauvegardées tant qu'on n'appuie pas sur Enregistrer)
  const [tempReminderHour, setTempReminderHour] = useState<number>(20);
  const [tempReminderMinute, setTempReminderMinute] = useState<number>(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [detailedConsumptionEnabled, setDetailedConsumptionEnabled] = useState(false);
  const reminderTimeValue = useMemo(() => {
    const base = new Date();
    base.setHours(reminderHour);
    base.setMinutes(reminderMinute);
    base.setSeconds(0);
    base.setMilliseconds(0);
    return base;
  }, [reminderHour, reminderMinute]);

  const handleReminderTimeChange = (hour: number, minute: number) => {
    // Mettre à jour seulement les valeurs temporaires
    setTempReminderHour(hour);
    setTempReminderMinute(minute);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recharger et reprogrammer les notifications quand l'utilisateur revient sur cet écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // Si les notifications sont activées, s'assurer qu'elles sont bien programmées
      if (notificationsEnabled) {
        try {
          const time = await AsyncStorage.getItem('daily_reminder_time');
          if (time) {
            const [h, m] = time.split(':').map(Number);
            if (!Number.isNaN(h) && !Number.isNaN(m)) {
              // Reprogrammer les notifications pour maintenir 30 jours à l'avance
              await NotificationService.scheduleDailyNotification(h, m);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la reprogrammation des notifications:', error);
        }
      }
    });
    return unsubscribe;
  }, [navigation, notificationsEnabled]);

  const loadData = async () => {
    try {
      // Charger paramètres notifications
      const enabled = await AsyncStorage.getItem('notifications_enabled');
      const time = await AsyncStorage.getItem('daily_reminder_time');
      if (enabled !== null) {
        const isEnabled = enabled === 'true';
        setNotificationsEnabled(isEnabled);
        // Si les notifications sont activées, programmer la notification
        if (isEnabled && time) {
          const [h, m] = time.split(':').map(Number);
          if (!Number.isNaN(h) && !Number.isNaN(m)) {
            setReminderHour(h);
            setReminderMinute(m);
            // Programmer la notification avec l'heure chargée
            await NotificationService.scheduleDailyNotification(h, m);
          }
        } else if (!isEnabled) {
          // Si les notifications sont désactivées, annuler toutes les notifications
          await NotificationService.cancelAllNotifications();
        }
      }
      if (time) {
        const [h, m] = time.split(':').map(Number);
        if (!Number.isNaN(h) && !Number.isNaN(m)) {
          setReminderHour(h);
          setReminderMinute(m);
        }
      }

      const consumptionSetting = await AsyncStorage.getItem('detailed_consumption_enabled');
      if (consumptionSetting !== null) {
        setDetailedConsumptionEnabled(consumptionSetting === 'true');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      await AsyncStorage.setItem('notifications_enabled', 'true');
      await AsyncStorage.setItem('daily_reminder_time', `${String(reminderHour).padStart(2,'0')}:${String(reminderMinute).padStart(2,'0')}`);
      await NotificationService.scheduleDailyNotification(reminderHour, reminderMinute);
      // Vérifier que les notifications ont bien été programmées
      await NotificationService.getScheduledNotifications();
    } else {
      await AsyncStorage.setItem('notifications_enabled', 'false');
      await NotificationService.cancelAllNotifications();
    }
  };

  const openTimePicker = () => {
    // Initialiser les valeurs temporaires avec les valeurs actuelles
    setTempReminderHour(reminderHour);
    setTempReminderMinute(reminderMinute);
    setShowTimeModal(true);
  };

  const closeTimePicker = () => {
    // Réinitialiser les valeurs temporaires
    setTempReminderHour(reminderHour);
    setTempReminderMinute(reminderMinute);
    setShowTimeModal(false);
  };

  const saveTime = async () => {
    // Utiliser les valeurs temporaires pour sauvegarder
    await AsyncStorage.setItem('daily_reminder_time', `${String(tempReminderHour).padStart(2,'0')}:${String(tempReminderMinute).padStart(2,'0')}`);
    // Mettre à jour les valeurs réelles avec les valeurs temporaires
    setReminderHour(tempReminderHour);
    setReminderMinute(tempReminderMinute);
    if (notificationsEnabled) {
      await NotificationService.cancelAllNotifications();
      await NotificationService.scheduleDailyNotification(tempReminderHour, tempReminderMinute);
      // Vérifier que les notifications ont bien été programmées
      await NotificationService.getScheduledNotifications();
    }
    setShowTimeModal(false);
  };

  const handleConsumptionDetailToggle = async (enabled: boolean) => {
    setDetailedConsumptionEnabled(enabled);
    await AsyncStorage.setItem('detailed_consumption_enabled', enabled ? 'true' : 'false');
  };

  const handleChangeLanguage = async (lang: 'fr' | 'en') => {
    await setLanguage(lang);
  };

  const handleResetData = () => {
    console.log('Bouton Réinitialiser cliqué');
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    console.log('Confirmation de réinitialisation');
    setShowResetModal(false);
    
    try {
      console.log('Début de la réinitialisation');
      // Réinitialiser les données
      const defaultData = {
        startDate: new Date().toISOString(),
        currentStreak: 0,
        totalDays: 0,
        lastCheckDate: '',
        milestones: buildDefaultMilestones(t),
      };

      console.log('Sauvegarde des données par défaut');
      await StorageService.saveSobrietyData(defaultData);
      // Réinitialiser les vérifications quotidiennes
      await AsyncStorage.setItem('daily_checks', JSON.stringify([]));
      
      console.log('Réinitialisation terminée avec succès');
      Alert.alert(t('common.success'), t('settings.resetData'));
      
      // Naviguer vers l'écran d'accueil pour forcer le rechargement
      navigation.navigate('Accueil');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      Alert.alert(t('common.error'), '');
    }
  };

  const cancelReset = () => {
    console.log('Réinitialisation annulée');
    setShowResetModal(false);
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
          {/* Apparence */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.appearance')}</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.darkMode')}</Text>
                <Text style={[styles.settingDescription, { color: colors.mutedText }]}>
                  {mode === 'dark' ? 'On' : 'Off'}
                </Text>
              </View>
              <Switch
                value={Boolean(mode === 'dark')}
                onValueChange={async (enabled) => {
                  await setMode(enabled ? 'dark' : 'light');
                }}
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={mode === 'dark' ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
          {/* Langue */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
            <Text style={[styles.settingDescription, { color: colors.mutedText }]}>{t('settings.languageDescription')}</Text>
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 10, justifyContent: 'space-between' }}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    flex: 1, 
                    minWidth: 0, 
                    justifyContent: 'center', 
                    borderColor: language === 'fr' ? colors.primary : (mode === 'dark' ? colors.border : '#ddd'),
                    backgroundColor: language === 'fr' 
                      ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                      : colors.card
                  }
                ]}
                onPress={() => handleChangeLanguage('fr')}
              >
                <Ionicons name="language" size={20} color={language === 'fr' ? colors.primary : (mode === 'dark' ? colors.text : '#666')} />
                <Text style={[styles.actionButtonText, { color: language === 'fr' ? colors.primary : (mode === 'dark' ? colors.text : '#666') }]}>{t('settings.french')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    flex: 1, 
                    minWidth: 0, 
                    justifyContent: 'center', 
                    borderColor: language === 'en' ? colors.primary : (mode === 'dark' ? colors.border : '#ddd'),
                    backgroundColor: language === 'en' 
                      ? (mode === 'dark' ? colors.primary + '20' : '#f1f8e9')
                      : colors.card
                  }
                ]}
                onPress={() => handleChangeLanguage('en')}
              >
                <Ionicons name="language" size={20} color={language === 'en' ? colors.primary : (mode === 'dark' ? colors.text : '#666')} />
                <Text style={[styles.actionButtonText, { color: language === 'en' ? colors.primary : (mode === 'dark' ? colors.text : '#666') }]}>{t('settings.english')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.notifications')}</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.dailyReminders')}</Text>
                <Text style={[styles.settingDescription, { color: colors.mutedText }]}>{t('settings.dailyRemindersDescription')}</Text>
              </View>
              <Switch
                value={Boolean(notificationsEnabled)}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={Boolean(notificationsEnabled) ? '#fff' : '#f4f3f4'}
              />
            </View>

            {/* Sélection de l'heure */}
            <TouchableOpacity style={styles.settingRow} onPress={openTimePicker} disabled={!Boolean(notificationsEnabled)}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.reminderTime')}</Text>
                <Text style={[styles.settingDescription, { color: colors.mutedText }]}>
                  {`${String(reminderHour).padStart(2,'0')}:${String(reminderMinute).padStart(2,'0')}`}
                </Text>
              </View>
              <Ionicons name="time" size={22} color={notificationsEnabled ? '#4CAF50' : '#ccc'} />
            </TouchableOpacity>
          </View>

          {/* Vérification quotidienne */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.consumptionDetailTitle')}</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingDescription, { color: colors.mutedText }]}>{t('settings.consumptionDetailDescription')}</Text>
              </View>
              <Switch
                value={Boolean(detailedConsumptionEnabled)}
                onValueChange={handleConsumptionDetailToggle}
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={Boolean(detailedConsumptionEnabled) ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.actions')}</Text>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { 
                  borderColor: colors.primary, 
                  backgroundColor: mode === 'dark' ? colors.primary + '20' : '#f1f8e9'
                }
              ]} 
              onPress={async () => {
                triggerSelection();
                await OnboardingService.resetOnboarding();
                // Naviguer vers l'écran d'accueil pour déclencher la vérification de l'onboarding
                navigation.navigate('Accueil');
                // L'onboarding sera détecté et affiché automatiquement
              }}
            >
              <Ionicons name="book-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {t('settings.showOnboarding' as any)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.actionButtonSpacing,
                {
                  borderColor: colors.primary,
                  backgroundColor: mode === 'dark' ? colors.primary + '20' : '#f1f8e9'
                }
              ]} 
              onPress={() => {
                triggerSelection();
                navigation.navigate('WidgetTutorial');
              }}
            >
              <Ionicons name="apps-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {t('settings.widgetTutorial')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.actionButtonSpacing,
                {
                  borderColor: '#f44336',
                  backgroundColor: mode === 'dark' ? '#f44336' + '20' : '#ffebee'
                }
              ]} 
              onPress={handleResetData}
            >
              <Ionicons name="refresh" size={24} color="#f44336" />
              <Text style={[styles.actionButtonText, { color: '#f44336' }]}>{t('settings.resetData')}</Text>
            </TouchableOpacity>
          </View>

          {/* Informations */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.info')}</Text>
            
            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: colors.mutedText }]}>
                {t('settings.appName')}
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedText }]}>
                {t('settings.appDesc')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Modal de réinitialisation */}
      <Modal
        visible={Boolean(showResetModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelReset}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={cancelReset}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.resetModalTitle')}</Text>
            <Text style={[styles.modalText, { color: colors.mutedText }]}>{t('settings.resetModalText')}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.cancelButton,
                  {
                    backgroundColor: mode === 'dark' ? colors.card : '#f5f5f5',
                    borderColor: mode === 'dark' ? colors.border : '#ddd',
                  }
                ]} 
                onPress={cancelReset}
              >
                <Text style={[styles.cancelButtonText, { color: mode === 'dark' ? colors.text : '#666' }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.resetButton]} 
                onPress={confirmReset}
              >
                <Text style={styles.resetButtonText}>{t('settings.resetData')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal choix de l'heure */}
      <Modal
        visible={Boolean(showTimeModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={closeTimePicker}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeTimePicker}>
          <TouchableOpacity style={[styles.reminderTimeModalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <Text style={[styles.reminderTimeModalTitle, { color: colors.text }]}>{t('settings.reminderTime')}</Text>
            <View style={styles.reminderTimePickerContainer}>
              <TimeWheelPicker
                hour={tempReminderHour}
                minute={tempReminderMinute}
                onHourChange={(value) => handleReminderTimeChange(value, tempReminderMinute)}
                onMinuteChange={(value) => handleReminderTimeChange(tempReminderHour, value)}
                textColor={colors.text}
                highlightColor={mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E8F5E9'}
                itemBackground={colors.card}
                accentColor={colors.primary}
              />
            </View>
            <View style={styles.reminderTimeModalButtons}>
              <TouchableOpacity 
                style={[
                  styles.reminderTimeModalButton, 
                  styles.reminderTimeCancelButton,
                  {
                    backgroundColor: mode === 'dark' ? 'transparent' : 'transparent',
                    borderColor: mode === 'dark' ? colors.border : '#E0E0E0',
                  }
                ]} 
                onPress={closeTimePicker}
              >
                <Text style={[styles.reminderTimeCancelButtonText, { color: mode === 'dark' ? colors.text : '#666' }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.reminderTimeModalButton, styles.reminderTimeSaveButton, { backgroundColor: colors.primary }]} 
                onPress={saveTime}
              >
                <Text style={styles.reminderTimeSaveButtonText}>{t('settings.save')}</Text>
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
  section: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  actionButtonSpacing: {
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '500',
    marginLeft: 10,
  },
  infoContainer: {
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
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
  reminderTimeModalContent: {
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
  reminderTimeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  reminderTimePickerContainer: {
    marginBottom: 32,
  },
  reminderTimeModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  reminderTimeModalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTimeCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  reminderTimeSaveButton: {
    backgroundColor: '#4CAF50',
  },
  reminderTimeCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  reminderTimeSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

