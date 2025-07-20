import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  MessageCircle,
  User,
  LogOut,
  Home,
  UserPlus,
  Video,
  UserCheck
} from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const token = localStorage.getItem('token'); 
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch unread message count for the logged-in user
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user?.username) {
        try {
          const response = await fetch(`http://localhost:8084/api/chat/unread/count?receiver=${user.username}`);
          if (response.ok) {
            const data = await response.json();
            const total = Object.values(data).reduce((sum, count) => sum + count, 0);
            setUnreadCount(total);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

 useEffect(() => {
  if (!user || !user.role || !token) {
    console.log("⛔ Skipping fetchPendingCount: user not ready", user);
    return; // Exit early if user isn't ready
  }

  const fetchPendingCount = async () => {
    console.log("📡 Fetching pending count...");

    try {
      const response = await fetch('http://localhost:8081/auth/pending-count', {
        method: 'GET',
        headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

      });

      if (response.ok) {
        const data = await response.json();
        const count = Number(data);
        console.log('✅ Pending student count:', count);
        setPendingCount(count);
      } else {
        console.error('❌ Failed to fetch, status:', response.status);
      }
    } catch (err) {
      console.error('💥 Error fetching:', err);
    }
  };

  fetchPendingCount();
  const interval = setInterval(fetchPendingCount, 30000);

  return () => clearInterval(interval);
}, [user?.role, user?.token]);

  // Clear unread count when Chat page is opened
  useEffect(() => {
    if (location.pathname === '/chat') {
      setUnreadCount(0);
    }
  }, [location]);

 
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="AlumniConnect Logo" className="navbar-logo" />
          <span className="navbar-brand-text">AlumniConnect</span>
        </Link>

        <ul className="navbar-nav">
          <li>
            <Link to="/" className="nav-link">
              <Home size={18} />
              <span className="nav-text">Home</span>
            </Link>
          </li>

          <li>
            <Link to="/webinar" className="nav-link">
              <Video size={18} />
              <span className="nav-text">Webinar</span>
            </Link>
          </li>

          {user ? (
            <>
              <li>
                <Link to="/dashboard" className="nav-link">
                  <User size={18} />
                  <span className="nav-text">Dashboard</span>
                </Link>
              </li>

              <li>
                <Link to="/profile" className="nav-link">
                  <User size={18} />
                  <span className="nav-text">Profile</span>
                </Link>
              </li>

              <li>
                <Link to="/connections" className="nav-link">
                  <Users size={18} />
                  <span className="nav-text">Connections</span>
                </Link>
              </li>

              <li className="nav-item-with-badge">
                <Link to="/chat" className="nav-link">
                  <MessageCircle size={18} />
                  <span className="nav-text">Chat</span>
                </Link>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </li>
{user.role === 'FACULTY' && (
  <li className="nav-item-with-badge">
    <Link to="/verify-students" className="nav-link nav-link-faculty">
      <UserCheck size={18} />
      <span className="nav-text">Verify Students</span>
    </Link>
    
    {pendingCount > 0 && (
      <span className="notification-badge">
        {pendingCount}
      </span>
    )}
  </li>
)}

              <li>
                <button onClick={handleLogout} className="nav-link nav-button">
                  <LogOut size={18} />
                  <span className="nav-text">Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link">
                  <User size={18} />
                  <span className="nav-text">Login</span>
                </Link>
              </li>

              <li>
                <Link to="/register" className="nav-link">
                  <UserPlus size={18} />
                  <span className="nav-text">Register</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;