import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users, Save, BookOpen, GraduationCap, Camera, Upload, X  } from 'lucide-react';
import axios from 'axios';

const FacultyProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    department: '',
    designation: '',
    researchInterests: '',
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
    const [profileExists, setProfileExists] = useState(false);
     const [imageFile, setImageFile] = useState(null);
   const [imagePreview, setImagePreview] = useState(null);
   const [showImageUpload, setShowImageUpload] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

 const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8082/onboarding/faculty');
      setFormData(response.data);
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setShowImageUpload(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setShowImageUpload(false);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

 try {
    const formDataToSend = new FormData();

    const profileData = {
      name: formData.name,
      username: formData.username,
      department: formData.department,
      designation: formData.designation,
      researchInterests: formData.researchInterests,
   
    };

    formDataToSend.append(
      'data',
      new Blob([JSON.stringify(profileData)], { type: 'application/json' })
    );

    if (imageFile) {
      formDataToSend.append('profileImage', imageFile);
    }

    const method = profileExists ? 'put' : 'post';

    const response = await axios[method](
      'http://localhost:8082/onboarding/faculty',
      formDataToSend
    );

    alert('Profile saved successfully!');
    setFormData(response.data);
    setProfileExists(true);
    setIsEditing(false);
    setImageFile(null);

    if (response.data.profileImage) {
      setImagePreview(`http://localhost:8082${response.data.profileImage}`);
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Error saving profile');
  } finally {
    setLoading(false);
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
  return (
    <div className="fade-in">
      <div className="hero-section">
        <div className="profile-section">
          <div className="profile-image-container">
            <div className="profile-image-wrapper">
              {imagePreview || formData.profileImage ? (
                <img 
                  src={imagePreview || `http://localhost:8082${formData.profileImage}`}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {formData.name ? getInitials(formData.name) : <GraduationCap size={48} />}
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
        <h1 className="hero-title">Faculty Profile</h1>
        <p className="hero-subtitle">Share your academic expertise and research interests</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="card-title">Profile Information</h3>
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
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
              <div className="form-group">
  <label htmlFor="username" className="form-label">Username</label>
  <input
    type="text"
    id="username"
    name="username"
    className="form-control"
    value={formData.username}
    onChange={handleChange}
    required
    placeholder="Enter the registered username"
  />
</div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                className="form-control"
                value={formData.department}
                onChange={handleChange}
                required
                placeholder="e.g., Computer Science"
              />
            </div>

            <div className="form-group">
              <label htmlFor="designation" className="form-label">Designation</label>
              <select
                id="designation"
                name="designation"
                className="form-control form-select"
                value={formData.designation}
                onChange={handleChange}
                required
              >
                <option value="">Select designation</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Dean">Dean</option>
                <option value="Head of Department">Head of Department</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Research Scientist">Research Scientist</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="researchInterests" className="form-label">Research Interests</label>
              <textarea
                id="researchInterests"
                name="researchInterests"
                className="form-control"
                value={formData.researchInterests}
                onChange={handleChange}
                rows="4"
                placeholder="e.g., Machine Learning, Artificial Intelligence, Data Science, Computer Vision"
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
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
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-2">
            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Name</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.name || 'Not provided'}</p>
            </div>
            
            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Department</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.department || 'Not provided'}</p>
            </div>
            
            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Designation</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.designation || 'Not provided'}</p>
            </div>
            
          <div style={{ gridColumn: '1 / -1' }}>
  <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Research Interests</h5>
  {formData.researchInterests ? (
    <ul style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', paddingLeft: '1.2rem' }}>
      {(Array.isArray(formData.researchInterests)
        ? formData.researchInterests
        : formData.researchInterests.split(',')).map((interest, index) => (
          <li key={index}>{interest.trim()}</li>
      ))}
    </ul>
  ) : (
    <p style={{ margin: 0, fontSize: '1.1rem' }}>Not provided</p>
  )}
</div>

          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyProfile;