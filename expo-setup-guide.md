# Expo Setup Guide for WhisperEcho

## Step-by-Step Migration to Expo

### 1. Create Expo Project
```bash
cd "FYP 2"
npx create-expo-app WhisperEchoExpo --template blank-typescript
cd WhisperEchoExpo
```

### 2. Install Required Dependencies
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install axios @react-native-async-storage/async-storage
npm install react-native-toast-message
npm install react-native-reanimated
npx expo install expo-linear-gradient
npx expo install expo-image-picker
npx expo install expo-secure-store
```

### 3. Configure app.json
Update your `app.json` file:
```json
{
  "expo": {
    "name": "WhisperEcho",
    "slug": "whisper-echo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0B0F15"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0B0F15"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

### 4. Update babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

### 5. Files to Copy/Migrate
Copy these files from your original frontend folder:
- `src/` folder (entire directory)
- Update imports to use Expo-compatible libraries

### 6. Update Imports
Replace React Native imports with Expo equivalents:
- `react-native-linear-gradient` → `expo-linear-gradient`
- `@react-native-async-storage/async-storage` → keep as is
- `react-native-keychain` → `expo-secure-store`

### 7. Run the App
```bash
# Start Expo development server
npx expo start

# Or specific platforms
npx expo start --android
npx expo start --ios
npx expo start --web
```
