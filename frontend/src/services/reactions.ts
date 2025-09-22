import axios, { AxiosResponse } from 'axios';
import { api } from './api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
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

// Reactions API
export const reactionsAPI = {
  addReaction: async (
    postId: string,
    reactionType: 'funny' | 'rage' | 'shock' | 'relatable' | 'love' | 'thinking'
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/reactions/${postId}`,
      { reactionType }
    );
    return response.data;
  },

  removeReaction: async (postId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(
      `/reactions/${postId}`
    );
    return response.data;
  },

  getReactions: async (
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
};
