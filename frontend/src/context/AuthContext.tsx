import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export interface User {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  bio: string;
  preferences: string[];
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    karmaScore: number;
  };
  badges: Array<{
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastPostDate?: string;
  };
  settings: {
    theme: string;
    notifications: {
      followers: boolean;
      reactions: boolean;
      comments: boolean;
      whisperwall: boolean;
    };
    privacy: {
      showStats: boolean;
      allowDiscovery: boolean;
    };
  };
  isVerified: boolean;
  lastActive: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isFirstLaunch: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

interface SignupData {
  email: string;
  phone?: string;
  password: string;
  username: string;
  preferences: string[];
  avatar?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Check if first launch
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }

      // Check for stored token
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        // Verify token with backend
        try {
          const response = await authAPI.verifyToken(storedToken);
          if (response.success) {
            setToken(storedToken);
            setUser(response.user);
          } else {
            // Token is invalid, remove it
            await AsyncStorage.removeItem('authToken');
          }
        } catch (error) {
          console.log('Token verification failed:', error);
          await AsyncStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        setToken(response.token || null);
        setUser(response.user);
        if (response.token) {
          await AsyncStorage.setItem('authToken', response.token);
        }
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.log('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Extract specific error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          const firstError = validationErrors[0];
          if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else {
            errorMessage = firstError.msg || firstError.message || errorMessage;
          }
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid email or password.';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      // Log the data being sent for debugging
      console.log('Signup request data:', JSON.stringify(userData, null, 2));
      
      const response = await authAPI.signup(userData);
      
      if (response.success) {
        setToken(response.token || null);
        setUser(response.user);
        if (response.token) {
          await AsyncStorage.setItem('authToken', response.token);
        }
        return { success: true, message: response.message };
      } else {
        console.log('Signup failed with response:', response);
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.log('Signup error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        requestData: error.config?.data
      });
      
      // Extract more specific error messages
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          // Handle both string errors and object errors
          const firstError = validationErrors[0];
          if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else {
            errorMessage = firstError.msg || firstError.message || errorMessage;
          }
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid input data. Please check your information.';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AsyncStorage.multiRemove(['authToken', 'userPreferences']);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (token) {
      try {
        const response = await authAPI.verifyToken(token);
        if (response.success) {
          setUser(response.user);
        }
      } catch (error) {
        console.log('Error refreshing user:', error);
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isFirstLaunch,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
