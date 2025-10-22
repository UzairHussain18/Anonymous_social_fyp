import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { whisperWallAPI } from '../../services/api';
import Toast from 'react-native-toast-message';
import WebScrollView from '../../components/WebScrollView';

const WhisperWallScreen: React.FC = () => {
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moods = [
    { id: 'Vent', name: 'Vent', icon: '😤', color: '#FF4D6D' },
    { id: 'Confession', name: 'Confession', icon: '🤫', color: '#A259FF' },
    { id: 'Advice', name: 'Advice', icon: '💡', color: '#00FFD1' },
    { id: 'Random', name: 'Random', icon: '🎲', color: '#FFB800' },
    { id: 'Comedy', name: 'Happy', icon: '😊', color: '#32CD32' },
    { id: 'Music', name: 'Sad', icon: '😢', color: '#4682B4' },
  ];

  const modalScale = useSharedValue(0);

  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: modalScale.value }],
    };
  });

  const openCreateModal = () => {
    setShowCreateModal(true);
    modalScale.value = withSpring(1);
  };

  const closeCreateModal = () => {
    modalScale.value = withSpring(0, {}, () => {
      setShowCreateModal(false);
      setWhisperText('');
      setSelectedMood(null);
    });
  };

  const handleSubmitWhisper = async () => {
    if (!whisperText.trim() || !selectedMood) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please write your whisper and select a mood.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const whisperData = {
        content: {
          text: whisperText.trim(),
        },
        category: selectedMood,
        tags: ['whisperwall', 'disappearing', selectedMood], // Add WhisperWall hashtags
      };

      const response = await whisperWallAPI.createWhisperPost(whisperData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your whisper has been shared!',
        });
        closeCreateModal();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to share whisper',
        });
      }
    } catch (error: any) {
      console.log('Whisper creation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'flex-start',
    },
    timerText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
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
    createButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.medium,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    floatingButton: {
      position: 'absolute',
      bottom: 30,
      right: 30,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.large,
    },
    floatingButtonText: {
      fontSize: 28,
      color: theme.colors.textInverse,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      width: '100%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    moodSelector: {
      marginBottom: theme.spacing.xl,
    },
    moodLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    moodOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    moodOption: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: theme.colors.background,
    },
    moodOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    moodIcon: {
      fontSize: 20,
      marginRight: theme.spacing.sm,
    },
    moodName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: theme.spacing.xl,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginHorizontal: theme.spacing.sm,
    },
    cancelButton: {
      backgroundColor: theme.colors.border,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.textSecondary,
    },
    submitButtonText: {
      color: theme.colors.textInverse,
    },
    featuresContainer: {
      marginBottom: theme.spacing.xl,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
    },
    featureIcon: {
      fontSize: 32,
      marginRight: theme.spacing.md,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  const features = [
    {
      icon: '👻',
      title: 'Anonymous Posts',
      description: 'Share your thoughts with randomly generated usernames',
    },
    {
      icon: '⏰',
      title: '24-Hour Limit',
      description: 'All posts automatically disappear after 24 hours',
    },
    {
      icon: '🔗',
      title: 'Whisper Chains',
      description: 'Pass messages anonymously from user to user',
    },
    {
      icon: '🏠',
      title: 'Confession Rooms',
      description: 'Join themed 30-minute confession sessions',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.background]}
        style={styles.header}
      >
        <Text style={styles.title}>WhisperWall 👻</Text>
        <Text style={styles.subtitle}>
          Your anonymous sanctuary
        </Text>
        <View style={styles.timerContainer}>
          <Text>⏰</Text>
          <Text style={styles.timerText}>
            Next cleanup in 18h 42m
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <WebScrollView style={styles.content}>
        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>💭</Text>
          <Text style={styles.placeholderTitle}>
            The Wall Awaits Your Whisper
          </Text>
          <Text style={styles.placeholderText}>
            Share your deepest thoughts, confessions, or random musings completely anonymously. No judgement, just authentic human connection.
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
            <Text style={styles.createButtonText}>
              Share a Whisper
            </Text>
          </TouchableOpacity>
        </View>
      </WebScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={openCreateModal}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Create Whisper Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="none"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, animatedModalStyle]}>
            <Text style={styles.modalTitle}>Share a Whisper</Text>
            <Text style={styles.modalSubtitle}>
              Your identity will remain completely anonymous
            </Text>

            {/* Mood Selector */}
            <View style={styles.moodSelector}>
              <Text style={styles.moodLabel}>Choose your mood:</Text>
              <View style={styles.moodOptions}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.id && styles.moodOptionSelected,
                    ]}
                    onPress={() => setSelectedMood(mood.id)}
                  >
                    <Text style={styles.moodIcon}>{mood.icon}</Text>
                    <Text style={styles.moodName}>{mood.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind? Share your whisper..."
              placeholderTextColor={theme.colors.textSecondary}
              value={whisperText}
              onChangeText={setWhisperText}
              multiline
              maxLength={2000}
              returnKeyType="done"
              blurOnSubmit={true}
              textAlignVertical="top"
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeCreateModal}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  (!whisperText.trim() || !selectedMood || isSubmitting) && styles.submitButtonDisabled
                ]}
                disabled={!whisperText.trim() || !selectedMood || isSubmitting}
                onPress={handleSubmitWhisper}
              >
                <Text style={[styles.buttonText, styles.submitButtonText]}>
                  {isSubmitting ? 'Sharing...' : 'Share Whisper'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default WhisperWallScreen;
