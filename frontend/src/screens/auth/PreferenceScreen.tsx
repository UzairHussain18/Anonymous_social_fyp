import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import WebScrollView from '../../components/WebScrollView';

const { width } = Dimensions.get('window');

interface PreferenceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const categories: PreferenceCategory[] = [
  { id: 'Gaming', name: 'Gaming', icon: '🎮', color: '#FF6B35', description: 'Video games, esports, streaming' },
  { id: 'Education', name: 'Education', icon: '📚', color: '#4ECDC4', description: 'Learning, studies, knowledge' },
  { id: 'Beauty', name: 'Beauty', icon: '💄', color: '#FFB6C1', description: 'Makeup, skincare, fashion' },
  { id: 'Fitness', name: 'Fitness', icon: '💪', color: '#32CD32', description: 'Workouts, health, wellness' },
  { id: 'Music', name: 'Music', icon: '🎵', color: '#9B59B6', description: 'Songs, artists, concerts' },
  { id: 'Technology', name: 'Technology', icon: '💻', color: '#3498DB', description: 'Tech news, gadgets, coding' },
  { id: 'Art', name: 'Art', icon: '🎨', color: '#E74C3C', description: 'Drawing, design, creativity' },
  { id: 'Food', name: 'Food', icon: '🍕', color: '#F39C12', description: 'Cooking, recipes, restaurants' },
  { id: 'Travel', name: 'Travel', icon: '✈️', color: '#1ABC9C', description: 'Adventures, destinations, culture' },
  { id: 'Sports', name: 'Sports', icon: '⚽', color: '#27AE60', description: 'Athletes, teams, competitions' },
  { id: 'Movies', name: 'Movies', icon: '🎬', color: '#8E44AD', description: 'Films, actors, reviews' },
  { id: 'Books', name: 'Books', icon: '📖', color: '#D35400', description: 'Reading, authors, literature' },
  { id: 'Fashion', name: 'Fashion', icon: '👗', color: '#E91E63', description: 'Style, trends, brands' },
  { id: 'Photography', name: 'Photography', icon: '📸', color: '#607D8B', description: 'Photos, cameras, editing' },
  { id: 'Comedy', name: 'Comedy', icon: '😂', color: '#FFC107', description: 'Humor, memes, entertainment' },
  { id: 'Science', name: 'Science', icon: '🔬', color: '#00BCD4', description: 'Research, discoveries, facts' },
  { id: 'Politics', name: 'Politics', icon: '🏛️', color: '#795548', description: 'News, debates, governance' },
  { id: 'Business', name: 'Business', icon: '💼', color: '#455A64', description: 'Entrepreneurship, finance, career' },
];

const PreferenceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { signup, isLoading } = useAuth();
  
  const userData = (route.params as any)?.userData;
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: headerScale.value }],
      opacity: headerOpacity.value,
    };
  });

  const togglePreference = (categoryId: string) => {
    setSelectedPreferences(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleComplete = async () => {
    if (selectedPreferences.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Select Preferences',
        text2: 'Please select at least one preference to continue.',
      });
      return;
    }

    if (!userData) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User data not found. Please start over.',
      });
      navigation.navigate('Signup' as never);
      return;
    }

    try {
      // Navigate to avatar selection with user data and preferences
      navigation.navigate('AvatarSelection' as never, {
        userData: userData,
        preferences: selectedPreferences,
      } as never);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong. Please try again.',
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    selectionInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
    },
    selectionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    categoriesContainer: {
      flex: 1,
      marginBottom: theme.spacing.xl,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryItem: {
      width: (width - theme.spacing.xl * 2 - theme.spacing.md) / 2,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: 'transparent',
      ...theme.shadows.small,
    },
    categoryItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    categoryIcon: {
      fontSize: 32,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    categoryDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    completeButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      ...theme.shadows.medium,
    },
    completeButtonDisabled: {
      opacity: 0.6,
    },
    completeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: theme.spacing.xl,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.small,
    },
    backButtonText: {
      fontSize: 18,
      color: theme.colors.text,
    },
  });

  const CategoryItem: React.FC<{ category: PreferenceCategory }> = ({ category }) => {
    const isSelected = selectedPreferences.includes(category.id);
    const scaleValue = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scaleValue.value }],
      };
    });

    const handlePress = () => {
      scaleValue.value = withSpring(0.95, {}, () => {
        scaleValue.value = withSpring(1);
      });
      togglePreference(category.id);
    };

    return (
      <TouchableOpacity onPress={handlePress}>
        <Animated.View
          style={[
            styles.categoryItem,
            isSelected && styles.categoryItemSelected,
            animatedStyle,
          ]}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={
        theme.name === 'neon-whisper'
          ? ['#0B0F15', '#111827']
          : [theme.colors.background, theme.colors.surface]
      }
      style={styles.container}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <WebScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={animatedHeaderStyle}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Interests</Text>
            <Text style={styles.subtitle}>
              Select categories that interest you
            </Text>
            <Text style={styles.description}>
              This helps us customize your feed and connect you with like-minded people.
              You can always change these later.
            </Text>
          </View>

          {/* Selection Info */}
          {selectedPreferences.length > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                {selectedPreferences.length} selected
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
          </View>
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            (selectedPreferences.length === 0 || isLoading) && styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={selectedPreferences.length === 0 || isLoading}
        >
          <Text style={styles.completeButtonText}>
            Continue to Avatar
          </Text>
        </TouchableOpacity>
      </WebScrollView>
    </LinearGradient>
  );
};

export default PreferenceScreen;
