import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Users, 
  MessageCircle, 
  Search, 
  UserPlus,
  Settings,
  Bell,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile data based on user role
      let profileEndpoint = '';
      switch (user?.role) {
        case 'STUDENT':
          profileEndpoint = 'http://localhost:8082/onboarding/student';
          break;
        case 'ALUMNI':
          profileEndpoint = 'http://localhost:8082/onboarding/alumni';
          break;
        case 'FACULTY':
          profileEndpoint = 'http://localhost:8082/onboarding/faculty';
          break;
        default:
          break;
      }

      if (profileEndpoint) {
        try {
          const profileResponse = await axios.get(profileEndpoint);
          setProfileData(profileResponse.data);
        } catch (error) {
          console.log('Profile not found or error fetching profile');
        }
      }

      // Fetch pending connection requests
      try {
        const requestsResponse = await axios.get('http://localhost:8083/api/chat/connection/pending');
        setPendingRequests(requestsResponse.data);
      } catch (error) {
        console.log('Error fetching pending requests');
      }
    } catch (error) {
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
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
  <User size={48} />
</div>

        <h1 className="hero-title">Welcome, {user?.username || 'User'}!</h1>
        <p className="hero-subtitle">
          Role: {user?.role} | Email: {user?.email}
        </p>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center justify-content-between">
              <h3 className="card-title">Profile Status</h3>
              <Settings size={20} className="text-primary" />
            </div>
          </div>
          <div className="mb-3">
            {profileData ? (
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="status-badge status-connected">Complete</div>
                  <span>Profile is set up</span>
                </div>
                <p className="opacity-75">Your profile information is complete and visible to other users.</p>
              </div>
            ) : (
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="status-badge status-pending">Incomplete</div>
                  <span>Profile needs setup</span>
                </div>
                <p className="opacity-75">Complete your profile to connect with others.</p>
              </div>
            )}
          </div>
          <Link 
            to="/profile" 
            className={`btn ${profileData ? 'btn-secondary' : 'btn-primary'} w-100`}
          >
            <User size={18} />
            {profileData ? 'Update Profile' : 'Complete Profile'}
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center justify-content-between">
              <h3 className="card-title">Connection Requests</h3>
              <Bell size={20} className="text-primary" />
            </div>
          </div>
          <div className="mb-3">
            {pendingRequests.length > 0 ? (
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="status-badge status-pending">{pendingRequests.length}</div>
                  <span>Pending requests</span>
                </div>
                <p className="opacity-75">You have connection requests waiting for your response.</p>
              </div>
            ) : (
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="status-badge status-connected">0</div>
                  <span>No pending requests</span>
                </div>
                <p className="opacity-75">No new connection requests at the moment.</p>
              </div>
            )}
          </div>
          <Link to="/connections/pending" className="btn btn-primary w-100">
            <UserPlus size={18} />
            Manage Requests
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center gap-2">
            <Activity size={24} className="text-primary" />
            <h3 className="card-title">Quick Actions</h3>
          </div>
        </div>
        <div className="grid grid-4">
          <Link to="/search" className="btn btn-outline">
            <Search size={18} />
            Find People
          </Link>
          
          <Link to="/connections" className="btn btn-outline">
            <Users size={18} />
            My Connections
          </Link>
          
          <Link to="/chat" className="btn btn-outline">
            <MessageCircle size={18} />
            Start Chat
          </Link>
          
          <Link to={`/profile/${user?.role?.toLowerCase()}`} className="btn btn-outline">
            <User size={18} />
            Edit Profile
          </Link>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Connection Requests</h3>
          </div>
          <div className="grid grid-2">
            {pendingRequests.slice(0, 4).map((request) => (
              <div key={request.id} className="connection-card">
                <div className="connection-info">
                  <div className="connection-avatar">
                    {request.senderUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{request.senderUsername}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Connection request</p>
                  </div>
                </div>
                <div className="status-badge status-pending">
                  {request.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;