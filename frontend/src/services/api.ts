import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Platform-specific API URLs
const getBaseURL = () => {
  // Allow override via Expo public env: EXPO_PUBLIC_API_BASE=http://192.168.x.x:5000
  const envBase = (process as any)?.env?.EXPO_PUBLIC_API_BASE as string | undefined;
  if (envBase) return envBase.endsWith('/api') ? envBase : `${envBase}/api`;

  if (!__DEV__) return 'https://your-production-url.com/api';

  // Development defaults per platform
  const YOUR_COMPUTER_IP = '192.168.10.6'; // Update to your LAN IP for real device testing

  if (Platform.OS === 'web') {
    return `http://localhost:5000/api`;
  }

  // Android emulator special loopback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:5000/api`;
  }

  // iOS simulator can use localhost; physical device needs LAN IP
  return `http://${YOUR_COMPUTER_IP}:5000/api`;
};

const BASE_URL = getBaseURL();

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Skip auth token for WhisperWall requests (they use session IDs)
    if (!config.url?.includes('/whisperwall')) {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      // You might want to redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
  user?: any;
  users?: T[]; // Add users field for user search
  count?: number; // Add count field for user search
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total?: number;
    hasMore: boolean;
  };
}

// Auth API
export const authAPI = {
  login: async (emailOrUsername: string, password: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/login', {
      identifier: emailOrUsername,
      password,
    });
    return response.data;
  },

  signup: async (userData: {
    email: string;
    phone?: string;
    password: string;
    username: string;
    preferences: string[];
    avatar?: string;
  }): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/signup', userData);
    return response.data;
  },

  verifyToken: async (token: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/verify-token', {
      token,
    });
    return response.data;
  },

  refreshToken: async (token: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/refresh-token', {
      token,
    });
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async (username: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/user/profile/${username}`);
    return response.data;
  },

  updateProfile: async (userData: {
    bio?: string;
    preferences?: string[];
    avatar?: string;
    settings?: any;
  }): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.put('/user/profile', userData);
    return response.data;
  },

  echoUser: async (userId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/user/echo/${userId}`);
    return response.data;
  },

  unechoUser: async (userId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/user/echo/${userId}`);
    return response.data;
  },

  discoverUsers: async (limit: number = 10): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/user/discover?limit=${limit}`);
    return response.data;
  },

  getEchoTrails: async (userId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/user/echo-trails/${userId}`);
    return response.data;
  },

  getNotifications: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get('/user/notifications');
    return response.data;
  },

  searchUsers: async (query: string, page: number = 1, limit: number = 20): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(
      `/user/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getUserProfile: async (username: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/user/profile/${username}`);
    return response.data;
  },

  followUser: async (userId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/user/follow/${userId}`);
    return response.data;
  },

  unfollowUser: async (userId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/user/follow/${userId}`);
    return response.data;
  },

  getFollowers: async (userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> => {
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get(
      `/user/${userId}/followers?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getFollowing: async (userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> => {
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get(
      `/user/${userId}/following?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  createPost: async (postData: {
    content: {
      text: string;
      image?: string;
      voiceNote?: string;
      media?: Array<{
        url: string;
        type: 'image' | 'video' | 'audio';
        filename: string;
        originalName: string;
        size: number;
      }>;
    };
    category: string;
    visibility?: 'normal' | 'disguise';
    disguiseAvatar?: string;
    vanishMode?: {
      enabled: boolean;
      duration?: '1hour' | '1day' | '1week';
    };
    tags?: string[];
  }): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/posts', postData);
    return response.data;
  },

  getFeed: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> => {
    const response: AxiosResponse<any> = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
    // Backend returns { success, posts, pagination }. Normalize to { success, data, pagination }
    const { success, posts, pagination } = response.data || {};
    return { success: !!success, data: posts || [], pagination } as PaginatedResponse<any>;
  },

  getExplorePosts: async (
    page: number = 1,
    limit: number = 20,
    category?: string,
    filter: 'trending' | 'recent' | 'popular' = 'trending'
  ): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      filter,
    });
    if (category) params.append('category', category);
    
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get(
      `/posts/explore?${params}`
    );
    return response.data;
  },

  searchPosts: async (
    query: string,
    page: number = 1,
    limit: number = 20,
    category?: string
  ): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    if (category) params.append('category', category);
    
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get(
      `/posts/search?${params}`
    );
    return response.data;
  },

  getPost: async (postId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/posts/${postId}`);
    return response.data;
  },

  getUserPosts: async (
    username: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<any>> => {
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get(
      `/posts/user/${username}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  addComment: async (
    postId: string,
    content: string,
    isAnonymous: boolean = false
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/posts/${postId}/comments`, {
      content,
      isAnonymous,
    });
    return response.data;
  },

  deletePost: async (postId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getConversations: async (): Promise<any> => {
    const response: AxiosResponse<any> = await api.get('/chat/conversations');
    return response.data;
  },
  getMessages: async (
    peerId: string,
    page: number = 1,
    limit: number = 30
  ): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/chat/messages/${peerId}?page=${page}&limit=${limit}`);
    return response.data;
  },
  sendMessage: async (peerId: string, text: string): Promise<any> => {
    const response: AxiosResponse<any> = await api.post(`/chat/messages/${peerId}`, { text });
    return response.data;
  },
  markRead: async (peerId: string): Promise<any> => {
    const response: AxiosResponse<any> = await api.post(`/chat/read/${peerId}`);
    return response.data;
  },
};

// WhisperWall API
export const whisperWallAPI = {
  createWhisperPost: async (postData: {
    content: {
      text: string;
      image?: string;
      voiceNote?: string;
      media?: Array<{
        url: string;
        type: 'image' | 'video' | 'audio';
        filename: string;
        originalName: string;
        size: number;
      }>;
    };
    category: string;
    tags?: string[];
    location?: {
      city: string;
      country: string;
      emoji: string;
    };
  }): Promise<ApiResponse> => {
    console.log('🌐 Making WhisperWall API call with data:', postData);
    console.log('🌐 API base URL:', api.defaults.baseURL);
    console.log('🌐 Full URL:', `${api.defaults.baseURL}/whisperwall`);
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/whisperwall', postData);
      console.log('🌐 WhisperWall API response:', response.data);
      console.log('🌐 Response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('🌐 WhisperWall API error:', error);
      console.error('🌐 Error response data:', (error as any).response?.data);
      console.error('🌐 Error status:', (error as any).response?.status);
      throw error;
    }
  },

  getWhisperPosts: async (
    page: number = 1,
    limit: number = 20,
    category?: string,
    filter: 'trending' | 'recent' | 'popular' = 'recent'
  ): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      filter,
    });
    if (category) params.append('category', category);
    
    console.log('🌐 Getting WhisperWall posts with params:', params.toString());
    try {
      const response: AxiosResponse<any> = await api.get(
        `/whisperwall?${params}`
      );
      console.log('🌐 WhisperWall posts response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🌐 WhisperWall posts error:', error);
      throw error;
    }
  },

  getWhisperPost: async (postId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(`/whisperwall/${postId}`);
    return response.data;
  },

  reactToWhisperPost: async (
    postId: string,
    reactionType: 'funny' | 'rage' | 'shock' | 'relatable' | 'love' | 'thinking'
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/whisperwall/${postId}/react`,
      { reactionType }
    );
    return response.data;
  },

  removeWhisperReaction: async (postId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/whisperwall/${postId}/react`);
    return response.data;
  },

  addWhisperComment: async (postId: string, content: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/whisperwall/${postId}/comments`,
      { content }
    );
    return response.data;
  },

  createWhisperChain: async (
    message: string,
    isForwarding: boolean = false,
    originalChainId?: string,
    hopCount?: number,
    originalMessage?: string
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/whisperwall/whisper-chain', {
      message,
      isForwarding,
      originalChainId,
      hopCount,
      originalMessage,
    });
    return response.data;
  },

  getConfessionRoom: async (roomId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(
      `/whisperwall/confession-room/${roomId}`
    );
    return response.data;
  },

  createConfessionPost: async (
    content: string,
    roomId: string,
    theme?: string
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/whisperwall/confession-room', {
      content,
      roomId,
      theme,
    });
    return response.data;
  },

  getRandomConfession: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get('/whisperwall/random-confession');
    return response.data;
  },

  getMoodHeatmap: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get('/whisperwall/mood-heatmap');
    return response.data;
  },
};

// Reactions API
export const reactionsAPI = {
  addReaction: async (
    postId: string,
    reactionType: 'funny' | 'rage' | 'shock' | 'relatable' | 'love' | 'thinking'
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/reactions/${postId}`, {
      reactionType,
    });
    return response.data;
  },

  removeReaction: async (postId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/reactions/${postId}`);
    return response.data;
  },

  getReactionUsers: async (
    postId: string,
    reactionType: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<any>> => {
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get(
      `/reactions/${postId}/users/${reactionType}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  reactToComment: async (
    postId: string,
    commentId: string,
    reactionType: 'funny' | 'love'
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/reactions/comments/${postId}/${commentId}`,
      { reactionType }
    );
    return response.data;
  },

  removeCommentReaction: async (postId: string, commentId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(
      `/reactions/comments/${postId}/${commentId}`
    );
    return response.data;
  },

  getTrendingReactions: async (
    timeframe: '1h' | '24h' | '7d' = '24h',
    limit: number = 10
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get(
      `/reactions/trending?timeframe=${timeframe}&limit=${limit}`
    );
    return response.data;
  },
};

// Media upload API
export const mediaAPI = {
  uploadSingle: async (file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('media', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const response: AxiosResponse<ApiResponse> = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultiple: async (files: Array<{
    uri: string;
    type: string;
    name: string;
    mediaType: 'photo' | 'video';
  }>): Promise<ApiResponse> => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      if (file.uri.startsWith('data:')) {
        // Handle web files (base64 data URLs)
        const base64Data = file.uri.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: file.type });
        formData.append('media', blob, file.name);
      } else {
        // Handle mobile files (file URIs)
        formData.append('media', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
      }
    });

    const response: AxiosResponse<ApiResponse> = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
