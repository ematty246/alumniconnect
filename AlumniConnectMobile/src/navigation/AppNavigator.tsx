import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/globalStyles';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ConnectionsScreen from '../screens/connections/ConnectionsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import WebinarDashboardScreen from '../screens/webinar/WebinarDashboardScreen';

// Profile Screens
import StudentProfileScreen from '../screens/profile/StudentProfileScreen';
import AlumniProfileScreen from '../screens/profile/AlumniProfileScreen';
import FacultyProfileScreen from '../screens/profile/FacultyProfileScreen';

// Other Screens
import UserSearchScreen from '../screens/UserSearchScreen';
import PendingRequestsScreen from '../screens/connections/PendingRequestsScreen';
import CreateWebinarScreen from '../screens/webinar/CreateWebinarScreen';
import JoinWebinarScreen from '../screens/webinar/JoinWebinarScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Connections') {
            iconName = 'people';
          } else if (route.name === 'Chat') {
            iconName = 'chat';
          } else if (route.name === 'Webinar') {
            iconName = 'video-call';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.light,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Connections" component={ConnectionsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Webinar" component={WebinarDashboardScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can return a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.light,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
            <Stack.Screen name="AlumniProfile" component={AlumniProfileScreen} />
            <Stack.Screen name="FacultyProfile" component={FacultyProfileScreen} />
            <Stack.Screen name="UserSearch" component={UserSearchScreen} />
            <Stack.Screen name="PendingRequests" component={PendingRequestsScreen} />
            <Stack.Screen name="CreateWebinar" component={CreateWebinarScreen} />
            <Stack.Screen name="JoinWebinar" component={JoinWebinarScreen} />
          </>
        ) : (
          // Auth screens
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;