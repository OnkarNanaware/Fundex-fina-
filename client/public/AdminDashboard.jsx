import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <nav>
        <Link to="/">← Back to Home</Link>
      </nav>
      <h1>Admin Dashboard</h1>
      <div className="dashboard-content">
        <h2>Pending Requests</h2>
        <p>Approve volunteer requests, verify expenses, manage funding...</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
