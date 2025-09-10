import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation
} from 'react-router-dom';

import Schedule from './pages/Schedule';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Students from './pages/Students';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import FirstLogin from './pages/FirstLogin';

import './App.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    const hideHeaderPaths = ['/auth'];

    return (
        <div className="app-container">
            {!hideHeaderPaths.includes(location.pathname) && <Sidebar />}
            <div className="main-content">
                {!hideHeaderPaths.includes(location.pathname) && (
                    <header className="App-header">
                        <h1>
                            {location.pathname === '/' && 'Driving School Class Scheduler'}
                            {location.pathname === '/profile' && 'Profile'}
                            {location.pathname === '/settings' && 'Settings'}
                            {location.pathname === '/students' && 'Students'}
                            {location.pathname === '/admin' && 'Admin Dashboard'}
                            {location.pathname === '/admin/users' && 'User Management'}
                        </h1>
                    </header>
                )}
                {children}
            </div>
        </div>
    );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <div className="loading">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/auth" replace />;

    return <>{children}</>;
};

const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <div className="loading">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/auth" replace />;

    const allowed: Array<'LEARNER' | 'INSTRUCTOR' | 'ADMIN'> = ['LEARNER','INSTRUCTOR','ADMIN'];
    if (!user || !allowed.includes(user.role)) return <Navigate to="/auth" replace />;

    return <>{children}</>;
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
        <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/first-login" element={
                <FirstLoginRoute>
                    <FirstLogin />
                </FirstLoginRoute>
            } />
            <Route path="/schedule" element={<ValidatedRoute><Layout><Schedule /></Layout></ValidatedRoute>} />
            <Route path="/profile" element={<ValidatedRoute><Layout><Profile /></Layout></ValidatedRoute>} />
            <Route path="/settings" element={<ValidatedRoute><Layout><Settings /></Layout></ValidatedRoute>} />
            <Route path="/students" element={<AdminRoute><Layout><Students /></Layout></AdminRoute>} />
            <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><Layout><UserManagement /></Layout></AdminRoute>} />
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
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