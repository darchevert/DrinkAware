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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SobrietyData, DailyCheck, CharacterState } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';

interface DailyCheckScreenProps {
  navigation: any;
}

export default function DailyCheckScreen({ navigation }: DailyCheckScreenProps) {
  const [sobrietyData, setSobrietyData] = useState<SobrietyData | null>(null);
  const [characterState, setCharacterState] = useState<CharacterState | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [existingCheck, setExistingCheck] = useState<DailyCheck | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);

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
      const character = await StorageService.loadCharacterState();
      const dailyChecks = await StorageService.loadDailyChecks();
      
      if (data) {
        setSobrietyData(data);
      }
      if (character) {
        setCharacterState(character);
      }

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
    console.log('Bouton "Je suis sobre" cliqué');
    await handleDailyCheck(true);
  };

  const handleConsumptionChoice = async () => {
    console.log('Bouton "J\'ai consommé" cliqué');
    if (isModification) {
      // Si c'est une modification, pas besoin d'alerte de confirmation
      console.log('Modification directe vers consommation');
      await handleDailyCheck(false);
    } else {
      // Nouvelle vérification, afficher le modal de confirmation
      console.log('Affichage du modal de confirmation');
      setShowConsumptionModal(true);
    }
  };

  const confirmConsumption = async () => {
    console.log('Consumption confirmé');
    setShowConsumptionModal(false);
    await handleDailyCheck(false);
  };

  const cancelConsumption = () => {
    console.log('Consumption annulé');
    setShowConsumptionModal(false);
  };

  const handleDailyCheck = async (sober: boolean) => {
    console.log('handleDailyCheck appelé avec sober:', sober);
    console.log('sobrietyData:', sobrietyData);
    console.log('characterState:', characterState);
    console.log('isModification:', isModification);
    console.log('existingCheck:', existingCheck);
    
    if (!sobrietyData || !characterState) {
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

      // Recalculer et sauvegarder les statistiques et l'état du personnage de manière centralisée
      const updatedData = await StorageService.recalculateStatistics();
      if (updatedData) {
        setSobrietyData(updatedData);
      }

      console.log('Sauvegarde terminée, retour à l\'écran principal');
      // Retourner à l'écran principal
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isModification ? 'Modifier votre vérification' : 'Comment vous sentez-vous aujourd\'hui ?'}
        </Text>
        
        <View style={styles.characterContainer}>
          <Ionicons 
            name={characterState.type === 'tree' ? 'leaf' : 'heart'} 
            size={60} 
            color="#4CAF50" 
          />
          <Text style={styles.characterText}>
            Votre {characterState.type === 'tree' ? 'arbre' : 'compagnon'} vous attend !
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Série actuelle : {sobrietyData.currentStreak} jours
          </Text>
          <Text style={styles.statsText}>
            Total : {sobrietyData.totalDays} jours
          </Text>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (optionnel)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Comment vous sentez-vous ?"
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
            <Text style={styles.buttonText}>Je suis sobre</Text>
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
            <Text style={styles.buttonText}>J'ai consommé</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de confirmation de consommation */}
      <Modal
        visible={showConsumptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelConsumption}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmation</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir marquer une consommation ? Cela réinitialisera votre série actuelle.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelConsumption}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmConsumption}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
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
  characterContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characterText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
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
    minWidth: 300,
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
  confirmButton: {
    backgroundColor: '#f44336',
  },
  cancelButtonText: {
    color: '#666',
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
});
