import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Briefcase, Save, Linkedin, GraduationCap, Camera, Upload, X, Phone, MapPin, Building, Award, User } from 'lucide-react';
import axios from 'axios';

const AlumniProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    department: '',
    batch: '',
    profession: '',
    linkedin: '',
    phone: '',
    countryCode: '+91',
    address: '',
    currentLocation: '',
    higherEducation: '',
    companyName: '',
    designation: '',
    skills: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [currentLocationSuggestions, setCurrentLocationSuggestions] = useState([]);
  const [showCurrentLocationSuggestions, setShowCurrentLocationSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const navigate = useNavigate();

  const countryCodes = [
    { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
    { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
    { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
    { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
    { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
    { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
    { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
    { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
    { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
    { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
    { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
    { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

 const fetchProfile = async () => {
  try {
    const response = await axios.get('http://localhost:8082/onboarding/alumni');
    const profileData = { ...response.data };

    if (profileData.phone) {
      const parts = profileData.phone.split('-');

      // Filter valid numeric segments (ignore any leading accidental dashes or duplicates)
      const digits = parts.filter(p => /^\+?\d+$/.test(p));

      // If valid segments, set countryCode and phone
      if (digits.length === 2) {
        profileData.countryCode = digits[0].startsWith('+') ? digits[0] : `+${digits[0]}`;
        profileData.phone = digits[1];
      } else {
        profileData.countryCode = '+91';
        profileData.phone = '';
      }
    } else {
      profileData.countryCode = '+91';
      profileData.phone = '';
    }

    setFormData(profileData);
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

  let newValue = value;

  if (name === 'phone') {
    newValue = value.replace(/[^\d]/g, ''); // Only digits
  }

  setFormData((prev) => ({
    ...prev,
    [name]: newValue
  }));
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

  const searchAddresses = async (query, isCurrentLocation = false) => {
    if (query.length < 3) {
      if (isCurrentLocation) {
        setCurrentLocationSuggestions([]);
        setShowCurrentLocationSuggestions(false);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
      return;
    }

    try {
      const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          q: query,
          key: '5e877e64a6774861b6b4a7af80ea4feb', // Replace with your actual API key
          limit: 5,
          no_annotations: 1
        }
      });

      const suggestions = response.data.results.map(result => ({
        formatted: result.formatted,
        components: result.components
      }));

      if (isCurrentLocation) {
        setCurrentLocationSuggestions(suggestions);
        setShowCurrentLocationSuggestions(true);
      } else {
        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, address: value });
    searchAddresses(value, false);
  };

  const handleCurrentLocationChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, currentLocation: value });
    searchAddresses(value, true);
  };

  const selectAddress = (address) => {
    setFormData({ ...formData, address: address.formatted });
    setShowAddressSuggestions(false);
  };

  const selectCurrentLocation = (location) => {
    setFormData({ ...formData, currentLocation: location.formatted });
    setShowCurrentLocationSuggestions(false);
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
              params: {
                q: `${latitude},${longitude}`,
                key: '5e877e64a6774861b6b4a7af80ea4feb', // Replace with your actual API key
                no_annotations: 1
              }
            });

            if (response.data.results.length > 0) {
              setFormData({ 
                ...formData, 
                currentLocation: response.data.results[0].formatted 
              });
            }
          } catch (error) {
            console.error('Error getting location:', error);
            toast.error('Error getting current location');
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get current location');
          setGettingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setGettingLocation(false);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const formDataToSend = new FormData();

    // ✅ Clean phone number
    const rawPhone = formData.phone || '';
    let cleanedPhone = rawPhone.trim();
    const countryCodeDigits = formData.countryCode.replace('+', '');
    cleanedPhone = cleanedPhone.replace(new RegExp(`^\\+?${countryCodeDigits}-?`), '');

    const profileData = {
      name: formData.name,
      username: formData.username,
      department: formData.department,
      batch: formData.batch,
      profession: formData.profession,
      linkedin: formData.linkedin,
      phone:
        cleanedPhone && formData.countryCode
          ? `${formData.countryCode}-${cleanedPhone}`
          : '',
      address: formData.address,
      currentLocation: formData.currentLocation,
      higherEducation: formData.higherEducation,
      companyName: formData.companyName,
      designation: formData.designation,
      skills: formData.skills
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
      'http://localhost:8082/onboarding/alumni',
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
    alert(error?.response?.data?.message || 'Error saving profile');
  } finally {
    setLoading(false);
  }
};




  const generateBatchOptions = (startYear, endYear) => {
    const options = [];
    for (let year = startYear; year <= endYear; year++) {
      options.push(`${year}-${year + 4}`);
    }
    return options;
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
        <h1 className="hero-title">Alumni Profile</h1>
        <p className="hero-subtitle">Share your professional journey and achievements</p>
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
            <div className="grid grid-2">
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
                <label htmlFor="batch" className="form-label">Batch</label>
                <select
                  id="batch"
                  name="batch"
                  className="form-control"
                  value={formData.batch}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your batch</option>
                  {generateBatchOptions(1999, new Date().getFullYear() - 4).map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <div className="d-flex gap-2">
                  <select
                    name="countryCode"
                    className="form-control"
                    value={formData.countryCode}
                    onChange={handleChange}
                    style={{ width: '120px' }}
                  >
                    {countryCodes.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profession" className="form-label">Current Profession</label>
                <input
                  type="text"
                  id="profession"
                  name="profession"
                  className="form-control"
                  value={formData.profession}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Software Engineer at Google"
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="address" className="form-label">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleAddressChange}
                  placeholder="Start typing your address..."
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectAddress(suggestion)}
                      >
                        {suggestion.formatted}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="currentLocation" className="form-label">Current Location</label>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    id="currentLocation"
                    name="currentLocation"
                    className="form-control"
                    value={formData.currentLocation}
                    onChange={handleCurrentLocationChange}
                    placeholder="Type location or use GPS"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="btn btn-outline"
                    disabled={gettingLocation}
                    style={{ minWidth: '120px' }}
                  >
                    {gettingLocation ? (
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    ) : (
                      <>
                        <MapPin size={16} />
                        Use GPS
                      </>
                    )}
                  </button>
                </div>
                {showCurrentLocationSuggestions && currentLocationSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {currentLocationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectCurrentLocation(suggestion)}
                      >
                        {suggestion.formatted}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="higherEducation" className="form-label">Higher Education</label>
                <input
                  type="text"
                  id="higherEducation"
                  name="higherEducation"
                  className="form-control"
                  value={formData.higherEducation}
                  onChange={handleChange}
                  placeholder="e.g., M.Sc. in Embedded Systems - TU Munich"
                />
              </div>

              <div className="form-group">
              <label htmlFor="designation" className="form-label">Designation</label>
                <input
                  type="text"
                id="designation"
                name="designation"
                  className="form-control"
                value={formData.designation}
                  onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="form-group">
              <label htmlFor="skills" className="form-label">Skills</label>
              <textarea
                id="skills"
                name="skills"
                className="form-control"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js, Python, Machine Learning"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkedin" className="form-label">LinkedIn Profile</label>
                <input
                type="url"
                id="linkedin"
                name="linkedin"
                  className="form-control"
                value={formData.linkedin}
                  onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
          </div>


            <div className="form-group">
              <label htmlFor="companyName" className="form-label">Company Name</label>
              <textarea
                type="text"
                id="companyName"
                name="companyName"
                className="form-control"
                value={formData.companyName}
                onChange={handleChange}
     
                placeholder="e.g., Google, Microsoft"
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
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Batch</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.batch || 'Not provided'}</p>
            </div>

            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Phone</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
               {formData.phone
  ? `${formData.countryCode || '+91'}-${formData.phone}`
  : 'Not provided'}

              </p>
            </div>

            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Current Location</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.currentLocation || 'Not provided'}</p>
            </div>

            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Higher Education</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                {formData.higherEducation || 'Not provided'}
              </p>
            </div>

            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Company</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.companyName || 'Not provided'}</p>
            </div>

            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Designation</h5>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{formData.designation || 'Not provided'}</p>
            </div>
            
            <div>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>LinkedIn</h5>
              {formData.linkedin ? (
                <a 
                  href={formData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#667eea', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Linkedin size={18} />
                  View Profile
                </a>
              ) : (
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Not provided</p>
              )}
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Address</h5>
              <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6' }}>
                {formData.address || 'Not provided'}
              </p>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Current Profession</h5>
              <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6' }}>
                {formData.profession || 'Not provided'}
              </p>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <h5 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Skills</h5>
              <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6' }}>
                {formData.skills || 'Not provided'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniProfile;