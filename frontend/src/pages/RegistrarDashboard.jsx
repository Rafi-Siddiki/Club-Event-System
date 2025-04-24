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
  const [filteredPendingUsers, setFilteredPendingUsers] = useState([]);
  const [pendingUserRoleFilter, setPendingUserRoleFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const [pendingSponsorships, setPendingSponsorships] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    club: '',
    company: '',
    industry: '',
    department: '',
    position: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [packageAllocations, setPackageAllocations] = useState([]);
  const [fundAllocationError, setFundAllocationError] = useState(null);
  const [allocatedFunds, setAllocatedFunds] = useState(0);

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
    } else if (activeTab === 'showProfiles') {
      fetchApprovedUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedRequest && selectedRequest.opportunity && selectedRequest.opportunity.packages) {
      // Initialize allocations for each package
      const initialAllocations = selectedRequest.opportunity.packages.map((pkg, index) => ({
        packageIndex: index,
        amount: pkg.registrarFunds || 0,
        price: pkg.price
      }));
      setPackageAllocations(initialAllocations);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (pendingUsers.length > 0) {
      setFilteredPendingUsers(pendingUsers);
    }
  }, [pendingUsers]);

  const handlePackageAllocationChange = (packageIndex, amount) => {
    setPackageAllocations(prev => 
      prev.map(allocation => 
        allocation.packageIndex === packageIndex 
          ? { ...allocation, amount: parseFloat(amount) || 0 } 
          : allocation
      )
    );
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
      const opportunitiesWithInterest = response.data.filter(opportunity => 
        (opportunity.interestedSponsors && opportunity.interestedSponsors.length > 0) || 
        (opportunity.interestedPackages && opportunity.interestedPackages.length > 0)
      );
      
      setOpportunities(opportunitiesWithInterest);
      
      const sponsorsPromises = [];
      const sponsorIds = new Set();
      
      opportunitiesWithInterest.forEach(opportunity => {
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

  const fetchOpportunitiesForApproval = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/opportunities', config);
      
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

  const fetchPendingUsers = async () => {
    setLoadingUsers(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/users', config);
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

  const fetchApprovedUsers = async () => {
    setLoadingUsers(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const response = await axios.get('/api/users', config);
      const approvedUsersList = response.data.filter(user => 
        user.approved && user.role !== 'registrar'
      );
      setApprovedUsers(approvedUsersList);
      setFilteredUsers(approvedUsersList);
      setLoadingUsers(false);
    } catch (err) {
      setUserError('Failed to fetch approved users');
      setLoadingUsers(false);
    }
  };

  const handleRoleFilter = (role) => {
    if (role === 'all') {
      setFilteredUsers(approvedUsers);
    } else {
      setFilteredUsers(approvedUsers.filter(user => user.role === role));
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
      
      fetchPendingUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject user';
      toast.error(errorMessage);
    }
  };

  const handleApproveSponsorshipRequest = async (opportunityId) => {
    setFundAllocationError(null);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
      };
      
      for (const allocation of packageAllocations) {
        if (allocation.amount < 0) {
          setFundAllocationError('Allocated funds cannot be negative');
          return;
        }
        
        if (allocation.amount > allocation.price) {
          setFundAllocationError(`Allocated funds for a package cannot exceed its price`);
          return;
        }
      }
      
      await axios.put(`/api/opportunities/${opportunityId}/sponsorship/approve`, {
        allocations: packageAllocations
      }, config);
      
      const totalAllocated = packageAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
      
      toast.success(`Sponsorship request approved with allocated funds for packages`);
      fetchPendingSponsorships();
      
      if (showModal) {
        setShowModal(false);
        setPackageAllocations([]);
      }
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

  const handleViewUserProfile = (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setSelectedUser(null);
  };

  const getSponsorById = (sponsorId) => {
    return interestedSponsors.find(sponsor => sponsor._id === sponsorId) || { 
      name: 'Unknown Sponsor', 
      company: 'Unknown Company' 
    };
  };
  
  const handleEditProfile = (userToEdit) => {
    setSelectedUser(userToEdit);
    setIsEditMode(true);
    setShowModal(true);
    
    setEditFormData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      club: userToEdit.club || '',
      company: userToEdit.company || '',
      industry: userToEdit.industry || '',
      department: userToEdit.department || '',
      position: userToEdit.position || ''
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const userData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone
      };
      
      if (selectedUser.role === 'user') {
        userData.club = editFormData.club;
        userData.position = editFormData.position;
      } else if (selectedUser.role === 'sponsor') {
        userData.company = editFormData.company;
        userData.industry = editFormData.industry;
        userData.position = editFormData.position;
      } else if (selectedUser.role === 'panel') {
        userData.department = editFormData.department;
        userData.position = editFormData.position;
      }
      
      await axios.put(`/api/users/${selectedUser._id}`, userData, config);
      
      toast.success('Profile updated successfully');
      
      fetchApprovedUsers();
      
      setIsEditMode(false);
      setShowModal(false);
      setSelectedUser(null);
      
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      setUpdateError(message);
      toast.error(message);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setUpdateError(null);
    
    if (!selectedUser) {
      setShowModal(false);
    }
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
            
            {/* Add filter dropdown */}
            <div className="filter-controls">
              <select 
                onChange={(e) => handlePendingUserRoleFilter(e.target.value)}
                value={pendingUserRoleFilter}
              >
                <option value="all">All Users</option>
                <option value="user">Regular Users</option>
                <option value="sponsor">Sponsors</option>
                <option value="panel">Panel Members</option>
              </select>
            </div>
            
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
                  {filteredPendingUsers.length > 0 ? (
                    filteredPendingUsers.map(pendingUser => (
                      <tr key={pendingUser._id}>
                        <td>{pendingUser.name}</td>
                        <td>{pendingUser.email}</td>
                        <td>{pendingUser.phone}</td>
                        <td>
                          <span className={`role-badge role-${pendingUser.role}`}>
                            {pendingUser.role === 'user' ? 'User' : 
                            pendingUser.role === 'panel' ? 'Panel Member' : 
                            pendingUser.role === 'sponsor' ? 'Sponsor' : 
                            pendingUser.role}
                          </span>
                        </td>
                        <td>{pendingUser.club || pendingUser.company || 'N/A'}</td>
                        <td>
                          <button 
                            className="btn-approve" 
                            onClick={() => handleApproveUser(pendingUser._id)}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button 
                            className="btn-reject" 
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
      case 'showProfiles':
        return (
          <div className="user-profiles">
            <h2>Approved User Profiles</h2>
            {loadingUsers ? (
              <p>Loading profiles...</p>
            ) : userError ? (
              <p className="error">{userError}</p>
            ) : approvedUsers.length > 0 ? (
              <div>
                <div className="filter-controls">
                  <select 
                    onChange={(e) => handleRoleFilter(e.target.value)}
                    defaultValue="all"
                  >
                    <option value="all">All Users</option>
                    <option value="user">User</option>
                    <option value="panel">Panel Members</option>
                    <option value="sponsor">Sponsors</option>
                  </select>
                </div>
                <table className="profile-requests-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Affiliated With</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(approvedUser => (
                        <tr key={approvedUser._id}>
                          <td>{approvedUser.name}</td>
                          <td>{approvedUser.email}</td>
                          <td>{approvedUser.phone || 'N/A'}</td>
                          <td>
                            <span className={`role-badge role-${approvedUser.role}`}>
                              {approvedUser.role === 'user' ? 'User' : 
                               approvedUser.role === 'panel' ? 'Panel Member' : 
                               approvedUser.role === 'sponsor' ? 'Sponsor' : 
                               approvedUser.role}
                            </span>
                          </td>
                          <td>{approvedUser.club || approvedUser.company || 'N/A'}</td>
                          <td>
                            <button 
                              className="btn-view-details" 
                              onClick={() => handleViewUserProfile(approvedUser)}
                            >
                              <i className="fas fa-user"></i> View Profile
                            </button>
                            <button 
                              className="btn-edit-profile" 
                              onClick={() => handleEditProfile(approvedUser)}
                            >
                              <i className="fas fa-edit"></i> Edit Profile
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
              </div>
            ) : (
              <div className="no-requests">
                <p>No approved users found.</p>
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
            <li
              className={activeTab === 'showProfiles' ? 'active' : ''}
              onClick={() => setActiveTab('showProfiles')}
            >
              <i className="fas fa-id-card"></i> Show Profiles
            </li>
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>

      {showModal && selectedRequest && !selectedUser && (
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
              
              {activeTab === 'sponsorshipApprovals' && selectedRequest.opportunity && selectedRequest.opportunity.packages && (
                <div className="fund-allocation-section">
                  <h3>Fund Allocation for Packages</h3>
                  <p>Allocate funds for each package:</p>
                  <div className="packages-allocation-container">
                    {selectedRequest.opportunity.packages.map((pkg, index) => (
                      <div key={index} className="package-allocation-item">
                        <h4>{pkg.name || `Package ${index + 1}`}</h4>
                        <div className="package-price-info">
                          <span className="package-price-label">Package Price:</span>
                          <span className="package-price-value">${pkg.price}</span>
                        </div>
                        <div className="fund-allocation-form">
                          <div className="form-group">
                            <label htmlFor={`allocation-${index}`}>Allocate Funds ($):</label>
                            <input 
                              type="number" 
                              id={`allocation-${index}`}
                              name={`allocation-${index}`}
                              min="0"
                              max={pkg.price}
                              value={packageAllocations[index]?.amount || 0}
                              onChange={(e) => handlePackageAllocationChange(index, e.target.value)}
                              className="funds-input"
                            />
                          </div>
                          <p className="fund-allocation-info">
                            <span className="allocation-label">Sponsor will contribute:</span>
                            <span className="allocation-value">
                              ${Math.max(0, pkg.price - (packageAllocations[index]?.amount || 0)).toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {fundAllocationError && (
                    <p className="error">{fundAllocationError}</p>
                  )}
                </div>
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

      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="profile-details-modal">
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit User Profile' : 'User Profile'}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              {isEditMode ? (
                <div className="edit-profile-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  {selectedUser.role === 'user' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="club">Club</label>
                        <input
                          type="text"
                          id="club"
                          name="club"
                          value={editFormData.club}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="position">Position</label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={editFormData.position}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'sponsor' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="company">Company</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={editFormData.company}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="industry">Industry</label>
                        <input
                          type="text"
                          id="industry"
                          name="industry"
                          value={editFormData.industry}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="position">Position</label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={editFormData.position}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'panel' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="department">Department</label>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          value={editFormData.department}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="position">Position</label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={editFormData.position}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                  {updateError && <p className="error">{updateError}</p>}
                  <div className="modal-actions">
                    <button
                      className="btn-save"
                      onClick={handleSaveProfile}
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-cancel" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="profile-section">
                    <h3>Personal Information</h3>
                    <div className="profile-detail-item">
                      <strong>Name:</strong>
                      <p>{selectedUser.name}</p>
                    </div>
                    <div className="profile-detail-item">
                      <strong>Email:</strong>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div className="profile-detail-item">
                      <strong>Phone:</strong>
                      <p>{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div className="profile-detail-item">
                      <strong>Role:</strong>
                      <p>{selectedUser.role === 'user' ? 'Users' : 
                          selectedUser.role === 'panel' ? 'Panel Member' : 
                          selectedUser.role === 'sponsor' ? 'Sponsor' : 
                          selectedUser.role}</p>
                    </div>
                  </div>

                  {selectedUser.role === 'user' && (
                    <div className="profile-section">
                      <h3>Club Information</h3>
                      <div className="profile-detail-item">
                        <strong>Club Name:</strong>
                        <p>{selectedUser.club || 'Not specified'}</p>
                      </div>
                      <div className="profile-detail-item">
                        <strong>Position:</strong>
                        <p>{selectedUser.position || 'Not specified'}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.role === 'sponsor' && (
                    <div className="profile-section">
                      <h3>Company Information</h3>
                      <div className="profile-detail-item">
                        <strong>Company:</strong>
                        <p>{selectedUser.company || 'Not specified'}</p>
                      </div>
                      <div className="profile-detail-item">
                        <strong>Industry:</strong>
                        <p>{selectedUser.industry || 'Not specified'}</p>
                      </div>
                      <div className="profile-detail-item">
                        <strong>Position:</strong>
                        <p>{selectedUser.position || 'Not specified'}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.role === 'panel' && (
                    <div className="profile-section">
                      <h3>Additional Information</h3>
                      <div className="profile-detail-item">
                        <strong>Department:</strong>
                        <p>{selectedUser.department || 'Not specified'}</p>
                      </div>
                      <div className="profile-detail-item">
                        <strong>Position:</strong>
                        <p>{selectedUser.position || 'Not specified'}</p>
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button className="btn-view-details" onClick={closeModal}>
                      <i className="fas fa-times-circle"></i> Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarDashboard;