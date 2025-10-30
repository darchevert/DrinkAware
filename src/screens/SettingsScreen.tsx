import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CharacterState } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';
import { NotificationService } from '../utils/SimpleNotificationService';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [characterState, setCharacterState] = useState<CharacterState | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const character = await StorageService.loadCharacterState();
      if (character) {
        setCharacterState(character);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterTypeChange = async (type: 'tree' | 'pet') => {
    if (!characterState) return;

    try {
      const updatedCharacter = { ...characterState, type };
      await StorageService.saveCharacterState(updatedCharacter);
      setCharacterState(updatedCharacter);
      
      Alert.alert(
        'Personnage changé',
        `Vous avez choisi un ${type === 'tree' ? 'arbre' : 'compagnon'} !`
      );
    } catch (error) {
      console.error('Erreur lors du changement de personnage:', error);
      Alert.alert('Erreur', 'Impossible de changer le personnage.');
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      await NotificationService.scheduleDailyNotification();
    } else {
      await NotificationService.cancelAllNotifications();
    }
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
        milestones: [
          { id: '1', name: 'Premier jour', daysRequired: 1, achieved: false, description: 'Bravo pour ce premier pas !' },
          { id: '2', name: 'Une semaine', daysRequired: 7, achieved: false, description: 'Une semaine complète !' },
          { id: '3', name: '10 jours', daysRequired: 10, achieved: false, description: 'Double chiffre atteint !' },
          { id: '4', name: 'Deux semaines', daysRequired: 14, achieved: false, description: 'Deux semaines de victoires !' },
          { id: '5', name: 'Un mois', daysRequired: 30, achieved: false, description: 'Un mois entier !' },
          { id: '6', name: 'Deux mois', daysRequired: 60, achieved: false, description: 'Deux mois de réussite !' },
          { id: '7', name: 'Trois mois', daysRequired: 90, achieved: false, description: 'Trois mois de sobriété !' },
          { id: '8', name: 'Six mois', daysRequired: 180, achieved: false, description: 'Demi-année de victoire !' },
          { id: '9', name: 'Un an', daysRequired: 365, achieved: false, description: 'Une année complète !' },
        ],
        characterLevel: 1,
        characterType: characterState?.type || 'tree',
      };

      const defaultCharacter = {
        level: 1,
        type: characterState?.type || 'tree',
        growthStage: 0,
        unlockedFeatures: [],
      };

      console.log('Sauvegarde des données par défaut');
      await StorageService.saveSobrietyData(defaultData);
      await StorageService.saveCharacterState(defaultCharacter);
      // Réinitialiser les vérifications quotidiennes
      await AsyncStorage.setItem('daily_checks', JSON.stringify([]));

      setCharacterState(defaultCharacter);
      
      console.log('Réinitialisation terminée avec succès');
      Alert.alert('Succès', 'Toutes les données ont été réinitialisées.');
      
      // Naviguer vers l'écran d'accueil pour forcer le rechargement
      navigation.navigate('Accueil');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      Alert.alert('Erreur', 'Impossible de réinitialiser les données.');
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
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Personnage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personnage</Text>
            
            <View style={styles.characterContainer}>
              <Text style={styles.characterLabel}>Type de personnage</Text>
              <View style={styles.characterOptions}>
                <TouchableOpacity
                  style={[
                    styles.characterOption,
                    characterState?.type === 'tree' && styles.characterOptionSelected
                  ]}
                  onPress={() => handleCharacterTypeChange('tree')}
                >
                  <Ionicons 
                    name="leaf" 
                    size={30} 
                    color={characterState?.type === 'tree' ? '#4CAF50' : '#666'} 
                  />
                  <Text style={[
                    styles.characterOptionText,
                    characterState?.type === 'tree' && styles.characterOptionTextSelected
                  ]}>
                    Arbre
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.characterOption,
                    characterState?.type === 'pet' && styles.characterOptionSelected
                  ]}
                  onPress={() => handleCharacterTypeChange('pet')}
                >
                  <Ionicons 
                    name="heart" 
                    size={30} 
                    color={characterState?.type === 'pet' ? '#4CAF50' : '#666'} 
                  />
                  <Text style={[
                    styles.characterOptionText,
                    characterState?.type === 'pet' && styles.characterOptionTextSelected
                  ]}>
                    Compagnon
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Rappels quotidiens</Text>
                <Text style={styles.settingDescription}>
                  Recevoir une notification pour la vérification quotidienne
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleResetData}>
              <Ionicons name="refresh" size={24} color="#f44336" />
              <Text style={styles.actionButtonText}>Réinitialiser les données</Text>
            </TouchableOpacity>
          </View>

          {/* Informations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Sobriety Tracker v1.0.0
              </Text>
              <Text style={styles.infoText}>
                Développé avec ❤️ pour vous accompagner dans votre parcours de sobriété.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Modal de réinitialisation */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Réinitialiser les données</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir réinitialiser toutes vos données ? Cette action est irréversible.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelReset}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.resetButton]} 
                onPress={confirmReset}
              >
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
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
  characterContainer: {
    marginTop: 10,
  },
  characterLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  characterOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  characterOption: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flex: 1,
    marginHorizontal: 5,
  },
  characterOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  characterOptionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  characterOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
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
});
