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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { postsAPI, mediaAPI } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

const CreatePostScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [postText, setPostText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [visibility, setVisibility] = useState<'normal' | 'disguise'>('normal');
  const [vanishMode, setVanishMode] = useState(false);
  const [vanishDuration, setVanishDuration] = useState<'1hour' | '1day' | '1week'>('1day');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<
    { uri: string; type: string; name: string; mediaType: 'photo' | 'video' }[]
  >([]);
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

  const handlePost = async () => {
    if (!postText.trim() && selectedMedia.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Add content or media first' });
      return;
    }
    if (!selectedCategory) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Select a category' });
      return;
    }

    setIsCreating(true);
    let uploadedMedia: any[] = [];

    if (selectedMedia.length > 0) {
      setIsUploadingMedia(true);
      try {
        console.log('📤 Uploading media:', selectedMedia); // Debug log
        const uploadResponse = await mediaAPI.uploadMultiple(selectedMedia);
        console.log('📥 Upload response:', uploadResponse); // Debug log
        if (uploadResponse.success && uploadResponse.files) uploadedMedia = uploadResponse.files;
        else throw new Error(uploadResponse.message || 'Media upload failed');
      } catch (err: any) {
        console.log('❌ Upload error:', err); // Debug log
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: err.message });
        setIsUploadingMedia(false);
        setIsCreating(false);
        return;
      }
      setIsUploadingMedia(false);
    }

    const postData = {
      content: { 
        text: postText.trim() || '', 
        media: uploadedMedia.map(file => ({
          url: file.url,
          type: file.mimetype.startsWith('video/') ? 'video' : 
                file.mimetype.startsWith('audio/') ? 'audio' : 'image',
          filename: file.filename,
          originalName: file.originalname,
          size: file.size
        }))
      },
      category: selectedCategory,
      visibility,
      vanishMode: vanishMode ? { enabled: true, duration: vanishDuration } : { enabled: false },
    };

    console.log('📝 Creating post with data:', postData); // Debug log

    try {
      const response = await postsAPI.createPost(postData);
      console.log('📥 Post creation response:', response); // Debug log
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Post created!' });
        setPostText('');
        setSelectedMedia([]);
        setSelectedCategory('');
        setVisibility('normal');
        setVanishMode(false);
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response.message || 'Failed to post' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: '#888' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!postText.trim() && selectedMedia.length === 0) || !selectedCategory ? styles.postButtonDisabled : {}]}
          onPress={handlePost}
          disabled={(!postText.trim() && selectedMedia.length === 0) || !selectedCategory || isCreating || isUploadingMedia}
        >
          <Text style={styles.postButtonText}>{isCreating ? 'Creating...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#888"
          value={postText}
          onChangeText={setPostText}
          multiline
        />
        <Text style={styles.characterCount}>{postText.length}/2000</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Media</Text>
            <TouchableOpacity style={styles.addMediaButton} onPress={selectMedia} disabled={selectedMedia.length >= 5}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.categoryItem, selectedCategory === cat.id && styles.categoryItemSelected]} onPress={() => setSelectedCategory(cat.id)}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { fontSize: 20, fontWeight: '600', color: '#fff' },
  postButton: { backgroundColor: '#00D4AA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: '#000', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  textInput: { backgroundColor: '#111', borderRadius: 8, padding: 16, fontSize: 16, color: '#fff', minHeight: 150, marginBottom: 8, borderWidth: 1, borderColor: '#333', textAlignVertical: 'top' },
  characterCount: { textAlign: 'right', color: '#888', fontSize: 12, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  addMediaButton: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addMediaButtonText: { color: '#00D4AA', fontSize: 14, fontWeight: '500' },
  mediaItem: { position: 'relative', marginRight: 12 },
  mediaPreviewImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#333' },
  removeMediaButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ff4444', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  removeMediaButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryItem: { backgroundColor: '#111', borderRadius: 8, padding: 12, alignItems: 'center', minWidth: 70, borderWidth: 1, borderColor: '#333' },
  categoryItemSelected: { backgroundColor: '#00D4AA', borderColor: '#00D4AA' },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryName: { color: '#fff', fontSize: 12, fontWeight: '500' },
});

export default CreatePostScreen;
