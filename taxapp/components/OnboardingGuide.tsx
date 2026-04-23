import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  title: string;
  description: string;
  icon: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Welcome to TaxApp Nigeria',
    description: 'Your complete tax calculator for PAYE, VAT, Withholding Tax, and Capital Gains Tax.',
    icon: '🧮',
  },
  {
    title: 'PAYE',
    description: 'Calculate Pay As You Earn tax using Nigeria\'s progressive tax brackets (7% - 24%). Perfect for employees.',
    icon: '💼',
  },
  {
    title: 'Business Taxes',
    description: 'Handle VAT calculations and Withholding Tax for your business. Streamlined for Nigerian tax laws.',
    icon: '🏢',
  },
  {
    title: 'Get Started',
    description: 'You\'re all set! Start calculating your taxes with confidence.',
    icon: '🎉',
  },
];

export default function OnboardingGuide() {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await SecureStore.getItemAsync('has_seen_onboarding');
      if (!hasSeenOnboarding) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await SecureStore.setItemAsync('has_seen_onboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleDismiss();
    }
  };

  const handleSkip = () => {
    handleDismiss();
  };

  const renderSlide = () => {
    const slide = SLIDES[currentIndex];
    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
      <View style={styles.slideContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.slideIcon}>{slide.icon}</Text>
        </View>
        <Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
          {slide.description}
        </Text>

        <View style={styles.paginationContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {renderSlide()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideIcon: {
    fontSize: 60,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    marginTop: 48,
    marginBottom: 32,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});