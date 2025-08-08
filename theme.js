// theme.js
import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // primary: '#FF5A23',  // ← Brand orange from logo
    // primary: '#FF5A1F',    // Bright orange from your logo
    // primary: '#F4511E',   // ← Strong, energetic orange
    primary: '#FF4500',   // ← Strong, energetic orange
    onPrimary: 'white',   // 🔸 Text/icon color on buttons
    outline: '#FF5A23',      // ← Outline color for TextInput
    surfaceVariant: '#FFF3EF', // ← Optional: background for inputs

    // 👇 For contained-tonal buttons
    secondaryContainer: '#FFD1B3',       // light orange background
    onSecondaryContainer: '#6A2E0C',     // dark orange/brown text
  },
};

export default theme;
