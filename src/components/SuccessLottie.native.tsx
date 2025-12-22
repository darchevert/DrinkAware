import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

// Charger le fichier Lottie - utiliser require() qui devrait fonctionner en production
// Si le fichier n'est pas trouvé, on utilisera le fallback
const lottieSource = require('../../assets/lottie/success.json');

export default function SuccessLottie({ onFinish }: { onFinish: () => void }) {
  // Si pour une raison quelconque la source n'est pas disponible, afficher une icône simple
  if (!lottieSource) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />
      </View>
    );
  }

  return (
    <LottieView
      source={lottieSource}
      autoPlay
      loop={false}
      onAnimationFinish={onFinish}
      style={{ width: 220, height: 220 }}
    />
  );
}


