import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications'|'appearance'|'advanced'|'system'|'users'|'backup'>('appearance');

  // theme
  const { theme, resolved, setTheme } = useTheme();
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme);

  useEffect(() => { setPendingTheme(theme); }, [theme]);

  // demo persistence for notifications (local only)
  const [emailBookings, setEmailBookings] = useState(true);
  const [emailCancels, setEmailCancels] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("notify");
    if (raw) {
      try {
        const n = JSON.parse(raw);
        setEmailBookings(!!n.emailBookings);
        setEmailCancels(!!n.emailCancels);
        setEmailReminders(!!n.emailReminders);
      } catch {}
    }
  }, []);
  function saveNotifications(){
    localStorage.setItem("notify", JSON.stringify({ emailBookings, emailCancels, emailReminders }));
  }

  return (
      <div className="page-container">
        <h1 className="page-title">Settings</h1>

        {isAdmin ? (
            <div className="role-indicator admin"><span>Administrator Settings - System Configuration Access</span></div>
        ) : (
            <div className="role-indicator user"><span>User Settings - Personal Configuration</span></div>
        )}

        <div className="settings-container">
          <div className="settings-sidebar">
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
                      <input type="checkbox" checked={emailBookings} onChange={e=>setEmailBookings(e.target.checked)} />
                      <span>New Bookings</span>
                    </label>
                    <label className="settings-item checkbox">
                      <input type="checkbox" checked={emailCancels} onChange={e=>setEmailCancels(e.target.checked)} />
                      <span>Cancellations</span>
                    </label>
                    <label className="settings-item checkbox">
                      <input type="checkbox" checked={emailReminders} onChange={e=>setEmailReminders(e.target.checked)} />
                      <span>Lesson Reminders</span>
                    </label>
                  </div>
                  <div className="settings-actions">
                    <button className="btn-primary" onClick={saveNotifications}>Save Changes</button>
                    <button className="btn-secondary" onClick={()=>window.location.reload()}>Cancel</button>
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
                        />
                        <div className="theme-preview system"></div>
                        <span>System</span>
                      </label>
                    </div>
                    <p className="settings-help">Current applied: <strong>{resolved}</strong></p>
                  </div>
                  <div className="settings-actions">
                    <button className="btn-primary" onClick={()=>setTheme(pendingTheme)}>Apply</button>
                    <button className="btn-secondary" onClick={()=>setPendingTheme(theme)}>Reset</button>
                  </div>
                </div>
            )}

            {activeTab === 'advanced' && (
                <div className="settings-panel">
                  <h2>Advanced</h2>
                  <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify({theme, resolved}))}>
                    Copy current theme info
                  </button>
                </div>
            )}

            {isAdmin && activeTab === 'system' && (
                <div className="settings-panel">
                  <h2>System Configuration</h2>
                  <p className="text-muted">Stub. Wire to admin API later.</p>
                </div>
            )}
            {isAdmin && activeTab === 'users' && (
                <div className="settings-panel">
                  <h2>User Management Settings</h2>
                  <p className="text-muted">Stub. Use the dedicated Users page for real actions.</p>
                </div>
            )}
            {isAdmin && activeTab === 'backup' && (
                <div className="settings-panel">
                  <h2>Backup & Restore</h2>
                  <p className="text-muted">Stub. No backend connected.</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Settings;