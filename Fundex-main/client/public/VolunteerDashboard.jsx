import React from 'react';
import { Link } from 'react-router-dom';

function VolunteerDashboard() {
  return (
    <div className="dashboard-container">
      <nav>
        <Link to="/">← Back to Home</Link>
      </nav>
      <h1>Volunteer Dashboard</h1>
      <div className="dashboard-content">
        <h2>Your Requests</h2>
        <p>Request money, upload receipts, track expenses...</p>
      </div>
    </div>
  );
}

export default VolunteerDashboard;
