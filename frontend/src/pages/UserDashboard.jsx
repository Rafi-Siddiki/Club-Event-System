import React, { useEffect, useState } from 'react';
import '../stylesheets/ViewMyProfile.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import '../stylesheets/UserDashboard.css'; // Reuse sponsor dashboard styles
import { toast } from 'react-toastify';
import '../stylesheets/AnnouncementCard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('allEvents');
  const [opportunities, setOpportunities] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Set page title
    document.title = 'User Dashboard';
  }, []);

  useEffect(() => {
    // Protect this route - only users can access
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'user') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Fetch opportunities when the component mounts or the active tab changes
    if (activeTab === 'allEvents') {
      fetchOpportunities();
    } else if (activeTab === 'yourEvents') {
      fetchAttendingEvents();
    } else if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  // Modify your fetchOpportunities function
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/opportunities', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      // Filter to only show opportunities with general approval AND published status
      const publishedOpportunities = response.data.filter(
        opportunity => opportunity.generalApproval && 
                     opportunity.generalApproval.status === 'approved' &&
                     opportunity.publicationStatus &&
                     opportunity.publicationStatus.status === 'published'
      );
      setOpportunities(publishedOpportunities);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const fetchAttendingEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/opportunities/attending', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setAttendingEvents(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events you are attending');
      setLoading(false);
    }
  };

  // Modify the fetchAnnouncements function
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // First get the events the user is attending
      const attendingResponse = await axios.get('/api/opportunities/attending', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      // Get IDs of events the user is attending
      const attendingEventIds = attendingResponse.data.map(event => event._id);

      // Get all announcements
      const announcementsResponse = await axios.get('/api/announcements', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Filter announcements to only include those for events the user is attending
      const userAnnouncements = announcementsResponse.data.filter(
        announcement => attendingEventIds.includes(announcement.eventId)
      );

      // Populate event details for the filtered announcements
      const populatedAnnouncements = await Promise.all(
        userAnnouncements.map(async (announcement) => {
          if (!announcement.eventId?.name) {
            const eventResponse = await axios.get(`/api/opportunities/${announcement.eventId}`, {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            });
            return {
              ...announcement,
              eventId: {
                ...announcement.eventId,
                name: eventResponse.data.name,
              },
            };
          }
          return announcement;
        })
      );

      setAnnouncements(populatedAnnouncements);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch announcements');
      setLoading(false);
    }
  };

  const handleViewDetails = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOpportunity(null);
  };

  // Handle attending an event
  const handleAttendEvent = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post(`/api/opportunities/${opportunityId}/attend`, {}, config);
      toast.success('You are now attending this event!');
      
      // Refresh the opportunities list
      if (activeTab === 'allEvents') {
        fetchOpportunities();
      } else {
        fetchAttendingEvents();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register for event';
      toast.error(errorMessage);
    }
  };

  // Handle cancelling attendance
  const handleCancelAttendance = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.delete(`/api/opportunities/${opportunityId}/attend`, config);
      toast.success('You have cancelled your attendance for this event');
      
      // Refresh the list
      fetchAttendingEvents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel attendance';
      toast.error(errorMessage);
    }
  };

  // Check if user is already attending
  const isAttending = (opportunity) => {
    return user && 
           opportunity.attendingUsers && 
           Array.isArray(opportunity.attendingUsers) && 
           opportunity.attendingUsers.includes(user._id);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'allEvents':
        return (
          <div className="funding-proposals">
            <h2>Upcoming Events</h2>
            {loading ? (
              <p>Loading events...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : opportunities.length > 0 ? (
              <div className="proposals-list">
                {opportunities.map((opportunity) => (
                  <div 
                    key={opportunity._id} 
                    className="proposal-card"
                    style={opportunity.image ? {
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${opportunity.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: 'white'
                    } : {}}
                  >
                    <h3>{opportunity.name}</h3>
                    <p>{opportunity.description}</p>
                    <div className="proposal-details">
                      <span>Date: {new Date(opportunity.date).toLocaleDateString()}</span>
                      <span>Club: {opportunity.club}</span>
                    </div>
                    <div className="proposal-details">
                      <span>Location: {opportunity.location}</span>
                      <span>Expected Attendance: {opportunity.attendance}</span>
                    </div>
                    <div className="proposal-actions">
                      <button className="btn-view" onClick={() => handleViewDetails(opportunity)}>View Details</button>
                      {isAttending(opportunity) ? (
                        <button className="btn-disabled" disabled>Already Attending</button>
                      ) : (
                        <button 
                          className="btn-approve" 
                          onClick={() => handleAttendEvent(opportunity._id)}
                        >
                          Attend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-opportunities">
                <p>No approved events available at the moment.</p>
              </div>
            )}
          </div>
        );
      case 'yourEvents':
        return (
          <div className="funding-proposals">
            <h2>Your Events</h2>
            {loading ? (
              <p>Loading your events...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : attendingEvents.length > 0 ? (
              <div className="proposals-list">
                {attendingEvents.map((event) => (
                  <div key={event._id} className="proposal-card">
                    <h3>{event.name}</h3>
                    <p>{event.description}</p>
                    <div className="proposal-details">
                      <span>Date: {new Date(event.date).toLocaleDateString()}</span>
                      <span>Club: {event.club}</span>
                    </div>
                    <div className="proposal-details">
                      <span>Location: {event.location}</span>
                      <span>Expected Attendance: {event.attendance}</span>
                    </div>
                    <div className="proposal-actions">
                      <button className="btn-view" onClick={() => handleViewDetails(event)}>View Details</button>
                      <button 
                        className="btn-reject" 
                        onClick={() => handleCancelAttendance(event._id)}
                      >
                        Cancel Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-opportunities">
                <p>You are not attending any events yet.</p>
                <p className="note">Browse the 'All Events' tab to find events to attend.</p>
              </div>
            )}
          </div>
        );
      case 'announcements':
        return (
          <div className="announcements-section">
            <h2>Event Announcements</h2>
            {loading ? (
              <p>Loading announcements...</p>
            ) : announcements.length > 0 ? (
              <ul>
                {announcements.map((announcement) => (
                  <li key={announcement._id}>
                    <p><strong>Event:</strong> {announcement.eventId?.name || 'Event details unavailable'}</p>
                    <p>{announcement.message}</p>
                    <small>Posted on: {new Date(announcement.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No announcements available.</p>
            )}
          </div>
        );
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  return (
    <div className="sponsor-dashboard">
      <div className="welcome-section">
        <h1>Welcome {user?.name}</h1>
        <p>User Dashboard</p>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          <ul>
            <li
              className={activeTab === 'allEvents' ? 'active' : ''}
              onClick={() => setActiveTab('allEvents')}
            >
              <i className="fas fa-calendar-alt"></i> All Events
            </li>
            <li
              className={activeTab === 'yourEvents' ? 'active' : ''}
              onClick={() => setActiveTab('yourEvents')}
            >
              <i className="fas fa-user-check"></i> Your Events
            </li>
            <li
              className={activeTab === 'announcements' ? 'active' : ''}
              onClick={() => setActiveTab('announcements')}
            >
              <i className="fas fa-bullhorn"></i> Announcements
            </li>
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>

      {/* Event Details Modal */}
      {showModal && selectedOpportunity && (
        <div className="modal-overlay">
          <div className="event-details-modal">
            <div className="modal-header">
              <h2>{selectedOpportunity.name}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            {/* Image Cover */}
            {selectedOpportunity.image && (
              <div className="event-cover-image">
                <img 
                  src={selectedOpportunity.image} 
                  alt={selectedOpportunity.name} 
                />
              </div>
            )}
            
            <div className="modal-content">
              <div className="event-detail-item">
                <strong>Description:</strong>
                <p>{selectedOpportunity.description}</p>
              </div>
              <div className="event-detail-row">
                <div className="event-detail-item">
                  <strong>Club:</strong>
                  <p>{selectedOpportunity.club}</p>
                </div>
                <div className="event-detail-item">
                  <strong>Date:</strong>
                  <p>{new Date(selectedOpportunity.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="event-detail-row">
                <div className="event-detail-item">
                  <strong>Location:</strong>
                  <p>{selectedOpportunity.location}</p>
                </div>
                <div className="event-detail-item">
                  <strong>Expected Attendance:</strong>
                  <p>{selectedOpportunity.attendance}</p>
                </div>
              </div>
              {selectedOpportunity.contactPerson && (
                <div className="event-detail-row">
                  <div className="event-detail-item">
                    <strong>Contact Person:</strong>
                    <p>{selectedOpportunity.contactPerson}</p>
                  </div>
                  {selectedOpportunity.contactEmail && (
                    <div className="event-detail-item">
                      <strong>Contact Email:</strong>
                      <p>{selectedOpportunity.contactEmail}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="modal-actions">
                <button className="btn-view" onClick={closeModal}>Close</button>
                {activeTab === 'allEvents' ? (
                  isAttending(selectedOpportunity) ? (
                    <button className="btn-disabled" disabled>Already Attending</button>
                  ) : (
                    <button 
                      className="btn-approve" 
                      onClick={() => {
                        handleAttendEvent(selectedOpportunity._id);
                        closeModal();
                      }}
                    >
                      Attend Event
                    </button>
                  )
                ) : (
                  <button 
                    className="btn-reject" 
                    onClick={() => {
                      handleCancelAttendance(selectedOpportunity._id);
                      closeModal();
                    }}
                  >
                    Cancel Attendance
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;