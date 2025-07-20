import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Send,
  Paperclip,
  Search,
  Trash2,
  Download,
  User,
  Users,
  Crown,
  Shield,
  Circle,
  Plus,
  X,
  ZoomIn
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Chat = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { markAsRead, checkForNewMessages } = useNotifications();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(username || '');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  // Reaction states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [emojiPickerFromModal, setEmojiPickerFromModal] = useState(false);
  
  // Image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const imageModalRef = useRef(null);

  // WhatsApp-like emoji reactions
  const reactionEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯', '🎉', '👏', '🤔', '😍', '🥰', '😘'];

  useEffect(() => {
    if (!selectedUser) return;

    fetchChatHistory();
    fetchConnectedUsers();
    markAsRead();
    // Clear unread count for selected user
    setUnreadCounts(prev => ({
      ...prev,
      [selectedUser]: 0
    }));
    // Reset scroll behavior when switching users
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    setLastMessageCount(0);
  }, [selectedUser, markAsRead]);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. Should auto-scroll is enabled
    // 2. User is not manually scrolling
    // 3. New messages were added (not just a refresh)
    if (shouldAutoScroll && !isUserScrolling && messages.length > lastMessageCount) {
      scrollToBottom();
    }
    setLastMessageCount(messages.length);
  }, [messages, shouldAutoScroll, isUserScrolling, lastMessageCount]);

  // Auto-refresh messages and unread counts every 2 seconds for better real-time experience
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedUser) {
        // Only fetch if user is not actively scrolling
        if (!isUserScrolling) {
          fetchChatHistory();
        }
      }
      fetchUnreadCounts();
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  // Initial fetch of unread counts and connected users
  useEffect(() => {
    fetchUnreadCounts();
    fetchConnectedUsers();
  }, []);

  // Handle scroll detection
  useEffect(() => {
    const chatContainer = chatMessagesRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px threshold
      
      // If user scrolls up, disable auto-scroll
      if (!isAtBottom) {
        setIsUserScrolling(true);
        setShouldAutoScroll(false);
      } else {
        // If user scrolls back to bottom, re-enable auto-scroll
        setIsUserScrolling(false);
        setShouldAutoScroll(true);
      }

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a timeout to reset scrolling state after user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
        setSelectedMessageId(null);
        setEmojiPickerFromModal(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Close image modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (imageModalRef.current && !imageModalRef.current.contains(event.target)) {
        setShowImageModal(false);
        setSelectedImage(null);
      }
    };

    if (showImageModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImageModal]);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
        setSelectedImage(null);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImageModal]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConnectedUsers = async () => {
    try {
      // Get all users with their roles from /users endpoint
      const response = await axios.get('http://localhost:8081/auth/users');
      const allUsers = response.data;

      const connected = [];
      for (const userInfo of allUsers) {
        if (userInfo.username !== user?.username) {
          try {
            const statusResponse = await axios.get(
              `http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo.username}`
            );
            if (statusResponse.data === 'CONNECTED') {
              connected.push({
                username: userInfo.username,
                role: userInfo.role
              });
            }
          } catch (error) {
            console.log('Error checking connection status');
          }
        }
      }
      setConnectedUsers(connected);
    } catch (error) {
      console.log('Error fetching connected users');
    }
  };

  const fetchUnreadCounts = async () => {
    if (!user?.username) return;

    try {
      const response = await axios.get(
        `http://localhost:8084/api/chat/unread/count?receiver=${user.username}`
      );
      
      const counts = response.data || {};
      setUnreadCounts(counts);
    } catch (error) {
      console.log('Error fetching unread counts');
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedUser || !user?.username) return;

    try {
      // Use the new endpoint that includes reactions
      const response = await axios.get(
        `http://localhost:8084/api/chat/history/with-reactions?sender=${user.username}&receiver=${selectedUser}`
      );
      setMessages(response.data);
    } catch (error) {
      console.log('Error fetching chat history');
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a user to chat with');
      return;
    }

    if (!newMessage.trim() && !file) {
      toast.error('Please enter a message or select a file');
      return;
    }

    setLoading(true);
    // Enable auto-scroll when sending a message
    setShouldAutoScroll(true);
    setIsUserScrolling(false);

    try {
      if (file) {
        // Send file message
        const formData = new FormData();
        formData.append('sender', user.username);
        formData.append('receiver', selectedUser);
        formData.append('file', file);

        await axios.post('http://localhost:8084/api/chat/send/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Send text message
        await axios.post('http://localhost:8084/api/chat/send/text', {
          sender: user.username,
          receiver: selectedUser,
          message: newMessage
        });
      }

      setNewMessage('');
      toast.success('Message sent successfully');
      
      // Refresh chat history immediately after sending
      await fetchChatHistory();
      
      // Trigger immediate notification check for real-time updates
      await checkForNewMessages();
      
      // Force update unread counts immediately and after a short delay
      await fetchUnreadCounts();
      setTimeout(async () => {
        await fetchUnreadCounts();
      }, 500);
      
    } catch (error) {
      toast.error(error.response?.data || 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedUser) return;

    if (window.confirm('Are you sure you want to delete this chat history?')) {
      try {
        await axios.delete(
          `http://localhost:8084/api/chat/delete?user1=${user.username}&user2=${selectedUser}`
        );
        
        toast.success('Chat history deleted successfully');
        setMessages([]);
        
        // Update unread counts after deletion
        await fetchUnreadCounts();
      } catch (error) {
        toast.error('Error deleting chat history');
      }
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Filter connected users based on search query
    const filteredUsers = connectedUsers.filter(userInfo =>
      userInfo.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(filteredUsers);
  };

  const handleUserSelect = async (username) => {
    setSelectedUser(username);
    // Clear search results and query when a user is selected
    setSearchResults([]);
    setSearchQuery('');
    setIsSearching(false);

    // Mark messages as read when selecting a user
    try {
      await axios.put(
        `http://localhost:8084/api/chat/mark-read?sender=${username}&receiver=${user.username}`
      );
      
      // Clear unread count for selected user
      setUnreadCounts(prev => ({
        ...prev,
        [username]: 0
      }));
      
      // Refresh unread counts for all users
      await fetchUnreadCounts();
    } catch (error) {
      console.log('Error marking messages as read');
    }
  };

  // Show emoji picker for message
  const handleShowEmojiPicker = (messageId, fromModal = false) => {
    setSelectedMessageId(messageId);
    setShowEmojiPicker(true);
    setEmojiPickerFromModal(fromModal);
  };

  // Add reaction to message
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await axios.post('http://localhost:8084/api/chat/react', null, {
        params: {
          messageId: messageId,
          reactor: user.username,
          emoji: emoji
        }
      });

      // Refresh chat history to show new reaction
      await fetchChatHistory();
      
      // Close emoji picker
      setShowEmojiPicker(false);
      setSelectedMessageId(null);
      setEmojiPickerFromModal(false);
      
      toast.success('Reaction added');
    } catch (error) {
      toast.error('Error adding reaction');
    }
  };

  // Remove reaction from message
  const handleRemoveReaction = async (messageId) => {
    try {
      await axios.delete('http://localhost:8084/api/chat/react', {
        params: {
          messageId: messageId,
          reactor: user.username
        }
      });

      // Refresh chat history to show removed reaction
      await fetchChatHistory();
      
      toast.success('Reaction removed');
    } catch (error) {
      toast.error('Error removing reaction');
    }
  };

  // Handle image click to open modal
  const handleImageClick = (imageUrl, messageId) => {
    setSelectedImage({
      url: imageUrl,
      messageId: messageId
    });
    setShowImageModal(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'FACULTY':
        return <Crown size={12} style={{ color: '#f59e0b' }} />;
      case 'ALUMNI':
        return <Shield size={12} style={{ color: '#3b82f6' }} />;
      case 'STUDENT':
      default:
        return <User size={12} style={{ color: '#6b7280' }} />;
    }
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      'FACULTY': {
        backgroundColor: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fbbf24'
      },
      'ALUMNI': {
        backgroundColor: '#dbeafe',
        color: '#2563eb',
        border: '1px solid #60a5fa'
      },
      'STUDENT': {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: '1px solid #d1d5db'
      }
    };

    const style = roleStyles[role] || roleStyles['STUDENT'];

    return (
      <span 
        style={{
          ...style,
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {getRoleIcon(role)}
        {role || 'USER'}
      </span>
    );
  };

  const renderNotificationBadge = (username) => {
    const count = unreadCounts[username];
    if (!count || count === 0) return null;

    return (
      <div
        style={{
          backgroundColor: '#25D366', // WhatsApp green
          color: 'white',
          borderRadius: '50%',
          minWidth: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          marginLeft: 'auto',
          padding: count > 9 ? '0 6px' : '0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: '2px solid white'
        }}
      >
        {count > 99 ? '99+' : count}
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const isImageFile = (fileUrl) => {
    return fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  };

  const isPdfFile = (fileUrl) => {
    return fileUrl && /\.pdf$/i.test(fileUrl);
  };

  const getSelectedUserInfo = () => {
    return connectedUsers.find(u => u.username === selectedUser) ||
           searchResults.find(u => u.username === selectedUser) ||
           { username: selectedUser, role: 'USER' };
  };

  const renderMessageReactions = (message) => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) return null;

    const groupedReactions = Object.entries(message.reactions).reduce((acc, [reactor, emoji]) => {
      if (!acc[emoji]) {
        acc[emoji] = [];
      }
      acc[emoji].push(reactor);
      return acc;
    }, {});

    return (
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        right: '-8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2px',
        zIndex: 10
      }}>
        {Object.entries(groupedReactions).map(([emoji, reactors]) => {
          const hasUserReacted = reactors.includes(user.username);
          const count = reactors.length;

          return (
            <div
              key={emoji}
              onClick={() => {
                if (hasUserReacted) {
                  handleRemoveReaction(message.id);
                } else {
                  handleAddReaction(message.id, emoji);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                backgroundColor: hasUserReacted ? '#dcf8c6' : 'white',
                border: hasUserReacted ? '1px solid #4fc3f7' : '1px solid #e0e0e0',
                color: hasUserReacted ? '#2e7d32' : '#666',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                minWidth: '24px',
                height: '20px',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
              title={`${reactors.join(', ')} reacted with ${emoji}`}
            >
              <span style={{ fontSize: '0.75rem' }}>{emoji}</span>
              {count > 1 && (
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{count}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderUserCard = (userInfo) => (
    <div
      key={userInfo.username}
      onClick={() => handleUserSelect(userInfo.username)}
      className="connection-card cursor-pointer"
      style={{ 
        padding: '0.75rem',
        marginBottom: '0.5rem',
        backgroundColor: selectedUser === userInfo.username ? 'rgba(102, 126, 234, 0.1)' : undefined,
        border: selectedUser === userInfo.username ? '2px solid #667eea' : '1px solid #e2e8f0',
        position: 'relative',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div className="connection-info" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div className="connection-avatar" style={{ 
          width: '40px', 
          height: '40px', 
          fontSize: '1rem',
          backgroundColor: '#667eea',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          marginRight: '12px'
        }}>
          {userInfo.username.charAt(0).toUpperCase()}
        </div>
        <div className="connection-details" style={{ flex: 1, minWidth: 0 }}>
          <div className="connection-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4 className="connection-username" style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>
              {userInfo.username}
            </h4>
            {getRoleBadge(userInfo.role)}
          </div>
          <p className="connection-handle" style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
            @{userInfo.username}
          </p>
        </div>
        {renderNotificationBadge(userInfo.username)}
      </div>
    </div>
  );

  // Function to manually scroll to bottom (for button)
  const handleScrollToBottom = () => {
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    scrollToBottom();
  };

  return (
    <div className="fade-in">
      <div className="hero-section">
        <h1 className="hero-title">Chat</h1>
        <p className="hero-subtitle">Connect and communicate with your network</p>
      </div>

      <div className="grid grid-3 mb-4" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
        {/* User Search and Selection */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Find Users</h3>
          </div>

          <form onSubmit={handleSearchUsers} className="mb-3" style={{ position: 'relative' }}>
            <div className="search-container" style={{ position: 'relative' }}>
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search connected users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '0.75rem 0.75rem 0.75rem 2.5rem' }}
              />

              {isSearching && searchQuery && (
                <div
                  className="dropdown-results"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                  }}
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((userInfo) => renderUserCard(userInfo))
                  ) : (
                    <p className="text-center opacity-50" style={{ fontSize: '0.9rem', margin: 0 }}>
                      No connected users found matching "{searchQuery}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-outline w-100 mt-2"
              style={{ fontSize: '0.9rem', padding: '0.5rem' }}
            >
              <Search size={16} />
              Search
            </button>
          </form>

          <div>
            <h5 style={{ marginBottom: '0.5rem', color: '#667eea', fontSize: '0.9rem' }}>
              Connected Users
            </h5>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {connectedUsers.map((userInfo) => renderUserCard(userInfo))}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-container" style={{ position: 'relative' }}>
          <div className="chat-header">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <MessageCircle size={20} />
                {selectedUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Chat with {selectedUser}</span>
                    {getRoleBadge(getSelectedUserInfo().role)}
                  </div>
                ) : (
                  <span>Select a user to chat</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {selectedUser && !shouldAutoScroll && (
                  <button
                    onClick={handleScrollToBottom}
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    title="Scroll to bottom"
                  >
                    ↓
                  </button>
                )}
                {selectedUser && (
                  <button
                    onClick={handleDeleteChat}
                    className="btn btn-danger"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.length === 0 ? (
              <div className="text-center opacity-50">
                <MessageCircle size={48} className="text-primary mb-2" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.senderUsername === user?.username ? 'sent' : 'received'}`}
                  style={{ position: 'relative', marginBottom: '16px' }}
                >
                  <div style={{ 
                    fontSize: '0.8rem', 
                    opacity: 0.7, 
                    marginBottom: '0.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      {message.senderUsername} • {formatTimestamp(message.timestamp)}
                    </span>
                    
                    {/* Reaction + button */}
                    <button
                      onClick={() => handleShowEmojiPicker(message.id, false)}
                      style={{
                        background: 'rgba(0,0,0,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: 0.6,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.background = 'rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '0.6';
                        e.target.style.background = 'rgba(0,0,0,0.1)';
                      }}
                      title="Add reaction"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  {message.message && (
                    <div>{message.message}</div>
                  )}
                  
                  {message.fileUrl && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {isImageFile(message.fileUrl) ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={message.fileUrl}
                            alt="Shared image"
                            onClick={() => handleImageClick(message.fileUrl, message.id)}
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '200px', 
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.02)';
                              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                            }}
                          />
                          {/* Zoom indicator overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                              pointerEvents: 'none'
                            }}
                            className="zoom-indicator"
                          >
                            <ZoomIn size={12} color="white" />
                          </div>
                        </div>
                      ) : isPdfFile(message.fileUrl) ? (
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px' }}>
                            📄 PDF File
                          </div>
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px' }}>
                            📎 {message.fileType || 'File'}
                          </div>
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* WhatsApp-style reactions positioned at bottom-right */}
                  {renderMessageReactions(message)}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Modal */}
          {showImageModal && selectedImage && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.9)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
            >
              <div
                ref={imageModalRef}
                style={{
                  position: 'relative',
                  maxWidth: '80vw',
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedImage(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s ease',
                    zIndex: 2001
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(0,0,0,0.1)';
                  }}
                >
                  <X size={20} />
                </button>

                {/* Image */}
                <img
                  src={selectedImage.url}
                  alt="Enlarged view"
                  style={{
                    maxWidth: 'calc(80vw - 40px)',
                    maxHeight: 'calc(80vh - 120px)',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />

                {/* Download button */}
                <div style={{ 
                  marginTop: '16px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <a
                    href={selectedImage.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#667eea',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#5a67d8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#667eea';
                    }}
                  >
                    <Download size={16} />
                    Download
                  </a>
                  
                  <button
                    onClick={() => handleShowEmojiPicker(selectedImage.messageId, true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#38a169';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#48bb78';
                    }}
                  >
                    <Plus size={16} />
                    React
                  </button>
                </div>

                {/* Instructions */}
                <p style={{
                  color: '#666',
                  fontSize: '0.8rem',
                  marginTop: '12px',
                  textAlign: 'center'
                }}>
                  Click outside to close • Press ESC to close
                </p>
              </div>
            </div>
          )}

          {/* Emoji Picker Modal */}
          {showEmojiPicker && selectedMessageId && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: emojiPickerFromModal ? 2500 : 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                ref={emojiPickerRef}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '1px solid #e0e0e0',
                  maxWidth: '320px',
                  width: '90vw',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '16px' 
                }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>
                    React to message
                  </h4>
                  <button
                    onClick={() => {
                      setShowEmojiPicker(false);
                      setSelectedMessageId(null);
                      setEmojiPickerFromModal(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px'
                }}>
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(selectedMessageId, emoji)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '2px solid #f0f0f0',
                        fontSize: '1.8rem',
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: '12px',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f8f9fa';
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#f0f0f0';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedUser && (
            <form onSubmit={handleSendMessage} className="chat-input">
              <input
                type="text"
                className="form-control"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading || !!file}
                style={{ marginRight: '0.5rem' }}
              />
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline"
                disabled={loading || !!newMessage.trim()}
                style={{ marginRight: '0.5rem' }}
              >
                <Paperclip size={18} />
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (!newMessage.trim() && !file)}
              >
                {loading ? (
                  <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          )}
          
          {file && (
            <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f8f9fa', fontSize: '0.9rem' }}>
              Selected file: {file.name}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#ff5722', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Chat Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Chat Info</h3>
          </div>
          
          {selectedUser ? (
            <div>
              <div className="text-center mb-3">
                <div className="connection-avatar" style={{ 
                  margin: '0 auto 1rem', 
                  width: '60px', 
                  height: '60px', 
                  fontSize: '1.5rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {selectedUser.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{selectedUser}</h4>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                  @{selectedUser}
                </p>
                <div style={{ marginTop: '8px' }}>
                  {getRoleBadge(getSelectedUserInfo().role)}
                </div>
              </div>
              
              <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                <p><strong>Messages:</strong> {messages.length}</p>
                <p><strong>Connection:</strong> <span className="status-badge status-connected">Connected</span></p>
                <p><strong>Role:</strong> {getSelectedUserInfo().role}</p>
              </div>
              
              <div className="mt-3">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#495057', marginBottom: '4px' }}>
                    💡 How to interact:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#6c757d' }}>
                    <li>Click + on messages to react</li>
                    <li>Click images to view full size</li>
                    <li>Click existing reactions to toggle</li>
                  </ul>
                </div>
                
                <button
                  onClick={handleDeleteChat}
                  className="btn btn-danger w-100"
                  style={{ fontSize: '0.9rem', padding: '0.5rem' }}
                >
                  <Trash2 size={16} />
                  Clear Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center opacity-50">
              <User size={48} className="text-primary mb-2" />
              <p>Select a user to view chat information</p>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for hover effects */}
      <style jsx>{`
        .message img:hover + .zoom-indicator {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default Chat;