export type RootStackParamList = {
  Home: undefined;
  Explore: undefined;
  CreatePost: undefined;
  WhisperWall: undefined;
  Profile: undefined;
  PostDetail: { postId: string };
  UserProfile: { username: string };
  Chat: { peerId: string; username: string; avatar?: string };
  Messages: undefined;
  Settings: undefined;
  Notifications: undefined;
  Search: undefined;
  Messenger: undefined;
  VanishingCommunity: undefined;
};
