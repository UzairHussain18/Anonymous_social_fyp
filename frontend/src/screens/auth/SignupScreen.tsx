import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const SignupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { signup, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formScale = useSharedValue(0.9);
  const formOpacity = useSharedValue(0);

  React.useEffect(() => {
    formScale.value = withSpring(1);
    formOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: formScale.value }],
      opacity: formOpacity.value,
    };
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validateUsername = (username: string): boolean => {
    if (!username) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    }
    if (username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    if (username.length > 30) {
      setErrors(prev => ({ ...prev, username: 'Username must be less than 30 characters' }));
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrors(prev => ({ ...prev, username: 'Username can only contain letters, numbers, and underscores' }));
      return false;
    }
    setErrors(prev => ({ ...prev, username: '' }));
    return true;
  };

  const getPasswordRequirements = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
    };
  };

  const validatePassword = (password: string): boolean => {
    const errors = [];
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    if (errors.length > 0) {
      setErrors(prev => ({ ...prev, password: errors[0] })); // Show first error
      return false;
    }
    
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation for better UX
    if (field === 'email' && value.length > 0) {
      validateEmail(value);
    } else if (field === 'username' && value.length > 0) {
      validateUsername(value);
    } else if (field === 'password' && value.length > 0) {
      validatePassword(value);
    } else if (field === 'confirmPassword' && value.length > 0) {
      validateConfirmPassword(value);
    } else {
      // Clear errors when user starts typing but field is empty
      if (errors[field as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleSignup = async () => {
    const isEmailValid = validateEmail(formData.email);
    const isUsernameValid = validateUsername(formData.username);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);

    if (!isEmailValid || !isUsernameValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Show loading toast
      Toast.show({
        type: 'info',
        text1: 'Validating Information...',
        text2: 'Please wait while we prepare your account',
        visibilityTime: 2000,
      });

      // Small delay to show the loading message
      setTimeout(() => {
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Information Validated!',
          text2: 'Now let\'s set up your preferences',
          visibilityTime: 2000,
        });

        // Navigate to preference selection after showing success message
        setTimeout(() => {
          navigation.navigate('Preference' as never, {
            userData: {
              email: formData.email.toLowerCase().trim(),
              username: formData.username.trim(),
              password: formData.password,
              phone: formData.phone.trim() || undefined,
            },
          } as never);
          setIsProcessing(false);
        }, 1000);
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
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
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    logo: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    labelOptional: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: 'normal',
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: theme.spacing.md,
      top: theme.spacing.md,
      padding: theme.spacing.sm,
    },
    passwordToggleText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    signupButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      ...theme.shadows.medium,
    },
    signupButtonDisabled: {
      opacity: 0.6,
    },
    signupButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginHorizontal: theme.spacing.md,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    loginLink: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    helpText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    passwordRequirements: {
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    requirementIcon: {
      fontSize: 12,
      marginRight: theme.spacing.xs,
      width: 16,
    },
    requirementText: {
      fontSize: 12,
      flex: 1,
    },
    requirementMet: {
      color: theme.colors.success || '#4CAF50',
    },
    requirementNotMet: {
      color: theme.colors.textSecondary,
    },
  });

  return (
    <LinearGradient
      colors={
        theme.name === 'neon-whisper'
          ? ['#0B0F15', '#111827']
          : [theme.colors.background, theme.colors.surface]
      }
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={animatedFormStyle}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>Join WhisperEcho</Text>
              <Text style={styles.subtitle}>
                Create your anonymous identity
              </Text>
            </View>

            {/* Signup Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>

              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.username && styles.inputError,
                  ]}
                  value={formData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  placeholder="Choose a unique username"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : (
                  <Text style={styles.helpText}>
                    3-30 characters, letters, numbers, and underscores only
                  </Text>
                )}
              </View>

              {/* Phone Input (Optional) */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Phone{' '}
                  <Text style={styles.labelOptional}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.password && styles.inputError,
                      { paddingRight: 60 },
                    ]}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    placeholder="Create a strong password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : showPasswordRequirements && formData.password ? (
                  <View style={styles.passwordRequirements}>
                    {(() => {
                      const requirements = getPasswordRequirements(formData.password);
                      return (
                        <>
                          <View style={styles.requirementItem}>
                            <Text style={[styles.requirementIcon, requirements.length ? styles.requirementMet : styles.requirementNotMet]}>
                              {requirements.length ? '✓' : '○'}
                            </Text>
                            <Text style={[styles.requirementText, requirements.length ? styles.requirementMet : styles.requirementNotMet]}>
                              At least 8 characters
                            </Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Text style={[styles.requirementIcon, requirements.uppercase ? styles.requirementMet : styles.requirementNotMet]}>
                              {requirements.uppercase ? '✓' : '○'}
                            </Text>
                            <Text style={[styles.requirementText, requirements.uppercase ? styles.requirementMet : styles.requirementNotMet]}>
                              One uppercase letter
                            </Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Text style={[styles.requirementIcon, requirements.lowercase ? styles.requirementMet : styles.requirementNotMet]}>
                              {requirements.lowercase ? '✓' : '○'}
                            </Text>
                            <Text style={[styles.requirementText, requirements.lowercase ? styles.requirementMet : styles.requirementNotMet]}>
                              One lowercase letter
                            </Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Text style={[styles.requirementIcon, requirements.number ? styles.requirementMet : styles.requirementNotMet]}>
                              {requirements.number ? '✓' : '○'}
                            </Text>
                            <Text style={[styles.requirementText, requirements.number ? styles.requirementMet : styles.requirementNotMet]}>
                              One number
                            </Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Text style={[styles.requirementIcon, requirements.special ? styles.requirementMet : styles.requirementNotMet]}>
                              {requirements.special ? '✓' : '○'}
                            </Text>
                            <Text style={[styles.requirementText, requirements.special ? styles.requirementMet : styles.requirementNotMet]}>
                              One special character
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                ) : (
                  <Text style={styles.helpText}>
                    8+ characters, uppercase, lowercase, number, special character
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.confirmPassword && styles.inputError,
                      { paddingRight: 60 },
                    ]}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={[
                  styles.signupButton,
                  (!formData.email || !formData.username || !formData.password || !formData.confirmPassword || isProcessing) && styles.signupButtonDisabled,
                ]}
                onPress={handleSignup}
                disabled={!formData.email || !formData.username || !formData.password || !formData.confirmPassword || isProcessing}
              >
                <Text style={styles.signupButtonText}>
                  {isProcessing ? 'Validating...' : 'Continue to Preferences'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default SignupScreen;
