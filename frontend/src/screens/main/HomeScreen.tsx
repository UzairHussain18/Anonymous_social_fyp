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
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import { reactionsAPI } from '../../services/reactions';
import { RootStackParamList } from '../../types/navigation';
import Toast from 'react-native-toast-message';

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

      const response = await postsAPI.getFeed(1, 20); // API call
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
    if (user) loadPosts();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) loadPosts();
    }, [user])
  );

  const handleReaction = async (postId: string, reactionType: 'funny' | 'rage' | 'shock' | 'relatable' | 'love' | 'thinking') => {
    try {
      const post = posts.find(p => p._id === postId);
      if (!post) return;
      
      if (post.userReaction === reactionType) {
        await reactionsAPI.removeReaction(postId);
        Toast.show({
          type: 'success',
          text1: 'Reaction removed',
        });
      } else {
        await reactionsAPI.addReaction(postId, reactionType);
        Toast.show({
          type: 'success',
          text1: 'Reaction added',
        });
      }
      // Refresh the posts to get updated reaction counts
      await loadPosts();
    } catch (error) {
      console.error('Error handling reaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update reaction',
      });
    }
  };

  const formatTimeRemaining = (vanishAt: string) => {
    const now = new Date();
    const vanishTime = new Date(vanishAt);
    const diff = vanishTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleShare = (post: any) => {
    // Simple share functionality - you can enhance this later
    Toast.show({
      type: 'info',
      text1: 'Share',
      text2: `Shared post by @${post.author?.username || 'Unknown'}`,
    });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
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
    avatarImage: { width: 50, height: 50, borderRadius: 25 },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
    headerText: { flex: 1 },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: { fontSize: 16, color: theme.colors.textSecondary },
    actionIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.small,
    },
    iconText: {
      fontSize: 18,
    },
    content: { flex: 1, padding: theme.spacing.xl },
    placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderIcon: { fontSize: 80, marginBottom: theme.spacing.lg },
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
    streakEmoji: { fontSize: 16 },
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
    postCategory: { fontSize: 12, fontWeight: '600', marginBottom: theme.spacing.sm },
    postText: { fontSize: 16, lineHeight: 24, marginBottom: theme.spacing.md },
    postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    postDate: { fontSize: 12 },
    postReactions: { flexDirection: 'row', alignItems: 'center' },
    reactionText: { fontSize: 12, marginLeft: theme.spacing.sm },
    commentButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    commentButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    mediaContainer: { marginVertical: theme.spacing.md },
    mediaItem: { marginRight: theme.spacing.sm },
    mediaContent: {
      height: 200,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    videoContainer: { borderRadius: theme.borderRadius.md, overflow: 'hidden' },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
    authorInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: theme.spacing.sm },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, marginRight: theme.spacing.sm, justifyContent: 'center', alignItems: 'center' },
    username: { fontSize: 16, fontWeight: 'bold' },
    reactionEmoji: { fontSize: 20, marginRight: theme.spacing.xs },
    postTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    whisperTag: {
      fontSize: 12,
      fontWeight: '600',
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    hashtagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.xs,
    },
    hashtag: {
      fontSize: 12,
      fontWeight: '500',
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: theme.spacing.sm,
    },
    actionBtn: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      flex: 1,
    },
    activeActionBtn: {
      backgroundColor: theme.colors.primary + '20',
    },
    actionBtnIcon: {
      fontSize: 20,
      marginBottom: theme.spacing.xs,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    actionBtnCount: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    mediaContainer: {
      marginVertical: theme.spacing.sm,
    },
    mediaItem: {
      marginRight: theme.spacing.sm,
    },
    mediaContent: {
      height: 200,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background,
    },
    videoContainer: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderMedia = (media: any[]) => {
    if (!media || media.length === 0) return null;
    
    console.log('🎬 Rendering media:', media); // Debug log
    
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = Math.min(screenWidth - 80, 300); // Max 300px width, with padding
    
    return (
      <View style={styles.mediaContainer}>
        <FlatList
          data={media}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => {
            console.log('🖼️ Rendering media item:', item); // Debug log
            return (
              <View style={styles.mediaItem}>
                {item.type === 'video' ? (
                  <View style={styles.videoContainer}>
                    <View style={[styles.mediaContent, { width: imageWidth, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#fff' }}>🎥 Video</Text>
                    </View>
                  </View>
                ) : (
                  <Image 
                    source={{ uri: item.url }} 
                    style={[styles.mediaContent, { width: imageWidth }]} 
                    resizeMode="cover"
                    onError={(error) => console.log('❌ Image load error:', error.nativeEvent.error, 'URL:', item.url)}
                    onLoad={() => console.log('✅ Image loaded successfully:', item.url)}
                  />
                )}
              </View>
            );
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || '?'}</Text>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.username}! 👋</Text>
            <Text style={styles.subtitle}>Ready to echo some thoughts today?</Text>
          </View>
          
          {/* Action Icons */}
          <View style={styles.actionIcons}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <Text style={styles.iconText}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {user?.streaks?.currentStreak && user.streaks.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{user?.streaks?.currentStreak} day streak!</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {posts.length > 0 ? (
          posts.map(post => (
            <TouchableOpacity key={post._id} style={styles.postCard} onPress={() => navigation.navigate('PostDetail', { postId: post._id })}>
              <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                  <TouchableOpacity onPress={() => post.author?.username && navigation.navigate('UserProfile', { username: post.author.username })} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {post.author?.avatar ? (
                      <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.avatarText}>{post.author?.username?.charAt(0).toUpperCase() || '?'}</Text>
                      </View>
                    )}
                    <Text style={[styles.username, { color: theme.colors.text }]}>{post.author?.username || 'Unknown User'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.postDate, { color: theme.colors.textSecondary }]}>{new Date(post.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.postTags}>
                {post.category && <Text style={[styles.postCategory, { color: theme.colors.primary }]}>#{post.category}</Text>}
                {post.isWhisperWall && (
                  <Text style={[styles.whisperTag, { color: theme.colors.warning || '#FF6B35' }]}>
                    👻 WhisperWall • {formatTimeRemaining(post.expiresAt)}
                  </Text>
                )}
                {post.vanishMode?.enabled && !post.isWhisperWall && (
                  <Text style={[styles.whisperTag, { color: theme.colors.warning || '#FF6B35' }]}>
                    👻 WhisperWall • {formatTimeRemaining(post.vanishMode.vanishAt)}
                  </Text>
                )}
                {post.tags && post.tags.length > 0 && (
                  <View style={styles.hashtagsContainer}>
                    {post.tags.map((tag: string, index: number) => (
                      <Text key={index} style={[styles.hashtag, { color: theme.colors.secondary || '#6B73FF' }]}>
                        #{tag}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              {post.content?.text && <Text style={[styles.postText, { color: theme.colors.text }]} numberOfLines={3}>{post.content.text}</Text>}
              {renderMedia(post.content.media)}
              
              {/* Like, Comment, Share Actions */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionBtn, post.userReaction && styles.activeActionBtn]}
                  onPress={() => handleReaction(post._id, 'love')}
                >
                  <Text style={styles.actionBtnIcon}>
                    {post.userReaction ? '👍' : '👍'}
                  </Text>
                  <Text style={styles.actionBtnText}>
                    {post.userReaction ? 'Liked' : 'Like'}
                  </Text>
                  <Text style={styles.actionBtnCount}>{post.reactionCounts?.total || 0}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
                >
                  <Text style={styles.actionBtnIcon}>💬</Text>
                  <Text style={styles.actionBtnText}>Comment</Text>
                  <Text style={styles.actionBtnCount}>{post.comments?.length || 0}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => handleShare(post)}
                >
                  <Text style={styles.actionBtnIcon}>📤</Text>
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.postMeta}>
                <Text style={[styles.reactionText, { color: theme.colors.textSecondary }]}>
                  {post.reactionCounts?.total || 0} likes • {post.comments?.length || 0} comments
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : loading ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>⏳</Text>
            <Text style={styles.placeholderTitle}>Loading your feed...</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📱</Text>
            <Text style={styles.placeholderTitle}>Your Feed is Ready!</Text>
            <Text style={styles.placeholderText}>Start creating posts and following users to see content from your community appear here.</Text>
            <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('CreatePost')}>
              <Text style={styles.startButtonText}>Create Your First Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
