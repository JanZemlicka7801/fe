import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from 'react-router-dom';

import Schedule from './pages/Schedule';
import Profile from './pages/Profile';
import Students from './pages/Students';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import FirstLogin from './pages/FirstLogin';
import ForgotPassword from './pages/ForgotPassword';

import './App.css';
import AuthEventListener from './components/AuthEventListener';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    const hideHeaderPaths = ['/auth', '/first-login', '/forgot-password'];

    const titles: Record<string, string> = {
        '/': 'Driving School Class Scheduler',
        '/profile': 'Profile',
        '/students': 'Students',
        '/admin': 'Admin Dashboard',
        '/admin/users': 'User Management',
    };

    const title = titles[location.pathname];

    return (
        <div className="app-container">
            {!hideHeaderPaths.includes(location.pathname) && <Sidebar />}
            <div className="main-content">
                {!hideHeaderPaths.includes(location.pathname) && title && (
                    <header className="App-header">
                        <h1>{title}</h1>
                    </header>
                )}
                {children}
            </div>
        </div>
    );
};

const FirstLoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <div className="loading">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    if (user?.validated) return <Navigate to="/" replace />;
    return <>{children}</>;
};

const ValidatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <div className="loading">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    if (!user?.validated) return <Navigate to="/first-login" replace />;
    return <>{children}</>;
};

function AppRoutes() {
    return (
        <>
            <AuthEventListener />

            <Routes>
                {/* Public */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* First login flow */}
                <Route
                    path="/first-login"
                    element={
                        <FirstLoginRoute>
                            <FirstLogin />
                        </FirstLoginRoute>
                    }
                />

                {/* Authenticated + validated */}
                <Route
                    path="/"
                    element={
                        <ValidatedRoute>
                            <Layout>
                                <Schedule />
                            </Layout>
                        </ValidatedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ValidatedRoute>
                            <Layout>
                                <Profile />
                            </Layout>
                        </ValidatedRoute>
                    }
                />

                {/* Optional alias: keep /schedule but canonicalize to "/" */}
                <Route path="/schedule" element={<Navigate to="/" replace />} />

                {/* Admin */}
                <Route
                    path="/students"
                    element={
                        <AdminRoute>
                            <Layout>
                                <Students />
                            </Layout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <Layout>
                                <AdminDashboard />
                            </Layout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <Layout>
                                <UserManagement />
                            </Layout>
                        </AdminRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

const App: React.FC = () => (
    <AuthProvider>
        <Router>
            <AppRoutes />
        </Router>
    </AuthProvider>
);

export default App;