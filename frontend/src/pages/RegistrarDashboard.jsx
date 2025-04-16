import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/ViewMyProfile.css';
import '../stylesheets/RegistrarDashboard.css';
import { toast } from 'react-toastify';

function RegistrarDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('interestRequests');
  const [opportunities, setOpportunities] = useState([]);
  const [interestedSponsors, setInterestedSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    document.title = 'Registrar Dashboard';

    // Protect this route - only registrars should access
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'registrar') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'interestRequests') {
      fetchOpportunities();
    }
  }, [activeTab]);

  // Fetch all opportunities with interested sponsors
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
      // Filter opportunities that have interested sponsors
      const opportunitiesWithInterest = response.data.filter(
        opportunity => opportunity.interestedSponsors && opportunity.interestedSponsors.length > 0
      );
      
      setOpportunities(opportunitiesWithInterest);
      
      // For each opportunity with interested sponsors, fetch sponsor details
      const sponsorsPromises = [];
      opportunitiesWithInterest.forEach(opportunity => {
        opportunity.interestedSponsors.forEach(sponsorId => {
          sponsorsPromises.push(
            axios.get(`/api/users/${sponsorId}`, config)
              .catch(err => {
                console.error(`Error fetching sponsor ${sponsorId}:`, err);
                return { data: { _id: sponsorId, name: 'Unknown Sponsor', company: 'Unknown Company' } };
              })
          );
        });
      });
      
      if (sponsorsPromises.length > 0) {
        const sponsorsResponses = await Promise.all(sponsorsPromises);
        const sponsors = sponsorsResponses.map(response => response.data);
        setInterestedSponsors(sponsors);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch funding opportunities with interested sponsors');
      setLoading(false);
    }
  };

  const handleApproveInterest = async (opportunityId, sponsorId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${opportunityId}/interest/${sponsorId}/approve`, {}, config);
      toast.success('Interest request approved successfully');
      fetchOpportunities();
      
      if (showModal) {
        setShowModal(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve interest request';
      toast.error(errorMessage);
    }
  };

  const handleRejectInterest = async (opportunityId, sponsorId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${opportunityId}/interest/${sponsorId}/reject`, {}, config);
      toast.success('Interest request rejected successfully');
      fetchOpportunities();
      
      if (showModal) {
        setShowModal(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject interest request';
      toast.error(errorMessage);
    }
  };

  const handleViewDetails = (opportunity, sponsor) => {
    setSelectedRequest({
      opportunity,
      sponsor
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Function to find sponsor by ID
  const getSponsorById = (sponsorId) => {
    return interestedSponsors.find(sponsor => sponsor._id === sponsorId) || { 
      name: 'Unknown Sponsor', 
      company: 'Unknown Company' 
    };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'interestRequests':
        return (
          <div className="interest-requests">
            <h2>Sponsor Interest Requests</h2>
            {loading ? (
              <p>Loading requests...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : opportunities.length > 0 ? (
              <table className="interest-requests-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Sponsor</th>
                    <th>Company</th>
                    <th>Request Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.flatMap(opportunity => 
                    opportunity.interestedSponsors.map(sponsorId => {
                      const sponsor = getSponsorById(sponsorId);
                      return (
                        <tr key={`${opportunity._id}-${sponsorId}`}>
                          <td>{opportunity.name}</td>
                          <td>{opportunity.club}</td>
                          <td>{sponsor.name}</td>
                          <td>{sponsor.company}</td>
                          <td>{new Date().toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn-view-details" 
                              onClick={() => handleViewDetails(opportunity, sponsor)}
                            >
                              View Details
                            </button>
                            <button 
                              className="btn-approve" 
                              onClick={() => handleApproveInterest(opportunity._id, sponsorId)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn-reject" 
                              onClick={() => handleRejectInterest(opportunity._id, sponsorId)}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <div className="no-requests">
                <p>No pending interest requests from sponsors.</p>
                <p>When sponsors express interest in funding opportunities, their requests will appear here for your review.</p>
              </div>
            )}
          </div>
        );
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  return (
    <div className="registrar-dashboard">
      <div className="welcome-section">
        <h1>Welcome {user?.name}</h1>
        <p>Registrar Dashboard</p>
      </div>

      {/* Profile Button Section */}
      <div className="dashboard-actions">
        <Link to="/profile" className="profile-link">
          <button type="button">View My Profile</button>
        </Link>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          <ul>
            <li
              className={activeTab === 'interestRequests' ? 'active' : ''}
              onClick={() => setActiveTab('interestRequests')}
            >
              <i className="fas fa-handshake"></i> Sponsor Interest Requests
            </li>
            {/* Add more menu items here as needed */}
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="request-details-modal">
            <div className="modal-header">
              <h2>Interest Request Details</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <h3>Event Information</h3>
              <div className="event-detail-item">
                <strong>Event Name:</strong>
                <p>{selectedRequest.opportunity.name}</p>
              </div>
              <div className="event-detail-item">
                <strong>Description:</strong>
                <p>{selectedRequest.opportunity.description}</p>
              </div>
              <div className="event-detail-item">
                <strong>Date:</strong>
                <p>{new Date(selectedRequest.opportunity.date).toLocaleDateString()}</p>
              </div>
              <div className="event-detail-item">
                <strong>Organizing Club:</strong>
                <p>{selectedRequest.opportunity.club}</p>
              </div>
              <div className="event-detail-item">
                <strong>Expected Attendance:</strong>
                <p>{selectedRequest.opportunity.attendance}</p>
              </div>
              
              <h3>Sponsor Information</h3>
              <div className="event-detail-item">
                <strong>Name:</strong>
                <p>{selectedRequest.sponsor.name}</p>
              </div>
              <div className="event-detail-item">
                <strong>Company:</strong>
                <p>{selectedRequest.sponsor.company}</p>
              </div>
              <div className="event-detail-item">
                <strong>Email:</strong>
                <p>{selectedRequest.sponsor.email || 'Not available'}</p>
              </div>
              <div className="event-detail-item">
                <strong>Phone:</strong>
                <p>{selectedRequest.sponsor.phone || 'Not available'}</p>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-approve" 
                  onClick={() => handleApproveInterest(
                    selectedRequest.opportunity._id, 
                    selectedRequest.sponsor._id
                  )}
                >
                  Approve Request
                </button>
                <button 
                  className="btn-reject" 
                  onClick={() => handleRejectInterest(
                    selectedRequest.opportunity._id, 
                    selectedRequest.sponsor._id
                  )}
                >
                  Reject Request
                </button>
                <button className="btn-view-details" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarDashboard;