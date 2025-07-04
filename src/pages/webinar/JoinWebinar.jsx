import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Users, AlertCircle, ExternalLink } from 'lucide-react';
import { webinarService } from './services/webinarService';
import { useToast } from '../../context/ToastContext';

const JoinWebinar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMeeting, setShowMeeting] = useState(false);

  useEffect(() => {
    fetchWebinarDetails();
  }, [id]);

  const fetchWebinarDetails = async () => {
    try {
      setLoading(true);
      // Search for webinar by ID or get all webinars and find the one with matching ID
      const webinars = await webinarService.getAllWebinars();
      const foundWebinar = webinars.find(w => w.id === id);
      
      if (foundWebinar) {
        setWebinar(foundWebinar);
      } else {
        setError('Webinar not found');
      }
    } catch (error) {
      setError('Failed to load webinar details');
      addToast('Failed to load webinar details', 'error');
    } finally {
      setLoading(false);
    }
  };

 const handleJoinMeeting = () => {
  if (webinar?.link) {
    window.location.href = webinar.link;
  }
};

  const handleBack = () => {
    navigate('/webinar');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading webinar details...</p>
      </div>
    );
  }

  if (error || !webinar) {
    return (
      <div className="error-container">
        <h2>Webinar Not Found</h2>
        <p>The webinar you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleBack} className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="join-webinar-page">
      <div className="page-header">
        <button onClick={handleBack} className="back-btn">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      </div>

      <div className="join-webinar-container">
        <div className="webinar-preview">
          <div className="preview-header">
            <div className="webinar-icon-large">
              <Video size={48} />
            </div>
            <h1 className="webinar-title">{webinar.title}</h1>
            <div className="webinar-meta">
              <div className="meta-item">
                <Users size={16} />
                <span>Hosted by {webinar.hostUsername}</span>
              </div>
            </div>
          </div>

          <div className="join-section">
            <div className="join-info">
              <h3>Ready to join?</h3>
              <p>Click the button below to join the webinar in this tab.</p>
            </div>
            
            <button
              onClick={handleJoinMeeting}
              className="btn btn-primary btn-lg join-btn"
            >
              <Video size={20} />
              Join Webinar Now
            </button>

            <div className="meeting-link">
              <label>Direct Meeting Link:</label>
              <div className="link-container">
                <input
                  type="text"
                  value={webinar.link}
                  readOnly
                  className="link-input"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webinar.link);
                    addToast('Link copied to clipboard!', 'success');
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => window.open(webinar.link, '_blank')}
              className="btn btn-outline"
            >
              <ExternalLink size={16} />
              Open in New Tab
            </button>
          </div>
        </div>
        <div className="join-instructions">
          <div className="instruction-header">
            <AlertCircle size={24} />
            <h3>Important Meeting Instructions</h3>
          </div>
          
          <div className="instruction-section">
            <h4>Before Joining:</h4>
            <ul className="instructions-list">
              <li>No default moderator can be found</li>
              <li>Click "Login directly" and sign with Google</li>
              <li>If you created the meeting, specify your name as "Host" or "Faculty"</li>
              <li>If you're joining as participant, specify only your name</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>How to Join:</h4>
            <ol className="instructions-list">
              <li>Click "Join Webinar Now" button</li>
              <li>Allow camera and microphone permissions if prompted</li>
              <li>Enter your name as instructed above</li>
              <li>You'll be connected to the live webinar</li>
            </ol>
          </div>

          <div className="technical-requirements">
            <h4>Technical Requirements:</h4>
            <ul>
              <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>Stable internet connection</li>
              <li>Camera and microphone (optional)</li>
              <li>No software installation required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinWebinar;