import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';

export const initializeApp = async (): Promise<void> => {
  try {
    // Request necessary permissions
    await requestPermissions();
    
    // Initialize any other app services
    await initializeServices();
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('App initialization failed:', error);
  }
};

const requestPermissions = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      Object.keys(granted).forEach(permission => {
        if (granted[permission] === PermissionsAndroid.RESULTS.GRANTED) {
          console.log(`${permission} permission granted`);
        } else {
          console.log(`${permission} permission denied`);
        }
      });
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }
};

const initializeServices = async (): Promise<void> => {
  // Initialize crash reporting, analytics, etc.
  // This is where you'd initialize services like Firebase, Sentry, etc.
  
  // Set up error handling
  if (!__DEV__) {
    // Production error handling
    console.log('Production error handling initialized');
  }
  
  // Initialize background tasks if needed
  console.log('Services initialized');
};
