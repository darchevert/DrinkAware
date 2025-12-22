import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, G, Text as SvgText } from 'react-native-svg';

interface LineChartData {
  label: string;
  value: number;
  date?: string;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 200;
const PADDING = 40;
// Marge supplémentaire en bas pour que les cercles et les valeurs basses (ex: 1) restent bien visibles
const BOTTOM_MARGIN_FOR_POINTS = 32;

export default function LineChart({
  data,
  height = CHART_HEIGHT,
  color = '#4CAF50',
  showDots = true,
  showGrid = true,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  const values = data.map(item => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;

  const chartWidth = CHART_WIDTH - PADDING * 2;
  const chartHeight = height - PADDING * 2 - BOTTOM_MARGIN_FOR_POINTS;
  // Pour l'alignement : si on a N points, on a N-1 intervalles, mais on veut que les points soient centrés
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const stepY = chartHeight / valueRange;

  // Générer les points pour la ligne
  const points = data.map((item, index) => {
    const x = PADDING + (index * stepX);
    // Position théorique du point
    const rawY = PADDING + chartHeight - (item.value - minValue) * stepY;
    // Marges pour que le cercle (≈ rayon 10) reste entièrement visible
    const minY = PADDING + 12;
    const maxY = PADDING + chartHeight - 8;
    const y = Math.min(Math.max(rawY, minY), maxY);
    return { x, y, value: item.value, label: item.label };
  });

  // Créer le chemin pour la ligne
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Lignes de grille horizontales - réduire le nombre pour éviter qu'elles masquent les points
  const gridLines = [];
  const gridSteps = Math.min(4, Math.max(2, Math.floor(data.length / 2))); // Moins de lignes de grille
  for (let i = 0; i <= gridSteps; i++) {
    const y = PADDING + (chartHeight / gridSteps) * i;
    const value = maxValue - (valueRange / gridSteps) * i;
    gridLines.push({ y, value: Math.round(value) });
  }

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={CHART_WIDTH} height={height}>
        <G>
          {/* Lignes de grille */}
          {showGrid && gridLines.map((grid, index) => (
            <Line
              key={`grid-${index}`}
              x1={PADDING}
              y1={grid.y}
              x2={PADDING + chartWidth}
              y2={grid.y}
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {/* Zone sous la courbe (dégradé) */}
          {points.length > 1 && (
            <Polyline
              points={`${PADDING},${PADDING + chartHeight} ${pathData.replace(/[ML]/g, '').trim()} ${PADDING + chartWidth},${PADDING + chartHeight}`}
              fill={color}
              fillOpacity="0.1"
              stroke="none"
            />
          )}

          {/* Ligne principale */}
          {points.length > 1 && (
            <Polyline
              points={pathData.replace(/[ML]/g, '').trim()}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points sur la ligne + valeur dans un cercle (badge) */}
          {showDots && points.map((point, index) => (
            <G key={`point-group-${index}`}>
              {/* Ombre du point pour plus de visibilité */}
              <Circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="rgba(0,0,0,0.18)"
              />
              {/* Cercle principal blanc avec bord coloré */}
              <Circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2"
              />
              {/* Valeur du point centrée dans le cercle */}
              <SvgText
                x={point.x}
                y={point.y + 3}  // léger décalage vertical pour centrer visuellement le texte
                fontSize="10"
                fontWeight="600"
                fill={color}
                textAnchor="middle"
              >
                {point.value}
              </SvgText>
            </G>
          ))}

        </G>
      </Svg>

      {/* Labels en bas - alignés avec les points */}
      <View style={styles.labelsContainer}>
        {data.map((item, index) => {
          const pointX = PADDING + (index * stepX);
          const labelWidth = (CHART_WIDTH - PADDING * 2) / data.length;
          return (
            <View 
              key={index} 
              style={[
                styles.labelContainer,
                {
                  width: labelWidth,
                  position: 'absolute',
                  left: pointX - labelWidth / 2,
                }
              ]}
            >
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
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
  labelsContainer: {
    position: 'relative',
    height: 40,
    marginTop: 8,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: 0,
  },
  label: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  valueLabel: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

