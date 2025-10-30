import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SobrietyData, DailyCheck } from '../types/SobrietyTypes';
import { StorageService } from '../utils/Storage';

interface StatsScreenProps {
  navigation: any;
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const [sobrietyData, setSobrietyData] = useState<SobrietyData | null>(null);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const barAnim = {
    days: useRef(new Animated.Value(0)).current,
    hours: useRef(new Animated.Value(0)).current,
    minutes: useRef(new Animated.Value(0)).current,
    seconds: useRef(new Animated.Value(0)).current,
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand l'utilisateur revient sur cet écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const data = await StorageService.loadSobrietyData();
      const checks = await StorageService.loadDailyChecks();
      
      if (data) {
        setSobrietyData(data);
      }
      setDailyChecks(checks);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcul en continu du temps écoulé depuis startDate
  useEffect(() => {
    if (!sobrietyData?.startDate) return;
    const start = new Date(sobrietyData.startDate).getTime();
    const tick = () => {
      const diffMs = Math.max(0, Date.now() - start);
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed({ days, hours, minutes, seconds });

      // Mettre à jour l'animation des barres (normalisation simple)
      Animated.timing(barAnim.days, { toValue: Math.min(1, days / 30), duration: 300, useNativeDriver: false }).start();
      Animated.timing(barAnim.hours, { toValue: hours / 24, duration: 300, useNativeDriver: false }).start();
      Animated.timing(barAnim.minutes, { toValue: minutes / 60, duration: 300, useNativeDriver: false }).start();
      Animated.timing(barAnim.seconds, { toValue: seconds / 60, duration: 300, useNativeDriver: false }).start();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sobrietyData?.startDate]);

  const getStreakStats = () => {
    if (!dailyChecks.length) return { longestStreak: 0, averageStreak: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let streaks: number[] = [];
    
    // Trier les vérifications par date
    const sortedChecks = [...dailyChecks].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const check of sortedChecks) {
      if (check.sober) {
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
    const last7Days = dailyChecks.slice(-7);
    const soberDays = last7Days.filter(check => check.sober).length;
    return { soberDays, totalDays: last7Days.length };
  };

  const getMonthlyStats = () => {
    const last30Days = dailyChecks.slice(-30);
    const soberDays = last30Days.filter(check => check.sober).length;
    return { soberDays, totalDays: last30Days.length };
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
          <Text style={styles.errorText}>Erreur de chargement des données</Text>
        </View>
      </SafeAreaView>
    );
  }

  const streakStats = getStreakStats();
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const renderElapsedRow = (
    key: string,
    label: string,
    value: number,
    anim: Animated.Value,
    color: string,
  ) => {
    const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['6%', '100%'] });
    return (
      <View key={key} style={styles.elapsedRow}>
        <View style={styles.elapsedBarBg}>
          <Animated.View style={[styles.elapsedBarFill, { backgroundColor: color, width }]} />
          <View style={styles.elapsedTextWrap}>
            <View style={styles.elapsedLabel}>
              <Text style={styles.elapsedValue}>{value} {label}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistiques principales */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={30} color="#FF6B35" />
            <Text style={styles.statNumber}>{sobrietyData.currentStreak}</Text>
            <Text style={styles.statLabel}>Série actuelle</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={30} color="#4CAF50" />
            <Text style={styles.statNumber}>{sobrietyData.totalDays}</Text>
            <Text style={styles.statLabel}>Total jours</Text>
          </View>
        </View>

        {/* Elapsed timer style I Am Sober */}
        <View style={styles.elapsedCard}>
          <Text style={styles.sectionTitle}>Temps depuis la dernière consommation</Text>
          {renderElapsedRow('days', 'jours', elapsed.days, barAnim.days, '#4CAF50')}
          {renderElapsedRow('hours', 'heures', elapsed.hours, barAnim.hours, '#2196F3')}
          {renderElapsedRow('minutes', 'minutes', elapsed.minutes, barAnim.minutes, '#26C6DA')}
          {renderElapsedRow('seconds', 'secondes', elapsed.seconds, barAnim.seconds, '#9C27B0')}
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.detailedStatsContainer}>
          <Text style={styles.sectionTitle}>Statistiques Détaillées</Text>
          
          <View style={styles.statRow}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <View style={styles.statInfo}>
              <Text style={styles.statInfoLabel}>Plus longue série</Text>
              <Text style={styles.statInfoValue}>{streakStats.longestStreak} jours</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="trending-up" size={24} color="#2196F3" />
            <View style={styles.statInfo}>
              <Text style={styles.statInfoLabel}>Série moyenne</Text>
              <Text style={styles.statInfoValue}>{streakStats.averageStreak} jours</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="calendar-outline" size={24} color="#9C27B0" />
            <View style={styles.statInfo}>
              <Text style={styles.statInfoLabel}>7 derniers jours</Text>
              <Text style={styles.statInfoValue}>
                {weeklyStats.soberDays}/{weeklyStats.totalDays} jours
              </Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="calendar" size={24} color="#FF9800" />
            <View style={styles.statInfo}>
              <Text style={styles.statInfoLabel}>30 derniers jours</Text>
              <Text style={styles.statInfoValue}>
                {monthlyStats.soberDays}/{monthlyStats.totalDays} jours
              </Text>
            </View>
          </View>
        </View>

        {/* Jalons */}
        <View style={styles.milestonesContainer}>
          <Text style={styles.sectionTitle}>Jalons Atteints</Text>
          {sobrietyData.milestones
            .filter(m => m.achieved)
            .map(milestone => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneName}>{milestone.name}</Text>
                  <Text style={styles.milestoneDate}>
                    Atteint le {milestone.achievedDate ? 
                      new Date(milestone.achievedDate).toLocaleDateString('fr-FR') : 
                      'Date inconnue'
                    }
                  </Text>
                </View>
              </View>
            ))}
          
          {sobrietyData.milestones.filter(m => m.achieved).length === 0 && (
            <Text style={styles.noMilestonesText}>
              Aucun jalon atteint pour le moment. Continuez vos efforts !
            </Text>
          )}
        </View>

        {/* Historique récent */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Historique Récent</Text>
          {dailyChecks.slice(-10).reverse().map((check, index) => (
            <View key={index} style={styles.historyItem}>
              <Ionicons 
                name={check.sober ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={check.sober ? "#4CAF50" : "#f44336"} 
              />
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {new Date(check.date).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={styles.historyStatus}>
                  {check.notes ? check.notes : (check.sober ? 'Sobre' : 'Consommation')}
                </Text>
              </View>
            </View>
          ))}
          
          {dailyChecks.length === 0 && (
            <Text style={styles.noHistoryText}>
              Aucun historique disponible pour le moment.
            </Text>
          )}
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
    marginTop: 5,
    textAlign: 'center',
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
  elapsedLabel: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
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
});
