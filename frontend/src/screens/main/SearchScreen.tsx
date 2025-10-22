import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postsAPI, userAPI } from '../../services/api';

interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
  type: 'post' | 'user' | 'hashtag';
}

interface SearchResult {
  _id: string;
  type: 'post' | 'user' | 'hashtag';
  title: string;
  subtitle?: string;
  avatar?: string;
  category?: string;
  content?: string;
  author?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt?: string;
  username?: string;
  bio?: string;
  stats?: {
    karmaScore: number;
    followers: number;
  };
}

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.log('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (query: string, type: 'post' | 'user' | 'hashtag') => {
    try {
      const newHistoryItem: SearchHistory = {
        id: Date.now().toString(),
        query,
        timestamp: Date.now(),
        type,
      };

      const updatedHistory = [
        newHistoryItem,
        ...searchHistory.filter(item => item.query !== query)
      ].slice(0, 10); // Keep only last 10 searches

      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.log('Error saving search history:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowHistory(false);

    try {
      const allResults: SearchResult[] = [];

      // Search for users
      try {
        // Remove @ symbol from query for user search
        const cleanQuery = query.replace(/^@/, '');
        console.log('🔍 Searching for users with query:', cleanQuery);
        const userResponse = await userAPI.searchUsers(cleanQuery);
        console.log('🔍 User search response:', userResponse);
        if (userResponse.success && userResponse.users) {
          console.log('🔍 Found users:', userResponse.users.length);
          const userResults: SearchResult[] = userResponse.users.map((user: any) => ({
            _id: user._id,
            type: 'user' as const,
            title: `@${user.username}`,
            subtitle: user.bio ? `${user.bio.substring(0, 50)}${user.bio.length > 50 ? '...' : ''}` : 'User',
            avatar: user.avatar,
            username: user.username,
            bio: user.bio,
            stats: user.stats,
          }));
          allResults.push(...userResults);
        } else {
          console.log('🔍 No users found or response failed:', userResponse);
        }
      } catch (error) {
        console.log('🔍 User search error:', error);
      }

      // Search for posts
      try {
        const postResponse = await postsAPI.searchPosts(query, 1, 10);
        if (postResponse.success && postResponse.data) {
          const postResults: SearchResult[] = postResponse.data.map((post: any) => ({
            _id: post._id,
            type: 'post' as const,
            title: post.content?.text ? post.content.text.substring(0, 50) + (post.content.text.length > 50 ? '...' : '') : 'Post',
            subtitle: `Posted by @${post.author?.username || 'Unknown'}`,
            category: post.category,
            content: post.content?.text,
            author: post.author,
            createdAt: post.createdAt,
          }));
          allResults.push(...postResults);
        }
      } catch (error) {
        console.log('Post search error:', error);
      }

      // Add hashtag suggestions if query starts with #
      if (query.startsWith('#')) {
        const hashtagResult: SearchResult = {
          _id: `hashtag_${query}`,
          type: 'hashtag',
          title: query,
          subtitle: 'Hashtag',
        };
        allResults.unshift(hashtagResult);
      }

      setSearchResults(allResults);
      console.log('🔍 Final search results:', allResults);
      console.log('🔍 Search results count:', allResults.length);
      await saveSearchHistory(query, 'post');
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryItemPress = (item: SearchHistory) => {
    setSearchQuery(item.query);
    handleSearch(item.query);
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.log('Error clearing history:', error);
    }
  };

  const handleResultPress = (item: SearchResult) => {
    if (item.type === 'user') {
      navigation.navigate('UserProfile' as never, { username: item.username } as never);
    } else if (item.type === 'post') {
      navigation.navigate('PostDetail' as never, { postId: item._id } as never);
    } else if (item.type === 'hashtag') {
      // Navigate to hashtag page or show posts with this hashtag
      console.log('Hashtag clicked:', item.title);
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultContent}>
        {item.avatar && (
          <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
        )}
        <View style={styles.resultText}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
          )}
          {item.content && (
            <Text style={styles.resultContentText} numberOfLines={2}>
              {item.content}
            </Text>
          )}
          {item.category && (
            <Text style={styles.resultCategory}>#{item.category}</Text>
          )}
        </View>
        <View style={styles.resultType}>
          <Text style={styles.resultTypeText}>
            {item.type === 'user' ? '👤' : item.type === 'post' ? '📝' : '🏷️'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: SearchHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryItemPress(item)}
    >
      <Text style={styles.historyIcon}>
        {item.type === 'post' ? '📝' : item.type === 'user' ? '👤' : '🏷️'}
      </Text>
      <Text style={styles.historyText}>{item.query}</Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    backButtonText: {
      fontSize: 20,
      color: theme.colors.text,
    },
    searchInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    content: {
      flex: 1,
      padding: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    historyIcon: {
      fontSize: 16,
      marginRight: theme.spacing.sm,
    },
    historyText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    clearHistoryButton: {
      alignSelf: 'flex-end',
      paddingVertical: theme.spacing.sm,
    },
    clearHistoryText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    resultItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    resultContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    resultAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: theme.spacing.md,
    },
    resultText: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    resultSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    resultContentText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    resultCategory: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      marginTop: theme.spacing.xs,
    },
    resultType: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
    },
    resultTypeText: {
      fontSize: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: 60,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    debugText: {
      fontSize: 12,
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, users, hashtags..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          autoFocus
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {showHistory && searchHistory.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearHistoryText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </>
        )}

        {!showHistory && (
          <>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {isSearching ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <Text style={styles.debugText}>Debug: Found {searchResults.length} results</Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                />
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  Try searching for posts, users, or hashtags
                </Text>
              </View>
            )}
          </>
        )}

        {showHistory && searchHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Start Searching</Text>
            <Text style={styles.emptyText}>
              Search for posts, users, or hashtags to see them here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SearchScreen;
