import React, { useState, useEffect } from 'react'
import '../stylesheets/ViewMyProfile.css';
import '../stylesheets/PanelDashboard.css';
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'

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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('fundingProposals')
  
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Panel Dashboard';
    
    // Pre-fill club field if the user has club info
    if (user && user.club) {
      setFormData(prevState => ({
        ...prevState,
        club: user.club,
        contactPerson: user.name,
        contactEmail: user.email
      }))
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

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
        startingPrice: Number(formData.startingPrice),
        packages: formData.packages.map(pkg => ({
          ...pkg,
          price: Number(pkg.price)
        }))
      }

      await axios.post('/api/opportunities', formattedData, config)
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
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
                <label>Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Event Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Organizing Club</label>
                <input
                  type="text"
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expected Attendance</label>
                <input
                  type="text"
                  name="attendance"
                  value={formData.attendance}
                  onChange={handleChange}
                  required
                />
              </div>

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

              <div className="form-group">
                <label>Event Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Image (Optional)</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e)}
                />
                {formData.image && (
                  <div className="image-preview">
                    <img src={formData.image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
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
      
      <div className="dashboard-actions">
        <Link to="/profile" className="profile-link">
          <button type="button">View My Profile</button>
        </Link>
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
            {/* More menu items can be added here */}
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>
    </div>
  )
}

export default PanelDashboard