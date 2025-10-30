import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    const pulseAnimation = Animated.loop(
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
      const bounceAnimation = Animated.loop(
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

  const getIconSize = () => {
    const baseSize = 60;
    const growthMultiplier = 1 + (growthStage * 0.2);
    return baseSize * growthMultiplier;
  };

  const getIconColor = () => {
    if (type === 'tree') {
      return '#4CAF50';
    } else {
      return '#FF69B4';
    }
  };

  const renderCharacter = () => {
    const iconSize = getIconSize();
    const iconColor = getIconColor();
    
    if (type === 'tree') {
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
          <Ionicons name="leaf" size={iconSize} color={iconColor} />
          
          {/* Feuilles supplémentaires selon le niveau */}
          {Array.from({ length: Math.min(growthStage, 3) }).map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.additionalLeaf,
                {
                  transform: [
                    {
                      translateX: Math.cos(index * 2.09) * 25,
                    },
                    {
                      translateY: Math.sin(index * 2.09) * 25,
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="leaf-outline" size={iconSize * 0.3} color="#32CD32" />
            </Animated.View>
          ))}
          
          {/* Fruits selon le niveau */}
          {level >= 3 && (
            <Animated.View style={styles.fruit}>
              <Ionicons name="ellipse" size={8} color="#FFD700" />
            </Animated.View>
          )}
        </Animated.View>
      );
    } else {
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
          <Ionicons name="heart" size={iconSize} color={iconColor} />
          
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
    }
  };

  return (
    <View style={styles.container}>
      {renderCharacter()}
      
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
    width: 120,
    height: 120,
  },
  additionalLeaf: {
    position: 'absolute',
  },
  fruit: {
    position: 'absolute',
    top: -10,
    right: -5,
  },
  floatingHeart: {
    position: 'absolute',
    top: -20,
    right: -10,
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
