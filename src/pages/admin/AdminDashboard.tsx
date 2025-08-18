import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Dashboard</h1>
      
      <div className="admin-dashboard">
        <div className="admin-welcome">
          <h2>Welcome, {user?.username}!</h2>
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
        
        <div className="admin-recent">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-time">Today, 10:23 AM</div>
              <div className="activity-description">New student registration: Emma Johnson</div>
            </div>
            <div className="activity-item">
              <div className="activity-time">Yesterday, 3:45 PM</div>
              <div className="activity-description">Class schedule updated by Instructor Michael</div>
            </div>
            <div className="activity-item">
              <div className="activity-time">Yesterday, 1:30 PM</div>
              <div className="activity-description">Student William completed driving course</div>
            </div>
            <div className="activity-item">
              <div className="activity-time">Aug 14, 9:15 AM</div>
              <div className="activity-description">System maintenance performed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;