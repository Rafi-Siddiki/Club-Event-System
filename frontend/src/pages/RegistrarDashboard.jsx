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
  const [opportunitiesForApproval, setOpportunitiesForApproval] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const [pendingSponsorships, setPendingSponsorships] = useState([]);

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
    } else if (activeTab === 'eventApprovals') {
      fetchOpportunitiesForApproval();
    } else if (activeTab === 'userApprovals') {
      fetchPendingUsers();
    } else if (activeTab === 'sponsorshipApprovals') {
      fetchPendingSponsorships();
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
      
      // Filter opportunities that have interested sponsors (either general or package-specific)
      const opportunitiesWithInterest = response.data.filter(
        opportunity => (opportunity.interestedSponsors && opportunity.interestedSponsors.length > 0) ||
                       (opportunity.interestedPackages && opportunity.interestedPackages.length > 0)
      );
      
      setOpportunities(opportunitiesWithInterest);
      
      // For each opportunity, fetch sponsor details
      const sponsorsPromises = [];
      const sponsorIds = new Set();
      
      opportunitiesWithInterest.forEach(opportunity => {
        // Add general interest sponsors
        if (opportunity.interestedSponsors) {
          opportunity.interestedSponsors.forEach(sponsorId => {
            if (!sponsorIds.has(sponsorId)) {
              sponsorIds.add(sponsorId);
              sponsorsPromises.push(
                axios.get(`/api/users/${sponsorId}`, config)
                  .catch(err => {
                    console.error(`Error fetching sponsor ${sponsorId}:`, err);
                    return { data: { _id: sponsorId, name: 'Unknown Sponsor', company: 'Unknown Company' } };
                  })
              );
            }
          });
        }
        
        // Add package-specific interest sponsors
        if (opportunity.interestedPackages) {
          opportunity.interestedPackages.forEach(packageInterest => {
            const sponsorId = packageInterest.sponsorId;
            if (!sponsorIds.has(sponsorId)) {
              sponsorIds.add(sponsorId);
              sponsorsPromises.push(
                axios.get(`/api/users/${sponsorId}`, config)
                  .catch(err => {
                    console.error(`Error fetching sponsor ${sponsorId}:`, err);
                    return { data: { _id: sponsorId, name: 'Unknown Sponsor', company: 'Unknown Company' } };
                  })
              );
            }
          });
        }
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

  // Fetch all opportunities for approval
  const fetchOpportunitiesForApproval = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
      // Filter opportunities that require approval
      const opportunitiesForApproval = response.data.filter(
        opportunity => !opportunity.generalApproval || opportunity.generalApproval.status === 'pending'
      );
      
      setOpportunitiesForApproval(opportunitiesForApproval);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch opportunities requiring approval');
      setLoading(false);
    }
  };

  // Fetch all pending users
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

  const fetchPendingSponsorships = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
      // Filter to only include opportunities with pending sponsorship requests
      const pendingSponsorshipsList = response.data.filter(
        opportunity => opportunity.sponsorshipRequestApproval && 
                     opportunity.sponsorshipRequestApproval.status === 'pending'
      );
      
      setPendingSponsorships(pendingSponsorshipsList);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch pending sponsorship requests');
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

  const handleApproveEvent = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${opportunityId}/approve`, {}, config);
      toast.success('Event approved successfully');
      fetchOpportunitiesForApproval();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve event';
      toast.error(errorMessage);
    }
  };

  const handleRejectEvent = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${opportunityId}/reject`, {}, config);
      toast.success('Event rejected successfully');
      fetchOpportunitiesForApproval();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject event';
      toast.error(errorMessage);
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

  const handleApproveSponsorshipRequest = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${opportunityId}/sponsorship/approve`, {}, config);
      toast.success('Sponsorship request approved successfully');
      fetchPendingSponsorships();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve sponsorship request';
      toast.error(errorMessage);
    }
  };

  const handleRejectSponsorshipRequest = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/opportunities/${opportunityId}/sponsorship/reject`, {}, config);
      toast.success('Sponsorship request rejected successfully');
      fetchPendingSponsorships();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject sponsorship request';
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

  const handleViewEventDetails = (opportunity) => {
    setSelectedRequest({
      opportunity,
      type: 'event'
    });
    setShowModal(true);
  };

  const handleViewPackageInterestDetails = (opportunity, sponsor, packageIndex) => {
    setSelectedRequest({
      opportunity,
      sponsor,
      packageIndex
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
            ) : (opportunities.length > 0 || 
               opportunities.some(opp => opp.interestedPackages && opp.interestedPackages.length > 0)) ? (
              <table className="interest-requests-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Sponsor</th>
                    <th>Company</th>
                    <th>Request Type</th>
                    <th>Request Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* General interests */}
                  {opportunities.flatMap(opportunity => 
                    opportunity.interestedSponsors ? opportunity.interestedSponsors.map(sponsorId => {
                      const sponsor = getSponsorById(sponsorId);
                      return (
                        <tr key={`${opportunity._id}-${sponsorId}`}>
                          <td>{opportunity.name}</td>
                          <td>{opportunity.club}</td>
                          <td>{sponsor.name}</td>
                          <td>{sponsor.company}</td>
                          <td>General Interest</td>
                          <td>{new Date().toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn-view-details" 
                              onClick={() => handleViewDetails(opportunity, sponsor)}
                            >
                              <i className="fas fa-eye"></i> Details
                            </button>
                            <button 
                              className="btn-approve" 
                              onClick={() => handleApproveInterest(opportunity._id, sponsorId)}
                            >
                              <i className="fas fa-check"></i> Approve
                            </button>
                            <button 
                              className="btn-reject" 
                              onClick={() => handleRejectInterest(opportunity._id, sponsorId)}
                            >
                              <i className="fas fa-times"></i> Reject
                            </button>
                          </td>
                        </tr>
                      );
                    }) : []
                  )}
                  
                  {/* Package-specific interests */}
                  {opportunities.flatMap(opportunity => 
                    opportunity.interestedPackages ? opportunity.interestedPackages.map(packageInterest => {
                      const sponsor = getSponsorById(packageInterest.sponsorId);
                      const packageIndex = packageInterest.packageIndex;
                      const packageName = opportunity.packages && opportunity.packages[packageIndex] 
                        ? (opportunity.packages[packageIndex].name || `Package ${packageIndex + 1}`)
                        : `Package ${packageIndex + 1}`;
                      
                      return (
                        <tr key={`${opportunity._id}-${packageInterest.sponsorId}-pkg-${packageIndex}`}>
                          <td>{opportunity.name}</td>
                          <td>{opportunity.club}</td>
                          <td>{sponsor.name}</td>
                          <td>{sponsor.company}</td>
                          <td>{packageName}</td>
                          <td>{new Date(packageInterest.expressedAt || Date.now()).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn-view-details" 
                              onClick={() => handleViewPackageInterestDetails(opportunity, sponsor, packageIndex)}
                            >
                              <i className="fas fa-eye"></i> Details
                            </button>
                            <button 
                              className="btn-approve" 
                              onClick={() => handleApproveInterest(opportunity._id, packageInterest.sponsorId)}
                            >
                              <i className="fas fa-check"></i> Approve
                            </button>
                            <button 
                              className="btn-reject" 
                              onClick={() => handleRejectInterest(opportunity._id, packageInterest.sponsorId)}
                            >
                              <i className="fas fa-times"></i> Reject
                            </button>
                          </td>
                        </tr>
                      );
                    }) : []
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
      case 'eventApprovals':
        return (
          <div className="event-approvals">
            <h2>Event Approval Requests</h2>
            {loading ? (
              <p>Loading events...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : opportunitiesForApproval.length > 0 ? (
              <table className="interest-requests-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunitiesForApproval.map(opportunity => (
                    <tr key={opportunity._id}>
                      <td>{opportunity.name}</td>
                      <td>{opportunity.club}</td>
                      <td>{new Date(opportunity.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge status-${opportunity.generalApproval?.status || 'pending'}`}>
                          {opportunity.generalApproval?.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-view-details" 
                          onClick={() => handleViewEventDetails(opportunity)}
                        >
                          <i className="fas fa-eye"></i> Details
                        </button>
                        <button 
                          className="btn-approve" 
                          onClick={() => handleApproveEvent(opportunity._id)}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button 
                          className="btn-reject" 
                          onClick={() => handleRejectEvent(opportunity._id)}
                        >
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-requests">
                <p>No pending event approval requests.</p>
              </div>
            )}
          </div>
        );
      case 'userApprovals':
        return (
          <div className="user-approvals">
            <h2>User Approval Requests</h2>
            {loadingUsers ? (
              <p>Loading users...</p>
            ) : userError ? (
              <p className="error">{userError}</p>
            ) : pendingUsers.length > 0 ? (
              <table className="interest-requests-table">
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
                          className="btn-approve" 
                          onClick={() => handleApproveUser(pendingUser._id)}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-requests">
                <p>No pending user approval requests.</p>
              </div>
            )}
          </div>
        );
      case 'sponsorshipApprovals':
        return (
          <div className="sponsorship-approvals">
            <h2>Sponsorship Approval Requests</h2>
            {loading ? (
              <p>Loading sponsorship requests...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : pendingSponsorships.length > 0 ? (
              <table className="interest-requests-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Starting Price</th>
                    <th>Date</th>
                    <th>Contact Person</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSponsorships.map(opportunity => (
                    <tr key={opportunity._id}>
                      <td>{opportunity.name}</td>
                      <td>{opportunity.club}</td>
                      <td>${opportunity.startingPrice}</td>
                      <td>{new Date(opportunity.date).toLocaleDateString()}</td>
                      <td>{opportunity.contactPerson}</td>
                      <td>
                        <button 
                          className="btn-view-details" 
                          onClick={() => handleViewEventDetails(opportunity)}
                        >
                          <i className="fas fa-eye"></i> Details
                        </button>
                        <button 
                          className="btn-approve" 
                          onClick={() => handleApproveSponsorshipRequest(opportunity._id)}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button 
                          className="btn-reject" 
                          onClick={() => handleRejectSponsorshipRequest(opportunity._id)}
                        >
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-requests">
                <p>No pending sponsorship approval requests.</p>
                <p>When clubs create sponsorship requests, they will appear here for your review.</p>
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

      <div className="dashboard-container">
        <div className="sidebar">
          <ul>
            <li
              className={activeTab === 'interestRequests' ? 'active' : ''}
              onClick={() => setActiveTab('interestRequests')}
            >
              <i className="fas fa-handshake"></i> Sponsor Interest Requests
            </li>
            <li
              className={activeTab === 'eventApprovals' ? 'active' : ''}
              onClick={() => setActiveTab('eventApprovals')}
            >
              <i className="fas fa-calendar-check"></i> Event Approvals
            </li>
            <li
              className={activeTab === 'userApprovals' ? 'active' : ''}
              onClick={() => setActiveTab('userApprovals')}
            >
              <i className="fas fa-users"></i> User Approvals
            </li>
            <li
              className={activeTab === 'sponsorshipApprovals' ? 'active' : ''}
              onClick={() => setActiveTab('sponsorshipApprovals')}
            >
              <i className="fas fa-money-check-alt"></i> Sponsorship Approvals
            </li>
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="request-details-modal">
            <div className="modal-header">
              <h2>
                {selectedRequest.type === 'event' ? 'Event Details' : 
                 activeTab === 'sponsorshipApprovals' ? 'Sponsorship Request Details' : 
                 'Interest Request Details'}
              </h2>
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
              
              {/* Display the specific package the sponsor is interested in */}
              {selectedRequest.packageIndex !== undefined && 
               selectedRequest.opportunity.packages && 
               selectedRequest.opportunity.packages[selectedRequest.packageIndex] && (
                <>
                  <h3>Selected Sponsorship Package</h3>
                  <div className="selected-package-container">
                    <div className="package-item selected-package">
                      <h4>
                        {selectedRequest.opportunity.packages[selectedRequest.packageIndex].name || 
                         `Package ${selectedRequest.packageIndex + 1}`}
                      </h4>
                      <div className="package-detail">
                        <strong>Price:</strong>
                        <p>${selectedRequest.opportunity.packages[selectedRequest.packageIndex].price}</p>
                      </div>
                      <div className="package-detail">
                        <strong>Benefits:</strong>
                        <p>{Array.isArray(selectedRequest.opportunity.packages[selectedRequest.packageIndex].benefits) 
                           ? selectedRequest.opportunity.packages[selectedRequest.packageIndex].benefits.join(', ') 
                           : selectedRequest.opportunity.packages[selectedRequest.packageIndex].benefits || 'No benefits listed'}</p>
                      </div>
                      <div className="package-detail">
                        <strong>Description:</strong>
                        <p>{selectedRequest.opportunity.packages[selectedRequest.packageIndex].description || 'No description provided'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Display all packages if we're viewing sponsorship approvals or a package interest */}
              {(activeTab === 'sponsorshipApprovals' || selectedRequest.packageIndex !== undefined) && 
               selectedRequest.opportunity.packages && selectedRequest.opportunity.packages.length > 0 && (
                <>
                  <h3>{selectedRequest.packageIndex !== undefined ? 'All Available Packages' : 'Sponsorship Packages'}</h3>
                  <div className="packages-container">
                    {selectedRequest.opportunity.packages.map((pkg, index) => (
                      <div 
                        key={index} 
                        className={`package-item ${selectedRequest.packageIndex === index ? 'selected-package' : ''}`}
                      >
                        <h4>{pkg.name || `Package ${index + 1}`}</h4>
                        <div className="package-detail">
                          <strong>Price:</strong>
                          <p>${pkg.price}</p>
                        </div>
                        <div className="package-detail">
                          <strong>Benefits:</strong>
                          <p>{Array.isArray(pkg.benefits) ? pkg.benefits.join(', ') : pkg.benefits || 'No benefits listed'}</p>
                        </div>
                        <div className="package-detail">
                          <strong>Description:</strong>
                          <p>{pkg.description || 'No description provided'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {selectedRequest.sponsor && (
                <>
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
                </>
              )}
              
              <div className="modal-actions">
                {selectedRequest.sponsor ? (
                  <>
                    <button 
                      className="btn-approve" 
                      onClick={() => handleApproveInterest(
                        selectedRequest.opportunity._id, 
                        selectedRequest.sponsor._id
                      )}
                    >
                      <i className="fas fa-check"></i> Approve Request
                    </button>
                    <button 
                      className="btn-reject" 
                      onClick={() => handleRejectInterest(
                        selectedRequest.opportunity._id, 
                        selectedRequest.sponsor._id
                      )}
                    >
                      <i className="fas fa-times"></i> Reject Request
                    </button>
                  </>
                ) : activeTab === 'sponsorshipApprovals' ? (
                  <>
                    <button 
                      className="btn-approve" 
                      onClick={() => handleApproveSponsorshipRequest(selectedRequest.opportunity._id)}
                    >
                      <i className="fas fa-check"></i> Approve Sponsorship
                    </button>
                    <button 
                      className="btn-reject" 
                      onClick={() => handleRejectSponsorshipRequest(selectedRequest.opportunity._id)}
                    >
                      <i className="fas fa-times"></i> Reject Sponsorship
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn-approve" 
                      onClick={() => handleApproveEvent(selectedRequest.opportunity._id)}
                    >
                      <i className="fas fa-check"></i> Approve Event
                    </button>
                    <button 
                      className="btn-reject" 
                      onClick={() => handleRejectEvent(selectedRequest.opportunity._id)}
                    >
                      <i className="fas fa-times"></i> Reject Event
                    </button>
                  </>
                )}
                <button className="btn-view-details" onClick={closeModal}>
                  <i className="fas fa-times-circle"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarDashboard;