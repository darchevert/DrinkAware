import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  textColor?: string;
  labelColor?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80; // Padding pour le conteneur

export default function BarChart({ 
  data, 
  maxValue, 
  height = 200,
  showValues = true,
  textColor = '#333',
  labelColor = '#666',
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value), 1);
  const availableWidth = CHART_WIDTH - 40; // Padding horizontal
  const spacing = 12; // Espacement entre les barres
  const barWidth = Math.max(40, (availableWidth - (data.length - 1) * spacing) / data.length);

  const chartAreaHeight = height - 60; // Hauteur disponible pour les barres (moins l'espace pour les labels)

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = calculatedMaxValue > 0 
            ? (item.value / calculatedMaxValue) * chartAreaHeight 
            : 0;
          
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.barContainer, { height: chartAreaHeight }]}>
                {showValues && (
                  <Text style={[styles.valueLabel, { color: textColor }]}>{item.value}</Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 2), // Minimum 2px pour la visibilité
                      width: barWidth,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.labelContainer}>
                <Text style={[styles.label, { color: labelColor }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 8,
  },
  bar: {
    borderRadius: 4,
    minHeight: 2,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  labelContainer: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

