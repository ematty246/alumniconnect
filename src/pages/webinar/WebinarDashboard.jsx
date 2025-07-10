import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Video, Users, Calendar, ExternalLink, Plus, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { webinarService } from './services/webinarService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from "react-router-dom";

const WebinarDashboard = () => {
  const [webinars, setWebinars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());
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
                  status: countdownData.status || 'Ongoing'
                }
              }));
            } else {
              console.error(`Error fetching countdown for webinar ${webinar.id}:`, response.status);
              setCountdowns(prev => ({
                ...prev,
                [webinar.id]: {
                  hours: 0,
                  minutes: 0,
                  seconds: 0,
                  status: 'Ongoing'
                }
              }));
            }
          } catch (error) {
            console.error(`Error fetching countdown for webinar ${webinar.id}:`, error);
            setCountdowns(prev => ({
              ...prev,
              [webinar.id]: {
                hours: 0,
                minutes: 0,
                seconds: 0,
                status: 'Ongoing'
              }
            }));
          }
        };

        fetchCountdown();
        intervals[webinar.id] = setInterval(fetchCountdown, 1000);
      }
    });

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
      const response = await fetch('http://localhost:8086/webinar/all');
      const data = await response.json();
      console.log('Fetched webinars:', data);
      
      // Debug: Log each webinar's scheduledDate and timeSlot
      if (Array.isArray(data)) {
        data.forEach((webinar, index) => {
          console.log(`Webinar ${index + 1}:`, {
            id: webinar.id,
            title: webinar.title,
            scheduledDate: webinar.scheduledDate,
            timeSlot: webinar.timeSlot,
            link: webinar.link || webinar.videoLink,
            hostUsername: webinar.hostUsername
          });
        });
      }
      
      setWebinars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      // Fallback to webinarService if direct API call fails
      try {
        const data = await webinarService.getAllWebinars();
        setWebinars(Array.isArray(data) ? data : []);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        addToast('Failed to fetch webinars', 'error');
        setWebinars([]);
      }
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
      const response = await fetch(`http://localhost:8086/webinar/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setWebinars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching webinars:', error);
      // Fallback to webinarService
      try {
        const data = await webinarService.searchWebinars(query);
        setWebinars(Array.isArray(data) ? data : []);
      } catch (fallbackError) {
        console.error('Search fallback error:', fallbackError);
        addToast('Search failed', 'error');
        setWebinars([]);
      }
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
        return 'Live'; // Default to live for existing webinars
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
        return 'status-live'; // Default to live
    }
  };

  const getJoinButtonClass = (status) => {
    switch (status) {
      case 'Ongoing':
        return 'btn btn-sm btn-success';
      case 'Ended':
        return 'btn btn-sm btn-disabled';
      default:
        return 'btn btn-sm btn-success'; // Default to success for live
    }
  };

  const getJoinButtonText = (status) => {
    switch (status) {
      case 'Ongoing':
        return 'Join Live Now';
      case 'Ended':
        return 'Ended';
      default:
        return 'Join Live Now'; // Default to live
    }
  };

  // Calendar functions
  const parseScheduledDate = (dateString) => {
    console.log('Parsing date string:', dateString);
    if (!dateString) return null;
    
    // Handle both DD-MM-YYYY and DD/MM/YYYY formats
    const separator = dateString.includes('/') ? '/' : '-';
    const parts = dateString.split(separator);
    
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('Parsed date:', parsedDate);
      return parsedDate;
    }
    console.log('Failed to parse date:', dateString);
    return null;
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getWebinarsForDate = (date) => {
    const dayWebinars = webinars.filter(webinar => {
      const webinarDate = parseScheduledDate(webinar.scheduledDate);
      const matches = webinarDate && isSameDay(webinarDate, date);
      if (matches) {
        console.log('Found webinar for date:', date, 'webinar:', webinar);
      }
      return matches;
    });
    return dayWebinars;
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const CalendarView = () => {
    const days = generateCalendarDays();
    const today = new Date();

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button 
            onClick={() => navigateMonth(-1)}
            className="btn btn-outline btn-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="calendar-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={() => navigateMonth(1)}
            className="btn btn-outline btn-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="calendar-day empty"></div>;
            }

            const dayWebinars = getWebinarsForDate(day);
            const isToday = isSameDay(day, today);
            
            console.log(`Day ${day.getDate()}: found ${dayWebinars.length} webinars`);

            return (
              <div 
                key={index} 
                className={`calendar-day ${isToday ? 'today' : ''} ${dayWebinars.length > 0 ? 'has-events' : ''}`}
              >
                <div className="calendar-day-number">
                  {day.getDate()}
                </div>
                {dayWebinars.length > 0 && (
                  <div className="calendar-events">
                    {dayWebinars.slice(0, 3).map((webinar, idx) => {
                      console.log('Rendering webinar in calendar:', {
                        id: webinar.id,
                        title: webinar.title,
                        timeSlot: webinar.timeSlot,
                        scheduledDate: webinar.scheduledDate
                      });
                      return (
                        <div 
                          key={`${webinar.id}-${idx}`}
                          className="calendar-event"
                          style={{
                            background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                          }}
                          onClick={() => handleJoinWebinar(webinar)}
                          title={`${webinar.title || 'Untitled Webinar'} - ${webinar.timeSlot || 'No time set'}`}
                        >
                          <div className="event-title">
                            {webinar.title && webinar.title.length > 15 
                              ? `${webinar.title.substring(0, 15)}...` 
                              : webinar.title || 'Untitled'}
                          </div>
                          <div className="event-time">
                            {webinar.timeSlot || 'No time'}
                          </div>
                          <div className="event-status">
                            {getWebinarStatus(webinar.id)}
                          </div>
                        </div>
                      );
                    })}
                    {dayWebinars.length > 3 && (
                      <div className="calendar-event more-events">
                        +{dayWebinars.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Video size={16} />
              Grid View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Calendar size={16} />
              Calendar View
            </button>
          </div>
          {user && (
            <Link to="/webinar/create" className="btn btn-primary">
              <Plus size={20} />
              Create Webinar
            </Link>
          )}
        </div>
      </div>

      {viewMode === 'grid' && (
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
      )}

      {viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
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
              const webinarStatus = countdown ? countdown.status : 'Ongoing';
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
                      {webinar.scheduledDate && (
                        <div className="meta-item">
                          <Calendar size={16} />
                          <span>{webinar.scheduledDate}</span>
                        </div>
                      )}
                      {webinar.timeSlot && (
                        <div className="meta-item">
                          <Clock size={16} />
                          <span>{webinar.timeSlot}</span>
                        </div>
                      )}
                    </div>

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
      )}

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