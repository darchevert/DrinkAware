import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'has_completed_onboarding';

export class OnboardingService {
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const hasCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
      return hasCompleted === 'true';
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'onboarding:', error);
      return false;
    }
  }

  static async markOnboardingAsCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'onboarding:', error);
    }
  }

  static async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de l\'onboarding:', error);
    }
  }
}

