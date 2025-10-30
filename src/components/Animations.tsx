import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Platform } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export default function FadeInView({ children, duration = 500, delay = 0 }: FadeInViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver,
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
}

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
}

export function SlideInView({ 
  children, 
  direction = 'up', 
  duration = 500, 
  delay = 0 
}: SlideInViewProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver,
    }).start();
  }, [slideAnim, duration, delay]);

  const getTransform = () => {
    const translateValue = 50;
    
    switch (direction) {
      case 'left':
        return { translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-translateValue, 0],
        }) };
      case 'right':
        return { translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [translateValue, 0],
        }) };
      case 'down':
        return { translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-translateValue, 0],
        }) };
      case 'up':
      default:
        return { translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [translateValue, 0],
        }) };
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [getTransform()] }]}>
      {children}
    </Animated.View>
  );
}

interface BounceInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export function BounceInView({ children, duration = 600, delay = 0 }: BounceInViewProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(bounceAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver,
      tension: 100,
      friction: 8,
    }).start();
  }, [bounceAnim, duration, delay]);

  return (
    <Animated.View style={[styles.container, { 
      transform: [{ 
        scale: bounceAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1.2, 1],
        })
      }] 
    }]}>
      {children}
    </Animated.View>
  );
}

interface PulseViewProps {
  children: React.ReactNode;
  duration?: number;
}

export function PulseView({ children, duration = 1000 }: PulseViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: duration / 2,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver,
        }),
      ])
    );
    
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, [pulseAnim, duration]);

  return (
    <Animated.View style={[styles.container, { 
      transform: [{ scale: pulseAnim }] 
    }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
