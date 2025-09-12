import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { 
  fetchUserSettings, 
  fetchAdminSettings, 
  updateUserSettings, 
  updateAdminSettings,
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  type NotificationSettings,
  type UserSettings,
  type AdminSettings
} from '../services/settingsService';

// Banner component for notifications
function Banner({
  text,
  kind = "info",
  onClose,
}: {
  text: string;
  kind?: "info" | "warning" | "error" | "success";
  onClose?: () => void;
}) {
  if (!text) return null;
  const cls =
    kind === "warning"
      ? "banner warning"
      : kind === "error"
        ? "banner error"
        : kind === "success"
          ? "banner success"
          : "banner info";
  return (
    <div className={cls} role="status" aria-live="polite" style={{ marginBottom: 12 }}>
      <span>{text}</span>
      <button aria-label="Close" onClick={onClose} style={{ marginLeft: "auto" }}>
        ×
      </button>
    </div>
  );
}

const Settings: React.FC = () => {
  const { isAdmin, token } = useAuth();
  const [activeTab, setActiveTab] = useState<
      'notifications'|'appearance'|'advanced'|'help'|'system'|'users'|'backup'
  >('help');

  const { theme, resolved, setTheme, loading: themeLoading } = useTheme();
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme);
  
  // State for settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for notification settings
  const [emailBookings, setEmailBookings] = useState(true);
  const [emailCancels, setEmailCancels] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  
  // State for backup management
  const [backups, setBackups] = useState<Array<{ id: string; date: string; size: number }>>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Authentication token not available');
      setLoading(false);
      return;
    }

    if (themeLoading) {
      return;
    }
    
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load user settings
        const settings = await fetchUserSettings(token);
        setUserSettings(settings);
        
        // Update local state
        setEmailBookings(settings.notifications.emailBookings);
        setEmailCancels(settings.notifications.emailCancels);
        setEmailReminders(settings.notifications.emailReminders);
        
        // Use theme from ThemeContext instead of from settings
        // This ensures we're using the most up-to-date theme
        setPendingTheme(theme);
        
        // If admin, load admin settings
        if (isAdmin) {
          const adminData = await fetchAdminSettings(token);
          setAdminSettings(adminData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [token, isAdmin, themeLoading, theme]);

  useEffect(() => { 
    if (userSettings) {
      setPendingTheme(theme); 
    }
  }, [theme, userSettings]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const saveNotifications = async () => {
    if (!token) {
      setError('Authentication token not available');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const notificationSettings: NotificationSettings = {
        emailBookings,
        emailCancels,
        emailReminders
      };
      
      await updateUserSettings(token, { 
        notifications: notificationSettings 
      });
      
      setSuccess('Notification settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Save appearance settings
  const saveAppearance = async () => {
    if (!token) {
      setError('Authentication token not available');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);

      setTheme(pendingTheme);
      
      setSuccess('Appearance settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save appearance settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Reset appearance settings
  const resetAppearance = () => {
    if (userSettings) {
      setPendingTheme(userSettings.appearance.theme);
    }
  };
  
  // Load backups list
  const loadBackups = async () => {
    if (!token) {
      setBackupError('Authentication token not available');
      return;
    }
    
    try {
      setBackupsLoading(true);
      setBackupError(null);
      
      const backupsList = await listBackups(token);
      setBackups(backupsList);
    } catch (err: any) {
      setBackupError(err.message || 'Failed to load backups');
    } finally {
      setBackupsLoading(false);
    }
  };
  
  // Create a new backup
  const handleCreateBackup = async () => {
    if (!token) {
      setBackupError('Authentication token not available');
      return;
    }
    
    try {
      setBackupsLoading(true);
      setBackupError(null);
      
      await createBackup(token);
      setSuccess('Backup created successfully');
      
      // Reload backups list
      await loadBackups();
    } catch (err: any) {
      setBackupError(err.message || 'Failed to create backup');
    } finally {
      setBackupsLoading(false);
    }
  };
  
  // Restore from backup
  const handleRestoreBackup = async (backupId: string) => {
    if (!token) {
      setBackupError('Authentication token not available');
      return;
    }
    
    if (!window.confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return;
    }
    
    try {
      setBackupsLoading(true);
      setBackupError(null);
      
      const result = await restoreBackup(token, backupId);
      setSuccess(result.message || 'Backup restored successfully');
    } catch (err: any) {
      setBackupError(err.message || 'Failed to restore backup');
    } finally {
      setBackupsLoading(false);
    }
  };
  
  // Delete backup
  const handleDeleteBackup = async (backupId: string) => {
    if (!token) {
      setBackupError('Authentication token not available');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this backup?')) {
      return;
    }
    
    try {
      setBackupsLoading(true);
      setBackupError(null);
      
      await deleteBackup(token, backupId);
      setSuccess('Backup deleted successfully');
      
      // Reload backups list
      await loadBackups();
    } catch (err: any) {
      setBackupError(err.message || 'Failed to delete backup');
    } finally {
      setBackupsLoading(false);
    }
  };
  
  // Update system settings
  const saveSystemSettings = async () => {
    if (!token || !adminSettings) {
      setError('Authentication token not available or admin settings not loaded');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      await updateAdminSettings(token, { 
        system: adminSettings.system 
      });
      
      setSuccess('System settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'backup' && isAdmin && token) {
      loadBackups();
    }
  }, [activeTab, isAdmin, token]);

  const saveBackupSettings = async () => {
    if (!token || !adminSettings) {
      setBackupError('Authentication token not available or admin settings not loaded');
      return;
    }
    try {
      setSaving(true);
      setBackupError(null);
      await updateAdminSettings(token, { backup: adminSettings.backup });
      setSuccess('Backup settings saved successfully');
    } catch (err: any) {
      setBackupError(err.message || 'Failed to save backup settings');
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="page-container">
        <h1 className="page-title">Settings</h1>

        {isAdmin ? (
            <div className="role-indicator admin"><span>Administrator Settings - System Configuration Access</span></div>
        ) : (
            <div className="role-indicator user"><span>User Settings - Personal Configuration</span></div>
        )}
        
        {/* Display error and success messages */}
        {error && <Banner text={error} kind="error" onClose={() => setError(null)} />}
        {success && <Banner text={success} kind="success" onClose={() => setSuccess(null)} />}
        
        {loading ? (
          <div className="loading-container">
            <p>Loading settings...</p>
          </div>
        ) : (
          <div className="settings-container">
            <div className="settings-sidebar">
              <div className={`settings-tab ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>Help</div>
              <div className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</div>
              <div className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>Appearance</div>
              <div className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced</div>
  
              {isAdmin && (
                  <>
                    <div className="settings-divider">Admin Settings</div>
                    <div className={`settings-tab admin-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System Configuration</div>
                    <div className={`settings-tab admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</div>
                    <div className={`settings-tab admin-tab ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>Backup & Restore</div>
                  </>
              )}
            </div>
  
            <div className="settings-content">
  
              {activeTab === 'notifications' && (
                  <div className="settings-panel">
                    <h2>Notification Settings</h2>
                    <div className="settings-group">
                      <h3>Email Notifications</h3>
                      <label className="settings-item checkbox">
                        <input 
                          type="checkbox" 
                          checked={emailBookings} 
                          onChange={e=>setEmailBookings(e.target.checked)}
                          disabled={saving} 
                        />
                        <span>New Bookings</span>
                      </label>
                      <label className="settings-item checkbox">
                        <input 
                          type="checkbox" 
                          checked={emailCancels} 
                          onChange={e=>setEmailCancels(e.target.checked)}
                          disabled={saving} 
                        />
                        <span>Cancellations</span>
                      </label>
                      <label className="settings-item checkbox">
                        <input 
                          type="checkbox" 
                          checked={emailReminders} 
                          onChange={e=>setEmailReminders(e.target.checked)}
                          disabled={saving} 
                        />
                        <span>Lesson Reminders</span>
                      </label>
                    </div>
                    <div className="settings-actions">
                      <button className="btn-primary" onClick={saveNotifications} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn-secondary" onClick={() => {
                        if (userSettings) {
                          setEmailBookings(userSettings.notifications.emailBookings);
                          setEmailCancels(userSettings.notifications.emailCancels);
                          setEmailReminders(userSettings.notifications.emailReminders);
                        }
                      }} disabled={saving}>
                        Reset
                      </button>
                    </div>
                  </div>
              )}
  
              {activeTab === 'appearance' && (
                  <div className="settings-panel">
                    <h2>Appearance</h2>
                    <div className="settings-group">
                      <h3>Theme</h3>
                      <div className="theme-options" role="radiogroup" aria-label="Theme">
                        <label className={`theme-option ${pendingTheme==='light' ? 'active':''}`}>
                          <input
                              type="radio"
                              name="theme"
                              value="light"
                              checked={pendingTheme === 'light'}
                              onChange={()=>setPendingTheme('light')}
                              disabled={saving}
                          />
                          <div className="theme-preview light"></div>
                          <span>Light</span>
                        </label>
                        <label className={`theme-option ${pendingTheme==='dark' ? 'active':''}`}>
                          <input
                              type="radio"
                              name="theme"
                              value="dark"
                              checked={pendingTheme === 'dark'}
                              onChange={()=>setPendingTheme('dark')}
                              disabled={saving}
                          />
                          <div className="theme-preview dark"></div>
                          <span>Dark</span>
                        </label>
                        <label className={`theme-option ${pendingTheme==='system' ? 'active':''}`}>
                          <input
                              type="radio"
                              name="theme"
                              value="system"
                              checked={pendingTheme === 'system'}
                              onChange={()=>setPendingTheme('system')}
                              disabled={saving}
                          />
                          <div className="theme-preview system"></div>
                          <span>System</span>
                        </label>
                      </div>
                      <p className="settings-help">Current applied: <strong>{resolved}</strong></p>
                    </div>
                    <div className="settings-actions">
                      <button className="btn-primary" onClick={saveAppearance} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn-secondary" onClick={resetAppearance} disabled={saving}>
                        Reset
                      </button>
                    </div>
                  </div>
              )}
  
              {activeTab === 'advanced' && (
                  <div className="settings-panel">
                    <h2>Advanced</h2>
                    <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify({
                      userSettings,
                      adminSettings: isAdmin ? adminSettings : 'Not available'
                    }))}>
                      Copy all settings info
                    </button>
                  </div>
              )}
  
              {activeTab === 'help' && (
                  <div className="settings-panel">
                    <h2>Help</h2>
                    <p>
                      Please in any case of issues call{" "}
                      <a href="tel:+420605232579" style={{ fontWeight: 600, color: "var(--primary)" }}>
                        605&nbsp;232&nbsp;579
                      </a>{" "}
                      or send an email to{" "}
                      <a href="mailto:autoaba@seznam.cz" style={{ fontWeight: 600, color: "var(--primary)" }}>
                        autoaba@seznam.cz
                      </a>.
                    </p>
                  </div>
              )}
  
              {isAdmin && activeTab === 'system' && adminSettings && (
                  <div className="settings-panel">
                    <h2>System Configuration</h2>
                    <div className="settings-group">
                      <h3>Booking Settings</h3>
                      
                      <div className="settings-item">
                        <label>Default Instructor ID:</label>
                        <input 
                          type="text" 
                          value={adminSettings.system.defaultInstructorId || ''} 
                          onChange={(e) => setAdminSettings({
                            ...adminSettings,
                            system: {
                              ...adminSettings.system,
                              defaultInstructorId: e.target.value
                            }
                          })}
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="settings-item">
                        <label>Maximum Lessons Per Learner:</label>
                        <input 
                          type="number" 
                          value={adminSettings.system.maxLessonsPerLearner || 28} 
                          onChange={(e) => setAdminSettings({
                            ...adminSettings,
                            system: {
                              ...adminSettings.system,
                              maxLessonsPerLearner: parseInt(e.target.value) || 28
                            }
                          })}
                          min="1"
                          max="100"
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="settings-item checkbox">
                        <input 
                          type="checkbox" 
                          checked={adminSettings.system.allowWeekendBookings || false} 
                          onChange={(e) => setAdminSettings({
                            ...adminSettings,
                            system: {
                              ...adminSettings.system,
                              allowWeekendBookings: e.target.checked
                            }
                          })}
                          disabled={saving}
                        />
                        <span>Allow Weekend Bookings</span>
                      </div>
                      
                      <div className="settings-item">
                        <label>Booking Lead Time (hours):</label>
                        <input 
                          type="number" 
                          value={adminSettings.system.bookingLeadTimeHours || 24} 
                          onChange={(e) => setAdminSettings({
                            ...adminSettings,
                            system: {
                              ...adminSettings.system,
                              bookingLeadTimeHours: parseInt(e.target.value) || 24
                            }
                          })}
                          min="0"
                          max="168"
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="settings-item">
                        <label>Cancellation Lead Time (hours):</label>
                        <input 
                          type="number" 
                          value={adminSettings.system.cancellationLeadTimeHours || 12} 
                          onChange={(e) => setAdminSettings({
                            ...adminSettings,
                            system: {
                              ...adminSettings.system,
                              cancellationLeadTimeHours: parseInt(e.target.value) || 12
                            }
                          })}
                          min="0"
                          max="168"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    <div className="settings-actions">
                      <button className="btn-primary" onClick={saveSystemSettings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn-secondary" onClick={() => {
                        if (adminSettings) {
                          // Reset to original values
                          setAdminSettings({
                            ...adminSettings,
                            system: adminSettings.system
                          });
                        }
                      }} disabled={saving}>
                        Reset
                      </button>
                    </div>
                  </div>
              )}
              
              {isAdmin && activeTab === 'users' && (
                  <div className="settings-panel">
                    <h2>User Management Settings</h2>
                    <p>Use the dedicated <a href="/admin/users" style={{ color: "var(--primary)" }}>User Management</a> page for user administration.</p>
                  </div>
              )}
              
              {isAdmin && activeTab === 'backup' && (
                  <div className="settings-panel">
                    <h2>Backup & Restore</h2>
                    
                    {backupError && <Banner text={backupError} kind="error" onClose={() => setBackupError(null)} />}
                    
                    <div className="settings-group">
                      <h3>Automatic Backups</h3>
                      
                      {adminSettings && (
                        <>
                          <div className="settings-item checkbox">
                            <input 
                              type="checkbox" 
                              checked={adminSettings.backup.autoBackupEnabled} 
                              onChange={(e) => setAdminSettings({
                                ...adminSettings,
                                backup: {
                                  ...adminSettings.backup,
                                  autoBackupEnabled: e.target.checked
                                }
                              })}
                              disabled={saving}
                            />
                            <span>Enable Automatic Backups</span>
                          </div>
                          
                          <div className="settings-item">
                            <label>Backup Frequency (days):</label>
                            <input 
                              type="number" 
                              value={adminSettings.backup.backupFrequencyDays} 
                              onChange={(e) => setAdminSettings({
                                ...adminSettings,
                                backup: {
                                  ...adminSettings.backup,
                                  backupFrequencyDays: parseInt(e.target.value) || 7
                                }
                              })}
                              min="1"
                              max="30"
                              disabled={saving || !adminSettings.backup.autoBackupEnabled}
                            />
                          </div>
                          
                          <div className="settings-item">
                            <label>Backup Retention Count:</label>
                            <input 
                              type="number" 
                              value={adminSettings.backup.backupRetentionCount} 
                              onChange={(e) => setAdminSettings({
                                ...adminSettings,
                                backup: {
                                  ...adminSettings.backup,
                                  backupRetentionCount: parseInt(e.target.value) || 5
                                }
                              })}
                              min="1"
                              max="50"
                              disabled={saving || !adminSettings.backup.autoBackupEnabled}
                            />
                          </div>
                          
                          {adminSettings.backup.lastBackupDate && (
                            <div className="settings-item">
                              <label>Last Automatic Backup:</label>
                              <span>{new Date(adminSettings.backup.lastBackupDate).toLocaleString()}</span>
                            </div>
                          )}

                          <div className="settings-actions">
                            <button
                                className="btn-primary"
                                onClick={saveBackupSettings}
                                disabled={saving || !token}
                            >
                              {saving ? 'Saving...' : 'Save Backup Settings'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="settings-group">
                      <h3>Manual Backup</h3>
                      <button 
                        className="btn-primary" 
                        onClick={handleCreateBackup}
                        disabled={backupsLoading}
                      >
                        {backupsLoading ? 'Creating Backup...' : 'Create Backup Now'}
                      </button>
                    </div>
                    
                    <div className="settings-group">
                      <h3>Available Backups</h3>
                      
                      {backupsLoading && <p>Loading backups...</p>}
                      
                      {!backupsLoading && backups.length === 0 && (
                        <p>No backups available.</p>
                      )}
                      
                      {!backupsLoading && backups.length > 0 && (
                        <table className="backups-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Size</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backups.map(backup => (
                              <tr key={backup.id}>
                                <td>{new Date(backup.date).toLocaleString()}</td>
                                <td>{(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                                <td>
                                  <button 
                                    className="btn-secondary"
                                    onClick={() => handleRestoreBackup(backup.id)}
                                    disabled={backupsLoading}
                                  >
                                    Restore
                                  </button>
                                  <button 
                                    className="btn-danger"
                                    onClick={() => handleDeleteBackup(backup.id)}
                                    disabled={backupsLoading}
                                    style={{ marginLeft: '8px' }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default Settings;