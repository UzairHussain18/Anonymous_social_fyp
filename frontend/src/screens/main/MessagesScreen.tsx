import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { chatAPI } from '../../services/api';
import Toast from 'react-native-toast-message';
import { navigate } from '../../navigation/navigationRef';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const MessagesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
    back: { color: theme.colors.primary, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    last: { color: theme.colors.textSecondary, marginTop: 2 },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatAPI.getConversations();
        const list = (res.conversations || []).map((c: any) => {
          const other = (c.participants || []).find((p: any) => String(p._id) !== String(authUser?._id));
          const last = c.lastMessage || {};
          return { _id: c._id, other: other || c.participants?.[0], last };
        });
        setItems(list);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    let delay = 30000; let timer: any;
    const tick = async () => {
      try {
        const res = await chatAPI.getConversations();
        const list = res.conversations || [];
        const latest = list[0];
        if (latest) {
          const lastId = latest.lastMessage?._id || latest.lastMessage?.id;
          if ((global as any).__lastMessageId !== lastId && lastId) {
            (global as any).__lastMessageId = lastId;
            const other = latest.participants?.find((p: any) => String(p._id) !== String(authUser?._id));
            Toast.show({
              type: 'info',
              text1: `New message from @${other?.username || 'user'}`,
              text2: latest.lastMessage?.text?.slice(0, 60) || 'Tap to open',
              onPress: () => navigate('Chat', { peerId: other?._id, username: other?.username, avatar: other?.avatar }),
            });
          }
        }
        delay = 30000;
      } catch {
        delay = Math.min(delay * 2, 120000);
      } finally {
        timer = setTimeout(tick, delay);
      }
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const myId = String(authUser?._id || '');
    const isUnread = item.last && item.last.sender && String(item.last.sender) !== myId && !(item.last.readBy || []).map(String).includes(myId);
    return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => (navigation as any).navigate('Chat', { peerId: item.other?._id, username: item.other?.username, avatar: item.other?.avatar })}
    >
      {item.other?.avatar ? (
        <Image source={{ uri: item.other.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}> 
          <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>{item.other?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
      )}
      <View>
        <Text style={[styles.name, isUnread ? { fontWeight: '800' } : null]}>@{item.other?.username || 'Unknown'}</Text>
        <Text style={[styles.last, isUnread ? { fontWeight: '700', color: theme.colors.text } : null]} numberOfLines={1}>{item.last?.text || 'No messages yet'}</Text>
      </View>
    </TouchableOpacity>
  ); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 50 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        ListEmptyComponent={!loading ? () => (
          <View style={{ padding: 24 }}>
            <Text style={{ color: theme.colors.textSecondary }}>No conversations yet.</Text>
          </View>
        ) : null}
      />
    </View>
  );
};

export default MessagesScreen;


