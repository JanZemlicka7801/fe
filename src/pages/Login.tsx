// src/pages/Login.tsx

import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 1. Komponenta musí přijímat onSwitch
interface LoginProps {
    onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
    const { login, error, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const validateForm = (): boolean => {
        // ... validace zůstává stejná
        const errors: any = {};
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Email is invalid';
        }
        if (!password) {
            errors.password = 'Password is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                // 2. Oprava chyby "void cannot be tested for truthiness"
                // Funkce login nic nevrací. Pokud projde, pokračuje kód dál.
                // Pokud selže, vyhodí chybu, kterou zachytí `catch`.
                await login(email, password);
                navigate('/');
            } catch (err) {
                // AuthContext již nastavuje chybovou hlášku,
                // takže zde můžeme chybu jen zalogovat pro ladění.
                console.error("Login attempt failed:", err);
            }
        }
    };

    return (
        <>
            <div className="auth-header">
                <h2>Login</h2>
                <p>Welcome back! Please login to your account.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {/* Zbytek formuláře zůstává stejný */}
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formErrors.email ? 'input-error' : ''} disabled={authLoading} />
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={formErrors.password ? 'input-error' : ''} disabled={authLoading} />
                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-primary btn-block" disabled={authLoading}>
                        {authLoading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </form>
            <div className="auth-footer">
                <p>
                    Don't have an account?{' '}
                    {/* 3. Použijeme onSwitch pro přepnutí */}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>
                        Register
                    </a>
                </p>
            </div>
        </>
    );
};

export default Login;