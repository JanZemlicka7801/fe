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
                <h3>AutoAba</h3>
            </div>
            <div className="sidebar-menu">
                {isAuthenticated && (
                    <>
                        <Link to="/" className={`sidebar-item ${location.pathname === '/' ? 'active' : ''}`}>
                            <span>Přehled</span>
                        </Link>

                        {!isAdmin && (
                            <>
                                <Link to="/students" className={`sidebar-item ${location.pathname === '/students' ? 'active' : ''}`}>
                                    <span>Studenti</span>
                                </Link>
                                <Link to="/profile" className={`sidebar-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                                    <span>Profil</span>
                                </Link>
                                <Link to="/settings" className={`sidebar-item ${location.pathname === '/settings' ? 'active' : ''}`}>
                                    <span>Nastavení</span>
                                </Link>
                            </>
                        )}

                        {isAdmin && (
                            <>
                                <Link to="/admin" className={`sidebar-item ${location.pathname === '/admin' ? 'active' : ''}`}>
                                    <span>Adminova nástěnka</span>
                                </Link>
                                <Link to="/students" className={`sidebar-item ${location.pathname === '/students' ? 'active' : ''}`}>
                                    <span>Studenti</span>
                                </Link>
                                <Link to="/profile" className={`sidebar-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                                    <span>Profil</span>
                                </Link>
                                <Link to="/settings" className={`sidebar-item ${location.pathname === '/settings' ? 'active' : ''}`}>
                                    <span>Nastavení</span>
                                </Link>
                            </>
                        )}
                    </>
                )}

                {!isAuthenticated ? (
                    <>
                        <Link to="/login" className="sidebar-item">
                            <span>Přihlásit se</span>
                        </Link>
                        <Link to="/register" className="sidebar-item">
                            <span>Registrovat</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <div className={`sidebar-role-indicator ${isAdmin ? 'admin' : 'user'}`}>
                            <span>Role: {isAdmin ? 'Administrátor' : 'Uživatel'}</span>
                        </div>
                        <button onClick={handleLogout} className="sidebar-item logout-button">
                            <span>Odhlásit se</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;