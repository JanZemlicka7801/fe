import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminStats, type AdminStats } from '../../services/adminService';

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth() as any;

  const name =
      user?.learner
          ? `${user.learner.firstName} ${user.learner.lastName}`
          : (user?.username || user?.email || 'Admin');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminStats(token)
        .then(setStats)
        .catch((e) => setError(e?.message || 'Failed to load stats'));
  }, [token]);

  return (
      <div className="page-container">

        <div className="admin-dashboard">
          <div className="admin-welcome">
            <h2>Welcome, {name}!</h2>
            <p>This is the admin dashboard where you can manage the driving school system.</p>
            {stats && (
                <p className="text-muted">
                  Week {stats.weekStart} to {stats.weekEnd}
                </p>
            )}
            {error && <p className="error-text">{error}</p>}
          </div>

          <div className="admin-stats">
            <div className="stats-card">
              <h3>Students</h3>
              <div className="stats-number">{stats?.students ?? '—'}</div>
              <p>Total registered students</p>
            </div>

            <div className="stats-card">
              <h3>Instructors</h3>
              <div className="stats-number">{stats?.instructors ?? '—'}</div>
              <p>Active driving instructors</p>
            </div>

            <div className="stats-card">
              <h3>Classes</h3>
              <div className="stats-number">{stats?.classesThisWeek ?? '—'}</div>
              <p>Scheduled this week</p>
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
        </div>
      </div>
  );
};

export default AdminDashboard;