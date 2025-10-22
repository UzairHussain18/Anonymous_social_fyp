import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../components/NotificationBell';

// Import screens (we'll create these)
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import WhisperWallScreen from '../screens/main/WhisperWallScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import MessengerScreen from '../screens/main/MessengerScreen';

// Import additional screens
import PostDetailScreen from '../screens/main/PostDetailScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface TabIconProps {
  name: string;
  focused: boolean;
  icon: string;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, icon }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(focused ? 1.1 : 1);
  
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[
      {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: focused ? theme.colors.primary + '20' : 'transparent',
      },
      animatedStyle
    ]}>
      <Text style={{
        fontSize: 24,
        marginBottom: 2,
      }}>
        {icon}
      </Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '600' : '400',
        color: focused ? theme.colors.primary : theme.colors.textSecondary,
      }}>
        {name}
      </Text>
    </Animated.View>
  );
};

const CreatePostButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animated.View style={[
        {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
          ...theme.shadows.large,
        },
        animatedStyle
      ]}>
        <Text style={{
          fontSize: 24,
          color: theme.colors.textInverse,
          fontWeight: 'bold',
        }}>
          +
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[
      { flex: 1 },
      Platform.OS === 'web' ? ({ height: '100vh', display: 'flex', flexDirection: 'column' } as any) : null,
    ]}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 10,
            paddingTop: 10,
            ...theme.shadows.large,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
        }}
      >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Feed" focused={focused} icon="🏠" />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Search" focused={focused} icon="🔍" />
          ),
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CreatePostButton onPress={() => props.onPress?.({} as any)} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="WhisperWall"
        component={WhisperWallScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Whispers" focused={focused} icon="👻" />
          ),
        }}
      />
      <Tab.Screen
        name="Messenger"
        component={MessengerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Messages" focused={focused} icon="💬" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Profile" focused={focused} icon="👤" />
          ),
        }}
      />
      </Tab.Navigator>
    </View>
  );
};

const MainNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'system-ui' }),
          fontWeight: '600',
          fontSize: 18,
          color: theme.colors.text,
        },
        headerTintColor: theme.colors.primary,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          title: 'Post'
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings'
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications'
        }}
      />
      <Stack.Screen
        name="Messenger"
        component={MessengerScreen}
        options={{
          title: 'Messages'
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
