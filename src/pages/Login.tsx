import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

interface LoginProps {
    onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState<{
        email?: string;
        password?: string;
    }>({});
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, error, setError, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    // Clear form errors when user starts typing
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        // Clear email-related errors
        setFormErrors(prev => ({ ...prev, email: undefined }));
        // Clear auth errors when user modifies input
        if (error) setError(null);
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        // Clear password-related errors
        setFormErrors(prev => ({ ...prev, password: undefined }));
        // Clear auth errors when user modifies input
        if (error) setError(null);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        const fn = (e as any)?.getModifierState;
        if (typeof fn === 'function') setCapsLockOn(fn.call(e, 'CapsLock'));
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('keyup', handleKeyPress);
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keyup', handleKeyPress);
        };
    }, [handleKeyPress]);

    const validateForm = (): boolean => {
        const errors: any = {};
        
        // Email validation with more detailed feedback
        if (!email) {
            errors.email = 'Email je povinný';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Zadejte platný email (např. jmeno@domena.cz)';
        }
        
        // Password validation with more detailed feedback
        if (!password) {
            errors.password = 'Heslo je povinné';
        } else if (password.length < 6) {
            errors.password = 'Heslo musí mít alespoň 6 znaků';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const u = await login(email, password);
                if (u) {
                    if (!u.validated) {
                        navigate('/first-login');
                    } else {
                        navigate('/schedule');
                    }
                }
            } catch (err) {
                console.error('Login attempt failed:', err);
            }
        }
    };

    return (
        <>
            <div className="auth-header">
                <h2>Přihlášení</h2>
                <p>Ahoj vítej zpět! Prosím přihlaš se.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                {/* Display authentication errors with improved styling */}
                {error && (
                    <div className="auth-error" role="alert">
                        <div className="auth-error-icon">⚠️</div>
                        <div className="auth-error-message">{error}</div>
                    </div>
                )}
                
                {/* Email field with improved error handling */}
                <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                        <input 
                            type="email" 
                            id="email" 
                            value={email} 
                            onChange={handleEmailChange} 
                            autoComplete="email" 
                            className={formErrors.email ? 'input-error' : ''} 
                            disabled={authLoading} 
                            placeholder="jmeno@domena.cz"
                        />
                        {formErrors.email && <div className="input-icon error-icon">!</div>}
                    </div>
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                </div>
                
                {/* Password field with visibility toggle and caps lock warning */}
                <div className={`form-group ${formErrors.password ? 'has-error' : ''}`}>
                    <label htmlFor="password">Heslo</label>
                    <div className="input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={handlePasswordChange}
                            className={formErrors.password ? 'input-error' : ''}
                            disabled={authLoading}
                        />
                        {formErrors.password && <div className="input-icon error-icon">!</div>}
                    </div>
                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                    {capsLockOn && <div className="caps-lock-warning">Caps Lock je zapnutý</div>}
                </div>
                
                {/* Password recovery link */}
                <div className="forgot-password">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Funkce obnovení hesla bude brzy k dispozici.'); }}>
                        Zapomněli jste heslo?
                    </a>
                </div>
                
                {/* Login button with improved loading state */}
                <div className="form-actions">
                    <button 
                        type="submit" 
                        className={`btn-primary btn-block ${authLoading ? 'loading' : ''}`} 
                        disabled={authLoading}
                    >
                        {authLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                <span>Přihlašuji...</span>
                            </>
                        ) : 'Přihlásit se'}
                    </button>
                </div>
            </form>
            <div className="auth-footer">
            </div>
        </>
    );
};

export default Login;