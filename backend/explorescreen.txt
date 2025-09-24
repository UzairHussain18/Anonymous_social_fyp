import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SimpleWebScrollView from '../../components/SimpleWebScrollView';

const categories = [
  { id: 'all', name: 'All', icon: '🌟' },
  { id: 'trending', name: 'Trending', icon: '🔥' },
  { id: 'Gaming', name: 'Gaming', icon: '🎮' },
  { id: 'Education', name: 'Education', icon: '📚' },
  { id: 'Beauty', name: 'Beauty', icon: '💄' },
  { id: 'Fitness', name: 'Fitness', icon: '💪' },
  { id: 'Music', name: 'Music', icon: '🎵' },
  { id: 'Technology', name: 'Technology', icon: '💻' },
  { id: 'Art', name: 'Art', icon: '🎨' },
  { id: 'Food', name: 'Food', icon: '🍕' },
];

const ExploreScreen: React.FC = () => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      fontSize: 16,
      color: theme.colors.text,
      padding: 0,
    },
    categoriesContainer: {
      paddingVertical: theme.spacing.lg,
    },
    categoriesScroll: {
      paddingLeft: theme.spacing.xl,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.round,
      marginRight: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryIcon: {
      fontSize: 16,
      marginRight: theme.spacing.sm,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    categoryTextActive: {
      color: theme.colors.textInverse,
    },
    content: {
      flex: 1,
      padding: theme.spacing.xl,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderIcon: {
      fontSize: 80,
      marginBottom: theme.spacing.lg,
    },
    placeholderTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: theme.spacing.xl,
    },
    exploreButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.medium,
    },
    exploreButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, users, topics..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <SimpleWebScrollView style={styles.content}>
        {/* Community Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2.3K</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>15.7K</Text>
            <Text style={styles.statLabel}>Posts Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89K</Text>
            <Text style={styles.statLabel}>Total Echoes</Text>
          </View>
        </View>

        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>🔍</Text>
          <Text style={styles.placeholderTitle}>
            Discover Amazing Content
          </Text>
          <Text style={styles.placeholderText}>
            Explore trending posts, discover new users, and find content that matches your interests.
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => {
              // For now, show a message that explore functionality is coming
              // In the future, this could load and display posts
              console.log('Explore functionality coming soon!');
            }}
          >
            <Text style={styles.exploreButtonText}>
              Start Exploring
            </Text>
          </TouchableOpacity>
        </View>
      </SimpleWebScrollView>
    </View>
  );
};

export default ExploreScreen;
