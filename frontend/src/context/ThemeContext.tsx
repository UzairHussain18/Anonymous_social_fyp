import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types
export type ThemeType = 'light' | 'dark' | 'amoled' | 'neon-whisper' | 'mood-shift';

export interface Theme {
  name: ThemeType;
  dark: boolean;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    textInverse: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    shadow: string;
    overlay: string;
    // Emotion colors for mood-shift theme
    happy: string;
    vent: string;
    chill: string;
    excited: string;
    thoughtful: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string; lineHeight: number };
    h2: { fontSize: number; fontWeight: string; lineHeight: number };
    h3: { fontSize: number; fontWeight: string; lineHeight: number };
    h4: { fontSize: number; fontWeight: string; lineHeight: number };
    body1: { fontSize: number; fontWeight: string; lineHeight: number };
    body2: { fontSize: number; fontWeight: string; lineHeight: number };
    caption: { fontSize: number; fontWeight: string; lineHeight: number };
    button: { fontSize: number; fontWeight: string; letterSpacing: number };
  };
  shadows: {
    small: object;
    medium: object;
    large: object;
  };
}

// Theme definitions
const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    h2: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
    h3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
    h4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body1: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
    body2: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: 'normal', lineHeight: 16 },
    button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

const themes: Record<ThemeType, Theme> = {
  light: {
    ...baseTheme,
    name: 'light',
    dark: false,
    colors: {
      primary: '#6366F1',
      primaryDark: '#4F46E5',
      secondary: '#EC4899',
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      card: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      textInverse: '#FFFFFF',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      shadow: '#000000',
      overlay: 'rgba(0, 0, 0, 0.5)',
      happy: '#FEF3C7',
      vent: '#FECACA',
      chill: '#DBEAFE',
      excited: '#FED7AA',
      thoughtful: '#E9D5FF',
    },
  },
  dark: {
    ...baseTheme,
    name: 'dark',
    dark: true,
    colors: {
      primary: '#818CF8',
      primaryDark: '#6366F1',
      secondary: '#F472B6',
      accent: '#34D399',
      background: '#111827',
      surface: '#1F2937',
      card: '#374151',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      textInverse: '#111827',
      border: '#4B5563',
      error: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
      info: '#60A5FA',
      shadow: '#000000',
      overlay: 'rgba(0, 0, 0, 0.7)',
      happy: '#365314',
      vent: '#7F1D1D',
      chill: '#1E3A8A',
      excited: '#9A3412',
      thoughtful: '#581C87',
    },
  },
  amoled: {
    ...baseTheme,
    name: 'amoled',
    dark: true,
    colors: {
      primary: '#00FFD1',
      primaryDark: '#00E6BC',
      secondary: '#A259FF',
      accent: '#FF4D6D',
      background: '#000000',
      surface: '#0B0F15',
      card: '#111827',
      text: '#FFFFFF',
      textSecondary: '#9CA3AF',
      textInverse: '#000000',
      border: '#1F2937',
      error: '#FF4D6D',
      success: '#00FFD1',
      warning: '#FFB800',
      info: '#3B82F6',
      shadow: '#000000',
      overlay: 'rgba(0, 0, 0, 0.8)',
      happy: '#FFD700',
      vent: '#FF4D6D',
      chill: '#00FFD1',
      excited: '#FF6B35',
      thoughtful: '#A259FF',
    },
  },
  'neon-whisper': {
    ...baseTheme,
    name: 'neon-whisper',
    dark: true,
    colors: {
      primary: '#00FFD1',
      primaryDark: '#00D4AA',
      secondary: '#A259FF',
      accent: '#FF4D6D',
      background: '#0B0F15',
      surface: '#111827',
      card: '#1F2937',
      text: '#F0F9FF',
      textSecondary: '#94A3B8',
      textInverse: '#0B0F15',
      border: '#334155',
      error: '#FF4D6D',
      success: '#00FFD1',
      warning: '#FBBF24',
      info: '#60A5FA',
      shadow: '#000000',
      overlay: 'rgba(11, 15, 21, 0.9)',
      happy: '#FFD700',
      vent: '#FF4D6D',
      chill: '#00FFD1',
      excited: '#FF6B35',
      thoughtful: '#A259FF',
    },
  },
  'mood-shift': {
    ...baseTheme,
    name: 'mood-shift',
    dark: false,
    colors: {
      primary: '#6366F1',
      primaryDark: '#4F46E5',
      secondary: '#EC4899',
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      card: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      textInverse: '#FFFFFF',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      shadow: '#000000',
      overlay: 'rgba(0, 0, 0, 0.5)',
      happy: '#FEF3C7',
      vent: '#7F1D1D',
      chill: '#DBEAFE',
      excited: '#FED7AA',
      thoughtful: '#E9D5FF',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeType;
  setTheme: (theme: ThemeType) => void;
  setMoodTheme: (mood: 'happy' | 'vent' | 'chill' | 'excited' | 'thoughtful') => void;
  resetMoodTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeType>('neon-whisper');
  const [moodOverride, setMoodOverride] = useState<string | null>(null);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('selectedTheme');
      if (savedTheme && themes[savedTheme as ThemeType]) {
        setThemeName(savedTheme as ThemeType);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeName(newTheme);
      await AsyncStorage.setItem('selectedTheme', newTheme);
      setMoodOverride(null); // Reset mood override
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setMoodTheme = (mood: 'happy' | 'vent' | 'chill' | 'excited' | 'thoughtful') => {
    if (themeName === 'mood-shift') {
      setMoodOverride(mood);
      // Auto-reset after 5 seconds
      setTimeout(() => {
        setMoodOverride(null);
      }, 5000);
    }
  };

  const resetMoodTheme = () => {
    setMoodOverride(null);
  };

  // Get current theme with mood override
  const getCurrentTheme = (): Theme => {
    let currentTheme = themes[themeName];
    
    // Fallback to light theme if current theme is not found
    if (!currentTheme) {
      console.warn(`Theme '${themeName}' not found, falling back to light theme`);
      currentTheme = themes['light'];
    }
    
    if (moodOverride && themeName === 'mood-shift') {
      // Apply mood color overlay
      const moodColors: Record<string, Partial<Theme['colors']>> = {
        happy: {
          background: '#FEF3C7',
          surface: '#FDE68A',
          primary: '#F59E0B',
        },
        vent: {
          background: '#FECACA',
          surface: '#FCA5A5',
          primary: '#EF4444',
        },
        chill: {
          background: '#DBEAFE',
          surface: '#93C5FD',
          primary: '#3B82F6',
        },
        excited: {
          background: '#FED7AA',
          surface: '#FDBA74',
          primary: '#F97316',
        },
        thoughtful: {
          background: '#E9D5FF',
          surface: '#C4B5FD',
          primary: '#8B5CF6',
        },
      };

      currentTheme = {
        ...currentTheme,
        colors: {
          ...currentTheme.colors,
          ...moodColors[moodOverride],
        },
      };
    }

    return currentTheme;
  };

  const contextValue: ThemeContextType = {
    theme: getCurrentTheme(),
    themeName,
    setTheme,
    setMoodTheme,
    resetMoodTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
