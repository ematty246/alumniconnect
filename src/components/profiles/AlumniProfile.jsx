import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, BookOpen, Calendar, Briefcase, Linkedin, User, Phone, MapPin, Building, Award, Target } from 'lucide-react';
import { profileService } from '../services/profileService';
import { toast } from 'react-toastify';

const AlumniProfileView = () => {
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
      const data = await profileService.getAlumniProfile(username);
      setProfile(data);
    } catch (error) {
      toast.error('Error loading alumni profile');
      console.error('Error fetching alumni profile:', error);
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

  const getCountryFlag = (countryCode) => {
    const countryFlags = {
      '+91': '🇮🇳',
      '+1': '🇺🇸',
      '+44': '🇬🇧',
      '+86': '🇨🇳',
      '+81': '🇯🇵',
      '+49': '🇩🇪',
      '+33': '🇫🇷',
      '+39': '🇮🇹',
      '+7': '🇷🇺',
      '+55': '🇧🇷',
      '+61': '🇦🇺',
      '+82': '🇰🇷',
      '+65': '🇸🇬',
      '+971': '🇦🇪',
      '+966': '🇸🇦'
    };
    return countryFlags[countryCode] || '🌍';
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
          <h1 className="hero-title" style={{ margin: 0 }}>Alumni Profile</h1>
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
        {/* Enhanced Profile Header Card */}
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
            
            <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '2rem', color: '#d97706', fontWeight: '700' }}>
                  {profile.name || username}
                </h2>
                <p style={{ margin: '0.5rem 0', color: '#6c757d', fontSize: '1.1rem' }}>
                  @{username}
                </p>
                <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
                  <span style={{
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    border: '1px solid #fbbf24',
                    padding: '6px 16px',
                    borderRadius: '16px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <Shield size={16} />
                    ALUMNI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        {(profile.phone || profile.currentLocation) && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Phone size={20} style={{ color: '#10b981' }} />
                <h3 className="card-title">Contact Information</h3>
              </div>
            </div>
            <div className="grid grid-2" style={{ padding: '1rem 0' }}>
              {profile.phone && (
                <div className="d-flex align-items-center gap-3">
                  <div style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '10px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Phone size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Phone Number</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                      {getCountryFlag(profile.countryCode)} {profile.countryCode} {profile.phone}
                    </p>
                  </div>
                </div>
              )}
              
              {profile.currentLocation && (
                <div className="d-flex align-items-center gap-3">
                  <div style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '10px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MapPin size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Current Location</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                      {profile.currentLocation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Academic and Professional Cards */}
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <BookOpen size={20} style={{ color: '#d97706' }} />
                <h3 className="card-title">Academic Background</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  padding: '10px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={18} style={{ color: '#d97706' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Department</p>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                    {profile.department || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  padding: '10px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={18} style={{ color: '#d97706' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Batch</p>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                    {profile.batch || 'Not specified'}
                  </p>
                </div>
              </div>
              {profile.higherEducation && (
                <div className="d-flex align-items-center gap-3">
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    padding: '10px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Award size={18} style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Higher Education</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                      {profile.higherEducation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Briefcase size={20} style={{ color: '#10b981' }} />
                <h3 className="card-title">Professional</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              {profile.profession && (
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '10px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Briefcase size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Current Profession</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                      {profile.profession}
                    </p>
                  </div>
                </div>
              )}
              
              {profile.companyName && (
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '10px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Company</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                      {profile.companyName}
                    </p>
                  </div>
                </div>
              )}

              {profile.designation && (
                <div className="d-flex align-items-center gap-3">
                  <div style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '10px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Target size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Designation</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                      {profile.designation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Card */}
        {profile.address && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={20} style={{ color: '#8b5cf6' }} />
                <h3 className="card-title">Address</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div className="d-flex align-items-start gap-3">
                <div style={{ 
                  backgroundColor: '#f3e8ff', 
                  padding: '10px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Permanent Address</p>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    {profile.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Card */}
        {profile.skills && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Award size={20} style={{ color: '#f59e0b' }} />
                <h3 className="card-title">Skills & Expertise</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div className="d-flex align-items-start gap-3">
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  padding: '10px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Technical Skills</p>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    {profile.skills}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn Profile Card */}
        {profile.linkedin && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Linkedin size={20} style={{ color: '#2563eb' }} />
                <h3 className="card-title">LinkedIn Profile</h3>
              </div>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ 
                  backgroundColor: '#dbeafe', 
                  padding: '10px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Linkedin size={18} style={{ color: '#2563eb' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>Professional Network</p>
                  <a
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {profile.linkedin}
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

export default AlumniProfileView;