import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'STUDENT',
    department: '',
    enrollNumber: ''
  });

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

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
 useEffect(() => {
  if (user) {
    console.log('✅ useEffect: User is ready, navigating to /dashboard');
    navigate('/dashboard', { replace: true });
  }
}, [user, navigate]);



  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInputFocus = () => setIsTyping(true);
  const handleInputBlur = () => setIsTyping(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Input validation based on role
  if (formData.role === 'STUDENT' && !formData.enrollNumber.trim()) {
    toast.error('Enrollment number is required for students');
    setLoading(false);
    return;
  }

  if (formData.role === 'FACULTY' && !formData.department.trim()) {
    toast.error('Department is required for faculty');
    setLoading(false);
    return;
  }

  // Prepare login payload
  const loginData = {
    email: formData.email,
    password: formData.password,
    role: formData.role,
    
  };

  if (formData.role === 'STUDENT') {
    loginData.enrollNumber = formData.enrollNumber;
  }

  if (formData.role === 'FACULTY') {
    loginData.department = formData.department;
  }

  try {
    const result = await login(loginData);
    if (result && result.success) {
      toast.success(result.message || 'Login successful');
    } else {
      toast.error(result?.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    toast.error('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="text-center mb-6">
          <LogIn size={48} className="text-primary mb-2" />
          <h2 className="card-title">Welcome Back</h2>
          <p className="opacity-75">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="role" className="form-label">Login as</label>
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
          {formData.role === 'FACULTY' && (
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
      <option value="">Select a department</option>
      {departments.map((dept, index) => (
        <option key={index} value={dept}>{dept}</option>
      ))}
    </select>
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
                placeholder="Enter your password"
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
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#667eea', fontWeight: '600' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
