import { Platform } from 'react-native';

// Web-compatible shadow styles
export const webShadows = {
  small: Platform.OS === 'web' 
    ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
  
  medium: Platform.OS === 'web'
    ? { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
  
  large: Platform.OS === 'web'
    ? { boxShadow: '0 8px 15px rgba(0, 0, 0, 0.15)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
      },
};

export const getShadowStyle = (size: 'small' | 'medium' | 'large') => {
  return webShadows[size];
};
