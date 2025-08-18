import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>AutoSchool</h3>
      </div>
      <div className="sidebar-menu">
        {isAuthenticated && (
          <>
            {/* Common navigation for all authenticated users */}
            <Link to="/" className={`sidebar-item ${location.pathname === '/' ? 'active' : ''}`}>
              <span>Schedule</span>
            </Link>
            
            {/* User-specific navigation */}
            {!isAdmin && (
              <>
                <Link to="/students" className={`sidebar-item ${location.pathname === '/students' ? 'active' : ''}`}>
                  <span>Students</span>
                </Link>
                <Link to="/profile" className={`sidebar-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className={`sidebar-item ${location.pathname === '/settings' ? 'active' : ''}`}>
                  <span>Settings</span>
                </Link>
              </>
            )}
            
            {/* Admin-specific navigation */}
            {isAdmin && (
              <>
                <Link to="/admin" className={`sidebar-item ${location.pathname === '/admin' ? 'active' : ''}`}>
                  <span>Admin Dashboard</span>
                </Link>
                <Link to="/admin/users" className={`sidebar-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
                  <span>User Management</span>
                </Link>
                <Link to="/students" className={`sidebar-item ${location.pathname === '/students' ? 'active' : ''}`}>
                  <span>Students</span>
                </Link>
                <Link to="/profile" className={`sidebar-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className={`sidebar-item ${location.pathname === '/settings' ? 'active' : ''}`}>
                  <span>Settings</span>
                </Link>
              </>
            )}
          </>
        )}
        {!isAuthenticated ? (
          <>
            <Link to="/login" className="sidebar-item">
              <span>Login</span>
            </Link>
            <Link to="/register" className="sidebar-item">
              <span>Register</span>
            </Link>
          </>
        ) : (
          <>
            {/* Role indicator */}
            <div className={`sidebar-role-indicator ${isAdmin ? 'admin' : 'user'}`}>
              <span>Role: {isAdmin ? 'Administrator' : 'User'}</span>
            </div>
            
            <button onClick={handleLogout} className="sidebar-item logout-button">
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;