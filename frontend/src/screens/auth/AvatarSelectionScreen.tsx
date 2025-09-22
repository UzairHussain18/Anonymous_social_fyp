import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
  Alert,
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
import SimpleWebScrollView from '../../components/SimpleWebScrollView';

const { width } = Dimensions.get('window');

interface AvatarOption {
  id: string;
  url: string;
  seed: string;
}

const AvatarSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { signup, isLoading } = useAuth();
  
  const userData = (route.params as any)?.userData;
  const preferences = (route.params as any)?.preferences;
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 600 });
    generateAvatarOptions();
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: headerScale.value }],
      opacity: headerOpacity.value,
    };
  });

  const generateAvatarOptions = () => {
    setIsGenerating(true);
    const options: AvatarOption[] = [];
    
    // Generate 12 different avatar options using DiceBear API
    const avatarStyles = ['avataaars', 'adventurer', 'big-smile', 'bottts', 'croodles', 'fun-emoji'];
    const seeds = [
      userData?.username || 'user1',
      `${userData?.username || 'user'}_alt1`,
      `${userData?.username || 'user'}_alt2`,
      `random_${Math.random().toString(36).substring(7)}`,
      `avatar_${Math.random().toString(36).substring(7)}`,
      `user_${Math.random().toString(36).substring(7)}`,
      `profile_${Math.random().toString(36).substring(7)}`,
      `pic_${Math.random().toString(36).substring(7)}`,
      `image_${Math.random().toString(36).substring(7)}`,
      `face_${Math.random().toString(36).substring(7)}`,
      `char_${Math.random().toString(36).substring(7)}`,
      `person_${Math.random().toString(36).substring(7)}`,
    ];

    seeds.forEach((seed, index) => {
      const style = avatarStyles[index % avatarStyles.length];
      const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=150`;
      
      options.push({
        id: `${style}_${seed}`,
        url,
        seed: `${style}_${seed}`,
      });
    });

    setAvatarOptions(options);
    setIsGenerating(false);
  };

  const handleAvatarSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar.url);
  };

  const handleComplete = async () => {
    if (!selectedAvatar) {
      Toast.show({
        type: 'error',
        text1: 'Select Avatar',
        text2: 'Please select an avatar to continue.',
      });
      return;
    }

    if (!userData || !preferences) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User data not found. Please start over.',
      });
      navigation.navigate('Signup' as never);
      return;
    }

    try {
      // Complete signup with avatar
      const signupData = {
        ...userData,
        preferences,
        avatar: selectedAvatar,
        phone: userData.phone && userData.phone.trim() !== '' ? userData.phone.trim() : undefined,
      };

      const result = await signup(signupData);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Welcome to WhisperEcho!',
          text2: 'Your account has been created successfully.',
        });
      } else {
        // Check if it's a validation error that should be shown on signup screen
        const validationErrorMessages = [
          'Password must be at least 8 characters long',
          'Password must contain at least one uppercase letter',
          'Password must contain at least one lowercase letter', 
          'Password must contain at least one number',
          'Password must contain at least one special character',
          'Please enter a valid email address',
          'Username must be',
          'Username can only contain'
        ];
        
        const isValidationError = validationErrorMessages.some(msg => 
          result.message.includes(msg)
        );
        
        if (isValidationError) {
          // Navigate back to signup screen with error
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: result.message,
          });
          navigation.navigate('Signup' as never);
        } else {
          // Show other errors here (like user already exists)
          Toast.show({
            type: 'error',
            text1: 'Signup Failed',
            text2: result.message,
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong. Please try again.',
      });
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Avatar Selection',
      'You can always add an avatar later in your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: async () => {
            // Complete signup without avatar
            if (!userData || !preferences) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'User data not found. Please start over.',
              });
              navigation.navigate('Signup' as never);
              return;
            }

            try {
              const signupData = {
                ...userData,
                preferences,
                avatar: null,
                phone: userData.phone && userData.phone.trim() !== '' ? userData.phone.trim() : undefined,
              };

              const result = await signup(signupData);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Welcome to WhisperEcho!',
                  text2: 'Your account has been created successfully.',
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Signup Failed',
                  text2: result.message,
                });
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
              });
            }
          }
        }
      ]
    );
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
    avatarGrid: {
      flex: 1,
      marginBottom: theme.spacing.xl,
    },
    avatarItem: {
      width: (width - theme.spacing.xl * 2 - theme.spacing.lg * 2) / 3,
      aspectRatio: 1,
      marginBottom: theme.spacing.lg,
      marginHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      borderWidth: 3,
      borderColor: 'transparent',
      ...theme.shadows.small,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: theme.borderRadius.md,
    },
    generateButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      ...theme.shadows.medium,
    },
    generateButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    completeButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
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
    skipButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    skipButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
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
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
    },
  });

  const AvatarItem: React.FC<{ item: AvatarOption }> = ({ item }) => {
    const isSelected = selectedAvatar === item.url;
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
      handleAvatarSelect(item);
    };

    return (
      <TouchableOpacity onPress={handlePress}>
        <Animated.View
          style={[
            styles.avatarItem,
            isSelected && styles.avatarItemSelected,
            animatedStyle,
          ]}
        >
          <Image 
            source={{ uri: item.url }} 
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderAvatarItem = ({ item }: { item: AvatarOption }) => {
    return <AvatarItem item={item} />;
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

      <SimpleWebScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={animatedHeaderStyle}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Avatar</Text>
            <Text style={styles.subtitle}>
              Pick an avatar that represents you
            </Text>
            <Text style={styles.description}>
              Your avatar will be displayed on your profile and posts. You can change it anytime in settings.
            </Text>
          </View>

          {/* Generate New Avatars Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateAvatarOptions}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate New Avatars'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Avatar Grid */}
        <View style={styles.avatarGrid}>
          {isGenerating ? (
            <Text style={styles.loadingText}>Generating avatars...</Text>
          ) : (
            <FlatList
              data={avatarOptions}
              renderItem={renderAvatarItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={{ alignItems: 'center' }}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.completeButton,
              (!selectedAvatar || isLoading) && styles.completeButtonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!selectedAvatar || isLoading}
          >
            <Text style={styles.completeButtonText}>
              {isLoading ? 'Creating Account...' : 'Complete Signup'}
            </Text>
          </TouchableOpacity>
        </View>
      </SimpleWebScrollView>
    </LinearGradient>
  );
};

export default AvatarSelectionScreen;
