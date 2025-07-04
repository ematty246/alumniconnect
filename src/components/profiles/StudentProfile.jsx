import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, BookOpen, Calendar, Github, Code } from 'lucide-react';
import { profileService } from '../../components/services/profileService';
import { toast } from 'react-toastify';

const StudentProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
   const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getStudentProfile(username);
      setProfile(data);
    } catch (error) {
      toast.error('Error loading student profile');
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
      setImageError(true);
    };
  
    const getProfileImageUrl = () => {
      if (profile?.profileImage) {
        return `http://localhost:8082${profile.profileImage}`;
      }
      return null;
    };
  
    if (loading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      );
    }

  if (!profile) {
    return (
      <div className="fade-in">
        <div className="card text-center">
          <h2>Profile Not Found</h2>
          <p>The student profile could not be loaded.</p>
          <Link to="/connections" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Connections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/connections" className="btn btn-outline">
          <ArrowLeft size={18} />
          Back
        </Link>
        <div>
          <h1 className="hero-title" style={{ margin: 0 }}>Student Profile</h1>
          <p className="hero-subtitle" style={{ margin: 0 }}>@{username}</p>
        </div>
      </div>

      <div className="grid grid-1">
        <div className="card">
          <div className="card-header">
              <div className="profile-section">
              <div className="profile-image-container">
                <div className="profile-image-wrapper" style={{ width: '120px', height: '120px' }}>
                  {getProfileImageUrl() && !imageError ? (
                    <img
                      src={getProfileImageUrl()}
                      alt={`${profile.name || username}'s profile`}
                      className="profile-image"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="profile-avatar-fallback">
                      <User size={40} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="connection-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2563eb' }}>
                  {profile.name || username}
                </h2>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <User size={14} />
                    STUDENT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <BookOpen size={20} style={{ color: '#3b82f6' }} />
                <h3 className="card-title">Academic Information</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div style={{ 
                  backgroundColor: '#dbeafe', 
                  padding: '8px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={16} style={{ color: '#2563eb' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Department</p>
                  <p style={{ margin: 0, fontWeight: '500' }}>{profile.department || 'Not specified'}</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div style={{ 
                  backgroundColor: '#dbeafe', 
                  padding: '8px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={16} style={{ color: '#2563eb' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Year</p>
                  <p style={{ margin: 0, fontWeight: '500' }}>{profile.year || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

<div className="card">
  <div className="card-header">
    <div className="d-flex align-items-center gap-2">
      <Code size={20} style={{ color: '#10b981' }} />
      <h3 className="card-title">Skills</h3>
    </div>
  </div>
  <div style={{ padding: '1rem 0' }}>
    {profile.skills && profile.skills.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {(Array.isArray(profile.skills)
          ? profile.skills
          : profile.skills.split(',')  // Convert string to array
        ).map((skill, index) => (
          <span
            key={index}
            style={{
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #6ee7b7',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {skill.trim()}
          </span>
        ))}
      </div>
    ) : (
      <p style={{ margin: 0, opacity: 0.7, fontStyle: 'italic' }}>No skills listed</p>
    )}
  </div>
</div>

        </div>

        {profile.github && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Github size={20} style={{ color: '#374151' }} />
                <h3 className="card-title">GitHub Profile</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ 
                  backgroundColor: '#f3f4f6', 
                  padding: '8px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Github size={16} style={{ color: '#374151' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>GitHub Repository</p>
                  <a
                    href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {profile.github}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;