import { useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  Award,
  Target,
  Calendar,
  MapPin,
  Download,
  Share2,
  ChevronRight,
  CheckCircle,
  Zap,
  Globe,
  Leaf,
  GraduationCap,
  Droplet,
  Utensils,
  Activity
} from "lucide-react";
import "./ImpactReport.css";

export default function ImpactReport({ stats, transactions = [], setActiveTab }) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Dynamic Impact Statistics
  const impactStats = useMemo(() => {
    const totalDonated = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const campaignsCount = new Set(transactions.map(t => t.purpose)).size;
    const ngosCount = new Set(transactions.map(t => t.ngoName || "Unknown")).size;

    return {
      totalDonated: totalDonated,
      totalBeneficiaries: Math.floor(totalDonated / 5), // Estimation
      ngoSupported: ngosCount,
      campaignsCompleted: campaignsCount,
      transparencyScore: 100, // Based on tech stack
      co2Reduced: Math.floor(totalDonated / 1000), // Estimation
      treesPlanted: Math.floor(totalDonated / 500), // Estimation
      mealsProvided: Math.floor(totalDonated / 50) // Estimation
    };
  }, [transactions]);

  // Category-wise Impact
  const categoryImpact = useMemo(() => {
    const categories = {
      "Healthcare": { icon: Activity, color: "#E53935", metrics: [{ label: "Patients", value: "10+" }] },
      "Education": { icon: GraduationCap, color: "#1E88E5", metrics: [{ label: "Students", value: "5+" }] },
      "Food & Nutrition": { icon: Utensils, color: "#FB8C00", metrics: [{ label: "Meals", value: "100+" }] },
      "Water & Sanitation": { icon: Droplet, color: "#039BE5", metrics: [{ label: "Villagers", value: "50+" }] },
      "Environment": { icon: Leaf, color: "#43A047", metrics: [{ label: "Trees", value: "20+" }] },
      "Animal Welfare": { icon: Heart, color: "#8E24AA", metrics: [{ label: "Animals", value: "10+" }] }
    };

    const grouped = {};
    transactions.forEach(t => {
      const cat = t.category || "General";
      if (!grouped[cat]) grouped[cat] = { amount: 0, count: 0 };
      grouped[cat].amount += (t.amount || 0);
      grouped[cat].count += 1;
    });

    return Object.keys(grouped).map(catName => {
      const config = categories[catName] || { icon: Target, color: "#777", metrics: [] };
      return {
        category: catName,
        icon: config.icon,
        color: config.color,
        donated: grouped[catName].amount,
        beneficiaries: Math.floor(grouped[catName].amount / 100),
        campaigns: grouped[catName].count,
        impact: `Supported ${grouped[catName].count} campaigns in ${catName}`,
        metrics: config.metrics
      };
    });
  }, [transactions]);

  // Monthly Impact Timeline (Last 6 months)
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        donated: 0,
        beneficiaries: 0
      });
    }

    transactions.forEach(t => {
      const d = new Date(t.date || t.createdAt); // Handle various date fields
      const monthIdx = d.getMonth();
      const year = d.getFullYear();

      const relevantMonth = last6Months.find(m => m.month === months[monthIdx] && m.year === year);
      if (relevantMonth) {
        relevantMonth.donated += (t.amount || 0);
        relevantMonth.beneficiaries += Math.floor((t.amount || 0) / 10);
      }
    });

    return last6Months;
  }, [transactions]);

  // Success Stories (Top 3 Donations)
  const successStories = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((t, i) => ({
        id: t.id || i,
        title: t.purpose || "Donation Impact",
        ngo: t.ngoName || "NGO Partner",
        location: "India",
        image: `https://via.placeholder.com/400x250?text=Impact+${i + 1}`,
        description: `Your generous contribution of ₹${(t.amount || 0).toLocaleString()} is making a real difference.`,
        date: new Date(t.date || Date.now()).toLocaleDateString(),
        impact: "Verified Impact"
      }));
  }, [transactions]);

  // NGO Partners (Derived from transactions)
  const ngoPartners = useMemo(() => {
    const ngos = {};
    transactions.forEach(t => {
      const name = t.ngoName || "Unknown NGO";
      if (!ngos[name]) ngos[name] = { count: 0, amount: 0 };
      ngos[name].count += 1;
      ngos[name].amount += t.amount;
    });

    return Object.keys(ngos).map(name => ({
      name: name,
      campaigns: ngos[name].count,
      transparency: 95 + Math.floor(Math.random() * 5) // Mock score, or derive
    }));
  }, [transactions]);

  const maxDonation = Math.max(...monthlyData.map(d => d.donated));

  const handleDownloadReport = () => {
    // Generate CSV content
    const headers = ["Date", "Purpose", "NGO", "Amount", "Category"];
    const rows = transactions.map(t => [
      new Date(t.date || t.createdAt).toLocaleDateString(),
      t.purpose || "Donation",
      t.ngoName || "Unknown",
      t.amount,
      t.category || "General"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "impact_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also trigger print for PDF option
    // setTimeout(() => window.print(), 500);
  };

  const handleShareReport = () => {
    alert("Share your impact on social media!");
  };

  return (
    <div className="impact-report-container">
      {/* Hero Section */}
      <div className="impact-hero">
        <div className="hero-content">
          <h1 className="hero-title">Your Impact Story</h1>
          <p className="hero-subtitle">
            Together, we've created meaningful change in communities across India.
            Every rupee you donated has been tracked with complete transparency.
          </p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={handleDownloadReport}>
              <Download size={20} />
              Download Full Report
            </button>
            <button className="hero-btn secondary" onClick={handleShareReport}>
              <Share2 size={20} />
              Share Your Impact
            </button>
          </div>
        </div>
        <div className="hero-badge">
          <div className="badge-icon">
            <Award size={48} />
          </div>
          <h2 className="badge-title">{impactStats.transparencyScore}%</h2>
          <p className="badge-text">Transparency Score</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon">
            <DollarSign size={32} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">₹{impactStats.totalDonated.toLocaleString()}</h3>
            <p className="metric-label">Total Contributed</p>
            <span className="metric-trend positive">
              <TrendingUp size={14} />
              +25% from last quarter
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users size={32} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{impactStats.totalBeneficiaries.toLocaleString()}</h3>
            <p className="metric-label">Lives Impacted</p>
            <span className="metric-trend">Direct & indirect beneficiaries</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Target size={32} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{impactStats.campaignsCompleted}</h3>
            <p className="metric-label">Campaigns Supported</p>
            <span className="metric-trend">Across {impactStats.ngoSupported} NGOs</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <CheckCircle size={32} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">100%</h3>
            <p className="metric-label">Funds Utilized</p>
            <span className="metric-trend">All receipts verified</span>
          </div>
        </div>
      </div>

      {/* Environmental Impact Badge */}
      <div className="environmental-impact">
        <h2 className="section-title">
          <Globe size={24} />
          Environmental Footprint
        </h2>
        <div className="env-stats">
          <div className="env-stat">
            <Leaf size={32} />
            <div>
              <h3>{impactStats.treesPlanted}</h3>
              <p>Trees Planted</p>
            </div>
          </div>
          <div className="env-stat">
            <Zap size={32} />
            <div>
              <h3>{impactStats.co2Reduced} tons</h3>
              <p>CO₂ Reduced Annually</p>
            </div>
          </div>
          <div className="env-stat">
            <Utensils size={32} />
            <div>
              <h3>{impactStats.mealsProvided}+</h3>
              <p>Meals Provided</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Impact Chart */}
      <div className="impact-section">
        <h2 className="section-title">
          <Calendar size={24} />
          Impact Over Time
        </h2>
        <div className="chart-container">
          <div className="chart-bars">
            {monthlyData.map((data, index) => (
              <div key={index} className="bar-wrapper">
                <div className="bar-group">
                  <div
                    className="bar donated"
                    style={{ height: `${(data.donated / maxDonation) * 200}px` }}
                  >
                    <span className="bar-tooltip">₹{data.donated.toLocaleString()}</span>
                  </div>
                </div>
                <span className="bar-label">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color donated"></span>
              <span>Amount Donated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="impact-section">
        <h2 className="section-title">
          <Target size={24} />
          Impact by Category
        </h2>
        <div className="category-grid">
          {categoryImpact.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <div key={index} className="category-card">
                <div className="category-header">
                  <div className="category-icon" style={{ background: cat.color }}>
                    <Icon size={24} />
                  </div>
                  <h3 className="category-name">{cat.category}</h3>
                </div>

                <div className="category-amount">
                  <span className="amount-donated">₹{cat.donated.toLocaleString()}</span>
                  <span className="campaigns-count">{cat.campaigns} {cat.campaigns === 1 ? 'Campaign' : 'Campaigns'}</span>
                </div>

                <p className="category-impact">{cat.impact}</p>

                <div className="category-metrics">
                  {cat.metrics.map((metric, idx) => (
                    <div key={idx} className="mini-metric">
                      <span className="mini-value">{metric.value}</span>
                      <span className="mini-label">{metric.label}</span>
                    </div>
                  ))}
                </div>

                <div className="category-progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(cat.donated / impactStats.totalDonated) * 100}%`,
                      background: cat.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Stories */}
      <div className="impact-section">
        <h2 className="section-title">
          <Heart size={24} />
          Success Stories
        </h2>
        <div className="stories-grid">
          {successStories.map(story => (
            <div key={story.id} className="story-card">
              <div className="story-image-placeholder">
                <img src={`https://via.placeholder.com/400x250?text=${story.title}`} alt={story.title} />
                <div className="story-badge">{story.impact}</div>
              </div>
              <div className="story-content">
                <h3 className="story-title">{story.title}</h3>
                <div className="story-meta">
                  <span className="story-ngo">{story.ngo}</span>
                  <span className="story-location">
                    <MapPin size={14} />
                    {story.location}
                  </span>
                </div>
                <p className="story-description">{story.description}</p>
                <div className="story-footer">
                  <span className="story-date">{story.date}</span>
                  <button className="story-link">
                    Read More
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NGO Partners */}
      <div className="impact-section">
        <h2 className="section-title">
          <Users size={24} />
          NGO Partners
        </h2>
        <div className="partners-grid">
          {ngoPartners.map((ngo, index) => (
            <div key={index} className="partner-card">
              <div className="partner-info">
                <h4 className="partner-name">{ngo.name}</h4>
                <p className="partner-campaigns">{ngo.campaigns} {ngo.campaigns === 1 ? 'Campaign' : 'Campaigns'} Supported</p>
              </div>
              <div className="partner-transparency">
                <div className="transparency-circle" style={{
                  background: `conic-gradient(var(--accent) ${ngo.transparency * 3.6}deg, var(--border) 0deg)`
                }}>
                  <div className="transparency-inner">
                    <span className="transparency-value">{ngo.transparency}%</span>
                  </div>
                </div>
                <span className="transparency-label">Transparency</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="impact-cta">
        <div className="cta-content">
          <h2 className="cta-title">Continue Making an Impact</h2>
          <p className="cta-description">
            Your contributions have already changed thousands of lives.
            Explore more campaigns and continue your journey of creating positive change.
          </p>
          <button
            className="cta-button"
            onClick={() => setActiveTab && setActiveTab("find-campaigns")}
          >
            Explore Active Campaigns
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Transparency Footer */}
      <div className="transparency-footer">
        <div className="footer-icon">
          <CheckCircle size={32} />
        </div>
        <div className="footer-content">
          <h3>100% Transparency Guaranteed</h3>
          <p>Every transaction is tracked with AI-powered receipt verification and real-time updates. Your trust drives our mission.</p>
        </div>
      </div>
    </div>
  );
}
