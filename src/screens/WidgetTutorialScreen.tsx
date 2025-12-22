import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../i18n/i18n';
import { useTheme } from '../theme/Theme';
import { triggerSelection } from '../utils/Haptics';
import WidgetPreview from '../components/WidgetPreview';

interface WidgetTutorialScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WidgetTutorialScreen({ navigation }: WidgetTutorialScreenProps) {
  const t = useT();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('widgetTutorial.step1.title'),
      description: t('widgetTutorial.step1.description'),
      icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      title: t('widgetTutorial.step2.title'),
      description: t('widgetTutorial.step2.description'),
      icon: 'apps-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      title: t('widgetTutorial.step3.title'),
      description: t('widgetTutorial.step3.description'),
      icon: 'search-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      title: t('widgetTutorial.step4.title'),
      description: t('widgetTutorial.step4.description'),
      icon: 'add-circle-outline' as keyof typeof Ionicons.glyphMap,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      triggerSelection();
      setCurrentStep(currentStep + 1);
    } else {
      triggerSelection();
      navigation.goBack();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      triggerSelection();
      setCurrentStep(currentStep - 1);
    } else {
      triggerSelection();
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    triggerSelection();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('widgetTutorial.title')}</Text>
          <View style={styles.headerButton} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Aperçu du widget */}
        <View style={[styles.previewContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            {t('widgetTutorial.previewTitle')}
          </Text>
          <WidgetPreview />
        </View>

        {/* Étapes du tutoriel */}
        <View style={[styles.stepsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.stepIndicator}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: index === currentStep ? colors.primary : colors.border,
                    width: index === currentStep ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.stepContentWrapper}>
            {/* Flèche gauche */}
            <TouchableOpacity
              style={[
                styles.navigationArrow,
                currentStep === 0 && styles.navigationArrowDisabled,
              ]}
              onPress={handleBack}
              disabled={currentStep === 0}
            >
              <Ionicons
                name="chevron-back"
                size={32}
                color={currentStep === 0 ? colors.mutedText : colors.primary}
              />
            </TouchableOpacity>

            {/* Contenu de l'étape */}
            <View style={styles.stepContent}>
              <View style={[styles.stepIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={steps[currentStep].icon} size={48} color={colors.primary} />
              </View>

              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {steps[currentStep].title}
              </Text>

              <Text style={[styles.stepDescription, { color: colors.mutedText }]}>
                {steps[currentStep].description}
              </Text>
            </View>

            {/* Flèche droite */}
            <TouchableOpacity
              style={[
                styles.navigationArrow,
                currentStep === steps.length - 1 && styles.navigationArrowDisabled,
              ]}
              onPress={handleNext}
              disabled={currentStep === steps.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={32}
                color={currentStep === steps.length - 1 ? colors.mutedText : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Note importante */}
        {Platform.OS === 'android' && (
          <View style={[styles.noteContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.mutedText }]}>
              {t('widgetTutorial.note')}
            </Text>
          </View>
        )}

        {Platform.OS !== 'android' && (
          <View style={[styles.noteContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={24} color={colors.mutedText} />
            <Text style={[styles.noteText, { color: colors.mutedText }]}>
              {t('widgetTutorial.iosNote')}
            </Text>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    height: 56,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  previewContainer: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepsContainer: {
    borderRadius: 15,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navigationArrow: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  navigationArrowDisabled: {
    opacity: 0.3,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stepIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    borderWidth: 1,
  },
  nextButton: {
    // Styles déjà définis via backgroundColor
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

