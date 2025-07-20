import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Crown, BookOpen, Award, Microscope, User } from 'lucide-react';
import { profileService } from '../../components/services/profileService';
import { toast } from 'react-toastify';

const FacultyProfile = () => {
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
      const data = await profileService.getFacultyProfile(username);
      setProfile(data);
    } catch (error) {
      toast.error('Error loading faculty profile');
      console.error('Error fetching faculty profile:', error);
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
            <p>The alumni profile could not be loaded.</p>
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
<div className="d-flex align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 className="hero-title" style={{ margin: 0 }}>Faculty Profile</h1>
        <p className="hero-subtitle" style={{ margin: 0 }}>@{username}</p>
      </div>

      <div>
        <Link to="/connections" className="btn btn-outline d-inline-flex align-items-center">
          <ArrowLeft size={18} />
          <span className="ms-2">Back</span>
        </Link>
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
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    border: '1px solid #60a5fa',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Crown size={14} />
                    FACULTY
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
                <BookOpen size={20} style={{ color: '#2563eb' }} />
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
                  <Award size={16} style={{ color: '#2563eb' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Designation</p>
                  <p style={{ margin: 0, fontWeight: '500' }}>{profile.designation || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Microscope size={20} style={{ color: '#10b981' }} />
                <h3 className="card-title">Research Interests</h3>
              </div>
            </div>
           <div style={{ padding: '1rem 0' }}>
  {profile.researchInterests && profile.researchInterests.length > 0 ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {(Array.isArray(profile.researchInterests)
        ? profile.researchInterests
        : profile.researchInterests.split(',')
      ).map((interest, index) => (
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
          {interest.trim()}
        </span>
      ))}
    </div>
              ) : (
                <p style={{ margin: 0, opacity: 0.7, fontStyle: 'italic' }}>No research interests listed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;