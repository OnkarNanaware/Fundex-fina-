// client/src/pages/FindCampaigns.jsx
import { useState, useEffect } from "react";
import {
  Search, Filter, SlidersHorizontal, MapPin, Clock, TrendingUp,
  Users, Target, Heart, Share2, Bookmark, ChevronDown, X,
  DollarSign, Award, Zap, CheckCircle, Activity,
  GraduationCap, Droplet, Utensils, Leaf, Grid, List, Loader
} from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { campaignService } from "../services/campaignService";
import StripePayment from "../components/StripePayment";
import "./FindCampaigns.css";

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51SeKGuHLl699duSoYB7kPPA0EWESi15vZcTIKhqtdhbYBOOjxXgNeQ7JiXq0WXoN2XoF0H1QyHzwOqzgF2hr7HEv00j3qD6R0R');

// Category Icon Mapping
const categoryIcons = {
  "Healthcare": Activity,
  "Education": GraduationCap,
  "Food & Nutrition": Utensils,
  "Water & Sanitation": Droplet,
  "Environment": Leaf,
  "Animal Welfare": Heart
};

export default function FindCampaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("trending");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [investAmount, setInvestAmount] = useState("");
  const [bookmarkedCampaigns, setBookmarkedCampaigns] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Data states
  const [campaigns, setCampaigns] = useState([]);
  const [campaignStats, setCampaignStats] = useState({
    totalCampaigns: 0,
    totalBackers: 0,
    totalRaised: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: ['all'],
    locations: ['all'],
    ngos: [],
    urgencyLevels: ['all', 'high', 'medium', 'low'],
    fundingRanges: []
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCampaigns: 0,
    hasMore: false
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    category: "all",
    urgency: "all",
    location: "all",
    fundingRange: "all",
    ngoId: "all"
  });

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
    fetchCampaignStats();
  }, []);

  // Fetch campaigns when filters/search/sort changes
  useEffect(() => {
    fetchCampaigns();
  }, [filters, searchQuery, sortBy, pagination.currentPage]);

  const fetchFilterOptions = async () => {
    try {
      const response = await campaignService.getFilterOptions();
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchCampaignStats = async () => {
    try {
      const response = await campaignService.getCampaignStats();
      setCampaignStats(response.data);
    } catch (err) {
      console.error('Error fetching campaign stats:', err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        search: searchQuery || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        urgency: filters.urgency !== 'all' ? filters.urgency : undefined,
        location: filters.location !== 'all' ? filters.location : undefined,
        fundingRange: filters.fundingRange !== 'all' ? filters.fundingRange : undefined,
        ngoId: filters.ngoId !== 'all' ? filters.ngoId : undefined,
        sortBy,
        page: pagination.currentPage,
        limit: 12
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await campaignService.getActiveCampaigns(params);

      setCampaigns(response.data.campaigns);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = (campaign) => {
    setSelectedCampaign(campaign);
    setInvestAmount("");
    setShowPaymentForm(false);
  };

  const handleBookmark = async (campaignId) => {
    try {
      if (bookmarkedCampaigns.includes(campaignId)) {
        await campaignService.removeBookmark(campaignId);
        setBookmarkedCampaigns(bookmarkedCampaigns.filter(id => id !== campaignId));
      } else {
        await campaignService.bookmarkCampaign(campaignId);
        setBookmarkedCampaigns([...bookmarkedCampaigns, campaignId]);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      // Fallback to local state if API fails
      if (bookmarkedCampaigns.includes(campaignId)) {
        setBookmarkedCampaigns(bookmarkedCampaigns.filter(id => id !== campaignId));
      } else {
        setBookmarkedCampaigns([...bookmarkedCampaigns, campaignId]);
      }
    }
  };

  const handleContinueToPayment = () => {
    if (!investAmount || investAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    alert(`✅ Donation successful!\n\nTransaction ID: ${paymentData.transactionId}\nAmount: ₹${paymentData.amount}\n\nThank you for your generous donation!`);

    setSelectedCampaign(null);
    setInvestAmount("");
    setShowPaymentForm(false);

    // Refresh campaigns to show updated amounts
    fetchCampaigns();
    fetchCampaignStats();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  const closeModal = () => {
    setSelectedCampaign(null);
    setInvestAmount("");
    setShowPaymentForm(false);
  };

  const resetFilters = () => {
    setFilters({
      category: "all",
      urgency: "all",
      location: "all",
      fundingRange: "all",
      ngoId: "all"
    });
    setSearchQuery("");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (loading && campaigns.length === 0) {
    return (
      <div className="find-campaigns-container">
        <div className="loading-state">
          <Loader className="loading-spinner" size={48} />
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && campaigns.length === 0) {
    return (
      <div className="find-campaigns-container">
        <div className="error-state">
          <X size={48} />
          <h3>Failed to Load Campaigns</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchCampaigns}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="find-campaigns-container">
      {/* Header Section */}
      <div className="campaigns-header">
        <div className="header-content">
          <h1 className="campaigns-title">Discover Campaigns</h1>
          <p className="campaigns-subtitle">
            Find meaningful causes to support. Every campaign is verified with real-time transparency tracking.
          </p>
        </div>
        <div className="header-stats-row">
          <div className="stat-pill">
            <Target size={18} />
            <span>{campaignStats.totalCampaigns} Active Campaigns</span>
          </div>
          <div className="stat-pill">
            <Users size={18} />
            <span>{campaignStats.totalBackers} Total Backers</span>
          </div>
          <div className="stat-pill">
            <TrendingUp size={18} />
            <span>₹{(campaignStats.totalRaised / 100000).toFixed(1)}L Raised</span>
          </div>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="campaigns-controls">
        <div className="search-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search campaigns by name, NGO, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="campaign-search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery("")}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="controls-row">
          <button
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} />
            Filters
            {Object.values(filters).filter(f => f !== "all").length > 0 && (
              <span className="filter-count">
                {Object.values(filters).filter(f => f !== "all").length}
              </span>
            )}
          </button>

          <div className="sort-dropdown">
            <SlidersHorizontal size={16} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="trending">Trending</option>
              <option value="newest">Newest First</option>
              <option value="ending-soon">Ending Soon</option>
              <option value="most-funded">Most Funded</option>
              <option value="least-funded">Needs Funding</option>
            </select>
            <ChevronDown size={16} />
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid size={18} />
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>Advanced Filters</h3>
            <button className="reset-filters" onClick={resetFilters}>
              Reset All
            </button>
          </div>

          <div className="filter-grid">
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="filter-select"
              >
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Urgency</label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                className="filter-select"
              >
                {filterOptions.urgencyLevels.map(level => (
                  <option key={level} value={level}>
                    {level === "all" ? "All Urgency" : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="filter-select"
              >
                {filterOptions.locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === "all" ? "All Locations" : loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Funding Range</label>
              <select
                value={filters.fundingRange}
                onChange={(e) => setFilters({ ...filters, fundingRange: e.target.value })}
                className="filter-select"
              >
                {filterOptions.fundingRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>NGO Partner</label>
              <select
                value={filters.ngoId}
                onChange={(e) => setFilters({ ...filters, ngoId: e.target.value })}
                className="filter-select"
              >
                {filterOptions.ngos.map(ngo => (
                  <option key={ngo._id} value={ngo._id}>
                    {ngo.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="results-bar">
        <p className="results-text">
          Showing <strong>{campaigns.length}</strong> of {pagination.totalCampaigns} campaigns
          {searchQuery && <span> matching "{searchQuery}"</span>}
        </p>
      </div>

      {/* Campaigns Grid/List */}
      <div className={`campaigns-layout ${viewMode}`}>
        {campaigns.map(campaign => {
          const Icon = categoryIcons[campaign.category] || Heart;
          const isBookmarked = bookmarkedCampaigns.includes(campaign._id);
          const remaining = campaign.targetAmount - campaign.raisedAmount;

          return (
            <div key={campaign._id} className="campaign-card">
              {/* Campaign Image */}
              <div className="campaign-image">
                <img
                  src={campaign.coverImage || `https://via.placeholder.com/400x220?text=${campaign.category}`}
                  alt={campaign.title}
                />
                <div className="image-overlay">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                      onClick={() => handleBookmark(campaign._id)}
                    >
                      <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                    {campaign.ngoTrustScore && (
                      <div
                        style={{
                          backgroundColor:
                            campaign.ngoTrustScore >= 80 ? 'rgba(76, 175, 80, 0.9)' :
                              campaign.ngoTrustScore >= 60 ? 'rgba(33, 150, 243, 0.9)' :
                                campaign.ngoTrustScore >= 40 ? 'rgba(255, 152, 0, 0.9)' :
                                  'rgba(244, 67, 54, 0.9)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Award size={12} />
                        Trust: {campaign.ngoTrustScore}/100
                      </div>
                    )}
                  </div>
                  {campaign.urgency === "high" && (
                    <div className="urgency-tag">
                      <Zap size={14} />
                      Urgent
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Content */}
              <div className="campaign-content">
                {/* NGO Header */}
                <div className="campaign-ngo">
                  <Icon size={16} />
                  <span>{campaign.ngoName}</span>
                  <CheckCircle size={14} className="verified-badge" />
                  <span className="category-label">{campaign.category}</span>
                </div>

                {/* Title */}
                <h3 className="campaign-title">{campaign.title}</h3>

                {/* Description */}
                <p className="campaign-description">
                  {campaign.shortDescription || campaign.description}
                </p>

                {/* Meta Info */}
                <div className="campaign-meta-row">
                  <span className="meta-item">
                    <MapPin size={14} />
                    {campaign.location.city}, {campaign.location.state}
                  </span>
                  <span className="meta-item">
                    <Users size={14} />
                    {campaign.stats.totalDonors} backers
                  </span>
                </div>

                {/* NGO Trust Score & Fund Utilization */}
                {campaign.ngoTrustScore && (
                  <div className="trust-metrics">
                    <div className="trust-score-badge">
                      <Award size={16} />
                      <span className="trust-label">Trust Score:</span>
                      <span
                        className="trust-value"
                        style={{
                          color:
                            campaign.ngoTrustScore >= 80 ? '#10b981' :
                              campaign.ngoTrustScore >= 60 ? '#3b82f6' :
                                campaign.ngoTrustScore >= 40 ? '#f59e0b' :
                                  '#ef4444',
                          fontWeight: 'bold'
                        }}
                      >
                        {campaign.ngoTrustScore}/100
                      </span>
                    </div>
                    {campaign.ngoFundMetrics && campaign.ngoFundMetrics.utilizationPercentage > 0 && (
                      <div className="fund-utilization">
                        <Activity size={14} />
                        <span className="util-label">Fund Utilization:</span>
                        <span className="util-value">{campaign.ngoFundMetrics.utilizationPercentage}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Section */}
                <div className="funding-section">
                  <div className="funding-amounts">
                    <div className="raised">
                      <span className="label">Raised</span>
                      <span className="value">₹{(campaign.raisedAmount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="target">
                      <span className="label">Goal</span>
                      <span className="value">₹{(campaign.targetAmount / 1000).toFixed(0)}K</span>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                      />
                    </div>
                    <div className="progress-info">
                      <span className="progress-percent">{campaign.progress}% funded</span>
                      <span className="days-left">
                        <Clock size={12} />
                        {campaign.daysLeft} days left
                      </span>
                    </div>
                  </div>
                </div>

                {/* Impact Statement */}
                {campaign.beneficiaries && (
                  <div className="impact-box">
                    <TrendingUp size={16} />
                    <p>{campaign.beneficiaries.description}</p>
                  </div>
                )}

                {/* Tags */}
                {campaign.tags && campaign.tags.length > 0 && (
                  <div className="campaign-tags">
                    {campaign.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="campaign-footer">
                  {campaign.is80GEligible && (
                    <div className="verification-badge">
                      <Award size={14} />
                      <span>80G Tax Benefit</span>
                    </div>
                  )}
                  <div className="action-buttons">
                    <button className="btn-share">
                      <Share2 size={16} />
                    </button>
                    <button
                      className="btn-invest"
                      onClick={() => handleInvest(campaign)}
                    >
                      <DollarSign size={16} />
                      Donate Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && !loading && (
        <div className="empty-campaigns">
          <Search size={64} />
          <h3>No campaigns found</h3>
          <p>Try adjusting your search or filters to find more campaigns</p>
          <button className="btn-reset" onClick={resetFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pagination-number ${page === pagination.currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            disabled={!pagination.hasMore}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Investment Modal */}
      {selectedCampaign && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="investment-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <X size={20} />
            </button>

            {!showPaymentForm ? (
              <>
                <h2 className="modal-title">Donate to Campaign</h2>
                <p className="modal-campaign-name">{selectedCampaign.title}</p>

                <div className="modal-info-grid">
                  <div className="info-item">
                    <span className="info-label">NGO</span>
                    <span className="info-value">{selectedCampaign.ngoName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Remaining</span>
                    <span className="info-value">
                      ₹{((selectedCampaign.targetAmount - selectedCampaign.raisedAmount) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Days Left</span>
                    <span className="info-value">{selectedCampaign.daysLeft} days</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tax Benefit</span>
                    <span className="info-value">{selectedCampaign.is80GEligible ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="investment-input-section">
                  <label>Donation Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className="investment-input"
                    min="100"
                  />
                </div>

                <div className="quick-invest-amounts">
                  {[500, 1000, 2500, 5000, 10000].map(amount => (
                    <button
                      key={amount}
                      className="quick-amount"
                      onClick={() => setInvestAmount(amount.toString())}
                    >
                      ₹{amount >= 1000 ? `${amount / 1000}K` : amount}
                    </button>
                  ))}
                </div>

                {selectedCampaign.beneficiaries && (
                  <div className="impact-preview">
                    <TrendingUp size={20} />
                    <p>{selectedCampaign.beneficiaries.description}</p>
                  </div>
                )}

                <div className="modal-footer-actions">
                  <button className="btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="btn-confirm"
                    onClick={handleContinueToPayment}
                    disabled={!investAmount || investAmount <= 0}
                  >
                    <DollarSign size={18} />
                    Continue to Payment
                  </button>
                </div>

                <p className="modal-note">
                  <CheckCircle size={14} />
                  You'll receive real-time updates and verified receipts for every transaction
                </p>
              </>
            ) : (
              <Elements stripe={stripePromise}>
                <StripePayment
                  amount={parseInt(investAmount)}
                  campaignId={selectedCampaign._id}
                  campaignTitle={selectedCampaign.title}
                  ngoName={selectedCampaign.ngoName}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div >
  );
}

