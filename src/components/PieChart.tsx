import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';

interface PieChartData {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export default function PieChart({ data, size = 150 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 5}
            fill="#e0e0e0"
          />
        </Svg>
      </View>
    );
  }

  let currentAngle = -90; // Commencer en haut
  const radius = size / 2 - 5;
  const centerX = size / 2;
  const centerY = size / 2;

  // Filtrer les données avec valeur > 0
  const filteredData = data.filter(item => item.value > 0);

  const paths = filteredData.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Convertir les angles en radians
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    // Calculer les points de début et de fin
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    // Si l'angle est de 360 degrés (100%), dessiner un cercle complet
    if (Math.abs(angle - 360) < 0.01) {
      return (
        <Circle
          key={index}
          cx={centerX}
          cy={centerY}
          r={radius}
          fill={item.color}
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    
    // Déterminer si l'arc est grand (plus de 180 degrés)
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // Créer le chemin SVG pour l'arc
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');
    
    currentAngle = endAngle;
    
    return (
      <Path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {paths}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

