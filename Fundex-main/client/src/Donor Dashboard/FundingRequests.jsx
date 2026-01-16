// client/src/pages/FundingRequests.jsx
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Heart,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Eye,
  MapPin,
  Calendar,
  Users,
  X,
  FileText,
  Image as ImageIcon,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import API from "../services/api";
import StripePayment from "../components/StripePayment";
import "./FundingRequests.css";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51SeKGuHLl699duSoYB7kPPA0EWESi15vZcTIKhqtdhbYBOOjxXgNeQ7JiXq0WXoN2XoF0H1QyHzwOqzgF2hr7HEv00j3qD6R0R'); // Replace with your actual key

export default function FundingRequests({
  darkMode,
  setDarkMode,
  reloadDashboard,
  donorName,
  activeTab,
  setActiveTab
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  // activeTab state removed as it is now a prop
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Fetch funding requests from API
  useEffect(() => {
    const fetchFundingRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get logged-in user
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('Please login to view funding requests');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id || user._id;

        console.log('🔍 Fetching donation requests for donor:', userId);

        // Fetch donation requests specific to this donor
        const response = await API.get(`/donationrequests/donor/${userId}`, {
          params: {
            status: selectedStatus === 'all' ? undefined : selectedStatus
          }
        });

        console.log('📥 Received donation requests:', response.data);

        if (response.data.success) {
          // Transform the API data to match the UI structure
          const transformedData = response.data.data.map(request => {
            const campaign = request.campaignId || {};

            return {
              id: request._id,
              ngoName: request.ngoName || 'NGO',
              purpose: campaign.title || 'Funding Request',
              description: campaign.description || request.message || 'No description available',
              category: campaign.category || 'General',
              requestedAmount: request.requestedAmount,
              fundedAmount: request.donatedAmount || 0,
              progress: request.donatedAmount ? Math.round((request.donatedAmount / request.requestedAmount) * 100) : 0,
              status: request.status,
              urgency: request.urgency,
              location: campaign.location
                ? `${campaign.location.city || ''}, ${campaign.location.state || 'India'}`.trim().replace(/^,\s*/, '')
                : 'India',
              deadline: request.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              volunteersAssigned: 0,
              receiptsSubmitted: 0,
              aiSummary: request.message || `Funding request from ${request.ngoName} for ${campaign.title}`,
              images: campaign.coverImage ? [campaign.coverImage] : [],
              impact: `Support ${campaign.title} campaign`,
              donationRequestId: request._id,
              campaignId: request.campaignId?._id,
              ngoId: request.ngoId,
              requestDate: request.requestDate || request.createdAt
            };
          });

          console.log('✅ Transformed data:', transformedData.length, 'requests');
          setFundingRequests(transformedData);
        } else {
          setError(response.data.message || 'Failed to fetch funding requests');
        }
      } catch (err) {
        console.error('❌ Error fetching funding requests:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load funding requests');
      } finally {
        setLoading(false);
      }
    };

    fetchFundingRequests();
  }, [selectedStatus]);

  const categories = [
    "all",
    "Healthcare",
    "Education",
    "Food & Nutrition",
    "Water & Sanitation",
    "Animal Welfare",
    "Environment",
  ];
  const statuses = ["all", "active", "completed", "urgent"];

  // Filter logic
  const filteredRequests = fundingRequests.filter((request) => {
    const matchesSearch =
      request.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.ngoName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || request.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "urgent" && request.urgency === "high") ||
      request.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDonate = (request) => {
    setSelectedRequest(request);
    setDonationAmount("");
    setShowPaymentForm(false);
  };

  const handleContinueToPayment = () => {
    if (!donationAmount || donationAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    alert(`✅ Donation successful!\n\nTransaction ID: ${paymentData.transactionId}\nAmount: ₹${paymentData.amount}\n\nThank you for your generous donation!`);

    setSelectedRequest(null);
    setDonationAmount("");
    setShowPaymentForm(false);

    if (reloadDashboard) {
      reloadDashboard();
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setDonationAmount("");
    setShowPaymentForm(false);
  };

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo-text">Fundex</h1>
            <span className="logo-subtitle">Donor Portal</span>
          </div>

          <div className="header-actions">
            <button className="notification-btn">
              <AlertCircle size={20} />
              <span className="notification-badge">3</span>
            </button>

            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? "Light" : "Dark"} Mode</span>
            </button>

            <div className="user-profile">
              <div className="avatar">
                {donorName ? donorName[0].toUpperCase() : "D"}
              </div>
              <span className="user-name">{donorName || "Donor"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Funding Requests
        </button>
        <button
          className={`nav-tab ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          My Donations
        </button>
        <button
          className={`nav-tab ${activeTab === "find-campaigns" ? "active" : ""}`}
          onClick={() => setActiveTab("find-campaigns")}
        >
          Find Campaigns
        </button>
        <button
          className={`nav-tab ${activeTab === "impact" ? "active" : ""}`}
          onClick={() => setActiveTab("impact")}
        >
          Impact Report
        </button>
      </nav>

      <div className="funding-requests-wrapper">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-text">
            <h1 className="page-title">Funding Requests</h1>
            <p className="page-subtitle">
              Support transparent NGO initiatives and track every rupee with
              AI-powered verification
            </p>
          </div>

          <div className="header-stats">
            <div className="header-stat-item">
              <span className="stat-number">{fundingRequests.length}</span>
              <span className="stat-label">Active Campaigns</span>
            </div>
            <div className="header-stat-item">
              <span className="stat-number">
                ₹
                {fundingRequests
                  .reduce((acc, req) => acc + req.fundedAmount, 0)
                  .toLocaleString()}
              </span>
              <span className="stat-label">Total Funded</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="filter-bar">
          <div className="search-container">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by purpose or NGO name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {(selectedCategory !== "all" || selectedStatus !== "all") && (
              <span className="filter-active-badge"></span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <div className="filter-chips">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`filter-chip ${selectedCategory === category ? "active" : ""
                      }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === "all" ? "All Categories" : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="filter-chips">
                {statuses.map((status) => (
                  <button
                    key={status}
                    className={`filter-chip ${selectedStatus === status ? "active" : ""
                      }`}
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status === "all"
                      ? "All Status"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="results-info">
          <p className="results-text">
            Showing <strong>{filteredRequests.length}</strong> funding{" "}
            {filteredRequests.length === 1 ? "request" : "requests"}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Loading funding requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-state" style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#fee',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            <AlertCircle size={48} color="#d00" style={{ marginBottom: '10px' }} />
            <h3>Error Loading Requests</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Funding Requests Grid */}
        {!loading && !error && (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request.id} className="funding-card">
                {/* Urgency Badge */}
                {request.urgency === "high" && (
                  <div className="urgency-badge">
                    <AlertTriangle size={14} />
                    Urgent
                  </div>
                )}

                {/* Card Header */}
                <div className="card-header">
                  <div className="ngo-info">
                    <h3 className="ngo-name">{request.ngoName}</h3>
                    <span className="category-tag">{request.category}</span>
                  </div>
                  <button className="favorite-btn">
                    <Heart size={20} />
                  </button>
                </div>

                {/* Purpose */}
                <h4 className="request-purpose">{request.purpose}</h4>
                <p className="request-description">{request.description}</p>

                {/* Location and Deadline */}
                <div className="request-meta">
                  <div className="meta-item">
                    <MapPin size={14} />
                    <span>{request.location}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>By {new Date(request.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="funding-progress">
                  <div className="progress-header">
                    <div className="amount-raised">
                      <span className="amount-label">Raised</span>
                      <span className="amount-value">
                        ₹{request.fundedAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="amount-goal">
                      <span className="amount-label">Goal</span>
                      <span className="amount-value">
                        ₹{request.requestedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-container">
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill ${request.progress === 100 ? "completed" : ""
                          }`}
                        style={{ width: `${request.progress}%` }}
                      />
                    </div>
                    <span className="progress-percentage">
                      {request.progress}%
                    </span>
                  </div>
                </div>

                {/* Transparency Indicators */}
                <div className="transparency-section">
                  <div className="transparency-item">
                    <Users size={14} />
                    <span>{request.volunteersAssigned} Volunteers</span>
                  </div>
                  <div className="transparency-item">
                    <FileText size={14} />
                    <span>{request.receiptsSubmitted} Receipts</span>
                  </div>
                  <div className="transparency-item">
                    <ImageIcon size={14} />
                    <span>{request.images.length} Photos</span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="ai-summary">
                  <div className="ai-badge">AI Verified</div>
                  <p className="ai-text">{request.aiSummary}</p>
                </div>

                {/* Impact Statement */}
                <div className="impact-statement">
                  <TrendingUp size={16} />
                  <span>{request.impact}</span>
                </div>

                {/* Action Buttons */}
                <div className="card-actions">
                  <button
                    className="btn-view-details"
                    onClick={() => alert(`View details for: ${request.purpose}`)}
                  >
                    <Eye size={16} />
                    View Details
                  </button>

                  {request.status === "active" ? (
                    <button
                      className="btn-donate"
                      onClick={() => handleDonate(request)}
                    >
                      <DollarSign size={16} />
                      Donate Now
                    </button>
                  ) : (
                    <button className="btn-completed" disabled>
                      <CheckCircle size={16} />
                      Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRequests.length === 0 && (
          <div className="empty-state">
            <Search size={48} />
            <h3>No funding requests found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}

        {/* Donation Modal */}
        {selectedRequest && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content payment-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>

              {!showPaymentForm ? (
                // Amount Selection Screen
                <>
                  <h2 className="modal-title">Support This Campaign</h2>
                  <p className="modal-subtitle">{selectedRequest.purpose}</p>

                  <div className="modal-campaign-info">
                    <div className="modal-info-item">
                      <span className="info-label">NGO</span>
                      <span className="info-value">{selectedRequest.ngoName}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Remaining</span>
                      <span className="info-value">
                        ₹
                        {(
                          selectedRequest.requestedAmount -
                          selectedRequest.fundedAmount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="donation-input-group">
                    <label className="input-label">Donation Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="donation-input"
                      min="1"
                    />
                  </div>

                  <div className="quick-amounts">
                    {[500, 1000, 2000, 5000].map((amount) => (
                      <button
                        key={amount}
                        className="quick-amount-btn"
                        onClick={() => setDonationAmount(amount.toString())}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button className="btn-cancel" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="btn-confirm-donate"
                      onClick={handleContinueToPayment}
                      disabled={!donationAmount || donationAmount <= 0}
                    >
                      <DollarSign size={18} />
                      Continue to Payment
                    </button>
                  </div>

                  <p className="modal-note">
                    You'll receive a digital receipt and real-time updates on how
                    your donation is used.
                  </p>
                </>
              ) : (
                // Stripe Payment Screen
                <Elements stripe={stripePromise}>
                  <StripePayment
                    amount={parseInt(donationAmount)}
                    donationRequestId={selectedRequest.donationRequestId || selectedRequest.id}
                    ngoId={selectedRequest.ngoId}
                    campaignTitle={selectedRequest.purpose}
                    ngoName={selectedRequest.ngoName}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
