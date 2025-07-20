import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Eye, EyeOff, Check, X } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    enrollNumber: '',
    department: '',
    classAdvisor: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);
  const [facultySearchTerm, setFacultySearchTerm] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: '',
    checks: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    }
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Department list
  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics and Communication',
    'Electrical and Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'Management Studies'
  ];

  // Fetch faculty list when component mounts
  useEffect(() => {
     const controller = new AbortController();
const fetchFaculty = async () => {
      try {
        const query = facultySearchTerm.trim() ? `?search=${encodeURIComponent(facultySearchTerm)}` : '';

        const response = await fetch(`http://localhost:8081/auth/faculty${query}`, {
          signal: controller.signal
        });

        if (response.ok) {
          const faculty = await response.json();
          setFacultyList(faculty);
        } else {
          console.error('Failed to fetch faculty list');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching faculty:', error);
        }
      }
    };

    // Debounce: wait 300ms after typing stops
    const delayDebounce = setTimeout(() => {
      fetchFaculty();
    }, 300);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort(); // Cancel previous request
    };
  }, [searchQuery]);

  // Filter faculty based on search term
  useEffect(() => {
    if (facultySearchTerm) {
      const filtered = facultyList.filter(faculty =>
        faculty.name.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
        faculty.username.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
        faculty.department.toLowerCase().includes(facultySearchTerm.toLowerCase())
      );
      setFilteredFaculty(filtered);
    } else {
      setFilteredFaculty([]);
    }
  }, [facultySearchTerm, facultyList]);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    let level = '';
    
    if (score <= 2) {
      level = 'weak';
    } else if (score <= 4) {
      level = 'good';
    } else {
      level = 'strong';
    }

    return { score, level, checks };
  };

 const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === 'classAdvisor') {
    setFacultySearchTerm(value);  // Only update what the user sees
    setShowFacultyDropdown(value.trim().length > 0);
    return; // ❗ Don’t update formData.classAdvisor until a faculty is selected
  }

  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

  if (name === 'password') {
    const strength = checkPasswordStrength(value);
    setPasswordStrength(strength);
  }
};

const handleFacultySelect = (faculty) => {
  setFormData(prev => ({
    ...prev,
    classAdvisor: faculty.username  // ✅ Send this to backend
  }));
  setFacultySearchTerm(faculty.name);  // ✅ Display this in input box
  setShowFacultyDropdown(false);
};




  const handleInputFocus = () => {
    setIsTyping(true);
  };

  const handleInputBlur = () => {
  setTimeout(() => setShowFacultyDropdown(false), 150);
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check if password is strong enough
    if (passwordStrength.score < 4) {
      toast.error('Password is too weak. Please create a stronger password.');
      return;
    }

    // Validate enrollment number for students
    if (formData.role === 'STUDENT' && !formData.enrollNumber.trim()) {
      toast.error('Enrollment number is required for students');
      return;
    }

    // Validate department for faculty
    if (formData.role === 'FACULTY' && !formData.department.trim()) {
      toast.error('Department is required for faculty');
      return;
    }

    // Validate department and class advisor for students
    if (formData.role === 'STUDENT') {
      if (!formData.department.trim()) {
        toast.error('Department is required for students');
        return;
      }
      if (!formData.classAdvisor.trim()) {
        toast.error('Class advisor is required for students');
        return;
      }
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      
      // Only include relevant fields based on role
      if (registerData.role !== 'STUDENT') {
        delete registerData.enrollNumber;
        delete registerData.classAdvisor;
      }
      
      if (registerData.role !== 'FACULTY' && registerData.role !== 'STUDENT') {
        delete registerData.department;
      }

      console.log('Register data being sent:', registerData);
      
      const result = await register(registerData);

      console.log('Register result:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Registration successful');
        
        // Check if this is a student registration (pending verification)
        if (formData.role === 'STUDENT' && !result.token) {
          console.log('🎓 STUDENT registration - pending verification');
          // For students, show message and redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        } else if (result.token) {
          // For ALUMNI/FACULTY with token, navigate to dashboard
          console.log(`👤 ${formData.role} registration successful - navigating to dashboard`);
          navigate('/dashboard', { replace: true });
        } else {
          // Fallback - redirect to login
          navigate('/login', { replace: true });
        }
      } else {
        toast.error(result?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength color helper
  const getStrengthColor = (level) => {
    switch (level) {
      case 'weak': return '#ef4444';
      case 'good': return '#f59e0b';
      case 'strong': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStrengthText = (level) => {
    switch (level) {
      case 'weak': return 'Weak';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="text-center mb-6">
          <UserPlus size={48} className="text-primary mb-2" />
          <h2 className="card-title">Create Account</h2>
          <p className="opacity-75">Join the AlumniConnect community</p>
        </div>

        {/* Animated Eyes */}
        <div className={`eyes-container ${isTyping ? 'watching' : ''}`}>
          <div className="eye left-eye">
            <div className="eyeball">
              <div className="pupil"></div>
            </div>
          </div>
          <div className="eye right-eye">
            <div className="eyeball">
              <div className="pupil"></div>
            </div>
          </div>
        </div>

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
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
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
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              id="role"
              name="role"
              className="form-control form-select"
              value={formData.role}
              onChange={handleChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              required
            >
              <option value="STUDENT">STUDENT</option>
              <option value="ALUMNI">ALUMNI</option>
              <option value="FACULTY">FACULTY</option>
            </select>
          </div>

          {/* Department - For Faculty and Students */}
          {(formData.role === 'FACULTY' || formData.role === 'STUDENT') && (
            <div className="form-group">
              <label htmlFor="department" className="form-label">Department</label>
              <select
                id="department"
                name="department"
                className="form-control form-select"
                value={formData.department}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Enrollment Number - Only for Students */}
          {formData.role === 'STUDENT' && (
            <div className="form-group">
              <label htmlFor="enrollNumber" className="form-label">Enrollment Number</label>
              <input
                type="text"
                id="enrollNumber"
                name="enrollNumber"
                className="form-control"
                value={formData.enrollNumber}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="Enter your enrollment number"
              />
            </div>
          )}

          {/* Class Advisor - Only for Students */}
         {formData.role === 'STUDENT' && (
  <div className="form-group">
    <label htmlFor="classAdvisor" className="form-label">Class Advisor</label>
    <div style={{ position: 'relative' }}>
     <input
  type="text"
  id="classAdvisor"
  name="classAdvisor"
  className="form-control"
  value={facultySearchTerm}  // ✅ show full name only
  onChange={handleChange}
  onFocus={handleInputFocus}
  onBlur={handleInputBlur}
  required
  placeholder="Search and select your class advisor"
  autoComplete="off"
/>

      {/* Faculty Dropdown */}
      {showFacultyDropdown && filteredFaculty.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {filteredFaculty.map((faculty, index) => (
           <div
  key={index}
  onMouseDown={() => handleFacultySelect(faculty)} // This fixes the issue
  style={{
    padding: '0.75rem',
    cursor: 'pointer',
    borderBottom: index < filteredFaculty.length - 1 ? '1px solid #f3f4f6' : 'none',
    transition: 'background-color 0.2s'
  }}
  onMouseEnter={(e) => {
    e.target.style.backgroundColor = '#f9fafb';
  }}
  onMouseLeave={(e) => {
    e.target.style.backgroundColor = 'white';
  }}
>
  <div style={{ fontWeight: '600', color: '#1f2937' }}>
    {faculty.name}
  </div>
  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
    @{faculty.username} • {faculty.department}
  </div>
</div>

          ))}
        </div>
      )}
    </div>
  </div>
)}


          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="Create a password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#667eea'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ 
                    flex: 1, 
                    height: '4px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getStrengthColor(passwordStrength.level),
                      transition: 'all 0.3s ease'
                    }}></div>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: getStrengthColor(passwordStrength.level)
                  }}>
                    {getStrengthText(passwordStrength.level)}
                  </span>
                </div>
                
                {/* Password Requirements */}
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {passwordStrength.checks.length ? 
                        <Check size={12} style={{ color: '#10b981' }} /> : 
                        <X size={12} style={{ color: '#ef4444' }} />
                      }
                      <span style={{ color: passwordStrength.checks.length ? '#10b981' : '#ef4444' }}>
                        8+ characters
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {passwordStrength.checks.lowercase ? 
                        <Check size={12} style={{ color: '#10b981' }} /> : 
                        <X size={12} style={{ color: '#ef4444' }} />
                      }
                      <span style={{ color: passwordStrength.checks.lowercase ? '#10b981' : '#ef4444' }}>
                        Lowercase
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {passwordStrength.checks.uppercase ? 
                        <Check size={12} style={{ color: '#10b981' }} /> : 
                        <X size={12} style={{ color: '#ef4444' }} />
                      }
                      <span style={{ color: passwordStrength.checks.uppercase ? '#10b981' : '#ef4444' }}>
                        Uppercase
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {passwordStrength.checks.number ? 
                        <Check size={12} style={{ color: '#10b981' }} /> : 
                        <X size={12} style={{ color: '#ef4444' }} />
                      }
                      <span style={{ color: passwordStrength.checks.number ? '#10b981' : '#ef4444' }}>
                        Number
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', gridColumn: 'span 2' }}>
                      {passwordStrength.checks.special ? 
                        <Check size={12} style={{ color: '#10b981' }} /> : 
                        <X size={12} style={{ color: '#ef4444' }} />
                      }
                      <span style={{ color: passwordStrength.checks.special ? '#10b981' : '#ef4444' }}>
                        Special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="Confirm your password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#667eea'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {formData.password === formData.confirmPassword ? 
                    <Check size={12} style={{ color: '#10b981' }} /> : 
                    <X size={12} style={{ color: '#ef4444' }} />
                  }
                  <span style={{ 
                    color: formData.password === formData.confirmPassword ? '#10b981' : '#ef4444' 
                  }}>
                    {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading || passwordStrength.score < 4}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p>Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;