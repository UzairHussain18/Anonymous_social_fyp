import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, FlatList, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { postsAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<UserProfileRouteProp>();
  const navigation = useNavigation();
  const { user: authUser } = useAuth();

  const { username } = route.params;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = useMemo(() => authUser?.username === username, [authUser?.username, username]);

  const isEchoing = useMemo(() => {
    if (!authUser || !profile?.followers) return false;
    return profile.followers.some((f: any) => f._id === authUser._id);
  }, [authUser, profile]);

  // Header title is configured in navigator options using route params

  const loadProfileAndPosts = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }
      const [profileRes, postsRes] = await Promise.all([
        userAPI.getProfile(username),
        postsAPI.getUserPosts(username, reset ? 1 : page, 20),
      ]);

      const userData = profileRes.user || profileRes.data?.user || profileRes.data;
      setProfile(userData);

      const newPosts = (postsRes as any).posts || (postsRes as any).data || [];
      setPosts(reset ? newPosts : [...posts, ...newPosts]);
      const pagination = (postsRes as any).pagination;
      setHasMore(pagination ? !!pagination.hasMore : newPosts.length >= 20);
      if (!reset) setPage(p => p + 1);
    } catch (e) {
      console.log('UserProfile load error', e);
      // keep screen visible; show minimal header
      setProfile((prev: any) => prev || { username, bio: '', followers: [], following: [], stats: {} });
      if (reset) setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileAndPosts(true);
  }, [username]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileAndPosts(true);
  };

  const loadMore = async () => {
    if (loading || refreshing || !hasMore) return;
    await loadProfileAndPosts(false);
  };

  const handleToggleFollow = async () => {
    if (!profile?._id || isOwnProfile || followLoading) return;
    try {
      setFollowLoading(true);
      if (isEchoing) {
        await userAPI.unechoUser(profile._id);
        setProfile({
          ...profile,
          followers: profile.followers.filter((f: any) => f._id !== authUser?._id),
          stats: { ...profile.stats, followersCount: Math.max(0, (profile.stats?.followersCount || 1) - 1) },
        });
      } else {
        await userAPI.echoUser(profile._id);
        setProfile({
          ...profile,
          followers: [...(profile.followers || []), { _id: authUser?._id, username: authUser?.username, avatar: authUser?.avatar }],
          stats: { ...profile.stats, followersCount: (profile.stats?.followersCount || 0) + 1 },
        });
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={{ paddingVertical: 6, paddingRight: 12 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerTop}>
        <View style={styles.avatarWrapper}>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}> 
              <Text style={{ color: theme.colors.textInverse, fontSize: 28, fontWeight: '700' }}>{profile?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.nameSection}>
          <Text style={[styles.usernameText, { color: theme.colors.text }]}>@{profile?.username}</Text>
          {!!profile?.bio && (
            <Text style={[styles.bioText, { color: theme.colors.textSecondary }]} numberOfLines={3}>{profile.bio}</Text>
          )}
          <View style={styles.statsRow}>
            <Stat label="Posts" value={profile?.stats?.postsCount || 0} />
            <Stat label="Followers" value={profile?.stats?.followersCount || (profile?.followers?.length || 0)} />
            <Stat label="Following" value={profile?.stats?.followingCount || (profile?.following?.length || 0)} />
          </View>
        </View>
      </View>
      {!isOwnProfile && (
        <View style={styles.actionsRow}>
          <TouchableOpacity disabled={followLoading} onPress={handleToggleFollow} style={[styles.primaryButton, { backgroundColor: isEchoing ? theme.colors.surface : theme.colors.primary, borderColor: theme.colors.primary, borderWidth: isEchoing ? 1 : 0 }]}> 
            <Text style={{ color: isEchoing ? theme.colors.primary : theme.colors.textInverse, fontWeight: '700' }}>{isEchoing ? 'Following' : 'Add Friend'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => profile && (navigation as any).navigate('Chat', { peerId: profile._id, username: profile.username, avatar: profile.avatar })}
            style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
          > 
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      {item.category && <Text style={[styles.postCategory, { color: theme.colors.primary }]}>#{item.category}</Text>}
      {item.content?.text && <Text style={[styles.postText, { color: theme.colors.text }]}>{item.content.text}</Text>}
      <Text style={[styles.postDate, { color: theme.colors.textSecondary }]}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ListHeaderComponent={<Header />}
        data={posts}
        keyExtractor={(item, index) => item?._id || `post-${index}`}
        renderItem={renderPost}
        contentContainerStyle={{ padding: theme.spacing.xl }}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={hasMore ? <ActivityIndicator style={{ marginVertical: theme.spacing.lg }} color={theme.colors.primary} /> : <View style={{ height: Platform.OS === 'web' ? 80 : 40 }} />}
      />
    </View>
  );
};

const UserProfileScreenStyles = (theme: any) => StyleSheet.create({});

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  nameSection: {
    flex: 1,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    marginRight: 18,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  postCategory: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  postText: { fontSize: 16, lineHeight: 22, marginBottom: 8 },
  postDate: { fontSize: 12 },
});

export default UserProfileScreen;
