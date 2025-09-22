import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to WhisperEcho',
    subtitle: 'Your Anonymous Voice',
    description: 'Share your thoughts, feelings, and stories without revealing your identity. Connect with others through authentic conversations.',
    icon: '🌟',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    title: 'WhisperWall',
    subtitle: 'Anonymous Expression',
    description: 'Post anonymously on the WhisperWall with randomly generated usernames. Your posts disappear after 24 hours, creating ephemeral conversations.',
    icon: '👻',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    title: 'Echo System',
    subtitle: 'Unique Following',
    description: 'Instead of "following," you "Echo" other users. Watch beautiful animations as you discover and connect with like-minded people.',
    icon: '🔄',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    id: '4',
    title: 'Emotion Reactions',
    subtitle: 'Express Yourself',
    description: 'React with emotions like 😂 Funny, 😡 Rage, 😲 Shock, 🫶 Relatable. Build karma and connect through authentic emotional responses.',
    icon: '❤️',
    gradient: ['#43e97b', '#38f9d7'],
  },
  {
    id: '5',
    title: 'Ready to Begin?',
    subtitle: 'Join the Community',
    description: 'Create your account and start your journey of anonymous expression and authentic connections.',
    icon: '🚀',
    gradient: ['#fa709a', '#fee140'],
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      translateX.value = withSpring(-nextIndex * width);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
      translateX.value = withSpring(-prevIndex * width);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login' as never);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    slideContainer: {
      width,
      height,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    icon: {
      fontSize: 60,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      fontWeight: '600',
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: theme.spacing.xxl,
    },
    navigationContainer: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.xl,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    button: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      minWidth: 100,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: theme.colors.textInverse,
    },
    secondaryButtonText: {
      color: theme.colors.textSecondary,
    },
    skipButton: {
      alignSelf: 'center',
      paddingVertical: theme.spacing.sm,
    },
    skipButtonText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: theme.colors.border,
    },
    paginationDotActive: {
      backgroundColor: theme.colors.primary,
      width: 24,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slideContainer}>
            <LinearGradient
              colors={slide.gradient}
              style={styles.iconContainer}
            >
              <Text style={styles.icon}>{slide.icon}</Text>
            </LinearGradient>
            
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.navigationContainer}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text
              style={[
                styles.buttonText,
                styles.secondaryButtonText,
                currentIndex === 0 && { opacity: 0.5 },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNext}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip Introduction</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default OnboardingScreen;
