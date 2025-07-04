import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(new Date());

  const checkForNewMessages = useCallback(async () => {
    if (!user?.username) return;

    try {
      // Get all connected users
      const usersResponse = await axios.get('http://localhost:8081/auth/search-users?query=');
      const allUsers = usersResponse.data;
      
      let totalUnreadCount = 0;
      
      for (const userInfo of allUsers) {
        if (userInfo.username !== user.username) {
          try {
            // Check if connected
            const statusResponse = await axios.get(
              `http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo.username}`
            );
            
            if (statusResponse.data === 'CONNECTED') {
              // Get chat history
              const chatResponse = await axios.get(
                `http://localhost:8084/api/chat/history?sender=${user.username}&receiver=${userInfo.username}`
              );
              
              // Count unread messages (messages received after last check)
              const unreadMessages = chatResponse.data.filter((message) => 
                message.senderUsername !== user.username && 
                new Date(message.timestamp) > lastChecked
              );
              
              totalUnreadCount += unreadMessages.length;
            }
          } catch (error) {
            console.log('Error checking messages for user:', userInfo.username);
          }
        }
      }
      
      setUnreadCount(totalUnreadCount);
    } catch (error) {
      console.log('Error checking for new messages');
    }
  }, [user, lastChecked]);

  // Check for new messages every 5 seconds
  useEffect(() => {
    if (!user?.username) return;

    // Initial check
    checkForNewMessages();

    // Set up interval for periodic checks
    const interval = setInterval(checkForNewMessages, 5000);

    return () => clearInterval(interval);
  }, [user, checkForNewMessages]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    setLastChecked(new Date());
  }, []);

  const value = {
    unreadCount,
    markAsRead,
    checkForNewMessages
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};