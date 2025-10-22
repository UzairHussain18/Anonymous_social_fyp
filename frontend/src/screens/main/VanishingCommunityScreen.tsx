import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { whisperWallAPI, mediaAPI } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

interface WhisperPost {
  _id: string;
  randomUsername: string;
  content: {
    text: string;
    media?: Array<{
      url: string;
      type: 'image' | 'video' | 'audio';
      filename: string;
      originalName: string;
      size: number;
    }>;
  };
  category: string;
  tags: string[];
  reactions: {
    funny: number;
    rage: number;
    shock: number;
    relatable: number;
    love: number;
    thinking: number;
    total: number;
  };
  comments: Array<{
    _id: string;
    randomUsername: string;
    content: string;
    createdAt: string;
    reactions: {
      funny: number;
      love: number;
    };
  }>;
  createdAt: string;
  expiresAt: string;
  userReaction?: string;
  userHasReacted: boolean;
}

const VanishingCommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [posts, setPosts] = useState<WhisperPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Random');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<
    { uri: string; type: string; name: string; mediaType: 'photo' | 'video' }[]
  >([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const categories = [
    { id: 'Random', name: 'Random', icon: '🎲' },
    { id: 'Vent', name: 'Vent', icon: '😤' },
    { id: 'Confession', name: 'Confession', icon: '🤐' },
    { id: 'Advice', name: 'Advice', icon: '💡' },
    { id: 'Comedy', name: 'Comedy', icon: '😂' },
    { id: 'Music', name: 'Music', icon: '🎵' },
    { id: 'Gaming', name: 'Gaming', icon: '🎮' },
  ];

  useEffect(() => {
    loadWhisperPosts();
  }, []);

  const loadWhisperPosts = async () => {
    try {
      setLoading(true);
      console.log('👻 Loading WhisperWall posts...');
      const response = await whisperWallAPI.getWhisperPosts(1, 20);
      console.log('👻 WhisperWall API response:', response);
      if (response.success) {
        setPosts(response.posts || []);
        console.log('👻 Loaded WhisperWall posts:', response.posts?.length || 0);
        console.log('👻 Posts data:', response.posts);
      } else {
        console.log('👻 Failed to load posts:', response.message);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load posts' });
      }
    } catch (error) {
      console.error('👻 Error loading WhisperWall posts:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load posts' });
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is needed.', [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const selectMedia = async () => {
    if (Platform.OS === 'web') {
      // Web file upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          handleWebFiles(files);
        }
      };
      
      input.click();
    } else {
      // Mobile file picker
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      Alert.alert('Select Media', 'Choose how to add media', [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleWebFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (selectedMedia.length >= 5) {
        Toast.show({ type: 'error', text1: 'Limit Reached', text2: 'Max 5 media per post' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const mediaItem = {
          uri: e.target?.result as string,
          type: file.type,
          name: file.name,
          mediaType: file.type.startsWith('video/') ? 'video' as const : 'photo' as const,
        };
        setSelectedMedia(prev => [...prev, mediaItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) addMediaToSelection(result.assets[0]);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open camera' });
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach(asset => addMediaToSelection(asset));
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open gallery' });
    }
  };

  const addMediaToSelection = (asset: any) => {
    if (selectedMedia.length >= 5) {
      Toast.show({ type: 'error', text1: 'Limit Reached', text2: 'Max 5 media per post' });
      return;
    }

    const mediaItem = {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
      name: `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      mediaType: asset.type as 'photo' | 'video',
    };
    setSelectedMedia(prev => [...prev, mediaItem]);
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const createWhisperPost = async () => {
    if (!newPost.trim() && selectedMedia.length === 0) {
      Alert.alert('Error', 'Please enter some content or add media for your post');
      return;
    }

    setIsPosting(true);
    let uploadedMedia: any[] = [];

    if (selectedMedia.length > 0) {
      setIsUploadingMedia(true);
      try {
        console.log('📤 Uploading WhisperWall media:', selectedMedia);
        const uploadResponse = await mediaAPI.uploadMultiple(selectedMedia);
        console.log('📥 WhisperWall upload response:', uploadResponse);
        if (uploadResponse.success && (uploadResponse as any).files) uploadedMedia = (uploadResponse as any).files;
        else throw new Error(uploadResponse.message || 'Media upload failed');
      } catch (err: any) {
        console.log('❌ WhisperWall upload error:', err);
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: err.message });
        setIsUploadingMedia(false);
        setIsPosting(false);
        return;
      }
      setIsUploadingMedia(false);
    }

    const postData = {
      content: { 
        text: newPost.trim() || '', 
        ...(uploadedMedia.length > 0 && {
          media: uploadedMedia.map(file => ({
            url: file.url,
            type: (file.mimetype.startsWith('video/') ? 'video' : 
                  file.mimetype.startsWith('audio/') ? 'audio' : 'image') as 'image' | 'video' | 'audio',
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
          }))
        })
      },
      category: selectedCategory,
      tags: ['whisperwall', 'disappearing', selectedCategory.toLowerCase()],
    };

    console.log('👻 Creating WhisperWall post with data:', postData);
    console.log('👻 Selected category:', selectedCategory);
    console.log('👻 New post text:', newPost);
    console.log('👻 Selected media count:', selectedMedia.length);

    try {
      const response = await whisperWallAPI.createWhisperPost(postData);
      console.log('📥 WhisperWall post creation response:', response);
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Whisper posted! It will disappear in 24 hours.' });
        setNewPost('');
        setSelectedMedia([]);
        setSelectedCategory('Random');
        loadWhisperPosts(); // Reload posts
      } else {
        console.log('❌ WhisperWall post failed:', response.message);
        Toast.show({ type: 'error', text1: 'Error', text2: response.message || 'Failed to post whisper' });
      }
    } catch (error: any) {
      console.log('❌ WhisperWall post creation error:', error);
      console.log('❌ Error response:', error.response?.data);
      console.log('❌ Error status:', error.response?.status);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong' });
    } finally {
      setIsPosting(false);
    }
  };

  const addReaction = async (postId: string, reactionType: 'funny' | 'rage' | 'shock' | 'relatable' | 'love' | 'thinking') => {
    try {
      const response = await whisperWallAPI.reactToWhisperPost(postId, reactionType);
      if (response.success) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, reactions: (response as any).reactions, userReaction: reactionType, userHasReacted: true }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expireTime = new Date(expiresAt);
    const remaining = expireTime.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      return `${minutes}m left`;
    } else {
      return 'Vanishing soon...';
    }
  };

  const renderMedia = (media: any[]) => {
    if (!media || media.length === 0) return null;
    
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = Math.min(screenWidth - 80, 300);
    
    return (
      <View style={styles.mediaContainer}>
        <FlatList
          data={media}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
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
                />
              )}
            </View>
          )}
        />
      </View>
    );
  };

  const renderPost = ({ item }: { item: WhisperPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.randomUsername.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>👻 {item.randomUsername}</Text>
            <Text style={styles.timeRemaining}>
              ⏰ {getTimeRemaining(item.expiresAt)}
            </Text>
          </View>
        </View>
        <Text style={styles.categoryTag}>#{item.category}</Text>
      </View>
      
      {/* Hashtags */}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          {item.tags.map((tag: string, index: number) => (
            <Text key={index} style={styles.hashtag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}
      
      {item.content.text && <Text style={styles.postContent}>{item.content.text}</Text>}
      {renderMedia(item.content.media || [])}
      
      <View style={styles.reactionsContainer}>
        <TouchableOpacity
          style={[styles.reactionButton, item.userReaction === 'funny' && styles.activeReaction]}
          onPress={() => addReaction(item._id, 'funny')}
        >
          <Text style={styles.reactionEmoji}>😂</Text>
          <Text style={styles.reactionCount}>{item.reactions.funny}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reactionButton, item.userReaction === 'love' && styles.activeReaction]}
          onPress={() => addReaction(item._id, 'love')}
        >
          <Text style={styles.reactionEmoji}>❤️</Text>
          <Text style={styles.reactionCount}>{item.reactions.love}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reactionButton, item.userReaction === 'shock' && styles.activeReaction]}
          onPress={() => addReaction(item._id, 'shock')}
        >
          <Text style={styles.reactionEmoji}>😱</Text>
          <Text style={styles.reactionCount}>{item.reactions.shock}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reactionButton, item.userReaction === 'relatable' && styles.activeReaction]}
          onPress={() => addReaction(item._id, 'relatable')}
        >
          <Text style={styles.reactionEmoji}>😭</Text>
          <Text style={styles.reactionCount}>{item.reactions.relatable}</Text>
        </TouchableOpacity>
      </View>

      {item.comments.length > 0 && (
        <View style={styles.commentsContainer}>
          {item.comments.map(comment => (
            <View key={comment._id} style={styles.comment}>
              <Text style={styles.commentAuthor}>👻 {comment.randomUsername}</Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
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
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: theme.spacing.xl,
    },
    createPostContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.small,
    },
    createPostTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    postInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    postButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    postButtonDisabled: {
      opacity: 0.6,
    },
    postButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
    },
    postsList: {
      flex: 1,
    },
    postCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    postHeader: {
      marginBottom: theme.spacing.md,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.md,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
    },
    username: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    timeRemaining: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    postContent: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
    },
    reactionsContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    reactionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.lg,
    },
    reactionEmoji: {
      fontSize: 18,
      marginRight: theme.spacing.xs,
    },
    reactionCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    commentsContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
    comment: {
      marginBottom: theme.spacing.sm,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    commentContent: {
      fontSize: 14,
      color: theme.colors.text,
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
    mediaSection: {
      marginBottom: theme.spacing.md,
    },
    mediaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    mediaTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    addMediaButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    addMediaButtonText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    mediaPreviewImage: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.surface,
    },
    removeMediaButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#ff4444',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeMediaButtonText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    categorySection: {
      marginBottom: theme.spacing.md,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    categoryItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: 60,
    },
    categoryItemSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryIcon: {
      fontSize: 16,
      marginBottom: 2,
    },
    categoryName: {
      fontSize: 10,
      color: theme.colors.text,
      fontWeight: '500',
    },
    categoryTag: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    hashtagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    hashtag: {
      fontSize: 12,
      color: theme.colors.secondary || '#6B73FF',
      fontWeight: '500',
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    activeReaction: {
      backgroundColor: theme.colors.primary + '20',
    },
    mediaContainer: {
      marginVertical: theme.spacing.sm,
    },
    videoContainer: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    mediaItem: {
      position: 'relative',
      marginRight: theme.spacing.sm,
    },
    mediaContent: {
      height: 200,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background,
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
        <Text style={styles.headerTitle}>Vanishing Community</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Create Post */}
        <View style={styles.createPostContainer}>
          <Text style={styles.createPostTitle}>👻 Share Something Temporary</Text>
          <TextInput
            style={styles.postInput}
            placeholder="Share your thoughts... (will disappear in 24 hours)"
            placeholderTextColor={theme.colors.textSecondary}
            value={newPost}
            onChangeText={setNewPost}
            multiline
          />
          
          {/* Media Selection */}
          <View style={styles.mediaSection}>
            <View style={styles.mediaHeader}>
              <Text style={styles.mediaTitle}>Media</Text>
              <TouchableOpacity 
                style={styles.addMediaButton} 
                onPress={selectMedia} 
                disabled={selectedMedia.length >= 5}
              >
                <Text style={styles.addMediaButtonText}>📎 Add Media ({selectedMedia.length}/5)</Text>
              </TouchableOpacity>
            </View>

            {selectedMedia.length > 0 && (
              <FlatList
                horizontal
                data={selectedMedia}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.mediaItem}>
                    {item.mediaType === 'photo' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaPreviewImage} />
                    ) : (
                      <View style={[styles.mediaPreviewImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff' }}>Video</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.removeMediaButton} onPress={() => removeMedia(index)}>
                      <Text style={styles.removeMediaButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.categoryItem, selectedCategory === cat.id && styles.categoryItemSelected]} 
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.postButton,
              ((!newPost.trim() && selectedMedia.length === 0) || isPosting || isUploadingMedia) && styles.postButtonDisabled,
            ]}
            onPress={createWhisperPost}
            disabled={(!newPost.trim() && selectedMedia.length === 0) || isPosting || isUploadingMedia}
          >
            <Text style={styles.postButtonText}>
              {isPosting ? 'Posting...' : isUploadingMedia ? 'Uploading...' : '👻 Post & Vanish'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyTitle}>Loading whispers...</Text>
          </View>
        ) : posts.length > 0 ? (
          <>
            <Text style={styles.debugText}>Debug: Found {posts.length} WhisperWall posts</Text>
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👻</Text>
            <Text style={styles.emptyTitle}>No Vanishing Posts Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share something that will disappear in 24 hours!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default VanishingCommunityScreen;
