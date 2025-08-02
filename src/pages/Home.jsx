import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Search, UserCheck, User, GraduationCap, BookOpen, Briefcase } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  // Role-specific feature configurations
  const roleFeatures = {
    STUDENT: {
      title: "Welcome Student!",
      subtitle: "Connect with alumni, find mentors, and build your professional network for your career journey.",
      features: [
        {
          icon: Users,
          title: "Connect",
          description: "Build meaningful connections with alumni, current students, and faculty members from your institution.",
          gradient: "var(--primary-gradient)"
        },
        {
          icon: MessageCircle,
          title: "Chat", 
          description: "Engage in real-time conversations, get career advice, and collaborate with your network.",
          gradient: "var(--accent-gradient)"
        },
        {
          icon: Search,
          title: "Find People",
          description: "Discover alumni in your field, find study groups, and connect with potential mentors.",
          gradient: "var(--secondary-gradient)"
        },
        {
          icon: User,
          title: "Profile Management",
          description: "Showcase your skills, projects, and academic achievements to attract connections.",
          gradient: "var(--success-gradient)"
        }
      ],
      quickActions: [
        { to: "/profile", icon: User, label: "Update Profile", className: "btn-primary" },
        { to: "/connections", icon: Users, label: "My Connections", className: "btn-secondary" },
        { to: "/chat", icon: MessageCircle, label: "Start Chat", className: "btn-success" },
        { to: "/search", icon: Search, label: "Find People", className: "btn-outline" }
      ]
    },
    ALUMNI: {
      title: "Welcome Alumni!",
      subtitle: "Share your experience, mentor students, and maintain connections with your alma mater.",
      features: [
        {
          icon: User,
          title: "Profile Management",
          description: "Keep your professional profile updated and showcase your career journey to inspire students.",
          gradient: "var(--success-gradient)"
        },
        {
          icon: MessageCircle,
          title: "Chat",
          description: "Mentor students, share career insights, and stay connected with your network.",
          gradient: "var(--accent-gradient)"
        },
        {
          icon: Users,
          title: "Connect",
          description: "Maintain relationships with fellow alumni and connect with current students seeking guidance.",
          gradient: "var(--primary-gradient)"
        }
      ],
      quickActions: [
        { to: "/profile", icon: User, label: "Update Profile", className: "btn-primary" },
        { to: "/chat", icon: MessageCircle, label: "Start Chat", className: "btn-success" },
        { to: "/connections", icon: Users, label: "My Connections", className: "btn-secondary" }
      ]
    },
    FACULTY: {
      title: "Welcome Faculty!",
      subtitle: "Connect with students and alumni, foster academic relationships, and build institutional networks.",
      features: [
        {
          icon: Users,
          title: "Connect",
          description: "Build connections with students, alumni, and fellow faculty members across departments.",
          gradient: "var(--primary-gradient)"
        },
        {
          icon: MessageCircle,
          title: "Chat",
          description: "Communicate with students, collaborate with colleagues, and provide academic guidance.",
          gradient: "var(--accent-gradient)"
        },
        {
          icon: Search,
          title: "Find People",
          description: "Discover students in your courses, connect with alumni, and network with other faculty.",
          gradient: "var(--secondary-gradient)"
        },
        {
          icon: User,
          title: "Profile Management",
          description: "Maintain your academic profile, showcase research, and highlight your expertise.",
          gradient: "var(--success-gradient)"
        }
      ],
      quickActions: [
        { to: "/profile", icon: User, label: "Update Profile", className: "btn-primary" },
        { to: "/connections", icon: Users, label: "My Connections", className: "btn-secondary" },
        { to: "/chat", icon: MessageCircle, label: "Start Chat", className: "btn-success" },
        { to: "/search", icon: Search, label: "Find People", className: "btn-outline" }
      ]
    }
  };

  const currentRoleConfig = user ? roleFeatures[user.role] : null;

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className={`hero-section ${user ? `hero-${user.role.toLowerCase()}` : ''}`}>
        <div className="hero-content">
          {user && (
            <div className="role-indicator">
              {user.role === 'STUDENT' && <GraduationCap size={32} />}
              {user.role === 'ALUMNI' && <Briefcase size={32} />}
              {user.role === 'FACULTY' && <BookOpen size={32} />}
            </div>
          )}
          <h1 className="hero-title">
            {user ? currentRoleConfig.title : "Welcome to AlumniConnect"}
          </h1>
          <p className="hero-subtitle">
            {user ? currentRoleConfig.subtitle : "Connect with alumni, students, and faculty. Build your professional network."}
          </p>
          {!user && (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Role-specific Features Grid */}
      {user ? (
        <div className={`role-features role-features-${user.role.toLowerCase()}`}>
          <div className="features-grid">
            {currentRoleConfig.features.map((feature, index) => (
              <div key={index} className="feature-card" style={{'--feature-gradient': feature.gradient}}>
                <div className="feature-header">
                  <div className="feature-icon">
                    <feature.icon size={28} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                </div>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Default Features for Non-logged Users */
        <div className="default-features">
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
        </div>
      )}

      {/* Role-specific Quick Actions */}
      {user && (
        <div className={`quick-actions-section quick-actions-${user.role.toLowerCase()}`}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <div className="role-badge-large">
                {user.role === 'STUDENT' && <GraduationCap size={18} />}
                {user.role === 'ALUMNI' && <Briefcase size={18} />}
                {user.role === 'FACULTY' && <BookOpen size={18} />}
                <span>{user.role}</span>
              </div>
            </div>
            <div className={`quick-actions-grid grid-${currentRoleConfig.quickActions.length}`}>
              {currentRoleConfig.quickActions.map((action, index) => (
                <Link key={index} to={action.to} className={`btn ${action.className}`}>
                  <action.icon size={18} />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;