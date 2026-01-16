import React from 'react';
import { Link } from 'react-router-dom';

function DonorDashboard() {
  return (
    <div className="dashboard-container">
      <nav>
        <Link to="/">← Back to Home</Link>
      </nav>
      <h1>Donor Dashboard</h1>
      {/* Add your donor dashboard content */}
      <div className="dashboard-content">
        <h2>Your Donations</h2>
        <p>View NGO funding requests, donation history, and transparency reports...</p>
      </div>
    </div>
  );
}

export default DonorDashboard;
