import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, Calendar, Users, Globe, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { webinarService } from './services/webinarService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const CreateWebinar = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  
const [startTime, setStartTime] = useState("");
const [endTime, setEndTime] = useState("");
const [timeSlot, setTimeSlot] = useState(""); // used to send in request
  const [loading, setLoading] = useState(false);
  const [createdWebinar, setCreatedWebinar] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      addToast('Please sign in to create webinars', 'error');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      addToast('Please enter a webinar title', 'error');
      return;
    }

    if (!link.trim()) {
      addToast('Please enter a webinar link', 'error');
      return;
    }

    if (!scheduledDate) {
      addToast('Please select a date', 'error');
      return;
    }

    if (!timeSlot) {
      addToast('Please select a time slot', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const webinarData = {
        title: title.trim(),
        description: description.trim(),
        link: link.trim(),
        scheduledDate: scheduledDate,
        timeSlot: timeSlot
      };

      // Call backend API directly
      const response = await fetch('http://localhost:8086/webinar/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(webinarData)
      });

      if (response.ok) {
        setCreatedWebinar({
          title: title.trim(),
          link: link.trim(),
          scheduledDate: scheduledDate,
          timeSlot: timeSlot
        });
        
        addToast('Webinar created successfully!', 'success');
      } else {
        throw new Error('Failed to create webinar');
      }
    } catch (error) {
      console.error('Error creating webinar:', error);
      addToast(error.message || 'Failed to create webinar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/webinar');
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push(`${startTime}-${endTime}`);
    }
    return slots;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e) => {
    const inputDate = e.target.value;
    if (inputDate) {
      const [year, month, day] = inputDate.split('-');
      setScheduledDate(`${day}-${month}-${year}`);
    } else {
      setScheduledDate('');
    }
  };

  if (createdWebinar) {
    return (
      <div className="create-webinar-page">
        <div className="page-header">
          <button onClick={handleBack} className="back-btn">
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="page-title">Webinar Created Successfully!</h1>
          <p className="page-subtitle">
            Your webinar is scheduled and ready to go
          </p>
        </div>

        <div className="create-webinar-container">
          <div className="webinar-form-section">
            <div className="webinar-details">
              <h3 className="info-title">Webinar Details</h3>
              <div className="detail-item">
                <strong>Title:</strong> {createdWebinar.title}
              </div>
              <div className="detail-item">
                <strong>Date:</strong> {createdWebinar.scheduledDate}
              </div>
              <div className="detail-item">
                <strong>Time:</strong> {createdWebinar.timeSlot}
              </div>
              <div className="detail-item">
                <strong>Link:</strong> 
                <div className="link-container">
                  <a 
                    href={createdWebinar.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="webinar-link"
                  >
                    {createdWebinar.link}
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>

            <div className="success-actions">
              <button
                onClick={handleBack}
                className="btn btn-primary btn-lg"
              >
                <Video size={20} />
                Go to Dashboard
              </button>
              <button
                onClick={() => window.open(createdWebinar.link, '_blank')}
                className="btn btn-outline btn-lg"
              >
                <ExternalLink size={20} />
                Test Meeting Link
              </button>
            </div>
          </div>

          <div className="webinar-info-section">
            <div className="meeting-instructions">
              <div className="instruction-header">
                <AlertCircle size={20} />
                <h4>Next Steps</h4>
              </div>
              <div className="instruction-content">
                <ul>
                  <li>Share the webinar link with your participants</li>
                  <li>Test your meeting link before the scheduled time</li>
                  <li>Join 5-10 minutes early to set up</li>
                  <li>Prepare your presentation materials</li>
                  <li>Check your internet connection and audio/video setup</li>
                </ul>
              </div>
            </div>

            <div className="feature-highlights">
              <h4 className="highlights-title">Webinar Features:</h4>
              <ul className="highlights-list">
                <li>HD Video & Audio</li>
                <li>Screen Sharing</li>
                <li>Chat Functionality</li>
                <li>Recording Options</li>
                <li>Participant Management</li>
                <li>Real-time Interaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-webinar-page">
      <div className="page-header">
        <button onClick={handleBack} className="back-btn">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="page-title">Create New Webinar</h1>
        <p className="page-subtitle">
          Schedule your webinar with a custom meeting link
        </p>
      </div>

      <div className="create-webinar-container">
        <div className="webinar-form-section">
          <form onSubmit={handleSubmit} className="webinar-form">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                <Video size={16} />
                Webinar Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your webinar title"
                className="form-control"
                maxLength={100}
                required
              />
              <div className="form-hint">
                Make it descriptive and engaging (Max 100 characters)
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your webinar is about..."
                className="form-control"
                rows={4}
                maxLength={500}
              />
              <div className="form-hint">
                Help participants understand what to expect (Max 500 characters)
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="link" className="form-label">
                <Globe size={16} />
                Meeting Link *
              </label>
              <input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/xyz-abc-def or https://zoom.us/j/123456789"
                className="form-control"
                required
              />
              <div className="form-hint">
                Provide your Google Meet, Zoom, or other video conferencing link
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="scheduledDate" className="form-label">
                <Calendar size={16} />
                Scheduled Date *
              </label>
              <input
                id="scheduledDate"
                type="date"
                value={formatDateForInput(scheduledDate)}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="form-control"
                required
              />
              <div className="form-hint">
                Select the date for your webinar
              </div>
            </div>

          <div className="form-group">
  <label htmlFor="timeSlot" className="form-label">
    <Clock size={16} />
    Time Slot *
  </label>
  <input
    type="text"
    id="timeSlot"
    value={timeSlot}
    onChange={(e) => setTimeSlot(e.target.value)}
    className="form-control"
    placeholder="e.g. 14:00-15:30"
    pattern="^\d{2}:\d{2}-\d{2}:\d{2}$"
    required
  />
  <div className="form-hint">
    Enter a custom time slot in HH:mm-HH:mm format (e.g. 14:00-15:30)
  </div>
</div>



            <div className="form-actions">
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !title.trim() || !link.trim() || !scheduledDate || !timeSlot}
              >
                {loading ? (
                  <>
                    <div className="spinner-sm"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Video size={16} />
                    Create Webinar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="webinar-info-section">
          <div className="info-card">
            <h3 className="info-title">What happens next?</h3>
            <div className="info-steps">
              <div className="info-step">
                <div className="step-icon">
                  <Globe size={20} />
                </div>
                <div className="step-content">
                  <h4>Custom Meeting Link</h4>
                  <p>Use your preferred video conferencing platform</p>
                </div>
              </div>
              
              <div className="info-step">
                <div className="step-icon">
                  <Users size={20} />
                </div>
                <div className="step-content">
                  <h4>Share & Invite</h4>
                  <p>Share your webinar details with participants</p>
                </div>
              </div>
              
              <div className="info-step">
                <div className="step-icon">
                  <Calendar size={20} />
                </div>
                <div className="step-content">
                  <h4>Scheduled Start</h4>
                  <p>Your webinar will start at the scheduled time</p>
                </div>
              </div>

              <div className="info-step">
                <div className="step-icon">
                  <Clock size={20} />
                </div>
                <div className="step-content">
                  <h4>Live Countdown</h4>
                  <p>Track time remaining on the dashboard</p>
                </div>
              </div>
            </div>
          </div>

          <div className="meeting-instructions">
            <div className="instruction-header">
              <AlertCircle size={20} />
              <h4>Important Setup Instructions</h4>
            </div>
            <div className="instruction-content">
              <p><strong>For Meeting Links:</strong></p>
              <ul>
                <li>Google Meet: Create a meeting and copy the link</li>
                <li>Zoom: Schedule a meeting and copy the join URL</li>
                <li>Microsoft Teams: Create a meeting and get the join link</li>
                <li>Any other platform: Ensure the link is publicly accessible</li>
              </ul>
              
              <p><strong>Before Your Webinar:</strong></p>
              <ul>
                <li>Test your meeting link in advance</li>
                <li>Prepare your presentation materials</li>
                <li>Check audio and video quality</li>
                <li>Share the details with participants</li>
              </ul>
            </div>
          </div>

          <div className="feature-highlights">
            <h4 className="highlights-title">Webinar Management:</h4>
            <ul className="highlights-list">
              <li>Live Countdown Timer</li>
              <li>Custom Meeting Links</li>
              <li>Scheduled Start Times</li>
              <li>Participant Tracking</li>
              <li>Easy Link Sharing</li>
              <li>Real-time Status Updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWebinar;