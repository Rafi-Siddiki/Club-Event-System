import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/SponsorDashboard.css';
import '../stylesheets/ViewMyProfile.css';
import { toast } from 'react-toastify';
import '../stylesheets/AnnouncementCard.css';

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
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [sponsorshipRecords, setSponsorshipRecords] = useState({ accepted: [], rejected: [] });
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState(null);

  useEffect(() => {
    document.title = 'Sponsor Dashboard';
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'sponsor') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'fundingProposals') {
      fetchOpportunities();
    } else if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'sponsorshipRecords') {
      fetchSponsorshipRecords();
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

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const response = await axios.get('/api/announcements', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const populatedAnnouncements = await Promise.all(
        response.data.map(async (announcement) => {
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
      setLoadingAnnouncements(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch announcements');
      setLoadingAnnouncements(false);
    }
  };

  const fetchSponsorshipRecords = async () => {
    if (!user?.token) return;
    setLoadingRecords(true);
    setRecordsError(null);
    try {
      // Get the records from the API
      const response = await axios.get('/api/opportunities/my-records', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      // Get the API response data
      let recordsData = response.data;
      
      // If we have opportunities data, ensure it's reflected in the records
      if (opportunities.length > 0) {
        // Find accepted opportunities that might not be in the API response
        const acceptedOpportunities = opportunities.filter(opp => 
          isApprovedForEntireProposal(opp) || 
          (opp.packages && opp.packages.some((_, index) => isApprovedForPackage(opp, index)))
        );
        
        // Find rejected opportunities that might not be in the API response
        const rejectedOpportunities = opportunities.filter(opp =>
          isRejectedForEntireProposal(opp) || 
          (opp.packages && opp.packages.some((_, index) => isRejectedForPackage(opp, index)))
        );
        
        // Process accepted opportunities to add to records if not already there
        const additionalAccepted = acceptedOpportunities
          .filter(opp => !recordsData.accepted.some(record => record._id === opp._id))
          .map(opp => {
            let detail = 'General Proposal';
            if (opp.packages) {
              const approvedPackages = opp.packages
                .filter((_, index) => isApprovedForPackage(opp, index))
                .map((pkg, index) => pkg.name || `Package ${index + 1}`);
              if (approvedPackages.length > 0) {
                detail = `Package(s): ${approvedPackages.join(', ')}`;
              }
            }
            return {
              _id: opp._id,
              name: opp.name,
              date: opp.date,
              status: 'Accepted',
              detail: detail
            };
          });

        // Process rejected opportunities to add to records if not already there
        const additionalRejected = rejectedOpportunities
          .filter(opp => !recordsData.rejected.some(record => record._id === opp._id))
          .map(opp => {
            let detail = 'General Proposal';
            if (opp.packages) {
              const rejectedPackages = opp.packages
                .filter((_, index) => isRejectedForPackage(opp, index))
                .map((pkg, index) => pkg.name || `Package ${index + 1}`);
              if (rejectedPackages.length > 0) {
                detail = `Package(s): ${rejectedPackages.join(', ')}`;
              }
            }
            return {
              _id: opp._id,
              name: opp.name,
              date: opp.date,
              status: 'Rejected',
              detail: detail
            };
          });

        // Add additional records to the API response data
        if (additionalAccepted.length > 0) {
          recordsData = {
            ...recordsData,
            accepted: [...recordsData.accepted, ...additionalAccepted]
          };
        }
        
        if (additionalRejected.length > 0) {
          recordsData = {
            ...recordsData,
            rejected: [...recordsData.rejected, ...additionalRejected]
          };
        }
        
        console.log(`Added ${additionalAccepted.length} accepted and ${additionalRejected.length} rejected opportunities to records`);
      }
      
      // Set the records in state
      setSponsorshipRecords(recordsData);
      
    } catch (err) {
      console.error('Failed to fetch sponsorship records:', err);
      const message = err.response?.data?.message || 'Failed to fetch sponsorship records. Please try again later.';
      setRecordsError(message);
      toast.error(message);
    } finally {
      setLoadingRecords(false);
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

  const logRejectionData = (opportunity) => {
    // Only log for development purposes
    if (opportunity && opportunity.sponsorshipContributionApproval && 
        opportunity.sponsorshipContributionApproval.status === 'declined') {
      console.log("Found declined opportunity:", {
        opportunityId: opportunity._id,
        opportunityName: opportunity.name,
        user: user?._id,
        rejectedSponsorId: opportunity.sponsorshipContributionApproval.rejectedSponsorId
      });
    }
  };

  const handleExpressInterest = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.post(`/api/opportunities/${opportunityId}/interest`, {}, config);
      toast.success('Interest expressed successfully. Your request will be reviewed by a registrar.');

      fetchOpportunities();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to express interest';
      toast.error(errorMessage);
    }
  };

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

      setInterestedPackages([
        ...interestedPackages,
        { opportunityId, packageIndex }
      ]);

      toast.success('Interest expressed in this sponsorship package. Your request will be reviewed by a registrar.');

      fetchOpportunities();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to express interest in package';
      toast.error(errorMessage);
    }
  };

  const hasExpressedInterest = (opportunity) => {
    return user && 
           user._id && 
           opportunity.interestedSponsors && 
           Array.isArray(opportunity.interestedSponsors) && 
           opportunity.interestedSponsors.includes(user._id);
  };

  const hasExpressedInterestInPackage = (opportunityId, packageIndex) => {
    if (!user || !user._id) return false;
    return interestedPackages.some(
      item => item.opportunityId === opportunityId && item.packageIndex === packageIndex
    );
  };

  const isApprovedForEntireProposal = (opportunity) => {
    if (!user || !user._id) return false;
    return opportunity.sponsorshipContributionApproval && 
           opportunity.sponsorshipContributionApproval.status === 'approved' &&
           opportunity.sponsorshipContributionApproval.approvedSponsorId === user._id;
  };

  // Check if the current sponsor's general interest was rejected for the entire proposal
  const isRejectedForEntireProposal = (opportunity) => {
    if (!user || !user._id) return false;
    
    // Check if the opportunity's sponsorshipContributionApproval has declined status
    if (opportunity.sponsorshipContributionApproval && 
        opportunity.sponsorshipContributionApproval.status === 'declined') {
      
      // For safety, check if rejectedSponsorId exists before comparing
      if (opportunity.sponsorshipContributionApproval.rejectedSponsorId) {
        try {
          // Try string comparison (safer approach)
          const rejectedId = String(opportunity.sponsorshipContributionApproval.rejectedSponsorId);
          const currentUserId = String(user._id);
          
          if (rejectedId === currentUserId) {
            return true;
          }
        } catch (e) {
          console.error("Error comparing IDs:", e);
        }
      }
    }
    
    // Also check rejectedSponsorsNotifications for rejection with packageIndex = -1
    return opportunity.rejectedSponsorsNotifications && 
           opportunity.rejectedSponsorsNotifications.some(notification => {
             if (!notification.sponsorId) return false;
             
             try {
               // Try string comparison
               return String(notification.sponsorId) === String(user._id) && 
                      notification.packageIndex === -1;
             } catch (e) {
               console.error("Error comparing notification IDs:", e);
               return false;
             }
           });
  };

  const isApprovedForPackage = (opportunity, packageIndex) => {
    if (isApprovedForEntireProposal(opportunity)) return true;

    if (!user || !user._id) return false;
    return opportunity.approvedPackageSponsors && 
           opportunity.approvedPackageSponsors.some(
             approval => approval.packageIndex === packageIndex && 
                        approval.sponsorId === user._id
           );
  };

  const isRejectedForPackage = (opportunity, packageIndex) => {
    if (!user || !user._id) return false;
    return opportunity.rejectedSponsorsNotifications && 
           opportunity.rejectedSponsorsNotifications.some(
             notification => notification.packageIndex === packageIndex && 
                            notification.sponsorId === user._id
           );
  };

  const isPackageAlreadyTaken = (opportunity, packageIndex) => {
    if (!user || !user._id) return false;
    return opportunity.approvedPackageSponsors && 
           opportunity.approvedPackageSponsors.some(
             approval => approval.packageIndex === packageIndex && 
                        approval.sponsorId !== user._id
           );
  };

  const areAllPackagesAvailableForInterest = (opportunity) => {
    if (!user || !user._id) return false;

    if (opportunity.sponsorshipContributionApproval && 
        opportunity.sponsorshipContributionApproval.status === 'approved') {
      if (opportunity.sponsorshipContributionApproval.approvedSponsorId === user._id) {
        return false;
      }

      return false;
    }
    
    // Check if this user was generally rejected for this proposal
    if (opportunity.rejectedSponsorsNotifications && 
        opportunity.rejectedSponsorsNotifications.some(
          notification => notification.sponsorId === user._id && notification.packageIndex === -1
        )) {
      return false;
    }

    if (!opportunity.packages || opportunity.packages.length === 0) {
      return true;
    }

    for (let i = 0; i < opportunity.packages.length; i++) {
      if (isApprovedForPackage(opportunity, i)) {
        return false;
      }

      if (isRejectedForPackage(opportunity, i)) {
        return false;
      }

      if (isPackageAlreadyTaken(opportunity, i)) {
        return false;
      }

      if (hasExpressedInterestInPackage(opportunity._id, i)) {
        return false;
      }
    }

    return true;
  };

  const getPackageButtonStatus = (opportunity, packageIndex) => {
    if (isApprovedForPackage(opportunity, packageIndex)) {
      return {
        className: "btn-success",
        disabled: true,
        text: "Approved",
      };
    }

    if (isRejectedForPackage(opportunity, packageIndex)) {
      return {
        className: "btn-rejected",
        disabled: true,
        text: "Rejected",
      };
    }

    if (isPackageAlreadyTaken(opportunity, packageIndex)) {
      return {
        className: "btn-disabled",
        disabled: true,
        text: "This proposal is already taken",
      };
    }

    if (hasExpressedInterestInPackage(opportunity._id, packageIndex)) {
      return {
        className: "btn-disabled",
        disabled: true,
        text: "Interest Expressed",
      };
    }

    return {
      className: "btn-approve",
      disabled: false,
      text: "Express Interest",
    };
  };

  const handleViewSponsorshipRecords = () => {
    setActiveTab('sponsorshipRecords');
    fetchSponsorshipRecords();
  };

  const renderTabContent = () => {
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
                    {logRejectionData(opportunity)}
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
                      ) : isRejectedForEntireProposal(opportunity) ? (
                        <button className="btn-rejected" disabled>Rejected For Entire Proposal</button>
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
                      {(isApprovedForEntireProposal(opportunity) || 
                        isRejectedForEntireProposal(opportunity) ||
                        (opportunity.packages && opportunity.packages.some((_, index) => 
                          isApprovedForPackage(opportunity, index) || isRejectedForPackage(opportunity, index)
                        ))) && (
                        <button 
                          className="btn-view-records" 
                          onClick={handleViewSponsorshipRecords}
                        >
                          View Sponsorship Records
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
      case 'announcements':
        return (
          <div className="announcements-section">
            <h2>Event Announcements</h2>
            {loadingAnnouncements ? (
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
      case 'sponsorshipRecords':
        const acceptedRecords = sponsorshipRecords?.accepted || [];
        const rejectedRecords = sponsorshipRecords?.rejected || [];

        return (
          <div className="sponsorship-records-section">
            <h2>My Sponsorship Records</h2>
            {loadingRecords ? (
              <p>Loading records...</p>
            ) : recordsError ? (
              <p className="error">{recordsError}</p>
            ) : (
              <>
                <div className="records-subsection">
                  <h3>Accepted Sponsorships</h3>
                  {acceptedRecords.length > 0 ? (
                    <div className="records-list-cards">
                      {acceptedRecords.map((record) => (
                        <div key={record._id} className="record-card accepted-card">
                          <h4>{record.name}</h4>
                          <p>Date: {new Date(record.date).toLocaleDateString()}</p>
                          <p>Status: <span className="status-accepted">Accepted</span></p>
                          <p>Details: {record.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No accepted sponsorships found.</p>
                  )}
                </div>
                <div className="records-subsection">
                  <h3>Rejected Sponsorships</h3>
                  {rejectedRecords.length > 0 ? (
                    <div className="records-list-cards">
                      {rejectedRecords.map((record) => (
                        <div key={record._id} className="record-card rejected-card">
                          <h4>{record.name}</h4>
                          <p>Date: {new Date(record.date).toLocaleDateString()}</p>
                          <p>Status: <span className="status-rejected">Rejected</span></p>
                          <p>Details: {record.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No rejected sponsorships found.</p>
                  )}
                </div>
              </>
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
            <li
              className={activeTab === 'announcements' ? 'active' : ''}
              onClick={() => setActiveTab('announcements')}
            >
              <i className="fas fa-bullhorn"></i> Announcements
            </li>
            <li
              className={activeTab === 'sponsorshipRecords' ? 'active' : ''}
              onClick={() => setActiveTab('sponsorshipRecords')}
            >
              <i className="fas fa-history"></i> Sponsorship Records
            </li>
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>

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
                          
                          {(isApprovedForPackage(selectedOpportunity, index) || 
                            isRejectedForPackage(selectedOpportunity, index)) && (
                            <button 
                              className="btn-view-records" 
                              onClick={handleViewSponsorshipRecords}
                            >
                              View In Records
                            </button>
                          )}
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
