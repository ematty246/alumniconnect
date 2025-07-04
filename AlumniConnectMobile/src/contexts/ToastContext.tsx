import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../styles/globalStyles';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

const ToastComponent: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({
  toast,
  onRemove,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onRemove(toast.id));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return { backgroundColor: colors.success };
      case 'error':
        return { backgroundColor: colors.error };
      case 'warning':
        return { backgroundColor: colors.warning };
      default:
        return { backgroundColor: colors.accent };
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        getToastStyle(),
        { opacity: fadeAnim, transform: [{ translateY: fadeAnim }] },
      ]}
    >
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.medium,
  },
  toastText: {
    color: colors.light,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});