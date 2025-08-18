// App.tsx

import React, { useState } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation
} from 'react-router-dom';

import Schedule from './Schedule';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Students from './pages/Students';
import AuthPage from './pages/AuthPage'; // Imported as requested
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminRoute from './components/AdminRoute';

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
                            {location.pathname === '/profile' && 'Profile'}
                            {location.pathname === '/settings' && 'Settings'}
                            {location.pathname === '/students' && 'Students'}
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
    // Redirect to /auth instead of /login
    if (!isAuthenticated) return <Navigate to="/auth" replace />;

    return <>{children}</>;
};

function App() {
    const [bookings, setBookings] = useState({});

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public route for authentication */}
                    <Route path="/auth" element={<AuthPage />} />

                    {/* Protected routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <header className="App-header">
                                        <h1>Driving School Class Scheduler</h1>
                                    </header>
                                    <main className="container">
                                        <Schedule bookings={bookings} setBookings={setBookings} />
                                    </main>
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Layout><Profile /></Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Layout><Settings /></Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/students"
                        element={
                            <ProtectedRoute>
                                <Layout><Students /></Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <Layout><AdminDashboard /></Layout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <AdminRoute>
                                <Layout><UserManagement /></Layout>
                            </AdminRoute>
                        }
                    />
                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;