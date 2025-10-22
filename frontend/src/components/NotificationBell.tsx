import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { chatAPI, userAPI } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const NotificationBell: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [count, setCount] = useState(0);

  const loadCounts = async () => {
    try {
      const [convosRes, notifRes] = await Promise.all([
        chatAPI.getConversations(),
        userAPI.getNotifications().catch(() => ({ unreadCount: 0 })),
      ]);
      const convos = convosRes.conversations || [];
      const unreadMessages = convos.reduce((sum: number, c: any) => {
        const last = c.lastMessage;
        const isUnread = last && String(last.sender) !== String((global as any).__authUserId) && !(last.readBy || []).includes((global as any).__authUserId);
        return sum + (isUnread ? 1 : 0);
      }, 0);
      const unreadNotifs = notifRes.unreadCount || 0;
      setCount(unreadMessages + unreadNotifs);
    } catch (e) {
      setCount(0);
    }
  };

  useEffect(() => {
    let delay = 30000; // start at 30s to avoid rate limiting
    let timer: any;
    const tick = async () => {
      try {
        await loadCounts();
        delay = 30000;
      } catch (e: any) {
        // If 429 or network error, back off
        delay = Math.min(delay * 2, 120000);
      } finally {
        timer = setTimeout(tick, delay);
      }
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity onPress={() => (navigation as any).navigate('Messages')}>
      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18 }}>🔔</Text>
        {count > 0 && (
          <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: '#FF3B30', borderRadius: 10, paddingHorizontal: 6, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default NotificationBell;


