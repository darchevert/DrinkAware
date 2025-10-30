import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { SobrietyData, DailyCheck, CharacterState } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';

interface CalendarScreenProps {
  navigation: any;
}

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [calendarMonths, setCalendarMonths] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand l'écran devient actif (après réinitialisation)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const checks = await StorageService.loadDailyChecks();
      setDailyChecks(checks);
      
      // Charger les mois du calendrier
      const months = await generateCalendarDays();
      setCalendarMonths(months);
    } catch (error) {
      console.error('Erreur lors du chargement des vérifications:', error);
    } finally {
      setLoading(false);
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
    
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateStatus = (date: string) => {
    const check = dailyChecks.find(c => c.date === date);
    if (!check) return 'none';
    return check.sober ? 'sober' : 'consumed';
  };

  const getDateStatusColor = (date: string) => {
    const status = getDateStatus(date);
    switch (status) {
      case 'sober': return '#4CAF50';
      case 'consumed': return '#f44336';
      default: return '#e0e0e0';
    }
  };

  const getDateStatusIcon = (date: string) => {
    const status = getDateStatus(date);
    switch (status) {
      case 'sober': return 'checkmark-circle';
      case 'consumed': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  const generateCalendarDays = async () => {
    const today = new Date();
    const todayString = getTodayString();
    const months = [];
    
    // Charger la date d'initialisation pour déterminer le mois de début
    let startDate = new Date();
    try {
      const sobrietyData = await StorageService.loadSobrietyData();
      if (sobrietyData && sobrietyData.startDate) {
        startDate = new Date(sobrietyData.startDate);
        console.log('Date d\'initialisation:', sobrietyData.startDate);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de sobriété:', error);
    }
    
    // Calculer le nombre de mois depuis l'initialisation
    const monthsSinceStart = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                            (today.getMonth() - startDate.getMonth());
    
    // Générer seulement le mois précédent depuis l'initialisation
    const monthsToShow = Math.min(monthsSinceStart + 1, 1); // Maximum 1 mois précédent
    
    for (let monthOffset = monthsToShow - 1; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date(today);
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      // Premier jour du mois
      const firstDay = new Date(year, month, 1);
      // Dernier jour du mois
      const lastDay = new Date(year, month + 1, 0);
      
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
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateString === todayString;
        
        // Debug pour le 23-24 octobre
        if (currentDate.getDate() === 23 || currentDate.getDate() === 24) {
          console.log('Génération calendrier - Date:', currentDate.getDate(), 'DateString:', dateString, 'IsToday:', isToday);
        }
        
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
      
      months.push({
        name: monthName,
        weeks,
        year,
        month: month + 1
      });
    }
    
    return months;
  };

  const handleDateSelect = (date: string) => {
    const today = getTodayString();
    
    console.log('Date sélectionnée:', date);
    console.log('Date d\'aujourd\'hui:', today);
    console.log('Comparaison date > today:', date > today);
    
    // Empêcher la sélection des jours futurs
    if (date > today) {
      Alert.alert(
        'Date future',
        'Vous ne pouvez pas vérifier des jours dans le futur.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedDate(date);
    
    // Pré-remplir les notes s'il y en a déjà pour cette date
    const existingCheck = dailyChecks.find(check => check.date === date);
    setNotes(existingCheck?.notes || '');
    
    setShowCheckModal(true);
  };

  const handleCheckSubmit = async (sober: boolean) => {
    if (!selectedDate) return;

    try {
      const check: DailyCheck = {
        date: selectedDate,
        sober,
        notes: notes.trim() || undefined,
      };

      // Sauvegarder la vérification
      await StorageService.saveDailyCheck(check);
      
      // Recalculer et mettre à jour les statistiques
      await updateStatistics();
      
      await loadData(); // Recharger les données du calendrier
      setShowCheckModal(false);
      
      Alert.alert(
        'Succès',
        `Vérification enregistrée pour le ${formatDate(selectedDate)}`
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la vérification.');
    }
  };

  const updateStatistics = async () => {
    try {
      await StorageService.recalculateStatistics();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
  };

  const handleDeleteCheck = () => {
    if (!selectedDate) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await StorageService.deleteDailyCheck(selectedDate);
      await updateStatistics(); // Mettre à jour les statistiques
      await loadData();
      setShowCheckModal(false);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
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

          // Les mois du calendrier sont maintenant chargés dans l'état calendarMonths
  const selectedCheck = dailyChecks.find(c => c.date === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Historique des vérifications</Text>
          <Text style={styles.subtitle}>
            Sélectionnez une date pour voir ou modifier votre vérification
          </Text>

          {calendarMonths.map((month, monthIndex) => (
            <View key={`${month.year}-${month.month}`} style={styles.monthContainer}>
              <Text style={styles.monthTitle}>{month.name}</Text>
              
              {/* En-têtes des jours */}
              <View style={styles.weekHeader}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                  <Text key={index} style={styles.dayHeader}>{day}</Text>
                ))}
              </View>
              
              {/* Semaines du mois */}
              {month.weeks.map((week: any, weekIndex: number) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((day: any, dayIndex: number) => {
                    const today = getTodayString();
                    const isFutureDay = day.date > today;
                    
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
                        disabled={isFutureDay}
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
          ))}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Sobre</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
              <Text style={styles.legendText}>Consommé</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e0e0e0' }]} />
              <Text style={styles.legendText}>Non vérifié</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de vérification */}
      <Modal
        visible={showCheckModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCheckModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCheckModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {selectedCheck ? 'Modifier la vérification' : 'Ajouter une vérification'}
            </Text>
            <Text style={styles.modalDate}>
              {selectedDate ? formatDate(selectedDate) : ''}
            </Text>

            {selectedCheck && (
              <View style={styles.currentStatus}>
                <Text style={styles.currentStatusText}>
                  Statut actuel : {selectedCheck.sober ? 'Sobre' : 'Consommé'}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.soberButton]} 
                onPress={() => handleCheckSubmit(true)}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.modalButtonText}>Sobre</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.consumedButton]} 
                onPress={() => handleCheckSubmit(false)}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text style={styles.modalButtonText}>Consommé</Text>
              </TouchableOpacity>
            </View>

            {/* Section notes */}
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes (optionnelles)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ajoutez vos commentaires..."
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {selectedCheck && (
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDeleteCheck}
              >
                <Ionicons name="trash" size={20} color="#f44336" />
                <Text style={styles.deleteButtonText}>Supprimer cette vérification</Text>
              </TouchableOpacity>
            )}

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer la vérification</Text>
            <Text style={styles.modalText}>
              Voulez-vous supprimer la vérification du {selectedDate ? formatDate(selectedDate) : ''} ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteConfirmButton]} 
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>Supprimer</Text>
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
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
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
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  currentStatus: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  currentStatusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  soberButton: {
    backgroundColor: '#4CAF50',
  },
  consumedButton: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
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
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 80,
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
