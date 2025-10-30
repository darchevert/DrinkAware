import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SobrietyData, Milestone, CharacterState, DailyCheck } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';
import AnimatedCharacter from '../components/SimpleAnimatedCharacter';
import FadeInView, { SlideInView, BounceInView, PulseView } from '../components/Animations';

interface HomeScreenProps {
  navigation: any;
}

const MILESTONES: Milestone[] = [
  { id: '1', name: 'Premier jour', daysRequired: 1, achieved: false, description: 'Bravo pour ce premier pas !' },
  { id: '2', name: 'Une semaine', daysRequired: 7, achieved: false, description: 'Une semaine complète !' },
  { id: '3', name: '10 jours', daysRequired: 10, achieved: false, description: 'Double chiffre atteint !' },
  { id: '4', name: 'Deux semaines', daysRequired: 14, achieved: false, description: 'Deux semaines de victoires !' },
  { id: '5', name: 'Un mois', daysRequired: 30, achieved: false, description: 'Un mois entier !' },
  { id: '6', name: 'Deux mois', daysRequired: 60, achieved: false, description: 'Deux mois de réussite !' },
  { id: '7', name: 'Trois mois', daysRequired: 90, achieved: false, description: 'Trois mois de sobriété !' },
  { id: '8', name: 'Six mois', daysRequired: 180, achieved: false, description: 'Demi-année de victoire !' },
  { id: '9', name: 'Un an', daysRequired: 365, achieved: false, description: 'Une année complète !' },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [sobrietyData, setSobrietyData] = useState<SobrietyData | null>(null);
  const [characterState, setCharacterState] = useState<CharacterState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCharacterGrowing, setIsCharacterGrowing] = useState(false);
  const [todayCheck, setTodayCheck] = useState<DailyCheck | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);

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
      return startDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    return '';
  };

  useEffect(() => {
    loadData();
    initializeNotifications();
  }, []);

  // Recharger les données quand l'utilisateur revient sur cet écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  };

  const loadData = async () => {
    try {
      const data = await StorageService.loadSobrietyData();
      const character = await StorageService.loadCharacterState();
      const checks = await StorageService.loadDailyChecks();
      
      setDailyChecks(checks || []);
      
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
          milestones: MILESTONES,
          characterLevel: 1,
          characterType: 'tree',
        };
        setSobrietyData(defaultData);
        await StorageService.saveSobrietyData(defaultData);
      }

      if (character) {
        setCharacterState(character);
      } else {
        // Initialiser l'état du personnage par défaut
        const defaultCharacter: CharacterState = {
          level: 1,
          type: 'tree',
          growthStage: 0,
          unlockedFeatures: [],
        };
        setCharacterState(defaultCharacter);
        await StorageService.saveCharacterState(defaultCharacter);
      }

      // Vérifier s'il y a une vérification pour aujourd'hui
      const today = getTodayString();
      console.log('HomeScreen - Date d\'aujourd\'hui:', today);
      const todayCheckData = checks.find(check => check.date === today);
      setTodayCheck(todayCheckData || null);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheck = () => {
    console.log('Bouton cliqué, todayCheck:', todayCheck);
    if (todayCheck) {
      // Si une vérification existe déjà, proposer de la modifier
      console.log('Affichage de la modal de modification');
      setShowModifyModal(true);
    } else {
      // Première vérification du jour
      console.log('Navigation vers DailyCheck (première fois)');
      try {
        navigation.getParent()?.navigate('DailyCheck');
        console.log('Navigation première fois appelée');
      } catch (error) {
        console.error('Erreur de navigation première fois:', error);
      }
    }
  };

  const handleModifyCheck = () => {
    console.log('Utilisateur a choisi de modifier');
    setShowModifyModal(false);
    try {
      navigation.getParent()?.navigate('DailyCheck');
      console.log('Navigation vers modification appelée');
    } catch (error) {
      console.error('Erreur de navigation:', error);
    }
  };

  const handleCancelModify = () => {
    console.log('Modification annulée');
    setShowModifyModal(false);
  };

  const getProgressPercentage = () => {
    if (!sobrietyData) return 0;
    const nextMilestone = sobrietyData.milestones.find(m => !m.achieved);
    if (!nextMilestone) return 100;
    return Math.min((sobrietyData.currentStreak / nextMilestone.daysRequired) * 100, 100);
  };

  const getNextMilestone = () => {
    if (!sobrietyData) return null;
    return sobrietyData.milestones.find(m => !m.achieved);
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

  if (!sobrietyData || !characterState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur de chargement des données</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextMilestone = getNextMilestone();
  const progressPercentage = getProgressPercentage();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Compteur principal */}
        <BounceInView delay={200}>
          <View style={styles.counterContainer}>
            <PulseView>
              <Text style={styles.counterNumber}>{sobrietyData.currentStreak}</Text>
            </PulseView>
            <Text style={styles.counterLabel}>jours de sobriété</Text>
            <Text style={styles.totalDays}>{sobrietyData.totalDays} jours au total</Text>
            {getStartDate() && (
              <Text style={styles.startDate}>depuis le {getStartDate()}</Text>
            )}
          </View>
        </BounceInView>

        {/* Barre de progression */}
        <SlideInView direction="up" delay={400}>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Prochain jalon</Text>
              <Text style={styles.progressSubtitle}>
                {nextMilestone ? `${nextMilestone.name} (${nextMilestone.daysRequired} jours)` : 'Tous les jalons atteints !'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {nextMilestone ? `${nextMilestone.daysRequired - sobrietyData.currentStreak} jours restants` : 'Félicitations !'}
            </Text>
          </View>
        </SlideInView>

        {/* Personnage/Arbre Animé */}
        <FadeInView delay={600}>
          <View style={styles.characterContainer}>
            <Text style={styles.characterTitle}>
              {characterState.type === 'tree' ? 'Mon Arbre' : 'Mon Compagnon'}
            </Text>
            <AnimatedCharacter
              type={characterState.type}
              level={characterState.level}
              growthStage={characterState.growthStage}
              isGrowing={isCharacterGrowing}
            />
          </View>
        </FadeInView>

        {/* Jalons récents */}
        <View style={styles.milestonesContainer}>
          <Text style={styles.milestonesTitle}>Jalons Atteints</Text>
          {sobrietyData.milestones
            .filter(m => m.achieved)
            .slice(-3)
            .map(milestone => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.milestoneText}>{milestone.name}</Text>
              </View>
            ))}
        </View>
      </ScrollView>
      
      {/* Bouton flottant de vérification quotidienne */}
      <TouchableOpacity 
        style={[
          styles.floatingButton, 
          todayCheck && styles.floatingButtonCompleted
        ]} 
        onPress={handleDailyCheck}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={todayCheck ? (todayCheck.sober ? "checkmark-circle" : "close-circle") : "checkmark-circle"} 
          size={28} 
          color="#fff" 
        />
        <Text style={styles.floatingButtonText}>
          {todayCheck 
            ? `Aujourd'hui: ${todayCheck.sober ? 'Sobre' : 'Consommé'}`
            : 'Vérification Quotidienne'
          }
        </Text>
      </TouchableOpacity>
      
      {/* Modal de modification */}
      <Modal
        visible={showModifyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelModify}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier la vérification</Text>
            <Text style={styles.modalText}>
              Vous avez déjà marqué "{todayCheck?.sober ? 'sobre' : 'consommé'}" aujourd'hui. 
              Voulez-vous modifier cette vérification ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelModify}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modifyButton]} 
                onPress={handleModifyCheck}
              >
                <Text style={styles.modifyButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    padding: 20,
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
    marginTop: 5,
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
  characterContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  characterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  characterDisplay: {
    alignItems: 'center',
  },
  characterLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  characterStage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonCompleted: {
    backgroundColor: '#2196F3',
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
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
  milestonesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  milestoneText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
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
    marginBottom: 15,
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
  modifyButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
