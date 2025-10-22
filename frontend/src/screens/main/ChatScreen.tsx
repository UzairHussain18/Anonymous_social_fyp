import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface MessageItem {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
}

const ChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<ChatRouteProp>();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { peerId, username, avatar } = route.params;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
    headerName: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
    list: { flex: 1 },
    bubbleRow: { paddingHorizontal: theme.spacing.xl, marginVertical: 6 },
    bubble: { maxWidth: '80%', padding: 10, borderRadius: 14 },
    bubbleMe: { backgroundColor: theme.colors.primary, alignSelf: 'flex-end' },
    bubbleOther: { backgroundColor: theme.colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.border },
    bubbleTextMe: { color: theme.colors.textInverse, fontSize: 15 },
    bubbleTextOther: { color: theme.colors.text, fontSize: 15 },
    time: { fontSize: 10, marginTop: 4, opacity: 0.7 },
    composerWrap: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: Platform.select({ ios: 12, android: 8, default: 10 }),
      marginRight: 10,
    },
    sendBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
    },
    sendText: { color: theme.colors.textInverse, fontWeight: '700' },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatAPI.getMessages(peerId, 1, 30);
        const msgs = (res.messages || []).map((m: any) => ({
          id: m._id || Math.random().toString(36).slice(2),
          text: m.text,
          createdAt: m.createdAt,
          senderId: m.sender,
        }));
        // Backend returns oldest->newest already. Keep order so newest appears at the bottom.
        setMessages(msgs);
        // Mark messages as read when opening chat
        chatAPI.markRead(peerId).catch(() => {});
      } catch (e) {
        setMessages([]);
      }
    };
    load();
  }, [peerId]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newMsg: MessageItem = {
      id: Math.random().toString(36).slice(2),
      text: trimmed,
      createdAt: new Date().toISOString(),
      senderId: user?._id || 'me',
    };
    setMessages(prev => {
      const updated = [...prev, newMsg];
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
      return updated;
    });
    setInput('');
    chatAPI.sendMessage(peerId, trimmed).catch(() => {
      // Optionally handle send failure UI
    });
  };

  const renderItem = ({ item }: { item: MessageItem }) => {
    const isMe = item.senderId === user?._id || item.senderId === 'me';
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextOther}>{item.text}</Text>
          <Text style={[styles.time, isMe ? { color: theme.colors.textInverse } : { color: theme.colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { chatAPI.markRead(peerId).finally(() => (navigation as any).goBack()); }} style={{ marginRight: 12 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}> 
            <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>{username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.headerName}>@{username}</Text>
      </View>
      <FlatList
        ref={listRef}
        style={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        inverted={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      />
      <View style={styles.composerWrap}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;


