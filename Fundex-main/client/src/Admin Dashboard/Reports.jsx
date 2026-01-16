import { useState, useEffect } from "react";
import {
  Download,
  Printer,
  Mail,
  DollarSign,
  Users,
  Target,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  PieChart,
  BarChart3,
  CheckCircle,
  Activity
} from "lucide-react";
import "./Reports.css";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportsData, setReportsData] = useState(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/stats/reports', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }

      const data = await response.json();
      setReportsData(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (type) => {
    try {
      let endpoint = '';
      let filename = '';
      const dateStr = new Date().toISOString().split('T')[0];

      // Determine endpoint and filename based on report type
      switch (type) {
        case 'Financial':
          endpoint = 'http://localhost:5000/api/admin/reports/financial-summary';
          filename = `Financial_Summary_${dateStr}.pdf`;
          break;
        case 'Transparency':
          endpoint = 'http://localhost:5000/api/admin/reports/transparency';
          filename = `Transparency_Report_${dateStr}.pdf`;
          break;
        case 'Campaign':
          endpoint = 'http://localhost:5000/api/admin/reports/campaign-analytics';
          filename = `Campaign_Analytics_${dateStr}.pdf`;
          break;
        case 'Donor':
          endpoint = 'http://localhost:5000/api/admin/reports/donor-report';
          filename = `Donor_Report_${dateStr}.pdf`;
          break;
        case 'PDF':
        case 'Excel':
        default:
          // Fallback to comprehensive report if available
          endpoint = 'http://localhost:5000/api/admin/stats/reports/download-pdf';
          filename = `Comprehensive_Report_${dateStr}.pdf`;
          break;
      }

      console.log(`📥 Downloading ${type} report from ${endpoint}...`);

      // Fetch the PDF
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Failed to generate ${type} report`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ ${type} report downloaded successfully!`);
      alert(`${type} report downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(`Failed to download ${type} report. Please try again.\n\nError: ${error.message}`);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleEmailReport = async () => {
    if (!reportsData) return;

    const confirmed = confirm('Send the comprehensive financial report to your registered email?');
    if (!confirmed) return;

    try {
      const response = await fetch('http://localhost:5000/api/admin/stats/reports/email', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      alert(result.message || 'Report has been sent to your email!');
    } catch (error) {
      console.error('Error emailing report:', error);
      alert('Failed to send email. Please check your email configuration.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!reportsData) return null;

  const { stats, monthlyData, categoryBreakdown, donorInsights, transparencyMetrics, campaignPerformance } = reportsData;

  const maxDonation = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.donations)) : 1000;
  const maxExpense = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.expenses)) : 1000;

  return (
    <div className="reports-container">
      {/* Reports Header */}
      <div className="reports-header">
        <div>
          <h2 className="section-title">Reports & Analytics</h2>
          <p className="page-subtitle">Comprehensive financial and transparency reports</p>
        </div>
        <div className="report-actions-group">
          <button className="btn-report-action" onClick={() => handleDownloadReport("PDF")}>
            <Download size={18} />
            Download PDF
          </button>
          <button className="btn-report-action" onClick={handlePrintReport}>
            <Printer size={18} />
            Print
          </button>
          <button className="btn-report-action" onClick={handleEmailReport}>
            <Mail size={18} />
            Email Report
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper">
              <DollarSign size={24} />
            </div>
            <span className="kpi-trend positive">
              <ArrowUpRight size={16} />
              Live
            </span>
          </div>
          <h3 className="kpi-value">₹{(stats.totalFunds / 100000).toFixed(1)}L</h3>
          <p className="kpi-label">Total Funds Raised</p>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: "75%" }} />
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper">
              <Users size={24} />
            </div>
            <span className="kpi-trend positive">
              <ArrowUpRight size={16} />
              Dynamic
            </span>
          </div>
          <h3 className="kpi-value">{donorInsights.totalDonors}</h3>
          <p className="kpi-label">Total Donors</p>
          <div className="kpi-bar">
            <div className="kpi-bar-fill success" style={{ width: "82%" }} />
          </div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper">
              <Target size={24} />
            </div>
            <span className="kpi-trend positive">
              <ArrowUpRight size={16} />
              Active
            </span>
          </div>
          <h3 className="kpi-value">{stats.activeCampaigns}</h3>
          <p className="kpi-label">Active Campaigns</p>
          <div className="kpi-bar">
            <div className="kpi-bar-fill info" style={{ width: "68%" }} />
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <span className="kpi-trend neutral">
              {transparencyMetrics.overallScore}%
            </span>
          </div>
          <h3 className="kpi-value">{transparencyMetrics.overallScore}%</h3>
          <p className="kpi-label">Transparency Score</p>
          <div className="kpi-bar">
            <div className="kpi-bar-fill warning" style={{ width: `${transparencyMetrics.overallScore}%` }} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Monthly Trends Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Monthly Financial Trends</h3>
              <p className="chart-subtitle">Donations vs Expenses (Last 6 Months)</p>
            </div>
          </div>
          <div className="chart-body">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot donations"></span>
                <span>Donations Received</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot expenses"></span>
                <span>Expenses Incurred</span>
              </div>
            </div>
            <div className="bar-chart">
              {monthlyData.length === 0 ? <p className="text-center py-8">No transaction data available.</p> :
                monthlyData.map((data, index) => (
                  <div key={index} className="bar-group">
                    <div className="bars-wrapper">
                      <div
                        className="bar donations-bar"
                        style={{ height: `${maxDonation > 0 ? (data.donations / maxDonation) * 200 : 0}px` }}
                      >
                        <span className="bar-tooltip">₹{(data.donations / 1000).toFixed(1)}K</span>
                      </div>
                      <div
                        className="bar expenses-bar"
                        style={{ height: `${maxExpense > 0 ? (data.expenses / maxExpense) * 200 : 0}px` }}
                      >
                        <span className="bar-tooltip">₹{(data.expenses / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                    <span className="bar-label">{data.month}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Category Breakdown</h3>
              <p className="chart-subtitle">Fund allocation by category</p>
            </div>
          </div>
          <div className="chart-body">
            <div className="category-breakdown-list">
              {categoryBreakdown.length === 0 ? <p className="text-center py-4">No campaign data.</p> :
                categoryBreakdown.map((cat, index) => (
                  <div key={index} className="category-breakdown-item">
                    <div className="category-info">
                      <div className="category-color" style={{ background: cat.color }}></div>
                      <div>
                        <h4 className="category-name">{cat.category}</h4>
                        <p className="category-campaigns">{cat.campaigns} campaigns</p>
                      </div>
                    </div>
                    <div className="category-stats">
                      <span className="category-amount">₹{(cat.amount / 1000).toFixed(0)}K</span>
                      <span className="category-percentage">{cat.percentage}%</span>
                    </div>
                    <div className="category-progress-bar">
                      <div
                        className="category-progress-fill"
                        style={{ width: `${cat.percentage}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Donor Insights & Transparency Metrics */}
      <div className="insights-grid">
        {/* Donor Insights */}
        <div className="insight-card">
          <div className="insight-header">
            <Users size={24} />
            <h3>Donor Insights</h3>
          </div>
          <div className="insight-stats-grid">
            <div className="insight-stat">
              <span className="insight-stat-label">Total Donors</span>
              <span className="insight-stat-value">{donorInsights.totalDonors}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">New Donors</span>
              <span className="insight-stat-value positive">+{donorInsights.newDonors}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Recurring Donors</span>
              <span className="insight-stat-value">{donorInsights.recurringDonors}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Avg. Donation</span>
              <span className="insight-stat-value">₹{donorInsights.averageDonation.toLocaleString()}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Top Donation</span>
              <span className="insight-stat-value">₹{donorInsights.topDonorAmount.toLocaleString()}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Retention Rate</span>
              <span className="insight-stat-value success">{donorInsights.donorRetention}%</span>
            </div>
          </div>
        </div>

        {/* Transparency Metrics */}
        <div className="insight-card">
          <div className="insight-header">
            <ShieldCheck size={24} />
            <h3>Transparency Metrics</h3>
          </div>
          <div className="insight-stats-grid">
            <div className="insight-stat">
              <span className="insight-stat-label">Overall Score</span>
              <span className="insight-stat-value success">{transparencyMetrics.overallScore}%</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Receipts Verified</span>
              <span className="insight-stat-value">{transparencyMetrics.receiptsVerified}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Pending</span>
              <span className="insight-stat-value warning">{transparencyMetrics.receiptsPending}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">Fraud Cases</span>
              <span className="insight-stat-value error">{transparencyMetrics.fraudCases}</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">GST Verified</span>
              <span className="insight-stat-value">{transparencyMetrics.gstVerified}%</span>
            </div>
            <div className="insight-stat">
              <span className="insight-stat-label">AI Accuracy</span>
              <span className="insight-stat-value success">{transparencyMetrics.aiAccuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table (Renamed from NGO Performance) */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3 className="table-title">Campaign Performance</h3>
            <p className="table-subtitle">Campaign stats and transparency ratings for your NGO</p>
          </div>
          <button className="btn-export" onClick={() => handleDownloadReport("Excel")}>
            <FileSpreadsheet size={18} />
            Export to Excel
          </button>
        </div>
        <div className="responsive-table">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Target</th>
                <th>Raised</th>
                <th>Transparency</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaignPerformance.length === 0 ? <tr><td colSpan="6" className="text-center">No campaigns found</td></tr> :
                campaignPerformance.map((campaign, index) => (
                  <tr key={index}>
                    <td>
                      <div className="ngo-cell">
                        <div className="ngo-avatar">{campaign.title.charAt(0)}</div>
                        <span className="ngo-name">{campaign.title}</span>
                      </div>
                    </td>
                    <td>₹{(campaign.target / 1000).toFixed(0)}K</td>
                    <td className="amount-cell">₹{(campaign.raised / 1000).toFixed(0)}K</td>
                    <td>
                      <div className="transparency-cell">
                        <div className="transparency-bar-small">
                          <div
                            className="transparency-fill-small"
                            style={{ width: `${campaign.transparency}%` }}
                          />
                        </div>
                        <span>{campaign.transparency}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="rating-cell">
                        <span className="star">⭐</span>
                        <span>{campaign.rating}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-table ${campaign.status === 'active' ? 'active' : 'inactive'}`}>
                        <CheckCircle size={12} />
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Report Downloads */}
      <div className="quick-reports-section">
        <h3 className="section-subtitle">Quick Report Downloads</h3>
        <div className="quick-reports-grid">
          <div className="quick-report-card">
            <FileText size={32} />
            <h4>Financial Summary</h4>
            <p>Complete financial overview with transactions</p>
            <button className="btn-download-quick" onClick={() => handleDownloadReport("Financial")}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
          <div className="quick-report-card">
            <PieChart size={32} />
            <h4>Transparency Report</h4>
            <p>Donor transparency and verification metrics</p>
            <button className="btn-download-quick" onClick={() => handleDownloadReport("Transparency")}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
          <div className="quick-report-card">
            <BarChart3 size={32} />
            <h4>Campaign Analytics</h4>
            <p>Detailed campaign performance analysis</p>
            <button className="btn-download-quick" onClick={() => handleDownloadReport("Campaign")}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
          <div className="quick-report-card">
            <Users size={32} />
            <h4>Donor Report</h4>
            <p>Donor demographics and contribution history</p>
            <button className="btn-download-quick" onClick={() => handleDownloadReport("Donor")}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
