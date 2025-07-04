import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Search, UserCheck, User } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="fade-in">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to AlumniConnect</h1>
        <p className="hero-subtitle">
          Connect with alumni, students, and faculty. Build your professional network.
        </p>
        {!user && (
          <div className="d-flex justify-content-center gap-2">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline">
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center gap-2">
              <Users className="text-primary" size={24} />
              <h3 className="card-title">Connect</h3>
            </div>
          </div>
          <p>Build meaningful connections with alumni, current students, and faculty members from your institution.</p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center gap-2">
              <MessageCircle className="text-primary" size={24} />
              <h3 className="card-title">Chat</h3>
            </div>
          </div>
          <p>Engage in real-time conversations, share experiences, and collaborate on projects with your network.</p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center gap-2">
              <Search className="text-primary" size={24} />
              <h3 className="card-title">Discover</h3>
            </div>
          </div>
          <p>Find and connect with people based on interests, departments, graduation years, and professional backgrounds.</p>
        </div>
      </div>

      {user && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="grid grid-4">
            <Link to="/profile" className="btn btn-primary">
              <User size={18} />
              Update Profile
            </Link>
            <Link to="/connections" className="btn btn-secondary">
              <Users size={18} />
              My Connections
            </Link>
            <Link to="/chat" className="btn btn-success">
              <MessageCircle size={18} />
              Start Chat
            </Link>
            <Link to="/search" className="btn btn-outline">
              <Search size={18} />
              Find People
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;