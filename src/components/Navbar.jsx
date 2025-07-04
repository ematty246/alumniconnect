import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  MessageCircle,
  User,
  LogOut,
  Home,
  UserPlus,
  Video
} from 'lucide-react';
import logo from '../assets/logo.png'; // adjust path if necessary

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

              <li>
                <Link to="/chat" className="nav-link">
                  <MessageCircle size={18} />
                  <span className="nav-text">Chat</span>
                </Link>
              </li>

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