import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Bell,
  Wallet,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Check,
  X,
  Filter,
  Calendar,
  Users,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Activity,
  DollarSign,
  Target,
  Plus,
  Edit,
  Trash2,
  Share2,
  BarChart3,
  MapPin,
  Upload,
  Award,
  Download,
} from "lucide-react";
import "./AdminDashboard.css";
import Reports from "./Reports";
import API from "../services/api";
import NotificationDropdown from "../components/NotificationDropdown";

export default function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    category: "Healthcare",
    description: "",
    targetAmount: "",
    location: "",
    duration: "30",
    urgency: "medium",
    coverImage: "" // Image URL or base64
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Default campaign image
  const DEFAULT_CAMPAIGN_IMAGE = "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop";

  // Funding Request State
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [donorSearchQuery, setDonorSearchQuery] = useState("");
  const [donorSearchResults, setDonorSearchResults] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [fundingRequestForm, setFundingRequestForm] = useState({
    campaignId: "",
    amount: "",
    message: "",
    urgency: "medium"
  });
  const [isSearchingDonor, setIsSearchingDonor] = useState(false);

  // State for volunteer requests
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // State for expenses
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showFlaggedListModal, setShowFlaggedListModal] = useState(false);
  const [verifiedExpenses, setVerifiedExpenses] = useState([]);
  const [flaggedExpenses, setFlaggedExpenses] = useState([]);

  // State for volunteers list
  const [volunteersList, setVolunteersList] = useState([]);
  const [volunteersLoading, setVolunteersLoading] = useState(true);

  // State for dashboard stats
  const [stats, setStats] = useState({
    totalFunds: 0,
    availableFunds: 0,
    pendingRequests: 0,
    pendingVerification: 0,
    transparencyScore: 0,
    fraudAlerts: 0,
    activeCampaigns: 0,
    totalDonors: 0,
    totalAllocated: 0,
    totalSpent: 0,
    totalRaised: 0,
    totalDonations: 0,
    approvedRequests: 0,
    verifiedExpenses: 0,
    totalCampaigns: 0,
    completedCampaigns: 0,
    registeredDonors: 0,
    totalVolunteers: 0,
    avgCampaignProgress: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  // Fetch user, campaigns, volunteer requests, stats, and expenses from database
  useEffect(() => {
    fetchCurrentUser();
    fetchCampaigns();
    fetchVolunteerRequests();
    fetchDashboardStats();
    fetchDashboardStats();
    fetchExpenses();
    fetchVolunteersList();
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Fetch current user information
  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      // If auth fails, might want to redirect to login
      // window.location.href = '/login';
    } finally {
      setUserLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/admin/campaigns', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await response.json();

      // Transform database data to match component structure
      const transformedCampaigns = data.map(campaign => ({
        id: campaign._id || campaign.id,
        _id: campaign._id, // Keep MongoDB ID for funding requests
        title: campaign.title,
        category: campaign.category,
        description: campaign.description || campaign.shortDescription,
        ngo: campaign.ngoName,
        location: `${campaign.location?.city || ''}, ${campaign.location?.state || ''}`.trim(),
        targetAmount: campaign.targetAmount || 0,
        raisedAmount: campaign.raisedAmount || 0,
        allocatedAmount: campaign.allocatedAmount || 0,
        spentAmount: campaign.spentAmount || 0,
        progress: campaign.stats?.progress || Math.round((campaign.raisedAmount / campaign.targetAmount) * 100) || 0,
        status: campaign.status || 'active',
        urgency: campaign.urgency || 'medium',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        daysLeft: campaign.endDate ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0,
        backers: campaign.stats?.totalDonors || 0,
        volunteers: campaign.stats?.totalVolunteers || 0,
        receiptsVerified: 0,
        receiptsPending: 0,
        transparencyScore: campaign.stats?.transparencyScore || 0
      }));

      setCampaigns(transformedCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch volunteer requests from database
  const fetchVolunteerRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/requests/pending', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch volunteer requests');
      }

      const data = await response.json();

      // Transform database data to match component structure
      const transformedRequests = data.map(request => {
        const totalSpent = request.totalSpent || 0;
        const approvedAmount = request.approvedAmount || 0;
        const requestedAmount = request.requestedAmount || 0;

        // Calculate progress based on approved vs requested amount
        const progress = requestedAmount > 0
          ? Math.round((approvedAmount / requestedAmount) * 100)
          : 0;

        // Determine status based on approval and spending
        let displayStatus = 'pending';
        if (request.status === 'approved' && totalSpent >= approvedAmount) {
          displayStatus = 'completed';
        } else if (request.status === 'approved') {
          displayStatus = 'active';
        }

        return {
          id: request._id,
          title: request.purpose || 'No purpose specified',
          ngo: request.volunteerId?.fullName || request.volunteerId?.email || 'Unknown Volunteer',
          fundedAmount: approvedAmount,
          goalAmount: requestedAmount,
          progress: progress,
          status: displayStatus,
          urgency: 'medium', // Default urgency, can be added to schema later
          volunteerId: request.volunteerId?._id,
          volunteerEmail: request.volunteerId?.email,
          totalSpent: totalSpent,
          remainingAmount: request.remainingAmount || (approvedAmount - totalSpent),
          createdAt: request.createdAt,
          dbStatus: request.status // Keep original status for approve/reject
        };
      });

      setVolunteerRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching volunteer requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/stats/dashboard', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      // Keep default values if fetch fails
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch expenses from database
  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/expenses', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();

      // Transform and filter for pending verifications
      const transformedExpenses = data.map(e => ({
        id: e._id,
        title: e.purpose || 'Expense',
        volunteer: e.volunteer,
        campaign: e.campaignName || "General Campaign",
        amount: e.amountSpent || 0,
        receiptsCount: (e.receiptImage ? 1 : 0) + (e.proofImage ? 1 : 0),
        receiptImage: e.receiptImage,
        proofImage: e.proofImage,
        aiStatus: (e.fraudScore > 30) ? 'flagged' : 'verified',
        fraudScore: e.fraudScore || 0,  // Use actual fraud score from backend
        fraudFlags: e.fraudFlags || [],
        ocrExtracted: e.ocrExtracted || '',
        detectedAmount: e.detectedAmount || null,
        submissionDate: e.createdAt || new Date().toISOString(),
        verificationStatus: e.verificationStatus || 'pending',
        flaggedReason: e.flaggedReason || ''
      }));

      setExpenses(transformedExpenses);

      // NOTE: Verified/Flagged managed by local state (approve/flag buttons)
      // const verified = transformedExpenses.filter(e => e.verificationStatus === 'approved');
      // const flagged = transformedExpenses.filter(e => e.verificationStatus === 'flagged');
      // setVerifiedExpenses(verified);
      // setFlaggedExpenses(flagged);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Fetch volunteers list
  const fetchVolunteersList = async () => {
    try {
      setVolunteersLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/volunteers/list', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setVolunteersList(await response.json());
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
    } finally {
      setVolunteersLoading(false);
    }
  };

  const handleApproveVolunteer = async (volunteerId) => {
    if (!confirm('Approve this volunteer? They will gain access to the dashboard.')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/volunteers/${volunteerId}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'approved' })
      });
      if (response.ok) {
        alert('Volunteer approved successfully');
        fetchVolunteersList();
      } else {
        alert('Failed to approve volunteer');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving volunteer');
    }
  };

  const handleRejectVolunteer = async (volunteerId) => {
    if (!confirm('Reject this volunteer?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/volunteers/${volunteerId}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'rejected' })
      });
      if (response.ok) {
        alert('Volunteer rejected');
        fetchVolunteersList();
      } else {
        alert('Failed to reject volunteer');
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting volunteer');
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  // Helper function to get user initials
  const getUserInitials = () => {
    if (!user || !user.fullName) return 'AD';
    const names = user.fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  };

  // Helper function to get display name
  const getDisplayName = () => {
    if (!user) return 'Admin';
    return user.fullName || user.email || 'Admin';
  };

  const categories = ["Healthcare", "Education", "Food & Nutrition", "Water & Sanitation", "Environment", "Animal Welfare", "Disaster Relief", "Women Empowerment"];
  const urgencyLevels = ["low", "medium", "high"];

  const handleApprove = async (id) => {
    const request = volunteerRequests.find(r => r.id === id);
    if (!request) return;

    const approvedAmount = prompt(
      `Enter approved amount for "${request.title}" (Requested: ₹${request.goalAmount})`,
      request.goalAmount
    );

    if (!approvedAmount || isNaN(approvedAmount)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/requests/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          approvedAmount: parseInt(approvedAmount),
          comments: 'Approved by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      alert(`Request approved successfully!`);
      // Refresh the volunteer requests list
      fetchVolunteerRequests();
      fetchDashboardStats();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    const request = volunteerRequests.find(r => r.id === id);
    if (!request) return;

    const comments = prompt(
      `Enter reason for rejecting "${request.title}"`,
      'Request does not meet requirements'
    );

    if (!comments) return;

    if (!confirm(`Are you sure you want to reject this request?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/requests/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comments })
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      alert(`Request rejected successfully!`);
      // Refresh the volunteer requests list
      fetchVolunteerRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request: ' + err.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setCampaignForm(prev => ({
          ...prev,
          coverImage: reader.result // Store base64 for now
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCampaignForm(prev => ({
      ...prev,
      coverImage: ""
    }));
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    try {
      const newCampaign = {
        title: campaignForm.title,
        slug: campaignForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        category: campaignForm.category,
        description: campaignForm.description,
        shortDescription: campaignForm.description.substring(0, 150) + '...',
        coverImage: campaignForm.coverImage || DEFAULT_CAMPAIGN_IMAGE, // Use uploaded image or default
        // ngoName and ngoId will be set by backend from logged-in admin
        location: {
          city: campaignForm.location.split(',')[0]?.trim() || '',
          state: campaignForm.location.split(',')[1]?.trim() || '',
          country: 'India'
        },
        targetAmount: parseInt(campaignForm.targetAmount),
        raisedAmount: 0,
        allocatedAmount: 0,
        spentAmount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + parseInt(campaignForm.duration) * 24 * 60 * 60 * 1000),
        status: "active",
        urgency: campaignForm.urgency,
        stats: {
          totalDonors: 0,
          totalVolunteers: 0,
          progress: 0,
          transparencyScore: 100
        }
      };

      const response = await fetch('http://localhost:5000/api/admin/campaigns', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCampaign)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.details || 'Failed to create campaign');
      }

      const createdCampaign = await response.json();
      const transformedCampaign = {
        id: createdCampaign._id,
        _id: createdCampaign._id,
        title: createdCampaign.title,
        category: createdCampaign.category,
        description: createdCampaign.description,
        coverImage: createdCampaign.coverImage || DEFAULT_CAMPAIGN_IMAGE,
        ngo: createdCampaign.ngoName,
        location: `${createdCampaign.location?.city}, ${createdCampaign.location?.state}`.trim(),
        targetAmount: createdCampaign.targetAmount,
        raisedAmount: createdCampaign.raisedAmount,
        allocatedAmount: createdCampaign.allocatedAmount,
        spentAmount: createdCampaign.spentAmount,
        progress: 0,
        status: createdCampaign.status,
        urgency: createdCampaign.urgency,
        startDate: new Date(createdCampaign.startDate).toISOString().split('T')[0],
        endDate: new Date(createdCampaign.endDate).toISOString().split('T')[0],
        daysLeft: parseInt(campaignForm.duration),
        backers: 0,
        volunteers: 0,
        receiptsVerified: 0,
        receiptsPending: 0,
        transparencyScore: 100
      };

      setCampaigns([transformedCampaign, ...campaigns]);

      setShowCreateCampaign(false);
      setCampaignForm({
        title: "",
        category: "Healthcare",
        description: "",
        targetAmount: "",
        location: "",
        duration: "30",
        urgency: "medium",
        coverImage: ""
      });
      setImageFile(null);
      setImagePreview(null);
      alert("Campaign created successfully!");
    } catch (err) {
      console.error('Error creating campaign:', err);
      alert('Failed to create campaign: ' + err.message);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/campaigns/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      setCampaigns(campaigns.filter(c => c.id !== id));
      alert("Campaign deleted successfully!");
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Failed to delete campaign: ' + err.message);
    }
  };

  const handlePauseCampaign = async (id) => {
    try {
      const campaign = campaigns.find(c => c.id === id);
      const newStatus = campaign.status === "paused" ? "active" : "paused";

      const response = await fetch(`http://localhost:5000/api/admin/campaigns/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }

      setCampaigns(campaigns.map(c =>
        c.id === id ? { ...c, status: newStatus } : c
      ));
    } catch (err) {
      console.error('Error updating campaign:', err);
      alert('Failed to update campaign: ' + err.message);
    }
  };

  const handleEditCampaign = (campaign) => {
    // Populate form with existing campaign data
    const durationInDays = campaign.daysLeft || 30;
    setCampaignForm({
      title: campaign.title,
      category: campaign.category,
      description: campaign.description,
      targetAmount: campaign.targetAmount.toString(),
      location: campaign.location,
      duration: durationInDays.toString(),
      urgency: campaign.urgency
    });
    setSelectedCampaign(campaign);
    setShowCreateCampaign(true);
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();

    if (!selectedCampaign) {
      alert('No campaign selected for editing');
      return;
    }

    try {
      const updatedData = {
        title: campaignForm.title,
        category: campaignForm.category,
        description: campaignForm.description,
        shortDescription: campaignForm.description.substring(0, 150) + '...',
        // ngoName should not be updated - it's managed by backend
        location: {
          city: campaignForm.location.split(',')[0]?.trim() || '',
          state: campaignForm.location.split(',')[1]?.trim() || '',
          country: 'India'
        },
        targetAmount: parseInt(campaignForm.targetAmount),
        endDate: new Date(Date.now() + parseInt(campaignForm.duration) * 24 * 60 * 60 * 1000),
        urgency: campaignForm.urgency
      };

      const response = await fetch(`http://localhost:5000/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update campaign');
      }

      const updatedCampaign = await response.json();

      // Transform and update in state
      const transformedCampaign = {
        id: updatedCampaign._id,
        _id: updatedCampaign._id,
        title: updatedCampaign.title,
        category: updatedCampaign.category,
        description: updatedCampaign.description,
        ngo: updatedCampaign.ngoName,
        location: `${updatedCampaign.location?.city}, ${updatedCampaign.location?.state}`.trim(),
        targetAmount: updatedCampaign.targetAmount,
        raisedAmount: updatedCampaign.raisedAmount,
        allocatedAmount: updatedCampaign.allocatedAmount,
        spentAmount: updatedCampaign.spentAmount,
        progress: Math.round((updatedCampaign.raisedAmount / updatedCampaign.targetAmount) * 100) || 0,
        status: updatedCampaign.status,
        urgency: updatedCampaign.urgency,
        startDate: new Date(updatedCampaign.startDate).toISOString().split('T')[0],
        endDate: new Date(updatedCampaign.endDate).toISOString().split('T')[0],
        daysLeft: Math.max(0, Math.ceil((new Date(updatedCampaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))),
        backers: updatedCampaign.stats?.totalDonors || 0,
        volunteers: updatedCampaign.stats?.totalVolunteers || 0,
        receiptsVerified: 0,
        receiptsPending: 0,
        transparencyScore: updatedCampaign.stats?.transparencyScore || 0
      };

      setCampaigns(campaigns.map(c =>
        c.id === selectedCampaign.id ? transformedCampaign : c
      ));

      setShowCreateCampaign(false);
      setSelectedCampaign(null);
      setCampaignForm({
        title: "",
        category: "Healthcare",
        description: "",
        targetAmount: "",
        location: "",
        duration: "30",
        urgency: "medium"
      });
      alert("Campaign updated successfully!");
    } catch (err) {
      console.error('Error updating campaign:', err);
      alert('Failed to update campaign: ' + err.message);
    }
  };

  const handleSearchDonors = async (query) => {
    if (!query || query.length < 2) {
      setDonorSearchResults([]);
      return;
    }

    setIsSearchingDonor(true);
    try {
      const response = await fetch(`http://localhost:5000/api/donationrequests/search/donors?query=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to search donors');
      }

      const data = await response.json();
      setDonorSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching donors:', error);
      setDonorSearchResults([]);
    } finally {
      setIsSearchingDonor(false);
    }
  };

  // ============ SIMPLIFIED APPROVE/FLAG HANDLERS (LOCAL STATE ONLY) ============

  // Quick Approve - No backend, just update local state
  const handleApproveExpense = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Remove from pending list
    setExpenses(prev => prev.filter(e => e.id !== expenseId));

    // Add to verified list
    setVerifiedExpenses(prev => [...prev, { ...expense, verificationStatus: 'approved' }]);

    // Close modals
    setShowExpenseDetailModal(false);
    setSelectedExpense(null);

    alert('✅ Expense approved! View in "Verified" modal.');
  };

  // Quick Flag - No backend, just update local state
  const handleFlagExpense = () => {
    if (!flagReason.trim()) {
      alert('Please provide a reason for flagging');
      return;
    }

    const expense = selectedExpense;
    if (!expense) return;

    // Remove from pending list
    setExpenses(prev => prev.filter(e => e.id !== expense.id));

    // Add to flagged list
    setFlaggedExpenses(prev => [...prev, {
      ...expense,
      verificationStatus: 'flagged',
      flaggedReason: flagReason
    }]);

    // Close modals and reset
    setShowFlagModal(false);
    setShowExpenseDetailModal(false);
    setSelectedExpense(null);
    setFlagReason('');

    alert('🚩 Expense flagged! View in "Flagged" modal.');
  };

  // Handle PDF download for expenses
  const handleDownloadExpensePDF = (expense) => {
    // Create a simple HTML content for PDF
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Expense Report - ${expense.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; margin-left: 10px; }
          .fraud-high { background: #ffebee; padding: 15px; border-left: 4px solid #c62828; }
          .fraud-low { background: #e8f5e9; padding: 15px; border-left: 4px solid #2e7d32; }
          img { max-width: 400px; margin: 10px 0; border: 2px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Expense Verification Report</h1>
        <div class="section">
          <p><span class="label">Title:</span><span class="value">${expense.title}</span></p>
          <p><span class="label">Volunteer:</span><span class="value">${expense.volunteer}</span></p>
          <p><span class="label">Campaign:</span><span class="value">${expense.campaign}</span></p>
          <p><span class="label">Amount:</span><span class="value">₹${expense.amount.toLocaleString()}</span></p>
          <p><span class="label">Fraud Score:</span><span class="value">${expense.fraudScore}%</span></p>
          <p><span class="label">Status:</span><span class="value">${expense.aiStatus}</span></p>
          <p><span class="label">Date:</span><span class="value">${new Date(expense.submissionDate).toLocaleDateString()}</span></p>
        </div>
        <div class="section ${expense.fraudScore > 30 ? 'fraud-high' : 'fraud-low'}">
          <h3>Verification Status</h3>
          <p>${expense.fraudScore > 30 ? '⚠️ High Risk - Manual Review Required' : '✓ Low Risk - Safe to Approve'}</p>
        </div>
        <div class="section">
          <h3>Receipt Image</h3>
          <p>URL: <a href="${expense.receiptImage}">${expense.receiptImage}</a></p>
        </div>
        <div class="section">
          <h3>Proof Image</h3>
          <p>URL: <a href="${expense.proofImage}">${expense.proofImage}</a></p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-report-${expense.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('Report downloaded! Open the HTML file in your browser and use Print > Save as PDF');
  };

  const handleSelectDonor = (donor) => {
    setSelectedDonor(donor);
    setDonorSearchQuery("");
    setDonorSearchResults([]);
  };

  const handleSendFundingRequest = async (e) => {
    e.preventDefault();
    if (!selectedDonor || !fundingRequestForm.campaignId) {
      alert("Please select a donor and a campaign");
      return;
    }

    try {
      const payload = {
        campaignId: fundingRequestForm.campaignId,
        donorId: selectedDonor._id,
        requestedAmount: parseFloat(fundingRequestForm.amount),
        message: fundingRequestForm.message,
        urgency: fundingRequestForm.urgency
      };

      const res = await API.post('/donationrequests', payload);

      if (res.data.success) {
        alert("Funding request sent successfully!");
        setShowFundingModal(false);
        // Reset form
        setSelectedDonor(null);
        setFundingRequestForm({
          campaignId: "",
          amount: "",
          message: "",
          urgency: "medium"
        });
      }
    } catch (err) {
      console.error("Error sending funding request:", err);
      alert(err.response?.data?.message || "Failed to send funding request");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`admin-dashboard-container ${darkMode ? "dark" : "light"}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`admin-dashboard-container ${darkMode ? "dark" : "light"}`}>
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Error loading campaigns</h2>
          <p>{error}</p>
          <button onClick={fetchCampaigns} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box wallet-bg">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Funds</p>
            <h3 className="stat-value">₹{(stats.totalFunds / 100000).toFixed(1)}L</h3>
            <span className="stat-badge positive">+12% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box trending-bg">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Available Balance</p>
            <h3 className="stat-value">₹{(stats.availableFunds / 100000).toFixed(1)}L</h3>
            <span className="stat-badge">Ready to allocate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box heart-bg">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Campaigns</p>
            <h3 className="stat-value">{stats.activeCampaigns}</h3>
            <span className="stat-badge positive">All running smoothly</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box alert-bg">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Fraud Alerts</p>
            <h3 className="stat-value">{stats.fraudAlerts}</h3>
            <span className="stat-badge warning">Needs attention</span>
          </div>
        </div>
      </div>

      {/* Active Campaigns Overview */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Active Campaigns</h2>
          <button className="view-all-btn" onClick={() => setActiveTab("campaigns")}>
            View All
          </button>
        </div>

        <div className="campaigns-overview-grid">
          {campaigns.slice(0, 3).map((campaign) => (
            <div key={campaign.id} className="campaign-overview-card">
              <div className="campaign-card-header">
                <div>
                  <h3 className="campaign-card-title">{campaign.title}</h3>
                  <p className="campaign-ngo">
                    <MapPin size={14} />
                    {campaign.ngo} • {campaign.location}
                  </p>
                </div>
                <span className={`urgency-badge-small ${campaign.urgency}`}>
                  {campaign.urgency}
                </span>
              </div>

              <div className="campaign-stats-row">
                <div className="stat-item">
                  <span className="stat-item-label">Raised</span>
                  <span className="stat-item-value">₹{(campaign.raisedAmount / 1000).toFixed(0)}K</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Goal</span>
                  <span className="stat-item-value">₹{(campaign.targetAmount / 1000).toFixed(0)}K</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">Spent</span>
                  <span className="stat-item-value">₹{(campaign.spentAmount / 1000).toFixed(0)}K</span>
                </div>
              </div>

              <div className="progress-wrapper">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <div className="progress-info-row">
                  <span className="progress-label">{campaign.progress}% funded</span>
                  <span className="days-left-label">
                    <Clock size={12} />
                    {campaign.daysLeft} days left
                  </span>
                </div>
              </div>

              <div className="campaign-meta-row">
                <span className="meta-badge">
                  <Users size={12} />
                  {campaign.backers} donors
                </span>
                <span className="meta-badge">
                  <CheckCircle size={12} />
                  {campaign.receiptsVerified} verified
                </span>
                <span className="meta-badge">
                  <ShieldCheck size={12} />
                  {campaign.transparencyScore}%
                </span>
              </div>

              <button
                className="btn-manage-campaign"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setActiveTab("campaigns");
                }}
              >
                <Eye size={16} />
                Manage Campaign
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Volunteer Requests Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Pending Volunteer Requests</h2>
          <button className="view-all-btn" onClick={() => setActiveTab("requests")}>
            View All
          </button>
        </div>

        <div className="requests-grid">
          {volunteerRequests.slice(0, 3).map((request) => (
            <div key={request.id} className="funding-request-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">{request.title}</h3>
                  <p className="card-ngo">{request.ngo}</p>
                </div>
                <span className={`status-badge ${request.status}`}>
                  {request.status === "completed" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                  {request.status === "completed" ? "Completed" : "Active"}
                </span>
              </div>

              <div className="card-amounts">
                <div className="amount-item">
                  <span className="amount-label">FUNDED</span>
                  <span className="amount-value">₹{request.fundedAmount.toLocaleString()}</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">GOAL</span>
                  <span className="amount-value">₹{request.goalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="progress-wrapper">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${request.progress}%` }}
                  />
                </div>
                <span className="progress-label">{request.progress}% Complete</span>
              </div>

              <div className="card-actions">
                <button className="btn-reject-outline" onClick={() => handleReject(request.id)}>
                  <X size={16} />
                  Reject
                </button>
                <button className="btn-approve" onClick={() => handleApprove(request.id)}>
                  <Check size={16} />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderCampaigns = () => (
    <>
      <div className="campaigns-page-header">
        <div>
          <h2 className="section-title">Campaign Management</h2>
          <p className="page-subtitle">Create and manage donor funding campaigns</p>
        </div>
        <button
          className="btn-create-campaign"
          onClick={() => setShowCreateCampaign(true)}
        >
          <Plus size={20} />
          Create New Campaign
        </button>
      </div>

      {/* Campaign Stats */}
      <div className="campaign-stats-grid">
        <div className="campaign-stat-box">
          <Target size={24} />
          <div>
            <h3>{campaigns.length}</h3>
            <p>Total Campaigns</p>
          </div>
        </div>
        <div className="campaign-stat-box">
          <TrendingUp size={24} />
          <div>
            <h3>{campaigns.filter(c => c.status === "active").length}</h3>
            <p>Active Campaigns</p>
          </div>
        </div>
        <div className="campaign-stat-box">
          <Users size={24} />
          <div>
            <h3>{campaigns.reduce((acc, c) => acc + c.backers, 0)}</h3>
            <p>Total Donors</p>
          </div>
        </div>
        <div className="campaign-stat-box">
          <DollarSign size={24} />
          <div>
            <h3>₹{(campaigns.reduce((acc, c) => acc + c.raisedAmount, 0) / 100000).toFixed(1)}L</h3>
            <p>Total Raised</p>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="campaigns-list">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-detail-card">
            <div className="campaign-detail-header">
              <div className="campaign-detail-info">
                <div className="campaign-category-badge">{campaign.category}</div>
                <h3 className="campaign-detail-title">{campaign.title}</h3>
                <p className="campaign-detail-description">{campaign.description}</p>
                <div className="campaign-detail-meta">
                  <span>
                    <MapPin size={14} />
                    {campaign.location}
                  </span>
                  <span>•</span>
                  <span>{campaign.ngo}</span>
                  <span>•</span>
                  <span>
                    <Calendar size={14} />
                    Ends: {campaign.endDate}
                  </span>
                </div>
              </div>
              <div className="campaign-actions-dropdown">
                <button
                  className={`btn-pause ${campaign.status === "paused" ? "paused" : ""}`}
                  onClick={() => handlePauseCampaign(campaign.id)}
                >
                  {campaign.status === "paused" ? "Resume" : "Pause"}
                </button>
                <button
                  className="btn-edit"
                  onClick={() => handleEditCampaign(campaign)}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="campaign-detail-stats">
              <div className="detail-stat-item">
                <span className="detail-stat-label">Target Amount</span>
                <span className="detail-stat-value">₹{campaign.targetAmount.toLocaleString()}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Raised</span>
                <span className="detail-stat-value success">₹{campaign.raisedAmount.toLocaleString()}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Allocated</span>
                <span className="detail-stat-value">₹{campaign.allocatedAmount.toLocaleString()}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Spent</span>
                <span className="detail-stat-value">₹{campaign.spentAmount.toLocaleString()}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Remaining</span>
                <span className="detail-stat-value warning">₹{(campaign.targetAmount - campaign.raisedAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="progress-wrapper">
              <div className="progress-bar-bg large">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${campaign.progress}%` }}
                />
              </div>
              <div className="progress-info-row">
                <span className="progress-label">{campaign.progress}% funded</span>
                <span className="days-left-label">
                  <Clock size={12} />
                  {campaign.daysLeft} days remaining
                </span>
              </div>
            </div>

            <div className="campaign-detail-footer">
              <div className="campaign-metrics">
                <span className="metric-item">
                  <Users size={14} />
                  {campaign.backers} donors
                </span>
                <span className="metric-item">
                  <Activity size={14} />
                  {campaign.volunteers} volunteers
                </span>
                <span className="metric-item">
                  <CheckCircle size={14} />
                  {campaign.receiptsVerified} receipts verified
                </span>
                <span className="metric-item">
                  <Clock size={14} />
                  {campaign.receiptsPending} pending
                </span>
                <span className="metric-item">
                  <ShieldCheck size={14} />
                  {campaign.transparencyScore}% transparency
                </span>
              </div>
              <button className="btn-view-reports">
                <BarChart3 size={16} />
                View Reports
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="modal-overlay" onClick={() => setShowCreateCampaign(false)}>
          <div className="create-campaign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowCreateCampaign(false);
                  setSelectedCampaign(null);
                  setCampaignForm({
                    title: "",
                    category: "Healthcare",
                    description: "",
                    targetAmount: "",
                    location: "",
                    duration: "30",
                    ngo: "",
                    ngoId: "",
                    urgency: "medium"
                  });
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={selectedCampaign ? handleUpdateCampaign : handleCreateCampaign} className="campaign-form">
              <div className="form-group">
                <label>Campaign Title *</label>
                <input
                  type="text"
                  name="title"
                  value={campaignForm.title}
                  onChange={handleFormChange}
                  placeholder="Enter campaign title"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={campaignForm.category}
                    onChange={handleFormChange}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={campaignForm.description}
                  onChange={handleFormChange}
                  placeholder="Describe the campaign purpose and goals"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={campaignForm.location}
                    onChange={handleFormChange}
                    placeholder="City, State"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Urgency Level *</label>
                  <select
                    name="urgency"
                    value={campaignForm.urgency}
                    onChange={handleFormChange}
                    required
                  >
                    {urgencyLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount (₹) *</label>
                  <input
                    type="number"
                    name="targetAmount"
                    value={campaignForm.targetAmount}
                    onChange={handleFormChange}
                    placeholder="Enter target amount"
                    min="1000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (Days) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={campaignForm.duration}
                    onChange={handleFormChange}
                    placeholder="Campaign duration"
                    min="7"
                    max="365"
                    required
                  />
                </div>
              </div>

              {/* Campaign Image Upload */}
              <div className="form-group">
                <label>Campaign Image (Optional)</label>
                <div className="image-upload-container">
                  {imagePreview || campaignForm.coverImage ? (
                    <div className="image-preview-wrapper">
                      <img
                        src={imagePreview || campaignForm.coverImage || DEFAULT_CAMPAIGN_IMAGE}
                        alt="Campaign preview"
                        className="campaign-image-preview"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={handleRemoveImage}
                      >
                        <X size={16} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <Upload size={32} />
                      <p>Click to upload campaign image</p>
                      <span className="image-upload-hint">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-file-input"
                    id="campaign-image-input"
                  />
                  {!imagePreview && !campaignForm.coverImage && (
                    <label htmlFor="campaign-image-input" className="image-upload-label">
                      Choose Image
                    </label>
                  )}
                </div>
                <p className="form-hint">A default image will be used if you don't upload one</p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel-form"
                  onClick={() => {
                    setShowCreateCampaign(false);
                    setSelectedCampaign(null);
                    setCampaignForm({
                      title: "",
                      category: "Healthcare",
                      description: "",
                      targetAmount: "",
                      location: "",
                      duration: "30",
                      urgency: "medium",
                      coverImage: ""
                    });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit-form">
                  {selectedCampaign ? <Edit size={18} /> : <Plus size={18} />}
                  {selectedCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  const renderVolunteers = () => (
    <section className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Volunteer Management</h2>
      </div>
      <div className="requests-list">
        {volunteersList.map((vol) => (
          <div key={vol._id} className="request-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="request-info">
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{vol.fullName}</div>
              <div style={{ color: '#666' }}>{vol.email}</div>
              <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Role: {vol.volunteerRole}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className={`request-status ${vol.status || 'pending'}`} style={{ textTransform: 'capitalize' }}>
                {vol.status || 'Pending'}
              </div>
              {vol.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleApproveVolunteer(vol._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectVolunteer(vol._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {volunteersList.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <p>No volunteers found.</p>
          </div>
        )}
      </div>
    </section>
  );

  const renderPendingRequests = () => (
    <section className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">All Pending Volunteer Requests</h2>
        <div className="header-actions-row">
          <button
            className="btn-create-request"
            onClick={() => setShowFundingModal(true)}
          >
            <Plus size={18} />
            New Funding Request
          </button>
          <button className="filter-btn">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      {requestsLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading volunteer requests...</p>
        </div>
      ) : volunteerRequests.length === 0 ? (
        <div className="empty-state">
          <p>No pending volunteer requests at the moment.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {volunteerRequests.map((request) => (
            <div key={request.id} className="funding-request-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">{request.title}</h3>
                  <p className="card-ngo">{request.ngo}</p>
                </div>
                <span className={`status-badge ${request.status}`}>
                  {request.status === "completed" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                  {request.status === "completed" ? "Completed" : "Active"}
                </span>
              </div>

              <div className="card-amounts">
                <div className="amount-item">
                  <span className="amount-label">FUNDED</span>
                  <span className="amount-value">₹{request.fundedAmount.toLocaleString()}</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">GOAL</span>
                  <span className="amount-value">₹{request.goalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="progress-wrapper">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${request.progress}%` }}
                  />
                </div>
                <span className="progress-label">{request.progress}% Complete</span>
              </div>

              <div className="card-actions">
                <button className="btn-reject-outline" onClick={() => handleReject(request.id)}>
                  <X size={16} />
                  Reject
                </button>
                <button className="btn-approve" onClick={() => handleApprove(request.id)}>
                  <Check size={16} />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderExpenseVerification = () => (
    <section className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Expense Verification Queue</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setShowVerifiedModal(true)}
          >
            <CheckCircle size={18} />
            Verified ({verifiedExpenses.length})
          </button>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff5252',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setShowFlaggedListModal(true)}
          >
            <AlertCircle size={18} />
            Flagged ({flaggedExpenses.length})
          </button>
          <button className="filter-btn">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      {expensesLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <p>No expenses pending verification.</p>
        </div>
      ) : (
        <div className="verification-grid">
          {expenses.map((expense) => (
            <div key={expense.id} className="verification-card">
              <div className="verification-header">
                <div>
                  <h3 className="card-title">{expense.title}</h3>
                  <p className="card-subtitle">{expense.volunteer} • {expense.campaign}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className={`ai-badge ${expense.aiStatus}`}>
                    <ShieldCheck size={14} />
                    <span>AI {expense.aiStatus}</span>
                  </div>
                  <div
                    className="ai-badge"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '8px 12px',
                      minWidth: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>Trust Score</span>
                      <span style={{
                        color: (100 - (expense.fraudScore || 0)) >= 80 ? '#4CAF50' :
                          (100 - (expense.fraudScore || 0)) >= 60 ? '#2196F3' :
                            (100 - (expense.fraudScore || 0)) >= 40 ? '#FF9800' :
                              '#F44336',
                        fontWeight: '700'
                      }}>
                        {100 - (expense.fraudScore || 0)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${100 - (expense.fraudScore || 0)}%`,
                        height: '100%',
                        backgroundColor:
                          (100 - (expense.fraudScore || 0)) >= 80 ? '#4CAF50' :
                            (100 - (expense.fraudScore || 0)) >= 60 ? '#2196F3' :
                              (100 - (expense.fraudScore || 0)) >= 40 ? '#FF9800' :
                                '#F44336',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="verification-details">
                <div className="detail-row">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value">₹{expense.amount.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Receipts</span>
                  <span className="detail-value">{expense.receiptsCount} files</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Trust Score</span>
                  <span className={`fraud-score ${(100 - (expense.fraudScore || 0)) < 70 ? 'high' : 'low'}`}>
                    {100 - (expense.fraudScore || 0)}/100
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted</span>
                  <span className="detail-value">{new Date(expense.submissionDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="btn-view-outline"
                  onClick={() => {
                    setSelectedExpense(expense);
                    setShowExpenseDetailModal(true);
                  }}
                >
                  <Eye size={16} />
                  View Details
                </button>
                <button className="btn-verify" onClick={() => handleApprove(expense.id)}>
                  <Check size={16} />
                  Verify & Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderReports = () => (
    <Reports />
  );

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return renderPendingRequests();
      case "verification":
        return renderExpenseVerification();
      case "campaigns":
        return renderCampaigns();
      case "reports":
        return renderReports();
      case "volunteers":
        return renderVolunteers();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`admin-dashboard-container ${darkMode ? "dark" : "light"}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo-text">Fundex</h1>
            <span className="logo-subtitle">ADMIN PORTAL</span>
          </div>

          <div className="header-actions">
            <NotificationDropdown darkMode={darkMode} />

            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>Dark Mode</span>
            </button>

            <div className="user-profile-container">
              <div className="user-profile">
                <div className="avatar">{getUserInitials()}</div>
                <div className="user-info">
                  <span className="user-name">{getDisplayName()}</span>
                  {user && user.ngoName && (
                    <span className="user-role">{user.ngoName}</span>
                  )}
                </div>
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

      {/* Navigation */}
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
          Pending Requests
        </button>
        <button
          className={`nav-tab ${activeTab === "verification" ? "active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          Expense Verification
        </button>
        <button
          className={`nav-tab ${activeTab === "campaigns" ? "active" : ""}`}
          onClick={() => setActiveTab("campaigns")}
        >
          Campaigns
        </button>
        <button
          className={`nav-tab ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
        <button
          className={`nav-tab ${activeTab === "volunteers" ? "active" : ""}`}
          onClick={() => setActiveTab("volunteers")}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          Volunteers
          {volunteersList.filter(v => v.status === 'pending').length > 0 && (
            <span style={{
              backgroundColor: '#ff5252',
              color: 'white',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {volunteersList.filter(v => v.status === 'pending').length}
            </span>
          )}
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {renderContent()}
      </main>

      {/* Send Funding Request Modal */}
      {showFundingModal && (
        <div className="modal-overlay" onClick={() => setShowFundingModal(false)}>
          <div className="create-campaign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Funding Request</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowFundingModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSendFundingRequest} className="campaign-form">
              {/* Donor Search */}
              <div className="form-group">
                <label>Find Donor *</label>
                {!selectedDonor ? (
                  <div className="search-wrapper">
                    <input
                      type="text"
                      value={donorSearchQuery}
                      onChange={(e) => {
                        setDonorSearchQuery(e.target.value);
                        handleSearchDonors(e.target.value);
                      }}
                      placeholder="Search donor by name or email..."
                      className="search-input"
                    />
                    {isSearchingDonor && <span className="search-loading">Searching...</span>}

                    {donorSearchResults.length > 0 && (
                      <div className="search-results-dropdown">
                        {donorSearchResults.map(donor => (
                          <div
                            key={donor._id}
                            className="search-result-item"
                            onClick={() => handleSelectDonor(donor)}
                          >
                            <span className="donor-name">{donor.name}</span>
                            <span className="donor-email">{donor.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="selected-donor-card">
                    <div className="donor-info">
                      <span className="donor-name">{selectedDonor.name}</span>
                      <span className="donor-email">{selectedDonor.email}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-donor"
                      onClick={() => setSelectedDonor(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Campaign Selection */}
              <div className="form-group">
                <label>Select Campaign *</label>
                <select
                  value={fundingRequestForm.campaignId}
                  onChange={(e) => setFundingRequestForm({ ...fundingRequestForm, campaignId: e.target.value })}
                  required
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.filter(c => c.status === 'active').map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Amount and Urgency */}
              <div className="form-row">
                <div className="form-group">
                  <label>Requested Amount (₹) *</label>
                  <input
                    type="number"
                    value={fundingRequestForm.amount}
                    onChange={(e) => setFundingRequestForm({ ...fundingRequestForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    min="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Urgency *</label>
                  <select
                    value={fundingRequestForm.urgency}
                    onChange={(e) => setFundingRequestForm({ ...fundingRequestForm, urgency: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="form-group">
                <label>Message to Donor</label>
                <textarea
                  value={fundingRequestForm.message}
                  onChange={(e) => setFundingRequestForm({ ...fundingRequestForm, message: e.target.value })}
                  placeholder="Personalized message for the donor..."
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel-form"
                  onClick={() => setShowFundingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-form"
                  disabled={!selectedDonor || !fundingRequestForm.campaignId}
                >
                  <Share2 size={18} />
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {showExpenseDetailModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowExpenseDetailModal(false)}>
          <div className="create-campaign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Expense Details</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowExpenseDetailModal(false);
                  setSelectedExpense(null);
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="campaign-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Basic Info */}
              <div className="form-group">
                <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>
                  {selectedExpense.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <strong>Volunteer:</strong> {selectedExpense.volunteer} • <strong>Campaign:</strong> {selectedExpense.campaign}
                </p>
              </div>

              {/* Amount and Status */}
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="text"
                    value={`₹${selectedExpense.amount.toLocaleString()}`}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div className="form-group">
                  <label>Trust Score</label>
                  <input
                    type="text"
                    value={`${100 - (selectedExpense.fraudScore || 0)}/100`}
                    readOnly
                    style={{
                      backgroundColor: (100 - (selectedExpense.fraudScore || 0)) < 70 ? '#ffebee' : '#e8f5e9',
                      color: (100 - (selectedExpense.fraudScore || 0)) < 70 ? '#c62828' : '#2e7d32',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
              </div>

              {/* AI Status and Receipts */}
              <div className="form-row">
                <div className="form-group">
                  <label>AI Verification</label>
                  <input
                    type="text"
                    value={selectedExpense.aiStatus}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div className="form-group">
                  <label>Receipts Submitted</label>
                  <input
                    type="text"
                    value={`${selectedExpense.receiptsCount || 2} files`}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
              </div>

              {/* Submission Date */}
              <div className="form-group">
                <label>Submission Date</label>
                <input
                  type="text"
                  value={new Date(selectedExpense.submissionDate).toLocaleString()}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>

              {/* Receipt Image */}
              <div className="form-group">
                <label>Receipt Image</label>
                <div style={{
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fafafa',
                  marginTop: '8px'
                }}>
                  {selectedExpense.receiptImage ? (
                    <img
                      src={selectedExpense.receiptImage || 'https://via.placeholder.com/400x300?text=Receipt+Image'}
                      alt="Receipt"
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(selectedExpense.receiptImage, '_blank')}
                    />
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No receipt image available</p>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Click image to view full size in new tab
                </p>
              </div>

              {/* Proof Image */}
              <div className="form-group">
                <label>Proof of Work Image</label>
                <div style={{
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fafafa',
                  marginTop: '8px'
                }}>
                  {selectedExpense.proofImage ? (
                    <img
                      src={selectedExpense.proofImage || 'https://via.placeholder.com/400x300?text=Proof+Image'}
                      alt="Proof"
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(selectedExpense.proofImage, '_blank')}
                    />
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No proof image available</p>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Click image to view full size in new tab
                </p>
              </div>

              {/* Fraud Flags (if any) */}
              {selectedExpense.fraudScore > 0 && (
                <div className="form-group">
                  <label style={{ color: '#c62828' }}>⚠️ Fraud Alerts</label>
                  <div style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #ef5350',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '8px'
                  }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#c62828' }}>
                      <li>Potential discrepancy detected</li>
                      <li>Manual review recommended</li>
                      {selectedExpense.fraudScore > 50 && <li>High risk - immediate attention required</li>}
                    </ul>
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn-cancel-form"
                  onClick={() => {
                    setShowExpenseDetailModal(false);
                    setSelectedExpense(null);
                  }}
                >
                  Close
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#ff5252',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      setShowFlagModal(true);
                    }}
                  >
                    <AlertCircle size={18} />
                    Flag Transaction
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => handleDownloadExpensePDF(selectedExpense)}
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    className="btn-submit-form"
                    onClick={() => handleApproveExpense(selectedExpense.id)}
                  >
                    <Check size={18} />
                    Verify & Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowFlagModal(false)}>
          <div className="create-campaign-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#ff5252' }}>🚩 Flag Transaction</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="campaign-form">
              <div className="form-group">
                <h3 style={{ marginBottom: '10px', color: '#333' }}>
                  {selectedExpense.title}
                </h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Amount: ₹{selectedExpense.amount.toLocaleString()} • Fraud Score: {selectedExpense.fraudScore}%
                </p>
              </div>

              <div className="form-group">
                <label style={{ color: '#ff5252', fontWeight: '600' }}>
                  Reason for Flagging *
                </label>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Enter detailed reason why this transaction is suspicious..."
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #ff5252',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}
                />
              </div>

              <div style={{
                backgroundColor: '#fff3e0',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #ff9800'
              }}>
                <p style={{ margin: 0, color: '#e65100', fontSize: '14px' }}>
                  ⚠️ This will mark the expense as flagged and notify relevant parties for review.
                </p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel-form"
                  onClick={() => {
                    setShowFlagModal(false);
                    setFlagReason('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ff5252',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={handleFlagExpense}
                >
                  <AlertCircle size={18} />
                  Flag This Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verified & Approved Transactions Modal */}
      {showVerifiedModal && (
        <div className="modal-overlay" onClick={() => setShowVerifiedModal(false)}>
          <div className="create-campaign-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '85vh' }}>
            <div className="modal-header" style={{ backgroundColor: '#4CAF50' }}>
              <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={28} />
                ✓ Verified & Approved Transactions
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowVerifiedModal(false)}
                style={{ color: 'white' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="campaign-form" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {verifiedExpenses.length === 0 ? (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <CheckCircle size={64} style={{ color: '#4CAF50', marginBottom: '20px' }} />
                  <h3>No Verified Transactions Yet</h3>
                  <p>Approved expenses will appear here</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {verifiedExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      style={{
                        border: '2px solid #4CAF50',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#f1f8f4',
                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowExpenseDetailModal(true);
                        setShowVerifiedModal(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '18px' }}>
                            {expense.title}
                          </h3>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            👤 {expense.volunteer} • 📋 {expense.campaign}
                          </p>
                        </div>
                        <div style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <CheckCircle size={16} />
                          VERIFIED
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '14px' }}>
                        <div>
                          <span style={{ color: '#666' }}>Amount:</span>
                          <span style={{ fontWeight: '600', marginLeft: '5px', color: '#2e7d32', fontSize: '16px' }}>
                            ₹{expense.amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Receipts:</span>
                          <span style={{ fontWeight: '600', marginLeft: '5px' }}>
                            {expense.receiptsCount} files
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Date:</span>
                          <span style={{ marginLeft: '5px' }}>
                            {new Date(expense.submissionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel-form"
                onClick={() => setShowVerifiedModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flagged Transactions Modal */}
      {showFlaggedListModal && (
        <div className="modal-overlay" onClick={() => setShowFlaggedListModal(false)}>
          <div className="create-campaign-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '85vh' }}>
            <div className="modal-header" style={{ backgroundColor: '#ff5252' }}>
              <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={28} />
                🚩 Flagged Transactions
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowFlaggedListModal(false)}
                style={{ color: 'white' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="campaign-form" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {flaggedExpenses.length === 0 ? (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <AlertCircle size={64} style={{ color: '#ff5252', marginBottom: '20px' }} />
                  <h3>No Flagged Transactions</h3>
                  <p>Suspicious expenses will appear here</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {flaggedExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      style={{
                        border: '2px solid #ff5252',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#fff5f5',
                        boxShadow: '0 2px 8px rgba(255, 82, 82, 0.1)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowExpenseDetailModal(true);
                        setShowFlaggedListModal(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', color: '#c62828', fontSize: '18px' }}>
                            {expense.title}
                          </h3>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            👤 {expense.volunteer} • 📋 {expense.campaign}
                          </p>
                        </div>
                        <div style={{
                          backgroundColor: '#ff5252',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertCircle size={16} />
                          FLAGGED
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '14px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ color: '#666' }}>Amount:</span>
                          <span style={{ fontWeight: '600', marginLeft: '5px', color: '#c62828', fontSize: '16px' }}>
                            ₹{expense.amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Fraud Score:</span>
                          <span style={{ fontWeight: '600', marginLeft: '5px', color: '#ff5252' }}>
                            {expense.fraudScore}%
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Date:</span>
                          <span style={{ marginLeft: '5px' }}>
                            {new Date(expense.submissionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {expense.flaggedReason && (
                        <div style={{
                          marginTop: '15px',
                          padding: '12px',
                          backgroundColor: '#fff3e0',
                          borderLeft: '4px solid #ff9800',
                          borderRadius: '4px'
                        }}>
                          <strong style={{ color: '#e65100', fontSize: '13px' }}>Flagged Reason:</strong>
                          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                            {expense.flaggedReason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel-form"
                onClick={() => setShowFlaggedListModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}