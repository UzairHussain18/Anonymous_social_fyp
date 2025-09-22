import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { postsAPI, mediaAPI } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
// import { VideoView } from 'expo-video';

const CreatePostScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [postText, setPostText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [visibility, setVisibility] = useState<'normal' | 'disguise'>('normal');
  const [vanishMode, setVanishMode] = useState(false);
  const [vanishDuration, setVanishDuration] = useState<'1hour' | '1day' | '1week'>('1day');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Array<{
    uri: string;
    type: string;
    name: string;
    mediaType: 'photo' | 'video';
  }>>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const categories = [
    { id: 'Gaming', name: 'Gaming', icon: '🎮' },
    { id: 'Education', name: 'Education', icon: '📚' },
    { id: 'Beauty', name: 'Beauty', icon: '💄' },
    { id: 'Fitness', name: 'Fitness', icon: '💪' },
    { id: 'Music', name: 'Music', icon: '🎵' },
    { id: 'Technology', name: 'Technology', icon: '💻' },
    { id: 'Art', name: 'Art', icon: '🎨' },
    { id: 'Food', name: 'Food', icon: '🍕' },
  ];

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to select images and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Select media (image or video)
  const selectMedia = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Media',
      'Choose how you want to add media to your post',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        addMediaToSelection(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open camera',
      });
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
      console.error('Gallery error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open gallery',
      });
    }
  };

  const addMediaToSelection = (asset: any) => {
    if (selectedMedia.length >= 5) {
      Toast.show({
        type: 'error',
        text1: 'Limit Reached',
        text2: 'You can only add up to 5 media files per post',
      });
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

  const handlePost = async () => {
    if (!postText.trim() && selectedMedia.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add some content or media before posting.',
      });
      return;
    }
    if (!selectedCategory) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a category for your post.',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      let uploadedMedia: any[] = [];
      
      // Upload media files if any
      if (selectedMedia.length > 0) {
        setIsUploadingMedia(true);
        
        try {
          console.log('🔄 Starting media upload for', selectedMedia.length, 'files');
          const uploadResponse = await mediaAPI.uploadMultiple(selectedMedia);
          
          console.log('📤 Upload response:', uploadResponse);
          
          if (uploadResponse.success && (uploadResponse as any).files) {
            uploadedMedia = (uploadResponse as any).files;
            console.log('✅ Media uploaded successfully:', uploadedMedia);
          } else {
            console.error('❌ Upload failed - no success or files in response:', uploadResponse);
            throw new Error(uploadResponse.message || 'Failed to upload media');
          }
        } catch (uploadError: any) {
          console.error('📤 Media upload error details:', {
            message: uploadError.message,
            response: uploadError.response?.data,
            status: uploadError.response?.status
          });
          
          let errorMessage = 'Failed to upload media. Please try again.';
          if (uploadError.response?.data?.message) {
            errorMessage = uploadError.response.data.message;
          } else if (uploadError.message) {
            errorMessage = uploadError.message;
          }
          
          Toast.show({
            type: 'error',
            text1: 'Upload Failed',
            text2: errorMessage,
          });
          return;
        } finally {
          setIsUploadingMedia(false);
        }
      }

      const postData = {
        content: {
          text: postText.trim(),
          media: uploadedMedia, // Include uploaded media URLs
        },
        category: selectedCategory,
        visibility: visibility,
        vanishMode: vanishMode ? {
          enabled: true,
          duration: vanishDuration,
        } : {
          enabled: false,
        },
      };

      const response = await postsAPI.createPost(postData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Post created successfully!',
        });
        
        // Clear form
        setPostText('');
        setSelectedMedia([]);
        setSelectedCategory('');
        setVisibility('normal');
        setVanishMode(false);
        
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to create post',
        });
      }
    } catch (error: any) {
      console.log('Post creation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: '#888' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <TouchableOpacity
          style={[
            styles.postButton,
            ((!postText.trim() && selectedMedia.length === 0) || !selectedCategory || isCreating || isUploadingMedia) && styles.postButtonDisabled,
          ]}
          onPress={handlePost}
          disabled={(!postText.trim() && selectedMedia.length === 0) || !selectedCategory || isCreating || isUploadingMedia}
        >
          <Text style={styles.postButtonText}>
            {isCreating ? 'Creating...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind? Share your thoughts..."
          placeholderTextColor="#888"
          value={postText}
          onChangeText={setPostText}
          multiline
          maxLength={2000}
        />
        <Text style={styles.characterCount}>
          {postText.length}/2000
        </Text>

        {/* Media Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Media</Text>
            <TouchableOpacity 
              style={styles.addMediaButton}
              onPress={selectMedia}
              disabled={selectedMedia.length >= 5}
            >
              <Text style={styles.addMediaButtonText}>
                📎 Add Media ({selectedMedia.length}/5)
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Media Preview */}
          {selectedMedia.length > 0 && (
            <View style={styles.mediaPreview}>
              <FlatList
                data={selectedMedia}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.mediaItem}>
                    {item.mediaType === 'photo' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaPreviewImage} />
                    ) : (
                      <View style={styles.videoPreview}>
                        <View style={[styles.mediaPreviewImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ color: '#fff' }}>Video Preview</Text>
                        </View>
                        <View style={styles.videoOverlay}>
                          <Text style={styles.videoIcon}>▶️</Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(index)}
                    >
                      <Text style={styles.removeMediaButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
          
          {isUploadingMedia && (
            <View style={styles.uploadingIndicator}>
              <Text style={styles.uploadingText}>Uploading media...</Text>
            </View>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.categoryItemSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visibility Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          
          <TouchableOpacity
            style={[
              styles.visibilityOption,
              visibility === 'normal' && styles.visibilityOptionSelected,
            ]}
            onPress={() => setVisibility('normal')}
          >
            <View style={styles.visibilityLeft}>
              <Text style={styles.visibilityIcon}>👤</Text>
              <View style={styles.visibilityContent}>
                <Text style={styles.visibilityTitle}>Normal Post</Text>
                <Text style={styles.visibilityDescription}>
                  Posted with your username and avatar
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.visibilityOption,
              visibility === 'disguise' && styles.visibilityOptionSelected,
            ]}
            onPress={() => setVisibility('disguise')}
          >
            <View style={styles.visibilityLeft}>
              <Text style={styles.visibilityIcon}>🥸</Text>
              <View style={styles.visibilityContent}>
                <Text style={styles.visibilityTitle}>Disguise Mode</Text>
                <Text style={styles.visibilityDescription}>
                  Posted with a disguise avatar for privacy
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Vanish Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vanish Mode</Text>
          
          <TouchableOpacity
            style={styles.switchContainer}
            onPress={() => setVanishMode(!vanishMode)}
          >
            <Text style={styles.switchText}>Auto-delete post</Text>
            <Text style={{ fontSize: 20, color: vanishMode ? '#00D4AA' : '#888' }}>
              {vanishMode ? '🟢' : '⚫'}
            </Text>
          </TouchableOpacity>

          {vanishMode && (
            <View style={styles.durationOptions}>
              {(['1hour', '1day', '1week'] as const).map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    vanishDuration === duration && styles.durationOptionSelected,
                  ]}
                  onPress={() => setVanishDuration(duration)}
                >
                  <Text style={styles.durationText}>
                    {duration === '1hour' ? '1 Hour' : duration === '1day' ? '1 Day' : '1 Week'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  textInput: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  characterCount: {
    textAlign: 'right',
    color: '#888',
    fontSize: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  addMediaButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addMediaButtonText: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaPreview: {
    marginTop: 12,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 12,
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  videoPreview: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  videoIcon: {
    fontSize: 24,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadingIndicator: {
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    marginTop: 8,
  },
  uploadingText: {
    color: '#00D4AA',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryItemSelected: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  visibilityOption: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  visibilityOptionSelected: {
    borderColor: '#00D4AA',
    backgroundColor: '#001a16',
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  visibilityContent: {
    flex: 1,
  },
  visibilityTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  visibilityDescription: {
    color: '#888',
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  switchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  durationOptionSelected: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  durationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreatePostScreen;