import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { isAdmin } = useAuth();
  
  return (
    <div className="page-container">
      <h1 className="page-title">Profile</h1>
      
      {/* Role-specific indicator */}
      {isAdmin && (
        <div className="role-indicator admin">
          <span>Administrator Profile</span>
        </div>
      )}
      {!isAdmin && (
        <div className="role-indicator user">
          <span>User Profile</span>
        </div>
      )}
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-placeholder">JD</div>
            </div>
            <div className="profile-info">
              <h2>John Doe</h2>
              <p>Driving Instructor</p>
              <p>ID: #12345</p>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-group">
              <h3>Personal Information</h3>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">john.doe@example.com</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">+1 (555) 123-4567</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">123 Main St, Anytown, USA</span>
              </div>
            </div>
            <div className="detail-group">
              <h3>Instructor Details</h3>
              <div className="detail-item">
                <span className="detail-label">License:</span>
                <span className="detail-value">DI-987654321</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Experience:</span>
                <span className="detail-value">5 years</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Specialization:</span>
                <span className="detail-value">Defensive Driving, Highway Driving</span>
              </div>
            </div>
            
            {/* Admin-specific section */}
            {isAdmin && (
              <div className="detail-group admin-details">
                <h3>Administrative Information</h3>
                <div className="detail-item">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">Administrator</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Access Level:</span>
                  <span className="detail-value">Full System Access</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Login:</span>
                  <span className="detail-value">August 15, 2025 - 16:30</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">System Permissions:</span>
                  <span className="detail-value">User Management, Student Records, System Settings</span>
                </div>
              </div>
            )}
          </div>
          <div className="profile-actions">
            <button className="btn-primary">Edit Profile</button>
            <button className="btn-secondary">Change Password</button>
            {isAdmin && (
              <button className="btn-secondary">System Preferences</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;