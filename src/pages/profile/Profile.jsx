import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, GraduationCap, Briefcase, Users } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'STUDENT':
        return <GraduationCap size={48} />;
      case 'ALUMNI':
        return <Briefcase size={48} />;
      case 'FACULTY':
        return <Users size={48} />;
      default:
        return <User size={48} />;
    }
  };

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'STUDENT':
        return 'Complete your student profile to connect with peers and alumni.';
      case 'ALUMNI':
        return 'Share your professional journey and mentor current students.';
      case 'FACULTY':
        return 'Connect with students and fellow faculty members.';
      default:
        return 'Complete your profile to get started.';
    }
  };

  return (
    <div className="fade-in">
      <div className="hero-section">
        <div className="profile-avatar">
          {getRoleIcon()}
        </div>
        <h1 className="hero-title">Profile Setup</h1>
        <p className="hero-subtitle">{getRoleDescription()}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Choose Your Profile Type</h3>
        </div>
        
        <div className="grid grid-3">
          <div className="card">
            <div className="text-center">
              <GraduationCap size={48} className="text-primary mb-3" />
              <h4>Student Profile</h4>
              <p className="opacity-75 mb-3">
                Share your academic journey, skills, and projects.
              </p>
              <Link 
                to="/profile/student" 
                className={`btn w-100 ${user?.role === 'STUDENT' ? 'btn-primary' : 'btn-outline'}`}
              >
                <GraduationCap size={18} />
                {user?.role === 'STUDENT' ? 'Manage Profile' : 'View Sample'}
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <Briefcase size={48} className="text-primary mb-3" />
              <h4>Alumni Profile</h4>
              <p className="opacity-75 mb-3">
                Showcase your professional achievements and experience.
              </p>
              <Link 
                to="/profile/alumni" 
                className={`btn w-100 ${user?.role === 'ALUMNI' ? 'btn-primary' : 'btn-outline'}`}
              >
                <Briefcase size={18} />
                {user?.role === 'ALUMNI' ? 'Manage Profile' : 'View Sample'}
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <Users size={48} className="text-primary mb-3" />
              <h4>Faculty Profile</h4>
              <p className="opacity-75 mb-3">
                Share your research interests and academic expertise.
              </p>
              <Link 
                to="/profile/faculty" 
                className={`btn w-100 ${user?.role === 'FACULTY' ? 'btn-primary' : 'btn-outline'}`}
              >
                <Users size={18} />
                {user?.role === 'FACULTY' ? 'Manage Profile' : 'View Sample'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Information</h3>
        </div>
        <div className="grid grid-2">
          <div>
            <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Username</h5>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{user?.username}</p>
          </div>
          <div>
            <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Email</h5>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{user?.email}</p>
          </div>
          <div>
            <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Role</h5>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;