import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle, 
  Users, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const VerifyStudent = () => {
  const { user } = useAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [verifiedStudents, setVerifiedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch pending students
  const fetchPendingStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/auth/pending-students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Pending students fetched:', data);
        setPendingStudents(data);
      } else {
        console.error('Failed to fetch pending students, status:', response.status);
        toast.error('Failed to fetch pending students');
      }
    } catch (error) {
      console.error('Error fetching pending students:', error);
      toast.error('Error fetching pending students');
    }
  };

  // Fetch verified students
  const fetchVerifiedStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/auth/verified-students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Verified students fetched:', data);
        setVerifiedStudents(data);
      } else {
        console.error('Failed to fetch verified students, status:', response.status);
        toast.error('Failed to fetch verified students');
      }
    } catch (error) {
      console.error('Error fetching verified students:', error);
      toast.error('Error fetching verified students');
    }
  };

  // Verify/Reject student
  const handleVerifyStudent = async (email, isVerified) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/auth/verify-student?email=${email}&isVerified=${isVerified}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const message = await response.text();
        toast.success(message);
        
        // Add a small delay to ensure backend has processed the change
        setTimeout(async () => {
          // Refresh both lists
          await Promise.all([
            fetchPendingStudents(),
            fetchVerifiedStudents()
          ]);
        }, 500);
      } else {
        const errorText = await response.text();
        console.error('Verification failed:', errorText);
        toast.error('Failed to update student status');
      }
    } catch (error) {
      console.error('Error verifying student:', error);
      toast.error('Error updating student status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      setLoading(true);
      Promise.all([
        fetchPendingStudents(),
        fetchVerifiedStudents()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  // Filter students based on search term
  const filterStudents = (students) => {
    return students.filter(student => 
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPendingStudents = filterStudents(pendingStudents);
  const filteredVerifiedStudents = filterStudents(verifiedStudents);

  if (user?.role !== 'FACULTY') {
    return (
      <div className="verification-container">
        <div className="access-denied">
          <UserX size={48} className="access-denied-icon" />
          <h2>Access Denied</h2>
          <p>Only faculty members can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <div className="header-content">
          <div className="header-text">
    <h1 className="text-white text-3xl font-bold flex items-center gap-4">
  <UserCheck size={28} className="text-white bg-white/20 p-1.5 rounded" />
  Student Verification
</h1>




<p className="text-white text-lg opacity-90 mt-2">
  Manage student verification requests
</p>



          </div>
          <button 
            onClick={() => {
              setLoading(true);
              Promise.all([
                fetchPendingStudents(),
                fetchVerifiedStudents()
              ]).finally(() => setLoading(false));
            }}
            className="refresh-btn"
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spinning' : ''} size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="verification-content">
        <div className="verification-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={18} />
            Pending ({pendingStudents.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
            onClick={() => setActiveTab('verified')}
          >
            <CheckCircle size={18} />
            Verified ({verifiedStudents.length})
          </button>
        </div>

        <div className="search-section">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by username, email, or enrollment number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'pending' && (
            <div className="table-container">
              {loading ? (
                <div className="loading-state">
                  <RefreshCw className="spinning" size={32} />
                  <p>Loading students...</p>
                </div>
              ) : filteredPendingStudents.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} className="empty-icon" />
                  <h3>No Pending Students</h3>
                  <p>All students have been verified or no new requests.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Enrollment No.</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingStudents.map((student) => (
                        <tr key={student.email} className="student-row">
                          <td>
                            <div className="student-avatar">
                              {student.username.charAt(0).toUpperCase()}
                            </div>
                          </td>
                          <td>
                            <div className="student-name">{student.username}</div>
                          </td>
                          <td>
                            <div className="student-email">{student.email}</div>
                          </td>
                          <td>
                            <div className="student-enroll">{student.enrollNumber}</div>
                          </td>
                          <td>
                            <span className="student-role">{student.role}</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleVerifyStudent(student.email, true)}
                                className="action-btn verify-btn"
                                title="Verify Student"
                              >
                                <UserCheck size={16} />
                                Verify
                              </button>
                              <button
                                onClick={() => handleVerifyStudent(student.email, false)}
                                className="action-btn reject-btn"
                                title="Reject Student"
                              >
                                <UserX size={16} />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'verified' && (
            <div className="table-container">
              {loading ? (
                <div className="loading-state">
                  <RefreshCw className="spinning" size={32} />
                  <p>Loading students...</p>
                </div>
              ) : filteredVerifiedStudents.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={48} className="empty-icon" />
                  <h3>No Verified Students</h3>
                  <p>No students have been verified yet.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Enrollment No.</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVerifiedStudents.map((student) => (
                        <tr key={student.email} className="student-row verified">
                          <td>
                            <div className="student-avatar verified">
                              {student.username.charAt(0).toUpperCase()}
                            </div>
                          </td>
                          <td>
                            <div className="student-name">{student.username}</div>
                          </td>
                          <td>
                            <div className="student-email">{student.email}</div>
                          </td>
                          <td>
                            <div className="student-enroll">{student.enrollNumber}</div>
                          </td>
                          <td>
                            <span className="student-role">{student.role}</span>
                          </td>
                          <td>
                            <div className="verification-badge">
                              <CheckCircle size={16} />
                              Verified
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyStudent;