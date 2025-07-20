import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, CheckCircle, XCircle, Clock, Mail, Hash, User, Shield } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [verifiedStudents, setVerifiedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [verifyingStudent, setVerifyingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [pendingResponse, verifiedResponse] = await Promise.all([
        axios.get('http://localhost:8081/auth/pending-students'),
        axios.get('http://localhost:8081/auth/verified-students')
      ]);
      
      setPendingStudents(pendingResponse.data);
      setVerifiedStudents(verifiedResponse.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudent = async (email, isVerified) => {
    try {
      setVerifyingStudent(email);
      
      const response = await axios.post(
        `http://localhost:8081/auth/verify-student?email=${encodeURIComponent(email)}&isVerified=${isVerified}`
      );
      
      toast.success(response.data);
      
      // Refresh the lists
      await fetchStudents();
      
    } catch (error) {
      console.error('Error verifying student:', error);
      toast.error(error.response?.data || 'Failed to verify student');
    } finally {
      setVerifyingStudent(null);
    }
  };

  const StudentCard = ({ student, isPending = true }) => (
    <div className="student-card">
      <div className="student-header">
        <div className="student-avatar">
          <User size={24} />
        </div>
        <div className="student-info">
          <h3 className="student-name">{student.username}</h3>
          <div className="student-details">
            <div className="detail-item">
              <Mail size={16} />
              <span>{student.email}</span>
            </div>
            <div className="detail-item">
              <Hash size={16} />
              <span>{student.enrollNumber}</span>
            </div>
          </div>
        </div>
        {!isPending && (
          <div className="verified-badge">
            <CheckCircle size={20} />
            <span>Verified</span>
          </div>
        )}
      </div>
      
      {isPending && (
        <div className="student-actions">
          <button
            className="btn btn-success"
            onClick={() => handleVerifyStudent(student.email, true)}
            disabled={verifyingStudent === student.email}
          >
            {verifyingStudent === student.email ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            ) : (
              <>
                <CheckCircle size={16} />
                Approve
              </>
            )}
          </button>
          <button
            className="btn btn-error"
            onClick={() => handleVerifyStudent(student.email, false)}
            disabled={verifyingStudent === student.email}
          >
            {verifyingStudent === student.email ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            ) : (
              <>
                <XCircle size={16} />
                Reject
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <Shield size={32} className="header-icon" />
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage student registrations and verifications</p>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{pendingStudents.length}</h3>
            <p>Pending Verification</p>
          </div>
        </div>
        <div className="stat-card verified">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{verifiedStudents.length}</h3>
            <p>Verified Students</p>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{pendingStudents.length + verifiedStudents.length}</h3>
            <p>Total Students</p>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} />
          Pending ({pendingStudents.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          <CheckCircle size={18} />
          Verified ({verifiedStudents.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'pending' ? (
          <div className="students-section">
            <div className="section-header">
              <h2>Pending Verification</h2>
              <p>Students waiting for approval</p>
            </div>
            {pendingStudents.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <h3>No Pending Students</h3>
                <p>All student registrations have been processed</p>
              </div>
            ) : (
              <div className="students-grid">
                {pendingStudents.map((student, index) => (
                  <StudentCard key={index} student={student} isPending={true} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="students-section">
            <div className="section-header">
              <h2>Verified Students</h2>
              <p>Students with approved registrations</p>
            </div>
            {verifiedStudents.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} />
                <h3>No Verified Students</h3>
                <p>No students have been verified yet</p>
              </div>
            ) : (
              <div className="students-grid">
                {verifiedStudents.map((student, index) => (
                  <StudentCard key={index} student={student} isPending={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;