import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface AnimatedCharacterProps {
  type: 'tree' | 'pet';
  level: number;
  growthStage: number;
  isGrowing?: boolean;
}

const { width } = Dimensions.get('window');
const useNativeDriver = Platform.OS !== 'web';

export default function AnimatedCharacter({ 
  type, 
  level, 
  growthStage, 
  isGrowing = false 
}: AnimatedCharacterProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de croissance
    if (isGrowing) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver,
        }),
      ]).start();
    }
  }, [isGrowing, scaleAnim]);

  useEffect(() => {
    // Animation de pulsation continue
    const pulseAnimation =     Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  useEffect(() => {
    // Animation de rebond pour les animaux
    if (type === 'pet') {
      const bounceAnimation =       Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 1000,
            useNativeDriver,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver,
          }),
        ])
      );
      bounceAnimation.start();

      return () => bounceAnimation.stop();
    }
  }, [type, bounceAnim]);

  const getTreeSize = () => {
    const baseSize = 60;
    const growthMultiplier = 1 + (growthStage * 0.3);
    return baseSize * growthMultiplier;
  };

  const getPetSize = () => {
    const baseSize = 50;
    const levelMultiplier = 1 + (level * 0.2);
    return baseSize * levelMultiplier;
  };

  const renderTree = () => {
    const size = getTreeSize();
    const trunkHeight = size * 0.6;
    const crownSize = size * 0.8;
    
    return (
      <Animated.View 
        style={[
          styles.characterContainer,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Tronc */}
          <Path
            d={`M ${size/2 - 8} ${size - trunkHeight} L ${size/2 + 8} ${size - trunkHeight} L ${size/2 + 6} ${size} L ${size/2 - 6} ${size} Z`}
            fill="#8B4513"
          />
          
          {/* Couronne */}
          <Circle
            cx={size/2}
            cy={size - trunkHeight - crownSize/2}
            r={crownSize/2}
            fill="#228B22"
          />
          
          {/* Feuilles supplémentaires selon le niveau */}
          {Array.from({ length: Math.min(growthStage, 5) }).map((_, index) => (
            <Circle
              key={index}
              cx={size/2 + (Math.cos(index * 1.2) * crownSize/3)}
              cy={size - trunkHeight - crownSize/2 + (Math.sin(index * 1.2) * crownSize/3)}
              r={crownSize/6}
              fill="#32CD32"
            />
          ))}
          
          {/* Fruits/fleurs selon le niveau */}
          {level >= 3 && (
            <Circle
              cx={size/2}
              cy={size - trunkHeight - crownSize/2 - 10}
              r={4}
              fill="#FFD700"
            />
          )}
        </Svg>
        
        {/* Particules de croissance */}
        {isGrowing && (
          <Animated.View style={styles.particlesContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    transform: [
                      {
                        translateX: Math.cos(index * 1.047) * 30,
                      },
                      {
                        translateY: Math.sin(index * 1.047) * 30,
                      },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderPet = () => {
    const size = getPetSize();
    
    return (
      <Animated.View 
        style={[
          styles.characterContainer,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Corps */}
          <Circle
            cx={size/2}
            cy={size/2 + 5}
            r={size/3}
            fill="#FFB6C1"
          />
          
          {/* Tête */}
          <Circle
            cx={size/2}
            cy={size/2 - 10}
            r={size/4}
            fill="#FFB6C1"
          />
          
          {/* Oreilles */}
          <Circle
            cx={size/2 - 8}
            cy={size/2 - 15}
            r={size/8}
            fill="#FF69B4"
          />
          <Circle
            cx={size/2 + 8}
            cy={size/2 - 15}
            r={size/8}
            fill="#FF69B4"
          />
          
          {/* Yeux */}
          <Circle
            cx={size/2 - 5}
            cy={size/2 - 12}
            r={2}
            fill="#000"
          />
          <Circle
            cx={size/2 + 5}
            cy={size/2 - 12}
            r={2}
            fill="#000"
          />
          
          {/* Queue */}
          <Path
            d={`M ${size/2 + size/3} ${size/2 + 5} Q ${size/2 + size/2} ${size/2} ${size/2 + size/3} ${size/2 - 5}`}
            stroke="#FF69B4"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Pattes */}
          <Circle
            cx={size/2 - 8}
            cy={size/2 + size/3}
            r={3}
            fill="#FFB6C1"
          />
          <Circle
            cx={size/2 + 8}
            cy={size/2 + size/3}
            r={3}
            fill="#FFB6C1"
          />
        </Svg>
        
        {/* Cœur flottant */}
        {level >= 2 && (
          <Animated.View style={styles.floatingHeart}>
            <Ionicons name="heart" size={16} color="#FF69B4" />
          </Animated.View>
        )}
        
        {/* Particules de bonheur */}
        {isGrowing && (
          <Animated.View style={styles.particlesContainer}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    backgroundColor: '#FF69B4',
                    transform: [
                      {
                        translateX: Math.cos(index * 1.57) * 25,
                      },
                      {
                        translateY: Math.sin(index * 1.57) * 25,
                      },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {type === 'tree' ? renderTree() : renderPet()}
      
      {/* Informations du personnage */}
      <View style={styles.characterInfo}>
        <Text style={styles.levelText}>Niveau {level}</Text>
        <Text style={styles.stageText}>
          {type === 'tree' ? 'Étape' : 'Évolution'} {growthStage + 1}/10
        </Text>
        
        {/* Barre de progression vers le prochain niveau */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(growthStage % 10) * 10}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  particlesContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  floatingHeart: {
    position: 'absolute',
    top: -20,
    right: -10,
  },
  characterInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stageText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});
