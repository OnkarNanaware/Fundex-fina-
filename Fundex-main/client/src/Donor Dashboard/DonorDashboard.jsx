// DonorDashboard.jsx
import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Wallet,
  TrendingUp,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import FundingRequests from "./FundingRequests";
import MyDonations from "./MyDonations";
import FindCampaigns from "./FindCampaigns";
import ImpactReport from "./ImpactReport";
import API from "../services/api";
import NotificationDropdown from "../components/NotificationDropdown";
import "./DonorDashboard.css";

export default function DonorDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    donorName: "",
    totalDonated: 0,
    activeRequests: 0,
    tasksSupported: 0,
    fraudAlerts: 0,
  });

  const [fundingRequests, setFundingRequests] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const loadDashboard = async () => {
    try {
      console.log('🔄 Loading donor dashboard...');

      const statsRes = await API.get("/donor/overview");
      setStats(statsRes.data);
      console.log('✅ Stats loaded:', statsRes.data);

      const txRes = await API.get("/donor/transactions");
      setRecentTransactions(txRes.data);
      console.log('✅ Transactions loaded:', txRes.data.length, 'transactions');

      // Fetch active funding requests for this donor
      const userStr = localStorage.getItem('user');
      console.log('👤 User from localStorage:', userStr);

      if (userStr) {
        const user = JSON.parse(userStr);
        const userId = user.id || user._id;

        console.log('🔍 Parsed user object:', user);
        console.log('🆔 Extracted userId:', userId);

        if (!userId) {
          console.error('❌ No user ID found in localStorage');
          return;
        }

        console.log(`📡 Fetching donation requests for donor: ${userId}`);

        const frRes = await API.get(`/donationrequests/donor/${userId}`, {
          params: { status: 'pending' }
        });

        console.log('📥 Funding requests response:', frRes.data);

        if (frRes.data.success) {
          console.log(`✅ Found ${frRes.data.data.length} funding requests`);

          // Transform to match UI structure
          const transformedRequests = frRes.data.data.slice(0, 3).map(request => {
            const campaign = request.campaignId || {};
            console.log('🔄 Transforming request:', request._id, campaign.title);

            return {
              id: request._id,
              ngoName: request.ngoName,
              purpose: campaign.title || 'Funding Request',
              requestedAmount: request.requestedAmount,
              fundedAmount: request.donatedAmount || 0,
              progress: request.donatedAmount ? Math.round((request.donatedAmount / request.requestedAmount) * 100) : 0,
              status: request.status
            };
          });

          console.log('✅ Transformed requests:', transformedRequests);
          setFundingRequests(transformedRequests);
        } else {
          console.warn('⚠️ API returned success: false', frRes.data);
        }
      } else {
        console.error('❌ No user found in localStorage');
      }
    } catch (err) {
      console.error("❌ Load donor dashboard failed:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.response?.config?.url
      });

      // Don't show alert for funding requests failure
      if (!err.response?.config?.url?.includes('donationrequests')) {
        alert(err.response?.data?.message || "Failed to load donor dashboard");
      }
    }
  };

  // initial load
  useEffect(() => {
    loadDashboard();
  }, []);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return (
          <FundingRequests
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            reloadDashboard={loadDashboard}
            donorName={stats.donorName}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case "transactions":
        return (
          <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
            {renderHeader()}
            {renderNavigation()}
            <MyDonations
              recentTransactions={recentTransactions}
              reloadDashboard={loadDashboard}
            />
          </div>
        );
      case "find-campaigns":
        return (
          <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
            {renderHeader()}
            {renderNavigation()}
            <FindCampaigns reloadDashboard={loadDashboard} />
          </div>
        );
      case "impact":
        return (
          <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
            {renderHeader()}
            {renderNavigation()}
            <ImpactReport
              stats={stats}
              transactions={recentTransactions}
              setActiveTab={setActiveTab}
            />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const renderHeader = () => (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo-text">Fundex</h1>
          <span className="logo-subtitle">Donor Portal</span>
        </div>

        <div className="header-actions">
          <NotificationDropdown darkMode={darkMode} />

          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? "Light" : "Dark"} Mode</span>
          </button>

          <div className="user-profile-container">
            <div className="user-profile">
              <div className="avatar">
                {stats.donorName ? stats.donorName[0].toUpperCase() : "D"}
              </div>
              <span className="user-name">{stats.donorName || "Donor"}</span>
            </div>
            <button className="logout-hover-btn" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const renderNavigation = () => (
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
  );

  const renderOverview = () => (
    <>
      {renderHeader()}
      {renderNavigation()}

      <main className="dashboard-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon wallet">
              <Wallet size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Donated</p>
              <h3 className="stat-value">
                ₹{stats.totalDonated.toLocaleString()}
              </h3>
              <span className="stat-change positive">+12% this month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon trending">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Requests</p>
              <h3 className="stat-value">{stats.activeRequests}</h3>
              <span className="stat-change">3 awaiting funding</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon heart">
              <Heart size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tasks Supported</p>
              <h3 className="stat-value">{stats.tasksSupported}</h3>
              <span className="stat-change positive">+5 this week</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon alert">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Fraud Alerts</p>
              <h3 className="stat-value">{stats.fraudAlerts}</h3>
              <span className="stat-change warning">Needs attention</span>
            </div>
          </div>
        </div>

        {/* Funding Requests Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Active Funding Requests</h2>
            <button
              className="btn-primary"
              onClick={() => setActiveTab("requests")}
            >
              View All
            </button>
          </div>

          <div className="requests-grid">
            {fundingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3 className="request-title">{request.purpose}</h3>
                  <span className={`status-badge ${request.status}`}>
                    {request.status === "completed" ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    {request.status}
                  </span>
                </div>

                <p className="request-ngo">{request.ngoName}</p>

                <div className="request-amount">
                  <div className="amount-info">
                    <span className="amount-label">Funded</span>
                    <span className="amount-value">
                      ₹{request.fundedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="amount-info">
                    <span className="amount-label">Goal</span>
                    <span className="amount-value">
                      ₹{request.requestedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${request.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {request.progress}% Complete
                  </span>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => setActiveTab("requests")}
                >
                  <DollarSign size={16} />
                  Donate Now
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Transactions</h2>
            <button
              className="btn-link"
              onClick={() => setActiveTab("transactions")}
            >
              View History
            </button>
          </div>

          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.purpose}</td>
                    <td className="amount">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`status-badge ${transaction.status}`}>
                        {transaction.status === "verified" ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Clock size={14} />
                        )}
                        {transaction.status}
                      </span>
                    </td>
                    <td>
                      {transaction.receiptAvailable ? (
                        <button className="btn-icon">
                          <FileText size={16} />
                          View
                        </button>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="content-section quick-actions-section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>

          <div className="quick-actions-grid">
            <button
              className="quick-action-card"
              onClick={() => setActiveTab("find-campaigns")}
            >
              <div className="quick-action-icon discover">
                <TrendingUp size={28} />
              </div>
              <div className="quick-action-content">
                <h3>Discover Campaigns</h3>
                <p>Browse and invest in ongoing campaigns</p>
              </div>
            </button>

            <button
              className="quick-action-card"
              onClick={() => setActiveTab("transactions")}
            >
              <div className="quick-action-icon history">
                <FileText size={28} />
              </div>
              <div className="quick-action-content">
                <h3>View History</h3>
                <p>Check all your donation transactions</p>
              </div>
            </button>

            <button
              className="quick-action-card"
              onClick={() => setActiveTab("impact")}
            >
              <div className="quick-action-icon impact">
                <Heart size={28} />
              </div>
              <div className="quick-action-content">
                <h3>Impact Report</h3>
                <p>See the difference you've made</p>
              </div>
            </button>
          </div>
        </section>
      </main>
    </>
  );

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
      {renderContent()}
    </div>
  );
}
