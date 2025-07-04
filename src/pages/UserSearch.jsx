import React, { useState } from 'react';
import { Search, User, UserPlus, Crown, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userStatuses, setUserStatuses] = useState({});
  const { user } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8081/auth/search-users?query=${query}`);
      setResults(response.data);
      
      // Check connection status for each user
      const statuses = {};
      for (const userInfo of response.data) {
        if (userInfo.username !== user?.username) {
          try {
            const statusResponse = await axios.get(
              `http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo.username}`
            );
            statuses[userInfo.username] = statusResponse.data;
          } catch (error) {
            statuses[userInfo.username] = 'NOT_CONNECTED';
          }
        }
      }
      setUserStatuses(statuses);
    } catch (error) {
      toast.error('Error searching users');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (username) => {
    try {
      const response = await axios.post('http://localhost:8083/api/chat/connection/send', {
        receiverUsername: username
      });
      
      toast.success(response.data);
      
      // Update the status for this user
      setUserStatuses(prev => ({
        ...prev,
        [username]: 'PENDING'
      }));
    } catch (error) {
      toast.error(error.response?.data || 'Error sending connection request');
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
      case 'ADMIN':
        return <Crown size={14} style={{ color: '#f59e0b' }} />;
      case 'MODERATOR':
        return <Shield size={14} style={{ color: '#3b82f6' }} />;
      case 'USER':
      default:
        return <User size={14} style={{ color: '#6b7280' }} />;
    }
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      'ADMIN': {
        backgroundColor: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fbbf24'
      },
      'MODERATOR': {
        backgroundColor: '#dbeafe',
        color: '#2563eb',
        border: '1px solid #60a5fa'
      },
      'USER': {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: '1px solid #d1d5db'
      }
    };

    const style = roleStyles[role] || roleStyles['USER'];

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
        {role || 'USER'}
      </span>
    );
  };

  return (
    <div className="fade-in">
      <div className="hero-section">
        <h1 className="hero-title">Find People</h1>
        <p className="hero-subtitle">Search for students, alumni, and faculty members</p>
      </div>

      <div className="card">
        <form onSubmit={handleSearch}>
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="text-center mt-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              ) : (
                <>
                  <Search size={18} />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Search Results ({results.length})</h3>
          </div>
          <div className="grid grid-2">
            {results.map((userInfo) => (
              <div key={userInfo.username} className="connection-card">
                <div className="connection-info">
                  <div className="connection-avatar">
                    {userInfo.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{userInfo.username}</h4>
                      {getRoleBadge(userInfo.role)}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                      @{userInfo.username}
                    </p>
                  </div>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  {getStatusBadge(userStatuses[userInfo.username])}
                  
                  {userInfo.username !== user?.username && userStatuses[userInfo.username] === 'NOT_CONNECTED' && (
                    <button
                      onClick={() => sendConnectionRequest(userInfo.username)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      <UserPlus size={16} />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {query && results.length === 0 && !loading && (
        <div className="card text-center">
          <div className="opacity-50">
            <User size={48} className="text-primary mb-2" />
            <h3>No users found</h3>
            <p>Try searching with a different username</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;