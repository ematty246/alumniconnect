import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/styles/globalStyles';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <AppNavigator />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;