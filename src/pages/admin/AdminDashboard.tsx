import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LearnerManagement from "../LearnerManagement";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Dashboard</h1>
      
      <div className="admin-dashboard">
        <div className="admin-welcome">
          <h2>Welcome, {user?.learner.firstName} {user?.learner.lastName}!</h2>
          <p>This is the admin dashboard where you can manage the driving school system.</p>
        </div>

        <div className="admin-stats">
          <div className="stats-card">
            <h3>Students</h3>
            <div className="stats-number">24</div>
            <p>Total registered students</p>
          </div>
          
          <div className="stats-card">
            <h3>Instructors</h3>
            <div className="stats-number">8</div>
            <p>Active driving instructors</p>
          </div>
          
          <div className="stats-card">
            <h3>Classes</h3>
            <div className="stats-number">156</div>
            <p>Scheduled this month</p>
          </div>
          
          <div className="stats-card">
            <h3>Completion Rate</h3>
            <div className="stats-number">87%</div>
            <p>Student success rate</p>
          </div>
        </div>
        
        <div className="admin-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="btn-primary">Manage Users</button>
            <button className="btn-primary">View Reports</button>
            <button className="btn-primary">System Settings</button>
            <button className="btn-primary">View Logs</button>
          </div>
        </div>

        <div className="admin-learners">
          <h3>Manage Learners</h3>
          <LearnerManagement />
        </div>
      </div>
    </div>
  );
};

// @ts-ignore
export default AdminDashboard;