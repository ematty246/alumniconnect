import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/profile/Profile';
import StudentProfile from './pages/profile/StudentProfile';
import AlumniProfile from './pages/profile/AlumniProfile';
import FacultyProfile from './pages/profile/FacultyProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Connections from './pages/connections/Connections';
import PendingRequests from './pages/connections/PendingRequests';
import Chat from './pages/chat/Chat';
import UserSearch from './pages/UserSearch';
import VerifyStudents from './pages/faculty/VerifyStudent';

// Webinar Components
import WebinarDashboard from './pages/webinar/WebinarDashboard';
import CreateWebinar from './pages/webinar/CreateWebinar';
import JoinWebinar from './pages/webinar/JoinWebinar';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import the public profile components
import PublicStudentProfile from './components/profiles/StudentProfile';
import PublicAlumniProfile from './components/profiles/AlumniProfile';
import PublicFacultyProfile from './components/profiles/FacultyProfile';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <Router>
            <div className="app-container">
              <Navbar />
              <main className="main-content">
                <div className="container">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/search" element={<UserSearch />} />

                    <Route path="/admin" element={<AdminDashboard />} />

                    {/* Webinar Routes */}
                    <Route path="/webinar" element={<WebinarDashboard />} />
                    <Route path="/webinar/create" element={
                      <ProtectedRoute>
                        <CreateWebinar />
                      </ProtectedRoute>
                    } />
                    <Route path="/webinar/join/:id" element={<JoinWebinar />} />
                    <Route path="/webinar/meeting/:id" element={<JoinWebinar />} /> 
                  
                    {/* Faculty Student Verification */}
                    <Route path="/verify-students" element={
                      <ProtectedRoute>
                        <VerifyStudents />
                      </ProtectedRoute>
                    } />
                    
                    {/* Public profile routes - no authentication required */}
                    <Route path="/profile/student/public/:username" element={<PublicStudentProfile />} />
                    <Route path="/profile/alumni/public/:username" element={<PublicAlumniProfile />} />
                    <Route path="/profile/faculty/public/:username" element={<PublicFacultyProfile />} />
                    
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile/student" element={
                      <ProtectedRoute>
                        <StudentProfile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile/alumni" element={
                      <ProtectedRoute>
                        <AlumniProfile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile/faculty" element={
                      <ProtectedRoute>
                        <FacultyProfile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/connections" element={
                      <ProtectedRoute>
                        <Connections />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/connections/pending" element={
                      <ProtectedRoute>
                        <PendingRequests />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/chat" element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/chat/:username" element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </div>
              </main>
              
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </Router>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;