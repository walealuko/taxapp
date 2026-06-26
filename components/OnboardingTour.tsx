import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { TYPOGRAPHY } from '../constants/typography';

const TOUR_STEPS = [
  {
    title: 'Welcome to TaxApp! 🇳🇬',
    description: 'Your intuitive assistant for navigating Nigeria\'s tax laws. Let\'s show you around.',
    icon: 'hand-wave',
  },
  {
    title: 'Stay Compliant',
    description: 'Check the Compliance Calendar to track your VAT, WHT, and PAYE deadlines so you never pay a penalty.',
    icon: 'calendar-clock',
  },
  {
    title: 'Smart Calculations',
    description: 'Use our calculators to get instant tax estimates. We handle the complex brackets and reliefs for you.',
    icon: 'calculator',
  },
  {
    title: 'Export & File',
    description: 'Generate professional PDF reports for your records and link directly to the NRS portal for filing.',
    icon: 'file-pdf-box',
  },
];

export function OnboardingTour() {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const completed = await AsyncStorage.getItem('@taxapp_onboarding_complete');
    if (!completed) {
      setIsVisible(true);
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = async () => {
    await AsyncStorage.setItem('@taxapp_onboarding_complete', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={step.icon as any} size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text, ...TYPOGRAPHY.heading }]}>
            {step.title}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            {step.description}
          </Text>

          <View style={styles.footer}>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </Text>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '500',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
