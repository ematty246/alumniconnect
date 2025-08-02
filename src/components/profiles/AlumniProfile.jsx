import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Shield, BookOpen, Calendar, Briefcase, User, Phone, MapPin, 
  Building, Award, Target, Sparkles, FileText, Code, ExternalLink, Mail,
  Trophy, Languages, Star
} from 'lucide-react';
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

  const cleanContent = (content) => {
    if (!content) return '';
    // Remove ** markers and clean up the content
    return content.replace(/\*\*/g, '').trim();
  };

  const parseAIContent = (content) => {
    if (!content) return null;

    const sections = {};
    const lines = content.split('\n').filter(line => line.trim());
    let currentSection = null;
    let currentContent = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip introductory lines
      if (trimmedLine.toLowerCase().startsWith('here\'s') || 
          trimmedLine.toLowerCase().startsWith('information from') ||
          trimmedLine.toLowerCase().startsWith('breakdown of')) {
        return;
      }

      // Check if it's a section header - clean ** markers
      if ((trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) || 
          (trimmedLine.endsWith(':') && !trimmedLine.startsWith('*') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('•'))) {
        
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent;
        }
        
        // Start new section - remove ** markers
        currentSection = cleanContent(trimmedLine.replace(':', ''));
        currentContent = [];
      }
      // Check if it's a bullet point or list item
      else if ((trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) && currentSection) {
        const item = cleanContent(trimmedLine.replace(/^\*\s*/, '').replace(/^-\s*/, '').replace(/^•\s*/, ''));
        if (item) {
          currentContent.push(item);
        }
      }
      // Check if it's regular content
      else if (trimmedLine && currentSection) {
        currentContent.push(cleanContent(trimmedLine));
      }
    });

    // Add the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent;
    }

    return sections;
  };

  const getSectionIcon = (sectionName) => {
    const lowerName = sectionName.toLowerCase();
    
    // Contact related
    if (/contact|phone|email|mobile/.test(lowerName)) return <Phone size={20} />;
    
    // Summary/About related
    if (/summary|objective|about|profile/.test(lowerName)) return <Target size={20} />;
    
    // Skills related
    if (/skill|technical|technology|tool|framework/.test(lowerName)) return <Code size={20} />;
    
    // Education related
    if (/education|academic|qualification|degree|school|college|university/.test(lowerName)) return <BookOpen size={20} />;
    
    // Experience related
    if (/experience|work|employment|job|career/.test(lowerName)) return <Briefcase size={20} />;
    
    // Projects related
    if (/project/.test(lowerName)) return <Building size={20} />;
    
    // Certificates related
    if (/certificate|certification|course|training/.test(lowerName)) return <Award size={20} />;
    
    // Achievements related
    if (/achievement|award|honor|recognition/.test(lowerName)) return <Trophy size={20} />;
    
    // Languages related
    if (/language/.test(lowerName)) return <Languages size={20} />;
    
    // Social/Links related
    if (/link|social|github|linkedin|portfolio|website/.test(lowerName)) return <ExternalLink size={20} />;
    
    // Internships related
    if (/internship|intern/.test(lowerName)) return <Calendar size={20} />;
    
    // Location related
    if (/location|address|place/.test(lowerName)) return <MapPin size={20} />;
    
    return <Star size={20} />;
  };

  const getSectionGradient = (index) => {
    const gradients = [
      'var(--primary-gradient)',
      'var(--accent-gradient)',
      'var(--success-gradient)',
      'var(--secondary-gradient)',
      'var(--warning-gradient)',
      'var(--dark-gradient)'
    ];
    return gradients[index % gradients.length];
  };

  const renderContentItem = (item, itemIndex) => {
    // Check for URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(item)) {
      return (
        <div key={itemIndex} className="content-item link-item">
          {item.split(urlRegex).map((part, partIndex) => {
            if (urlRegex.test(part)) {
              return (
                <a 
                  key={partIndex} 
                  href={part} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="content-link"
                >
                  {part}
                  <ExternalLink size={14} />
                </a>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    }

    // Check for email
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    if (emailRegex.test(item)) {
      return (
        <div key={itemIndex} className="content-item contact-item">
          <Mail size={16} />
          {item.split(emailRegex).map((part, partIndex) => {
            if (emailRegex.test(part)) {
              return (
                <a key={partIndex} href={`mailto:${part}`} className="content-link">
                  {part}
                </a>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    }

    // Check for phone numbers
    if (/\+?\d{10,}/.test(item) && (/phone|mobile|contact/.test(item.toLowerCase()) || item.startsWith('+'))) {
      return (
        <div key={itemIndex} className="content-item contact-item">
          <Phone size={16} />
          <span>{item}</span>
        </div>
      );
    }

    // Check for detailed items with descriptions - clean ** markers
    if (item.includes(':') && item.split(':').length === 2) {
      const parts = item.split(':');
      return (
        <div key={itemIndex} className="content-item detailed-item">
          <div className="item-title">{cleanContent(parts[0])}</div>
          <div className="item-description">{cleanContent(parts[1])}</div>
        </div>
      );
    }

    return (
      <div key={itemIndex} className="content-item">
        <div className="item-bullet"></div>
        <span>{cleanContent(item)}</span>
      </div>
    );
  };

  const renderParsedContent = (parsedData) => {
    if (!parsedData || Object.keys(parsedData).length === 0) {
      return null;
    }

    return (
      <div className="parsed-content-grid">
        {Object.entries(parsedData).map(([sectionName, items], index) => (
          <div key={index} className="content-section" style={{'--section-gradient': getSectionGradient(index)}}>
            <div className="section-header">
              <div className="section-icon">
                {getSectionIcon(sectionName)}
              </div>
              <h4>{sectionName}</h4>
            </div>
            <div className="section-content">
              {items.map((item, itemIndex) => renderContentItem(item, itemIndex))}
            </div>
          </div>
        ))}
      </div>
    );
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

  const parsedContent = parseAIContent(profile.resumeExtractedContent);

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
                      alt={`${profile.username}'s profile`}
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
                  {profile.username}
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

        {/* AI Extracted Resume Content */}
        {profile.resumeExtractedContent && parsedContent && (
          <div className="card">
            <div className="card-header">
              <div className="content-header">
                <h3 className="card-title">
                  <Sparkles size={24} />
                  AI Extracted Profile Information
                </h3>
                <div className="ai-badge">
                  <Sparkles size={14} />
                  Powered by AI
                </div>
              </div>
            </div>
            <div className="extracted-content-section">
              {renderParsedContent(parsedContent)}
            </div>
          </div>
        )}

        {/* No Resume Data Message */}
        {!profile.resumeExtractedContent && (
          <div className="card">
            <div className="no-content-message">
              <FileText size={48} />
              <h4>No Resume Data Available</h4>
              <p>This alumni hasn't uploaded their resume yet or the resume data is being processed.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniProfileView;