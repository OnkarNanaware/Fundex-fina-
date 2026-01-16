import { useState } from "react";
import {
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import "./MyDonations.css";

export default function MyDonations({ recentTransactions = [], reloadDashboard }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTimeRange, setFilterTimeRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [expandedDonation, setExpandedDonation] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Transform recentTransactions to match UI structure
  const donations = recentTransactions.map(tx => ({
    id: tx.id || tx._id,
    transactionId: tx.transactionId || `TXN${tx.id ? tx.id.slice(-8) : '000'}`,
    date: tx.date || new Date().toISOString(),
    ngoName: tx.ngoName || "NGO Partner",
    purpose: tx.purpose || "General Donation",
    amount: tx.amount || 0,
    status: tx.status === 'completed' ? 'verified' : (tx.status || 'verified'),
    category: tx.category || "General",
    receiptsCount: tx.receiptAvailable ? 1 : 0,
    imagesCount: 0,
    volunteersWorked: 0,
    aiSummary: tx.aiSummary || "Donation recorded. Impact verification in progress.",
    impact: tx.impact || "Funds transferred to NGO",
    receipts: tx.receiptUrl ? [{
      id: 1,
      vendor: "NGO Receipt",
      amount: tx.amount,
      date: tx.date,
      verified: true
    }] : [],
    milestones: [
      { date: tx.date, event: "Donation received", icon: "check" },
      { date: tx.date, event: "Processing complete", icon: "check" }
    ]
  }));

  // Calculate summary statistics
  const totalDonated = donations.reduce((acc, d) => acc + d.amount, 0);
  const verifiedDonations = donations.filter(d => d.status === "verified").length;
  const inProgressDonations = donations.filter(d => d.status === "in-progress").length;
  const flaggedDonations = donations.filter(d => d.status === "flagged").length;

  // Filter logic
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || donation.status === filterStatus;

    let matchesTimeRange = true;
    if (filterTimeRange !== "all") {
      const donationDate = new Date(donation.date);
      const now = new Date();
      const daysDiff = Math.floor((now - donationDate) / (1000 * 60 * 60 * 24));

      if (filterTimeRange === "week" && daysDiff > 7) matchesTimeRange = false;
      if (filterTimeRange === "month" && daysDiff > 30) matchesTimeRange = false;
      if (filterTimeRange === "3months" && daysDiff > 90) matchesTimeRange = false;
    }

    return matchesSearch && matchesStatus && matchesTimeRange;
  });

  const handleDownloadReceipt = (donation, expenses = []) => {
    // Create comprehensive HTML report for donor
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Donation Report - ${donation.transactionId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #2e7d32; border-bottom: 3px solid #4CAF50; padding-bottom: 15px; }
          h2 { color: #333; margin-top: 30px; }
          .section { margin: 20px 0; padding: 15px; background: #fafafa; border-radius: 8px; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; margin-left: 10px; }
          .expense-item { border: 2px solid #e0e0e0; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .verified { background: #e8f5e9; border-left: 4px solid #4CAF50; }
          .review { background: #fff3e0; border-left: 4px solid #ff9800; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
          img { max-width: 300px; border: 2px solid #ddd; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎯 Fundex Donation Report</h1>
          
          <div class="section">
            <h2>Donation Details</h2>
            <p><span class="label">Transaction ID:</span><span class="value">${donation.transactionId}</span></p>
            <p><span class="label">Date:</span><span class="value">${new Date(donation.date).toLocaleDateString()}</span></p>
            <p><span class="label">NGO:</span><span class="value">${donation.ngoName}</span></p>
            <p><span class="label">Purpose:</span><span class="value">${donation.purpose}</span></p>
            <p><span class="label">Amount:</span><span class="value">₹${donation.amount.toLocaleString()}</span></p>
            <p><span class="label">Status:</span><span class="value">${donation.status}</span></p>
          </div>

          <div class="section">
            <h2>Impact Summary</h2>
            <p>${donation.impact || 'Your donation is making a difference!'}</p>
          </div>

          ${expenses && expenses.length > 0 ? `
            <h2>📋 Expense Transparency Report</h2>
            <p style="color: #666; margin-bottom: 15px;">See exactly how your donation was utilized</p>
            
            ${expenses.map((exp, idx) => `
              <div class="expense-item ${exp.fraudFlags && exp.fraudFlags.length > 2 ? 'review' : 'verified'}">
                <h3>${exp.purpose || 'Expense'} #${idx + 1}</h3>
                <p><strong>Volunteer:</strong> ${exp.volunteer}</p>
                <p><strong>Amount:</strong> ₹${exp.amountSpent?.toLocaleString()}</p>
                <p><strong>Status:</strong> ${exp.fraudFlags && exp.fraudFlags.length > 2 ? '⚠️ Under Review' : '✓ Verified'}</p>
                <p><strong>Approved Amount:</strong> ₹${exp.approvedAmount?.toLocaleString()}</p>
                <p><strong>Utilization:</strong> ${exp.utilization}</p>
                ${exp.receiptImage ? `<div><strong>Receipt:</strong> <a href="${exp.receiptImage}">View Receipt Image</a></div>` : ''}
                ${exp.proofImage ? `<div><strong>Proof:</strong> <a href="${exp.proofImage}">View Proof Image</a></div>` : ''}
              </div>
            `).join('')}
          ` : '<p>No detailed expenses available yet. Receipts will be added as volunteers submit them.</p>'}

          <div class="section" style="background: #e3f2fd; border-left: 4px solid #2196F3;">
            <p style="margin: 0; color: #1565c0;">
              ✓ This report confirms that your donation has been processed and tracked for complete transparency.
              Thank you for your trust in Fundex!
            </p>
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Fundex - Making Transparency Effortless</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fundex-donation-report-${donation.transactionId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('Report downloaded! Open the HTML file in your browser and use Print > Save as PDF');
  };

  const fetchExpenseDetails = async (donationId) => {
    try {
      setLoadingExpenses(true);
      // Try fetching expenses related to this donation
      // Note: This endpoint might need to be created on backend
      const response = await fetch('http://localhost:5000/api/admin/expenses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenseDetails(data);
      }
    } catch (error) {
      console.error('Error fetching expense details:', error);
      setExpenseDetails([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleViewDetails = async (donation) => {
    setSelectedDonation(donation);
    await fetchExpenseDetails(donation.id);
  };

  const toggleExpand = (donationId) => {
    setExpandedDonation(expandedDonation === donationId ? null : donationId);
  };

  return (
    <div className="my-donations-container">
      {/* Summary Cards */}
      <div className="donations-summary">
        <div className="summary-card primary">
          <div className="summary-icon">
            <DollarSign size={32} />
          </div>
          <div className="summary-content">
            <h3 className="summary-value">₹{totalDonated.toLocaleString()}</h3>
            <p className="summary-label">Total Donated</p>
          </div>
        </div>

        <div className="summary-card success">
          <div className="summary-icon">
            <CheckCircle size={28} />
          </div>
          <div className="summary-content">
            <h3 className="summary-value">{verifiedDonations}</h3>
            <p className="summary-label">Verified Donations</p>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="summary-icon">
            <Clock size={28} />
          </div>
          <div className="summary-content">
            <h3 className="summary-value">{inProgressDonations}</h3>
            <p className="summary-label">In Progress</p>
          </div>
        </div>

        <div className="summary-card danger">
          <div className="summary-icon">
            <AlertCircle size={28} />
          </div>
          <div className="summary-content">
            <h3 className="summary-value">{flaggedDonations}</h3>
            <p className="summary-label">Flagged for Review</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="donations-controls">
        <div className="search-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by transaction ID, NGO, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="donations-search"
          />
        </div>

        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
        </button>

        <button className="export-btn">
          <Download size={18} />
          Export All
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="donations-filter-panel">
          <div className="filter-section">
            <label>Status</label>
            <div className="filter-options">
              <button
                className={`filter-option ${filterStatus === "all" ? "active" : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                All
              </button>
              <button
                className={`filter-option ${filterStatus === "verified" ? "active" : ""}`}
                onClick={() => setFilterStatus("verified")}
              >
                Verified
              </button>
              <button
                className={`filter-option ${filterStatus === "in-progress" ? "active" : ""}`}
                onClick={() => setFilterStatus("in-progress")}
              >
                In Progress
              </button>
              <button
                className={`filter-option ${filterStatus === "flagged" ? "active" : ""}`}
                onClick={() => setFilterStatus("flagged")}
              >
                Flagged
              </button>
            </div>
          </div>

          <div className="filter-section">
            <label>Time Range</label>
            <div className="filter-options">
              <button
                className={`filter-option ${filterTimeRange === "all" ? "active" : ""}`}
                onClick={() => setFilterTimeRange("all")}
              >
                All Time
              </button>
              <button
                className={`filter-option ${filterTimeRange === "week" ? "active" : ""}`}
                onClick={() => setFilterTimeRange("week")}
              >
                Last Week
              </button>
              <button
                className={`filter-option ${filterTimeRange === "month" ? "active" : ""}`}
                onClick={() => setFilterTimeRange("month")}
              >
                Last Month
              </button>
              <button
                className={`filter-option ${filterTimeRange === "3months" ? "active" : ""}`}
                onClick={() => setFilterTimeRange("3months")}
              >
                Last 3 Months
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="results-header">
        <p className="results-count">
          Showing <strong>{filteredDonations.length}</strong> of {donations.length} donations
        </p>
      </div>

      {/* Donations List */}
      <div className="donations-list">
        {filteredDonations.map(donation => (
          <div key={donation.id} className="donation-item">
            <div className="donation-main">
              <div className="donation-info">
                <div className="donation-header-row">
                  <h3 className="donation-purpose">{donation.purpose}</h3>
                  <span className={`donation-status ${donation.status}`}>
                    {donation.status === "verified" && <CheckCircle size={14} />}
                    {donation.status === "in-progress" && <Clock size={14} />}
                    {donation.status === "flagged" && <AlertCircle size={14} />}
                    {donation.status === "verified" ? "Verified" :
                      donation.status === "in-progress" ? "In Progress" : "Flagged"}
                  </span>
                </div>

                <p className="donation-ngo">{donation.ngoName}</p>

                <div className="donation-meta">
                  <span className="meta-badge">
                    <Calendar size={14} />
                    {new Date(donation.date).toLocaleDateString()}
                  </span>
                  <span className="meta-badge">
                    <FileText size={14} />
                    {donation.receiptsCount} Receipts
                  </span>
                  <span className="meta-badge">
                    <ImageIcon size={14} />
                    {donation.imagesCount} Photos
                  </span>
                  <span className="meta-badge category-badge">{donation.category}</span>
                </div>

                <div className="donation-ai-summary">
                  <div className="ai-label">AI Summary</div>
                  <p>{donation.aiSummary}</p>
                </div>
              </div>

              <div className="donation-amount-section">
                <div className="amount-display">
                  <span className="amount-label">Amount</span>
                  <span className="amount-value">₹{donation.amount.toLocaleString()}</span>
                </div>
                <span className="transaction-id">ID: {donation.transactionId}</span>
              </div>
            </div>

            <div className="donation-actions">
              <button
                className="action-btn secondary"
                onClick={() => toggleExpand(donation.id)}
              >
                {expandedDonation === donation.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expandedDonation === donation.id ? "Hide" : "Show"} Details
              </button>
              <button
                className="action-btn primary"
                onClick={() => handleViewDetails(donation)}
              >
                <Eye size={16} />
                Full Report
              </button>
              <button
                className="action-btn"
                onClick={() => handleDownloadReceipt(donation.transactionId)}
              >
                <Download size={16} />
                Receipt
              </button>
            </div>

            {/* Expanded Details */}
            {expandedDonation === donation.id && (
              <div className="donation-expanded">
                <div className="expanded-section">
                  <h4>Impact</h4>
                  <div className="impact-box">
                    <TrendingUp size={18} />
                    <p>{donation.impact}</p>
                  </div>
                </div>

                <div className="expanded-section">
                  <h4>Receipt Breakdown</h4>
                  <div className="receipts-table">
                    {donation.receipts.map(receipt => (
                      <div key={receipt.id} className="receipt-row">
                        <div className="receipt-info">
                          <span className="receipt-vendor">{receipt.vendor}</span>
                          <span className="receipt-date">{new Date(receipt.date).toLocaleDateString()}</span>
                        </div>
                        <div className="receipt-amount-status">
                          <span className="receipt-amount">₹{receipt.amount.toLocaleString()}</span>
                          {receipt.verified ? (
                            <CheckCircle size={16} className="verified-icon" />
                          ) : (
                            <Clock size={16} className="pending-icon" />
                          )}
                        </div>
                        {receipt.flag && (
                          <div className="receipt-flag">
                            <AlertCircle size={14} />
                            {receipt.flag}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="expanded-section">
                  <h4>Timeline</h4>
                  <div className="timeline">
                    {donation.milestones.map((milestone, index) => (
                      <div key={index} className="timeline-item">
                        <div className={`timeline-icon ${milestone.icon}`}>
                          {milestone.icon === "check" && <CheckCircle size={16} />}
                          {milestone.icon === "progress" && <Clock size={16} />}
                          {milestone.icon === "warning" && <AlertCircle size={16} />}
                        </div>
                        <div className="timeline-content">
                          <p className="timeline-event">{milestone.event}</p>
                          <span className="timeline-date">{new Date(milestone.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDonations.length === 0 && (
        <div className="empty-donations">
          <Search size={48} />
          <h3>No donations found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Detail Modal - Enhanced with Expense Info */}
      {selectedDonation && (
        <div className="modal-overlay" onClick={() => {
          setSelectedDonation(null);
          setExpenseDetails(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => {
              setSelectedDonation(null);
              setExpenseDetails(null);
            }}>
              <X size={20} />
            </button>

            <h2 className="modal-title">Donation Full Report</h2>

            <div className="modal-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value">{selectedDonation.transactionId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{new Date(selectedDonation.date).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">NGO</span>
                <span className="detail-value">{selectedDonation.ngoName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Amount</span>
                <span className="detail-value">₹{selectedDonation.amount.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category</span>
                <span className="detail-value">{selectedDonation.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`detail-value status-${selectedDonation.status}`}>
                  {selectedDonation.status}
                </span>
              </div>
            </div>

            <div className="modal-section">
              <h3>Purpose</h3>
              <p>{selectedDonation.purpose}</p>
            </div>

            <div className="modal-section">
              <h3>Impact Achieved</h3>
              <div className="impact-highlight">
                <TrendingUp size={20} />
                <p>{selectedDonation.impact}</p>
              </div>
            </div>

            {/* Expense Details Section */}
            {loadingExpenses ? (
              <div className="modal-section">
                <h3>Expense Details</h3>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading expense information...</p>
              </div>
            ) : expenseDetails && expenseDetails.length > 0 ? (
              <div className="modal-section">
                <h3>📋 Expense Transparency Report</h3>
                <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                  See how your funds were utilized with verified receipts and proof
                </p>

                {expenseDetails.map((expense, idx) => (
                  <div key={idx} style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                          {expense.purpose || 'Expense'}
                        </h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          By: {expense.volunteer}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                          ₹{expense.amountSpent?.toLocaleString()}
                        </div>
                        {expense.fraudFlags && expense.fraudFlags.length > 0 && (
                          <div style={{
                            marginTop: '5px',
                            padding: '4px 12px',
                            background: expense.fraudFlags.length > 2 ? '#ffebee' : '#fff3e0',
                            color: expense.fraudFlags.length > 2 ? '#c62828' : '#e65100',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {expense.fraudFlags.length > 2 ? '⚠️ Under Review' : '✓ Verified'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Receipt Image */}
                    {expense.receiptImage && (
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#333',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          📄 Receipt Image
                        </label>
                        <div style={{
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px',
                          backgroundColor: '#fff',
                          cursor: 'pointer'
                        }}
                          onClick={() => window.open(expense.receiptImage, '_blank')}
                        >
                          <img
                            src={expense.receiptImage}
                            alt="Receipt"
                            style={{
                              width: '100%',
                              maxHeight: '300px',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '5px',
                          textAlign: 'center'
                        }}>
                          Click to view full size
                        </p>
                      </div>
                    )}

                    {/* Proof Image */}
                    {expense.proofImage && (
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#333',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          📸 Proof of Work
                        </label>
                        <div style={{
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px',
                          backgroundColor: '#fff',
                          cursor: 'pointer'
                        }}
                          onClick={() => window.open(expense.proofImage, '_blank')}
                        >
                          <img
                            src={expense.proofImage}
                            alt="Proof"
                            style={{
                              width: '100%',
                              maxHeight: '300px',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '5px',
                          textAlign: 'center'
                        }}>
                          Click to view full size
                        </p>
                      </div>
                    )}

                    {/* Utilization Info */}
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span><strong>Approved Amount:</strong> ₹{expense.approvedAmount?.toLocaleString()}</span>
                        <span><strong>Utilization:</strong> {expense.utilization}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  marginTop: '20px'
                }}>
                  <p style={{ margin: 0, color: '#1565c0', fontSize: '14px' }}>
                    ✓ All expenses have been verified. Thank you for your transparency!
                  </p>
                </div>
              </div>
            ) : (
              <div className="modal-section">
                <h3>Expense Details</h3>
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <FileText size={48} style={{ color: '#999', marginBottom: '10px' }} />
                  <p style={{ color: '#666', margin: 0 }}>No detailed expenses available yet</p>
                  <p style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
                    Expense receipts will appear here once volunteers submit them
                  </p>
                </div>
              </div>
            )}

            <div className="modal-actions-bottom">
              <button className="btn-download" onClick={() => handleDownloadReceipt(selectedDonation, expenseDetails)}>
                <Download size={18} />
                Download Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
