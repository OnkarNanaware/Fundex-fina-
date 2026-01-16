import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './VolunteerDashboard.css';
import NotificationDropdown from '../components/NotificationDropdown';
import {
  Bell, Moon, Sun, User, Wallet, TrendingUp, Heart, AlertCircle,
  Plus, Calendar, CheckCircle, Clock, XCircle, MapPin, Users,
  DollarSign, FileText, Send, Upload, Filter, Search, Edit,
  Trash2, Eye, Download, RefreshCw, Target, Activity, Shield,
  AlertTriangle, Info, BadgeCheck, Ban
} from 'lucide-react';
const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  // Dashboard Data
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalAllocated: 0,
    totalExpenses: 0,
    totalSpent: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    remainingBalance: 0
  });
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // Form States
  const [requestForm, setRequestForm] = useState({
    campaignId: '',
    purpose: '',
    description: '',
    requestedAmount: '',
    urgency: 'medium'
  });
  const [expenseForm, setExpenseForm] = useState({
    requestId: '',
    amountSpent: '',
    description: '',
    category: 'general'
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [taskForm, setTaskForm] = useState({
    campaignId: '',
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    notes: ''
  });
  const [updateForm, setUpdateForm] = useState({
    campaignId: '',
    title: '',
    content: '',
    images: []
  });
  // Filters
  const [requestFilter, setRequestFilter] = useState('all');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  // Loading states for submissions
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  // Load user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'volunteer') {
      navigate('/login');
      return;
    }
    if (userData.status === 'pending' || userData.status === 'rejected') {
      navigate('/volunteer/waiting');
      return;
    }
    setUser(userData);
    fetchDashboardData();
  }, [navigate]);
  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/volunteer/dashboard');

      if (response.data.success) {
        const { stats, volunteerRequests, expenses, tasks, campaigns } = response.data.data;
        setStats(stats);
        setVolunteerRequests(volunteerRequests);
        setExpenses(expenses);
        setTasks(tasks);
        setCampaigns(campaigns);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  // Create Fund Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();

    if (!requestForm.purpose || !requestForm.requestedAmount) {
      alert('Please fill in all required fields');
      return;
    }

    if (isSubmittingRequest) return; // Prevent multiple submissions

    try {
      setIsSubmittingRequest(true);
      const response = await API.post('/volunteer/requests', requestForm);

      if (response.data.success) {
        alert('Fund request submitted successfully!');
        setShowRequestModal(false);
        setRequestForm({
          campaignId: '',
          purpose: '',
          description: '',
          requestedAmount: '',
          urgency: 'medium'
        });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };
  // Handle file selection with preview
  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Receipt image must be less than 5MB');
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Proof image must be less than 5MB');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Expense
  const handleSubmitExpense = async (e) => {
    e.preventDefault();

    console.log('🚀 Starting expense submission...');
    console.log('Form data:', expenseForm);
    console.log('Receipt file:', receiptFile?.name);
    console.log('Proof file:', proofFile?.name);

    if (!expenseForm.requestId || !expenseForm.amountSpent || !receiptFile || !proofFile) {
      alert('Please fill in all required fields and upload both receipt and proof images');
      return;
    }

    if (isSubmittingExpense) {
      console.log('⚠️ Already submitting, please wait...');
      return;
    }

    try {
      setIsSubmittingExpense(true);
      console.log('📦 Creating FormData...');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('requestId', expenseForm.requestId);
      formData.append('amountSpent', expenseForm.amountSpent);
      formData.append('description', expenseForm.description);
      formData.append('category', expenseForm.category);
      formData.append('receipt', receiptFile);
      formData.append('proof', proofFile);

      console.log('📤 Sending request to /volunteer/expenses...');

      const response = await API.post('/volunteer/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        const fraudAnalysis = response.data.fraudAnalysis || {};
        const expense = response.data.data || {};

        console.log('📊 Fraud Analysis:', fraudAnalysis);
        console.log('💾 Expense Data:', expense);

        // Build detailed message
        let message = '✅ Expense submitted successfully!\n\n';

        if (fraudAnalysis.score !== undefined) {
          message += '📊 FRAUD ANALYSIS:\n';
          message += `   Score: ${fraudAnalysis.score}/100\n`;
          message += `   Risk Level: ${fraudAnalysis.riskLevel || 'N/A'}\n`;
          message += `   ${fraudAnalysis.recommendation || 'No recommendation'}\n`;

          if (fraudAnalysis.autoFlagged) {
            message += '\n⚠️ This expense has been auto-flagged for admin review due to high fraud score.';
          }
        }

        // Show GST info if available
        if (expense.gstNumber) {
          message += `\n\n🏢 GST VALIDATION:\n`;
          message += `   GST Number: ${expense.gstNumber}\n`;
          message += `   Valid: ${expense.gstValid ? '✅ Yes' : '❌ No'}\n`;
          if (expense.gstBusinessName) {
            message += `   Business: ${expense.gstBusinessName}\n`;
          }
        } else {
          message += '\n\n⚠️ No GST number found on receipt';
        }

        alert(message);
        setShowExpenseModal(false);

        // Reset form
        setExpenseForm({
          requestId: '',
          amountSpent: '',
          description: '',
          category: 'general'
        });
        setReceiptFile(null);
        setProofFile(null);
        setReceiptPreview(null);
        setProofPreview(null);

        console.log('🔄 Refreshing dashboard data...');
        fetchDashboardData();
      } else {
        console.error('❌ Server returned success: false');
        alert('Failed to submit expense: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error submitting expense:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit expense';
      alert('Error: ' + errorMessage);
    } finally {
      setIsSubmittingExpense(false);
      console.log('✅ Submission process completed');
    }
  };
  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!taskForm.title || !taskForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (isCreatingTask) return; // Prevent multiple submissions

    try {
      setIsCreatingTask(true);
      const response = await API.post('/volunteer/tasks', taskForm);

      if (response.data.success) {
        alert('Task created successfully!');
        setShowTaskModal(false);
        setTaskForm({
          campaignId: '',
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          notes: ''
        });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };
  // Update Task Status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await API.patch(`/volunteer/tasks/${taskId}`, { status: newStatus });

      if (response.data.success) {
        alert('Task status updated!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    }
  };
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  // Get filtered data
  const getFilteredRequests = () => {
    if (requestFilter === 'all') return volunteerRequests;
    return volunteerRequests.filter(req => req.status === requestFilter);
  };
  const getFilteredExpenses = () => {
    if (expenseFilter === 'all') return expenses;
    return expenses.filter(exp => exp.requestId?._id === expenseFilter);
  };
  const getFilteredTasks = () => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter(task => task.status === taskFilter);
  };
  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  return (
    <div className={`volunteer-dashboard-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-text">FUNDEX</div>
            <div className="logo-subtitle">VOLUNTEER PORTAL</div>
          </div>
          <div className="header-actions">
            <NotificationDropdown darkMode={darkMode} />
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <div className="user-profile-container">
              <div className="user-profile">
                <div className="avatar">
                  {user?.fullName?.charAt(0) || 'V'}
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.fullName || 'Volunteer'}</div>
                </div>
              </div>
              <button className="logout-hover-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Fund Requests
        </button>
        <button
          className={`nav-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </button>
        <button
          className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`nav-tab ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </button>
      </nav>
      {/* Main Content */}
      <main className="dashboard-main">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-box wallet-bg">
                  <Wallet size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Allocated</div>
                  <div className="stat-value">{formatCurrency(stats.totalAllocated)}</div>
                  <div className="stat-badge positive">
                    {stats.approvedRequests} Approved
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-box trending-bg">
                  <TrendingUp size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Spent</div>
                  <div className="stat-value">{formatCurrency(stats.totalSpent)}</div>
                  <div className="stat-badge">
                    {stats.totalExpenses} Expenses
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-box heart-bg">
                  <Heart size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Remaining Balance</div>
                  <div className="stat-value">{formatCurrency(stats.remainingBalance)}</div>
                  <div className="stat-badge">
                    Available Funds
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-box alert-bg">
                  <Target size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Tasks Completed</div>
                  <div className="stat-value">{stats.completedTasks}/{stats.totalTasks}</div>
                  <div className="stat-badge">
                    {stats.pendingTasks} Pending
                  </div>
                </div>
              </div>
            </div>
            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h3 className="section-subtitle">Quick Actions</h3>
              <div className="quick-actions-grid">
                <div className="quick-action-card" onClick={() => setShowRequestModal(true)}>
                  <DollarSign size={32} />
                  <h4>Request Funds</h4>
                  <p>Submit a new funding request</p>
                </div>
                <div className="quick-action-card" onClick={() => setShowExpenseModal(true)}>
                  <Upload size={32} />
                  <h4>Submit Expense</h4>
                  <p>Upload receipt and details</p>
                </div>
                <div className="quick-action-card" onClick={() => setShowTaskModal(true)}>
                  <Plus size={32} />
                  <h4>Create Task</h4>
                  <p>Add a new task to track</p>
                </div>
                <div className="quick-action-card" onClick={() => setShowUpdateModal(true)}>
                  <Send size={32} />
                  <h4>Post Update</h4>
                  <p>Share campaign progress</p>
                </div>
              </div>
            </div>
            {/* Recent Requests */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">Recent Fund Requests</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('requests')}>
                  View All
                </button>
              </div>
              <div className="requests-list">
                {volunteerRequests.slice(0, 5).map((request) => (
                  <div key={request._id} className="request-item">
                    <div className="request-info">
                      <div className="request-purpose">{request.purpose}</div>
                      <div className="request-campaign">
                        {request.campaignId?.title || 'General Request'}
                      </div>
                    </div>
                    <div className="request-details">
                      <div className="request-amount">
                        {formatCurrency(request.requestedAmount)}
                      </div>
                      <div className={`request-status ${request.status}`}>
                        {request.status === 'approved' && <CheckCircle size={14} />}
                        {request.status === 'pending' && <Clock size={14} />}
                        {request.status === 'rejected' && <XCircle size={14} />}
                        {request.status}
                      </div>
                    </div>
                  </div>
                ))}
                {volunteerRequests.length === 0 && (
                  <div className="empty-state">
                    <AlertCircle size={48} />
                    <p>No fund requests yet</p>
                    <button className="btn-primary" onClick={() => setShowRequestModal(true)}>
                      Create Your First Request
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Recent Tasks */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">Active Tasks</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('tasks')}>
                  View All
                </button>
              </div>
              <div className="tasks-grid">
                {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                  <div key={task._id} className="task-card">
                    <div className="task-card-header">
                      <div>
                        <div className="task-title">{task.title}</div>
                        <div className="task-campaign">
                          {task.campaignId?.title || 'General Task'}
                        </div>
                      </div>
                      <div className={`priority-badge ${task.priority}`}>
                        {task.priority}
                      </div>
                    </div>
                    <div className="task-description">{task.description}</div>
                    <div className="task-footer">
                      <div className="task-meta">
                        <span>
                          <Calendar size={14} />
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      <select
                        className="status-select"
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status !== 'completed').length === 0 && (
                  <div className="empty-state">
                    <CheckCircle size={48} />
                    <p>All tasks completed!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {/* Fund Requests Tab */}
        {activeTab === 'requests' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">Fund Requests</h2>
              <div className="header-actions-row">
                <select
                  className="filter-select"
                  value={requestFilter}
                  onChange={(e) => setRequestFilter(e.target.value)}
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button className="btn-create-campaign" onClick={() => setShowRequestModal(true)}>
                  <Plus size={20} />
                  New Request
                </button>
              </div>
            </div>
            <div className="requests-list">
              {getFilteredRequests().map((request) => (
                <div key={request._id} className="request-item-detailed">
                  <div className="request-header">
                    <div className="request-info">
                      <div className="request-purpose">{request.purpose}</div>
                      <div className="request-campaign">
                        {request.campaignId?.title || 'General Request'}
                      </div>
                      <div className="request-description">{request.description}</div>
                    </div>
                    <div className={`request-status ${request.status}`}>
                      {request.status === 'approved' && <CheckCircle size={16} />}
                      {request.status === 'pending' && <Clock size={16} />}
                      {request.status === 'rejected' && <XCircle size={16} />}
                      {request.status}
                    </div>
                  </div>
                  <div className="request-amounts">
                    <div className="amount-item">
                      <div className="amount-label">Requested</div>
                      <div className="amount-value">{formatCurrency(request.requestedAmount)}</div>
                    </div>
                    {request.status === 'approved' && (
                      <>
                        <div className="amount-item">
                          <div className="amount-label">Approved</div>
                          <div className="amount-value">{formatCurrency(request.approvedAmount)}</div>
                        </div>
                        <div className="amount-item">
                          <div className="amount-label">Spent</div>
                          <div className="amount-value">{formatCurrency(request.totalSpent)}</div>
                        </div>
                        <div className="amount-item">
                          <div className="amount-label">Remaining</div>
                          <div className="amount-value">{formatCurrency(request.remainingAmount)}</div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="request-footer">
                    <div className="request-meta">
                      <span>
                        <Calendar size={14} />
                        {formatDate(request.createdAt)}
                      </span>
                      <span className={`urgency-badge ${request.urgency}`}>
                        {request.urgency} urgency
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {getFilteredRequests().length === 0 && (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <p>No requests found</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">Expenses</h2>
              <div className="header-actions-row">
                <select
                  className="filter-select"
                  value={expenseFilter}
                  onChange={(e) => setExpenseFilter(e.target.value)}
                >
                  <option value="all">All Expenses</option>
                  {volunteerRequests
                    .filter(req => req.status === 'approved')
                    .map(req => (
                      <option key={req._id} value={req._id}>
                        {req.purpose}
                      </option>
                    ))}
                </select>
                <button className="btn-create-campaign" onClick={() => setShowExpenseModal(true)}>
                  <Plus size={20} />
                  Submit Expense
                </button>
              </div>
            </div>
            <div className="expenses-grid">
              {getFilteredExpenses().map((expense) => (
                <div key={expense._id} className="expense-card">
                  <div className="expense-header">
                    <div className="expense-category">{expense.category}</div>
                    <div className="expense-amount">{formatCurrency(expense.amountSpent)}</div>
                  </div>

                  {/* Fraud Score Badge */}
                  {expense.fraudScore !== undefined && (
                    <div className="fraud-analysis-section">
                      <div className="fraud-score-badge" style={{
                        backgroundColor:
                          expense.fraudScore >= 80 ? '#dc2626' :  // CRITICAL - Red
                            expense.fraudScore >= 60 ? '#ea580c' :  // HIGH - Orange
                              expense.fraudScore >= 40 ? '#f59e0b' :  // MEDIUM - Yellow
                                expense.fraudScore >= 20 ? '#3b82f6' :  // LOW - Blue
                                  '#10b981',                               // MINIMAL - Green
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        <Shield size={14} />
                        Fraud Score: {expense.fraudScore}/100 ({expense.fraudRiskLevel})
                      </div>
                    </div>
                  )}

                  {/* GST Validation Badge */}
                  {expense.gstNumber && (
                    <div className="gst-validation-section" style={{ marginBottom: '8px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor: expense.gstValid ? '#ecfdf5' : '#fef2f2',
                        borderRadius: '8px',
                        border: `1px solid ${expense.gstValid ? '#10b981' : '#ef4444'}`
                      }}>
                        {expense.gstValid ? (
                          <BadgeCheck size={16} style={{ color: '#10b981' }} />
                        ) : (
                          <Ban size={16} style={{ color: '#ef4444' }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: expense.gstValid ? '#065f46' : '#991b1b' }}>
                            GST: {expense.gstNumber}
                          </div>
                          {expense.gstBusinessName && (
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                              {expense.gstBusinessName}
                            </div>
                          )}
                        </div>
                        {expense.gstApiVerified && (
                          <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '600' }}>
                            ✓ Verified
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Status */}
                  {expense.verificationStatus && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor:
                          expense.verificationStatus === 'approved' ? '#ecfdf5' :
                            expense.verificationStatus === 'flagged' ? '#fef2f2' : '#f3f4f6',
                        color:
                          expense.verificationStatus === 'approved' ? '#065f46' :
                            expense.verificationStatus === 'flagged' ? '#991b1b' : '#374151'
                      }}>
                        {expense.verificationStatus === 'approved' && '✓ '}
                        {expense.verificationStatus === 'flagged' && '⚠ '}
                        {expense.verificationStatus === 'pending' && '⏳ '}
                        {expense.verificationStatus.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="expense-request">
                    Related to: {expense.requestId?.purpose || 'N/A'}
                  </div>
                  <div className="expense-description">{expense.description}</div>

                  {expense.receiptImage && (
                    <div className="expense-receipt">
                      <img src={expense.receiptImage} alt="Receipt" />
                    </div>
                  )}
                  <div className="expense-footer">
                    <div className="expense-date">
                      <Calendar size={14} />
                      {formatDate(expense.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              {getFilteredExpenses().length === 0 && (
                <div className="empty-state">
                  <FileText size={48} />
                  <p>No expenses recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">Tasks</h2>
              <div className="header-actions-row">
                <select
                  className="filter-select"
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="btn-create-campaign" onClick={() => setShowTaskModal(true)}>
                  <Plus size={20} />
                  New Task
                </button>
              </div>
            </div>
            <div className="tasks-detailed-list">
              {getFilteredTasks().map((task) => (
                <div key={task._id} className="task-detail-card">
                  <div className="task-detail-header">
                    <div className="task-header-row">
                      <div className="task-detail-title">{task.title}</div>
                      <div className={`priority-badge ${task.priority}`}>
                        {task.priority}
                      </div>
                    </div>
                    <div className="task-detail-campaign">
                      {task.campaignId?.title || 'General Task'}
                    </div>
                    <div className="task-detail-description">{task.description}</div>
                  </div>
                  <div className="task-detail-meta">
                    <div className="meta-item">
                      <Calendar size={16} />
                      <span>Due: {formatDate(task.dueDate)}</span>
                    </div>
                    <div className="meta-item">
                      <Activity size={16} />
                      <span>Status: {task.status}</span>
                    </div>
                  </div>
                  {task.notes && (
                    <div className="task-notes">
                      <strong>Notes:</strong> {task.notes}
                    </div>
                  )}
                  <div className="task-actions">
                    <select
                      className="status-select"
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
              {getFilteredTasks().length === 0 && (
                <div className="empty-state">
                  <CheckCircle size={48} />
                  <p>No tasks found</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">Available Campaigns</h2>
            </div>
            <div className="campaigns-grid">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="campaign-card">
                  {campaign.coverImage && (
                    <div className="campaign-image">
                      <img src={campaign.coverImage} alt={campaign.title} />
                    </div>
                  )}
                  <div className="campaign-content">
                    <div className="campaign-title">{campaign.title}</div>
                    <div className="campaign-description">{campaign.shortDescription}</div>
                    <div className="campaign-progress">
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="progress-info-row">
                        <span>{formatCurrency(campaign.raisedAmount)} raised</span>
                        <span>{formatCurrency(campaign.targetAmount)} goal</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="empty-state">
                  <Heart size={48} />
                  <p>No active campaigns</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* Request Fund Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Funds</h2>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Campaign (Optional)</label>
                <select
                  value={requestForm.campaignId}
                  onChange={(e) => setRequestForm({ ...requestForm, campaignId: e.target.value })}
                >
                  <option value="">Select Campaign</option>
                  {campaigns.map(campaign => (
                    <option key={campaign._id} value={campaign._id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Purpose *</label>
                <input
                  type="text"
                  placeholder="e.g., Medical supplies for health camp"
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Provide details about the fund request"
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Requested Amount *</label>
                <input
                  type="number"
                  placeholder="Enter amount in ₹"
                  value={requestForm.requestedAmount}
                  onChange={(e) => setRequestForm({ ...requestForm, requestedAmount: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Urgency</label>
                <select
                  value={requestForm.urgency}
                  onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? '⏳ Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Submit Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Expense</h2>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitExpense}>
              <div className="form-group">
                <label>Fund Request *</label>
                <select
                  value={expenseForm.requestId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, requestId: e.target.value })}
                  required
                >
                  <option value="">Select Approved Request</option>
                  {volunteerRequests
                    .filter(req => req.status === 'approved')
                    .map(req => (
                      <option key={req._id} value={req._id}>
                        {req.purpose} - {formatCurrency(req.remainingAmount)} remaining
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount Spent *</label>
                <input
                  type="number"
                  placeholder="Enter amount in ₹"
                  value={expenseForm.amountSpent}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amountSpent: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="medical">Medical</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="supplies">Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the expense"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Receipt Image * (Max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  required
                />
                {receiptPreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '5px'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Proof Image * (Max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofChange}
                  required
                />
                {proofPreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '5px'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingExpense}>
                  {isSubmittingExpense ? '⏳ Submitting...' : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Campaign (Optional)</label>
                <select
                  value={taskForm.campaignId}
                  onChange={(e) => setTaskForm({ ...taskForm, campaignId: e.target.value })}
                >
                  <option value="">Select Campaign</option>
                  {campaigns.map(campaign => (
                    <option key={campaign._id} value={campaign._id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Task description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  placeholder="Additional notes"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isCreatingTask}>
                  {isCreatingTask ? '⏳ Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VolunteerDashboard;