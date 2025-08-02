import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  GraduationCap, Save, Upload, X, Camera, FileText, User, Sparkles, 
  Phone, Mail, MapPin, Code, Globe, Award, Briefcase, BookOpen,
  ExternalLink, Calendar, Trophy, Target, Languages, Star, Building
} from 'lucide-react';
import axios from 'axios';

const AlumniProfile = () => {
  const [formData, setFormData] = useState({
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [extractedContent, setExtractedContent] = useState('');
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8082/onboarding/alumni');
      const profileData = { ...response.data };

      setFormData({
        username: profileData.username || ''
      });
      setExtractedContent(profileData.resumeExtractedContent || '');
      setProfileExists(true);
      setIsEditing(false);

      if (response.data.profileImage) {
        setImagePreview(`http://localhost:8082${response.data.profileImage}`);
      }
    } catch (error) {
      console.log('No existing profile found');
      setProfileExists(false);
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setShowImageUpload(false);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Resume size should be less than 10MB');
        return;
      }

      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setShowImageUpload(false);
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeFileName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!resumeFile && !profileExists) {
      toast.error('Please upload your resume');
      return;
    }

    setLoading(true);
    setIsProcessingResume(true);

    try {
      const formDataToSend = new FormData();

      const profileData = {
        username: formData.username.trim()
      };

      formDataToSend.append(
        'data',
        new Blob([JSON.stringify(profileData)], { type: 'application/json' })
      );

      if (resumeFile) {
        formDataToSend.append('resume', resumeFile);
      }

      if (imageFile) {
        formDataToSend.append('profileImage', imageFile);
      }

      const method = profileExists ? 'put' : 'post';
      const response = await axios[method](
        'http://localhost:8082/onboarding/alumni',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('Profile saved successfully!');
      setFormData({
        username: response.data.username || ''
      });
      setExtractedContent(response.data.resumeExtractedContent || '');
      setProfileExists(true);
      setIsEditing(false);
      setImageFile(null);
      setResumeFile(null);
      setResumeFileName('');

      if (response.data.profileImage) {
        setImagePreview(`http://localhost:8082${response.data.profileImage}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error?.response?.data?.message || 'Error saving profile');
    } finally {
      setLoading(false);
      setIsProcessingResume(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
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

  const parsedContent = parseAIContent(extractedContent);

  return (
    <div className="fade-in">
      <div className="hero-section">
        <div className="profile-section">
          <div className="profile-image-container">
            <div className="profile-image-wrapper">
              {imagePreview ? (
                <img 
                  src={imagePreview}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {formData.username ? getInitials(formData.username) : <GraduationCap size={48} />}
                </div>
              )}
              
              {isEditing && (
                <div className="image-upload-overlay">
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(!showImageUpload)}
                    className="image-upload-btn"
                  >
                    <Camera size={20} />
                  </button>
                  
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="image-remove-btn"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {showImageUpload && isEditing && (
              <div className="image-upload-panel">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
                  id="profile-image-input"
                />
                <label htmlFor="profile-image-input" className="image-upload-label">
                  <Upload size={18} />
                  Choose Photo
                </label>
              </div>
            )}
          </div>
        </div>
        <h1 className="hero-title">Alumni Profile</h1>
        <p className="hero-subtitle">Share your professional journey through your resume</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="card-title">
              <User size={24} />
              Profile Information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="alumni-form-grid">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  <User size={18} />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-control"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group resume-upload-section">
                <label className="form-label">
                  <FileText size={18} />
                  Resume Upload
                </label>
                <div className="resume-upload-container">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeChange}
                    className="resume-input"
                    id="resume-input"
                  />
                  <label htmlFor="resume-input" className="resume-upload-label">
                    <Upload size={20} />
                    {resumeFileName ? 'Change Resume' : 'Upload Resume (PDF)'}
                  </label>
                  
                  {resumeFileName && (
                    <div className="resume-file-indicator">
                      <div className="resume-file-info">
                        <FileText size={16} />
                        <span>{resumeFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeResume}
                        className="remove-resume-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-hint">
                  <Sparkles size={14} />
                  Your resume will be automatically processed by AI to extract relevant information
                </div>
              </div>
            </div>

            {isProcessingResume && (
              <div className="processing-indicator">
                <div className="processing-content">
                  <div className="processing-spinner"></div>
                  <div className="processing-text">
                    <Sparkles size={16} />
                    AI is processing your resume...
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                ) : (
                  <>
                    <Save size={18} />
                    Save Profile
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-basic-info">
              <div className="info-item">
                <h5>
                  <User size={18} />
                  Username
                </h5>
                <p>{formData.username || 'Not provided'}</p>
              </div>
            </div>

            {extractedContent && parsedContent && (
              <div className="extracted-content-section">
                <div className="content-header">
                  <h5>
                    <Sparkles size={18} />
                    AI Extracted Profile Information
                  </h5>
                  <div className="ai-badge">
                    <Sparkles size={14} />
                    Powered by AI
                  </div>
                </div>
                {renderParsedContent(parsedContent)}
              </div>
            )}

            {!extractedContent && profileExists && (
              <div className="no-content-message">
                <FileText size={48} />
                <h4>No Resume Data</h4>
                <p>Upload your resume to automatically extract and display your professional information.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniProfile;