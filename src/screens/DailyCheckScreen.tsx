import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
// Wrapper multiplateforme pour l'animation de succès
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SobrietyData, DailyCheck, ConsumptionLevel } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { useT } from '../i18n/i18n';
import { useTheme } from '../theme/Theme';
import { triggerImpact, triggerSelection } from '../utils/Haptics';
import { WidgetService } from '../utils/WidgetService';

interface DailyCheckScreenProps {
  navigation: any;
}

export default function DailyCheckScreen({ navigation }: DailyCheckScreenProps) {
  const t = useT();
  const { colors, mode } = useTheme();
  const [sobrietyData, setSobrietyData] = useState<SobrietyData | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [existingCheck, setExistingCheck] = useState<DailyCheck | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [detailedConsumptionEnabled, setDetailedConsumptionEnabled] = useState(false);
  const [selectedConsumptionLevel, setSelectedConsumptionLevel] = useState<ConsumptionLevel | null>(null);
  const [consumptionModalMode, setConsumptionModalMode] = useState<'confirm' | 'levels'>('confirm');

  const DETAILED_CONSUMPTION_KEY = 'detailed_consumption_enabled';

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await StorageService.loadSobrietyData();
      const dailyChecks = await StorageService.loadDailyChecks();
      const detailedPref = await AsyncStorage.getItem(DETAILED_CONSUMPTION_KEY);
      
      if (data) {
        setSobrietyData(data);
      }

      setDetailedConsumptionEnabled(detailedPref === 'true');

      // Vérifier s'il y a une vérification pour aujourd'hui
      const today = getTodayString();
      console.log('DailyCheckScreen - Date d\'aujourd\'hui:', today);
      const todayCheck = dailyChecks.find(check => check.date === today);
      if (todayCheck) {
        setExistingCheck(todayCheck);
        setIsModification(true);
        setNotes(todayCheck.notes || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoberChoice = async () => {
    triggerImpact();
    console.log('Bouton "Je suis sobre" cliqué');
    await handleDailyCheck(true);
  };

  const handleConsumptionChoice = async () => {
    triggerImpact();
    console.log('Bouton "J\'ai consommé" cliqué');
    setSelectedConsumptionLevel(existingCheck?.consumptionLevel ?? null);

    if (detailedConsumptionEnabled) {
      setConsumptionModalMode('levels');
      setShowConsumptionModal(true);
      return;
    }

    if (isModification) {
      // Si c'est une modification, pas besoin d'alerte de confirmation
      console.log('Modification directe vers consommation');
      await handleDailyCheck(false);
    } else {
      // Nouvelle vérification, afficher le modal de confirmation
      console.log('Affichage du modal de confirmation');
      setConsumptionModalMode('confirm');
      setShowConsumptionModal(true);
    }
  };

  const confirmConsumption = async () => {
    triggerImpact();
    console.log('Consumption confirmé');
    setShowConsumptionModal(false);
    await handleDailyCheck(false);
  };

  const cancelConsumption = () => {
    triggerSelection();
    console.log('Consumption annulé');
    setConsumptionModalMode('confirm');
    setShowConsumptionModal(false);
  };

  const handleConsumptionLevelSelect = async (level: ConsumptionLevel) => {
    triggerSelection();
    console.log('Niveau de consommation sélectionné:', level);
    setSelectedConsumptionLevel(level);
    setShowConsumptionModal(false);
    await handleDailyCheck(false, level);
  };

  const handleDailyCheck = async (sober: boolean, consumptionLevel?: ConsumptionLevel) => {
    console.log('handleDailyCheck appelé avec sober:', sober);
    console.log('sobrietyData:', sobrietyData);
    console.log('isModification:', isModification);
    console.log('existingCheck:', existingCheck);
    
    if (!sobrietyData) {
      console.log('Données manquantes, arrêt de la fonction');
      return;
    }

    try {
      const today = getTodayString();
      console.log('DailyCheckScreen - Création vérification pour:', today);
      
      // Créer la vérification quotidienne
      const dailyCheck: DailyCheck = {
        date: today,
        sober,
        notes: notes.trim() || undefined,
      };
      if (!sober && consumptionLevel) {
        dailyCheck.consumptionLevel = consumptionLevel;
      }

      // Ne plus modifier les compteurs localement; le recalcul central fera foi
      // Si consommation aujourd'hui, enregistrer aussi l'heure précise comme nouveau départ
      if (!sober) {
        const nowIso = new Date().toISOString();
        if (sobrietyData) {
          sobrietyData.startDate = nowIso;
        }
      }

      // Sauvegarder la vérification
      await StorageService.saveDailyCheck(dailyCheck);

      // Recalculer et sauvegarder les statistiques de manière centralisée
      const updatedData = await StorageService.recalculateStatistics();
      let milestoneReached = false;
      if (updatedData) {
        setSobrietyData(updatedData);
        // Si un challenge vient d'être atteint aujourd'hui, poser un flag pour l'écran précédent
        if (sober) {
          try {
            const todayStr = today; // même format AAAA-MM-JJ
            const newlyAchieved = (updatedData.milestones || []).find((m: any) => Boolean(m.achieved) && m.achievedDate === todayStr);
            if (newlyAchieved) {
              milestoneReached = true;
            }
          } catch {}
        }
      }

      console.log('Sauvegarde terminée');
      
      // Mettre à jour le widget
      await WidgetService.updateWidgetAfterCheck();
      
      // Si pas de challenge, jouer l'animation de succès simple
      if (sober && !milestoneReached) {
      }
      navigation.goBack();
      
    } catch (error) {
      console.error('Erreur lors de la vérification quotidienne:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
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

  if (!sobrietyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{isModification ? t('daily.titleEdit') : t('daily.titleNew')}</Text>
        
        {/* Section compagnon/arbre supprimée */}

        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsText, { color: colors.mutedText }]}>
            {t('daily.currentStreak', { days: sobrietyData.currentStreak })}
          </Text>
          <Text style={[styles.statsText, { color: colors.mutedText }]}>
            {t('daily.totalDays', { days: sobrietyData.totalDays })}
          </Text>
        </View>

        <View style={[styles.notesContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.notesLabel, { color: colors.text }]}>{t('daily.notesLabel')}</Text>
          <TextInput
            style={[styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('daily.placeholder')}
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.soberButton,
              isModification && existingCheck?.sober && styles.selectedButton
            ]} 
            onPress={handleSoberChoice}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>{t('daily.iAmSober')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              styles.consumptionButton,
              isModification && !existingCheck?.sober && styles.selectedButton
            ]} 
            onPress={handleConsumptionChoice}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>{t('daily.iConsumed')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de confirmation de consommation */}
      <Modal
        visible={Boolean(showConsumptionModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelConsumption}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={cancelConsumption}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            {consumptionModalMode === 'levels' ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('daily.consumptionLevelTitle')}</Text>
                <Text style={[styles.modalText, { color: colors.mutedText }]}>{t('daily.consumptionLevelSubtitle')}</Text>
                <View style={styles.consumptionOptionsContainer}>
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
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.consumptionOptionButton,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected
                              ? (mode === 'dark' ? '#1f3a23' : '#e8f5e9')
                              : colors.card,
                          },
                        ]}
                        onPress={() => handleConsumptionLevelSelect(option.key)}
                      >
                        <View
                          style={[
                            styles.consumptionOptionIcon,
                            { backgroundColor: isSelected ? colors.primary : (mode === 'dark' ? '#2A2A2A' : '#f0f0f0') },
                          ]}
                        >
                          <Ionicons
                            name={option.icon}
                            size={20}
                            color={isSelected ? '#fff' : colors.text}
                          />
                        </View>
                        <View style={styles.consumptionOptionTexts}>
                          <Text style={[styles.consumptionOptionTitle, { color: colors.text }]}>
                            {option.label}
                          </Text>
                          <Text style={[styles.consumptionOptionSubtitle, { color: colors.mutedText }]}>
                            {option.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={cancelConsumption}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('daily.confirmConsumptionTitle')}</Text>
                <Text style={[styles.modalText, { color: colors.mutedText }]}>{t('daily.confirmConsumptionText')}</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={cancelConsumption}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={confirmConsumption}
                  >
                    <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* animation déplacée sur l'écran précédent (Home) via AsyncStorage */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
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
  statsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  notesContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    gap: 15,
  },
  button: {
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  soberButton: {
    backgroundColor: '#4CAF50',
  },
  consumptionButton: {
    backgroundColor: '#f44336',
  },
  selectedButton: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#f44336',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  consumptionOptionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  consumptionOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: '100%',
  },
  consumptionOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  consumptionOptionTexts: {
    flex: 1,
    minWidth: 0,
  },
  consumptionOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  consumptionOptionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    flexShrink: 1,
  },
  animOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  animText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
