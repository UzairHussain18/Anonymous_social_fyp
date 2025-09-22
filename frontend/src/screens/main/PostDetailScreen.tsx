import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  ImageResizeMode,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import { reactionsAPI } from '../../services/reactions';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import Toast from 'react-native-toast-message';
// import { VideoView } from 'expo-video';

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

type CommentItem = {
  type: 'comment';
  _id: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

type ListItem = CommentItem;

const isComment = (item: ListItem): item is CommentItem => {
  return item.type === 'comment';
};

type Reaction = 'funny' | 'rage' | 'shock' | 'relatable' | 'love' | 'thinking';

const REACTION_ICONS = {
  funny: '😂',
  rage: '😡',
  shock: '😱',
  relatable: '💯',
  love: '❤️',
  thinking: '🤔',
};

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: {
    text: string;
    media?: Array<{
      url: string;
      mimetype: string;
    }>;
  };
  category: string;
  createdAt: string;
  reactions: {
    funny: any[];
    rage: any[];
    shock: any[];
    relatable: any[];
    love: any[];
    thinking: any[];
  };
  reactionCounts: {
    funny: number;
    rage: number;
    shock: number;
    relatable: number;
    love: number;
    thinking: number;
    total: number;
  };
  userReaction?: Reaction;
  comments: Array<ListItem & {
    type: 'comment';
    _id: string;
    author: {
      _id: string;
      username: string;
      avatar?: string;
    };
    content: string;
    createdAt: string;
  }>;
}

const PostDetailScreen = () => {
  const route = useRoute<PostDetailScreenRouteProp>();
  const { postId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ListItem[]>([]);

  const fetchPost = async () => {
    try {
      const response = await postsAPI.getPost(postId);
      if (response.success) {
        setPost(response.data);
        const transformedComments: CommentItem[] = response.data.comments.map((comment: any) => ({
          type: 'comment',
          _id: comment._id,
          author: comment.author,
          content: comment.content,
          createdAt: comment.createdAt
        }));
        setData(transformedComments);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load post details',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const handleReaction = async (reactionType: Reaction) => {
    try {
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
      fetchPost();
    } catch (error) {
      console.error('Error handling reaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update reaction',
      });
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      const response = await postsAPI.addComment(postId, comment);
      if (response.success) {
        setComment('');
        Toast.show({
          type: 'success',
          text1: 'Comment added successfully',
        });
        fetchPost();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add comment',
      });
    }
  };

  const renderMedia = (media: Array<{url: string, mimetype: string}> | undefined) => {
    if (!media || media.length === 0) return null;

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
                <View style={[styles.mediaContent, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff' }}>Video: {item.url}</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: item.url }}
                  style={styles.mediaContent}
                  resizeMode="cover"
                  />
              )}
            </View>
          )}
        />
      </View>
    );
  };

  const ReactionBar = () => (
    <View style={styles.reactionBar}>
      {Object.entries(REACTION_ICONS).map(([type, emoji]) => (
        <TouchableOpacity
          key={type}
          onPress={() => handleReaction(type as Reaction)}
          style={[
            styles.reactionButton,
            post?.userReaction === type && styles.activeReaction,
          ]}
        >
          <Text style={styles.reactionEmoji}>{emoji}</Text>
          <Text style={styles.reactionCount}>
            {post?.reactionCounts?.[type as keyof typeof post.reactionCounts] || 0}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          Post not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => `comment-${item._id}`}
        refreshing={refreshing}
        onRefresh={fetchPost}
        ListHeaderComponent={() => (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                {post.author.avatar ? (
                  <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {post.author.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.username, { color: theme.colors.text }]}>
                  {post.author.username}
                </Text>
              </View>
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.postCategory, { color: theme.colors.primary }]}>
              #{post.category}
            </Text>
            <Text style={[styles.postContent, { color: theme.colors.text }]}>
              {post.content.text}
            </Text>
            {renderMedia(post.content.media)}
            <ReactionBar />
          </View>
        )}
        renderItem={({ item }: { item: CommentItem }) => (
          <View style={styles.commentContainer}>
            <View style={styles.commentHeader}>
              {item.author.avatar ? (
                <Image source={{ uri: item.author.avatar }} style={styles.commentAvatar} />
              ) : (
                <View style={[styles.commentAvatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.commentAvatarText}>
                    {item.author.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.commentAuthor, { color: theme.colors.text }]}>
                {item.author.username}
              </Text>
              <Text style={[styles.commentTimestamp, { color: theme.colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.commentContent, { color: theme.colors.text }]}>
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={[styles.commentInput, {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }]}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleComment}
            >
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  postContainer: {
    padding: 15,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
  },
  postCategory: {
    fontSize: 14,
    marginBottom: 10,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
  },
  mediaContainer: {
    marginBottom: 15,
  },
  mediaItem: {
    marginRight: 10,
  },
  mediaContent: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reactionButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  activeReaction: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionCount: {
    fontSize: 12,
    marginTop: 2,
  },
  commentContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  commentAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  commentTimestamp: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    minHeight: 40,
  },
  commentButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PostDetailScreen;
