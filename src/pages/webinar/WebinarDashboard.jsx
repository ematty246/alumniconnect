import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Video, Users, Calendar, ExternalLink, Plus, AlertCircle, Clock } from 'lucide-react';
import { webinarService } from './services/webinarService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from "react-router-dom";

const WebinarDashboard = () => {
  const [webinars, setWebinars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWebinars();
  }, []);

  // Countdown effect for all webinars
  useEffect(() => {
    const intervals = {};
    
    webinars.forEach(webinar => {
      if (webinar.id) {
        const fetchCountdown = async () => {
          try {
            const response = await fetch(`http://localhost:8086/webinar/countdown/${webinar.id}`);
            if (response.ok) {
              const countdownData = await response.json();
              setCountdowns(prev => ({
                ...prev,
                [webinar.id]: {
                  hours: countdownData.hours || 0,
                  minutes: countdownData.minutes || 0,
                  seconds: countdownData.seconds || 0,
                  status: countdownData.status || 'Unknown'
                }
              }));
            } else {
              console.error(`Error fetching countdown for webinar ${webinar.id}:`, response.status);
              // Set default values on error
              setCountdowns(prev => ({
                ...prev,
                [webinar.id]: {
                  hours: 0,
                  minutes: 0,
                  seconds: 0,
                  status: 'Unknown'
                }
              }));
            }
          } catch (error) {
            console.error(`Error fetching countdown for webinar ${webinar.id}:`, error);
            // Set default values on error
            setCountdowns(prev => ({
              ...prev,
              [webinar.id]: {
                hours: 0,
                minutes: 0,
                seconds: 0,
                status: 'Unknown'
              }
            }));
          }
        };

        // Fetch immediately
        fetchCountdown();
        
        // Set up interval to fetch every second
        intervals[webinar.id] = setInterval(fetchCountdown, 1000);
      }
    });

    // Cleanup function
    return () => {
      Object.values(intervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
    };
  }, [webinars]);

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const data = await webinarService.getAllWebinars();
      console.log('Fetched webinars:', data);
      setWebinars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      addToast(error.message, 'error');
      setWebinars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      fetchWebinars();
      return;
    }

    try {
      setLoading(true);
      const data = await webinarService.searchWebinars(query);
      console.log('Search results:', data);
      setWebinars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching webinars:', error);
      addToast(error.message, 'error');
      setWebinars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWebinar = (webinar) => {
    const link = webinar?.link || webinar?.videoLink || webinar?.meetingLink || webinar?.url || webinar?.jitsiLink;
    if (link) {
      window.open(link, '_blank');
    } else {
      addToast('Meeting link not available', 'error');
    }
  };

  const formatCountdownTime = (time) => {
    return time ? time.toString().padStart(2, '0') : '00';
  };

  const getWebinarStatus = (webinarId) => {
    const countdown = countdowns[webinarId];
    if (!countdown) return 'Loading...';

    switch (countdown.status) {
      case 'Upcoming':
        return 'Upcoming';
      case 'Ongoing':
        return 'Live';
      case 'Ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  const isWebinarLive = (webinarId) => {
    const countdown = countdowns[webinarId];
    return countdown && countdown.status === 'Ongoing';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Ongoing':
        return 'status-live';
      case 'Upcoming':
        return 'status-upcoming';
      case 'Ended':
        return 'status-ended';
      default:
        return 'status-unknown';
    }
  };

  const getJoinButtonClass = (status) => {
    switch (status) {
      case 'Ongoing':
        return 'btn btn-sm btn-success';
      case 'Ended':
        return 'btn btn-sm btn-disabled';
      default:
        return 'btn btn-sm btn-primary';
    }
  };

  const getJoinButtonText = (status) => {
    switch (status) {
      case 'Ongoing':
        return 'Join Live Now';
      case 'Ended':
        return 'Ended';
      default:
        return 'Join Meeting';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading webinars...</p>
      </div>
    );
  }

  return (
    <div className="webinar-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Webinar Dashboard</h1>
          <p className="dashboard-subtitle">
            Discover and join live webinars or create your own
          </p>
        </div>
        <div className="header-actions">
          {user && (
            <Link to="/webinar/create" className="btn btn-primary">
              <Plus size={20} />
              Create Webinar
            </Link>
          )}
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search webinars by title..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="webinar-grid">
        {webinars.length === 0 ? (
          <div className="empty-state">
            <Video size={64} className="empty-icon" />
            <h3 className="empty-title">No Webinars Found</h3>
            <p className="empty-description">
              {searchQuery
                ? `No webinars match "${searchQuery}". Try a different search term.`
                : 'No webinars are currently available. Be the first to create one!'}
            </p>
            {user && (
              <Link to="/webinar/create" className="btn btn-primary">
                <Plus size={20} />
                Create First Webinar
              </Link>
            )}
          </div>
        ) : (
          webinars.map((webinar) => {
            const link = webinar?.link || webinar?.videoLink || webinar?.meetingLink || webinar?.url || webinar?.jitsiLink;
            const countdown = countdowns[webinar.id];
            const webinarStatus = countdown ? countdown.status : 'Unknown';
            const isLive = isWebinarLive(webinar.id);

            return (
              <div key={webinar.id} className="webinar-card">
                <div className="webinar-header">
                  <div className="webinar-icon">
                    <Video size={24} />
                  </div>
                  <div className="webinar-status">
                    <span className={`status-badge ${getStatusBadgeClass(webinarStatus)}`}>
                      {getWebinarStatus(webinar.id)}
                    </span>
                  </div>
                </div>

                <div className="webinar-content">
                  <h3 className="webinar-title">{webinar.title || 'Untitled Webinar'}</h3>
                  <div className="webinar-meta">
                    <div className="meta-item">
                      <Users size={16} />
                      <span>Hosted by {webinar.hostUsername || 'Unknown Host'}</span>
                    </div>
             
                  </div>

                  {/* Countdown Display */}
                  {countdown && (
                    <div className="countdown-section-small">
                      {countdown.status === 'Upcoming' && (
                        <div className="countdown-display-small">
                          <span className="countdown-prefix-text">Starts in&nbsp;</span>
                          <div className="countdown-item-small">
                            <span className="countdown-number-small">{formatCountdownTime(countdown.hours)}</span>
                            <span className="countdown-label-small">H</span>
                          </div>
                          <span className="countdown-separator-small">:</span>
                          <div className="countdown-item-small">
                            <span className="countdown-number-small">{formatCountdownTime(countdown.minutes)}</span>
                            <span className="countdown-label-small">M</span>
                          </div>
                          <span className="countdown-separator-small">:</span>
                          <div className="countdown-item-small">
                            <span className="countdown-number-small">{formatCountdownTime(countdown.seconds)}</span>
                            <span className="countdown-label-small">S</span>
                          </div>
                        </div>
                      )}
                      {countdown.status === 'Ongoing' && (
                        <div className="countdown-live-label">
                          <span className="live-indicator">🔴</span>
                          <span>Live Now</span>
                        </div>
                      )}
                      {countdown.status === 'Ended' && (
                        <div className="countdown-ended-label">
                          <span>This webinar has ended.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="webinar-actions">
                  <button
                    onClick={() => handleJoinWebinar(webinar)}
                    className={getJoinButtonClass(webinarStatus)}
                    disabled={!link || webinarStatus === 'Ended'}
                  >
                    <Video size={16} />
                    {getJoinButtonText(webinarStatus)}
                  </button>

                  <div className="webinar-link">
                    <span className="link-text">
                      {link && typeof link === 'string'
                        ? link.length > 40
                          ? `${link.substring(0, 40)}...`
                          : link
                        : 'No link available'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!user && (
        <div className="auth-prompt">
          <div className="auth-prompt-content">
            <AlertCircle size={48} className="auth-prompt-icon" />
            <h3>Want to create your own webinars?</h3>
            <p>Sign in to start hosting interactive webinars and connect with your audience.</p>
            <div className="auth-actions">
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebinarDashboard;