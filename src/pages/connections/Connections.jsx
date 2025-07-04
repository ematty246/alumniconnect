import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search, MessageCircle, Crown, User, Shield, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from "../../context/AuthContext";


const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, []);

  const fetchConnections = async () => {
    try {
      // This would be a custom endpoint to get user's connections
      // For now, we'll simulate this with search results
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching connections');
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('http://localhost:8083/api/chat/connection/pending');
      setPendingRequests(response.data);
    } catch (error) {
      console.log('Error fetching pending requests');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`http://localhost:8081/auth/search-users?query=${searchQuery}`);
      const results = [];
      
      // Updated to handle the new response structure with username and role
      for (const userInfo of response.data) {
        if (userInfo.username !== user?.username) {
          try {
            const statusResponse = await axios.get(
              `http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo.username}`
            );
            results.push({
              username: userInfo.username,
              role: userInfo.role,
              status: statusResponse.data
            });
          } catch (error) {
            results.push({
              username: userInfo.username,
              role: userInfo.role,
              status: 'NOT_CONNECTED'
            });
          }
        }
      }
      
      setSearchResults(results);
    } catch (error) {
      toast.error('Error searching users');
    }
  };

  const sendConnectionRequest = async (username) => {
    try {
      const response = await axios.post('http://localhost:8083/api/chat/connection/send', {
        receiverUsername: username
      });
      
      toast.success(response.data);
      
      // Update the search results
      setSearchResults(prev => 
        prev.map(user => 
          user.username === username 
            ? { ...user, status: 'PENDING' }
            : user
        )
      );
    } catch (error) {
      toast.error(error.response?.data || 'Error sending connection request');
    }
  };

  const respondToRequest = async (fromUsername, response) => {
    try {
      const apiResponse = await axios.post(
        `http://localhost:8083/api/chat/connection/respond?fromUsername=${fromUsername}&response=${response}`
      );
      
      toast.success(apiResponse.data);
      
      // Remove the request from pending list
      setPendingRequests(prev => 
        prev.filter(request => request.senderUsername !== fromUsername)
      );
    } catch (error) {
      toast.error(error.response?.data || 'Error responding to request');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONNECTED':
        return <div className="status-badge status-connected">Connected</div>;
      case 'PENDING':
        return <div className="status-badge status-pending">Pending</div>;
      default:
        return <div className="status-badge status-not-connected">Not Connected</div>;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'FACULTY':
        return <Crown size={14} style={{ color: '#f59e0b' }} />;
      case 'ALUMNI':
        return <Shield size={14} style={{ color: '#3b82f6' }} />;
      case 'STUDENT':
      default:
        return <User size={14} style={{ color: '#6b7280' }} />;
    }
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      'ALUMNI': {
        backgroundColor: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fbbf24'
      },
      'FACULTY': {
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
          fontSize: '0.75rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {getRoleIcon(role)}
        {role || 'STUDENT'}
      </span>
    );
  };

  const getProfileRoute = (role, username) => {
    switch (role) {
      case 'STUDENT':
        return `/profile/student/public/${username}`;
      case 'ALUMNI':
        return `/profile/alumni/public/${username}`;
      case 'FACULTY':
        return `/profile/faculty/public/${username}`;
      default:
        return `/profile/student/public/${username}`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="hero-section">
        <h1 className="hero-title">Connections</h1>
        <p className="hero-subtitle">Manage your professional network</p>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center justify-content-between">
              <h3 className="card-title">Pending Requests</h3>
              <UserPlus size={20} className="text-primary" />
            </div>
          </div>
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="status-badge status-pending">{pendingRequests.length}</div>
              <span>Requests waiting for response</span>
            </div>
          </div>
          <Link to="/connections/pending" className="btn btn-primary w-100">
            <UserPlus size={18} />
            View All Requests
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center justify-content-between">
              <h3 className="card-title">Quick Actions</h3>
              <Users size={20} className="text-primary" />
            </div>
          </div>
          <div className="d-flex flex-direction-column gap-2">
            <Link to="/search" className="btn btn-outline w-100">
              <Search size={18} />
              Find People
            </Link>
            <Link to="/chat" className="btn btn-secondary w-100">
              <MessageCircle size={18} />
              Start Chat
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Search & Connect</h3>
        </div>
        
        <form onSubmit={handleSearch} className="mb-4">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search for users to connect..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-center mt-3">
            <button type="submit" className="btn btn-primary">
              <Search size={18} />
              Search Users
            </button>
          </div>
        </form>

        {searchResults.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>Search Results</h4>
            <div className="grid grid-1">
              {searchResults.map((result) => (
                <div key={result.username} className="connection-card">
                  <div className="connection-info">
                    <div className="connection-avatar">
                      {result.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{result.username}</h4>
                        {getRoleBadge(result.role)}
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                        @{result.username}
                      </p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {getStatusBadge(result.status)}
                    
                    <Link
                      to={getProfileRoute(result.role, result.username)}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      <Eye size={16} />
                      View Profile
                    </Link>
                    
                    {result.status === 'NOT_CONNECTED' && (
                      <button
                        onClick={() => sendConnectionRequest(result.username)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        <UserPlus size={16} />
                        Connect
                      </button>
                    )}
                    
                    {result.status === 'CONNECTED' && (
                      <Link
                        to={`/chat/${result.username}`}
                        className="btn btn-success"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        <MessageCircle size={16} />
                        Chat
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Requests</h3>
          </div>
          <div className="grid grid-1">
            {pendingRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="connection-card">
                <div className="connection-info">
                  <div className="connection-avatar">
                    {request.senderUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{request.senderUsername}</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                      Wants to connect with you
                    </p>
                  </div>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => respondToRequest(request.senderUsername, 'ACCEPTED')}
                    className="btn btn-success"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(request.senderUsername, 'REJECTED')}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Connections;