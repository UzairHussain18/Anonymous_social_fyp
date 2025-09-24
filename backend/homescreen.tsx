import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { VideoView } from 'expo-video';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getFeed(1, 20);
      if (response.success) {
        setPosts(response.data || []);
      }
    } catch (error) {
      console.log('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await loadPosts();
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  // Refresh posts when screen comes into focus (e.g., after creating a post)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadPosts();
      }
    }, [user])
  );

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
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      ...theme.shadows.small,
    },
    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    headerText: {
      flex: 1,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
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
    startButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.medium,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.sm,
    },
    streakEmoji: {
      fontSize: 16,
    },
    streakText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    postCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    postCategory: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
    },
    postText: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
    },
    postMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    postDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    postReactions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reactionText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
    mediaContainer: {
      marginVertical: theme.spacing.md,
    },
    mediaItem: {
      marginRight: theme.spacing.sm,
    },
    mediaContent: {
      height: 200,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    videoContainer: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.sm,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    username: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    reactionEmoji: {
      fontSize: 20,
      marginRight: theme.spacing.xs,
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Media renderer component
  const renderMedia = (media: any[]) => {
    if (!media || media.length === 0) return null;

    const screenWidth = Dimensions.get('window').width;
    const mediaWidth = screenWidth - 40; // Account for padding

    return (
      <View style={styles.mediaContainer}>
        <FlatList
          data={media}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.mediaItem}>
              {item.mimetype?.startsWith('video/') ? (
                <View style={styles.videoContainer}>
                  <View style={[styles.mediaContent, { width: mediaWidth * 0.8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#fff' }}>Video: {item.url}</Text>
                  </View>
                </View>
              ) : (
                <Image 
                  source={{ uri: item.url }} 
                  style={[styles.mediaContent, { width: mediaWidth * 0.8 }]}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>
          
          {/* Header Text */}
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.username}! 👋
            </Text>
            <Text style={styles.subtitle}>
              Ready to echo some thoughts today?
            </Text>
          </View>
        </View>
        
        {user?.streaks?.currentStreak && user.streaks.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>
              {user.streaks.currentStreak} day streak!
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.length > 0 ? (
          // Show posts
          posts.map((post: any) => (
            <TouchableOpacity 
              key={post._id} 
              style={styles.postCard}
              onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
            >
              <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                  {post.author?.avatar ? (
                    <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.avatarText}>
                        {post.author?.username?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.username, { color: theme.colors.text }]}>
                    {post.author?.username || 'Unknown User'}
                  </Text>
                </View>
                <Text style={[styles.postDate, { color: theme.colors.textSecondary }]}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {post.category && (
                <Text style={[styles.postCategory, { color: theme.colors.primary }]}>
                  #{post.category}
                </Text>
              )}
              {post.content?.text && (
                <Text style={[styles.postText, { color: theme.colors.text }]} numberOfLines={3}>
                  {post.content.text}
                </Text>
              )}
              {renderMedia(post.content.media)}
              <View style={styles.postMeta}>
                <View style={styles.postReactions}>
                  {post.userReaction && (
                    <Text style={styles.reactionEmoji}>
                      {post.userReaction === 'love' ? '❤️' :
                       post.userReaction === 'funny' ? '😂' :
                       post.userReaction === 'rage' ? '😡' :
                       post.userReaction === 'shock' ? '😱' :
                       post.userReaction === 'relatable' ? '💯' :
                       '🤔'}
                    </Text>
                  )}
                  <Text style={[styles.reactionText, { color: theme.colors.textSecondary }]}>
                    {post.reactionCounts?.total || 0} reactions • {post.comments?.length || 0} comments
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : loading ? (
          // Show loading
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>⏳</Text>
            <Text style={styles.placeholderTitle}>Loading your feed...</Text>
          </View>
        ) : (
          // Show placeholder
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📱</Text>
            <Text style={styles.placeholderTitle}>
              Your Feed is Ready!
            </Text>
            <Text style={styles.placeholderText}>
              Start creating posts and following users to see content from your community appear here.
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Text style={styles.startButtonText}>
                Create Your First Post
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
