import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>
      
      {/* Role-specific indicator */}
      {isAdmin && (
        <div className="role-indicator admin">
          <span>Administrator Settings - System Configuration Access</span>
        </div>
      )}
      {!isAdmin && (
        <div className="role-indicator user">
          <span>User Settings - Personal Configuration</span>
        </div>
      )}
      
      <div className="settings-container">
        <div className="settings-sidebar">
          {/* Common settings tabs for all users */}
          <div 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </div>
          <div 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </div>
          <div 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </div>
          <div 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </div>
          <div 
            className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </div>
          
          {/* Admin-only settings tabs */}
          {isAdmin && (
            <>
              <div className="settings-divider">Admin Settings</div>
              <div 
                className={`settings-tab admin-tab ${activeTab === 'system' ? 'active' : ''}`}
                onClick={() => setActiveTab('system')}
              >
                System Configuration
              </div>
              <div 
                className={`settings-tab admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                User Management
              </div>
              <div 
                className={`settings-tab admin-tab ${activeTab === 'backup' ? 'active' : ''}`}
                onClick={() => setActiveTab('backup')}
              >
                Backup & Restore
              </div>
            </>
          )}
        </div>
        
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-panel">
              <h2>General Settings</h2>
              
              <div className="settings-group">
                <h3>Account Information</h3>
                <div className="settings-item">
                  <label>Name</label>
                  <input type="text" defaultValue="John Doe" />
                </div>
                <div className="settings-item">
                  <label>Email</label>
                  <input type="email" defaultValue="john.doe@example.com" />
                </div>
                <div className="settings-item">
                  <label>Phone</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Language & Region</h3>
                <div className="settings-item">
                  <label>Language</label>
                  <select defaultValue="en">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="settings-item">
                  <label>Time Zone</label>
                  <select defaultValue="utc-8">
                    <option value="utc-8">Pacific Time (UTC-8)</option>
                    <option value="utc-5">Eastern Time (UTC-5)</option>
                    <option value="utc+0">Greenwich Mean Time (UTC+0)</option>
                    <option value="utc+1">Central European Time (UTC+1)</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn-primary">Save Changes</button>
                <button className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <h2>Notification Settings</h2>
              <div className="settings-group">
                <h3>Email Notifications</h3>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="email-bookings" defaultChecked />
                  <label htmlFor="email-bookings">New Bookings</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="email-cancellations" defaultChecked />
                  <label htmlFor="email-cancellations">Cancellations</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="email-reminders" defaultChecked />
                  <label htmlFor="email-reminders">Lesson Reminders</label>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Push Notifications</h3>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="push-bookings" defaultChecked />
                  <label htmlFor="push-bookings">New Bookings</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="push-cancellations" defaultChecked />
                  <label htmlFor="push-cancellations">Cancellations</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="push-reminders" defaultChecked />
                  <label htmlFor="push-reminders">Lesson Reminders</label>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn-primary">Save Changes</button>
                <button className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="settings-panel">
              <h2>Appearance Settings</h2>
              <div className="settings-group">
                <h3>Theme</h3>
                <div className="theme-options">
                  <div className="theme-option active">
                    <div className="theme-preview light"></div>
                    <span>Light</span>
                  </div>
                  <div className="theme-option">
                    <div className="theme-preview dark"></div>
                    <span>Dark</span>
                  </div>
                  <div className="theme-option">
                    <div className="theme-preview system"></div>
                    <span>System</span>
                  </div>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn-primary">Save Changes</button>
                <button className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="settings-panel">
              <h2>Security Settings</h2>
              <div className="settings-group">
                <h3>Change Password</h3>
                <div className="settings-item">
                  <label>Current Password</label>
                  <input type="password" />
                </div>
                <div className="settings-item">
                  <label>New Password</label>
                  <input type="password" />
                </div>
                <div className="settings-item">
                  <label>Confirm New Password</label>
                  <input type="password" />
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Two-Factor Authentication</h3>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="enable-2fa" />
                  <label htmlFor="enable-2fa">Enable Two-Factor Authentication</label>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn-primary">Save Changes</button>
                <button className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          
          {activeTab === 'advanced' && (
            <div className="settings-panel">
              <h2>Advanced Settings</h2>
              <div className="settings-group">
                <h3>Data Management</h3>
                <div className="settings-item">
                  <button className="btn-secondary">Export All Data</button>
                </div>
                <div className="settings-item">
                  <button className="btn-danger">Delete Account</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Admin-only settings content */}
          {isAdmin && activeTab === 'system' && (
            <div className="settings-panel">
              <h2>System Configuration</h2>
              <div className="settings-group">
                <h3>System Settings</h3>
                <div className="settings-item">
                  <label>System Name</label>
                  <input type="text" defaultValue="AutoSchool Management System" />
                </div>
                <div className="settings-item">
                  <label>API Endpoint</label>
                  <input type="text" defaultValue="http://localhost:8080/api" />
                </div>
                <div className="settings-item">
                  <label>Session Timeout (minutes)</label>
                  <input type="number" defaultValue="30" />
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Email Configuration</h3>
                <div className="settings-item">
                  <label>SMTP Server</label>
                  <input type="text" defaultValue="smtp.example.com" />
                </div>
                <div className="settings-item">
                  <label>SMTP Port</label>
                  <input type="number" defaultValue="587" />
                </div>
                <div className="settings-item">
                  <label>Email Username</label>
                  <input type="text" defaultValue="notifications@autoschool.com" />
                </div>
                <div className="settings-item">
                  <label>Email Password</label>
                  <input type="password" defaultValue="********" />
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn-primary">Save System Settings</button>
                <button className="btn-secondary">Reset to Defaults</button>
              </div>
            </div>
          )}
          
          {isAdmin && activeTab === 'users' && (
            <div className="settings-panel">
              <h2>User Management Settings</h2>
              <div className="settings-group">
                <h3>Registration Settings</h3>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="allow-registration" defaultChecked />
                  <label htmlFor="allow-registration">Allow New User Registration</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="email-verification" defaultChecked />
                  <label htmlFor="email-verification">Require Email Verification</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="admin-approval" />
                  <label htmlFor="admin-approval">Require Admin Approval for New Accounts</label>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Password Policy</h3>
                <div className="settings-item">
                  <label>Minimum Password Length</label>
                  <input type="number" defaultValue="8" />
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="require-uppercase" defaultChecked />
                  <label htmlFor="require-uppercase">Require Uppercase Letters</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="require-numbers" defaultChecked />
                  <label htmlFor="require-numbers">Require Numbers</label>
                </div>
                <div className="settings-item checkbox">
                  <input type="checkbox" id="require-special" />
                  <label htmlFor="require-special">Require Special Characters</label>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="btn-primary">Save User Settings</button>
                <button className="btn-secondary">Reset to Defaults</button>
              </div>
            </div>
          )}
          
          {isAdmin && activeTab === 'backup' && (
            <div className="settings-panel">
              <h2>Backup & Restore</h2>
              <div className="settings-group">
                <h3>Backup Settings</h3>
                <div className="settings-item">
                  <label>Automatic Backup</label>
                  <select defaultValue="daily">
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className="settings-item">
                  <label>Backup Location</label>
                  <input type="text" defaultValue="/var/backups/autoschool" />
                </div>
                <div className="settings-item">
                  <label>Number of Backups to Keep</label>
                  <input type="number" defaultValue="7" />
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Manual Backup</h3>
                <div className="settings-item">
                  <button className="btn-primary">Create Backup Now</button>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Restore from Backup</h3>
                <div className="settings-item">
                  <label>Select Backup File</label>
                  <input type="file" />
                </div>
                <div className="settings-item">
                  <button className="btn-danger">Restore System</button>
                  <p className="settings-help">Warning: This will overwrite all current data!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;