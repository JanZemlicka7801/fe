import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminStats, type AdminStats } from '../../services/adminService';
import {Link} from "react-router-dom";
import NotificationForm from "../../components/admin/NotificationForm";

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

          <div className="admin-stats">
            <div className="stats-card">
              <h3>Studenti</h3>
              <div className="stats-number">{stats?.students ?? '—'}</div>
              <p>Celkový počet uživatelů</p>
            </div>

            <div className="stats-card">
              <h3>Instrutoři</h3>
              <div className="stats-number">{stats?.instructors ?? '—'}</div>
              <p>Celkový počet instruktorů</p>
            </div>

            <div className="stats-card">
              <h3>Lekce</h3>
              <div className="stats-number">{stats?.classesThisWeek ?? '—'}</div>
              <p>Naplánováno na tento týden</p>
            </div>
          </div>

          <div className="admin-welcome">
            <h2>Vítejte, {name}!</h2>
            <p>Toto je adminova nástěnka, kde je možné pracovat s celkovým systémem.</p>
            {stats && (
                <p className="text-muted">
                  Aktuální týden od {stats.weekStart} do {stats.weekEnd}
                </p>
            )}
            {error && <p className="error-text">{error}</p>}
          </div>

          <NotificationForm />

          <div className="admin-actions">
            <h3>Rychlé pokyny</h3>
            <div className="action-buttons">
              <Link to="/students">
                <button className="btn-primary">Úprava studentů</button>
              </Link>
              <button className="btn-primary">Stažení reportů</button>
              <button className="btn-primary">Nastavení systému</button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminDashboard;