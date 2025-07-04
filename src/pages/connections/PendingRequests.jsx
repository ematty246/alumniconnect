import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PendingRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('http://localhost:8083/api/chat/connection/pending');
      setPendingRequests(response.data);
    } catch (error) {
      toast.error('Error fetching pending requests');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (fromUsername, response) => {
    try {
      const apiResponse = await axios.post(
        `http://localhost:8083/api/chat/connection/respond?fromUsername=${fromUsername}&response=${response}`
      );
      
      toast.success(apiResponse.data);
      
      // Remove the request from the list
      setPendingRequests(prev => 
        prev.filter(request => request.senderUsername !== fromUsername)
      );
    } catch (error) {
      toast.error(error.response?.data || 'Error responding to request');
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
        <div className="profile-avatar">
          <UserPlus size={48} />
        </div>
        <h1 className="hero-title">Pending Requests</h1>
        <p className="hero-subtitle">
          {pendingRequests.length} connection request{pendingRequests.length !== 1 ? 's' : ''} waiting for your response
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="card text-center">
          <div className="opacity-50">
            <UserPlus size={48} className="text-primary mb-2" />
            <h3>No Pending Requests</h3>
            <p>You don't have any connection requests at the moment.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Connection Requests</h3>
          </div>
          
          <div className="grid grid-1">
            {pendingRequests.map((request) => (
              <div key={request.id} className="connection-card">
                <div className="connection-info">
                  <div className="connection-avatar">
                    {request.senderUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{request.senderUsername}</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                      Wants to connect with you
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                      Request ID: {request.id}
                    </p>
                  </div>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => respondToRequest(request.senderUsername, 'ACCEPTED')}
                    className="btn btn-success"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    <Check size={18} />
                    Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(request.senderUsername, 'REJECTED')}
                    className="btn btn-danger"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    <X size={18} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tips</h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Review each request carefully before accepting</li>
          <li>Check the user's profile if available before connecting</li>
          <li>Once accepted, you can start chatting with the connected user</li>
          <li>Declined requests cannot be undone</li>
        </ul>
      </div>
    </div>
  );
};

export default PendingRequests;