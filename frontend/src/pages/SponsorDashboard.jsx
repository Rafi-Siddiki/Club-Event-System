import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/SponsorDashboard.css';
import '../stylesheets/ViewMyProfile.css';
import { toast } from 'react-toastify';

function SponsorDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('fundingProposals');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [interestedPackages, setInterestedPackages] = useState([]);

  useEffect(() => {
    // Set page title
    document.title = 'Sponsor Dashboard';
  }, []);

  useEffect(() => {
    // Protect this route - only sponsors can access
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'sponsor') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Fetch opportunities when the component mounts or the active tab changes to funding proposals
    if (activeTab === 'fundingProposals') {
      fetchOpportunities();
    }
  }, [activeTab]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/opportunities', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setOpportunities(response.data);
      
      // Fetch the user's interested packages
      const interestResponse = await axios.get('/api/opportunities/interested-packages', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (interestResponse.data) {
        setInterestedPackages(interestResponse.data);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch funding opportunities');
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

  // Handle expressing interest in a proposal
  const handleExpressInterest = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post(`/api/opportunities/${opportunityId}/interest`, {}, config);
      toast.success('Interest expressed successfully. Your request will be reviewed by a registrar.');
      
      // Refresh the opportunities list
      fetchOpportunities();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to express interest';
      toast.error(errorMessage);
    }
  };

  // Handle expressing interest in a specific package
  const handleExpressInterestInPackage = async (opportunityId, packageIndex) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post(`/api/opportunities/${opportunityId}/interest`, { 
        packageIndex 
      }, config);
      
      // Update local state to immediately reflect the interest
      setInterestedPackages([
        ...interestedPackages,
        { opportunityId, packageIndex }
      ]);
      
      toast.success('Interest expressed in this sponsorship package. Your request will be reviewed by a registrar.');
      
      // Refresh the opportunities list
      fetchOpportunities();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to express interest in package';
      toast.error(errorMessage);
    }
  };

  // Check if user has already expressed interest
  const hasExpressedInterest = (opportunity) => {
    return user && 
           user._id && 
           opportunity.interestedSponsors && 
           Array.isArray(opportunity.interestedSponsors) && 
           opportunity.interestedSponsors.includes(user._id);
  };

  // Check if user has expressed interest in a specific package
  const hasExpressedInterestInPackage = (opportunityId, packageIndex) => {
    if (!user || !user._id) return false;
    return interestedPackages.some(
      item => item.opportunityId === opportunityId && item.packageIndex === packageIndex
    );
  };

  // Check if the current sponsor is approved for the entire proposal
  const isApprovedForEntireProposal = (opportunity) => {
    if (!user || !user._id) return false;
    return opportunity.sponsorshipContributionApproval && 
           opportunity.sponsorshipContributionApproval.status === 'approved' &&
           opportunity.sponsorshipContributionApproval.approvedSponsorId === user._id;
  };

  // Check if the current user is approved for a specific package
  const isApprovedForPackage = (opportunity, packageIndex) => {
    // If sponsor is approved for entire proposal, they're approved for all packages
    if (isApprovedForEntireProposal(opportunity)) return true;
    
    if (!user || !user._id) return false;
    return opportunity.approvedPackageSponsors && 
           opportunity.approvedPackageSponsors.some(
             approval => approval.packageIndex === packageIndex && 
                        approval.sponsorId === user._id
           );
  };

  // Check if the current user's interest was rejected for a specific package
  const isRejectedForPackage = (opportunity, packageIndex) => {
    if (!user || !user._id) return false;
    return opportunity.rejectedSponsorsNotifications && 
           opportunity.rejectedSponsorsNotifications.some(
             notification => notification.packageIndex === packageIndex && 
                            notification.sponsorId === user._id
           );
  };

  // Check if a package is already taken by another sponsor
  const isPackageAlreadyTaken = (opportunity, packageIndex) => {
    if (!user || !user._id) return false;
    return opportunity.approvedPackageSponsors && 
           opportunity.approvedPackageSponsors.some(
             approval => approval.packageIndex === packageIndex && 
                        approval.sponsorId !== user._id
           );
  };

  // Check if all packages in the opportunity are available for expressing interest
  // If any package is in a state other than "available to express interest", return false
  const areAllPackagesAvailableForInterest = (opportunity) => {
    if (!user || !user._id) return false; // If no user, don't allow expressing interest
    
    // If this entire proposal is already approved for someone (either this sponsor or another)
    if (opportunity.sponsorshipContributionApproval && 
        opportunity.sponsorshipContributionApproval.status === 'approved') {
      // If this sponsor is approved for the whole proposal, they can't express interest again
      if (opportunity.sponsorshipContributionApproval.approvedSponsorId === user._id) {
        return false;
      }
      
      // If another sponsor is approved for the entire proposal, no one else can express interest
      return false;
    }
    
    // Check if this user was generally rejected for this proposal
    if (opportunity.rejectedSponsorsNotifications && 
        opportunity.rejectedSponsorsNotifications.some(
          notification => notification.sponsorId === user._id && notification.packageIndex === -1
        )) {
      return false;
    }
    
    // If there are no packages, allow general interest
    if (!opportunity.packages || opportunity.packages.length === 0) {
      return true;
    }

    // Check status of each package
    for (let i = 0; i < opportunity.packages.length; i++) {
      // If current user is approved for this package
      if (isApprovedForPackage(opportunity, i)) {
        return false;
      }
      
      // If current user's interest was rejected for this package
      if (isRejectedForPackage(opportunity, i)) {
        return false;
      }
      
      // If this package is already taken by another sponsor
      if (isPackageAlreadyTaken(opportunity, i)) {
        return false;
      }
      
      // If user has expressed interest but no decision yet
      if (hasExpressedInterestInPackage(opportunity._id, i)) {
        return false;
      }
    }
    
    // All packages are available for expressing interest
    return true;
  };

  // Get package interest button status and text
  const getPackageButtonStatus = (opportunity, packageIndex) => {
    // If current user is approved for this package
    if (isApprovedForPackage(opportunity, packageIndex)) {
      return {
        className: "btn-success",
        disabled: true,
        text: "Approved",
      };
    }
    
    // If current user's interest was rejected for this package
    if (isRejectedForPackage(opportunity, packageIndex)) {
      return {
        className: "btn-rejected",
        disabled: true,
        text: "Rejected",
      };
    }
    
    // If this package is already taken by another sponsor
    if (isPackageAlreadyTaken(opportunity, packageIndex)) {
      return {
        className: "btn-disabled",
        disabled: true,
        text: "This proposal is already taken",
      };
    }
    
    // If user has expressed interest but no decision yet
    if (hasExpressedInterestInPackage(opportunity._id, packageIndex)) {
      return {
        className: "btn-disabled",
        disabled: true,
        text: "Interest Expressed",
      };
    }

    // Default: user can express interest
    return {
      className: "btn-approve",
      disabled: false,
      text: "Express Interest",
    };
  };

  const renderTabContent = () => {
    // If user is null (during logout), render nothing to prevent errors
    if (!user) {
      return <div>Logging out...</div>;
    }

    switch (activeTab) {
      case 'fundingProposals':
        return (
          <div className="funding-proposals">
            <h2>Funding Opportunities</h2>
            {loading ? (
              <p>Loading opportunities...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : opportunities.length > 0 ? (
              <div className="proposals-list">
                {opportunities.map((opportunity) => (
                  <div key={opportunity._id} className="proposal-card">
                    <h3>{opportunity.name}</h3>
                    <p>{opportunity.description}</p>
                    <div className="proposal-details">
                      <span>Starting Price: ${opportunity.startingPrice}</span>
                      <span>Date: {new Date(opportunity.date).toLocaleDateString()}</span>
                    </div>
                    <div className="proposal-details">
                      <span>Club: {opportunity.club}</span>
                      <span>Attendance: {opportunity.attendance}</span>
                    </div>
                    <div className="proposal-details">
                      <span>Status: {opportunity.status}</span>
                      <span>Location: {opportunity.location}</span>
                    </div>
                    <div className="proposal-actions">
                      <button className="btn-view" onClick={() => handleViewDetails(opportunity)}>View Details</button>
                      {isApprovedForEntireProposal(opportunity) ? (
                        <button className="btn-success" disabled>Approved For Entire Proposal</button>
                      ) : hasExpressedInterest(opportunity) ? (
                        <button className="btn-disabled" disabled>Interest Expressed</button>
                      ) : !areAllPackagesAvailableForInterest(opportunity) ? (
                        <button className="btn-disabled" disabled>Cannot Express Interest</button>
                      ) : (
                        <button 
                          className="btn-approve" 
                          onClick={() => handleExpressInterest(opportunity._id)}
                        >
                          Express Interest
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-opportunities">
                <p>No approved funding opportunities available at the moment.</p>
                <p className="note">Funding proposals must be approved by a registrar before they appear here.</p>
              </div>
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
        <p>Sponsor Dashboard</p>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          <ul>
            <li
              className={activeTab === 'fundingProposals' ? 'active' : ''}
              onClick={() => setActiveTab('fundingProposals')}
            >
              <i className="fas fa-money-check"></i> Funding Opportunities
            </li>
            {/* More menu items can be added here */}
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>

      {/* Event Details Modal - Only render when showModal is true, selectedOpportunity exists, and user exists */}
      {showModal && selectedOpportunity && user && (
        <div className="modal-overlay">
          <div className="event-details-modal">
            <div className="modal-header">
              <h2>{selectedOpportunity.name}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
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
              <div className="event-detail-row">
                <div className="event-detail-item">
                  <strong>Starting Price:</strong>
                  <p>${selectedOpportunity.startingPrice}</p>
                </div>
                <div className="event-detail-item">
                  <strong>Status:</strong>
                  <p>{selectedOpportunity.status}</p>
                </div>
              </div>
              
              {/* Display registrar allocated funds information if available */}
              {selectedOpportunity.sponsorshipRequestApproval?.status === 'approved' && 
               selectedOpportunity.packages && selectedOpportunity.packages.length > 0 && (
                <div className="funding-allocation-info">
                  <h3>Funding Allocation</h3>
                  <div className="allocation-details">
                    <div className="allocation-item">
                      <span className="allocation-label">Total Funding Required:</span>
                      <span className="allocation-value">
                        ${selectedOpportunity.packages.reduce((sum, pkg) => sum + pkg.price, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="allocation-item registrar-contribution">
                      <span className="allocation-label">Registrar Contribution:</span>
                      <span className="allocation-value">
                        ${selectedOpportunity.packages.reduce((sum, pkg) => sum + (pkg.registrarFunds || 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="allocation-item sponsor-contribution">
                      <span className="allocation-label">Your Contribution:</span>
                      <span className="allocation-value">
                        ${selectedOpportunity.packages.reduce((sum, pkg) => 
                          sum + (pkg.price - (pkg.registrarFunds || 0)), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Display available sponsorship packages */}
              {selectedOpportunity.packages && selectedOpportunity.packages.length > 0 ? (
                <>
                  <h3>Sponsorship Packages</h3>
                  <div className="packages-container">
                    {selectedOpportunity.packages.map((pkg, index) => {
                      const { className, disabled, text } = getPackageButtonStatus(selectedOpportunity, index);
                      return (
                        <div key={index} className="package-item">
                          <h4>{pkg.name || `Package ${index + 1}`}</h4>
                          <div className="package-detail">
                            <strong>Price:</strong>
                            <p>${pkg.price}</p>
                          </div>
                          {/* Display allocated funds information for this package */}
                          {selectedOpportunity.sponsorshipRequestApproval?.status === 'approved' && pkg.registrarFunds > 0 && (
                            <div className="package-funding-allocation">
                              <div className="package-fund-detail registrar-contribution">
                                <strong>Registrar Contribution:</strong>
                                <span>${pkg.registrarFunds}</span>
                              </div>
                              <div className="package-fund-detail sponsor-contribution">
                                <strong>Your Contribution:</strong>
                                <span>${Math.max(0, pkg.price - pkg.registrarFunds).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          <div className="package-detail">
                            <strong>Benefits:</strong>
                            <ul>
                              {pkg.benefits && Array.isArray(pkg.benefits) ? 
                                pkg.benefits.map((benefit, i) => (
                                  <li key={i}>{benefit}</li>
                                )) : 
                                <li>No benefits listed</li>
                              }
                            </ul>
                          </div>
                          <button 
                            className={className}
                            onClick={() => handleExpressInterestInPackage(selectedOpportunity._id, index)}
                            disabled={disabled}
                          >
                            {text}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="no-packages">
                  <p>No sponsorship packages are available for this event.</p>
                </div>
              )}
              
              <div className="modal-actions">
                <button className="btn-view" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorDashboard;
