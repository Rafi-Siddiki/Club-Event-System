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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  
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
    }
  }, [activeTab]);

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

  // Modify this function to fetch approved events
  const fetchApprovedEvents = async () => {
    setLoadingEvents(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
      // Filter to only include events with generalApproval.status === 'approved'
      const approvedEventsList = response.data.filter(
        opportunity => opportunity.generalApproval && 
                      opportunity.generalApproval.status === 'approved'
      );
      
      setApprovedEvents(approvedEventsList);
      setLoadingEvents(false);
    } catch (err) {
      console.error('Error fetching approved events:', err);
      setLoadingEvents(false);
    }
  };

  // Add these functions to handle the event form
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
        // Set empty packages array since this is just an event without sponsorship
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

  // Add this function to handle event selection
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
                    {approvedEvents.map(event => (
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
                  {pendingUsers.map(pendingUser => (
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
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
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
            {/* More menu items can be added here */}
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default PanelDashboard