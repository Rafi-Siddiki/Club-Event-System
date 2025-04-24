import React, { useState, useEffect } from 'react'
import '../stylesheets/ViewMyProfile.css';
import '../stylesheets/PanelDashboard.css';
import '../stylesheets/RegistrarDashboard.css';
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-toastify'; // Make sure this is imported

function PanelDashboard() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    club: '',
    attendance: '',
    startingPrice: '',
    location: '',
    packages: [{ name: '', price: '', benefits: [''] }],
    image: '',
    contactPerson: '',
    contactEmail: ''
  })

  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    date: '',
    club: '',
    attendance: '',
    location: '',
    image: '',
    contactPerson: '',
    contactEmail: ''
  });

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('fundingProposals')
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredPendingUsers, setFilteredPendingUsers] = useState([]);
  const [pendingUserRoleFilter, setPendingUserRoleFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [eventsForSponsorship, setEventsForSponsorship] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingApprovedEvents, setLoadingApprovedEvents] = useState(false);
  const [approvedEventsError, setApprovedEventsError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // Add this line
  
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    document.title = 'Panel Dashboard';
    
    // Pre-fill club field if the user has club info
    if (user && user.club) {
      setFormData(prevState => ({
        ...prevState,
        club: user.club,
        contactPerson: user.name,
        contactEmail: user.email
      }));
      
      // Also pre-fill the event form data
      setEventFormData(prevState => ({
        ...prevState,
        club: user.club,
        contactPerson: user.name,
        contactEmail: user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'userApprovals') {
      fetchPendingUsers();
    } else if (activeTab === 'fundingProposals') {
      fetchApprovedEvents();
    } else if (activeTab === 'approvedEvents') {
      fetchApprovedEvents();
    } else if (activeTab === 'createEvent') {
      fetchApprovedEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (pendingUsers.length > 0) {
      setFilteredPendingUsers(pendingUsers);
    }
  }, [pendingUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }


  const handlePackageChange = (index, e) => {
    const { name, value } = e.target
    const newPackages = [...formData.packages]
    newPackages[index] = { ...newPackages[index], [name]: value }
    setFormData({
      ...formData,
      packages: newPackages
    })
  }

  const handleBenefitChange = (packageIndex, benefitIndex, value) => {
    const newPackages = [...formData.packages]
    newPackages[packageIndex].benefits[benefitIndex] = value
    setFormData({
      ...formData,
      packages: newPackages
    })
  }

  const addBenefit = (packageIndex) => {
    const newPackages = [...formData.packages]
    newPackages[packageIndex].benefits.push('')
    setFormData({
      ...formData,
      packages: newPackages
    })
  }

  const removeBenefit = (packageIndex, benefitIndex) => {
    const newPackages = [...formData.packages]
    newPackages[packageIndex].benefits.splice(benefitIndex, 1)
    setFormData({
      ...formData,
      packages: newPackages
    })
  }

  const addPackage = () => {
    setFormData({
      ...formData,
      packages: [...formData.packages, { name: '', price: '', benefits: [''] }]
    })
  }

  const removePackage = (index) => {
    const newPackages = [...formData.packages]
    newPackages.splice(index, 1)
    setFormData({
      ...formData,
      packages: newPackages
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedEventId) {
      setError('Please select an event');
      return;
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      }

      // Convert package price to number
      const formattedData = {
        ...formData,
        eventId: selectedEventId, // Include the selected event ID
        startingPrice: Number(formData.startingPrice),
        packages: formData.packages.map(pkg => ({
          ...pkg,
          price: Number(pkg.price)
        }))
      }

      // Update the endpoint to apply sponsorship to an existing event
      await axios.post(`/api/opportunities/${selectedEventId}/sponsorship`, formattedData, config)
      setSuccess(true)
      setFormData({
        name: '',
        description: '',
        date: '',
        club: user?.club || '',
        attendance: '',
        startingPrice: '',
        location: '',
        packages: [{ name: '', price: '', benefits: [''] }],
        image: '',
        contactPerson: user?.name || '',
        contactEmail: user?.email || ''
      })
      setSelectedEventId('');
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingUsers = async () => {
    setLoadingUsers(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/users', config);
      // Filter to only show users with approved = false
      const pendingUsersList = response.data.filter(user => !user.approved);
      setPendingUsers(pendingUsersList);
      setLoadingUsers(false);
    } catch (err) {
      setUserError('Failed to fetch pending users');
      setLoadingUsers(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/users/approve/${userId}`, {}, config);
      toast.success('User approved successfully');
      
      // Refresh the list
      fetchPendingUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve user';
      toast.error(errorMessage);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/users/reject/${userId}`, {}, config);
      toast.success('User rejected successfully');
      
      // Refresh the list
      fetchPendingUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject user';
      toast.error(errorMessage);
    }
  };

  const handlePendingUserRoleFilter = (role) => {
    setPendingUserRoleFilter(role);
    if (role === 'all') {
      setFilteredPendingUsers(pendingUsers);
    } else {
      setFilteredPendingUsers(pendingUsers.filter(user => user.role === role));
    }
  };

  const fetchApprovedEvents = async () => {
    setLoadingApprovedEvents(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
      // Filter to only include events approved by registrar 
      const approvedEventsList = response.data.filter(
        opportunity => opportunity.generalApproval && 
                     opportunity.generalApproval.status === 'approved'
      );
      
      // For the dropdown, filter events that:
      // 1. Have no sponsorship request (status='none')
      // 2. Are not published
      const eventsForSponsorshipDropdown = approvedEventsList.filter(
        opportunity => opportunity.sponsorshipRequestApproval.status === 'none' && 
                      (!opportunity.publicationStatus || 
                       opportunity.publicationStatus.status !== 'published')
      );
      
      // For the publish list, include all approved events
      setApprovedEvents(approvedEventsList);
      
      // Set dropdown events
      setEventsForSponsorship(eventsForSponsorshipDropdown);
      setLoadingApprovedEvents(false);
    } catch (err) {
      setApprovedEventsError('Failed to fetch approved events');
      setLoadingApprovedEvents(false);
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      // First get the event to check its sponsorship status
      const eventToPublish = approvedEvents.find(event => event._id === eventId);
      
      if (eventToPublish && 
          eventToPublish.sponsorshipRequestApproval && 
          eventToPublish.sponsorshipRequestApproval.status === 'pending') {
        toast.error('Cannot publish event while sponsorship request is pending approval');
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${eventId}/publish`, {}, config);
      toast.success('Event published successfully and is now visible to users');
      fetchApprovedEvents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to publish event';
      toast.error(errorMessage);
    }
  };

  const handlePostponeEvent = async (eventId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${eventId}/postpone`, {}, config);
      toast.success('Event has been postponed');
      fetchApprovedEvents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to postpone event';
      toast.error(errorMessage);
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target
    setEventFormData({
      ...eventFormData,
      [name]: value
    })
  }

  const handleEventImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventFormData({
          ...eventFormData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      }

      await axios.post('/api/opportunities', {
        ...eventFormData,
        // Set empty packages array and 0 starting price to indicate it's not a sponsorship request
        packages: [],
        startingPrice: 0
      }, config)
      
      setSuccess(true)
      setEventFormData({
        name: '',
        description: '',
        date: '',
        club: user?.club || '',
        attendance: '',
        location: '',
        image: '',
        contactPerson: user?.name || '',
        contactEmail: user?.email || ''
      })
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    
    if (eventId) {
      const selectedEvent = approvedEvents.find(event => event._id === eventId);
      if (selectedEvent) {
        // Prefill form data with selected event details
        setFormData({
          ...formData,
          name: selectedEvent.name,
          description: selectedEvent.description,
          date: selectedEvent.date ? selectedEvent.date.split('T')[0] : '',
          club: selectedEvent.club,
          attendance: selectedEvent.attendance,
          location: selectedEvent.location,
          image: selectedEvent.image,
          contactPerson: selectedEvent.contactPerson,
          contactEmail: selectedEvent.contactEmail,
          // Keep current packages data so user can fill them out
        });
      }
    } else {
      // Reset form if "Select an event" is chosen
      setFormData({
        name: '',
        description: '',
        date: '',
        club: user?.club || '',
        attendance: '',
        startingPrice: '',
        location: '',
        packages: [{ name: '', price: '', benefits: [''] }],
        image: '',
        contactPerson: user?.name || '',
        contactEmail: user?.email || ''
      });
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const getFilteredEvents = () => {
    if (statusFilter === 'all') {
      return approvedEvents;
    }
    
    return approvedEvents.filter(event => {
      const isPublished = 
        event.publicationStatus && 
        event.publicationStatus.status === 'published';
      
      const hasPendingSponsorshipRequest = 
        event.sponsorshipRequestApproval && 
        event.sponsorshipRequestApproval.status === 'pending';
      
      if (statusFilter === 'published' && isPublished) {
        return true;
      }
      
      if (statusFilter === 'pending' && hasPendingSponsorshipRequest) {
        return true;
      }
      
      if (statusFilter === 'ready' && !isPublished && !hasPendingSponsorshipRequest) {
        return true;
      }
      
      return false;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fundingProposals':
        return (
          <div className="funding-proposal-form">
            <h2>Create Funding Proposal</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">Funding proposal created successfully!</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Event</label>
                {loadingEvents ? (
                  <p>Loading events...</p>
                ) : (
                  <select 
                    name="eventSelect" 
                    value={selectedEventId} 
                    onChange={handleEventSelect}
                    required
                  >
                    <option value="">Select an event</option>
                    {eventsForSponsorship.map(event => (
                      <option key={event._id} value={event._id}>
                        {event.name} - {new Date(event.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Event details fields removed - only showing selected event info */}
              {selectedEventId && (
                <div className="selected-event-info">
                  <h3>Selected Event: {formData.name}</h3>
                  <p><strong>Date:</strong> {formData.date ? new Date(formData.date).toLocaleDateString() : ''}</p>
                  <p><strong>Location:</strong> {formData.location}</p>
                </div>
              )}

              <div className="form-group">
                <label>Starting Package Price</label>
                <input
                  type="number"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="packages-section">
                <h3>Sponsorship Packages</h3>
                {formData.packages.map((pkg, packageIndex) => (
                  <div key={packageIndex} className="package-item">
                    <h4>Package {packageIndex + 1}</h4>
                    <div className="form-group">
                      <label>Package Name</label>
                      <input
                        type="text"
                        name="name"
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(packageIndex, e)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Package Price</label>
                      <input
                        type="number"
                        name="price"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(packageIndex, e)}
                        required
                      />
                    </div>

                    <div className="benefits-section">
                      <label>Benefits</label>
                      {pkg.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="benefit-item">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => handleBenefitChange(packageIndex, benefitIndex, e.target.value)}
                            required
                          />
                          <button 
                            type="button" 
                            className="remove-btn"
                            onClick={() => removeBenefit(packageIndex, benefitIndex)}
                            disabled={pkg.benefits.length <= 1}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="add-btn" 
                        onClick={() => addBenefit(packageIndex)}
                      >
                        Add Benefit
                      </button>
                    </div>

                    <button 
                      type="button" 
                      className="remove-btn" 
                      onClick={() => removePackage(packageIndex)}
                      disabled={formData.packages.length <= 1}
                    >
                      Remove Package
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-btn" 
                  onClick={addPackage}
                >
                  Add Package
                </button>
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Funding Proposal'}
              </button>
            </form>
          </div>
        );
      case 'userApprovals':
        return (
          <div className="panel-user-approvals">
            <h2>User Approval Requests</h2>
            
            {/* Add filter dropdown */}
            <div className="filter-controls">
              <select 
                onChange={(e) => handlePendingUserRoleFilter(e.target.value)}
                value={pendingUserRoleFilter}
              >
                <option value="all">All Users</option>
                <option value="user">Regular Users</option>
                <option value="sponsor">Sponsors</option>
              </select>
            </div>
            
            {loadingUsers ? (
              <p className="panel-loading">Loading users...</p>
            ) : userError ? (
              <p className="panel-error">{userError}</p>
            ) : pendingUsers.length > 0 ? (
              <table className="panel-approval-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Club/Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingUsers.length > 0 ? (
                    filteredPendingUsers.map(pendingUser => (
                      <tr key={pendingUser._id}>
                        <td>{pendingUser.name}</td>
                        <td>{pendingUser.email}</td>
                        <td>{pendingUser.phone}</td>
                        <td>{pendingUser.role}</td>
                        <td>{pendingUser.club || pendingUser.company || 'N/A'}</td>
                        <td>
                          <button 
                            className="panel-approve-btn" 
                            onClick={() => handleApproveUser(pendingUser._id)}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button 
                            className="panel-reject-btn" 
                            onClick={() => handleRejectUser(pendingUser._id)}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-results">No users match this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="panel-no-requests">
                <p>No pending user approval requests.</p>
              </div>
            )}
          </div>
        );
      case 'createEvent':
        return (
          <div className="funding-proposal-form">
            <h2>Create New Event</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">Event created successfully!</div>}
            
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={eventFormData.name}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={eventFormData.description}
                  onChange={handleEventFormChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Event Date</label>
                <input
                  type="date"
                  name="date"
                  value={eventFormData.date}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Organizing Club</label>
                <input
                  type="text"
                  name="club"
                  value={eventFormData.club}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expected Attendance</label>
                <input
                  type="text"
                  name="attendance"
                  value={eventFormData.attendance}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Location</label>
                <input
                  type="text"
                  name="location"
                  value={eventFormData.location}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Image (Optional)</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleEventImageChange}
                />
                {eventFormData.image && (
                  <div className="image-preview">
                    <img src={eventFormData.image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={eventFormData.contactPerson}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={eventFormData.contactEmail}
                  onChange={handleEventFormChange}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        );
      case 'approvedEvents':
        return (
          <div className="approved-events">
            <h2>Approved Events</h2>
            
            {/* Add status filter dropdown */}
            <div className="filter-controls">
              <label>Filter by Status: </label>
              <select 
                onChange={(e) => handleStatusFilter(e.target.value)}
                value={statusFilter}
                className="status-filter"
              >
                <option value="all">All Statuses</option>
                <option value="ready">Ready to Publish</option>
                <option value="pending">Awaiting Sponsorship Approval</option>
                <option value="published">Published</option>
              </select>
            </div>
            
            {loadingApprovedEvents ? (
              <p className="panel-loading">Loading approved events...</p>
            ) : approvedEventsError ? (
              <p className="panel-error">{approvedEventsError}</p>
            ) : approvedEvents.length > 0 ? (
              <table className="panel-approval-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredEvents().length > 0 ? (
                    getFilteredEvents().map(event => {
                      // Determine event status and whether publish button should be enabled
                      const hasPendingSponsorshipRequest = 
                        event.sponsorshipRequestApproval && 
                        event.sponsorshipRequestApproval.status === 'pending';
                      
                      const isPublished = 
                        event.publicationStatus && 
                        event.publicationStatus.status === 'published';
                      
                      let statusText = 'Ready to Publish';
                      let statusClass = 'status-approved';
                      
                      if (isPublished) {
                        statusText = 'Published';
                        statusClass = 'status-published';
                      } else if (hasPendingSponsorshipRequest) {
                        statusText = 'Awaiting Sponsorship Approval';
                        statusClass = 'status-pending';
                      }
                      
                      return (
                        <tr key={event._id}>
                          <td>{event.name}</td>
                          <td>{event.club}</td>
                          <td>{new Date(event.date).toLocaleDateString()}</td>
                          <td>{event.location}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                          <td>
                            {isPublished ? (
                              <button className="btn-disabled" disabled>
                                <i className="fas fa-check"></i> Published
                              </button>
                            ) : hasPendingSponsorshipRequest ? (
                              <button className="btn-disabled" disabled>
                                <i className="fas fa-clock"></i> Awaiting Approval
                              </button>
                            ) : (
                              <button 
                                className="btn-approve" 
                                onClick={() => handlePublishEvent(event._id)}
                              >
                                <i className="fas fa-check"></i> Publish
                              </button>
                            )}
                            {!isPublished && !hasPendingSponsorshipRequest && (
                              <button 
                                className="btn-reject" 
                                onClick={() => handlePostponeEvent(event._id)}
                              >
                                <i className="fas fa-pause"></i> Postpone
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-results">No events match this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="panel-no-requests">
                <p>No approved events waiting for publication.</p>
              </div>
            )}
          </div>
        );
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  return (
    <div className="panel-dashboard">
      <div className="welcome-section">
        <h1>Welcome {user?.name}</h1>
        <p>Panel Dashboard</p>
      </div>
      
      <div className="dashboard-container">
        <div className="sidebar">
          <ul>
            <li
              className={activeTab === 'fundingProposals' ? 'active' : ''}
              onClick={() => setActiveTab('fundingProposals')}
            >
              <i className="fas fa-handshake"></i> Apply for Sponsorship
            </li>
            <li
              className={activeTab === 'userApprovals' ? 'active' : ''}
              onClick={() => setActiveTab('userApprovals')}
            >
              <i className="fas fa-users"></i> User Approvals
            </li>
            <li
              className={activeTab === 'createEvent' ? 'active' : ''}
              onClick={() => setActiveTab('createEvent')}
            >
              <i className="fas fa-calendar-plus"></i> Create Event
            </li>
            <li
              className={activeTab === 'approvedEvents' ? 'active' : ''}
              onClick={() => setActiveTab('approvedEvents')}
            >
              <i className="fas fa-calendar-check"></i> Approved Events
            </li>
            {/* More menu items can be added here */}
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default PanelDashboard